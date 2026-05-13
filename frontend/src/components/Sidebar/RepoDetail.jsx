import React from 'react';
import './Sidebar.css';

function RepoDetail({ totalFiles, languages }) {
    return (
        <div className="repo-detail" style={{ padding: '15px', color: '#f8fafc', borderTop: '1px solid #334155' }}>
            <div className="detail-item" style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>Total Files</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{totalFiles}</div>
            </div>
            
            <div className="detail-item">
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Primary Languages</div>
                <div className="languages-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {languages && languages.length > 0 ? languages.map(lang => (
                        <div key={lang.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#cbd5e1' }}>{lang.name}</span>
                            <span style={{ color: '#94a3b8', fontWeight: '500' }}>{lang.percentage}%</span>
                        </div>
                    )) : (
                        <span style={{ fontSize: '13px', color: '#64748b' }}>None</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RepoDetail;
