/**
 * FunctionNode Model
 * Represents a function declaration in source code
 * ID format: file/path/to/file.js#functionName
 */
class FunctionNode {
  constructor(data = {}) {
    this.file = data.file || '';
    this.name = data.name || '';
    // Generate ID in format: file#functionName
    this.id = data.id || `${this.file}#${this.name}`;
    
    this.type = data.type || 'function'; // 'function', 'method', 'arrow', 'component'
    
    // Line tracking
    this.line = data.line || 0;
    this.startLine = data.startLine || data.line || 0;
    this.endLine = data.endLine || data.line || 0;
    
    this.parameters = data.parameters || [];
    this.returnType = data.returnType || 'void';
    this.scope = data.scope || 'private'; // 'public', 'private', 'exported'
    this.isAsync = data.isAsync || false;
    this.isClass = data.isClass || false;
    this.className = data.className || null;
    
    // Relationships
    this.calledBy = data.calledBy || [];
    this.calls = data.calls || [];
    
    this.description = data.description || '';
    this.codeSnippet = data.codeSnippet || '';
    this.language = data.language || 'unknown';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      line: this.line,
      startLine: this.startLine,
      endLine: this.endLine,
      isAsync: this.isAsync,
      parameters: this.parameters,
      calls: this.calls
    };
  }
}

module.exports = FunctionNode;
