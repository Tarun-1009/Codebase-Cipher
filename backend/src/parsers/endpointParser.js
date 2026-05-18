/**
 * Endpoint Parser - Tree-Sitter AST Based
 * Extracts API endpoint declarations from source code using AST parsing
 * 100% AST-driven, no regex fallbacks
 */

const EndpointNode = require('../models/EndpointNode');
const Parser = require('web-tree-sitter');
const Language = require('tree-sitter-javascript');
const LanguagePython = require('tree-sitter-python');
const LanguageJava = require('tree-sitter-java');

class EndpointParser {
  static parser = null;
  static parserInitialized = false;

  static async initializeParser() {
    if (this.parserInitialized) return;
    
    await Parser.init();
    this.parser = new Parser();
    this.parserInitialized = true;
  }

  static async parseEndpoints(fileContent, language, filename) {
    await this.initializeParser();

    if (language === 'javascript' || language === 'typescript') {
      return this.parseJavaScriptEndpoints(fileContent, filename);
    } else if (language === 'python') {
      return this.parsePythonEndpoints(fileContent, filename);
    } else if (language === 'java') {
      return this.parseJavaEndpoints(fileContent, filename);
    }

    return [];
  }

  static parseJavaScriptEndpoints(content, filename) {
    this.parser.setLanguage(Language.default);
    const tree = this.parser.parse(content);
    const endpoints = [];

    this.traverseTree(tree.rootNode, (node) => {
      // Look for call expressions: app.get('/path', handler)
      if (node.type === 'call_expression') {
        const calleeNode = node.childForFieldName('function');
        if (calleeNode && calleeNode.type === 'member_expression') {
          const propertyNode = calleeNode.childForFieldName('property');
          if (propertyNode) {
            const method = propertyNode.text.toLowerCase();
            
            // Check if it's an HTTP method
            if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) {
              const args = node.childForFieldName('arguments');
              if (args) {
                const pathArg = this.getFirstStringArgument(args);
                if (pathArg) {
                  endpoints.push(this.createEndpointNode(
                    pathArg,
                    method.toUpperCase(),
                    filename,
                    node,
                    'express'
                  ));
                }
              }
            }
          }
        }
      }
    });

    return endpoints;
  }

  static parsePythonEndpoints(content, filename) {
    this.parser.setLanguage(LanguagePython.default);
    const tree = this.parser.parse(content);
    const endpoints = [];

    this.traverseTree(tree.rootNode, (node) => {
      // Look for decorators: @app.route('/path') or @app.get('/path')
      if (node.type === 'decorator') {
        const decorated = node.firstChild;
        if (decorated && decorated.type === 'call') {
          const functionNode = decorated.childForFieldName('function');
          if (functionNode && functionNode.type === 'attribute') {
            const attr = functionNode.childForFieldName('attribute');
            if (attr) {
              const method = attr.text.toLowerCase();
              
              if (['route', 'get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                const args = decorated.childForFieldName('arguments');
                if (args) {
                  const pathArg = this.getFirstStringArgument(args);
                  if (pathArg) {
                    const httpMethod = method === 'route' ? 'GET' : method.toUpperCase();
                    endpoints.push(this.createEndpointNode(
                      pathArg,
                      httpMethod,
                      filename,
                      node,
                      'fastapi'
                    ));
                  }
                }
              }
            }
          }
        }
      }
    });

    return endpoints;
  }

  static parseJavaEndpoints(content, filename) {
    this.parser.setLanguage(LanguageJava.default);
    const tree = this.parser.parse(content);
    const endpoints = [];

    this.traverseTree(tree.rootNode, (node) => {
      // Look for annotations: @GetMapping("/path") or @PostMapping
      if (node.type === 'marker_annotation' || node.type === 'annotation') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          const annotationName = nameNode.text;
          const mappingMatch = annotationName.match(/^(\w+?)Mapping$/);
          
          if (mappingMatch) {
            const method = mappingMatch[1].toUpperCase();
            
            // Get path from annotation arguments
            const argsNode = node.childForFieldName('arguments');
            const pathArg = argsNode ? this.getFirstStringArgument(argsNode) : null;
            
            endpoints.push(this.createEndpointNode(
              pathArg || '/',
              method,
              filename,
              node,
              'spring'
            ));
          }
        }
      }
    });

    return endpoints;
  }

  static getFirstStringArgument(argsNode) {
    for (let i = 0; i < argsNode.childCount; i++) {
      const child = argsNode.child(i);
      if (child.type === 'string' || child.type === 'string_literal') {
        // Remove quotes
        return child.text.replace(/^["'`]|["'`]$/g, '');
      }
    }
    return null;
  }

  static createEndpointNode(path, method, filename, astNode, framework) {
    return new EndpointNode({
      path: path,
      method: method,
      handlerFile: filename,
      handlerLine: astNode.startPosition.row + 1,
      framework: framework,
      astNode: astNode
    });
  }

  static traverseTree(node, callback) {
    callback(node);
    for (let i = 0; i < node.childCount; i++) {
      this.traverseTree(node.child(i), callback);
    }
  }
}

module.exports = EndpointParser;
