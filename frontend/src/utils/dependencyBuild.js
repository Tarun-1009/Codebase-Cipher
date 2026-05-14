import { resolveRelativePath } from "./resolveRelativePath";
function dependencyBuild(repoData) {
    const nodes={}
    const edges=[]
    const traversal = (node,nodePath) => {

        const isFolder = node.children && node.children.length > 0;
        const filePath = nodePath ? `${nodePath}/${node.name}` : node.name;
        const nodeId = filePath;

        if (!nodes[nodeId]) {
            nodes[nodeId] = {
                id: nodeId,
                data: {
                    label: node.name,
                    path: filePath,
                },
                position: { x: 0, y: 0 },
            };
        }

        // Only add edges for files (not folders)
        if (!isFolder) {
            node.dependencies.forEach(dependency => {
                const absolutePath = resolveRelativePath(filePath, dependency);
                const edgeId = `${nodeId}__${absolutePath}`;
                    edges.push({
                        id: edgeId,
                        source: nodeId,
                        target: absolutePath,
                        type: 'smoothstep',
                        animated: false,
                        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
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
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                });
                traversal(child, filePath);
            });
        }
    }
    return {nodes,edges}
}
export default dependencyBuild;