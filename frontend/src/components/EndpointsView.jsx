import React, { useState } from 'react';

const EndpointsView = ({ endpoints }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const methodColors = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
    PATCH: '#a855f7',
    HEAD: '#6b7280',
    OPTIONS: '#9ca3af'
  };

  const filteredEndpoints = endpoints.filter(ep => {
    const methodMatch = filterMethod === 'ALL' || ep.method === filterMethod;
    const searchMatch = ep.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ep.handler.toLowerCase().includes(searchTerm.toLowerCase());
    return methodMatch && searchMatch;
  });

  const methodCounts = endpoints.reduce((acc, ep) => {
    acc[ep.method] = (acc[ep.method] || 0) + 1;
    return acc;
  }, {});

  const selectedEp = selectedEndpoint ?
    endpoints.find(e => e.id === selectedEndpoint) :
    null;

  return (
    <div style={{ display: 'flex', height: '100%', gap: '20px', padding: '20px' }}>
      {/* Endpoints List */}
      <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '20px' }}>
        <h2>API Endpoints ({endpoints.length})</h2>

        {/* Method Filter */}
        <div style={{ marginBottom: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterMethod('ALL')}
            style={{
              padding: '6px 12px',
              backgroundColor: filterMethod === 'ALL' ? '#333' : '#f0f0f0',
              color: filterMethod === 'ALL' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            All
          </button>
          {Object.keys(methodCounts).map(method => (
            <button
              key={method}
              onClick={() => setFilterMethod(method)}
              style={{
                padding: '6px 12px',
                backgroundColor: filterMethod === method ? methodColors[method] : '#f0f0f0',
                color: filterMethod === method ? 'white' : methodColors[method],
                border: `1px solid ${methodColors[method]}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {method} ({methodCounts[method]})
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search endpoints..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />

        {/* Endpoints List */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filteredEndpoints.map(ep => (
            <div
              key={ep.id}
              onClick={() => setSelectedEndpoint(ep.id)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                border: selectedEndpoint === ep.id ? '2px solid blue' : '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: selectedEndpoint === ep.id ? '#e3f2fd' : 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span
                style={{
                  backgroundColor: methodColors[ep.method],
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  minWidth: '50px',
                  textAlign: 'center'
                }}
              >
                {ep.method}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{ep.path}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{ep.handler}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoint Details */}
      <div style={{ flex: 1 }}>
        {selectedEp ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span
                style={{
                  backgroundColor: methodColors[selectedEp.method],
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                {selectedEp.method}
              </span>
              <h2 style={{ margin: 0 }}>{selectedEp.path}</h2>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <div><strong>Handler:</strong> {selectedEp.handler}</div>
              <div><strong>File:</strong> {selectedEp.handlerFile}</div>
              <div><strong>Line:</strong> {selectedEp.handlerLine}</div>
              {selectedEp.framework && <div><strong>Framework:</strong> {selectedEp.framework}</div>}
            </div>

            {selectedEp.middleware && selectedEp.middleware.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3>Middleware</h3>
                <div>
                  {selectedEp.middleware.map((mw, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px',
                        marginBottom: '6px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    >
                      {idx + 1}. {mw}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h3>Request Schema</h3>
              <pre style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(selectedEp.requestSchema || {}, null, 2)}
              </pre>
            </div>

            <div>
              <h3>Response Schema</h3>
              <pre style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(selectedEp.responseSchema || {}, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{ color: '#999', textAlign: 'center', marginTop: '50px' }}>
            <p>Select an endpoint to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointsView;
