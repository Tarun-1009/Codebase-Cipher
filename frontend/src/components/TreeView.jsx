import React, { useState } from 'react';

const TreeView = ({ tree }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));

  const toggleExpand = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node, path = 'root') => {
    const nodeId = `${path}/${node.name}`;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={nodeId} style={{ marginLeft: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          {hasChildren && (
            <span
              onClick={() => toggleExpand(nodeId)}
              style={{
                cursor: 'pointer',
                marginRight: '8px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}

          {!hasChildren && <span style={{ marginRight: '8px', width: '14px' }} />}

          <span style={{ marginRight: '8px', fontSize: '16px' }}>
            {node.type === 'folder' ? '📁' : '📄'}
          </span>

          <span style={{ flex: 1 }}>
            {node.name}
          </span>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, nodeId))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h2>Repository Structure</h2>
      {tree && renderNode(tree)}
    </div>
  );
};

export default TreeView;
