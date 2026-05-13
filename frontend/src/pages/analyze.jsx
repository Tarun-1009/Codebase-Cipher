import Header from "../components/Headers/Header";
import Tree from "../components/Canvas/Tree";
import FileExplorer from "../components/Sidebar/FileExplorer";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import RepoDetail from "../components/Sidebar/RepoDetail";
import flattenTree from "../utils/treeFlattener";
import "./analyze.css";

function Analyze() {
    const {username,repo} = useParams();
    const [repoData,setRepoData] = useState(null);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:5000/analyze/${username}/${repo}`)
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then(data => setRepoData(data))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, [username, repo]);

    // Compute flattened tree and stats once here to avoid multiple passes
    const { flatNodes, flatEdges, totalFiles, languages } = useMemo(() => {
        if (!repoData) return { flatNodes: [], flatEdges: [], totalFiles: 0, languages: [] };
        const result = flattenTree(repoData);
        return {
            flatNodes: result.nodes,
            flatEdges: result.edges,
            totalFiles: result.totalFiles,
            languages: result.languages
        };
    }, [repoData]);
    if (loading) {
        return (
            <div className="tree-state">
                <div className="tree-spinner" />
                <span className="tree-state-label">Loading repository…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tree-state">
                <div className="tree-error" />
                <span className="tree-state-label">
                    {error.message.startsWith('HTTP 404')
                        ? 'Repository not found'
                        : 'Failed to load repository'}
                </span>
            </div>
        );
    }


    return (
        <div className="analyze-root">
            <Header />
            <div className="main-wrapper">
                <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <span className="panel-label">Explorer</span>
                        <FileExplorer nodes={[repoData]} />
                    </div>
                    <RepoDetail totalFiles={totalFiles} languages={languages} />
                </div>
                <div className="tree-container">
                    <Tree flatNodes={flatNodes} flatEdges={flatEdges} />
                </div>
                <div className="summary">
                    <span className="panel-label">Analysis</span>
                </div>
            </div>
        </div>
    );
}

export default Analyze;