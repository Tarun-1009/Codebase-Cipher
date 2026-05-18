import React, { useState } from 'react';

const TraceabilityView = ({ functions, callGraph }) => {
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFunctions = functions.filter(func =>
    func.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedFunc = selectedFunction ? 
    functions.find(f => f.id === selectedFunction) : 
    null;

  return (
    <div style={{ display: 'flex', height: '100%', gap: '20px', padding: '20px' }}>
      {/* Functions List */}
      <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '20px' }}>
        <h2>Functions ({functions.length})</h2>
        
        <input
          type="text"
          placeholder="Search functions..."
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

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {filteredFunctions.map(func => (
            <div
              key={func.id}
              onClick={() => setSelectedFunction(func.id)}
              style={{
                padding: '10px',
                marginBottom: '8px',
                border: selectedFunction === func.id ? '2px solid blue' : '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: selectedFunction === func.id ? '#e3f2fd' : 'white'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{func.name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {func.file}:{func.line}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                ← {func.calledBy?.length || 0} | → {func.calls?.length || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Function Details */}
      <div style={{ flex: 1 }}>
        {selectedFunc ? (
          <div>
            <h2>{selectedFunc.name}</h2>
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <div><strong>File:</strong> {selectedFunc.file}</div>
              <div><strong>Line:</strong> {selectedFunc.line}</div>
              <div><strong>Type:</strong> {selectedFunc.type}</div>
              <div><strong>Scope:</strong> {selectedFunc.scope}</div>
              <div><strong>Async:</strong> {selectedFunc.isAsync ? 'Yes' : 'No'}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>Parameters ({selectedFunc.parameters?.length || 0})</h3>
              {selectedFunc.parameters?.length > 0 ? (
                <ul>
                  {selectedFunc.parameters.map((param, idx) => (
                    <li key={idx}>{param.name}: {param.type}</li>
                  ))}
                </ul>
              ) : (
                <p>No parameters</p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>Called By ({selectedFunc.calledBy?.length || 0})</h3>
              {selectedFunc.calledBy?.length > 0 ? (
                <ul>
                  {selectedFunc.calledBy.map((caller, idx) => (
                    <li key={idx}>{caller.functionName || caller}</li>
                  ))}
                </ul>
              ) : (
                <p>Not called by any function</p>
              )}
            </div>

            <div>
              <h3>Calls ({selectedFunc.calls?.length || 0})</h3>
              {selectedFunc.calls?.length > 0 ? (
                <ul>
                  {selectedFunc.calls.map((call, idx) => (
                    <li key={idx}>{call.functionName || call}</li>
                  ))}
                </ul>
              ) : (
                <p>This function does not call any other functions</p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ color: '#999', textAlign: 'center', marginTop: '50px' }}>
            <p>Select a function to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraceabilityView;
