import resolveRelativePath from "./resolveRelativePath";

function dependencyBuild(repoData) {
    const nodes = {};
    const edges = [];
    
    const traversal = (node, nodePath) => {
        const isFolder = node.children && node.children.length > 0;
        const filePath = nodePath ? `${nodePath}/${node.name}` : node.name;
        const nodeId = filePath;

        if (!isFolder) {
            if (!nodes[nodeId]) {
                nodes[nodeId] = {
                    id: nodeId,
                    type: 'file',
                    data: {
                        label: node.name,
                        path: filePath,
                    },
                    position: { x: 0, y: 0 },
                };
            }

            const deps = node.imports || node.dependencies;
            if (deps) {
                deps.forEach(dependency => {
                    const absolutePath = resolveRelativePath(filePath, dependency);
                    const edgeId = `${nodeId}__${absolutePath}`;
                    edges.push({
                        id: edgeId,
                        source: nodeId,
                        target: absolutePath,
                    });
                });
            }
        } else if (node.children) {
            node.children.forEach(child => {
                traversal(child, filePath);
            });
        }
    };

    if (repoData) {
        traversal(repoData);
    }

    const resolveTargetNode = (targetPath) => {
        if (nodes[targetPath]) return targetPath;
        const extensions = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '.css'];
        for (let ext of extensions) {
            if (nodes[targetPath + ext]) return targetPath + ext;
        }
        return null;
    };

    const validEdges = [];
    
    edges.forEach(edge => {
        if (!nodes[edge.source]) return;
        
        let targetId = resolveTargetNode(edge.target);
        let isExternal = false;
        
        if (!targetId) {
            isExternal = true;
            targetId = edge.target; 
            
            if (!nodes[targetId]) {
                nodes[targetId] = {
                    id: targetId,
                    type: 'external',
                    data: {
                        label: targetId,
                        path: '/node_modules',
                    },
                    position: { x: 0, y: 0 },
                };
            }
        }
        
        validEdges.push({
            id: edge.id,
            source: edge.source,
            target: targetId,
            type: 'default', 
            animated: isExternal, 
            markerEnd: { 
                type: 'arrowclosed', 
                width: 15, 
                height: 15, 
                color: '#3b82f6' 
            },
            style: {
                stroke: '#3b82f6', 
                strokeWidth: 1.5, 
                strokeDasharray: 'none', 
                opacity: 0.8 
            },
        });
    });

    return { nodes: Object.values(nodes), edges: validEdges };
}

export default dependencyBuild;