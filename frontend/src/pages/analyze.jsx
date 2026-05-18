import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import TreeView from "../components/TreeView"
import TraceabilityView from "../components/TraceabilityView"
import EndpointsView from "../components/EndpointsView"

function Analyze() {
    const { username, repo } = useParams();
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('tree');

    useEffect(() => {
        fetch(`http://localhost:5000/analyze/${username}/${repo}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setAnalysisData(data);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setError(err.message || 'Failed to analyze repository');
            })
            .finally(() => setLoading(false))
    }, [username, repo]);

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
    }

    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>
    }

    if (!analysisData) {
        return <div style={{ padding: '20px' }}>No data found</div>
    }

    const tabStyle = (isActive) => ({
        padding: '12px 24px',
        border: 'none',
        backgroundColor: isActive ? '#2563eb' : '#e5e7eb',
        color: isActive ? 'white' : '#333',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: isActive ? 'bold' : 'normal',
        borderRadius: '4px 4px 0 0',
        marginRight: '4px',
        transition: 'all 0.3s'
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Header */}
            <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #ddd' }}>
                <h1 style={{ margin: '0 0 10px 0' }}>Analysis Results</h1>
                <p style={{ margin: '0', color: '#666' }}>
                    Repository: <strong>{username}/{repo}</strong>
                </p>
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '4px', 
                padding: '10px 20px', 
                backgroundColor: '#fff', 
                borderBottom: '2px solid #ddd' 
            }}>
                <button
                    onClick={() => setActiveTab('tree')}
                    style={tabStyle(activeTab === 'tree')}
                >
                    📁 Tree Structure
                </button>
                <button
                    onClick={() => setActiveTab('functions')}
                    style={tabStyle(activeTab === 'functions')}
                >
                    🔗 Function Mapping
                </button>
                <button
                    onClick={() => setActiveTab('endpoints')}
                    style={tabStyle(activeTab === 'endpoints')}
                >
                    🌐 API Endpoints
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#fff' }}>
                {activeTab === 'tree' && analysisData.tree && (
                    <TreeView tree={analysisData.tree} />
                )}

                {activeTab === 'functions' && analysisData.traceability && (
                    <TraceabilityView 
                        functions={analysisData.traceability.functions || []} 
                        callGraph={analysisData.traceability.callGraph || {}}
                    />
                )}

                {activeTab === 'endpoints' && analysisData.apiEndpoints && (
                    <EndpointsView 
                        endpoints={analysisData.apiEndpoints.endpoints || []} 
                    />
                )}
            </div>

            {/* Footer Stats */}
            <div style={{ 
                padding: '15px 20px', 
                backgroundColor: '#f3f4f6', 
                borderTop: '1px solid #ddd',
                fontSize: '14px',
                color: '#666'
            }}>
                <div style={{ display: 'flex', gap: '30px' }}>
                    <div>📦 Functions: <strong>{analysisData.traceability?.functions?.length || 0}</strong></div>
                    <div>🔗 Function Calls: <strong>{analysisData.traceability?.callGraph?.edges?.length || 0}</strong></div>
                    <div>🌐 Endpoints: <strong>{analysisData.apiEndpoints?.endpoints?.length || 0}</strong></div>
                </div>
            </div>
        </div>
    )
}

export default Analyze