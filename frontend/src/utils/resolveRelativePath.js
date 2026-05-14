function resolveRelativePath(currentPath, importPath, allProjectFilePaths = new Set()) {
    if (!importPath.startsWith('.')) return importPath;

    const currentSegments = currentPath.split('/');
    currentSegments.pop(); // Remove filename to get directory path

    const importSegments = importPath.split('/');

    let i = 0;
    while (i < importSegments.length) {
        const segment = importSegments[i];
        
        if (segment === '.' || segment === '') {
            i++;
        } else if (segment === '..') {
            currentSegments.pop();
            i++;
        } else {
            break;
        }
    }

    const remainingSegments = importSegments.slice(i);
    
    const baseResolvedPath = currentSegments.length > 0 
        ? `${currentSegments.join('/')}/${remainingSegments.join('/')}`
        : remainingSegments.join('/');

    if (allProjectFilePaths.has(baseResolvedPath)) {
        return baseResolvedPath;
    }

    const commonExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css'];
    for (const ext of commonExtensions) {
        const pathWithExt = `${baseResolvedPath}${ext}`;
        if (allProjectFilePaths.has(pathWithExt)) {
            return pathWithExt;
        }
    }

    return baseResolvedPath;
}

export default resolveRelativePath;