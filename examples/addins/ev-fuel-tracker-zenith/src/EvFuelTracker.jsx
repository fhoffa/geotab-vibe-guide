// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
import React, { useState, useEffect, useRef } from 'react';
import { Button, FeedbackProvider, Alert, Waiting } from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';

// Zenith design tokens
const Z = {
  primary:   '#0078D4',
  success:   '#107C10',
  warning:   '#FFB900',
  error:     '#D13438',
  neutral900:'#201F1E',
  neutral600:'#605E5C',
  neutral100:'#EDEBE9',
  bg:        '#FAF9F8',
  white:     '#FFFFFF',
};

function LevelBar({ level }) {
  if (level === null) {
    return <span style={{ color: Z.neutral600, fontSize: 13 }}>No data</span>;
  }
  const pct = Math.round(level);
  const color = pct < 20 ? Z.error : pct < 40 ? Z.warning : Z.success;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 10, background: Z.neutral100, borderRadius: 5, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 5 }} />
      </div>
      <span style={{ fontWeight: 600, color, minWidth: 36, fontSize: 13 }}>{pct}%</span>
    </div>
  );
}

function TypeBadge({ type }) {
  const color = type === 'EV' ? Z.success : Z.warning;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: Z.white, background: color }}>
      {type}
    </span>
  );
}

function StatusBadge({ item }) {
  if (item.level !== null && item.level < 20) {
    return (
      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: Z.white, background: Z.error }}>
        {item.type === 'EV' ? 'Low Battery' : 'Low Fuel'}
      </span>
    );
  }
  if (item.level === null) {
    return <span style={{ color: Z.neutral600, fontSize: 13 }}>No reading</span>;
  }
  return <span style={{ color: Z.success, fontSize: 13 }}>OK</span>;
}

function SummaryCard({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 160, background: Z.white, padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '5px solid ' + accent }}>
      <div style={{ fontSize: 12, color: Z.neutral600, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: Z.neutral900 }}>{value}</div>
    </div>
  );
}

const FILTERS = ['all', 'ev', 'gas', 'low'];
const FILTER_LABELS = { all: 'All', ev: 'EV', gas: 'Gas', low: 'Low (<20%)' };
const FILTER_COLORS = { all: Z.primary, ev: Z.success, gas: Z.warning, low: Z.error };

const SORT_COLS = ['name', 'type', 'level', 'speed'];

function EvFuelTracker({ api }) {
  const [fleet, setFleet]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState('all');
  const [sortCol, setSortCol]     = useState('level');
  const [sortAsc, setSortAsc]     = useState(true);
  const [debugLog, setDebugLog]   = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const debugDataRef              = useRef({});

  function log(msg) {
    const line = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    setDebugLog(prev => [...prev, line]);
  }

  function copyDebugData() {
    const t = document.createElement('textarea');
    t.value = JSON.stringify(debugDataRef.current, null, 2);
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    alert('Debug data copied! Paste back to your AI chat for analysis.');
  }

  useEffect(() => {
    if (api) loadData();
  }, [api]);

  function loadData() {
    if (!api) return;
    setLoading(true);
    setError(null);

    const lookback = new Date();
    lookback.setDate(lookback.getDate() - 2);

    api.multiCall([
      ['Get', { typeName: 'Device' }],
      ['Get', { typeName: 'StatusData', search: { diagnosticSearch: { id: 'DiagnosticFuelLevelId' }, fromDate: lookback.toISOString() } }],
      ['Get', { typeName: 'StatusData', search: { diagnosticSearch: { id: 'DiagnosticElectricVehicleBatteryStateOfChargeId' }, fromDate: lookback.toISOString() } }],
      ['Get', { typeName: 'DeviceStatusInfo' }]
    ], function (results) {
      const devices    = results[0];
      const fuelData   = results[1];
      const evData     = results[2];
      const statusInfo = results[3];

      log('Devices: ' + devices.length + ' | Fuel readings: ' + fuelData.length + ' | EV readings: ' + evData.length);
      debugDataRef.current = {
        devices:    { total: devices.length,    sample: devices.slice(0, 10) },
        fuelData:   { total: fuelData.length,   sample: fuelData.slice(0, 10) },
        evData:     { total: evData.length,     sample: evData.slice(0, 10) },
        statusInfo: { total: statusInfo.length, sample: statusInfo.slice(0, 10) },
      };

      const map = {};
      devices.forEach(d => {
        map[d.id] = { device: d, type: 'Gas', level: null, speed: 0, lastFuelUpdate: null, lastEvUpdate: null };
      });

      statusInfo.forEach(si => {
        if (si.device && map[si.device.id]) {
          map[si.device.id].speed = si.speed !== undefined ? Math.round(si.speed) : 0;
        }
      });

      fuelData.forEach(r => {
        if (r.device && map[r.device.id]) {
          const v = map[r.device.id];
          if (v.type !== 'EV' && (!v.lastFuelUpdate || new Date(r.dateTime) > new Date(v.lastFuelUpdate))) {
            v.lastFuelUpdate = r.dateTime;
            v.level = r.data;
          }
        }
      });

      evData.forEach(r => {
        if (r.device && map[r.device.id]) {
          const v = map[r.device.id];
          v.type = 'EV';
          if (!v.lastEvUpdate || new Date(r.dateTime) > new Date(v.lastEvUpdate)) {
            v.lastEvUpdate = r.dateTime;
            v.level = r.data;
          }
        }
      });

      setFleet(Object.values(map));
      setLoading(false);
    }, function (err) {
      log('API error: ' + err);
      setError('Failed to load fleet data: ' + err);
      setLoading(false);
    });
  }

  function handleSort(col) {
    setSortCol(prev => {
      if (prev === col) { setSortAsc(a => !a); return col; }
      setSortAsc(true);
      return col;
    });
  }

  function navigateToDevice(devId) {
    window.parent.location.hash = 'device,id:' + devId;
  }

  const total      = fleet.length;
  const evCount    = fleet.filter(v => v.type === 'EV').length;
  const gasCount   = fleet.filter(v => v.type === 'Gas').length;
  const alertCount = fleet.filter(v => v.level !== null && v.level < 20).length;
  const evPct      = total > 0 ? Math.round((evCount  / total) * 100) : 0;
  const gasPct     = total > 0 ? Math.round((gasCount / total) * 100) : 0;

  const visible = fleet
    .filter(v => {
      if (filter === 'ev')  return v.type  === 'EV';
      if (filter === 'gas') return v.type  === 'Gas';
      if (filter === 'low') return v.level !== null && v.level < 20;
      return true;
    })
    .sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ?  1 : -1;
      return 0;
    });

  const thStyle = { textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid ' + Z.neutral100, color: Z.neutral600, fontWeight: 600, fontSize: 13, cursor: 'pointer', userSelect: 'none' };
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid ' + Z.neutral100 };
  const cardStyle = { background: Z.white, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid ' + Z.neutral100, marginBottom: 24 };

  return (
    <FeedbackProvider>
      <div style={{ padding: 24, fontFamily: '"Segoe UI", sans-serif', minHeight: '100vh', background: Z.bg }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: Z.neutral900 }}>
            EV &amp; Fuel Tracker
          </h1>
          <Button variant="primary" onClick={loadData} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)} style={{ marginBottom: 16 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80 }}>
            <Waiting size="large" />
            <p style={{ marginTop: 16, color: Z.neutral600 }}>Loading fleet telemetry...</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <SummaryCard label="Total Fleet"          value={total}               accent={Z.primary} />
              <SummaryCard label="Electric Vehicles"    value={evCount + ' (' + evPct + '%)'}   accent={Z.success} />
              <SummaryCard label="Gas / ICE Vehicles"   value={gasCount + ' (' + gasPct + '%)'}  accent={Z.warning} />
              <SummaryCard label="Low Energy Alerts"    value={alertCount}          accent={Z.error}   />
            </div>

            {/* Fleet mix bar */}
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: Z.neutral900, marginBottom: 12 }}>Fleet Composition Mix</div>
              <div style={{ height: 24, display: 'flex', overflow: 'hidden', borderRadius: 4, background: Z.neutral100 }}>
                <div style={{ width: evPct + '%', background: Z.success, color: Z.white, textAlign: 'center', lineHeight: '24px', fontWeight: 600, fontSize: 13, transition: 'width .6s ease' }}>
                  {evPct > 8 ? 'EV (' + evPct + '%)' : ''}
                </div>
                <div style={{ width: gasPct + '%', background: Z.warning, color: Z.white, textAlign: 'center', lineHeight: '24px', fontWeight: 600, fontSize: 13, transition: 'width .6s ease' }}>
                  {gasPct > 8 ? 'Gas (' + gasPct + '%)' : ''}
                </div>
              </div>
            </div>

            {/* Vehicle table */}
            <div style={cardStyle}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + Z.neutral100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: Z.neutral900 }}>All Vehicles</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {FILTERS.map(f => (
                    <Button
                      key={f}
                      variant={filter === f ? 'primary' : 'secondary'}
                      onClick={() => setFilter(f)}
                    >
                      {FILTER_LABELS[f]}
                    </Button>
                  ))}
                </div>
              </div>

              {visible.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: Z.neutral600 }}>
                  No vehicles match this filter.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {[
                          { col: 'name',  label: 'Vehicle' },
                          { col: 'type',  label: 'Type' },
                          { col: 'level', label: 'Fuel / Battery %' },
                          { col: 'speed', label: 'Live Speed' },
                        ].map(({ col, label }) => (
                          <th key={col} style={thStyle} onClick={() => handleSort(col)}>
                            {label} {sortCol === col ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                        ))}
                        <th style={{ ...thStyle, cursor: 'default' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map(item => {
                        const isLow = item.level !== null && item.level < 20;
                        return (
                          <tr key={item.device.id} style={{ background: isLow ? '#FFF5F5' : Z.white }}>
                            <td style={tdStyle}>
                              <a
                                href="#"
                                onClick={e => { e.preventDefault(); navigateToDevice(item.device.id); }}
                                style={{ color: Z.primary, textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}
                              >
                                {item.device.name || item.device.id}
                              </a>
                            </td>
                            <td style={tdStyle}><TypeBadge type={item.type} /></td>
                            <td style={{ ...tdStyle, minWidth: 160 }}><LevelBar level={item.level} /></td>
                            <td style={tdStyle}>{item.speed} km/h</td>
                            <td style={tdStyle}><StatusBadge item={item} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Debug panel */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, textAlign: 'center', zIndex: 9999 }}>
          <button onClick={() => setShowDebug(s => !s)} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '4px 16px', cursor: 'pointer', fontSize: 12, borderRadius: '4px 4px 0 0' }}>
            Toggle Debug Log
          </button>
          <button onClick={copyDebugData} style={{ background: '#f39c12', color: '#fff', border: 'none', padding: '4px 16px', cursor: 'pointer', fontSize: 12, borderRadius: '4px 4px 0 0', marginLeft: 4 }}>
            Copy Debug Data
          </button>
          {showDebug && (
            <pre style={{ display: 'block', background: '#1e1e1e', color: '#0f0', padding: 10, margin: 0, maxHeight: 200, overflowY: 'auto', textAlign: 'left', fontSize: 11 }}>
              {debugLog.join('\n') || '(no log entries yet)'}
            </pre>
          )}
        </div>

      </div>
    </FeedbackProvider>
  );
}

export default EvFuelTracker;
