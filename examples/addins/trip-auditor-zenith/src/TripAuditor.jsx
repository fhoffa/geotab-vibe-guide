// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  FeedbackProvider,
  Alert,
  Waiting
} from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';

function TripAuditor({ api }) {
  const [trips, setTrips] = useState([]);
  const [devices, setDevices] = useState({});
  const [drivers, setDrivers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  var loadData = useCallback(function(dateStr) {
    if (!api) return;

    setLoading(true);
    setError(null);

    var fromDate = new Date(dateStr + 'T00:00:00Z').toISOString();
    var toDate = new Date(dateStr + 'T23:59:59Z').toISOString();

    api.multiCall(
      [
        ['Get', { typeName: 'Device' }],
        ['Get', { typeName: 'User', search: { isDriver: true } }],
        ['Get', { typeName: 'Trip', search: { fromDate: fromDate, toDate: toDate } }]
      ],
      function(results) {
        var deviceList = results[0];
        var driverList = results[1];
        var tripList = results[2];

        var devMap = {};
        deviceList.forEach(function(d) {
          devMap[d.id] = d.name || d.id;
        });

        var driverMap = {};
        driverList.forEach(function(u) {
          driverMap[u.id] = ((u.firstName || '') + ' ' + (u.lastName || '')).trim();
        });

        setDevices(devMap);
        setDrivers(driverMap);
        setTrips(tripList);
        setLoading(false);
      },
      function(err) {
        setError('Failed to load data: ' + (err.message || err));
        setLoading(false);
      }
    );
  }, [api]);

  useEffect(function() {
    if (api) {
      loadData(selectedDate);
    }
  }, [api, selectedDate, loadData]);

  function handleDateChange(e) {
    setSelectedDate(e.target.value);
  }

  function handleRefresh() {
    loadData(selectedDate);
  }

  function navigateToDevice(deviceId) {
    window.parent.location.hash = 'device,id:' + deviceId;
  }

  // Derived stats
  var noDriverCount = trips.filter(function(trip) {
    var driverId = (trip.driver || {}).id;
    return !driverId || driverId === 'NoDriverId' || driverId === 'UnknownDriverId';
  }).length;

  var totalDistance = trips.reduce(function(sum, trip) {
    return sum + Math.round((trip.distance || 0) * 0.621371);
  }, 0);

  // Styles using Zenith design tokens
  var cardStyle = {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #EDEBE9',
    marginBottom: '24px'
  };

  var statCardStyle = {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #EDEBE9',
    padding: '16px'
  };

  var tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  var thStyle = {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '1px solid #EDEBE9',
    color: '#605E5C',
    fontWeight: 600,
    fontSize: '13px'
  };

  var tdStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid #EDEBE9'
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
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          margin: 0,
          color: '#201F1E'
        }}>
          Trip &amp; Vehicle Auditor
        </h1>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              padding: '6px 12px',
              border: '1px solid #EDEBE9',
              borderRadius: '4px',
              fontFamily: '"Segoe UI", sans-serif',
              fontSize: '14px'
            }}
          />
          <Button
            variant="primary"
            onClick={handleRefresh}
            disabled={loading}
          >
            Reload Data
          </Button>
        </div>
      </header>

      {/* Error alert */}
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

      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '12px', color: '#605E5C', marginBottom: '4px' }}>
            Total Trips
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0078D4' }}>
            {loading ? '...' : trips.length}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '12px', color: '#605E5C', marginBottom: '4px' }}>
            Unassigned Trips
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: noDriverCount > 0 ? '#D13438' : '#107C10'
          }}>
            {loading ? '...' : noDriverCount}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '12px', color: '#605E5C', marginBottom: '4px' }}>
            Total Distance
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0078D4' }}>
            {loading ? '...' : totalDistance + ' mi'}
          </div>
        </div>
      </div>

      {/* Trip table */}
      <div style={cardStyle}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #EDEBE9'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
            Trip Details
          </h2>
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px'
          }}>
            <Waiting size="large" />
            <p style={{ marginTop: '16px', color: '#605E5C' }}>
              Loading trips...
            </p>
          </div>
        ) : trips.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#605E5C'
          }}>
            No trips found for this date.
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Vehicle</th>
                <th style={thStyle}>Driver Status</th>
                <th style={thStyle}>Distance</th>
                <th style={thStyle}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(function(trip, index) {
                var driverId = (trip.driver || {}).id;
                var isUnassigned = !driverId || driverId === 'NoDriverId' || driverId === 'UnknownDriverId';
                var driverName = isUnassigned
                  ? null
                  : (drivers[driverId] || 'Unknown (' + driverId + ')');
                var distanceMi = Math.round((trip.distance || 0) * 0.621371);
                var durationMin = Math.round(
                  (new Date(trip.stop) - new Date(trip.start)) / 60000
                );

                return (
                  <tr key={trip.id || index}>
                    <td style={tdStyle}>
                      <a
                        onClick={function() { navigateToDevice(trip.device.id); }}
                        style={{
                          color: '#0078D4',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {devices[trip.device.id] || 'Unknown'}
                      </a>
                    </td>
                    <td style={tdStyle}>
                      {isUnassigned ? (
                        <span style={{
                          color: '#D13438',
                          fontWeight: 600
                        }}>
                          NO DRIVER
                        </span>
                      ) : (
                        driverName
                      )}
                    </td>
                    <td style={tdStyle}>{distanceMi} mi</td>
                    <td style={tdStyle}>{durationMin}m</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </FeedbackProvider>
  );
}

export default TripAuditor;
