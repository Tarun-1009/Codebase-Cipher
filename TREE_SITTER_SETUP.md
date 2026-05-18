# Tree-Sitter AST Implementation Guide

**100% Pure AST-Based Parsing - No Regex Fallbacks**

## System Architecture

### Backend (Node.js)
All parsing is now driven by tree-sitter AST analysis:
- **functionParser.js**: Extracts function declarations using AST traversal
- **endpointParser.js**: Extracts API endpoints using AST traversal  
- **callGraphBuilder.js**: Builds call graphs from AST relationships

### Frontend (React)
- **treeSitterParser.js**: Frontend AST parsing with web-tree-sitter
- **Components**: Visualization built on AST data structures

---

## Installed Packages

### Backend
```json
{
  "web-tree-sitter": "^0.26.8",
  "tree-sitter-javascript": "^0.25.0",
  "tree-sitter-python": "^0.25.0",
  "tree-sitter-java": "^0.23.5",
  "tree-sitter-go": "^0.25.0",
  "tree-sitter-json": "^0.24.8"
}
```

### Frontend
```json
{
  "react-force-graph": "^1.48.2",
  "d3-force": "^3.0.0",
  "react-syntax-highlighter": "^16.1.1",
  "highlight.js": "^11.11.1",
  "prismjs": "^1.30.0"
}
```

---

## Implementation Details

### Backend Function Parser

```javascript
const Parser = require('web-tree-sitter');
const Language = require('tree-sitter-javascript');

class FunctionParser {
  static async parseFunctions(content, language, filename) {
    await this.initializeParser();
    
    // Set language
    this.parser.setLanguage(Language.default); // or Python, Java, etc.
    
    // Parse content into AST
    const tree = this.parser.parse(content);
    
    // Traverse and extract functions
    this.traverseTree(tree.rootNode, (node) => {
      if (node.type === 'function_declaration') {
        const nameNode = node.childForFieldName('name');
        // Process function...
      }
    });
  }
}
```

### Key AST Node Types

#### JavaScript
- `function_declaration`: `function name() {}`
- `arrow_function`: `const name = () => {}`
- `method_definition`: `name() {}` (in classes)
- `call_expression`: Function calls `func()`
- `import_statement`: Import statements

#### Python
- `function_definition`: `def name():`
- `call`: Function calls `func()`
- `import_statement`: Import statements
- `decorated_definition`: Decorators `@app.route`

#### Java
- `method_declaration`: Method definitions
- `constructor_declaration`: Constructors
- `method_invocation`: Method calls
- `annotation`: Annotations `@GetMapping`
- `import_declaration`: Import statements

---

## How to Use

### 1. Parse JavaScript File
```javascript
const FunctionParser = require('./functionParser');

const code = `
  function greet(name) {
    console.log('Hello ' + name);
  }
`;

const functions = await FunctionParser.parseFunctions(code, 'javascript', 'file.js');
// Returns: [{ name: 'greet', type: 'function', line: 2, ... }]
```

### 2. Extract Function Calls
```javascript
const Frontend = require('treeSitterParser');

const calls = Frontend.extractFunctionCalls(code, 'javascript');
// Returns: ['console.log', ...]
```

### 3. Build Complete AST
```javascript
const ast = Frontend.buildAST(code, 'javascript');
// Returns: {
//   type: 'program',
//   functions: [...],
//   calls: [...],
//   imports: [...],
//   metadata: { totalFunctions, totalCalls, ... }
// }
```

---

## Tree Traversal Pattern

All parsers use this pattern for AST traversal:

```javascript
static traverseTree(node, callback) {
  callback(node);  // Process current node
  
  // Recurse through children
  for (let i = 0; i < node.childCount; i++) {
    this.traverseTree(node.child(i), callback);
  }
}

// Usage:
this.traverseTree(tree.rootNode, (node) => {
  if (node.type === 'function_declaration') {
    // Process function
  }
});
```

---

## Node API Reference

### Node Properties
```javascript
node.type              // Node type string ('function_declaration', etc.)
node.text              // Source text of node
node.startPosition     // { row, column }
node.endPosition       // { row, column }
node.startIndex        // Character offset in source
node.endIndex          // Character offset in source
node.childCount        // Number of child nodes
node.parent            // Parent node
```

### Node Methods
```javascript
node.child(index)                    // Get child by index
node.namedChild(index)               // Get named child
node.childForFieldName(name)         // Get child by field name
node.descendantsOfType(type)         // Get all descendants of type
```

---

## Language-Specific Queries

### Extract All Variables (JavaScript)
```javascript
traverseTree(tree.rootNode, (node) => {
  if (node.type === 'variable_declaration') {
    const declarators = node.children.filter(
      child => child.type === 'variable_declarator'
    );
    declarators.forEach(decl => {
      const name = decl.childForFieldName('name');
      console.log('Variable:', name.text);
    });
  }
});
```

### Extract Function Parameters (Python)
```javascript
traverseTree(tree.rootNode, (node) => {
  if (node.type === 'function_definition') {
    const params = node.childForFieldName('parameters');
    if (params) {
      // Process parameters
    }
  }
});
```

### Extract Class Methods (Java)
```javascript
traverseTree(tree.rootNode, (node) => {
  if (node.type === 'class_declaration') {
    const body = node.childForFieldName('body');
    if (body) {
      // Iterate class members
    }
  }
});
```

---

## Async/Await Pattern

All initialization is async:

```javascript
// Frontend
await TreeSitterParser.initialize();
const ast = TreeSitterParser.buildAST(code, 'javascript');

// Backend
await FunctionParser.initializeParser();
const functions = await FunctionParser.parseFunctions(code, 'javascript', 'file.js');
```

---

## Production Deployment

### 1. Serve WASM Files
Tree-sitter requires WASM files for each language:
```
public/
  tree-sitter-javascript.wasm
  tree-sitter-python.wasm
  tree-sitter-java.wasm
```

### 2. Load in Frontend
```javascript
const Parser = await require('web-tree-sitter');
await Parser.init('/tree-sitter.wasm');
```

### 3. Backend Node.js
Packages are already installed, just initialize:
```javascript
const Parser = require('web-tree-sitter');
await Parser.init();
```

---

## Performance Optimization

### 1. Parser Caching
```javascript
static parserCache = new Map();

static getOrCreateParser(language) {
  if (!this.parserCache.has(language)) {
    const parser = new Parser();
    parser.setLanguage(getLanguage(language));
    this.parserCache.set(language, parser);
  }
  return this.parserCache.get(language);
}
```

### 2. Incremental Parsing
Tree-sitter supports editing existing trees:
```javascript
const newTree = parser.parse(newCode, previousTree);
```

### 3. Language-Specific Traversal
Only traverse relevant nodes:
```javascript
// Good: Only check function declarations
traverseTree(node, (n) => {
  if (n.type === 'function_declaration') { process(n); }
});

// Avoid: Process every single node
traverseTree(node, (n) => { process(n); });
```

---

## Debugging

### Print AST Structure
```javascript
function printAST(node, depth = 0) {
  console.log('  '.repeat(depth) + node.type);
  for (let i = 0; i < node.childCount; i++) {
    printAST(node.child(i), depth + 1);
  }
}

printAST(tree.rootNode);
```

### Find Node by Position
```javascript
static findNodeAtPosition(tree, line, column) {
  const lineOffset = getLineOffset(content, line);
  const pos = lineOffset + column;
  
  let best = null;
  traverseTree(tree.rootNode, (node) => {
    if (node.startIndex <= pos && pos <= node.endIndex) {
      if (!best || node.startIndex > best.startIndex) {
        best = node;
      }
    }
  });
  return best;
}
```

---

## Limitations & Known Issues

1. **Unsupported Languages**: C#, Ruby, PHP (not available in npm yet)
2. **Comments**: Tree-sitter includes comments as separate nodes
3. **Performance**: Large files (>100KB) may need incremental parsing
4. **WASM Size**: Each language adds ~500KB to bundle

---

## Next Steps

1. ✅ All parsers use AST-based extraction
2. ✅ No regex patterns in parsing logic
3. ⏳ Integrate visualization components (call graphs, execution flows)
4. ⏳ Add incremental parsing for large repositories
5. ⏳ Optimize WASM bundle size

---

## Resources

- [tree-sitter Documentation](https://tree-sitter.github.io)
- [web-tree-sitter](https://www.npmjs.com/package/web-tree-sitter)
- [Language Grammars](https://tree-sitter.github.io/tree-sitter/language-bindings)
- [Query Language](https://tree-sitter.github.io/tree-sitter/syntax-highlighting#queries)

