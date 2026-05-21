import { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getForceLayoutedElements } from '../../utils/graphNodePositioning';
import { FaCode, FaBoxes } from 'react-icons/fa';

// Custom Function Node Component
const FunctionNodeComponent = ({ data }) => {
    return (
        <div className="trace-node-function">
            <Handle type="target" position={Position.Top} id="t-top" className="trace-handle" />
            <Handle type="target" position={Position.Left} id="t-left" className="trace-handle" />
            
            <div className="trace-node-icon-box">
                <FaCode size={11} color="#ffffff" />
            </div>
            <div className="trace-node-text">
                <span className="trace-node-label" title={data.label}>{data.label}</span>
                <span className="trace-node-path" title={data.path}>{data.path.split('/').pop()}</span>
            </div>
            
            <Handle type="source" position={Position.Bottom} id="s-bottom" className="trace-handle" />
            <Handle type="source" position={Position.Right} id="s-right" className="trace-handle" />
        </div>
    );
};

const nodeTypes = {
    functionNode: FunctionNodeComponent
};

function TraceabilityGraph({ traceability, onNodeClick }) {
    const { nodes, edges } = useMemo(() => {
        if (!traceability || !traceability.callGraph || !traceability.callGraph.nodes) {
            return { nodes: [], edges: [] };
        }

        const rawNodes = traceability.callGraph.nodes;
        const rawEdges = traceability.callGraph.edges;

        // Map strings to ReactFlow Nodes
        const initialNodes = rawNodes.map(nodeId => {
            const [filePath, funcName] = nodeId.split('#');
            return {
                id: nodeId,
                type: 'functionNode',
                data: {
                    label: funcName || nodeId,
                    path: filePath || '',
                    id: nodeId
                },
                position: { x: 0, y: 0 }
            };
        });

        // Map call-relationships to ReactFlow Edges
        const initialEdges = rawEdges.map((e, index) => ({
            id: `call-edge-${index}`,
            source: e.from,
            target: e.to,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#a855f7', strokeWidth: 1.5, opacity: 0.8 },
            markerEnd: {
                type: 'arrowclosed',
                width: 15,
                height: 15,
                color: '#a855f7'
            }
        }));

        // Apply force layout algorithm
        return getForceLayoutedElements(initialNodes, initialEdges);
    }, [traceability]);

    const handleNodeClick = (event, flowNode) => {
        onNodeClick?.({
            name: flowNode.data.label,
            path: flowNode.data.path,
            type: 'file',
            functionId: flowNode.data.id
        });
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={handleNodeClick}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.05}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant="dots" gap={20} size={1} color="#334155" />
                <Controls showInteractive={false} />
                
                <Panel position="top-left" className="dep-panel-left">
                    <div className="dep-stat-card" style={{ background: '#1e1b4b', borderColor: '#312e81' }}>
                        <FaBoxes color="#a855f7" size={14} /> 
                        <span style={{ fontWeight: 600, color: '#f3e8ff', marginLeft: '6px' }}>Traceability Call Graph</span>
                    </div>
                    
                    <div className="dep-stat-card dep-col">
                        <span className="dep-stat-title">Functions</span>
                        <span className="dep-stat-value" style={{ color: '#a855f7' }}>{nodes.length}</span>
                    </div>
                    
                    <div className="dep-stat-card dep-col">
                        <span className="dep-stat-title">Interactions</span>
                        <span className="dep-stat-value" style={{ color: '#ec4899' }}>{edges.length}</span>
                    </div>
                    
                    {traceability?.metadata?.entryPoints && (
                        <div className="dep-stat-card dep-col">
                            <span className="dep-stat-title">Entry Points</span>
                            <span className="dep-stat-value" style={{ color: '#10b981' }}>
                                {traceability.metadata.entryPoints.length}
                            </span>
                        </div>
                    )}
                </Panel>
            </ReactFlow>
        </div>
    );
}

export default TraceabilityGraph;
