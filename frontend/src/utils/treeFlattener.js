function flattenTree(root){
    const nodes=[];
    const edges=[];
    const traverse=(node)=>{
    const newNode={
        id : node.path,
        type: node.type || 'default',
        data:{
            label:node.name
        },
        position: { x: nodes.length * 50,y:nodes.length * 50 }
    };
    nodes.push(newNode);

    if(node.children){
        node.children.forEach(child=>{
            edges.push({
                id:`${node.path}=>${child.path}`,
                source:node.path,
                target:child.path
            })
            traverse(child);
        });
    }
} 
    traverse(root);
    return {nodes,edges}
}

export default flattenTree;