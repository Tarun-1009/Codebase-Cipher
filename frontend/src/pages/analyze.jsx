import Header from "../components/Headers/Header";
import Tree from "../components/Canvas/Tree";
import "./analyze.css";

function Analyze() {
    return (
        <div className="analyze-root">
            <Header />
            <div className="main-wrapper">
                <div className="sidebar">
                    <span className="panel-label">Explorer</span>
                </div>
                <div className="tree-container">
                    <Tree />
                </div>
                <div className="summary">
                    <span className="panel-label">Analysis</span>
                </div>
            </div>
        </div>
    );
}

export default Analyze;