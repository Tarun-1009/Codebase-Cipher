/**
 * Endpoint Extractor (Frontend)
 * Enriches endpoint data with handler links and execution flows
 */

class EndpointExtractor {
  static enrichEndpointData(endpoints, functions, callGraph) {
    const functionMap = new Map(functions.map(f => [f.id, f]));

    const enrichedEndpoints = endpoints.map(endpoint => {
      // Find handler function
      const handlerFunc = functions.find(f =>
        f.name === endpoint.handler && f.file === endpoint.handlerFile
      );

      // Build execution flow from handler
      const executionFlow = handlerFunc
        ? this.buildEndpointFlow(handlerFunc.id, functions, callGraph)
        : [];

      return {
        ...endpoint,
        handlerFunction: handlerFunc || null,
        executionFlow: executionFlow,
        linkedFunctions: extractFunctionsFromFlow(executionFlow),
        methodColor: getHTTPMethodColor(endpoint.method),
        complexity: calculateEndpointComplexity(executionFlow, callGraph)
      };
    });

    return enrichedEndpoints;
  }

  static buildEndpointFlow(handlerFuncId, functions, callGraph, maxDepth = 15) {
    const flow = [];
    const visited = new Set();

    const trace = (funcId, depth) => {
      if (visited.has(funcId) || depth > maxDepth) {
        return;
      }

      visited.add(funcId);
      const func = functions.find(f => f.id === funcId);

      if (func) {
        flow.push({
          step: flow.length + 1,
          functionId: funcId,
          functionName: func.name,
          file: func.file,
          line: func.line,
          depth: depth
        });
      }

      // Follow all calls from this function
      const outgoingEdges = callGraph.edges.filter(e => e.from === funcId);
      outgoingEdges.forEach(edge => {
        trace(edge.to, depth + 1);
      });
    };

    trace(handlerFuncId, 0);
    return flow;
  }

  static groupEndpointsByPath(endpoints) {
    const grouped = new Map();

    endpoints.forEach(endpoint => {
      if (!grouped.has(endpoint.path)) {
        grouped.set(endpoint.path, []);
      }
      grouped.get(endpoint.path).push(endpoint);
    });

    return grouped;
  }

  static groupEndpointsByHandler(endpoints) {
    const grouped = new Map();

    endpoints.forEach(endpoint => {
      const key = `${endpoint.handlerFile}:${endpoint.handler}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(endpoint);
    });

    return grouped;
  }

  static buildEndpointMatrix(endpoints, functions) {
    const matrix = {
      endpoints: endpoints.map(e => `${e.method} ${e.path}`),
      handlers: [...new Set(endpoints.map(e => e.handler))],
      relationships: []
    };

    endpoints.forEach((endpoint, epIdx) => {
      const handler = functions.find(f =>
        f.name === endpoint.handler && f.file === endpoint.handlerFile
      );

      if (handler) {
        matrix.relationships.push({
          endpointIndex: epIdx,
          handlerIndex: matrix.handlers.indexOf(handler.name),
          endpoint: endpoint,
          handler: handler
        });
      }
    });

    return matrix;
  }

  static analyzeEndpointComplexity(endpoint, executionFlow, callGraph) {
    return {
      handlerComplexity: executionFlow.length,
      totalDepth: Math.max(...executionFlow.map(f => f.depth || 0), 0),
      branchCount: countBranches(executionFlow, callGraph),
      rank: rankComplexity(executionFlow.length)
    };
  }
}

function extractFunctionsFromFlow(flow) {
  return flow.map(step => ({
    id: step.functionId,
    name: step.functionName,
    file: step.file,
    depth: step.depth
  }));
}

function getHTTPMethodColor(method) {
  const colors = {
    GET: '#00AA00',
    POST: '#0066FF',
    PUT: '#FFAA00',
    DELETE: '#FF0000',
    PATCH: '#9900FF',
    HEAD: '#666666',
    OPTIONS: '#999999'
  };
  return colors[method] || '#000000';
}

function calculateEndpointComplexity(executionFlow) {
  return {
    handlerComplexity: executionFlow.length,
    depth: Math.max(...executionFlow.map(f => f.depth || 0), 0)
  };
}

function rankComplexity(depth) {
  if (depth > 10) return 'very_high';
  if (depth > 7) return 'high';
  if (depth > 4) return 'medium';
  return 'low';
}

function countBranches(flow, callGraph) {
  let branches = 0;
  flow.forEach(step => {
    const outgoing = callGraph.edges.filter(e => e.from === step.functionId);
    if (outgoing.length > 1) branches += outgoing.length - 1;
  });
  return branches;
}

export default EndpointExtractor;
