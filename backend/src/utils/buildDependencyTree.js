const unzipper = require('unzipper');
const axios = require('axios');
const FunctionParser = require('../parsers/functionParser');
const EndpointParser = require('../parsers/endpointParser');
const LanguageDetector = require('../parsers/languageDetector');
const ImportDetector = require('../parsers/importDetector');
const CallGraphBuilder = require('../engines/callGraphBuilder');
const FunctionNode = require('../models/FunctionNode');
const EndpointNode = require('../models/EndpointNode');

async function getDefaultBranch(username, repo) {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${username}/${repo}`,
            { headers: { 'User-Agent': 'CodeBase_Cipher'}}
        );
        return response.data.default_branch || 'main';
    } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            throw new Error(`Repository "${username}/${repo}" not found. Check the username and repo name.`);
        }
        if (status === 403 || status === 429) {
            const resetAt = err?.response?.headers?.['x-ratelimit-reset'];
            const resetTime = resetAt ? new Date(resetAt * 1000).toLocaleTimeString() : 'soon';
            throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime}. Set a GITHUB_TOKEN in .env to increase limits.`);
        }
        console.warn('Branch fetch failed, using main');
        return 'main';
    }
}

async function BuildDependencyTree(username, repo) {

    const branch = await getDefaultBranch(username, repo);
    const url = `https://github.com/${username}/${repo}/zipball/${branch}/`;

    let response;
    try {
        response = await axios({
            method: 'get',
            url,
            responseType: 'stream',
            maxRedirects: 5,          
            headers: {'User-Agent': 'CodeBase_Cipher'},
        });
    } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            throw new Error(`Could not download "${repo}" (branch: ${branch}). The repo may be empty or the branch does not exist.`);
        }
        if (status === 403 || status === 429) {
            throw new Error(`GitHub rate limit exceeded while downloading. Add a GITHUB_TOKEN to your .env file.`);
        }
        throw new Error(`Failed to fetch repository: ${err.message}`);
    }

    const tree = { 
        id: 'root',
        name: repo, 
        type: 'folder', 
        path: '/',
        children: [] 
    };
    
    const functions = [];
    const endpoints = [];
    const fileMap = new Map(); // Map to store file nodes with their content
    const parsePromises = [];
    const frameworks = new Set();
    let totalImports = 0;

    return new Promise((resolve, reject) => {
        response.data
            .pipe(unzipper.Parse())
            .on('entry', (entry) => {
                const pathSegments = entry.path.split('/');
                pathSegments.shift(); // Remove root folder name

                if (pathSegments.length === 0 || pathSegments[0] === '') {
                    entry.autodrain();
                    return;
                }

                const fullPath = pathSegments.join('/');
                const isFile = !entry.type.includes('Directory');
                
                // Parse file content if it's a code file
                if (isFile) {
                    const language = LanguageDetector.detectLanguage(entry.path);
                    
                    if (language !== 'unknown') {
                        let fileContent = '';
                        
                        entry.on('data', (chunk) => {
                            fileContent += chunk.toString();
                        });

                        // Create async parse promise
                        const parsePromise = new Promise((resolveFile) => {
                            entry.on('end', async () => {
                                try {
                                    // Detect imports
                                    const imports = ImportDetector.detectImports(fileContent, language);
                                    totalImports += imports.length;
                                    
                                    // Detect file role
                                    const role = ImportDetector.detectFileRole(fullPath, fileContent);

                                    // Parse functions
                                    const fileFunctions = await FunctionParser.parseFunctions(fileContent, language, fullPath);
                                    
                                    // Set proper IDs and language for functions
                                    fileFunctions.forEach(func => {
                                        func.id = `${fullPath}#${func.name}`;
                                        func.file = fullPath;
                                        func.language = language;
                                    });
                                    
                                    functions.push(...fileFunctions);

                                    // Parse endpoints
                                    const fileEndpoints = await EndpointParser.parseEndpoints(fileContent, language, fullPath);
                                    
                                    // Set proper IDs and handler references
                                    fileEndpoints.forEach(endpoint => {
                                        endpoint.id = `${endpoint.method}:${endpoint.path}`;
                                        endpoint.handlerFile = fullPath;
                                        endpoint.handlerFunctionId = fileFunctions.length > 0 ? fileFunctions[0].id : '';
                                    });
                                    
                                    endpoints.push(...fileEndpoints);
                                    
                                    // Detect frameworks
                                    const endpointFrameworks = fileEndpoints.map(e => e.framework).filter(Boolean);
                                    endpointFrameworks.forEach(fw => frameworks.add(fw));

                                    // Store file info for tree building
                                    fileMap.set(fullPath, {
                                        language,
                                        role,
                                        imports,
                                        code: fileContent,
                                        functions: fileFunctions.map(f => f.toJSON())
                                    });

                                    resolveFile();
                                } catch (parseErr) {
                                    console.warn(`Error parsing ${fullPath}:`, parseErr.message);
                                    resolveFile();
                                }
                            });
                        });

                        parsePromises.push(parsePromise);
                    } else {
                        entry.autodrain();
                    }
                } else {
                    entry.autodrain();
                }
            })
            .on('finish', async () => {
                try {
                    // Wait for all parse operations to complete
                    await Promise.all(parsePromises);

                    // Build tree with embedded functions and imports
                    buildTreeWithFiles(tree, fileMap);

                    // Build call graph
                    const callGraph = CallGraphBuilder.buildCallGraph(functions);

                    // Create new response format
                    const result = {
                        repository: {
                            name: repo,
                            frameworks: [...frameworks]
                        },
                        tree: tree,
                        traceability: {
                            functions: functions.map(f => typeof f.toJSON === 'function' ? f.toJSON() : f),
                            callGraph: callGraph.toJSON(),
                            metadata: callGraph.metadata
                        },
                        apiEndpoints: endpoints.map(e => typeof e.toJSON === 'function' ? e.toJSON() : e),
                        metadata: {
                            totalFiles: fileMap.size,
                            totalFunctions: functions.length,
                            totalImports: totalImports,
                            totalEndpoints: endpoints.length
                        }
                    };

                    resolve(result);
                } catch (err) {
                    reject(new Error(`Error building analysis result: ${err.message}`));
                }
            })
            .on('error', (err) => reject(new Error(`Zip parse error: ${err.message}`)));
    });
}

function buildTreeWithFiles(tree, fileMap) {
    // Build tree structure from file map
    fileMap.forEach((fileInfo, filePath) => {
        const pathSegments = filePath.split('/');
        addTreeNode(tree, pathSegments, fileInfo);
    });
}

function addTreeNode(tree, pathSegments, fileInfo) {
    let current = tree;
    
    for (let i = 0; i < pathSegments.length; i++) {
        const seg = pathSegments[i];
        if (!seg) continue;

        const isLast = i === pathSegments.length - 1;
        const fullPath = pathSegments.slice(0, i + 1).join('/');

        let existingChild = current.children.find(child => child.name === seg);
        
        if (!existingChild) {
            if (isLast) {
                // File node
                existingChild = {
                    id: fullPath,
                    name: seg,
                    type: 'file',
                    path: fullPath,
                    language: fileInfo.language,
                    role: fileInfo.role,
                    imports: fileInfo.imports,
                    code: fileInfo.code,
                    functions: fileInfo.functions
                };
            } else {
                // Folder node
                existingChild = {
                    id: fullPath,
                    name: seg,
                    type: 'folder',
                    path: fullPath,
                    children: []
                };
            }
            current.children.push(existingChild);
        }
        
        if (!isLast) {
            if (!existingChild.children) {
                existingChild.children = [];
            }
            current = existingChild;
        }
    }
}

module.exports = { BuildDependencyTree };