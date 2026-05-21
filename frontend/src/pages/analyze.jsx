import Header from "../components/Headers/Header";
import Tree from "../components/Canvas/Tree";
import FileExplorer from "../components/Sidebar/FileExplorer";
import Summary from "../components/Summary/Summary";
import DependencyGraph from "../components/Canvas/DependencyGraph";
import TraceabilityGraph from "../components/Canvas/TraceabilityGraph";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import flattenTree from "../utils/treeFlattener";
import { 
    FaChartBar, 
    FaSitemap, 
    FaProjectDiagram, 
    FaExchangeAlt, 
    FaRoute, 
    FaInfoCircle, 
    FaCode, 
    FaCube, 
    FaFolderOpen,
    FaRegFileCode
} from "react-icons/fa";
import "./analyze.css";

function Analyze() {
    const { username, repo } = useParams();
    const navigate = useNavigate();
    
    const [repoData, setRepoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    
    // Left sidebar navigation tab selection
    const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'tree', 'dependencies', 'traceability', 'api'
    
    // Top Bar Address input
    const [repoUrl, setRepoUrl] = useState(`https://github.com/${username}/${repo}`);
    
    // API Search filter
    const [apiSearch, setApiSearch] = useState("");

    // Fetch repository data
    useEffect(() => {
        setLoading(true);
        setSelectedNode(null);
        setActiveTab("dashboard");
        setRepoUrl(`https://github.com/${username}/${repo}`);
        
        fetch(`http://localhost:5000/analyze/${username}/${repo}`)
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then(data => setRepoData(data))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, [username, repo]);

    // Compute flattened tree and stats once here to avoid multiple passes
    const { flatNodes, flatEdges, totalFiles, languages } = useMemo(() => {
        if (!repoData || !repoData.tree) return { flatNodes: [], flatEdges: [], totalFiles: 0, languages: [] };
        const result = flattenTree(repoData.tree);
        return {
            flatNodes: result.nodes,
            flatEdges: result.edges,
            totalFiles: result.totalFiles,
            languages: result.languages
        };
    }, [repoData]);

    // Recursive helper to find node by path
    const findNodeInTreeByPath = (node, path) => {
        if (!node) return null;
        // Normalize paths by removing leading or trailing slashes
        const normNodePath = node.path?.replace(/^\/|\/$/g, "");
        const normPath = path?.replace(/^\/|\/$/g, "");
        
        if (normNodePath === normPath || node.id === path) return node;
        
        if (node.children) {
            for (let child of node.children) {
                const found = findNodeInTreeByPath(child, path);
                if (found) return found;
            }
        }
        return null;
    };

    // Shared node click handlers across views
    const handleNodeSelection = (node) => {
        if (!node) return;
        
        // If node has details inside the tree, let's look for it
        if (repoData && repoData.tree) {
            const fileNode = findNodeInTreeByPath(repoData.tree, node.path || node.name);
            if (fileNode) {
                setSelectedNode({
                    name: fileNode.name,
                    path: fileNode.path || node.path || node.name,
                    type: fileNode.type || node.type || "file",
                    code: fileNode.code || "",
                    imports: fileNode.imports || [],
                    functions: fileNode.functions || []
                });
                return;
            }
        }
        setSelectedNode(node);
    };

    const handleTraceabilityClick = (traceNode) => {
        if (repoData && repoData.tree) {
            const fileNode = findNodeInTreeByPath(repoData.tree, traceNode.path);
            if (fileNode) {
                setSelectedNode({
                    name: fileNode.name,
                    path: fileNode.path || traceNode.path,
                    type: "file",
                    code: fileNode.code || "",
                    imports: fileNode.imports || [],
                    functions: fileNode.functions || [],
                    highlightedFunction: traceNode.name
                });
                return;
            }
        }
        setSelectedNode({
            name: traceNode.name,
            path: traceNode.path,
            type: "file"
        });
    };

    const handleApiClick = (handlerFile) => {
        if (repoData && repoData.tree) {
            const fileNode = findNodeInTreeByPath(repoData.tree, handlerFile);
            if (fileNode) {
                setSelectedNode({
                    name: fileNode.name,
                    path: fileNode.path || handlerFile,
                    type: "file",
                    code: fileNode.code || "",
                    imports: fileNode.imports || [],
                    functions: fileNode.functions || []
                });
                return;
            }
        }
        setSelectedNode({
            name: handlerFile.split("/").pop(),
            path: handlerFile,
            type: "file"
        });
    };

    // Handle Top Bar actions
    const handleAnalyze = () => {
        if (!repoUrl || !repoUrl.trim()) return;
        try {
            let cleanUrl = repoUrl.trim();
            if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
                cleanUrl = "https://" + cleanUrl;
            }
            const parsed = new URL(cleanUrl);
            const [, user, repository] = parsed.pathname.split("/");
            if (user && repository) {
                navigate(`/analyze/${user}/${repository}`);
            } else {
                alert("Please enter a valid GitHub repository URL");
            }
        } catch (err) {
            console.error(err);
            alert("Invalid repository URL");
        }
    };

    const handleExport = () => {
        if (!repoData) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(repoData, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${repo}_analysis_report.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    if (loading) {
        return (
            <div className="analyze-loading-screen">
                <div className="analyze-spinner-ring" />
                <span className="analyze-loading-label">Analyzing repository details...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analyze-loading-screen">
                <div className="analyze-error-icon" />
                <span className="analyze-loading-label error-text">
                    {error.message.includes("404")
                        ? "Repository not found. Double check your repo path!"
                        : "Failed to compile repository analysis."}
                </span>
                <button onClick={() => navigate("/")} className="analyze-back-btn">Go Back Home</button>
            </div>
        );
    }

    // Filtered API endpoints list
    const filteredApis = repoData?.apiEndpoints ? repoData.apiEndpoints.filter(api => {
        const query = apiSearch.toLowerCase();
        return (
            api.path.toLowerCase().includes(query) ||
            api.method.toLowerCase().includes(query) ||
            (api.framework && api.framework.toLowerCase().includes(query)) ||
            (api.handlerFile && api.handlerFile.toLowerCase().includes(query))
        );
    }) : [];

    // Helper to render view specific metadata box at the bottom of the sidebar
    const renderSidebarMetadataBox = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <div className="sidebar-meta-card">
                        <div className="meta-card-title">
                            <FaInfoCircle className="meta-icon" /> Dashboard Info
                        </div>
                        <div className="meta-card-body">
                            <div className="meta-row">
                                <span>Repository:</span>
                                <strong>{repo}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Frameworks:</span>
                                <strong>{repoData?.repository?.frameworks?.join(", ") || "None"}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Status:</span>
                                <span className="status-badge green">Analyzed</span>
                            </div>
                        </div>
                    </div>
                );
            case "tree":
                return (
                    <div className="sidebar-meta-card">
                        <div className="meta-card-title">
                            <FaSitemap className="meta-icon" /> Tree Flow Stats
                        </div>
                        <div className="meta-card-body">
                            <div className="meta-row">
                                <span>Total Nodes:</span>
                                <strong>{flatNodes.length}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Total Edges:</span>
                                <strong>{flatEdges.length}</strong>
                            </div>
                            <div className="meta-row font-mono">
                                <span>Selected Node:</span>
                                <strong className="text-truncate">{selectedNode ? selectedNode.name : "None"}</strong>
                            </div>
                        </div>
                    </div>
                );
            case "dependencies":
                const internalCount = flatNodes.length;
                return (
                    <div className="sidebar-meta-card">
                        <div className="meta-card-title">
                            <FaProjectDiagram className="meta-icon" /> Dependency Info
                        </div>
                        <div className="meta-card-body">
                            <div className="meta-row">
                                <span>Code Files:</span>
                                <strong>{internalCount}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Imports Analyzed:</span>
                                <strong>{repoData?.metadata?.totalImports || 0}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Active Imports:</span>
                                <span className="status-badge blue">Enabled</span>
                            </div>
                        </div>
                    </div>
                );
            case "traceability":
                return (
                    <div className="sidebar-meta-card">
                        <div className="meta-card-title">
                            <FaExchangeAlt className="meta-icon" /> Function Traces
                        </div>
                        <div className="meta-card-body">
                            <div className="meta-row">
                                <span>Total Functions:</span>
                                <strong>{repoData?.traceability?.functions?.length || 0}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Defined Calls:</span>
                                <strong>{repoData?.traceability?.callGraph?.edges?.length || 0}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Entry Points:</span>
                                <strong>{repoData?.traceability?.callGraph?.metadata?.entryPoints?.length || 0}</strong>
                            </div>
                        </div>
                    </div>
                );
            case "api":
                return (
                    <div className="sidebar-meta-card">
                        <div className="meta-card-title">
                            <FaRoute className="meta-icon" /> API Gateway
                        </div>
                        <div className="meta-card-body">
                            <div className="meta-row">
                                <span>Total APIs:</span>
                                <strong>{repoData?.apiEndpoints?.length || 0}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Filtered:</span>
                                <strong>{filteredApis.length}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Engine:</span>
                                <span className="status-badge purple">Node Gateway</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="analyze-root">
            {/* Address input & Export actions bar */}
            <Header 
                repoUrl={repoUrl} 
                setRepoUrl={setRepoUrl} 
                onAnalyze={handleAnalyze} 
                onExport={handleExport} 
            />
            
            <div className="main-wrapper">
                {/* Left Sidebar Layout */}
                <div className="sidebar-panel">
                    {/* Navigation Tab Selections */}
                    <div className="navigation-group">
                        <span className="panel-label">Intelligence Navigation</span>
                        
                        <button 
                            className={`nav-menu-btn ${activeTab === "dashboard" ? "active" : ""}`}
                            onClick={() => setActiveTab("dashboard")}
                        >
                            <FaChartBar className="menu-icon" /> Dashboard
                        </button>
                        
                        <button 
                            className={`nav-menu-btn ${activeTab === "tree" ? "active" : ""}`}
                            onClick={() => setActiveTab("tree")}
                        >
                            <FaSitemap className="menu-icon" /> Tree Structure
                        </button>
                        
                        <button 
                            className={`nav-menu-btn ${activeTab === "dependencies" ? "active" : ""}`}
                            onClick={() => setActiveTab("dependencies")}
                        >
                            <FaProjectDiagram className="menu-icon" /> Dependency Graph
                        </button>
                        
                        <button 
                            className={`nav-menu-btn ${activeTab === "traceability" ? "active" : ""}`}
                            onClick={() => setActiveTab("traceability")}
                        >
                            <FaExchangeAlt className="menu-icon" /> Traceability Engine
                        </button>
                        
                        <button 
                            className={`nav-menu-btn ${activeTab === "api" ? "active" : ""}`}
                            onClick={() => setActiveTab("api")}
                        >
                            <FaRoute className="menu-icon" /> API Endpoints
                        </button>
                    </div>

                    {/* Scrollable File Explorer in Sidebar */}
                    <div className="explorer-group">
                        <span className="panel-label">Directory Explorer</span>
                        <div className="sidebar-explorer-container">
                            <FileExplorer 
                                nodes={repoData.tree ? [repoData.tree] : []} 
                                onNodeClick={handleNodeSelection} 
                            />
                        </div>
                    </div>

                    {/* View Specific bottom Metadata Card */}
                    <div className="sidebar-bottom-meta">
                        {renderSidebarMetadataBox()}
                    </div>
                </div>

                {/* Center Panel View Routing */}
                <div className="tree-container">
                    {activeTab === "dashboard" && (
                        <div className="dashboard-view-container">
                            <h2 className="dashboard-title">Repository Intelligence Overview</h2>
                            <p className="dashboard-subtitle">Parsed details for <code>{username}/{repo}</code></p>
                            
                            {/* Summary Metrics Cards */}
                            <div className="dashboard-stats-grid">
                                <div className="stat-glow-card">
                                    <div className="card-header">Total Files</div>
                                    <div className="card-value blue">{repoData?.metadata?.totalFiles || totalFiles || 0}</div>
                                    <div className="card-footer">source code files</div>
                                </div>
                                <div className="stat-glow-card">
                                    <div className="card-header">Functions Parsed</div>
                                    <div className="card-value purple">{repoData?.metadata?.totalFunctions || 0}</div>
                                    <div className="card-footer">declarations found</div>
                                </div>
                                <div className="stat-glow-card">
                                    <div className="card-header">Package Imports</div>
                                    <div className="card-value pink">{repoData?.metadata?.totalImports || 0}</div>
                                    <div className="card-footer">imported packages</div>
                                </div>
                                <div className="stat-glow-card">
                                    <div className="card-header">API Routes</div>
                                    <div className="card-value green">{repoData?.metadata?.totalEndpoints || 0}</div>
                                    <div className="card-footer">endpoints detected</div>
                                </div>
                            </div>
                            
                            {/* Language Details */}
                            <div className="dashboard-details-row">
                                <div className="dashboard-sub-card language-breakdown">
                                    <h3>Language Composition</h3>
                                    <div className="languages-scroll">
                                        {languages && languages.length > 0 ? (
                                            languages.map((lang, index) => {
                                                const colors = ["#3b82f6", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#6366f1"];
                                                const barColor = colors[index % colors.length];
                                                return (
                                                    <div key={lang.name} className="lang-bar-item">
                                                        <div className="lang-bar-label">
                                                            <span>{lang.name}</span>
                                                            <strong>{lang.percentage}%</strong>
                                                        </div>
                                                        <div className="progress-bg">
                                                            <div className="progress-fill" style={{ width: `${lang.percentage}%`, backgroundColor: barColor }} />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="empty-details">No language details found.</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="dashboard-sub-card frameworks-card">
                                    <h3>Detected Ecosystem</h3>
                                    <div className="ecosystem-body">
                                        <div className="ecosystem-item">
                                            <div className="item-title">Ecosystem Name</div>
                                            <div className="item-value">{repoData?.repository?.frameworks?.join(", ") || "Vanilla JS/TS"}</div>
                                        </div>
                                        <div className="ecosystem-item">
                                            <div className="item-title">Platform</div>
                                            <div className="item-value">Node.js JavaScript runtime</div>
                                        </div>
                                        <div className="ecosystem-item">
                                            <div className="item-title">Analysis Mode</div>
                                            <div className="item-value highlight">Full Static Analysis</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === "tree" && (
                        <Tree 
                            flatNodes={flatNodes} 
                            flatEdges={flatEdges} 
                            onNodeClick={handleNodeSelection} 
                        />
                    )}
                    
                    {activeTab === "dependencies" && (
                        <DependencyGraph 
                            repoData={repoData.tree} 
                            repoName={repo} 
                            onNodeClick={handleNodeSelection}
                        />
                    )}
                    
                    {activeTab === "traceability" && (
                        <TraceabilityGraph 
                            traceability={repoData.traceability} 
                            onNodeClick={handleTraceabilityClick}
                        />
                    )}
                    
                    {activeTab === "api" && (
                        <div className="api-catalog-view">
                            <div className="api-header-row">
                                <h2>Repository API Endpoints</h2>
                                <input 
                                    type="text" 
                                    className="api-search-input"
                                    placeholder="Filter by method, path, or file..."
                                    value={apiSearch}
                                    onChange={(e) => setApiSearch(e.target.value)}
                                />
                            </div>
                            
                            <div className="api-table-wrapper">
                                {filteredApis.length > 0 ? (
                                    <table className="api-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "100px" }}>Method</th>
                                                <th>Endpoint Path</th>
                                                <th style={{ width: "150px" }}>Framework</th>
                                                <th>Handler File Source</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApis.map((api, index) => {
                                                const methodUpper = api.method.toUpperCase();
                                                let badgeClass = "badge-grey";
                                                if (methodUpper === "GET") badgeClass = "badge-get";
                                                else if (methodUpper === "POST") badgeClass = "badge-post";
                                                else if (methodUpper === "PUT") badgeClass = "badge-put";
                                                else if (methodUpper === "DELETE") badgeClass = "badge-delete";
                                                
                                                return (
                                                    <tr key={api.id || index}>
                                                        <td>
                                                            <span className={`method-badge ${badgeClass}`}>{methodUpper}</span>
                                                        </td>
                                                        <td className="api-path-cell">
                                                            <code>{api.path}</code>
                                                        </td>
                                                        <td>
                                                            <span className="framework-pill">{api.framework || "Express"}</span>
                                                        </td>
                                                        <td>
                                                            <span 
                                                                className="api-handler-link"
                                                                onClick={() => handleApiClick(api.handlerFile)}
                                                                title="View file source and explanation"
                                                            >
                                                                {api.handlerFile}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="api-empty-state">
                                        <p>No matching API routes detected in the source code.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar layout for AI summaries and Code Viewer */}
                <div className="summary">
                    <span className="panel-label">Analysis Workspace</span>
                    <Summary selectedNode={selectedNode} username={username} repo={repo} />
                </div>
            </div>
        </div>
    );
}

export default Analyze;