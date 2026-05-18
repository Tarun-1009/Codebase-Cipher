/**
 * AnalysisResult Model
 * Unified response containing tree, traceability, and API endpoints
 */
class AnalysisResult {
  constructor(data = {}) {
    this.tree = data.tree || {};
    this.traceability = data.traceability || {
      functions: [],
      callGraph: {
        nodes: [],
        edges: [],
        metadata: {}
      },
      metadata: {}
    };
    this.apiEndpoints = data.apiEndpoints || {
      endpoints: [],
      metadata: {}
    };
  }

  toJSON() {
    return {
      tree: this.tree,
      traceability: this.traceability,
      apiEndpoints: this.apiEndpoints
    };
  }
}

module.exports = AnalysisResult;
