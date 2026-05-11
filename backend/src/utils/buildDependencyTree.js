const unzipper = require('unzipper');
const axios = require('axios');

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

    return new Promise((resolve, reject) => {
        response.data
            .pipe(unzipper.Parse())
            .on('entry', (entry) => {
                const pathSegments = entry.path.split('/');
                pathSegments.shift(); 

                if (pathSegments.length === 0 || pathSegments[0] === '') {
                    entry.autodrain();
                    return;
                }

                addTree(tree, pathSegments, 'file', []);
                entry.autodrain();
            })
            .on('finish', () => resolve(tree))
            .on('error', (err) => reject(new Error(`Zip parse error: ${err.message}`)));
    });
}

function addTree(tree, pathSegments, type, dependency) {
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
            if (isLast && type === 'file') {
                existingChild.dependencies = dependency;
            }
            current.children.push(existingChild);
        }
        current = existingChild;
    }
}

module.exports = { BuildDependencyTree };