/**
 * Import Detector
 * Extracts import/require statements from source code
 */

class ImportDetector {
  static detectImports(fileContent, language) {
    if (language === 'javascript' || language === 'typescript') {
      return this.detectJavaScriptImports(fileContent);
    } else if (language === 'python') {
      return this.detectPythonImports(fileContent);
    } else if (language === 'java') {
      return this.detectJavaImports(fileContent);
    }
    return [];
  }

  static detectJavaScriptImports(content) {
    const imports = [];

    // ES6 import statements: import ... from '...'
    const es6ImportRegex = /import\s+(?:(?:{[^}]*}|[^'"]*)\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      if (match[1]) imports.push(match[1]);
    }

    // CommonJS require: require('...')
    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      if (match[1] && !imports.includes(match[1])) {
        imports.push(match[1]);
      }
    }

    return [...new Set(imports)]; // Remove duplicates
  }

  static detectPythonImports(content) {
    const imports = [];

    // import x
    const importRegex = /^import\s+([^\s,]+)/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) imports.push(match[1]);
    }

    // from x import y
    const fromImportRegex = /^from\s+([^\s]+)\s+import/gm;
    while ((match = fromImportRegex.exec(content)) !== null) {
      if (match[1] && !imports.includes(match[1])) {
        imports.push(match[1]);
      }
    }

    return [...new Set(imports)];
  }

  static detectJavaImports(content) {
    const imports = [];

    // import x.y.z;
    const importRegex = /^import\s+([^\s;]+)/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) imports.push(match[1]);
    }

    return [...new Set(imports)];
  }

  static detectFileRole(filename, fileContent) {
    const name = filename.toLowerCase();

    // Check filename patterns
    if (name.includes('server') || name.includes('app.js') || name.includes('index.js')) return 'server';
    if (name.includes('route') || name.includes('controller')) return 'controller';
    if (name.includes('service') || name.includes('service')) return 'service';
    if (name.includes('component') || name.includes('.jsx')) return 'component';
    if (name.includes('page') || name.includes('pages')) return 'page';
    if (name.includes('util') || name.includes('helper')) return 'utility';
    if (name.includes('model') || name.includes('schema')) return 'model';
    if (name.includes('middleware')) return 'middleware';
    if (name.includes('config')) return 'config';

    // Default based on content patterns
    if (fileContent.includes('export default') && fileContent.includes('jsx')) return 'component';
    if (fileContent.includes('express') || fileContent.includes('app.')) return 'server';

    return 'utility';
  }
}

module.exports = ImportDetector;
