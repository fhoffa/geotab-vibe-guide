# Complete Fleet Dashboard Example

A full example of a MyGeotab Add-In using Zenith components.

## FleetDashboard.jsx

```jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  TextInput,
  Table,
  Select,
  Alert,
  Waiting,
  Modal,
  Checkbox,
  Badge
} from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';

function FleetDashboard({ api }) {
  // State
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Ref for focus management
  const detailsButtonRef = useRef(null);

  // Load vehicles on mount
  useEffect(() => {
    loadVehicles();
  }, []);

  // API call to load vehicles
  async function loadVehicles() {
    setLoading(true);
    setError(null);

    try {
      const devices = await new Promise((resolve, reject) => {
        api.call('Get', { typeName: 'Device' }, resolve, reject);
      });
      setVehicles(devices);
    } catch (err) {
      setError('Failed to load vehicles. Please check your connection and try again.');
      console.error('Error loading vehicles:', err);
    } finally {
      setLoading(false);
    }
  }

  // Table column configuration
  const columns = [
    {
      key: 'name',
      header: 'Vehicle Name',
      sortable: true
    },
    {
      key: 'serialNumber',
      header: 'Serial Number'
    },
    {
      key: 'deviceType',
      header: 'Device Type'
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => {
        // Determine status based on device properties
        const isActive = row.activeFrom && new Date(row.activeFrom) <= new Date();
        return (
          <Badge variant={isActive ? 'success' : 'neutral'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      }
    }
  ];

  // Group options for filter
  const groupOptions = [
    { value: 'all', label: 'All Groups' },
    { value: 'trucks', label: 'Trucks' },
    { value: 'vans', label: 'Vans' },
    { value: 'cars', label: 'Cars' }
  ];

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesGroup = selectedGroup === 'all' ||
      vehicle.groups?.some(g => g.name?.toLowerCase().includes(selectedGroup));

    const matchesActive = !showActiveOnly ||
      (vehicle.activeFrom && new Date(vehicle.activeFrom) <= new Date());

    return matchesSearch && matchesGroup && matchesActive;
  });

  // Handle row click
  function handleRowClick(vehicle) {
    setSelectedVehicle(vehicle);
    setShowDetails(true);
  }

  // Handle modal close with focus management
  function handleCloseDetails() {
    setShowDetails(false);
    // Return focus to the last clicked row or refresh button
    setTimeout(() => {
      detailsButtonRef.current?.focus();
    }, 0);
  }

  return (
    <div style={{
      padding: 'var(--zenith-spacing-lg, 24px)',
      fontFamily: 'var(--zenith-font-family, "Segoe UI", sans-serif)'
    }}>
      {/* Page Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--zenith-spacing-lg, 24px)'
      }}>
        <h1 style={{
          fontSize: 'var(--zenith-font-size-xxl, 28px)',
          fontWeight: 'var(--zenith-font-weight-bold, 700)',
          margin: 0,
          color: 'var(--zenith-neutral-900, #201F1E)'
        }}>
          Fleet Dashboard
        </h1>

        <Button
          ref={detailsButtonRef}
          variant="primary"
          icon="refresh"
          onClick={loadVehicles}
          disabled={loading}
        >
          Refresh
        </Button>
      </header>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="error"
          dismissible
          onDismiss={() => setError(null)}
          style={{ marginBottom: 'var(--zenith-spacing-md, 16px)' }}
        >
          {error}
        </Alert>
      )}

      {/* Filters Toolbar */}
      <div style={{
        display: 'flex',
        gap: 'var(--zenith-spacing-md, 16px)',
        marginBottom: 'var(--zenith-spacing-lg, 24px)',
        flexWrap: 'wrap',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <TextInput
            label="Search Vehicles"
            placeholder="Enter vehicle name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ flex: '0 0 200px' }}>
          <Select
            label="Filter by Group"
            value={selectedGroup}
            onChange={setSelectedGroup}
            options={groupOptions}
          />
        </div>

        <div style={{ flex: '0 0 auto', paddingBottom: '4px' }}>
          <Checkbox
            label="Active only"
            checked={showActiveOnly}
            onChange={setShowActiveOnly}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'var(--zenith-spacing-md, 16px)',
        marginBottom: 'var(--zenith-spacing-lg, 24px)'
      }}>
        <StatCard
          label="Total Vehicles"
          value={vehicles.length}
          loading={loading}
        />
        <StatCard
          label="Filtered"
          value={filteredVehicles.length}
          loading={loading}
        />
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--zenith-spacing-xl, 32px)'
        }}>
          <Waiting size="large" />
          <p style={{
            marginTop: 'var(--zenith-spacing-md, 16px)',
            color: 'var(--zenith-neutral-500, #605E5C)'
          }}>
            Loading vehicles...
          </p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--zenith-spacing-xl, 32px)',
          color: 'var(--zenith-neutral-500, #605E5C)'
        }}>
          <p>No vehicles found matching your filters.</p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setSelectedGroup('all');
              setShowActiveOnly(false);
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredVehicles}
          onRowClick={handleRowClick}
        />
      )}

      {/* Vehicle Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={handleCloseDetails}
        title={selectedVehicle?.name || 'Vehicle Details'}
        size="medium"
      >
        {selectedVehicle && (
          <div>
            <DetailRow label="Name" value={selectedVehicle.name} />
            <DetailRow label="Serial Number" value={selectedVehicle.serialNumber} />
            <DetailRow label="Device Type" value={selectedVehicle.deviceType} />
            <DetailRow label="VIN" value={selectedVehicle.vehicleIdentificationNumber || 'N/A'} />
            <DetailRow
              label="Active From"
              value={selectedVehicle.activeFrom
                ? new Date(selectedVehicle.activeFrom).toLocaleDateString()
                : 'N/A'
              }
            />

            <div style={{
              display: 'flex',
              gap: 'var(--zenith-spacing-sm, 8px)',
              justifyContent: 'flex-end',
              marginTop: 'var(--zenith-spacing-lg, 24px)',
              paddingTop: 'var(--zenith-spacing-md, 16px)',
              borderTop: '1px solid var(--zenith-neutral-100, #EDEBE9)'
            }}>
              <Button variant="secondary" onClick={handleCloseDetails}>
                Close
              </Button>
              <Button variant="primary" onClick={() => {
                // Navigate to vehicle detail page or perform action
                console.log('View full details for:', selectedVehicle.id);
              }}>
                View Full Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, loading }) {
  return (
    <div style={{
      background: 'white',
      padding: 'var(--zenith-spacing-md, 16px)',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid var(--zenith-neutral-100, #EDEBE9)'
    }}>
      <div style={{
        fontSize: 'var(--zenith-font-size-sm, 12px)',
        color: 'var(--zenith-neutral-500, #605E5C)',
        marginBottom: 'var(--zenith-spacing-xs, 4px)'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--zenith-font-size-xxl, 28px)',
        fontWeight: 'var(--zenith-font-weight-bold, 700)',
        color: 'var(--zenith-primary, #0078D4)'
      }}>
        {loading ? '...' : value}
      </div>
    </div>
  );
}

// Detail Row Component
function DetailRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      padding: 'var(--zenith-spacing-sm, 8px) 0',
      borderBottom: '1px solid var(--zenith-neutral-100, #EDEBE9)'
    }}>
      <div style={{
        flex: '0 0 140px',
        fontWeight: 'var(--zenith-font-weight-semibold, 600)',
        color: 'var(--zenith-neutral-700, #3B3A39)'
      }}>
        {label}
      </div>
      <div style={{ flex: 1 }}>
        {value}
      </div>
    </div>
  );
}

export default FleetDashboard;
```

## App Entry Point (index.jsx)

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import FleetDashboard from './FleetDashboard';
import '@geotab/zenith/dist/index.css';

// MyGeotab Add-In entry point
geotab.addin.fleetDashboard = function(api, state) {
  let root = null;

  return {
    initialize: function(api, state, callback) {
      callback();
    },

    focus: function(api, state) {
      const container = document.getElementById('fleetDashboardRoot');
      if (container) {
        root = ReactDOM.createRoot(container);
        root.render(<FleetDashboard api={api} />);
      }
    },

    blur: function(api, state) {
      if (root) {
        root.unmount();
        root = null;
      }
    }
  };
};
```

## Webpack Configuration

```javascript
const path = require('path');

module.exports = {
  entry: './src/index.jsx',
  output: {
    filename: 'fleet-dashboard.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'umd'
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
```

## package.json

```json
{
  "name": "fleet-dashboard-addin",
  "version": "1.0.0",
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch"
  },
  "dependencies": {
    "@geotab/zenith": "^1.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@babel/preset-react": "^7.23.0",
    "babel-loader": "^9.1.0",
    "css-loader": "^6.8.0",
    "style-loader": "^3.3.0",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.0"
  }
}
```

## Add-In Configuration (config.json)

```json
{
  "name": "Fleet Dashboard",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
  "version": "1.0.0",
  "items": [
    {
      "page": "fleetDashboard",
      "title": "Fleet Dashboard",
      "menuName": "Fleet Dashboard",
      "icon": "images/icon.svg",
      "url": "dist/fleet-dashboard.html"
    }
  ],
  "isSigned": false
}
```

## HTML Template (fleet-dashboard.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fleet Dashboard</title>
</head>
<body>
  <div id="fleetDashboardRoot"></div>
  <script src="fleet-dashboard.js"></script>
</body>
</html>
```
