import { useState, useEffect } from 'react';
import { FaCopy, FaFileAlt, FaCode, FaTerminal, FaCube } from 'react-icons/fa';
import './Summary.css';

function Summary({ selectedNode, username, repo }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Right sidebar local tabs: 'summary' or 'code'
    const [rightTab, setRightTab] = useState('summary');
    const [copied, setCopied] = useState(false);

    // Fetch summary when a node is selected
    useEffect(() => {
        if (!selectedNode) {
            setSummary(null);
            return;
        }

        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            setSummary(null);

            try {
                // Determine summary type based on node type
                const summaryType = selectedNode.type === 'folder' ? 'folder' : 'file';
                
                // Create meaningful file content based on node type
                let fileContent = '';
                if (summaryType === 'file') {
                    fileContent = selectedNode.code 
                        ? `File: ${selectedNode.name}\nPath: ${selectedNode.path || selectedNode.name}\n${selectedNode.code.substring(0, 1000)}`
                        : `File: ${selectedNode.name}\nPath: ${selectedNode.path || selectedNode.name}\nThis is a ${selectedNode.name.split('.').pop() || 'code'} file in the repository.`;
                } else {
                    fileContent = `Folder: ${selectedNode.name}\nPath: ${selectedNode.path || selectedNode.name}\nThis folder contains source code and project files.`;
                }

                const response = await fetch('http://localhost:5000/summarize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        repo: repo,
                        summaryType: summaryType,
                        targetPath: selectedNode.path || selectedNode.name,
                        fileContent: fileContent,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
                }

                const data = await response.json();
                setSummary(data);
            } catch (err) {
                setError(err.message);
                console.error('Summary fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
        
        // If an active function trace is passed, auto-select code tab!
        if (selectedNode.highlightedFunction) {
            setRightTab('code');
        }
    }, [selectedNode, username, repo]);

    const handleCopyCode = () => {
        if (!selectedNode || !selectedNode.code) return;
        navigator.clipboard.writeText(selectedNode.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Empty state when nothing is selected
    if (!selectedNode) {
        return (
            <div className="summary-container">
                <div className="summary-empty">
                    <FaTerminal className="empty-icon" size={24} />
                    <h4>Code Intelligence Workspace</h4>
                    <p>Select a node from the explorer, graph, tree, or API gateway to activate static code analyses.</p>
                </div>
            </div>
        );
    }

    // Identify start/end lines for active function traceability highlighting
    let startHighlight = 0;
    let endHighlight = 0;
    
    if (selectedNode.highlightedFunction && selectedNode.functions) {
        const activeFunc = selectedNode.functions.find(f => f.name === selectedNode.highlightedFunction);
        if (activeFunc) {
            startHighlight = activeFunc.startLine || activeFunc.line || 0;
            endHighlight = activeFunc.endLine || activeFunc.line || 0;
        }
    }

    return (
        <div className="summary-container">
            {/* Header with node info */}
            <div className="summary-header">
                <h3 className="node-title" title={selectedNode.name}>{selectedNode.name}</h3>
                <span className={`node-type-badge ${selectedNode.type === 'folder' ? 'folder' : 'file'}`}>
                    {selectedNode.type}
                </span>
            </div>

            {/* Tab switchers */}
            <div className="summary-tabs">
                <button 
                    className={`tab-btn-item ${rightTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setRightTab('summary')}
                >
                    <FaFileAlt style={{ marginRight: '6px' }} /> Summary
                </button>
                {selectedNode.type === 'file' && (
                    <button 
                        className={`tab-btn-item ${rightTab === 'code' ? 'active' : ''}`}
                        onClick={() => setRightTab('code')}
                    >
                        <FaCode style={{ marginRight: '6px' }} /> Source Code
                    </button>
                )}
            </div>

            {/* Render local Tab content */}
            <div className="summary-tab-content">
                {rightTab === 'summary' ? (
                    <div className="summary-info-tab">
                        {/* Loading state */}
                        {loading && (
                            <div className="summary-loading">
                                <div className="summary-spinner" />
                                <p>Generating AI summary...</p>
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="summary-error">
                                <p>⚠️ AI Summary Unavailable: {error}</p>
                            </div>
                        )}

                        {/* Summary text content */}
                        {summary && (
                            <div className="summary-text-block">
                                <p>{summary.summary}</p>
                            </div>
                        )}

                        {/* Node Properties Meta details */}
                        <div className="node-details-section">
                            <h4 className="meta-sec-title">Properties</h4>
                            
                            <div className="meta-sec-row">
                                <span>Path:</span>
                                <code className="meta-sec-path">{selectedNode.path || selectedNode.name}</code>
                            </div>
                            
                            {selectedNode.language && (
                                <div className="meta-sec-row">
                                    <span>Language:</span>
                                    <strong>{selectedNode.language}</strong>
                                </div>
                            )}

                            {selectedNode.role && (
                                <div className="meta-sec-row">
                                    <span>Architecture Role:</span>
                                    <span className="role-badge">{selectedNode.role}</span>
                                </div>
                            )}
                        </div>

                        {/* Render imports list */}
                        {selectedNode.imports && selectedNode.imports.length > 0 && (
                            <div className="node-details-section">
                                <h4 className="meta-sec-title">Imports ({selectedNode.imports.length})</h4>
                                <div className="imports-badges-grid">
                                    {selectedNode.imports.map((dep, idx) => (
                                        <span key={idx} className="import-capsule">
                                            <FaCube size={8} style={{ marginRight: '4px', opacity: 0.7 }} /> {dep}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Render Functions list */}
                        {selectedNode.functions && selectedNode.functions.length > 0 && (
                            <div className="node-details-section">
                                <h4 className="meta-sec-title">Functions ({selectedNode.functions.length})</h4>
                                <div className="functions-monos-list">
                                    {selectedNode.functions.map((fn, idx) => (
                                        <div key={idx} className={`func-mono-item ${selectedNode.highlightedFunction === fn.name ? 'highlighted' : ''}`}>
                                            <code className="fn-name">{fn.name}</code>
                                            <span className="fn-params">
                                                ({fn.parameters ? fn.parameters.join(', ') : ''})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="code-view-tab">
                        {selectedNode.code ? (
                            <div className="code-viewer-container">
                                <div className="code-viewer-actions">
                                    <span className="code-viewer-lang">{selectedNode.language || 'code'}</span>
                                    <button onClick={handleCopyCode} className="copy-code-btn">
                                        <FaCopy size={10} style={{ marginRight: '4px' }} />
                                        {copied ? 'Copied!' : 'Copy Code'}
                                    </button>
                                </div>
                                <div className="code-viewer-scroll">
                                    <table className="code-viewer-table">
                                        <tbody>
                                            {selectedNode.code.split('\n').map((line, idx) => {
                                                const lineNum = idx + 1;
                                                const isHighlighted = startHighlight && endHighlight && lineNum >= startHighlight && lineNum <= endHighlight;
                                                return (
                                                    <tr key={idx} className={`code-tr ${isHighlighted ? 'active-highlight' : ''}`}>
                                                        <td className="code-line-number">{lineNum}</td>
                                                        <td className="code-line-content">
                                                            <pre>{line || ' '}</pre>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="code-empty-state">
                                <p>No raw source code content has been loaded for this file.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Summary;
