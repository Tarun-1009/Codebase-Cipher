/**
 * Function Extractor (Frontend)
 * Enriches function data with relationships and metadata
 */

class FunctionExtractor {
  static enrichFunctionData(functions, callGraph, tree) {
    const functionMap = new Map(functions.map(f => [f.id, f]));

    const enrichedFunctions = functions.map(func => {
      // Find all callers
      const calledBy = callGraph.edges
        .filter(edge => edge.to === func.id)
        .map(edge => {
          const callerFunc = functionMap.get(edge.from);
          return {
            id: edge.from,
            name: callerFunc?.name || 'unknown',
            file: callerFunc?.file || 'unknown'
          };
        });

      // Find all callees
      const calls = callGraph.edges
        .filter(edge => edge.from === func.id)
        .map(edge => {
          const calleeFunc = functionMap.get(edge.to);
          return {
            id: edge.to,
            name: calleeFunc?.name || 'unknown',
            file: calleeFunc?.file || 'unknown'
          };
        });

      return {
        ...func,
        calledBy: calledBy,
        calls: calls,
        isEntryPoint: callGraph.metadata?.entryPoints?.includes(func.id) || false,
        callDepth: calculateCallDepth(func.id, callGraph)
      };
    });

    return enrichedFunctions;
  }

  static buildExecutionPaths(functions, callGraph, entryPoints = []) {
    const paths = [];

    // If no entry points specified, find them
    if (entryPoints.length === 0) {
      entryPoints = callGraph.metadata?.entryPoints || [];
    }

    // Generate paths from each entry point
    entryPoints.forEach(entryId => {
      const path = this.traceExecutionPath(entryId, [], new Set(), functions, callGraph);
      if (path.length > 0) {
        paths.push({
          id: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          entryPoint: entryId,
          sequence: path,
          depth: path.length,
          totalFunctions: path.length
        });
      }
    });

    return paths;
  }

  static traceExecutionPath(functionId, path, visited, functions, callGraph, maxDepth = 10) {
    if (visited.has(functionId) || path.length >= maxDepth) {
      return path;
    }

    visited.add(functionId);
    const func = functions.find(f => f.id === functionId);
    if (func) {
      path.push({
        id: functionId,
        name: func.name,
        file: func.file,
        line: func.line
      });
    }

    // Follow first call only (simplified path)
    const nextCall = callGraph.edges.find(edge => edge.from === functionId);
    if (nextCall) {
      return this.traceExecutionPath(nextCall.to, path, visited, functions, callGraph, maxDepth);
    }

    return path;
  }

  static analyzeFunctionComplexity(func, callGraph) {
    const complexity = {
      cyclomaticComplexity: 1, // Base complexity
      callCount: 0,
      calledByCount: 0,
      depth: 0,
      rank: 'low'
    };

    // Count function calls
    complexity.callCount = callGraph.edges.filter(e => e.from === func.id).length;

    // Count who calls this function
    complexity.calledByCount = callGraph.edges.filter(e => e.to === func.id).length;

    // Calculate cyclomatic complexity
    complexity.cyclomaticComplexity = 1 + complexity.callCount;

    // Rank complexity
    if (complexity.cyclomaticComplexity >= 10) {
      complexity.rank = 'very_high';
    } else if (complexity.cyclomaticComplexity >= 7) {
      complexity.rank = 'high';
    } else if (complexity.cyclomaticComplexity >= 4) {
      complexity.rank = 'medium';
    } else {
      complexity.rank = 'low';
    }

    return complexity;
  }

  static findCycles(callGraph) {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycleDFS = (nodeId, path) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const edges = callGraph.edges.filter(e => e.from === nodeId);
      
      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          if (hasCycleDFS(edge.to, [...path])) {
            return true;
          }
        } else if (recursionStack.has(edge.to)) {
          const cycleStart = path.indexOf(edge.to);
          cycles.push(path.slice(cycleStart).concat([edge.to]));
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    callGraph.nodes.forEach(nodeId => {
      if (!visited.has(nodeId)) {
        hasCycleDFS(nodeId, []);
      }
    });

    return cycles;
  }
}

function calculateCallDepth(functionId, callGraph, maxDepth = 10, visited = new Set()) {
  if (visited.has(functionId) || maxDepth === 0) {
    return 0;
  }

  visited.add(functionId);
  const outgoingEdges = callGraph.edges.filter(e => e.from === functionId);

  if (outgoingEdges.length === 0) {
    return 0;
  }

  return 1 + Math.max(
    ...outgoingEdges.map(edge =>
      calculateCallDepth(edge.to, callGraph, maxDepth - 1, visited)
    )
  );
}

export default FunctionExtractor;
