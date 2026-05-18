/**
 * CallGraph Model
 * Represents relationships between functions
 */
class CallGraph {
  constructor(data = {}) {
    this.nodes = data.nodes || [];
    this.edges = data.edges || [];
    this.metadata = data.metadata || {
      totalFunctions: 0,
      totalCalls: 0,
      averageComplexity: 0,
      entryPoints: []
    };
  }

  addNode(nodeId) {
    if (!this.nodes.includes(nodeId)) {
      this.nodes.push(nodeId);
      this.metadata.totalFunctions = this.nodes.length;
    }
  }

  addEdge(from, to) {
    const edge = { from, to };
    const exists = this.edges.some(e => e.from === from && e.to === to);
    if (!exists) {
      this.edges.push(edge);
      this.metadata.totalCalls = this.edges.length;
    }
  }

  toJSON() {
    return {
      nodes: this.nodes,
      edges: this.edges,
      metadata: this.metadata
    };
  }
}

module.exports = CallGraph;
