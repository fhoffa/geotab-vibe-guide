// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
import React, { useState, useEffect } from 'react';
import { FeedbackProvider, Alert, Waiting, Button } from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';

function OdometerAudit({ api }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState(null);

  useEffect(() => {
    if (api) loadData();
  }, [api]);

  function loadData() {
    setLoading(true);
    setError(null);

    api.multiCall([
      ['Get', { typeName: 'Device' }],
      ['Get', { typeName: 'StatusData', search: { diagnosticSearch: { id: 'DiagnosticOdometerAdjustmentId' } } }]
    ], function(results) {
      setDebugData(results);

      const devices = results[0];
      const allOffsets = results[1];

      // Group offsets by device id
      const historyMap = {};
      allOffsets.forEach(function(row) {
        if (!historyMap[row.device.id]) historyMap[row.device.id] = [];
        historyMap[row.device.id].push(row);
      });

      // Build sections only for devices that have history, sorted newest-first
      const built = [];
      devices.forEach(function(device) {
        const history = historyMap[device.id];
        if (!history || history.length === 0) return;
        history.sort(function(a, b) { return new Date(b.dateTime) - new Date(a.dateTime); });
        built.push({ id: device.id, name: device.name, history });
      });

      setSections(built);
      setLoading(false);
    }, function(err) {
      setError(String(err));
      setLoading(false);
    });
  }

  function copyDebug() {
    const t = document.createElement('textarea');
    t.value = JSON.stringify(debugData, null, 2);
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
  }

  const thStyle = {
    textAlign: 'left',
    padding: '10px 16px',
    borderBottom: '2px solid #EDEBE9',
    color: '#605E5C',
    fontWeight: 600,
    fontSize: '13px'
  };

  const tdStyle = {
    padding: '10px 16px',
    borderBottom: '1px solid #F3F2F1',
    fontSize: '13px',
    color: '#201F1E'
  };

  return (
    <FeedbackProvider>
      <div style={{
        padding: '24px',
        fontFamily: '"Segoe UI", -apple-system, sans-serif',
        minHeight: '100vh',
        background: '#FAF9F8'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 24px 0', color: '#201F1E' }}>
          Odometer Adjustment Audit Trail
        </h1>

        {error && (
          <Alert
            variant="error"
            dismissible
            onDismiss={() => setError(null)}
            style={{ marginBottom: '16px' }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px' }}>
            <Waiting size="large" />
            <p style={{ marginTop: '16px', color: '#605E5C' }}>Loading Audit History...</p>
          </div>
        ) : sections.length === 0 ? (
          <Alert variant="info">No manual offsets found in history.</Alert>
        ) : (
          sections.map(function(section) {
            return (
              <div key={section.id} style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #EDEBE9',
                marginBottom: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #EDEBE9',
                  background: '#F9F8F7'
                }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#201F1E' }}>
                    {section.name}
                  </h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date/Time</th>
                      <th style={thStyle}>Offset Value (mi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.history.map(function(h, i) {
                      return (
                        <tr key={i} style={{ background: i % 2 === 1 ? '#FAFAFA' : 'white' }}>
                          <td style={tdStyle}>{new Date(h.dateTime).toLocaleString()}</td>
                          <td style={tdStyle}>{(h.data / 1609.34).toFixed(2)} mi</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        {/* Debug panel */}
        <div style={{ marginTop: '32px', borderTop: '1px solid #EDEBE9', paddingTop: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="small" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? 'Hide' : 'Show'} Debug Log
            </Button>
            {debugData && (
              <Button variant="ghost" size="small" onClick={copyDebug}>
                Copy Debug Data
              </Button>
            )}
          </div>
          {showDebug && debugData && (
            <pre style={{
              marginTop: '8px',
              background: '#1E1E1E',
              color: '#4EC9B0',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '11px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </FeedbackProvider>
  );
}

export default OdometerAudit;
