import { useMemo } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dependencyBuild from "../../utils/dependencyBuild";
import {getForceLayoutedElements} from "../../utils/graphNodePositioning";
import { resolveIcon } from '../../utils/icons';
import { FaFolder } from 'react-icons/fa';
import './dependencyGraph.css'; 

/* Folder node */
const FolderNode = ({ data }) => {
    // Radius logic: base 25px + 3px per child
    const radius = 25 + ((data.childCount || 0) * 3);
    return (
        <div className="dep-node-folder" style={{ width: radius * 2, height: radius * 2 }}>
            <Handle type="target" position={Position.Top} className="dep-handle-center" />
            <FaFolder color="#3b82f6" size={radius * 0.6} />
            <span className="dep-node-label-folder">{data.label}</span>
            <Handle type="source" position={Position.Bottom} className="dep-handle-center" />
        </div>
    );
};

/* File node */
const FileNode = ({ data }) => {
    const { Icon, color } = resolveIcon(data.label);
    // Radius logic: base 20px + 2px per dependency
    const radius = 20 + ((data.childCount || 0) * 2);
    return (
        <div className="dep-node-file" style={{ width: radius * 2, height: radius * 2 }}>
            <Handle type="target" position={Position.Top} className="dep-handle-center" />
            <Icon color={color} size={radius * 0.7} />
            <span className="dep-node-label-file">{data.label}</span>
            <Handle type="source" position={Position.Bottom} className="dep-handle-center" />
        </div>
    );
};

const nodeTypes = {
    folder: FolderNode,
    file:   FileNode,
};

function DependencyGraph({repoData}){
    const { nodes, edges } = useMemo(() => {
        if (!repoData) return { nodes: [], edges: [] };
        const result = dependencyBuild(repoData);
        return getForceLayoutedElements(result.nodes, result.edges);
    }, [repoData]);
    
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
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
}
export default DependencyGraph; 