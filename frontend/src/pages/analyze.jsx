import Header from "../components/Headers/Header";
import Tree from "../components/Canvas/Tree";
import FileExplorer from "../components/Sidebar/FileExplorer";
import Summary from "../components/Summary/Summary";
import DependencyGraph from "../components/Canvas/DependencyGraph";
import TraceabilityGraph from "../components/Canvas/TraceabilityGraph";
import ApiCatalog from "../components/ApiCatalog/ApiCatalog";
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
    FaRegFileCode,
    FaEye,
    FaEyeSlash
} from "react-icons/fa";
import "./analyze.css";

function Analyze() {
    const { username, repo } = useParams();
    const navigate = useNavigate();
    
    const [repoData, setRepoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    
    // Branch Selection state
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    
    // Left sidebar navigation tab selection
    const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'tree', 'dependencies', 'traceability', 'api'
    const [showExplorer, setShowExplorer] = useState(true);
    const [showSummary, setShowSummary] = useState(true);
    
    // Top Bar Address input
    const [repoUrl, setRepoUrl] = useState(`https://github.com/${username}/${repo}`);
    
    // API Search filter
    const [apiSearch, setApiSearch] = useState("");

    // Fetch branches list when repo changes
    useEffect(() => {
        if (!username || !repo) return;
        setBranches([]);
        setSelectedBranch("");
        
        fetch(`http://localhost:5000/branches/${username}/${repo}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setBranches(data);
                    // Determine initial branch choice
                    const initialBr = data.includes("main") 
                        ? "main" 
                        : data.includes("master") 
                            ? "master" 
                            : data[0];
                    setSelectedBranch(initialBr);
                } else {
                    setBranches(["main", "master"]);
                    setSelectedBranch("main");
                }
            })
            .catch(err => {
                console.error("Failed to fetch branches:", err);
                setBranches(["main", "master"]);
                setSelectedBranch("main");
            });
    }, [username, repo]);

    // Fetch repository data
    useEffect(() => {
        if (!username || !repo) return;
        
        setRepoData(null);
        setError(null);
        setLoading(true);
        setSelectedNode(null);
        setActiveTab("dashboard");
        setRepoUrl(`https://github.com/${username}/${repo}`);
        
        const branchQuery = selectedBranch ? `?branch=${selectedBranch}` : "";
        
        fetch(`http://localhost:5000/analyze/${username}/${repo}${branchQuery}`)
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then(data => setRepoData(data))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, [username, repo, selectedBranch]);

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
                    language: fileNode.language || "",
                    role: fileNode.role || "",
                    imports: fileNode.imports || [],
                    functions: fileNode.functions || [],
                    children: fileNode.children || [],
                    fileCount: fileNode.fileCount || 0
                });
                setShowSummary(true);
                return;
            }
        }
        setSelectedNode(node);
        setShowSummary(true);
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
                    language: fileNode.language || "",
                    role: fileNode.role || "",
                    imports: fileNode.imports || [],
                    functions: fileNode.functions || [],
                    highlightedFunction: traceNode.name
                });
                setShowSummary(true);
                return;
            }
        }
        setSelectedNode({
            name: traceNode.name,
            path: traceNode.path,
            type: "file"
        });
        setShowSummary(true);
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
                                <strong>{repoData?.metadata?.frameworks?.join(", ") || "None"}</strong>
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
                                <strong>{repoData?.metadata?.totalFunctions || 0}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Defined Calls:</span>
                                <strong>{repoData?.traceability?.edges?.length || 0}</strong>
                            </div>
                            <div className="meta-row">
                                <span>Entry Points:</span>
                                <strong>{repoData?.apiEndpoints?.length || 0}</strong>
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
                branches={branches}
                selectedBranch={selectedBranch}
                setSelectedBranch={setSelectedBranch}
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
                    <div className={`explorer-group ${showExplorer ? 'open' : 'collapsed'}`}>
                        <div className="explorer-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '4px' }}>
                            <span className="panel-label">Directory Explorer</span>
                            <button 
                                onClick={() => setShowExplorer(!showExplorer)}
                                className="explorer-toggle-btn"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                title={showExplorer ? "Hide File Explorer" : "Show File Explorer"}
                            >
                                {showExplorer ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {showExplorer && (
                            <div className="sidebar-explorer-container">
                                <FileExplorer 
                                    nodes={repoData.tree ? [repoData.tree] : []} 
                                    onNodeClick={handleNodeSelection} 
                                />
                            </div>
                        )}
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
                                            <div className="item-value">{repoData?.metadata?.frameworks?.join(", ") || "Vanilla JS/TS"}</div>
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
                            traceability={repoData?.traceability || null}
                            apiEndpoints={repoData?.apiEndpoints || []}
                            onNodeClick={handleTraceabilityClick}
                        />
                    )}
                    
                    {activeTab === "api" && (
                        <ApiCatalog 
                            apiEndpoints={repoData?.apiEndpoints || []} 
                            repoTree={repoData?.tree || {}} 
                        />
                    )}
                    
                    {/* Floating Workspace Toggle */}
                    {activeTab !== "api" && activeTab !== "traceability" && (
                        <button 
                            onClick={() => setShowSummary(!showSummary)}
                            className="floating-summary-toggle-btn"
                            title={showSummary ? "Hide Analysis Workspace" : "Show Analysis Workspace"}
                        >
                            {showSummary ? <FaEyeSlash /> : <FaEye />}
                            <span>{showSummary ? "Hide Workspace" : "Show Workspace"}</span>
                        </button>
                    )}
                </div>

                {/* Right Sidebar layout for AI summaries and Code Viewer */}
                {activeTab !== "api" && activeTab !== "traceability" && showSummary && (
                    <div className="summary">
                        <span className="panel-label">Analysis Workspace</span>
                        <Summary
                            selectedNode={selectedNode}
                            username={username}
                            repo={repo}
                            repoData={repoData}
                            selectedBranch={selectedBranch}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Analyze;