function resolveRelativePath(currentPath, importPath) {

    if (!importPath.startsWith('.')) return importPath;

    const currentSegments = currentPath.split('/');
    currentSegments.pop();  // Remove the filename to get the directory path

    const importSegments = importPath.split('/');
    importSegments.shift(); // remove the initial '.'

    let i = 0;
    while (i < importSegments.length && (importSegments[i] === '.' || importSegments[i] === '..')) {
        if (importSegments[i] === '..') {
            currentSegments.pop();
        }
        i++;
    }
    const remainingSegments = importSegments.slice(i);
    return currentSegments.join('/') + '/' + remainingSegments.join('/');
}

export default resolveRelativePath