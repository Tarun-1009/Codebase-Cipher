/**
 * Endpoint Parser
 * Extracts API endpoint declarations from source code
 */

const EndpointNode = require('../models/EndpointNode');
const regexPatterns = require('../utils/regexPatterns');

class EndpointParser {
  static parseEndpoints(fileContent, language, filename) {
    const endpoints = [];

    if (language === 'javascript' || language === 'typescript') {
      return this.parseJavaScriptEndpoints(fileContent, filename);
    } else if (language === 'python') {
      return this.parsePythonEndpoints(fileContent, filename);
    } else if (language === 'java') {
      return this.parseJavaEndpoints(fileContent, filename);
    }

    return endpoints;
  }

  static parseJavaScriptEndpoints(content, filename) {
    const endpoints = [];
    let lineNumber = 1;

    // Express.js: app.get('/path', handler) or router.post('/path', middleware, handler)
    const expressPattern = regexPatterns.EXPRESS_ROUTE;
    let match;

    while ((match = expressPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;
      
      const method = match[1].toUpperCase(); // get, post, etc.
      const path = match[2]; // '/api/users'
      const handler = match[3]; // handler function name or inline function

      const endpoint = new EndpointNode({
        path: path,
        method: method,
        handler: handler,
        handlerFile: filename,
        handlerLine: lineNumber,
        framework: 'express'
      });

      endpoints.push(endpoint);
    }

    // FastAPI style (if using Express-like syntax in Node.js): @app.route()
    const decoratorPattern = regexPatterns.FASTAPI_ROUTE;
    while ((match = decoratorPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;

      const method = match[1] || 'GET';
      const path = match[2];

      const endpoint = new EndpointNode({
        path: path,
        method: method,
        handlerFile: filename,
        handlerLine: lineNumber,
        framework: 'fastapi'
      });

      endpoints.push(endpoint);
    }

    return endpoints;
  }

  static parsePythonEndpoints(content, filename) {
    const endpoints = [];
    let lineNumber = 1;

    // FastAPI: @app.get('/path') or @router.post('/path')
    const fastAPIPattern = regexPatterns.FASTAPI_ROUTE;
    let match;

    while ((match = fastAPIPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;

      const method = (match[1] || 'GET').toUpperCase();
      const path = match[2];

      // Find the handler function name on next line
      const nextLineMatch = content.substring(match.index + match[0].length).match(/def\s+(\w+)\s*\(/);
      const handler = nextLineMatch ? nextLineMatch[1] : 'unknown';

      const endpoint = new EndpointNode({
        path: path,
        method: method,
        handler: handler,
        handlerFile: filename,
        handlerLine: lineNumber,
        framework: 'fastapi'
      });

      endpoints.push(endpoint);
    }

    // Flask: @app.route('/path', methods=['GET'])
    const flaskPattern = regexPatterns.FLASK_ROUTE;
    while ((match = flaskPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;

      const path = match[1];
      const methods = match[2] || 'GET';

      const endpoint = new EndpointNode({
        path: path,
        method: methods,
        handlerFile: filename,
        handlerLine: lineNumber,
        framework: 'flask'
      });

      endpoints.push(endpoint);
    }

    return endpoints;
  }

  static parseJavaEndpoints(content, filename) {
    const endpoints = [];
    let lineNumber = 1;

    // Spring Boot: @GetMapping("/path") or @PostMapping
    const springPattern = regexPatterns.SPRING_MAPPING;
    let match;

    while ((match = springPattern.exec(content)) !== null) {
      lineNumber = content.substring(0, match.index).split('\n').length;

      const mapping = match[1]; // GetMapping, PostMapping, etc.
      const method = mapping.replace('Mapping', '').toUpperCase();
      const path = match[2] || '/';

      // Find handler method name on next line
      const nextLineMatch = content.substring(match.index + match[0].length).match(/public\s+[\w<>]+\s+(\w+)\s*\(/);
      const handler = nextLineMatch ? nextLineMatch[1] : 'unknown';

      const endpoint = new EndpointNode({
        path: path,
        method: method,
        handler: handler,
        handlerFile: filename,
        handlerLine: lineNumber,
        framework: 'spring'
      });

      endpoints.push(endpoint);
    }

    return endpoints;
  }
}

module.exports = EndpointParser;
