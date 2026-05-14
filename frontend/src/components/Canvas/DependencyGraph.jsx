import {useState,useEffect} from "react";
import {
    ReactFlow,
    Background,
    Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dependencyBuild from "../../utils/dependencyBuild";


function DependencyGraph({repoData}){
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const result= dependencyBuild(repoData);
    
    useEffect(() => {
        setNodes(result.nodes);
        setEdges(result.edges);
    }, [repoData]);
    
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
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