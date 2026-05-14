import React from "react";
import {
    ReactFlow,
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import dependencyBuild from "../../utils/dependencyBuild";


function DependencyGraph({repoData}){
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const {nodes:depGraphNodes, edges:depGraphEdges} = dependencyBuild(repoData);
    
    
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={depGraphNodes}
                edges={depGraphEdges}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={edgeOptions}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.05}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant="dots" gap={20} size={1} color="#e2e8f0" />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
}
export default DependencyGraph; 