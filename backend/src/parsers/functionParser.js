/**
 * Function Parser
 * Extracts function declarations from source code
 */

const FunctionNode = require('../models/FunctionNode');
const regexPatterns = require('../utils/regexPatterns');

class FunctionParser {
  static parseFunctions(fileContent, language, filename) {
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
