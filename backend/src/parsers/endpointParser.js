/**
 * Endpoint Parser - API Route Extraction
 * Extracts API endpoint declarations from source code
 * Currently provides simplified implementation for immediate functionality
 */

const EndpointNode = require('../models/EndpointNode');

class EndpointParser {
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

  static parseJavaScriptEndpoints(content, filename) {
    const endpoints = [];
    const lines = content.split('\n');

    // Express.js routes: app.get('/path', ...) or router.post('/path', ...)
    // This regex captures the full route call to find the handler line
    const expressRegex = /(?:app|router)\.(get|post|put|delete|patch|head|options)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?\(.*?\)\s*=>/g;
    let match;
    while ((match = expressRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      endpoints.push(new EndpointNode({
        path: match[2],
        method: match[1].toUpperCase(),
        handlerFile: filename,
        handlerLine: lineNum,
        framework: 'express'
      }));
    }

    return endpoints;
  }

  static parsePythonEndpoints(content, filename) {
    const endpoints = [];

    // FastAPI routes: @app.get('/path') or @app.post()
    const fastAPIRegex = /@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = fastAPIRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      endpoints.push(new EndpointNode({
        path: match[2],
        method: match[1].toUpperCase(),
        handlerFile: filename,
        handlerLine: lineNum,
        framework: 'fastapi'
      }));
    }

    // Flask routes: @app.route('/path')
    const flaskRegex = /@(?:app|blueprint)\.route\s*\(\s*['"`]([^'"`]+)['"`](?:,\s*methods\s*=\s*\[([^\]]+)\])?/g;
    while ((match = flaskRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const methods = match[2] ? match[2].split(',').map(m => m.trim().replace(/['"]/g, '')) : ['GET'];
      
      methods.forEach(method => {
        endpoints.push(new EndpointNode({
          path: match[1],
          method: method.toUpperCase(),
          handlerFile: filename,
          handlerLine: lineNum,
          framework: 'flask'
        }));
      });
    }

    return endpoints;
  }

  static parseJavaEndpoints(content, filename) {
    const endpoints = [];

    // Spring Boot annotations: @GetMapping("/path") or @PostMapping
    const springRegex = /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*\(\s*(?:value\s*=\s*)?['"`]?([^'"`\)]+)['"`]?/g;
    let match;
    while ((match = springRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const method = match[1].replace('Mapping', '').toUpperCase() || 'GET';
      
      endpoints.push(new EndpointNode({
        path: match[2],
        method: method,
        handlerFile: filename,
        handlerLine: lineNum,
        framework: 'spring'
      }));
    }

    return endpoints;
  }
}

module.exports = EndpointParser;
