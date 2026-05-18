/**
 * FunctionNode Model
 * Represents a function declaration in source code
 */
class FunctionNode {
  constructor(data = {}) {
    this.id = data.id || `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = data.name || '';
    this.file = data.file || '';
    this.line = data.line || 0;
    this.type = data.type || 'function'; // 'function', 'method', 'arrow'
    this.parameters = data.parameters || [];
    this.returnType = data.returnType || 'void';
    this.scope = data.scope || 'private'; // 'public', 'private', 'exported'
    this.isAsync = data.isAsync || false;
    this.isClass = data.isClass || false;
    this.className = data.className || null;
    this.calledBy = data.calledBy || [];
    this.calls = data.calls || [];
    this.description = data.description || '';
    this.codeSnippet = data.codeSnippet || '';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      file: this.file,
      line: this.line,
      type: this.type,
      parameters: this.parameters,
      returnType: this.returnType,
      scope: this.scope,
      isAsync: this.isAsync,
      isClass: this.isClass,
      className: this.className,
      calledBy: this.calledBy,
      calls: this.calls,
      description: this.description
    };
  }
}

module.exports = FunctionNode;
