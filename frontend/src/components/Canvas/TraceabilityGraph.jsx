import { useState, useEffect, useMemo } from 'react';
import { 
    FaRoute, 
    FaSearch, 
    FaBoxes, 
    FaShareAlt,
    FaTerminal, 
    FaClock, 
    FaCode,
    FaArrowRight,
    FaTimes,
    FaPlayCircle,
    FaCheckCircle,
    FaExclamationCircle,
    FaDatabase,
    FaServer,
    FaMinus,
    FaPlus,
    FaCompress,
    FaFolderOpen
} from 'react-icons/fa';
import './TraceabilityGraph.css';

// Master dynamic generator for flow traces mapped to endpoints
function getFlowTracesForEndpoint(method, path, handlerFile) {
    const cleanPath = path.toLowerCase();
    const cleanMethod = method.toUpperCase();
    const resource = cleanPath.split('/').filter(Boolean).pop() || 'resource';
    const camelResource = resource.charAt(0).toUpperCase() + resource.slice(1);
    
    let fileBase = handlerFile ? handlerFile.split('/').pop() : '';
    let dirPath = handlerFile ? handlerFile.substring(0, handlerFile.lastIndexOf('/') + 1) : 'src/routes/';
    let routeBase = fileBase.replace('.routes.js', '').replace('.routes.ts', '').replace('.js', '');
    
    let controllerFile = `${dirPath.replace('routes', 'controllers')}${routeBase || 'auth'}.controller.js`;
    let serviceFile = `${dirPath.replace('routes', 'services')}${routeBase || 'auth'}.service.js`;
    let repositoryFile = `prisma/${routeBase || 'user'}.repository.js`;

    if (cleanPath.includes('auth/login')) {
        return {
            steps: [
                {
                    id: 1,
                    num: '1',
                    component: 'HTTP Request',
                    name: 'POST /api/auth/login',
                    file: 'src/routes/auth.routes.js',
                    latency: '120ms',
                    type: 'entry',
                    branch: 'success',
                    overview: 'Entry point: The HTTP client sends a POST request with authentication credentials.',
                    keyFunctions: ['routes.post("/login")', 'rateLimiter', 'validateBody'],
                    inputs: [
                        { name: 'req.body.email', type: 'String' },
                        { name: 'req.body.password', type: 'String' }
                    ],
                    outputs: [
                        { name: 'next()', type: 'Function' }
                    ],
                    prevStep: 'Client Application',
                    nextStep: 'Auth Controller'
                },
                {
                    id: 2,
                    num: '2',
                    component: 'Auth Controller',
                    name: 'login()',
                    file: 'src/controllers/auth.controller.js',
                    latency: '22ms',
                    type: 'controller',
                    branch: 'success',
                    overview: 'Receives verified express request parameters, handles initial input validation, and delegates business logic to Auth Service.',
                    keyFunctions: ['login()', 'handleResponse()'],
                    inputs: [
                        { name: 'req', type: 'Object' },
                        { name: 'res', type: 'Object' }
                    ],
                    outputs: [
                        { name: 'authResponse', type: 'Object' }
                    ],
                    prevStep: 'HTTP Request',
                    nextStep: 'Auth Service'
                },
                {
                    id: 3,
                    num: '3',
                    component: 'Auth Service',
                    name: 'login()',
                    file: 'src/services/auth.service.js',
                    latency: '32ms',
                    type: 'service',
                    branch: 'success',
                    overview: 'Coordinates overall user credential parsing, database lookups, password hash verification, and JWT generation.',
                    keyFunctions: ['login()', 'validateUserCredentials()'],
                    inputs: [
                        { name: 'email', type: 'String' },
                        { name: 'password', type: 'String' }
                    ],
                    outputs: [
                        { name: 'userRecord', type: 'Object' }
                    ],
                    prevStep: 'Auth Controller',
                    nextStep: 'User Repository'
                },
                {
                    id: 4,
                    num: '4',
                    component: 'User Repository',
                    name: 'findByEmail()',
                    file: 'prisma/user.repository.js',
                    latency: '35ms',
                    type: 'repository',
                    branch: 'success',
                    overview: 'Accesses the database layer (PostgreSQL/Prisma) to perform user record lookup by email index.',
                    keyFunctions: ['findByEmail()', 'prisma.user.findUnique()'],
                    inputs: [
                        { name: 'email', type: 'String' }
                    ],
                    outputs: [
                        { name: 'dbUserObj', type: 'Object' }
                    ],
                    prevStep: 'Auth Service',
                    nextStep: 'Password Match'
                },
                {
                    id: 5,
                    num: '5',
                    component: 'Password Match',
                    name: 'compare()',
                    file: 'src/utils/password.util.js',
                    latency: '10ms',
                    type: 'helper',
                    branch: 'success',
                    overview: 'Performs a secure bcrypt asynchronous compare of the raw input password against the retrieved database hash.',
                    keyFunctions: ['compare()', 'bcrypt.compare()'],
                    inputs: [
                        { name: 'plainPassword', type: 'String' },
                        { name: 'hashedPassword', type: 'String' }
                    ],
                    outputs: [
                        { name: 'isMatch', type: 'Boolean' }
                    ],
                    prevStep: 'User Repository',
                    nextStep: 'JWT Service'
                },
                {
                    id: 6,
                    num: '6',
                    component: 'JWT Service',
                    name: 'generateToken()',
                    file: 'src/services/jwt.service.js',
                    latency: '16ms',
                    type: 'service',
                    branch: 'success',
                    overview: 'Signs user metadata payload and issues a JWT token valid for 24 hours.',
                    keyFunctions: ['generateToken()', 'jwt.sign()'],
                    inputs: [
                        { name: 'payload', type: 'Object' },
                        { name: 'secret', type: 'String' }
                    ],
                    outputs: [
                        { name: 'accessToken', type: 'String' }
                    ],
                    prevStep: 'Password Match',
                    nextStep: 'Response Sent'
                },
                {
                    id: 7,
                    num: '7',
                    component: 'Response Sent',
                    name: '200 OK',
                    file: 'src/utils/response.util.js',
                    latency: '23ms',
                    type: 'response',
                    branch: 'success',
                    overview: 'Serializes active developer token details and user profile data into JSON response payload back to client.',
                    keyFunctions: ['sendSuccess()', 'res.status(200).json()'],
                    inputs: [
                        { name: 'token', type: 'String' },
                        { name: 'user', type: 'Object' }
                    ],
                    outputs: [
                        { name: 'responseBody', type: 'JSON' }
                    ],
                    prevStep: 'JWT Service',
                    nextStep: 'Completed'
                }
            ],
            branches: [
                {
                    name: 'Invalid Credentials',
                    branch: 'invalid-creds',
                    steps: [
                        {
                            id: 21,
                            num: '2.1',
                            component: 'Password Mismatch',
                            name: 'throw Unauthorized()',
                            file: 'src/utils/password.util.js',
                            latency: '8ms',
                            type: 'helper',
                            branch: 'invalid-creds',
                            overview: 'Cryptographic bcrypt verification fails; immediately triggers a security unauthorized error context block.',
                            keyFunctions: ['compare()'],
                            inputs: [
                                { name: 'password', type: 'String' }
                            ],
                            outputs: [
                                { name: 'UnauthorizedError', type: 'Error' }
                            ],
                            prevStep: 'Password Match',
                            nextStep: 'Error Middleware'
                        },
                        {
                            id: 22,
                            num: '2.2',
                            component: 'Error Middleware',
                            name: 'handleError()',
                            file: 'src/middlewares/error.middleware.js',
                            latency: '12ms',
                            type: 'middleware',
                            branch: 'invalid-creds',
                            overview: 'Intercepts uncaught runtime exceptions, formats system logs, and maps custom exceptions to standard HTTP codes.',
                            keyFunctions: ['handleError()'],
                            inputs: [
                                { name: 'err', type: 'Error' },
                                { name: 'req', type: 'Object' }
                            ],
                            outputs: [
                                { name: 'next()', type: 'Function' }
                            ],
                            prevStep: 'Password Mismatch',
                            nextStep: 'Response Sent'
                        },
                        {
                            id: 23,
                            num: '2.3',
                            component: 'Response Sent',
                            name: '401 Unauthorized',
                            file: 'src/utils/response.util.js',
                            latency: '15ms',
                            type: 'response',
                            branch: 'invalid-creds',
                            overview: 'Closes HTTP connection context with 401 Unauthorized and standard error message envelope.',
                            keyFunctions: ['res.status(401).json()'],
                            inputs: [
                                { name: 'message', type: 'String' }
                            ],
                            outputs: [
                                { name: 'errorBody', type: 'JSON' }
                            ],
                            prevStep: 'Error Middleware',
                            nextStep: 'Completed'
                        }
                    ]
                },
                {
                    name: 'User Not Found',
                    branch: 'user-not-found',
                    steps: [
                        {
                            id: 31,
                            num: '3.1',
                            component: 'User Not Found',
                            name: 'throw NotFound()',
                            file: 'prisma/user.repository.js',
                            latency: '15ms',
                            type: 'repository',
                            branch: 'user-not-found',
                            overview: 'Database search query yields empty result. Triggers an entity NotFound exception context.',
                            keyFunctions: ['findByEmail()'],
                            inputs: [
                                { name: 'email', type: 'String' }
                            ],
                            outputs: [
                                { name: 'NotFoundError', type: 'Error' }
                            ],
                            prevStep: 'User Repository',
                            nextStep: 'Error Middleware'
                        },
                        {
                            id: 32,
                            num: '3.2',
                            component: 'Error Middleware',
                            name: 'handleError()',
                            file: 'src/middlewares/error.middleware.js',
                            latency: '12ms',
                            type: 'middleware',
                            branch: 'user-not-found',
                            overview: 'Intercepts ast query exceptions, formats error code stack, and routes execution to HTTP response handler.',
                            keyFunctions: ['handleError()'],
                            inputs: [
                                { name: 'err', type: 'Error' }
                            ],
                            outputs: [
                                { name: 'next()', type: 'Function' }
                            ],
                            prevStep: 'User Not Found',
                            nextStep: 'Response Sent'
                        },
                        {
                            id: 33,
                            num: '3.3',
                            component: 'Response Sent',
                            name: '404 Not Found',
                            file: 'src/utils/response.util.js',
                            latency: '18ms',
                            type: 'response',
                            branch: 'user-not-found',
                            overview: 'Concludes client socket connection with a 404 Not Found status payload.',
                            keyFunctions: ['res.status(404).json()'],
                            inputs: [
                                { name: 'message', type: 'String' }
                            ],
                            outputs: [
                                { name: 'errorBody', type: 'JSON' }
                            ],
                            prevStep: 'Error Middleware',
                            nextStep: 'Completed'
                        }
                    ]
                }
            ]
        };
    }

    if (cleanPath.includes('auth/register')) {
        return {
            steps: [
                {
                    id: 1,
                    num: '1',
                    component: 'HTTP Request',
                    name: 'POST /api/auth/register',
                    file: 'src/routes/auth.routes.js',
                    latency: '140ms',
                    type: 'entry',
                    branch: 'success',
                    overview: 'Client submits new registration profile information including password credentials.',
                    keyFunctions: ['routes.post("/register")', 'validateRegisterBody'],
                    inputs: [
                        { name: 'req.body.username', type: 'String' },
                        { name: 'req.body.email', type: 'String' }
                    ],
                    outputs: [{ name: 'next()', type: 'Function' }],
                    prevStep: 'Client',
                    nextStep: 'Auth Controller'
                },
                {
                    id: 2,
                    num: '2',
                    component: 'Auth Controller',
                    name: 'register()',
                    file: 'src/controllers/auth.controller.js',
                    latency: '25ms',
                    type: 'controller',
                    branch: 'success',
                    overview: 'Handles register route parameters and forwards creation request context to Auth Service.',
                    keyFunctions: ['register()'],
                    inputs: [{ name: 'req', type: 'Object' }],
                    outputs: [{ name: 'result', type: 'Object' }],
                    prevStep: 'HTTP Request',
                    nextStep: 'Auth Service'
                },
                {
                    id: 3,
                    num: '3',
                    component: 'Auth Service',
                    name: 'createUser()',
                    file: 'src/services/auth.service.js',
                    latency: '40ms',
                    type: 'service',
                    branch: 'success',
                    overview: 'Hashes passwords using bcrypt, validates uniqueness of email in database, and issues creation instruction.',
                    keyFunctions: ['createUser()', 'hashPassword()'],
                    inputs: [{ name: 'userData', type: 'Object' }],
                    outputs: [{ name: 'createdUser', type: 'Object' }],
                    prevStep: 'Auth Controller',
                    nextStep: 'User Repository'
                },
                {
                    id: 4,
                    num: '4',
                    component: 'User Repository',
                    name: 'save()',
                    file: 'prisma/user.repository.js',
                    latency: '45ms',
                    type: 'repository',
                    branch: 'success',
                    overview: 'Performs Prisma ORM query to write new user record database rows.',
                    keyFunctions: ['save()', 'prisma.user.create()'],
                    inputs: [{ name: 'data', type: 'Object' }],
                    outputs: [{ name: 'savedUser', type: 'Object' }],
                    prevStep: 'Auth Service',
                    nextStep: 'Response Sent'
                },
                {
                    id: 5,
                    num: '5',
                    component: 'Response Sent',
                    name: '201 Created',
                    file: 'src/utils/response.util.js',
                    latency: '18ms',
                    type: 'response',
                    branch: 'success',
                    overview: 'Concludes creation transaction and serializes 201 Created response envelope with userId.',
                    keyFunctions: ['res.status(201).json()'],
                    inputs: [{ name: 'userId', type: 'String' }],
                    outputs: [{ name: 'responseBody', type: 'JSON' }],
                    prevStep: 'User Repository',
                    nextStep: 'Completed'
                }
            ],
            branches: [
                {
                    name: 'Email Already Exists',
                    branch: 'invalid-creds',
                    steps: [
                        {
                            id: 21,
                            num: '2.1',
                            component: 'Email Exists',
                            name: 'throw Conflict()',
                            file: 'prisma/user.repository.js',
                            latency: '10ms',
                            type: 'repository',
                            branch: 'invalid-creds',
                            overview: 'AST database lookup confirms user record with matching email already exists. Throws ConflictException.',
                            keyFunctions: ['findByEmail()'],
                            inputs: [{ name: 'email', type: 'String' }],
                            outputs: [{ name: 'ConflictError', type: 'Error' }],
                            prevStep: 'User Repository',
                            nextStep: 'Error Middleware'
                        },
                        {
                            id: 22,
                            num: '2.2',
                            component: 'Error Middleware',
                            name: 'handleError()',
                            file: 'src/middlewares/error.middleware.js',
                            latency: '12ms',
                            type: 'middleware',
                            branch: 'invalid-creds',
                            overview: 'Handles routing for conflict validation errors and sets status codes.',
                            keyFunctions: ['handleError()'],
                            inputs: [{ name: 'err', type: 'Error' }],
                            outputs: [{ name: 'next()', type: 'Function' }],
                            prevStep: 'Email Exists',
                            nextStep: 'Response Sent'
                        },
                        {
                            id: 23,
                            num: '2.3',
                            component: 'Response Sent',
                            name: '409 Conflict',
                            file: 'src/utils/response.util.js',
                            latency: '14ms',
                            type: 'response',
                            branch: 'invalid-creds',
                            overview: 'Concludes connection context with 409 Conflict state payload.',
                            keyFunctions: ['res.status(409).json()'],
                            inputs: [{ name: 'message', type: 'String' }],
                            outputs: [{ name: 'errorBody', type: 'JSON' }],
                            prevStep: 'Error Middleware',
                            nextStep: 'Completed'
                        }
                    ]
                }
            ]
        };
    }

    // Generic fallback for any AST parsed endpoint
    return {
        steps: [
            {
                id: 1,
                num: '1',
                component: 'HTTP Request',
                name: `${cleanMethod} ${path}`,
                file: handlerFile || 'src/routes/api.routes.js',
                latency: '95ms',
                type: 'entry',
                branch: 'success',
                overview: `Entry Point: Client invokes the API route ${cleanMethod} ${path} parsed by AST parser.`,
                keyFunctions: [`routes.${cleanMethod.toLowerCase()}("${path}")`],
                inputs: [{ name: 'req.params', type: 'Object' }],
                outputs: [{ name: 'next()', type: 'Function' }],
                prevStep: 'HTTP Client',
                nextStep: `${camelResource} Controller`
            },
            {
                id: 2,
                num: '2',
                component: `${camelResource} Controller`,
                name: `${cleanMethod.toLowerCase()}${camelResource}()`,
                file: controllerFile,
                latency: '18ms',
                type: 'controller',
                branch: 'success',
                overview: `Delegates incoming request execution parameters for ${resource} to downstream service parser layers.`,
                keyFunctions: [`${cleanMethod.toLowerCase()}${camelResource}()`],
                inputs: [{ name: 'req', type: 'Object' }],
                outputs: [{ name: 'result', type: 'Object' }],
                prevStep: 'HTTP Request',
                nextStep: `${camelResource} Service`
            },
            {
                id: 3,
                num: '3',
                component: `${camelResource} Service`,
                name: `manage${camelResource}()`,
                file: serviceFile,
                latency: '25ms',
                type: 'service',
                branch: 'success',
                overview: `Executes core business validation rules for ${resource} and controls database queries.`,
                keyFunctions: [`manage${camelResource}()`],
                inputs: [{ name: 'data', type: 'Object' }],
                outputs: [{ name: 'serviceResult', type: 'Object' }],
                prevStep: `${camelResource} Controller`,
                nextStep: `${camelResource} Repository`
            },
            {
                id: 4,
                num: '4',
                component: `${camelResource} Repository`,
                name: `query${camelResource}()`,
                file: repositoryFile,
                latency: '30ms',
                type: 'repository',
                branch: 'success',
                overview: `Translates parsed instructions into structured database transaction rows for ${resource}.`,
                keyFunctions: [`query${camelResource}()`],
                inputs: [{ name: 'criteria', type: 'Object' }],
                outputs: [{ name: 'rows', type: 'Array' }],
                prevStep: `${camelResource} Service`,
                nextStep: 'Response Sent'
            },
            {
                id: 5,
                num: '5',
                component: 'Response Sent',
                name: '200 OK',
                file: 'src/utils/response.util.js',
                latency: '15ms',
                type: 'response',
                branch: 'success',
                overview: `Returns AST parsed transaction values and closes client socket connection context.`,
                keyFunctions: ['res.status(200).json()'],
                inputs: [{ name: 'data', type: 'Object' }],
                outputs: [{ name: 'responseBody', type: 'JSON' }],
                prevStep: `${camelResource} Repository`,
                nextStep: 'Completed'
            }
        ],
        branches: [
            {
                name: 'Resource Not Found',
                branch: 'user-not-found',
                steps: [
                    {
                        id: 21,
                        num: '2.1',
                        component: 'Not Found',
                        name: 'throw NotFound()',
                        file: repositoryFile,
                        latency: '12ms',
                        type: 'repository',
                        branch: 'user-not-found',
                        overview: `Target record for ${resource} does not exist in database indexing system. Throws standard exception.`,
                        keyFunctions: [`query${camelResource}()`],
                        inputs: [{ name: 'id', type: 'String' }],
                        outputs: [{ name: 'NotFoundError', type: 'Error' }],
                        prevStep: `${camelResource} Repository`,
                        nextStep: 'Error Middleware'
                    },
                    {
                        id: 22,
                        num: '2.2',
                        component: 'Error Middleware',
                        name: 'handleError()',
                        file: 'src/middlewares/error.middleware.js',
                        latency: '12ms',
                        type: 'middleware',
                        branch: 'user-not-found',
                        overview: 'Catches system runtime errors and formats response envelopes.',
                        keyFunctions: ['handleError()'],
                        inputs: [{ name: 'err', type: 'Error' }],
                        outputs: [{ name: 'next()', type: 'Function' }],
                        prevStep: 'Not Found',
                        nextStep: 'Response Sent'
                    },
                    {
                        id: 23,
                        num: '2.3',
                        component: 'Response Sent',
                        name: '404 Not Found',
                        file: 'src/utils/response.util.js',
                        latency: '16ms',
                        type: 'response',
                        branch: 'user-not-found',
                        overview: 'Closes request transaction context with a 404 error envelope.',
                        keyFunctions: ['res.status(404).json()'],
                        inputs: [{ name: 'message', type: 'String' }],
                        outputs: [{ name: 'errorBody', type: 'JSON' }],
                        prevStep: 'Error Middleware',
                        nextStep: 'Completed'
                    }
                ]
            }
        ]
    };
}

export default function TraceabilityGraph({ traceability, apiEndpoints = [], onNodeClick }) {
    // Filter active endpoints
    const activeEndpoints = useMemo(() => {
        return apiEndpoints.length > 0 
            ? apiEndpoints 
            : [
                { id: 'POST:/api/auth/login', method: 'POST', path: '/api/auth/login', handlerFile: 'src/routes/auth.routes.js' },
                { id: 'POST:/api/auth/register', method: 'POST', path: '/api/auth/register', handlerFile: 'src/routes/auth.routes.js' },
                { id: 'GET:/api/users', method: 'GET', path: '/api/users', handlerFile: 'src/routes/user.routes.js' },
                { id: 'GET:/api/users/:id', method: 'GET', path: '/api/users/:id', handlerFile: 'src/routes/user.routes.js' }
            ];
    }, [apiEndpoints]);

    // UI state management
    const [selectedEndpointId, setSelectedEndpointId] = useState('');
    const [activeViewTab, setActiveViewTab] = useState('Flow'); // 'Flow', 'Sequence', 'Data Flow'
    const [selectedStep, setSelectedStep] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(100);

    // Set initial active endpoint
    useEffect(() => {
        if (activeEndpoints.length > 0 && !selectedEndpointId) {
            setSelectedEndpointId(activeEndpoints[0].id);
        }
    }, [activeEndpoints, selectedEndpointId]);

    // Active endpoint object
    const activeEndpoint = useMemo(() => {
        return activeEndpoints.find(ep => ep.id === selectedEndpointId) || activeEndpoints[0];
    }, [activeEndpoints, selectedEndpointId]);

    // Active flow traces computation
    const flowTraces = useMemo(() => {
        if (!activeEndpoint) return { steps: [], branches: [] };
        return getFlowTracesForEndpoint(
            activeEndpoint.method,
            activeEndpoint.path,
            activeEndpoint.handlerFile
        );
    }, [activeEndpoint]);

    // Auto-select first step node when the endpoint updates
    useEffect(() => {
        if (flowTraces.steps.length > 0) {
            setSelectedStep(flowTraces.steps[0]);
        }
    }, [flowTraces]);

    // Total metric stats counts
    const totalStepsCount = useMemo(() => {
        let count = flowTraces.steps.length;
        flowTraces.branches?.forEach(b => {
            count += b.steps.length;
        });
        return count;
    }, [flowTraces]);

    const totalLatency = useMemo(() => {
        let sum = 0;
        flowTraces.steps.forEach(s => {
            const num = parseInt(s.latency) || 0;
            sum += num;
        });
        return `${sum}ms`;
    }, [flowTraces]);

    return (
        <div className="traceability-root">
            {/* 1. HEADER ROW */}
            <div className="traceability-header-row">
                <h2 className="traceability-title">Traceability</h2>
                <span className="traceability-subtitle">
                    Track the flow of execution and data across your codebase.
                </span>
            </div>

            {/* 2. DYNAMIC FILTERS BAR */}
            <div className="traceability-filters-bar">
                <div className="filter-item-group">
                    <span className="filter-item-label">Starting Point</span>
                    <select
                        className="endpoint-dropdown-select"
                        value={selectedEndpointId}
                        onChange={(e) => setSelectedEndpointId(e.target.value)}
                    >
                        {activeEndpoints.map(ep => (
                            <option key={ep.id} value={ep.id}>
                                {ep.method} &nbsp;&nbsp; {ep.path}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-item-group">
                    <span className="filter-item-label">View as</span>
                    <div className="view-as-tabs">
                        {['Flow', 'Sequence', 'Data Flow'].map(tab => (
                            <button
                                key={tab}
                                className={`view-as-tab-btn ${activeViewTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveViewTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <button className="export-trace-btn">
                    <FaShareAlt /> Export Trace
                </button>
            </div>

            {/* 3. MAIN INTERACTIVE LAYOUT SPLIT GRID */}
            <div className="traceability-main-grid">
                
                {/* LEFT ELEMENT: CANVAS FLOW VISUALIZATION PANEL */}
                <div className="execution-flow-panel">
                    <div className="flow-panel-header">
                        <h4 className="flow-panel-title">
                            Execution Flow &nbsp;&nbsp;
                            <span className="branch-badge">
                                {flowTraces.branches?.length || 0} branches
                            </span>
                        </h4>
                        
                        <div className="flow-controls-row">
                            <button className="flow-zoom-btn" onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} title="Zoom Out"><FaMinus /></button>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, display: 'flex', alignItems: 'center', width: '36px', justifyContent: 'center' }}>{zoomLevel}%</span>
                            <button className="flow-zoom-btn" onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))} title="Zoom In"><FaPlus /></button>
                            <button className="flow-zoom-btn" onClick={() => setZoomLevel(100)} title="Reset Scale"><FaCompress /></button>
                        </div>
                    </div>

                    {/* Dynamic Canvas Container */}
                    <div className="flow-diagram-canvas" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
                        
                        {/* THE HAPPY PATH CHAIN ROW */}
                        <div className="flow-happy-path">
                            {flowTraces.steps.map((step, index) => {
                                const isSelected = selectedStep?.id === step.id;
                                const isEntry = step.type === 'entry';
                                return (
                                    <div 
                                        key={step.id} 
                                        style={{ display: 'flex', alignItems: 'center' }}
                                    >
                                        <div
                                            className={`flow-node-card ${isSelected ? 'selected' : ''} ${isEntry ? 'entry-point' : ''}`}
                                            onClick={() => setSelectedStep(step)}
                                        >
                                            {isEntry && (
                                                <span className="node-branch-tag success">
                                                    Success Path
                                                </span>
                                            )}
                                            
                                            <div className="node-card-header">
                                                <span className="node-step-number">{step.num}</span>
                                                <span className="node-latency-pill">{step.latency}</span>
                                            </div>
                                            
                                            <span className="node-component-title">{step.component}</span>
                                            <span className="node-function-name" title={step.name}>{step.name}</span>
                                            <span className="node-file-path" title={step.file}>{step.file}</span>
                                        </div>
                                        
                                        {/* Renders Arrow to next, except for the last node */}
                                        {index < flowTraces.steps.length - 1 && (
                                            <div className="flow-path-arrow-right" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ALTERNATIVE BRANCHES FLOW GRID */}
                        {flowTraces.branches && flowTraces.branches.length > 0 && (
                            <div className="flow-branches-row">
                                {flowTraces.branches.map((branch, bIdx) => (
                                    <div key={bIdx} className="branch-path-container">
                                        {branch.steps.map((step, index) => {
                                            const isSelected = selectedStep?.id === step.id;
                                            const branchClass = branch.branch === 'invalid-creds' ? 'branch-invalid' : 'branch-notfound';
                                            const tagLabel = branch.branch === 'invalid-creds' ? 'Invalid Credentials' : 'User Not Found';
                                            const tagClass = branch.branch === 'invalid-creds' ? 'invalid-creds' : 'user-not-found';
                                            
                                            return (
                                                <div 
                                                    key={step.id} 
                                                    style={{ display: 'flex', alignItems: 'center' }}
                                                >
                                                    <div
                                                        className={`flow-node-card ${isSelected ? 'selected' : ''} ${branchClass}`}
                                                        onClick={() => setSelectedStep(step)}
                                                    >
                                                        {index === 0 && (
                                                            <span className={`node-branch-tag ${tagClass}`}>
                                                                {tagLabel}
                                                            </span>
                                                        )}
                                                        
                                                        <div className="node-card-header">
                                                            <span className="node-step-number">{step.num}</span>
                                                            <span className="node-latency-pill">{step.latency}</span>
                                                        </div>
                                                        
                                                        <span className="node-component-title">{step.component}</span>
                                                        <span className="node-function-name" title={step.name}>{step.name}</span>
                                                        <span className="node-file-path" title={step.file}>{step.file}</span>
                                                    </div>
                                                    
                                                    {index < branch.steps.length - 1 && (
                                                        <div className="flow-path-arrow-right" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                    {/* Canvas bottom legend and metrics */}
                    <div className="flow-diagram-legend">
                        <div className="legend-items-group">
                            <div className="legend-item">
                                <span className="legend-color-dot entry" /> Entry Point
                            </div>
                            <div className="legend-item">
                                <span className="legend-color-dot success" /> Success Path
                            </div>
                            {flowTraces.branches?.some(b => b.branch === 'invalid-creds') && (
                                <div className="legend-item">
                                    <span className="legend-color-dot invalid" /> Invalid Credentials
                                </div>
                            )}
                            {flowTraces.branches?.some(b => b.branch === 'user-not-found') && (
                                <div className="legend-item">
                                    <span className="legend-color-dot notfound" /> User Not Found
                                </div>
                            )}
                        </div>

                        <div className="legend-stats-metrics">
                            <span>Total Steps: &nbsp;<strong>{totalStepsCount}</strong></span>
                            <span>Total Time: &nbsp;<strong>{totalLatency}</strong></span>
                        </div>
                    </div>
                </div>

                {/* RIGHT HAND SIDE: STEP DETAILS SIDEBAR PANEL */}
                <div className="step-details-sidebar">
                    <div className="step-details-header">
                        <h4 className="step-details-title">Step Details</h4>
                    </div>

                    {selectedStep ? (
                        <div className="step-details-body">
                            
                            {/* Step Identification Row */}
                            <div className="step-identity-row">
                                <span className="step-details-number">{selectedStep.num}</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="step-details-component-name">{selectedStep.component}</span>
                                    <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                        {selectedStep.type}
                                    </span>
                                </div>
                            </div>

                            {/* Step Overview Description */}
                            <div>
                                <h5 className="details-sec-title">Overview</h5>
                                <p className="details-overview-text">{selectedStep.overview}</p>
                            </div>

                            {/* Component File Details */}
                            <div>
                                <h5 className="details-sec-title">File</h5>
                                <div className="details-file-container">
                                    <span className="details-file-path" title={selectedStep.file}>
                                        {selectedStep.file}
                                    </span>
                                    <span className="file-static-label">
                                        Static File
                                    </span>
                                </div>
                            </div>

                            {/* Core Functions List */}
                            {selectedStep.keyFunctions && selectedStep.keyFunctions.length > 0 && (
                                <div>
                                    <h5 className="details-sec-title">Key Functions</h5>
                                    <div className="details-mono-list">
                                        {selectedStep.keyFunctions.map((fnName, idx) => (
                                            <span key={idx} className="details-mono-item">
                                                {fnName}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Parameters Schema */}
                            {selectedStep.inputs && selectedStep.inputs.length > 0 && (
                                <div>
                                    <h5 className="details-sec-title">Inputs</h5>
                                    <div className="details-schema-table">
                                        {selectedStep.inputs.map((inp, idx) => (
                                            <div key={idx} className="schema-table-row">
                                                <span className="schema-param-name">{inp.name}</span>
                                                <span className="schema-param-type">{inp.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Output Parameters Schema */}
                            {selectedStep.outputs && selectedStep.outputs.length > 0 && (
                                <div>
                                    <h5 className="details-sec-title">Outputs</h5>
                                    <div className="details-schema-table">
                                        {selectedStep.outputs.map((out, idx) => (
                                            <div key={idx} className="schema-table-row">
                                                <span className="schema-param-name">{out.name}</span>
                                                <span className="schema-param-type">{out.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Connection Link paths */}
                            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                                <h5 className="details-sec-title">Connected To</h5>
                                <div className="details-connections-grid">
                                    <div className="connection-card-row">
                                        <span className="connection-card-label">Previous Step</span>
                                        <span className="connection-card-value" title={selectedStep.prevStep}>
                                            {selectedStep.prevStep}
                                        </span>
                                    </div>
                                    <div className="connection-card-row">
                                        <span className="connection-card-label">Next Steps</span>
                                        <span className="connection-card-value" title={selectedStep.nextStep}>
                                            {selectedStep.nextStep}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="step-details-body">
                            <div className="details-empty-state">
                                <FaBoxes className="empty-state-icon" />
                                <h4>No Step Selected</h4>
                                <p>Click on any card in the execution flow to examine detailed schema boundaries</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
