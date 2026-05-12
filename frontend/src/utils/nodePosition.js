import dagre from 'dagre';

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // 1. Set the layout direction and node size
  // Note: 172 and 36 are typical width/height for default nodes
  dagreGraph.setGraph({ rankdir: direction });

  // 2. Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 172, height: 36 });
  });

  // 3. Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 4. Calculate layout
  dagre.layout(dagreGraph);

  // 5. Map the calculated positions back to React Flow nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        // We subtract half width/height because dagre calculates from the center
        x: nodeWithPosition.x - 172 / 2,
        y: nodeWithPosition.y - 36 / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
export default getLayoutedElements;