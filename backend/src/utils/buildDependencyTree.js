const unzipper = require('unzipper');
const axios = require('axios');
const FunctionParser = require('../parsers/functionParser');
const EndpointParser = require('../parsers/endpointParser');
const LanguageDetector = require('../parsers/languageDetector');
const CallGraphBuilder = require('../engines/callGraphBuilder');
const AnalysisResult = require('../models/AnalysisResult');
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

    const tree = { name: repo, type: 'folder', children: [] };
    const functions = [];
    const endpoints = [];
    const filesData = {}; // Store file content temporarily

    return new Promise((resolve, reject) => {
        response.data
            .pipe(unzipper.Parse())
            .on('entry', async (entry) => {
                const pathSegments = entry.path.split('/');
                pathSegments.shift(); 

                if (pathSegments.length === 0 || pathSegments[0] === '') {
                    entry.autodrain();
                    return;
                }

                const fullPath = pathSegments.join('/');
                const isFile = !entry.type.includes('Directory');
                
                addTree(tree, pathSegments, isFile ? 'file' : 'folder', []);

                // Parse file content if it's a code file
                if (isFile) {
                    const language = LanguageDetector.detectLanguage(entry.path);
                    
                    if (language !== 'unknown') {
                        let fileContent = '';
                        
                        entry.on('data', (chunk) => {
                            fileContent += chunk.toString();
                        });

                        entry.on('end', () => {
                            try {
                                // Parse functions
                                const fileFunctions = FunctionParser.parseFunctions(fileContent, language, fullPath);
                                functions.push(...fileFunctions);

                                // Parse endpoints
                                const fileEndpoints = EndpointParser.parseEndpoints(fileContent, language, fullPath);
                                endpoints.push(...fileEndpoints);
                            } catch (parseErr) {
                                console.warn(`Error parsing ${fullPath}:`, parseErr.message);
                            }
                        });
                    } else {
                        entry.autodrain();
                    }
                } else {
                    entry.autodrain();
                }
            })
            .on('finish', () => {
                try {
                    // Build call graph (with minimal data - frontend will enrich)
                    const callGraph = CallGraphBuilder.buildCallGraph(functions);

                    // Create analysis result
                    const result = new AnalysisResult({
                        tree: tree,
                        traceability: {
                            functions: functions.map(f => f.toJSON()),
                            callGraph: callGraph.toJSON(),
                            metadata: {
                                totalFunctions: functions.length,
                                parsedLanguages: [...new Set(functions.map(f => f.language || 'unknown'))]
                            }
                        },
                        apiEndpoints: {
                            endpoints: endpoints.map(e => e.toJSON()),
                            metadata: {
                                totalEndpoints: endpoints.length,
                                methods: calculateMethodCounts(endpoints),
                                frameworks: [...new Set(endpoints.map(e => e.framework).filter(Boolean))]
                            }
                        }
                    });

                    resolve(result.toJSON());
                } catch (err) {
                    reject(new Error(`Error building analysis result: ${err.message}`));
                }
            })
            .on('error', (err) => reject(new Error(`Zip parse error: ${err.message}`)));
    });
}

function calculateMethodCounts(endpoints) {
    const counts = { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0 };
    endpoints.forEach(ep => {
        if (counts.hasOwnProperty(ep.method)) {
            counts[ep.method]++;
        }
    });
    return counts;
}

function addTree(tree, pathSegments, type) {
    let current = tree;
    for (let i = 0; i < pathSegments.length; i++) {
        const seg = pathSegments[i];
        if (!seg) continue;

        const isLast = i === pathSegments.length - 1;

        let existingChild = current.children.find(child => child.name === seg);
        if (!existingChild) {
            existingChild = {
                name: seg,
                type: isLast ? type : 'folder',
                ...(!isLast && { children: [] }),
            };
            current.children.push(existingChild);
        }
        current = existingChild;
    }
}

module.exports = { BuildDependencyTree };