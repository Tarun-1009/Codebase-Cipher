/**
 * Tree Sitter Parser Wrapper (Frontend)
 * Provides AST parsing and analysis capabilities
 * 100% Web-Tree-Sitter based, no regex fallbacks
 */

// Dynamic import for web-tree-sitter
let Parser = null;
let Languages = {};

class TreeSitterParser {
  static initialized = false;

  static async initialize() {
    if (this.initialized) return;

    try {
      // Import web-tree-sitter dynamically
      const wasmModule = await import('web-tree-sitter');
      Parser = wasmModule.default;
      
      // Initialize parser
      await Parser.init();
      
      // Load language modules
      // These would need to be served as WASM files in production
      console.log('Tree-sitter parser initialized');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize tree-sitter:', error);
      throw error;
    }
  }

  static async parseCode(content, language = 'javascript') {
    if (!this.initialized) {
      await this.initialize();
    }

    const parser = new Parser();
    
    // Set language based on file type
    // This would require language WASM files
    const langModule = this.getLanguageModule(language);
    if (!langModule) {
      throw new Error(`Language ${language} not supported`);
    }

    parser.setLanguage(langModule);
    const tree = parser.parse(content);
    
    return {
      tree: tree.rootNode,
      content: content,
      language: language
    };
  }

  static extractFunctionCalls(content, language = 'javascript') {
    const ast = this.parseCodeSync(content, language);
    const calls = new Set();

    this.traverseAST(ast.tree, (node) => {
      // JavaScript/TypeScript function calls
      if (language === 'javascript' && node.type === 'call_expression') {
        const func = node.childForFieldName('function');
        if (func) {
          calls.add(func.text);
        }
      }
      // Python function calls
      else if (language === 'python' && node.type === 'call') {
        const func = node.childForFieldName('function');
        if (func) {
          calls.add(func.text);
        }
      }
      // Java method calls
      else if (language === 'java' && node.type === 'method_invocation') {
        const name = node.childForFieldName('name');
        if (name) {
          calls.add(name.text);
        }
      }
    });

    return Array.from(calls);
  }

  static extractFunctionDefinitions(content, language = 'javascript') {
    const ast = this.parseCodeSync(content, language);
    const functions = [];

    this.traverseAST(ast.tree, (node) => {
      if (language === 'javascript') {
        if (node.type === 'function_declaration') {
          const nameNode = node.childForFieldName('name');
          if (nameNode) {
            functions.push({
              name: nameNode.text,
              type: 'function',
              line: node.startPosition.row + 1,
              column: node.startPosition.column,
              endLine: node.endPosition.row + 1,
              node: node
            });
          }
        } else if (node.type === 'arrow_function') {
          const parent = node.parent;
          if (parent && parent.type === 'variable_declarator') {
            const nameNode = parent.childForFieldName('name');
            if (nameNode) {
              functions.push({
                name: nameNode.text,
                type: 'arrow',
                line: node.startPosition.row + 1,
                column: node.startPosition.column,
                endLine: node.endPosition.row + 1,
                node: node
              });
            }
          }
        } else if (node.type === 'method_definition') {
          const nameNode = node.childForFieldName('name');
          if (nameNode) {
            functions.push({
              name: nameNode.text,
              type: 'method',
              line: node.startPosition.row + 1,
              column: node.startPosition.column,
              endLine: node.endPosition.row + 1,
              node: node
            });
          }
        }
      } else if (language === 'python') {
        if (node.type === 'function_definition') {
          const nameNode = node.childForFieldName('name');
          if (nameNode) {
            functions.push({
              name: nameNode.text,
              type: 'function',
              line: node.startPosition.row + 1,
              column: node.startPosition.column,
              endLine: node.endPosition.row + 1,
              node: node
            });
          }
        }
      } else if (language === 'java') {
        if (node.type === 'method_declaration') {
          const nameNode = node.childForFieldName('name');
          if (nameNode) {
            functions.push({
              name: nameNode.text,
              type: 'method',
              line: node.startPosition.row + 1,
              column: node.startPosition.column,
              endLine: node.endPosition.row + 1,
              node: node
            });
          }
        }
      }
    });

    return functions;
  }

  static buildAST(content, language = 'javascript') {
    const ast = this.parseCodeSync(content, language);
    const functions = this.extractFunctionDefinitions(content, language);
    const calls = this.extractFunctionCalls(content, language);
    const imports = this.detectImports(content, language);

    return {
      type: 'program',
      language: language,
      root: ast.tree,
      functions: functions,
      calls: calls,
      imports: imports,
      metadata: {
        totalFunctions: functions.length,
        totalCalls: calls.length,
        totalImports: imports.length,
        languages: [language]
      }
    };
  }

  static extractSourceCode(node, content) {
    const startIndex = node.startIndex;
    const endIndex = node.endIndex;
    return content.substring(startIndex, endIndex);
  }

  static detectImports(content, language = 'javascript') {
    const ast = this.parseCodeSync(content, language);
    const imports = [];

    this.traverseAST(ast.tree, (node) => {
      if (language === 'javascript') {
        if (node.type === 'import_statement') {
          const source = node.childForFieldName('source');
          if (source) {
            imports.push({
              type: 'import',
              source: source.text.replace(/^["'`]|["'`]$/g, ''),
              line: node.startPosition.row + 1
            });
          }
        }
      } else if (language === 'python') {
        if (node.type === 'import_statement') {
          const name = node.childForFieldName('name');
          if (name) {
            imports.push({
              type: 'import',
              source: name.text,
              line: node.startPosition.row + 1
            });
          }
        }
      } else if (language === 'java') {
        if (node.type === 'import_declaration') {
          const name = node.childForFieldName('name');
          if (name) {
            imports.push({
              type: 'import',
              source: name.text,
              line: node.startPosition.row + 1
            });
          }
        }
      }
    });

    return imports;
  }

  static analyzeComplexity(content, language = 'javascript') {
    const ast = this.buildAST(content, language);
    const complexityData = {};

    ast.functions.forEach(func => {
      let complexity = 1;
      let branches = 0;

      // Count decision points
      this.traverseAST(func.node, (node) => {
        if (['if_statement', 'switch_statement', 'conditional_expression'].includes(node.type)) {
          complexity++;
          branches++;
        }
        if (['for_statement', 'while_statement', 'do_statement'].includes(node.type)) {
          complexity++;
        }
        if (node.type === 'try_statement') {
          complexity += 2;
        }
      });

      complexityData[func.name] = {
        cyclomatic: complexity,
        branches: branches,
        line: func.line
      };
    });

    return complexityData;
  }

  static traverseAST(node, callback) {
    callback(node);
    for (let i = 0; i < node.childCount; i++) {
      this.traverseAST(node.child(i), callback);
    }
  }

  static parseCodeSync(content, language) {
    // Synchronous parse - must be called after Parser is loaded
    if (!Parser) {
      throw new Error('Parser not initialized. Call initialize() first.');
    }

    const parser = new Parser();
    const langModule = this.getLanguageModule(language);
    
    if (!langModule) {
      throw new Error(`Language ${language} not supported`);
    }

    parser.setLanguage(langModule);
    const tree = parser.parse(content);

    return {
      tree: tree.rootNode,
      content: content,
      language: language
    };
  }

  static getLanguageModule(language) {
    // Return language module or null if not available
    // In production, these would be dynamically loaded WASM modules
    if (Languages[language]) {
      return Languages[language];
    }
    return null;
  }

  static setLanguageModule(language, module) {
    Languages[language] = module;
  }

  static async findSymbolAtPosition(content, language, line, column) {
    const ast = await this.parseCode(content, language);
    const lineOffset = this.getLineOffset(content, line);
    const position = lineOffset + column;

    let nodeAtPosition = null;

    this.traverseAST(ast.tree, (node) => {
      if (node.startIndex <= position && position <= node.endIndex) {
        if (!nodeAtPosition || node.startIndex > nodeAtPosition.startIndex) {
          nodeAtPosition = node;
        }
      }
    });

    return nodeAtPosition;
  }

  static getLineOffset(content, line) {
    const lines = content.split('\n');
    let offset = 0;
    for (let i = 0; i < Math.min(line, lines.length); i++) {
      offset += lines[i].length + 1;
    }
    return offset;
  }
}

export default TreeSitterParser;
