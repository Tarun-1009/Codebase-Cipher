import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import flattenTree from '../../utils/treeFlattener';
import { useState, useEffect } from 'react';




function Tree({repoData}){
    const [nodes,setNodes] = useState([]);
    const [edges,setEdges] = useState([]);


    useEffect(()=>{
        const result=flattenTree(repoData);
        setNodes(result.nodes);
        setEdges(result.edges);
    },[repoData])

    return(
        <div style={{ width: '100%', height: '100vh' }}>
            <ReactFlow nodes={nodes} edges={edges}>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    )
}
export default Tree;