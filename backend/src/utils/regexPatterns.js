/**
 * Regex Patterns for parsing different languages
 */

module.exports = {
  // JavaScript patterns
  JS_FUNCTION_DECLARATION: /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)|(?:async\s+)?function\s+(\w+)|function\s+(\w+)/g,
  JS_ARROW_FUNCTION: /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
  JS_CLASS_METHOD: /(\w+)\s*\([^)]*\)\s*{/g,
  JS_CALL_PATTERN: /(\w+)\s*\(/g,

  // Express.js patterns
  EXPRESS_ROUTE: /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"](.*?)['"].*?(?:,\s*(\w+)|\))/g,

  // FastAPI patterns
  FASTAPI_ROUTE: /@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"](.*?)['"].*?\)/g,

  // Flask patterns
  FLASK_ROUTE: /@app\.route\s*\(\s*['"](.*?)['"](?:.*?methods\s*=\s*\[(.*?)\])?\s*\)/g,

  // Python patterns
  PY_FUNCTION_DEFINITION: /(?:async\s+)?def\s+(\w+)\s*\(/g,

  // Java patterns
  JAVA_METHOD_DEFINITION: /(public|private|protected)?\s+(\w+)\s+(\w+)\s*\(/g,
  SPRING_MAPPING: /@(Get|Post|Put|Delete|Patch)Mapping\s*\(\s*['"](.*?)['"]?\s*\)/g,

  // Go patterns
  GO_FUNCTION: /func\s+(?:\([\w\s*]+\)\s+)?(\w+)\s*\(/g,

  // C# patterns
  CSHARP_METHOD: /(?:public|private|protected)?\s+(?:async\s+)?(\w+)\s+(\w+)\s*\(/g,
  CSHARP_ROUTE: /\[Http(?:Get|Post|Put|Delete|Patch)\s*\(\s*['"](.*?)['"]?\s*\)/g
};
