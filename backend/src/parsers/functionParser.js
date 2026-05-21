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
    const lines = content.split('\n');
    const functionNames = new Set(); // Track found functions to avoid duplicates

    // Parse function declarations: function name() {}
    const funcDeclRegex = /(?:async\s+)?function\s+(\w+)\s*\(/g;
    let match;
    while ((match = funcDeclRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const endLine = this.findFunctionEnd(lines, lineNum - 1);
      const funcName = match[1];
      if (!functionNames.has(`${funcName}@${lineNum}`)) {
        functionNames.add(`${funcName}@${lineNum}`);
        functions.push(new FunctionNode({
          name: funcName,
          file: filename,
          line: lineNum,
          startLine: lineNum,
          endLine: endLine,
          type: 'function'
        }));
      }
    }

    // Parse named arrow functions: const name = () =>
    const arrowRegex = /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const endLine = this.findFunctionEnd(lines, lineNum - 1);
      const funcName = match[1];
      if (!functionNames.has(`${funcName}@${lineNum}`)) {
        functionNames.add(`${funcName}@${lineNum}`);
        functions.push(new FunctionNode({
          name: funcName,
          file: filename,
          line: lineNum,
          startLine: lineNum,
          endLine: endLine,
          type: 'arrow'
        }));
      }
    }

    // Parse class methods: method() {} or async method() {}
    const methodRegex = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/gm;
    while ((match = methodRegex.exec(content)) !== null) {
      if (!match[1].match(/^(if|for|while|switch|function|class|constructor)/i)) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const endLine = this.findFunctionEnd(lines, lineNum - 1);
        const funcName = match[1];
        if (!functionNames.has(`${funcName}@${lineNum}`)) {
          functionNames.add(`${funcName}@${lineNum}`);
          functions.push(new FunctionNode({
            name: funcName,
            file: filename,
            line: lineNum,
            startLine: lineNum,
            endLine: endLine,
            type: 'method'
          }));
        }
      }
    }

    // Parse route handlers and callbacks: app.get("/path", async (req, res) => {})
    // Matches: app.METHOD(..., async (req, res) => {}) or app.METHOD(..., (req, res) => {})
    const routeRegex = /\.(?:get|post|put|delete|patch|head|options|use)\s*\(\s*['"`]?[^'"`]*['"`]?\s*,\s*(?:async\s+)?\(([\w\s,]*)\)\s*=>/gm;
    let routeNum = 0;
    while ((match = routeRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const endLine = this.findFunctionEnd(lines, lineNum - 1);
      const params = match[1].trim();
      const funcName = `handler_${routeNum++}`; // Generate name for anonymous callback
      if (!functionNames.has(`${funcName}@${lineNum}`)) {
        functionNames.add(`${funcName}@${lineNum}`);
        functions.push(new FunctionNode({
          name: funcName,
          file: filename,
          line: lineNum,
          startLine: lineNum,
          endLine: endLine,
          type: 'arrow',
          parameters: params.split(',').map(p => p.trim()).filter(p => p)
        }));
      }
    }

    return functions;
  }

  static parsePython(content, filename) {
    const functions = [];
    const lines = content.split('\n');

    // Parse function definitions
    const funcRegex = /^(?:async\s+)?def\s+(\w+)\s*\(/gm;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const endLine = this.findPythonFunctionEnd(lines, lineNum - 1);
      functions.push(new FunctionNode({
        name: match[1],
        file: filename,
        line: lineNum,
        startLine: lineNum,
        endLine: endLine,
        type: 'function'
      }));
    }

    return functions;
  }

  static parseJava(content, filename) {
    const functions = [];
    const lines = content.split('\n');

    // Parse method declarations
    const methodRegex = /(?:public|private|protected)?\s+(?:static\s+)?(?:async\s+)?(\w+[\[\]]*)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[^{]+)?\{/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const endLine = this.findFunctionEnd(lines, lineNum - 1);
      functions.push(new FunctionNode({
        name: match[2],
        file: filename,
        line: lineNum,
        startLine: lineNum,
        endLine: endLine,
        type: 'method',
        returnType: match[1]
      }));
    }

    return functions;
  }

  static findFunctionEnd(lines, startLine) {
    let braceCount = 0;
    let foundOpeningBrace = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') {
          foundOpeningBrace = true;
          braceCount++;
        } else if (line[j] === '}') {
          braceCount--;
          if (foundOpeningBrace && braceCount === 0) {
            return i + 1; // Return 1-indexed line number
          }
        }
      }
    }

    return startLine + 1; // Fallback
  }

  static findPythonFunctionEnd(lines, startLine) {
    if (startLine >= lines.length) return startLine + 1;

    const baseIndentation = lines[startLine].match(/^\s*/)[0].length;

    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (line === '' || line.startsWith('#')) continue;

      // Check indentation
      const indent = lines[i].match(/^\s*/)[0].length;
      if (indent <= baseIndentation && line.length > 0) {
        return i; // Return 1-indexed line number
      }
    }

    return lines.length; // End of file
  }
}

module.exports = FunctionParser;
