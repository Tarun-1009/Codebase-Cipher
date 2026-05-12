import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import flattenTree from '../../utils/treeFlattener';
import { useState, useEffect } from 'react';
import getLayoutedElements from '../../utils/nodePosition';




function Tree({repoData}){
    const [nodes,setNodes] = useState([]);
    const [edges,setEdges] = useState([]);


    useEffect(()=>{
        if (!repoData) return;

        const result=flattenTree(repoData);
        const layouted=getLayoutedElements(result.nodes,result.edges,'TB');
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
    },[repoData])

    return(
        <div style={{ width: '100%', height: '100vh' }}>
            <ReactFlow nodes={nodes} edges={edges} fitView>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    )
}
export default Tree;