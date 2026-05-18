/**
 * Data Transform Utility
 * Parses and transforms the 3-object JSON response from backend
 */

class DataTransform {
  static parseAnalysisJSON(jsonData) {
    try {
      return {
        tree: jsonData.tree || {},
        functions: jsonData.traceability?.functions || [],
        callGraph: jsonData.traceability?.callGraph || { nodes: [], edges: [] },
        traceabilityMetadata: jsonData.traceability?.metadata || {},
        endpoints: jsonData.apiEndpoints?.endpoints || [],
        endpointsMetadata: jsonData.apiEndpoints?.metadata || {},
        raw: jsonData
      };
    } catch (error) {
      console.error('Error parsing analysis JSON:', error);
      throw new Error('Invalid analysis response format');
    }
  }

  static buildFunctionIndex(functions) {
    const index = new Map();
    functions.forEach(func => {
      index.set(func.id, func);
      index.set(`${func.file}:${func.name}`, func);
    });
    return index;
  }

  static buildFileIndex(tree) {
    const index = new Map();
    
    const traverse = (node, path = '') => {
      const fullPath = path ? `${path}/${node.name}` : node.name;
      
      if (node.type === 'file') {
        index.set(fullPath, node);
      }
      
      if (node.children) {
        node.children.forEach(child => traverse(child, fullPath));
      }
    };

    traverse(tree);
    return index;
  }

  static buildEndpointIndex(endpoints) {
    const index = new Map();
    endpoints.forEach(endpoint => {
      const key = `${endpoint.method} ${endpoint.path}`;
      index.set(key, endpoint);
    });
    return index;
  }

  static enrichFunctionsWithMetadata(functions, fileIndex) {
    return functions.map(func => ({
      ...func,
      fileInfo: fileIndex.get(func.file) || null,
      calledBy: func.calledBy || [],
      calls: func.calls || [],
      complexity: calculateComplexity(func)
    }));
  }

  static enrichEndpointsWithHandlers(endpoints, functionIndex) {
    return endpoints.map(endpoint => ({
      ...endpoint,
      handler: endpoint.handler || 'unknown',
      handlerFunction: functionIndex.get(`${endpoint.handlerFile}:${endpoint.handler}`) || null,
      linkedFunctions: []
    }));
  }

  static flattenTree(node, path = '') {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    const files = [];

    if (node.type === 'file') {
      files.push({
        path: fullPath,
        name: node.name,
        type: 'file'
      });
    }

    if (node.children) {
      node.children.forEach(child => {
        files.push(...this.flattenTree(child, fullPath));
      });
    }

    return files;
  }
}

function calculateComplexity(func) {
  // Simple complexity calculation based on calls
  return Math.min(func.calls?.length || 0, 5);
}

export default DataTransform;
