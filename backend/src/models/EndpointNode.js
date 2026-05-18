/**
 * EndpointNode Model
 * Represents an API endpoint declaration
 */
class EndpointNode {
  constructor(data = {}) {
    this.id = data.id || `endpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.path = data.path || '';
    this.method = data.method || 'GET'; // GET, POST, PUT, DELETE, PATCH
    this.handler = data.handler || '';
    this.handlerFile = data.handlerFile || '';
    this.handlerLine = data.handlerLine || 0;
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
      handler: this.handler,
      handlerFile: this.handlerFile,
      handlerLine: this.handlerLine,
      middleware: this.middleware,
      requestSchema: this.requestSchema,
      responseSchema: this.responseSchema,
      description: this.description,
      tags: this.tags,
      framework: this.framework
    };
  }
}

module.exports = EndpointNode;
