/**
 * Function Parser - Tree-Sitter AST Based
 * Extracts function declarations from source code using AST parsing
 * 100% AST-driven, no regex fallbacks
 */

const FunctionNode = require('../models/FunctionNode');
const Parser = require('web-tree-sitter');
const Language = require('tree-sitter-javascript');
const LanguagePython = require('tree-sitter-python');
const LanguageJava = require('tree-sitter-java');

class FunctionParser {
  static parser = null;
  static parserInitialized = false;

  static async initializeParser() {
    if (this.parserInitialized) return;
    
    await Parser.init();
    this.parser = new Parser();
    this.parserInitialized = true;
  }

  static async parseFunctions(fileContent, language, filename) {
    await this.initializeParser();

    if (language === 'javascript' || language === 'typescript') {
      return this.parseJavaScript(fileContent, filename);
    } else if (language === 'python') {
      return this.parsePython(fileContent, filename);
    } else if (language === 'java') {
      return this.parseJava(fileContent, filename);
    }

    return [];
  }

  static parseJavaScript(content, filename) {
    this.parser.setLanguage(Language.default);
    const tree = this.parser.parse(content);
    const functions = [];

    this.traverseTree(tree.rootNode, (node) => {
      if (node.type === 'function_declaration') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push(this.createFunctionNode(nameNode.text, filename, node, 'function'));
        }
      } else if (node.type === 'arrow_function') {
        // Find assignment parent: const name = () => {}
        const parent = node.parent;
        if (parent && parent.type === 'variable_declarator') {
          const nameNode = parent.childForFieldName('name');
          if (nameNode) {
            functions.push(this.createFunctionNode(nameNode.text, filename, node, 'arrow'));
          }
        }
      } else if (node.type === 'method_definition') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push(this.createFunctionNode(nameNode.text, filename, node, 'method'));
        }
      }
    });

    return functions;
  }

  static parsePython(content, filename) {
    this.parser.setLanguage(LanguagePython.default);
    const tree = this.parser.parse(content);
    const functions = [];

    this.traverseTree(tree.rootNode, (node) => {
      if (node.type === 'function_definition') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push(this.createFunctionNode(nameNode.text, filename, node, 'function'));
        }
      }
    });

    return functions;
  }

  static parseJava(content, filename) {
    this.parser.setLanguage(LanguageJava.default);
    const tree = this.parser.parse(content);
    const functions = [];

    this.traverseTree(tree.rootNode, (node) => {
      if (node.type === 'method_declaration') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          const modifierNode = node.childForFieldName('modifiers');
          functions.push(this.createFunctionNode(nameNode.text, filename, node, 'method'));
        }
      } else if (node.type === 'constructor_declaration') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push(this.createFunctionNode(nameNode.text, filename, node, 'constructor'));
        }
      }
    });

    return functions;
  }

  static createFunctionNode(name, filename, astNode, type) {
    return new FunctionNode({
      name: name,
      file: filename,
      line: astNode.startPosition.row + 1,
      type: type,
      column: astNode.startPosition.column,
      endLine: astNode.endPosition.row + 1,
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

module.exports = FunctionParser;

    return functions;
  }

  static detectScope(content, index, name) {
    // Check if exported
    const beforeText = content.substring(Math.max(0, index - 100), index);
    if (beforeText.includes('module.exports') || beforeText.includes('export')) {
      return 'exported';
    }
    return 'private';
  }

  static detectPythonScope(content, index, name) {
    // Check indentation (0 = top-level/exported)
    const lineStart = content.lastIndexOf('\n', index) + 1;
    const lineContent = content.substring(lineStart, index);
    const indentation = lineContent.match(/^\s*/)[0].length;

    return indentation === 0 ? 'exported' : 'private';
  }
}

module.exports = FunctionParser;
