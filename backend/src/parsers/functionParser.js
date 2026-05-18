/**
 * Function Parser
 * Extracts function declarations from source code
 * Uses tree-sitter for accurate AST parsing with regex fallback
 */

const FunctionNode = require('../models/FunctionNode');
const regexPatterns = require('../utils/regexPatterns');

class FunctionParser {
  static useTreeSitter = true; // Toggle tree-sitter usage

  static async parseFunctions(fileContent, language, filename) {
    const functions = [];

    if (language === 'javascript' || language === 'typescript') {
      return this.parseJavaScript(fileContent, filename);
    } else if (language === 'python') {
      return this.parsePython(fileContent, filename);
    } else if (language === 'java') {
      return this.parseJava(fileContent, filename);
    }

    return functions;
  }

  static parseJavaScript(content, filename) {
    const functions = [];
    let lineNumber = 1;

    // Try tree-sitter parsing if available
    if (this.useTreeSitter) {
      try {
        const treeSitterFuncs = this.parseWithTreeSitter(content, filename, 'javascript');
        if (treeSitterFuncs.length > 0) {
          return treeSitterFuncs;
        }
      } catch (err) {
        console.warn('Tree-sitter parsing failed, falling back to regex:', err.message);
      }
    }

    // Regex fallback
    // Regular function declarations: function name() {}
    const funcDeclPattern = regexPatterns.JS_FUNCTION_DECLARATION;
    let match;

    while ((match = funcDeclPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      lineNumber = content.substring(0, match.index).split('\n').length;

      const functionName = match[2] || match[3] || match[4];
      const isAsync = fullMatch.includes('async');

      const fn = new FunctionNode({
        name: functionName,
        file: filename,
        line: lineNumber,
        type: 'function',
        isAsync: isAsync,
        scope: this.detectScope(content, match.index, functionName)
      });

      functions.push(fn);
    }

    // Arrow functions: const name = () => {}
    const arrowPattern = regexPatterns.JS_ARROW_FUNCTION;
    while ((match = arrowPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;
      const functionName = match[1];

      const fn = new FunctionNode({
        name: functionName,
        file: filename,
        line: lineNumber,
        type: 'arrow',
        isAsync: match[0].includes('async'),
        scope: 'exported'
      });

      functions.push(fn);
    }

    // Class methods: methodName() {}
    const classMethodPattern = regexPatterns.JS_CLASS_METHOD;
    while ((match = classMethodPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;
      const methodName = match[1];

      const fn = new FunctionNode({
        name: methodName,
        file: filename,
        line: lineNumber,
        type: 'method',
        isAsync: match[0].includes('async'),
        isClass: true
      });

      functions.push(fn);
    }

    return functions;
  }

  static parsePython(content, filename) {
    const functions = [];
    let lineNumber = 1;

    // Try tree-sitter parsing if available
    if (this.useTreeSitter) {
      try {
        const treeSitterFuncs = this.parseWithTreeSitter(content, filename, 'python');
        if (treeSitterFuncs.length > 0) {
          return treeSitterFuncs;
        }
      } catch (err) {
        console.warn('Tree-sitter parsing failed, falling back to regex:', err.message);
      }
    }

    // Regex fallback
    // Python function definition: def name():
    const funcPattern = regexPatterns.PY_FUNCTION_DEFINITION;
    let match;

    while ((match = funcPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;
      const functionName = match[1];
      const isAsync = match[0].includes('async');

      const fn = new FunctionNode({
        name: functionName,
        file: filename,
        line: lineNumber,
        type: isAsync ? 'async' : 'function',
        isAsync: isAsync,
        scope: this.detectPythonScope(content, match.index, functionName)
      });

      functions.push(fn);
    }

    return functions;
  }

  static parseJava(content, filename) {
    const functions = [];
    let lineNumber = 1;

    // Try tree-sitter parsing if available
    if (this.useTreeSitter) {
      try {
        const treeSitterFuncs = this.parseWithTreeSitter(content, filename, 'java');
        if (treeSitterFuncs.length > 0) {
          return treeSitterFuncs;
        }
      } catch (err) {
        console.warn('Tree-sitter parsing failed, falling back to regex:', err.message);
      }
    }

    // Regex fallback
    // Java method: accessModifier returnType name()
    const methodPattern = regexPatterns.JAVA_METHOD_DEFINITION;
    let match;

    while ((match = methodPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;
      const methodName = match[3];
      const returnType = match[2];

      const fn = new FunctionNode({
        name: methodName,
        file: filename,
        line: lineNumber,
        type: 'method',
        returnType: returnType,
        scope: match[1] || 'private'
      });

      functions.push(fn);
    }

    return functions;
  }

  static parseWithTreeSitter(content, filename, language) {
    // Placeholder for tree-sitter integration
    // In production with web-tree-sitter/tree-sitter-[language] installed:
    /*
    const Parser = require('tree-sitter');
    const Language = require(`tree-sitter-${language}`);
    
    const parser = new Parser();
    parser.setLanguage(Language);
    const tree = parser.parse(content);
    
    // Query for function definitions
    const query = parser.getLanguage().query(functionQueryString);
    const captures = query.captures(tree.rootNode);
    
    return captures.map(capture => {
      return new FunctionNode({
        name: capture.node.text,
        file: filename,
        line: capture.node.startPosition.row + 1,
        ...
      });
    });
    */
    return [];
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

  static parseJavaScript(content, filename) {
    const functions = [];
    let lineNumber = 1;

    // Regular function declarations: function name() {}
    const funcDeclPattern = regexPatterns.JS_FUNCTION_DECLARATION;
    let match;

    while ((match = funcDeclPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      lineNumber = content.substring(0, match.index).split('\n').length;

      const functionName = match[2] || match[3] || match[4]; // extract name from different patterns
      const isAsync = fullMatch.includes('async');

      const fn = new FunctionNode({
        name: functionName,
        file: filename,
        line: lineNumber,
        type: 'function',
        isAsync: isAsync,
        scope: this.detectScope(content, match.index, functionName)
      });

      functions.push(fn);
    }

    // Arrow functions: const name = () => {}
    const arrowPattern = regexPatterns.JS_ARROW_FUNCTION;
    while ((match = arrowPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;
      const functionName = match[1];

      const fn = new FunctionNode({
        name: functionName,
        file: filename,
        line: lineNumber,
        type: 'arrow',
        isAsync: match[0].includes('async'),
        scope: 'exported'
      });

      functions.push(fn);
    }

    // Class methods: methodName() {}
    const classMethodPattern = regexPatterns.JS_CLASS_METHOD;
    while ((match = classMethodPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;
      const methodName = match[1];

      const fn = new FunctionNode({
        name: methodName,
        file: filename,
        line: lineNumber,
        type: 'method',
        isAsync: match[0].includes('async'),
        isClass: true
      });

      functions.push(fn);
    }

    return functions;
  }

  static parsePython(content, filename) {
    const functions = [];
    let lineNumber = 1;

    // Python function definition: def name():
    const funcPattern = regexPatterns.PY_FUNCTION_DEFINITION;
    let match;

    while ((match = funcPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;
      const functionName = match[1];
      const isAsync = match[0].includes('async');

      const fn = new FunctionNode({
        name: functionName,
        file: filename,
        line: lineNumber,
        type: isAsync ? 'async' : 'function',
        isAsync: isAsync,
        scope: this.detectPythonScope(content, match.index, functionName)
      });

      functions.push(fn);
    }

    return functions;
  }

  static parseJava(content, filename) {
    const functions = [];
    let lineNumber = 1;

    // Java method: accessModifier returnType name()
    const methodPattern = regexPatterns.JAVA_METHOD_DEFINITION;
    let match;

    while ((match = methodPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;
      const methodName = match[3];
      const returnType = match[2];

      const fn = new FunctionNode({
        name: methodName,
        file: filename,
        line: lineNumber,
        type: 'method',
        returnType: returnType,
        scope: match[1] || 'private'
      });

      functions.push(fn);
    }

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
