import { useState } from "react";
import { FaFolder, FaFolderOpen, FaChevronRight } from "react-icons/fa";
import { resolveIcon } from "../../utils/icons";
import "./Sidebar.css";

function TreeItem({ item }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Safety check: nodes from the backend have 'children' if they are folders
    const isFolder = item.children && item.children.length > 0;

    const { Icon, color } = resolveIcon(item.name);

    return (
        <div className="tree-item">
            <div className="tree-item-header" onClick={() => isFolder && setIsOpen(!isOpen)}>
                {/* Toggle chevron (only visible for folders) */}
                <div className={`tree-item-toggle ${isOpen ? 'open' : ''}`}>
                    {isFolder && <FaChevronRight size={10} />}
                </div>
                
                {/* File/Folder Icon */}
                <div className="tree-item-icon">
                    {isFolder ? (
                        isOpen ? <FaFolderOpen color="#3b82f6" /> : <FaFolder color="#94a3b8" />
                    ) : (
                        <Icon color={color} />
                    )}
                </div>
                
                {/* Name */}
                <span className="tree-item-name" title={item.name}>{item.name}</span>
            </div>
            
            {/* Nested children */}
            {isFolder && isOpen && (
                <div className="tree-item-children">
                    {item.children.map((child) => (
                        <TreeItem key={child.path || child.name} item={child} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default TreeItem;