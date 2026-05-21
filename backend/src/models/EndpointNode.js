/**
 * EndpointNode Model
 * Represents an API endpoint declaration
 * ID format: METHOD:/path (e.g., GET:/, POST:/api/users)
 */
class EndpointNode {
  constructor(data = {}) {
    this.method = data.method || 'GET'; // GET, POST, PUT, DELETE, PATCH
    this.path = data.path || '';
    // Generate ID in format: METHOD:/path
    this.id = data.id || `${this.method}:${this.path}`;
    
    this.handler = data.handler || '';
    this.handlerFunctionId = data.handlerFunctionId || ''; // Format: file#functionName
    this.handlerFile = data.handlerFile || '';
    this.handlerLine = data.handlerLine || 0; // Line where handler is defined
    this.line = data.line || this.handlerLine || 0; // Alias for handlerLine
    
    this.middleware = data.middleware || [];
    this.requestSchema = data.requestSchema || {
      params: {},
      body: {},
      headers: {}
    };
    this.responseSchema = data.responseSchema || {
      status: 200,
      body: {}
    };
    this.description = data.description || '';
    this.tags = data.tags || [];
    this.framework = data.framework || null;
  }

  toJSON() {
    return {
      id: this.id,
      path: this.path,
      method: this.method,
      handlerFunctionId: this.handlerFunctionId,
      handlerFile: this.handlerFile,
      line: this.line
    };
  }
}

module.exports = EndpointNode;
