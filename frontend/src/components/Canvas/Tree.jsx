import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import './Tree.css';
import flattenTree from '../../utils/treeFlattener';
import { useMemo } from 'react';
import getLayoutedElements from '../../utils/treeNodePosition';

import { FaFolder } from 'react-icons/fa';
import { resolveIcon } from '../../utils/icons';

/* Folder node */
const FolderNode = ({ data }) => {
    const { label, onNodeClick } = data;
    return (
        <div className="tree-node-card tree-node-folder" style={{ cursor: 'pointer' }} onClick={() => onNodeClick?.({ name: label, type: 'folder' })}>
            <Handle type="target" position={Position.Left} className="tree-handle" />
            <span className="tree-node-icon">
                <FaFolder color="#E8A838" size={14} />
            </span>
            <span className="tree-node-name">{label}</span>
            <Handle type="source" position={Position.Right} className="tree-handle" />
        </div>
    );
};

/* File node */
const FileNode = ({ data }) => {
    const { label, onNodeClick } = data;
    const { Icon, color } = resolveIcon(label);
    return (
        <div className="tree-node-card tree-node-file" style={{ cursor: 'pointer' }} onClick={() => onNodeClick?.({ name: label, type: 'file' })}>
            <Handle type="target" position={Position.Left} className="tree-handle" />
            <span className="tree-node-icon">
                <Icon color={color} size={14} />
            </span>
            <span className="tree-node-name">{label}</span>
            <Handle type="source" position={Position.Right} className="tree-handle" />
        </div>
    );
};

const nodeTypes = {
    folder: FolderNode,
    file:   FileNode,
};

const edgeOptions = {
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
};

function Tree({ flatNodes, flatEdges, onNodeClick }) {
    const { nodes, edges } = useMemo(() => {
        if (!flatNodes || flatNodes.length === 0) return { nodes: [], edges: [] };
        const layouted = getLayoutedElements(flatNodes, flatEdges, 'LR');
        // Add click handler to node data
        return {
            nodes: layouted.nodes.map(node => ({
                ...node,
                data: { ...node.data, onNodeClick }
            })),
            edges: layouted.edges
        };
    }, [flatNodes, flatEdges, onNodeClick]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
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

export default Tree;