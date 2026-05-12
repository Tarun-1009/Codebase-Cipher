function extractDependencies(fileContent, pathSegments) {
    if (!pathSegments || pathSegments.length === 0) return [];

    const fileName = pathSegments[pathSegments.length - 1];
    const dependencies = [];

    if (fileName.endsWith('.js') || fileName.endsWith('.jsx') || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
        const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
        const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        let match;

        while ((match = importRegex.exec(fileContent)) !== null) {
            dependencies.push(match[1]);
        }
        while ((match = requireRegex.exec(fileContent)) !== null) {
            dependencies.push(match[1]);
        }
    } else if (fileName.endsWith('.py')) {
        const importRegex = /^\s*import\s+([^#\n]+)/gm;
        const fromImportRegex = /^\s*from\s+([^ \n]+)\s+import/gm;
        let match;

        while ((match = importRegex.exec(fileContent)) !== null) {
            match[1].split(',').forEach(dep => {
                const cleanDep = dep.trim().split(/\s+as\s+/)[0]; // Remove 'as ...'
                dependencies.push(cleanDep);
            });
        }
        while ((match = fromImportRegex.exec(fileContent)) !== null) {
            dependencies.push(match[1].trim());
        }
    } else if (fileName.endsWith('.java')) {
        const importRegex = /^\s*import\s+(?:static\s+)?([^;\n]+);/gm;
        let match;

        while ((match = importRegex.exec(fileContent)) !== null) {
            dependencies.push(match[1].trim());
        }
    } else if (fileName.endsWith('.html')) {
        const scriptRegex = /<script[^>]+src=['"]([^'"]+)['"]/g;
        const linkRegex = /<link[^>]+href=['"]([^'"]+)['"]/g;
        let match;

        while ((match = scriptRegex.exec(fileContent)) !== null) {
            dependencies.push(match[1]);
        }
        while ((match = linkRegex.exec(fileContent)) !== null) {
            dependencies.push(match[1]);
        }
    }

    return [...new Set(dependencies)].filter(Boolean);
}

module.exports = { extractDependencies };
