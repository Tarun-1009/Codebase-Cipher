function flattenTree(root) {
    const nodes = [];
    const edges = [];

    const traverse = (node) => {
        const isFolder = node.children && node.children.length > 0;
        const newNode = {
            id: node.path,
            type: isFolder ? 'folder' : 'file',
            data: {
                label: node.name,
                path: node.path,
            },
            position: { x: 0, y: 0 },
        };
        nodes.push(newNode);

        if (node.children) {
            node.children.forEach(child => {
                edges.push({
                    id: `${node.path}=>${child.path}`,
                    source: node.path,
                    target: child.path,
                });
                traverse(child);
            });
        }
    };

    traverse(root);
    return { nodes, edges };
}

export default flattenTree;