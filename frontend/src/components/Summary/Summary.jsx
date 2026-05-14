import { useState, useEffect } from 'react';
import './Summary.css';

function Summary({ selectedNode, username, repo }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                    fileContent = `File: ${selectedNode.name}\nPath: ${selectedNode.path || selectedNode.name}\nThis is a ${selectedNode.name.split('.').pop() || 'code'} file in the repository.`;
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
    }, [selectedNode, username, repo]);

    // Empty state when nothing is selected
    if (!selectedNode) {
        return (
            <div className="summary-container">
                <div className="summary-empty">
                    <p>Select a file or folder to view summary</p>
                </div>
            </div>
        );
    }

    return (
        <div className="summary-container">
            {/* Header with node info */}
            <div className="summary-header">
                <h3>{selectedNode.name}</h3>
                <span className="summary-type">{selectedNode.type}</span>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="summary-loading">
                    <div className="spinner" />
                    <p>Generating summary...</p>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="summary-error">
                    <p>⚠️ Error: {error}</p>
                </div>
            )}

            {/* Summary content */}
            {summary && (
                <div className="summary-content">
                    <div className="summary-text">
                        <p>{summary.summary}</p>
                    </div>
                    <div className="summary-metadata">
                        <small>
                            <strong>Type:</strong> {summary.summaryType} | 
                            <strong> Path:</strong> {summary.targetPath}
                        </small>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Summary;
