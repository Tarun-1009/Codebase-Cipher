import resolveRelativePath from "./resolveRelativePath";
function dependencyBuild(repoData) {
    const nodes = {}
    const edges = []
    const traversal = (node, nodePath) => {

        const isFolder = node.children && node.children.length > 0;
        const filePath = nodePath ? `${nodePath}/${node.name}` : node.name;
        const nodeId = filePath;

        if (!nodes[nodeId]) {
            nodes[nodeId] = {
                id: nodeId,
                type: isFolder ? 'folder' : 'file',
                data: {
                    label: node.name,
                    path: filePath,
                    childCount: isFolder ? node.children.length : (node.dependencies ? node.dependencies.length : 0)
                },
                position: { x: 0, y: 0 },
            };
        }

        // Only add edges for files (not folders)
        if (!isFolder && node.dependencies) {
            node.dependencies.forEach(dependency => {
                const absolutePath = resolveRelativePath(filePath, dependency);
                const edgeId = `${nodeId}__${absolutePath}`;
                edges.push({
                    id: edgeId,
                    source: nodeId,
                    target: absolutePath,
                    type: 'straight',
                    animated: true,
                    markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
                    style: {
                        stroke: '#3b82f6',
                        strokeWidth: 2,
                        opacity: 0.6 // Making lines slightly transparent reduces "visual noise"
                    },
                });
            });
        }

        // Recurse into subfolders
        if (isFolder && node.children) {
            node.children.forEach(child => {
                const childPath = filePath + '/' + child.name;
                const edgeId = `${nodeId}__${childPath}`;
                edges.push({
                    id: edgeId,
                    source: nodeId,
                    target: childPath,
                    type: 'straight',
                    animated: true,
                    markerEnd: { type: 'arrowclosed', color: '#94a3b8' },
                    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                });
                traversal(child, filePath);
            });
        }
    }
    if (repoData) {
        traversal(repoData);
    }

    const validEdges = edges.filter(edge => nodes[edge.source] && nodes[edge.target]);

    return { nodes: Object.values(nodes), edges: validEdges }
}
export default dependencyBuild;