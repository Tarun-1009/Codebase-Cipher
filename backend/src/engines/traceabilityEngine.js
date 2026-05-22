/**
 * Traceability Engine
 * Builds the complete traceability data from parsed functions, endpoints and file map.
 *
 * Exports:
 *   resolveCallGraph(functions, fileMap)  → populates func.calls / func.calledBy
 *   buildTraceabilityGraph(functions)     → { nodes[], edges[] } for ReactFlow
 *   buildSequences(endpoints, functions)  → sequences[] with steps[] & branches[]
 *   resolveEndpointCallChains(endpoints, functions) → adds callChain[] to each endpoint
 */

// Skip synthetic route handler names in display
const isRouteHandler = (f) => f.name.startsWith('__route_');

// Display name for a function
const displayName = (f) => isRouteHandler(f) ? 'Handler' : f.name;

// ---------------------------------------------------------------------------
// Helper: resolve a relative import path to full repo path (no extension)
// ---------------------------------------------------------------------------
function resolvePath(fromFile, importPath) {
  if (typeof importPath !== 'string') return importPath;
  let cleanImportPath = importPath.replace(/^[@~]\//, 'src/');
  if (!cleanImportPath.startsWith('.')) return cleanImportPath;
  const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
  const parts = (fromDir ? fromDir.split('/') : []).concat(cleanImportPath.split('/'));
  const resolved = [];
  for (const p of parts) {
    if (p === '.' || p === '') continue;
    if (p === '..') resolved.pop();
    else resolved.push(p);
  }
  return resolved.join('/');
}

function isPathMatch(pathA, pathB) {
  if (pathA === pathB) return true;
  if (typeof pathA !== 'string' || typeof pathB !== 'string') return false;
  const cleanA = pathA.replace(/^\//, '');
  const cleanB = pathB.replace(/^\//, '');
  if (cleanA === cleanB) return true;
  if (cleanA.endsWith('/' + cleanB) || cleanB.endsWith('/' + cleanA)) return true;
  return false;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// 1. Resolve Call Graph
//    For every function A, scan its body for \bfuncBName\s*( patterns.
//    Verify funcB.file is either the same file or in A's file's imports.
// ---------------------------------------------------------------------------
function resolveCallGraph(functions, fileMap) {
  // Build a lookup: file → Set of reachable file paths (self + imports)
  const fileImportTargets = new Map();
  fileMap.forEach((info, filePath) => {
    const targets = new Set([filePath]);
    (info.imports || []).forEach(imp => {
      // 1. Try relative path resolution
      const resolved = resolvePath(filePath, imp.path);
      if (resolved) {
        [resolved, resolved + '.js', resolved + '.ts', resolved + '.jsx',
         resolved + '.tsx', resolved + '.py', resolved + '.java',
         resolved + '/index.js', resolved + '/index.ts', resolved + '/index.jsx',
         resolved + '/index.tsx'].forEach(p => targets.add(p));
      }
      
      // 2. Try as root path in the repository
      if (typeof imp.path === 'string') {
        const rootResolved = imp.path.replace(/^[@~]\//, 'src/');
        [rootResolved, rootResolved + '.js', rootResolved + '.ts', rootResolved + '.jsx',
         rootResolved + '.tsx', rootResolved + '.py', rootResolved + '.java',
         rootResolved + '/index.js', rootResolved + '/index.ts', rootResolved + '/index.jsx',
         rootResolved + '/index.tsx'].forEach(p => targets.add(p));
      }
    });
    fileImportTargets.set(filePath, targets);
  });

  const GENERIC_NAMES = new Set([
    'find', 'create', 'update', 'delete', 'destroy', 'remove', 'add', 'get', 'post', 'put', 'patch',
    'send', 'json', 'status', 'sendDate', 'write', 'read', 'index', 'show', 'all', 'one', 'list',
    'save', 'next', 'use', 'start', 'stop', 'run', 'execute', 'config', 'init', 'setup', 'clear',
    'reset', 'render', 'redirect', 'error', 'success', 'fail', 'login', 'logout', 'auth', 'connect',
    'query', 'map', 'filter', 'reduce', 'forEach', 'then', 'catch', 'finally', 'wait', 'sleep'
  ]);

  const EXCLUDED_PREFIXES = new Set([
    'db', 'res', 'req', 'Object', 'Array', 'console', 'express', 'cors', 'app', 'fs', 'path',
    'process', 'Math', 'JSON', 'response', 'request', 'conn', 'connection', 'client', 'server',
    'socket', 'e', 'err', 'error', 'router', 'route', 'middleware', 'next', 'config', 'env',
    'Promise', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Map', 'Set', 'Symbol', 'Reflect',
    'Proxy', 'window', 'document', 'global', 'module', 'exports', 'require', 'import',
    'logger', 'log', 'ctx', 'context', 'session', 'cookie', 'jwt', 'auth'
  ]);

  // For each function A, find calls to other functions B
  functions.forEach(funcA => {
    const bodyText = funcA.bodyText || '';
    if (!bodyText) return;

    const reachable = fileImportTargets.get(funcA.file) || new Set([funcA.file]);

    functions.forEach(funcB => {
      if (funcA.id === funcB.id) return;
      
      // Determine if B is reachable from A (same file or explicitly imported target)
      let isReachable = funcA.file === funcB.file;
      if (!isReachable) {
        for (const p of reachable) {
          if (isPathMatch(p, funcB.file)) {
            isReachable = true;
            break;
          }
        }
      }
      
      // Dynamic Fallback: if B is an exported service, repository, or model function,
      // and has a sufficiently unique name (length >= 4), resolve call even without explicit import detect.
      if (!isReachable && funcB.scope === 'exported' && funcB.name.length >= 4) {
        const role = fileMap.get(funcB.file)?.role;
        if (['service', 'repository', 'model'].includes(role)) {
          isReachable = true;
        }
      }
      
      if (!isReachable) return;
      
      // Skip matching against very short/generic names
      if (funcB.name.length < 2) return;
      // Skip internal synthetic names
      if (isRouteHandler(funcB)) return;

      try {
        let hasValidCall = false;
        const callRe = new RegExp(`(?:(\\b\\w+)\\s*\\.\\s*)?\\b${escapeRegex(funcB.name)}\\s*\\(`, 'g');
        let m;

        while ((m = callRe.exec(bodyText)) !== null) {
          const prefix = m[1]; // could be undefined if no dot prefix
          let isValid = false;

          if (funcA.file === funcB.file) {
            // Case 1: Same file
            if (!prefix || prefix === 'this' || prefix === 'self') {
              isValid = true;
            } else if (!EXCLUDED_PREFIXES.has(prefix)) {
              isValid = true;
            }
          } else {
            // Case 2: Different files (B is imported in A)
            const aImports = fileMap.get(funcA.file)?.imports || [];
            let matchingImport = null;

            for (const imp of aImports) {
              const resolvedSet = new Set();
              const resolved = resolvePath(funcA.file, imp.path);
              if (resolved) {
                [resolved, resolved + '.js', resolved + '.ts', resolved + '.jsx',
                 resolved + '.tsx', resolved + '.py', resolved + '.java',
                 resolved + '/index.js', resolved + '/index.ts', resolved + '/index.jsx',
                 resolved + '/index.tsx'].forEach(p => resolvedSet.add(p));
              }
              if (typeof imp.path === 'string') {
                const rootResolved = imp.path.replace(/^[@~]\//, 'src/');
                [rootResolved, rootResolved + '.js', rootResolved + '.ts', rootResolved + '.jsx',
                 rootResolved + '.tsx', rootResolved + '.py', rootResolved + '.java',
                 rootResolved + '/index.js', rootResolved + '/index.ts', rootResolved + '/index.jsx',
                 rootResolved + '/index.tsx'].forEach(p => resolvedSet.add(p));
              }

              let matches = false;
              for (const p of resolvedSet) {
                if (isPathMatch(p, funcB.file)) {
                  matches = true;
                  break;
                }
              }
              if (matches) {
                matchingImport = imp;
                break;
              }
            }

            if (matchingImport) {
              const rawWithoutPath = matchingImport.raw ? matchingImport.raw.replace(/['"`][^'"`]+['"`]/g, '') : '';
              const isDestructured = new RegExp(`\\b${escapeRegex(funcB.name)}\\b`).test(rawWithoutPath);

              if (isDestructured) {
                if (!prefix || prefix === 'this' || prefix === 'self') {
                  isValid = true;
                } else if (!EXCLUDED_PREFIXES.has(prefix)) {
                  isValid = true;
                }
              } else {
                if (prefix && prefix === matchingImport.name) {
                  isValid = true;
                }
              }
            } else {
              // Dynamic Fallback without explicit import statement
              const baseName = funcB.file.split('/').pop().replace(/\.[^.]+$/, '');
              if (prefix && prefix === baseName) {
                isValid = true;
              } else if (!prefix) {
                if (!GENERIC_NAMES.has(funcB.name) && funcB.name.length >= 6) {
                  isValid = true;
                }
              }
            }
          }

          if (isValid) {
            hasValidCall = true;
            break;
          }
        }

        if (hasValidCall) {
          if (!funcA.calls.includes(funcB.id)) funcA.calls.push(funcB.id);
          if (!funcB.calledBy.includes(funcA.id)) funcB.calledBy.push(funcA.id);
        }
      } catch (_) { /* skip */ }
    });
  });
}

// ---------------------------------------------------------------------------
// 2. Build Traceability Graph (ReactFlow-compatible nodes + edges)
//    Only functions with at least one call relationship are included.
//    Synthetic __route_ handlers are excluded from graph nodes.
// ---------------------------------------------------------------------------
function buildTraceabilityGraph(functions, fileMap) {
  const nodes = [];
  const edges = [];
  const edgeSeen = new Set();
  const nodeSeen = new Set();

  // Active = has calls or calledBy, and is NOT synthetic
  const activeFuncs = functions.filter(f =>
    !isRouteHandler(f) && (f.calls.length > 0 || f.calledBy.length > 0)
  );

  activeFuncs.forEach(func => {
    const fileInfo = fileMap ? fileMap.get(func.file) : null;
    const role = fileInfo ? fileInfo.role : 'utility';

    if (!nodeSeen.has(func.id)) {
      nodeSeen.add(func.id);
      nodes.push({
        id: func.id,
        label: `${func.name}()`,
        file: func.file,
        type: role,
        line: func.line,
        isAsync: func.isAsync,
        parameters: func.parameters
      });
    }

    // Edges — only to non-synthetic targets
    func.calls.forEach(targetId => {
      if (targetId.includes('#__route_')) return; // skip synthetic
      const edgeId = `${func.id}__${targetId}`;
      if (!edgeSeen.has(edgeId)) {
        edgeSeen.add(edgeId);
        edges.push({ id: edgeId, source: func.id, target: targetId, label: 'calls' });
      }
    });
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// 3. Build Sequences — one per endpoint
//    DFS walk from handler through call graph.
//    Each real function becomes a step; branches form on secondary calls.
// ---------------------------------------------------------------------------
function buildSequences(endpoints, functions, fileMap) {
  const funcById = new Map(functions.map(f => [f.id, f]));

  return endpoints.map(ep => {
    const visited = new Set();
    const steps = [];
    const branches = [];

    // ── Entry step ──
    steps.push({
      id: 'step-entry',
      num: '1',
      type: 'entry',
      component: 'HTTP Request',
      name: `${ep.method} ${ep.path}`,
      file: ep.handlerFile,
      latency: '0ms',
      overview: `Client sends ${ep.method} request to ${ep.path}. Framework routes it to the handler in ${ep.handlerFile}.`,
      keyFunctions: [],
      inputs: [{ name: 'req', type: 'Request' }, { name: 'res', type: 'Response' }],
      outputs: [],
      prevStep: 'Client',
      nextStep: ''
    });

    // ── Walk from handler ──
    const handlerFunc =
      funcById.get(ep.handlerFunctionId) ||
      functions.find(f => f.file === ep.handlerFile && f.name === ep.handlerFunction);

    if (handlerFunc) {
      // If it's a route handler, walk its calls directly (don't add the synthetic step itself)
      if (isRouteHandler(handlerFunc)) {
        handlerFunc.calls.forEach(callId => {
          const callee = funcById.get(callId);
          if (callee) {
            _dfsSteps(callee, funcById, fileMap, visited, steps, branches);
          }
        });
      } else {
        _dfsSteps(handlerFunc, funcById, fileMap, visited, steps, branches);
      }
    }

    // ── Response step ──
    steps.push({
      id: 'step-response',
      num: String(steps.length + 1),
      type: 'response',
      component: 'Response Sent',
      name: '200 OK',
      file: ep.handlerFile,
      latency: '10ms',
      overview: 'Returns HTTP response to the client.',
      keyFunctions: [],
      inputs: [],
      outputs: [{ name: 'statusCode', type: 'number' }, { name: 'body', type: 'object' }],
      prevStep: '',
      nextStep: 'Client'
    });

    // ── Link chain ──
    for (let i = 0; i < steps.length; i++) {
      steps[i].prevStep = i === 0 ? 'Client' : steps[i - 1].component;
      steps[i].nextStep = i === steps.length - 1 ? 'Client' : steps[i + 1].component;
    }
    branches.forEach(branch => {
      for (let i = 0; i < branch.steps.length; i++) {
        branch.steps[i].prevStep = i === 0
          ? (steps[1] ? steps[1].component : 'Handler')
          : branch.steps[i - 1].component;
        branch.steps[i].nextStep = i === branch.steps.length - 1
          ? 'Completed'
          : branch.steps[i + 1].component;
      }
    });

    return { endpointId: ep.id, steps, branches };
  });
}

function _dfsSteps(func, funcById, fileMap, visited, steps, branches) {
  if (!func || visited.has(func.id)) return;
  visited.add(func.id);

  const fileInfo = fileMap ? fileMap.get(func.file) : null;
  const role = fileInfo ? fileInfo.role : 'utility';
  const label = _componentLabel(func.name, role);
  const latency = role === 'repository' || role === 'model' ? '35ms'
    : role === 'service' ? '15ms' : '10ms';

  steps.push({
    id: `step-${func.id}`,
    num: String(steps.length + 1),
    type: role,
    component: label,
    name: `${func.name}()`,
    file: func.file,
    latency,
    overview: `Executes ${func.name}() [${role}] defined in ${func.file}.`,
    keyFunctions: func.calls
      .map(id => id.split('#').pop())
      .filter(n => !n.startsWith('__route_')),
    inputs: func.parameters.map(p => ({ name: p, type: 'any' })),
    outputs: [{ name: 'result', type: 'any' }],
    prevStep: '',
    nextStep: ''
  });

  if (func.calls?.length > 0) {
    const realCalls = func.calls.filter(id => {
      const f = funcById.get(id);
      return f && !isRouteHandler(f);
    });

    realCalls.forEach(calleeId => {
      const callee = funcById.get(calleeId);
      if (callee) {
        _dfsSteps(callee, funcById, fileMap, visited, steps, branches);
      }
    });
  }
}

function _componentLabel(funcName, role) {
  const cap = funcName.charAt(0).toUpperCase() + funcName.slice(1);
  const roleLabel = {
    controller: 'Controller', service: 'Service', repository: 'Repository',
    model: 'Model', middleware: 'Middleware', utility: 'Helper',
    server: 'Handler', page: 'Page', component: 'Component'
  }[role] || 'Handler';
  return `${cap} ${roleLabel}`;
}

// ---------------------------------------------------------------------------
// 4. Resolve endpoint callChain (flat ordered list of function IDs)
// ---------------------------------------------------------------------------
function resolveEndpointCallChains(endpoints, functions) {
  const funcById = new Map(functions.map(f => [f.id, f]));

  endpoints.forEach(ep => {
    const chain = [];
    const visited = new Set();

    const handlerFunc =
      funcById.get(ep.handlerFunctionId) ||
      functions.find(f => f.file === ep.handlerFile && f.name === ep.handlerFunction);

    if (handlerFunc) {
      if (isRouteHandler(handlerFunc)) {
        // Skip the synthetic handler itself; start from its callees
        handlerFunc.calls.forEach(callId => {
          const callee = funcById.get(callId);
          if (callee && !isRouteHandler(callee)) _dfsChain(callee, funcById, visited, chain);
        });
      } else {
        _dfsChain(handlerFunc, funcById, visited, chain);
      }
    }
    ep.callChain = chain;
  });
}

function _dfsChain(func, funcById, visited, chain) {
  if (!func || visited.has(func.id)) return;
  visited.add(func.id);
  if (!isRouteHandler(func)) chain.push(func.id);
  (func.calls || []).forEach(callId => {
    const callee = funcById.get(callId);
    if (callee) _dfsChain(callee, funcById, visited, chain);
  });
}

module.exports = {
  resolveCallGraph,
  buildTraceabilityGraph,
  buildSequences,
  resolveEndpointCallChains
};
