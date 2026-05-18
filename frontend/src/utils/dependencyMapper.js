/**
 * Dependency Mapper (Frontend)
 * Maps file dependencies and relationships using parsed data
 */

class DependencyMapper {
  static buildDependencyGraph(functions, endpoints, tree) {
    const graph = {
      functions: new Map(),
      files: new Map(),
      dependencies: []
    };

    // Index functions by file
    functions.forEach(func => {
      if (!graph.functions.has(func.file)) {
        graph.functions.set(func.file, []);
      }
      graph.functions.get(func.file).push(func);
    });

    // Build file graph from tree
    this.flattenTree(tree, graph.files);

    // Build dependency relationships
    this.buildRelationships(functions, endpoints, graph);

    return graph;
  }

  static buildRelationships(functions, endpoints, graph) {
    functions.forEach(func => {
      // Find what this function calls
      const calledFunctions = this.findCalledFunctions(func, functions);
      
      calledFunctions.forEach(calledFunc => {
        graph.dependencies.push({
          from: func.id,
          fromName: func.name,
          fromFile: func.file,
          to: calledFunc.id,
          toName: calledFunc.name,
          toFile: calledFunc.file,
          type: 'function_call'
        });
      });
    });

    // Link endpoints to handler functions
    endpoints.forEach(endpoint => {
      const handler = functions.find(f =>
        f.name === endpoint.handler && f.file === endpoint.handlerFile
      );

      if (handler) {
        graph.dependencies.push({
          from: endpoint.id,
          fromName: `${endpoint.method} ${endpoint.path}`,
          to: handler.id,
          toName: handler.name,
          type: 'endpoint_handler'
        });
      }
    });

    return graph;
  }

  static findCalledFunctions(func, allFunctions) {
    const called = [];

    // This would use call information from backend or AST analysis
    // For now, using the calls array if available
    if (func.calls && Array.isArray(func.calls)) {
      func.calls.forEach(callName => {
        const matchingFunc = allFunctions.find(f => f.name === callName);
        if (matchingFunc) {
          called.push(matchingFunc);
        }
      });
    }

    return called;
  }

  static flattenTree(node, fileMap, path = '') {
    const fullPath = path ? `${path}/${node.name}` : node.name;

    if (node.type === 'file') {
      fileMap.set(fullPath, {
        name: node.name,
        path: fullPath,
        type: 'file'
      });
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => {
        this.flattenTree(child, fileMap, fullPath);
      });
    }
  }

  static getFileContent(filePath, tree) {
    // Retrieve file from tree structure
    const files = [];
    this.flattenTree(tree, new Map(), '');
    return files.find(f => f.path === filePath);
  }

  static analyzeImports(content, language) {
    // Extract import/require statements
    const imports = [];

    if (language === 'javascript' || language === 'typescript') {
      // import statements
      const importPattern = /import\s+(?:{[^}]*}|.*?)\s+from\s+['"](.+?)['"]/g;
      let match;
      while ((match = importPattern.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // require statements
      const requirePattern = /require\s*\(\s*['"](.+?)['"]\s*\)/g;
      while ((match = requirePattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    } else if (language === 'python') {
      // Python imports
      const importPattern = /from\s+(.+?)\s+import|import\s+(.+?)(?:\s+as|$)/g;
      let match;
      while ((match = importPattern.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    }

    return [...new Set(imports)];
  }
}

export default DependencyMapper;
