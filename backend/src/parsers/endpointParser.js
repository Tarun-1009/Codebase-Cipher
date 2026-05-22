/**
 * Endpoint Parser - API Route Extraction
 * Detects API endpoints from Express, FastAPI, Flask, Spring Boot.
 * Also captures the handlerFunction name (named reference or anonymous).
 */

const EndpointNode = require('../models/EndpointNode');

class EndpointParser {
  static deriveHandlerName(method, path) {
    if (!path || path === '/' || path === '*') {
      return `${method.toLowerCase()}Root`;
    }
    const cleanPath = path.replace(/[:{}<>]/g, ''); // remove param markers
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments.length === 0) return `${method.toLowerCase()}Root`;
    
    const origSegments = path.split('/').filter(Boolean);
    const camelSegments = segments.map((seg, idx) => {
      const origSeg = origSegments[idx] || '';
      const isParam = origSeg.startsWith(':') || (origSeg.startsWith('{') && origSeg.endsWith('}')) || (origSeg.startsWith('<') && origSeg.endsWith('>'));
      let name = seg.replace(/[^a-zA-Z0-9_$]/g, '');
      if (!name) return '';
      name = name.charAt(0).toUpperCase() + name.slice(1);
      return isParam ? `By${name}` : name;
    });
    
    return `${method.toLowerCase()}${camelSegments.filter(Boolean).join('')}`;
  }

  static async parseEndpoints(fileContent, language, filename) {
    if (language === 'javascript' || language === 'typescript') {
      return this.parseJavaScriptEndpoints(fileContent, filename);
    } else if (language === 'python') {
      return this.parsePythonEndpoints(fileContent, filename);
    } else if (language === 'java') {
      return this.parseJavaEndpoints(fileContent, filename);
    }
    return [];
  }

  // ---------------------------------------------------------------------------
  // JavaScript / TypeScript — Express.js style
  // ---------------------------------------------------------------------------
  static parseJavaScriptEndpoints(content, filename) {
    const endpoints = [];
    const lines = content.split('\n');
    let anonCount = 0;

    const routeStartRe = /(?:app|router)\.(get|post|put|delete|patch|head|options|use)\s*\(/g;
    let match;

    while ((match = routeStartRe.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const startIdx = match.index + match[0].length;
      const lineNum = content.substring(0, match.index).split('\n').length;

      // Find matching closing parenthesis
      let depth = 1;
      let endIdx = -1;
      let inString = false;
      let stringChar = null;
      let escape = false;

      for (let i = startIdx; i < content.length; i++) {
        const char = content[i];

        if (escape) {
          escape = false;
          continue;
        }

        if (char === '\\') {
          escape = true;
          continue;
        }

        if (inString) {
          if (char === stringChar) {
            inString = false;
            stringChar = null;
          }
          continue;
        }

        if (char === "'" || char === '"' || char === '`') {
          inString = true;
          stringChar = char;
          continue;
        }

        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }

      if (endIdx === -1) continue;

      const argsStr = content.substring(startIdx, endIdx);

      // Split argsStr by comma at depth 0
      const args = [];
      let currentArg = '';
      let argDepth = 0;
      let argInString = false;
      let argStringChar = null;
      let argEscape = false;

      for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];

        if (argEscape) {
          argEscape = false;
          currentArg += char;
          continue;
        }

        if (char === '\\') {
          argEscape = true;
          currentArg += char;
          continue;
        }

        if (argInString) {
          currentArg += char;
          if (char === argStringChar) {
            argInString = false;
            argStringChar = null;
          }
          continue;
        }

        if (char === "'" || char === '"' || char === '`') {
          argInString = true;
          argStringChar = char;
          currentArg += char;
          continue;
        }

        if (char === '(' || char === '[' || char === '{') {
          argDepth++;
          currentArg += char;
        } else if (char === ')' || char === ']' || char === '}') {
          argDepth--;
          currentArg += char;
        } else if (char === ',' && argDepth === 0) {
          args.push(currentArg.trim());
          currentArg = '';
        } else {
          currentArg += char;
        }
      }
      if (currentArg.trim()) {
        args.push(currentArg.trim());
      }

      if (args.length === 0) continue;

      // Path is the first argument
      const path = args[0].replace(/^['"`]|['"`]$/g, '');

      // Skip global middleware mounts that don't specify a valid path (e.g. app.use(cors()))
      if (!/^\/|^\*/.test(path)) continue;

      // Handler is the last argument
      const handlerArg = args[args.length - 1];
      if (!handlerArg) continue;

      if (method === 'USE') {
        const isMiddleware = handlerArg.includes('(') || 
                             handlerArg.includes(')') ||
                             /\b(cors|json|urlencoded|static|cookieParser|morgan|helmet|compression|bodyParser|session|passport|csrf|multer)\b/i.test(handlerArg);
        if (isMiddleware) continue;
      }

      let handlerFunction = null;
      const isInline = handlerArg.includes('=>') || 
                       /\bfunction\b/.test(handlerArg) || 
                       handlerArg.startsWith('async');

      if (isInline) {
        // Try to extract a meaningful function name from the inline body
        const genericNames = [
          'require', 'json', 'send', 'status', 'next', 'log', 'error', 'req', 'res', 'response', 'request',
          'Promise', 'Object', 'Array', 'String', 'Number', 'Boolean', 'eval',
          'map', 'forEach', 'filter', 'reduce', 'find', 'push', 'pop', 'shift', 'unshift', 'split', 'join',
          'replace', 'substring', 'substr', 'concat', 'slice', 'splice', 'keys', 'values', 'entries', 'toString',
          'logger', 'log', 'info', 'debug', 'warn', 'error', 'console', 'exec',
          'async', 'function', 'catch', 'then', 'if', 'for', 'while', 'switch'
        ];
        let extractedName = null;
        
        // Match standard function/method calls inside the body, capturing only the call chain
        const regex = /(?:await\s+)?([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\s*\(/g;
        let m;
        while ((m = regex.exec(handlerArg)) !== null) {
          const fullCall = m[1];
          const parts = fullCall.split('.');
          const name = parts[parts.length - 1].trim();
          if (!genericNames.includes(name) && !genericNames.includes(parts[0])) {
            extractedName = name;
            break;
          }
        }
        handlerFunction = extractedName || this.deriveHandlerName(method, path);
      } else {
        // Named handler, e.g. "articleService.getArticles"
        const parts = handlerArg.split('.');
        handlerFunction = parts[parts.length - 1].trim();
      }

      // Middlewares are args in between path and handler
      const middleware = args.slice(1, -1).map(arg => {
        return arg.replace(/^\[|\]$/g, '').trim();
      }).filter(Boolean);

      endpoints.push(new EndpointNode({
        path,
        method,
        handlerFile: filename,
        handlerLine: lineNum,
        handlerFunction,
        middleware,
        framework: 'express'
      }));
    }

    return endpoints;
  }

  // ---------------------------------------------------------------------------
  // Python — FastAPI + Flask
  // ---------------------------------------------------------------------------
  static parsePythonEndpoints(content, filename) {
    const endpoints = [];
    const lines = content.split('\n');

    // FastAPI: @app.get("/path") or @router.post("/path")
    const fastAPIRe = /@(?:app|router|api_router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let m;
    while ((m = fastAPIRe.exec(content)) !== null) {
      const lineNum = content.substring(0, m.index).split('\n').length;
      // The function def is on the NEXT non-empty line
      let handlerFunction = null;
      for (let i = lineNum; i < Math.min(lineNum + 3, lines.length); i++) {
        const defMatch = lines[i].match(/^\s*(?:async\s+)?def\s+(\w+)/);
        if (defMatch) { handlerFunction = defMatch[1]; break; }
      }
      const derivedMethod = m[1].toUpperCase();
      endpoints.push(new EndpointNode({
        path: m[2],
        method: derivedMethod,
        handlerFile: filename,
        handlerLine: lineNum + 1,
        handlerFunction: handlerFunction || this.deriveHandlerName(derivedMethod, m[2]),
        framework: 'fastapi'
      }));
    }

    // Flask: @app.route('/path', methods=['GET','POST'])
    const flaskRe = /@(?:app|blueprint|bp)\.route\s*\(\s*['"`]([^'"`]+)['"`](?:,\s*methods\s*=\s*\[([^\]]+)\])?/g;
    while ((m = flaskRe.exec(content)) !== null) {
      const lineNum = content.substring(0, m.index).split('\n').length;
      const methods = m[2]
        ? m[2].split(',').map(s => s.trim().replace(/['"`]/g, ''))
        : ['GET'];

      let handlerFunction = null;
      for (let i = lineNum; i < Math.min(lineNum + 3, lines.length); i++) {
        const defMatch = lines[i].match(/^\s*def\s+(\w+)/);
        if (defMatch) { handlerFunction = defMatch[1]; break; }
      }

      methods.forEach(method => {
        const derivedMethod = method.toUpperCase();
        endpoints.push(new EndpointNode({
          path: m[1],
          method: derivedMethod,
          handlerFile: filename,
          handlerLine: lineNum + 1,
          handlerFunction: handlerFunction || this.deriveHandlerName(derivedMethod, m[1]),
          framework: 'flask'
        }));
      });
    }

    return endpoints;
  }

  // ---------------------------------------------------------------------------
  // Java — Spring Boot
  // ---------------------------------------------------------------------------
  static parseJavaEndpoints(content, filename) {
    const endpoints = [];
    const lines = content.split('\n');

    // @GetMapping("/path") @PostMapping @RequestMapping(value="/path", method=RequestMethod.GET)
    const springRe = /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*\(\s*(?:value\s*=\s*)?['"`]([^'"`]+)['"`]/g;
    let m;
    while ((m = springRe.exec(content)) !== null) {
      const lineNum = content.substring(0, m.index).split('\n').length;
      const methodWord = m[1].replace('Mapping', '').toUpperCase();
      const httpMethod = methodWord === 'REQUEST' ? 'GET' : methodWord;

      // Find the method declaration on the next few lines
      let handlerFunction = null;
      for (let i = lineNum; i < Math.min(lineNum + 5, lines.length); i++) {
        const methodMatch = lines[i].match(/(?:public|private|protected)\s+\S+\s+(\w+)\s*\(/);
        if (methodMatch) { handlerFunction = methodMatch[1]; break; }
      }

      endpoints.push(new EndpointNode({
        path: m[2],
        method: httpMethod,
        handlerFile: filename,
        handlerLine: lineNum + 1,
        handlerFunction: handlerFunction || this.deriveHandlerName(httpMethod, m[2]),
        framework: 'spring'
      }));
    }

    return endpoints;
  }
}

module.exports = EndpointParser;
