/**
 * Function Parser - Tree-Sitter AST Based
 * Extracts function declarations from source code using AST parsing
 * For production, use with tree-sitter and language grammars
 * Currently provides simplified implementation for immediate functionality
 */

const FunctionNode = require('../models/FunctionNode');

class FunctionParser {
  static parser = null;
  static parserInitialized = false;

  static async initializeParser() {
    // Tree-sitter initialization
    // In production: await Parser.init(); with proper WASM setup
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
    const functions = [];

    // Parse function declarations
    const funcDeclRegex = /(?:async\s+)?function\s+(\w+)\s*\(/g;
    let match;
    while ((match = funcDeclRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      functions.push(new FunctionNode({
        name: match[1],
        file: filename,
        line: lineNum,
        type: 'function'
      }));
    }

    // Parse arrow functions: const name = () =>
    const arrowRegex = /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      functions.push(new FunctionNode({
        name: match[1],
        file: filename,
        line: lineNum,
        type: 'arrow'
      }));
    }

    // Parse class methods
    const methodRegex = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/gm;
    while ((match = methodRegex.exec(content)) !== null) {
      if (!match[1].match(/^(if|for|while|switch|function|class)/i)) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        functions.push(new FunctionNode({
          name: match[1],
          file: filename,
          line: lineNum,
          type: 'method'
        }));
      }
    }

    return functions;
  }

  static parsePython(content, filename) {
    const functions = [];

    // Parse function definitions
    const funcRegex = /^(?:async\s+)?def\s+(\w+)\s*\(/gm;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      functions.push(new FunctionNode({
        name: match[1],
        file: filename,
        line: lineNum,
        type: 'function'
      }));
    }

    return functions;
  }

  static parseJava(content, filename) {
    const functions = [];

    // Parse method declarations
    const methodRegex = /(?:public|private|protected)?\s+(?:static\s+)?(?:async\s+)?(\w+[\[\]]*)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[^{]+)?\{/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      functions.push(new FunctionNode({
        name: match[2],
        file: filename,
        line: lineNum,
        type: 'method',
        returnType: match[1]
      }));
    }

    return functions;
  }
}

module.exports = FunctionParser;
