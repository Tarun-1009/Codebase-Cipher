/**
 * Call Graph Builder Engine
 * Builds relationships between functions (stub implementation)
 * Full relationship building happens in frontend
 */

const CallGraph = require('../models/CallGraph');

class CallGraphBuilder {
  static buildCallGraph(functions) {
    const callGraph = new CallGraph();

    // Add all function nodes to graph
    functions.forEach(func => {
      callGraph.addNode(func.id);
    });

    // Basic edge creation from parsed data
    functions.forEach(func => {
      if (func.calls && func.calls.length > 0) {
        func.calls.forEach(calledFuncId => {
          callGraph.addEdge(func.id, calledFuncId);
        });
      }
    });

    // Calculate metadata
    callGraph.metadata.totalFunctions = functions.length;
    callGraph.metadata.totalCalls = callGraph.edges.length;

    // Find entry points (exported functions with no callers)
    const allCalledFuncs = new Set(callGraph.edges.map(e => e.to));
    callGraph.metadata.entryPoints = functions
      .filter(f => !allCalledFuncs.has(f.id) && f.scope === 'exported')
      .map(f => f.id);

    return callGraph;
  }
}

module.exports = CallGraphBuilder;
