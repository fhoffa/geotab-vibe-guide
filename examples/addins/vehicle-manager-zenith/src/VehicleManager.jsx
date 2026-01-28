import React, { useState, useEffect } from 'react';
import {
  Button,
  TextInput,
  Table,
  Alert,
  Waiting
} from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';

function VehicleManager({ api }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('...');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Get session info
      api.getSession(function(session) {
        setUsername(session.userName);
      });

      // Get vehicles
      const devices = await new Promise((resolve, reject) => {
        api.call('Get', { typeName: 'Device' }, resolve, reject);
      });
      setVehicles(devices);
    } catch (err) {
      setError('Failed to load vehicles. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveVehicleName(deviceId) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await new Promise((resolve, reject) => {
        api.call('Set', {
          typeName: 'Device',
          entity: { id: deviceId, name: editName }
        }, resolve, reject);
      });

      // Update local state
      setVehicles(vehicles.map(v =>
        v.id === deviceId ? { ...v, name: editName } : v
      ));
      setEditingId(null);
      setSuccess('Vehicle name updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update vehicle name: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(vehicle) {
    setEditingId(vehicle.id);
    setEditName(vehicle.name || '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  // Table columns
  const columns = [
    {
      key: 'serialNumber',
      header: 'Serial Number'
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_, row) => {
        if (editingId === row.id) {
          return (
            <TextInput
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter vehicle name"
              disabled={saving}
            />
          );
        }
        return row.name || 'N/A';
      }
    },
    {
      key: 'actions',
      header: 'Action',
      render: (_, row) => {
        if (editingId === row.id) {
          return (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="primary"
                onClick={() => saveVehicleName(row.id)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="secondary"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          );
        }
        return (
          <Button
            variant="secondary"
            onClick={() => startEdit(row)}
          >
            Edit
          </Button>
        );
      }
    }
  ];

  return (
    <div style={{
      padding: 'var(--zenith-spacing-lg, 24px)',
      fontFamily: 'var(--zenith-font-family, "Segoe UI", sans-serif)',
      minHeight: '100vh',
      background: 'var(--zenith-neutral-50, #FAF9F8)'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--zenith-spacing-lg, 24px)'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--zenith-font-size-xxl, 28px)',
            fontWeight: 'var(--zenith-font-weight-bold, 700)',
            margin: 0,
            color: 'var(--zenith-neutral-900, #201F1E)'
          }}>
            Vehicle Manager
          </h1>
          <p style={{
            margin: '4px 0 0 0',
            color: 'var(--zenith-neutral-500, #605E5C)'
          }}>
            Connected as: {username}
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
          onDismiss={() => setError(null)}
          style={{ marginBottom: '16px' }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          dismissible
          onDismiss={() => setSuccess(null)}
          style={{ marginBottom: '16px' }}
        >
          {success}
        </Alert>
      )}

      {/* Stats Card */}
      <div style={{
        background: 'white',
        padding: 'var(--zenith-spacing-md, 16px)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid var(--zenith-neutral-100, #EDEBE9)',
        marginBottom: 'var(--zenith-spacing-lg, 24px)'
      }}>
        <div style={{
          fontSize: 'var(--zenith-font-size-sm, 12px)',
          color: 'var(--zenith-neutral-500, #605E5C)',
          marginBottom: '4px'
        }}>
          Total Vehicles
        </div>
        <div style={{
          fontSize: 'var(--zenith-font-size-xxl, 28px)',
          fontWeight: 'var(--zenith-font-weight-bold, 700)',
          color: 'var(--zenith-primary, #0078D4)'
        }}>
          {loading ? '...' : vehicles.length}
        </div>
      </div>

      {/* Vehicle Table */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid var(--zenith-neutral-100, #EDEBE9)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: 'var(--zenith-spacing-md, 16px)',
          borderBottom: '1px solid var(--zenith-neutral-100, #EDEBE9)'
        }}>
          <h2 style={{
            fontSize: 'var(--zenith-font-size-lg, 16px)',
            fontWeight: 'var(--zenith-font-weight-semibold, 600)',
            margin: 0
          }}>
            Manage Vehicles
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
            <p style={{
              marginTop: '16px',
              color: 'var(--zenith-neutral-500, #605E5C)'
            }}>
              Loading vehicles...
            </p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={vehicles}
          />
        )}
      </div>
    </div>
  );
}

export default VehicleManager;
