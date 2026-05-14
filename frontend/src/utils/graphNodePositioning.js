import * as d3 from 'd3-force';

export const getForceLayoutedElements = (nodes, edges) => {
  // Create a simulation with the nodes

  // Create a copy of edges so d3 doesn't mutate source/target into objects (ReactFlow needs them to stay as string IDs)
  const d3Edges = edges.map(e => ({ ...e }));

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(d3Edges).id(d => d.id).distance(150)) // Edge length
    .force("charge", d3.forceManyBody().strength(-500))            // Repulsion strength
    .force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
    .stop(); // We run it manually for a static initial layout

  // Run the simulation for a few ticks to reach equilibrium
  for (let i = 0; i < 300; ++i) simulation.tick();

  const layoutedNodes = nodes.map(node => ({
    ...node,
    // React Flow handles the actual rendering
    position: { x: node.x, y: node.y }
  }));

  return { nodes: layoutedNodes, edges };
};