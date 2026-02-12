// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  FeedbackProvider,
  Alert,
  Waiting
} from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// How many days of exception data to fetch
var DAYS_BACK = 7;
// Max exceptions to resolve GPS coordinates for (each requires a LogRecord lookup)
var MAX_HEATMAP_POINTS = 200;
// Max exceptions per multiCall batch
var MULTI_CALL_BATCH = 50;

function ExceptionHeatmap({ api }) {
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [exceptionCount, setExceptionCount] = useState(0);
  var [heatPointCount, setHeatPointCount] = useState(0);
  var [ruleCounts, setRuleCounts] = useState({});
  var [dataSource, setDataSource] = useState('');

  var mapRef = useRef(null);
  var mapInstanceRef = useRef(null);
  var heatLayerRef = useRef(null);
  var chartRef = useRef(null);
  var chartInstanceRef = useRef(null);

  // Initialize Leaflet map once
  useEffect(function() {
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([43.65, -79.38], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }
    return function() {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render bar chart when ruleCounts changes
  useEffect(function() {
    if (!chartRef.current || Object.keys(ruleCounts).length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    var labels = Object.keys(ruleCounts);
    var data = Object.values(ruleCounts);

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Occurrences',
          data: data,
          backgroundColor: '#0078D4'
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }, [ruleCounts]);

  // Fetch real exception data and GPS coordinates
  var loadData = useCallback(function() {
    if (!api) return;

    setLoading(true);
    setError(null);
    setExceptionCount(0);
    setHeatPointCount(0);
    setRuleCounts({});
    setDataSource('');

    var now = new Date();
    var fromDate = new Date(now.getTime() - DAYS_BACK * 24 * 60 * 60 * 1000);

    // Step 1: Fetch rules (for human-readable names) and exception events in parallel
    var rules = {};

    api.call('Get', { typeName: 'Rule' }, function(ruleResults) {
      // Build rule ID -> name lookup
      ruleResults.forEach(function(r) {
        rules[r.id] = r.name || r.id;
      });

      // Step 2: Fetch exception events
      api.call('Get', {
        typeName: 'ExceptionEvent',
        search: {
          fromDate: fromDate.toISOString(),
          toDate: now.toISOString()
        }
      }, function(exceptions) {
        setExceptionCount(exceptions.length);

        if (exceptions.length === 0) {
          setLoading(false);
          setDataSource('No exception events found in the last ' + DAYS_BACK + ' days.');
          return;
        }

        // Step 3: Count exceptions by rule name
        var counts = {};
        exceptions.forEach(function(exc) {
          var ruleId = exc.rule ? exc.rule.id : 'Unknown';
          var ruleName = rules[ruleId] || ruleId;
          counts[ruleName] = (counts[ruleName] || 0) + 1;
        });
        setRuleCounts(counts);

        // Step 4: Get GPS coordinates for exceptions via LogRecord lookups
        // Limit to MAX_HEATMAP_POINTS to avoid excessive API calls
        var toResolve = exceptions.slice(0, MAX_HEATMAP_POINTS);
        resolveLocations(toResolve, function(heatPoints) {
          updateHeatmap(heatPoints);
          setHeatPointCount(heatPoints.length);
          setLoading(false);
          setDataSource(
            exceptions.length + ' exception events (' + DAYS_BACK + ' days). ' +
            heatPoints.length + ' mapped to GPS coordinates.'
          );
        });

      }, function(err) {
        setError('Failed to load exception events: ' + (err.message || err));
        setLoading(false);
      });
    }, function(err) {
      setError('Failed to load rules: ' + (err.message || err));
      setLoading(false);
    });
  }, [api]);

  // Resolve GPS locations for exception events using multiCall + LogRecord
  function resolveLocations(exceptions, callback) {
    var allPoints = [];
    var batches = [];

    // Split into batches for multiCall
    for (var i = 0; i < exceptions.length; i += MULTI_CALL_BATCH) {
      batches.push(exceptions.slice(i, i + MULTI_CALL_BATCH));
    }

    var batchIndex = 0;

    function processBatch() {
      if (batchIndex >= batches.length) {
        callback(allPoints);
        return;
      }

      var batch = batches[batchIndex];

      // Build multiCall requests: for each exception, get a LogRecord near its time
      var calls = batch.map(function(exc) {
        var excTime = new Date(exc.activeFrom);
        // Look for a LogRecord within 2 minutes of the exception
        var from = new Date(excTime.getTime() - 120000);
        var to = new Date(excTime.getTime() + 120000);

        return ['Get', {
          typeName: 'LogRecord',
          search: {
            deviceSearch: { id: exc.device.id },
            fromDate: from.toISOString(),
            toDate: to.toISOString()
          }
        }];
      });

      api.multiCall(calls, function(results) {
        results.forEach(function(logRecords) {
          if (logRecords && logRecords.length > 0) {
            var rec = logRecords[0];
            if (rec.latitude && rec.longitude &&
                rec.latitude !== 0 && rec.longitude !== 0) {
              allPoints.push([rec.latitude, rec.longitude, 0.5]);
            }
          }
        });

        batchIndex++;
        processBatch();
      }, function(err) {
        // If multiCall fails, continue with what we have
        console.warn('multiCall batch failed:', err);
        batchIndex++;
        processBatch();
      });
    }

    processBatch();
  }

  // Update the Leaflet heatmap layer
  function updateHeatmap(heatPoints) {
    var map = mapInstanceRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (heatPoints.length > 0) {
      heatLayerRef.current = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 10
      }).addTo(map);

      // Fit map bounds to the data points
      var lats = heatPoints.map(function(p) { return p[0]; });
      var lngs = heatPoints.map(function(p) { return p[1]; });
      var bounds = L.latLngBounds(
        [Math.min.apply(null, lats), Math.min.apply(null, lngs)],
        [Math.max.apply(null, lats), Math.max.apply(null, lngs)]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  // Load data on mount
  useEffect(function() {
    if (api) {
      loadData();
    }
  }, [api, loadData]);

  // Styles using Zenith design tokens
  var cardStyle = {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #EDEBE9',
    marginBottom: '24px'
  };

  var statBoxStyle = {
    padding: '16px',
    textAlign: 'center'
  };

  return (
    <FeedbackProvider>
    <div style={{
      padding: '24px',
      fontFamily: '"Segoe UI", sans-serif',
      minHeight: '100vh',
      background: '#FAF9F8'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            margin: 0,
            color: '#201F1E'
          }}>
            Fleet Exception Heatmap
          </h1>
          <p style={{
            margin: '4px 0 0 0',
            color: '#605E5C'
          }}>
            {dataSource || 'Loading real exception data from Geotab API...'}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </Button>
      </header>

      {/* Alerts */}
      {error && (
        <Alert
          variant="error"
          dismissible
          onDismiss={function() { setError(null); }}
          style={{ marginBottom: '16px' }}
        >
          {error}
        </Alert>
      )}

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={cardStyle}>
          <div style={statBoxStyle}>
            <div style={{ fontSize: '12px', color: '#605E5C', marginBottom: '4px' }}>
              Exception Events
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0078D4' }}>
              {loading ? '...' : exceptionCount}
            </div>
            <div style={{ fontSize: '11px', color: '#A19F9D' }}>Last {DAYS_BACK} days</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={statBoxStyle}>
            <div style={{ fontSize: '12px', color: '#605E5C', marginBottom: '4px' }}>
              Mapped to GPS
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0078D4' }}>
              {loading ? '...' : heatPointCount}
            </div>
            <div style={{ fontSize: '11px', color: '#A19F9D' }}>Heatmap points</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={statBoxStyle}>
            <div style={{ fontSize: '12px', color: '#605E5C', marginBottom: '4px' }}>
              Rule Types
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0078D4' }}>
              {loading ? '...' : Object.keys(ruleCounts).length}
            </div>
            <div style={{ fontSize: '11px', color: '#A19F9D' }}>Distinct rules triggered</div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px',
          ...cardStyle
        }}>
          <Waiting size="large" />
          <p style={{ marginTop: '16px', color: '#605E5C' }}>
            Fetching exception events and resolving GPS coordinates...
          </p>
        </div>
      )}

      {/* Heatmap */}
      <div style={cardStyle}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #EDEBE9'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
            Exception Location Heatmap
          </h2>
        </div>
        <div
          ref={mapRef}
          style={{
            height: '500px',
            width: '100%'
          }}
        />
      </div>

      {/* Bar Chart */}
      {Object.keys(ruleCounts).length > 0 && (
        <div style={cardStyle}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #EDEBE9'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Exceptions by Rule
            </h2>
          </div>
          <div style={{ padding: '16px' }}>
            <canvas ref={chartRef} style={{ maxHeight: '250px' }} />
          </div>
        </div>
      )}
    </div>
    </FeedbackProvider>
  );
}

export default ExceptionHeatmap;
