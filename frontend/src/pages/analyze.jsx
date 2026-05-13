import Header from "../components/Headers/Header";
import Tree from "../components/Canvas/Tree";
import FileExplorer from "../components/Sidebar/FileExplorer";
import { useState,useEffect } from "react";
import { useParams } from "react-router-dom";
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
                <div className="sidebar">
                    <span className="panel-label">Explorer</span>
                    <FileExplorer nodes={[repoData]} />
                </div>
                <div className="tree-container">
                    <Tree repoData={repoData}/>
                </div>
                <div className="summary">
                    <span className="panel-label">Analysis</span>
                </div>
            </div>
        </div>
    );
}

export default Analyze;