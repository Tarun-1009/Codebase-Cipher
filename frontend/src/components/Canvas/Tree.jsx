import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import flattenTree from '../../utils/treeFlattener';
import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom"
import getLayoutedElements from '../../utils/nodePosition';




function Tree() {
    const { username, repo } = useParams();
    const [repoData, setRepoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:5000/analyze/${username}/${repo}`)
            .then(res => res.json())
            .then(data => setRepoData(data))
            .catch(err => setError(err))
            .finally(() => setLoading(false))
    }, [username, repo])

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);


    useEffect(() => {
        if (!repoData) return;

        const result = flattenTree(repoData);
        const layouted = getLayoutedElements(result.nodes, result.edges, 'TB');
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
    }, [repoData])
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <ReactFlow nodes={nodes} edges={edges} fitView>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    )
}
export default Tree;