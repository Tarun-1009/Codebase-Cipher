import TreeItem from "./TreeItem";

function FileExplorer({nodes}) {
    return (
        <div className="file-explorer">
            {nodes.map((node) => (
                <TreeItem key={node.name} item={node} />
            ))}
        </div>
    );
}
export default FileExplorer;