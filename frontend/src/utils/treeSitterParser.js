/**
 * Tree Sitter Parser Wrapper (Frontend)
 * Provides AST parsing and analysis capabilities
 * Uses web-tree-sitter for client-side parsing
 */

// Fallback regex-based extraction for when tree-sitter is unavailable
const CALL_PATTERNS = {
  javascript: /(\w+)\s*\(/g,
  python: /(\w+)\s*\(/g,
  java: /(\w+)\s*\(/g,
  go: /(\w+)\s*\(/g
};

const FUNCTION_PATTERNS = {
  javascript: /(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=|(\w+)\s*\(/g,
  python: /def\s+(\w+)/g,
  java: /(?:public|private|protected)?\s+\w+\s+(\w+)\s*\(/g,
  go: /func\s+(\w+)/g
};

class TreeSitterParser {
  static parserCache = new Map();

  static async initializeParser(language) {
    if (this.parserCache.has(language)) {
      return this.parserCache.get(language);
    }

    console.log(`Initializing parser for language: ${language}`);
    
    // In production with web-tree-sitter installed:
    // const Parser = require('web-tree-sitter');
    // await Parser.init();
    // const parser = new Parser();
    // parser.setLanguage(await Parser.Language.load(`path/to/${language}.wasm`));
    
    const parser = {
      language,
      ready: true,
      type: 'regex-fallback',
      note: 'Using regex fallback. For full AST support, configure web-tree-sitter.'
    };

    this.parserCache.set(language, parser);
    return parser;
  }

  static extractFunctionCalls(content, language = 'javascript') {
    const pattern = CALL_PATTERNS[language] || CALL_PATTERNS.javascript;
    const calls = [];
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const call = match[1];
      if (call && !this.isKeyword(call)) {
        calls.push(call);
      }
    }

    return [...new Set(calls)]; // Remove duplicates
  }

  static extractFunctionDefinitions(content, language = 'javascript') {
    const pattern = FUNCTION_PATTERNS[language] || FUNCTION_PATTERNS.javascript;
    const functions = [];
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const func = match[1] || match[2] || match[3];
      if (func && !this.isKeyword(func)) {
        functions.push({
          name: func,
          startPos: match.index,
          content: this.extractFunctionBody(content, match.index, language)
        });
      }
    }

    return functions;
  }

  static buildAST(content, language = 'javascript') {
    // Fallback AST representation using regex analysis
    const functions = this.extractFunctionDefinitions(content, language);
    const calls = this.extractFunctionCalls(content, language);

    return {
      type: 'program',
      language,
      parsed: true,
      functions: functions,
      calls: calls,
      metadata: {
        totalFunctions: functions.length,
        totalCalls: calls.length,
        languages: [language]
      }
    };
  }

  static extractFunctionBody(content, startIndex, language) {
    // Find the function body by matching braces
    let braceCount = 0;
    let inBody = false;
    let startPos = startIndex;

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        if (!inBody) {
          inBody = true;
          startPos = i;
        }
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0 && inBody) {
          return content.substring(startPos, i + 1);
        }
      }
    }

    return '';
  }

  static traverseAST(ast, visitor) {
    // Generic AST traversal
    const visit = (node, parent = null) => {
      if (visitor[node.type]) {
        visitor[node.type](node, parent);
      }

      if (node.children) {
        node.children.forEach(child => visit(child, node));
      }
    };

    visit(ast);
  }

  static isKeyword(word) {
    const keywords = new Set([
      'if', 'else', 'for', 'while', 'do', 'return', 'throw', 'try', 'catch',
      'finally', 'switch', 'case', 'break', 'continue', 'function', 'class',
      'const', 'let', 'var', 'new', 'delete', 'typeof', 'instanceof',
      'def', 'class', 'import', 'from', 'as', 'with', 'import', 'export'
    ]);
    return keywords.has(word);
  }

  static analyzeComplexity(ast) {
    // Calculate cyclomatic complexity from AST
    let complexity = 1;
    
    if (ast.functions) {
      ast.functions.forEach(func => {
        // Count decision points in function body
        const body = func.content || '';
        complexity += (body.match(/if|else|case|while|for|catch|&&|\|\|/g) || []).length;
      });
    }

    return complexity;
  }

  static detectImports(content, language = 'javascript') {
    const imports = [];

    if (language === 'javascript') {
      // import statements
      const importPattern = /import\s+(?:{[^}]*}|.*?)\s+from\s+['"](.+?)['"]/g;
      let match;
      while ((match = importPattern.exec(content)) !== null) {
        imports.push({ type: 'es6', path: match[1], fullMatch: match[0] });
      }

      // require statements
      const requirePattern = /require\s*\(\s*['"](.+?)['"]\s*\)/g;
      while ((match = requirePattern.exec(content)) !== null) {
        imports.push({ type: 'commonjs', path: match[1], fullMatch: match[0] });
      }
    } else if (language === 'python') {
      // Python imports
      const importPattern = /from\s+(.+?)\s+import|import\s+(.+?)(?:\s+as|$)/g;
      let match;
      while ((match = importPattern.exec(content)) !== null) {
        imports.push({ type: 'python', path: match[1] || match[2], fullMatch: match[0] });
      }
    } else if (language === 'java') {
      // Java imports
      const importPattern = /import\s+(?:static\s+)?(.+?);/g;
      let match;
      while ((match = importPattern.exec(content)) !== null) {
        imports.push({ type: 'java', path: match[1], fullMatch: match[0] });
      }
    }

    return imports;
  }
}

export default TreeSitterParser;
