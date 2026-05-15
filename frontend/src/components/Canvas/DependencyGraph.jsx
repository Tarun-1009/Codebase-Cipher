import { useMemo } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import dependencyBuild from "../../utils/dependencyBuild";
import {getForceLayoutedElements} from "../../utils/graphNodePositioning";
import { resolveIcon } from '../../utils/icons';
import { FaFolder, FaCube } from 'react-icons/fa';
import './dependencyGraph.css'; 

const getFileExtensionInfo = (label) => {
    if (label.endsWith('.jsx') || label.endsWith('.tsx')) return { text: 'RE', className: 'dep-icon-react' };
    if (label.endsWith('.css')) return { text: 'CSS', className: 'dep-icon-css' };
    if (label.endsWith('.ts')) return { text: 'TS', className: 'dep-icon-js' }; 
    return { text: 'JS', className: 'dep-icon-js' };
};

const HandleSet = () => (
    <>
        <Handle type="target" position={Position.Top} id="top-t" style={{ visibility: 'hidden' }} />
        <Handle type="target" position={Position.Bottom} id="bottom-t" style={{ visibility: 'hidden' }} />
        <Handle type="target" position={Position.Left} id="left-t" style={{ visibility: 'hidden' }} />
        <Handle type="target" position={Position.Right} id="right-t" style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Top} id="top-s" style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Bottom} id="bottom-s" style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Left} id="left-s" style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Right} id="right-s" style={{ visibility: 'hidden' }} />
    </>
);

/* Internal File node */
const FileNode = ({ data }) => {
    const extInfo = getFileExtensionInfo(data.label);
    const isActive = data.label === 'index.js' || data.label === 'index.jsx' || data.label === 'App.jsx' || data.label === 'main.jsx';
    
    // Extract a shorter path for display
    const shortPath = '/' + (data.path ? data.path.split('/').slice(0, -1).join('/') : '');

    return (
        <div className={`dep-node-file ${isActive ? 'dep-node-active' : ''}`}>
            <HandleSet />
            
            <div className={`dep-node-icon-box ${extInfo.className}`}>
                {extInfo.text}
            </div>
            <div className="dep-node-text">
                <span className="dep-node-label">{data.label}</span>
                <span className="dep-node-path">{shortPath === '/' ? '/src' : shortPath}</span>
            </div>
        </div>
    );
};

/* External Dependency node */
const ExternalNode = ({ data }) => {
    return (
        <div className="dep-node-external">
            <HandleSet />
            
            <div className="dep-node-icon-box dep-icon-ext">
                <FaCube size={14} />
            </div>
            <div className="dep-node-text">
                <span className="dep-node-label">{data.label}</span>
                <span className="dep-node-path">{data.path || '/node_modules'}</span>
            </div>
        </div>
    );
};

const nodeTypes = {
    file: FileNode,
    external: ExternalNode,
};

function DependencyGraph({repoData, repoName}){
    const { nodes, edges } = useMemo(() => {
        if (!repoData) return { nodes: [], edges: [] };
        const result = dependencyBuild(repoData);
        return getForceLayoutedElements(result.nodes, result.edges);
    }, [repoData]);
    
    // Calculate metrics
    const externalNodesCount = nodes.filter(n => n.type === 'external').length;
    const internalNodesCount = nodes.filter(n => n.type === 'file').length;
    
    return (
        <div className="dep-graph-container">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.05}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant="dots" gap={20} size={1} color="#e2e8f0" />
                <Controls showInteractive={false} className="dep-custom-controls" />
                <MiniMap 
                    style={{ border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', backgroundColor: '#ffffff' }}
                    maskColor="rgba(248, 250, 252, 0.7)"
                />
                
                <Panel position="top-left" className="dep-panel-left">
                    <div className="dep-stat-card">
                        <FaFolder color="#64748b" size={16} /> <span style={{fontWeight: 600, color: '#0f172a'}}>{repoName}</span>
                    </div>
                    
                    <div className="dep-stat-card dep-col">
                        <span className="dep-stat-title">Files</span>
                        <span className="dep-stat-value" style={{color: '#8b5cf6'}}>{internalNodesCount}</span>
                    </div>
                    
                    <div className="dep-stat-card dep-col">
                        <span className="dep-stat-title">Dependencies</span>
                        <span className="dep-stat-value" style={{color: '#3b82f6'}}>{edges.length}</span>
                    </div>
                    
                    <div className="dep-stat-card dep-col">
                        <span className="dep-stat-title">External Packages</span>
                        <span className="dep-stat-value" style={{color: '#10b981'}}>{externalNodesCount}</span>
                    </div>
                </Panel>
                
                <Panel position="top-right" className="dep-panel-right">
                    <div className="dep-legend-item">
                        <span className="dep-legend-color" style={{backgroundColor: '#3b82f6'}}></span> Dependency
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}
export default DependencyGraph;