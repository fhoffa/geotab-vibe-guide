/**
 * Animal Speed Map v0.2 — application logic
 * Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
 *
 * Pure functions are exported via module.exports so the test suite can
 * require() them without a browser. Browser-only code is guarded by
 * `typeof document !== 'undefined'`.
 */

'use strict';

// ---------------------------------------------------------------------------
// Pure / testable functions
// ---------------------------------------------------------------------------

/**
 * Return an emoji that represents the animal closest to `speed` (km/h).
 * @param {number} speed
 * @returns {string} emoji
 */
function getAnimalEmoji(speed) {
  if (speed === 0)  return '💤';
  if (speed <= 20)  return '🐌';
  if (speed <= 50)  return '🐢';
  if (speed <= 90)  return '🐎';
  return '🐆';
}

/**
 * Build a lookup map from device id → DeviceStatusInfo object.
 * @param {Array} statuses  Array of DeviceStatusInfo records
 * @returns {Object}
 */
function buildStatusLookup(statuses) {
  var lookup = {};
  statuses.forEach(function(s) {
    if (s && s.device && s.device.id) {
      lookup[s.device.id] = s;
    }
  });
  return lookup;
}

/**
 * Build a lookup map from device id → device name.
 * @param {Array} devices  Array of Device records
 * @returns {Object}
 */
function buildDeviceIndex(devices) {
  var index = {};
  devices.forEach(function(d) {
    if (d && d.id) {
      index[d.id] = d.name || 'Unknown';
    }
  });
  return index;
}

/**
 * Filter statuses to only those with valid GPS coordinates.
 * @param {Array} statuses
 * @returns {Array}
 */
function filterMappable(statuses) {
  return statuses.filter(function(s) {
    return s && s.latitude && s.longitude;
  });
}

/**
 * Format a status record into a display-ready object for a table row.
 * @param {Object} device  Device record
 * @param {Object} status  DeviceStatusInfo record (may be undefined)
 * @returns {{ name: string, speed: number, emoji: string, id: string }}
 */
function buildRowData(device, status) {
  var speed = (status && status.speed) || 0;
  return {
    id:    device.id,
    name:  device.name || 'Unknown',
    speed: speed,
    emoji: getAnimalEmoji(speed)
  };
}

// ---------------------------------------------------------------------------
// Browser-only: state, API helpers, DOM rendering
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {

  var _apiBase, _creds;
  var _debugData = {};
  var _map, _markers = [];

  // ---- Debug helpers ----

  function debugLog(msg) {
    var el = document.getElementById('debug-log');
    if (el) {
      el.textContent += '[' + new Date().toLocaleTimeString() + '] ' + msg + '\n';
      el.scrollTop = el.scrollHeight;
    }
  }

  function debugSample(key, arr) {
    _debugData[key] = { total: arr.length, sample: arr.slice(0, 10) };
  }

  window.toggleDebug = function() {
    var d = document.getElementById('debug-log');
    d.style.display = d.style.display === 'none' ? 'block' : 'none';
  };

  window.copyDebugData = function() {
    var t = document.createElement('textarea');
    t.value = JSON.stringify(_debugData, null, 2);
    document.body.appendChild(t); t.select();
    document.execCommand('copy'); document.body.removeChild(t);
    alert('Debug data copied to clipboard!');
  };

  // ---- API helpers ----

  function apiCall(method, params, cb, errCb) {
    fetch(_apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: method, params: Object.assign({ credentials: _creds }, params) })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) { if (errCb) errCb(data.error.message); else debugLog('API error: ' + data.error.message); }
      else cb(data.result);
    })
    .catch(function(e) { if (errCb) errCb(e.message); else debugLog('Fetch error: ' + e.message); });
  }

  function multiCall(calls, cb, errCb) {
    fetch(_apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'ExecuteMultiCall', params: { calls: calls, credentials: _creds } })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) { if (errCb) errCb(data.error.message); else debugLog('MultiCall error: ' + data.error.message); }
      else cb(data.result);
    })
    .catch(function(e) { if (errCb) errCb(e.message); else debugLog('Fetch error: ' + e.message); });
  }

  // ---- Login ----

  window.doLogin = function() {
    var server = document.getElementById('in-server').value.trim();
    var db     = document.getElementById('in-db').value.trim();
    var user   = document.getElementById('in-user').value.trim();
    var pass   = document.getElementById('in-pass').value;
    var errEl  = document.getElementById('login-error');
    errEl.style.display = 'none';

    _apiBase = 'https://' + server + '/apiv1';
    var btn = document.getElementById('login-btn');
    btn.textContent = 'Connecting...'; btn.disabled = true;

    fetch(_apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'Authenticate', params: { database: db, userName: user, password: pass } })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) {
        errEl.textContent = data.error.message || 'Login failed.';
        errEl.style.display = 'block';
        btn.textContent = 'Connect to Fleet'; btn.disabled = false;
        return;
      }
      _creds = data.result.credentials;
      if (data.result.path && data.result.path !== 'ThisServer') {
        _apiBase = 'https://' + data.result.path + '/apiv1';
        debugLog('Redirected to: ' + _apiBase);
      }
      debugLog('Authenticated as ' + user + ' on ' + db);
      showApp();
    })
    .catch(function(e) {
      errEl.textContent = 'Connection error: ' + e.message;
      errEl.style.display = 'block';
      btn.textContent = 'Connect to Fleet'; btn.disabled = false;
    });
  };

  document.addEventListener('keydown', function(e) {
    var panel = document.getElementById('login-panel');
    if (e.key === 'Enter' && panel && panel.style.display !== 'none') window.doLogin();
  });

  // ---- App ----

  function showApp() {
    document.getElementById('login-panel').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    _map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OSM' }).addTo(_map);

    window.refreshData();
  }

  window.refreshData = function() {
    document.getElementById('status-bar').textContent = 'Loading...';
    multiCall(
      [['Get', { typeName: 'Device' }], ['Get', { typeName: 'DeviceStatusInfo' }]],
      function(results) {
        var devices  = results[0];
        var statuses = results[1];
        debugSample('devices', devices);
        debugSample('statuses', statuses);
        debugLog('Loaded ' + devices.length + ' devices, ' + statuses.length + ' statuses');

        var statusLookup = buildStatusLookup(statuses);
        renderTable(devices, statusLookup);
        renderMap(devices, statuses);

        var ts = new Date().toLocaleTimeString();
        document.getElementById('status-bar').textContent =
          devices.length + ' vehicles · last updated ' + ts + ' ';
      },
      function(err) { debugLog('Error: ' + err); document.getElementById('status-bar').textContent = 'Error'; }
    );
  };

  function renderMap(devices, statuses) {
    _markers.forEach(function(m) { _map.removeLayer(m); });
    _markers = [];
    var coords = [];
    var deviceIndex = buildDeviceIndex(devices);

    filterMappable(statuses).forEach(function(s) {
      var name  = deviceIndex[s.device.id] || 'Unknown';
      var speed = s.speed || 0;
      var emoji = getAnimalEmoji(speed);
      var icon  = L.divIcon({
        html: '<div style="font-size:24px;">' + emoji + '</div>',
        className: 'custom-div-icon', iconSize: [30, 30], iconAnchor: [15, 15]
      });
      var marker = L.marker([s.latitude, s.longitude], { icon: icon })
        .addTo(_map)
        .bindPopup('<b>' + name + '</b><br>Speed: ' + speed + ' km/h');
      _markers.push(marker);
      coords.push([s.latitude, s.longitude]);
    });
    if (coords.length > 0) _map.fitBounds(coords);
  }

  function renderTable(devices, statusLookup) {
    var list = document.getElementById('device-list');
    list.innerHTML = '';
    devices.forEach(function(d) {
      var row_data = buildRowData(d, statusLookup[d.id]);

      var row     = document.createElement('tr');
      var emojiTd = document.createElement('td');
      emojiTd.style.fontSize = '20px';
      emojiTd.textContent = row_data.emoji;

      var nameTd = document.createElement('td');
      var a = document.createElement('a');
      a.textContent = row_data.name;
      a.href = '#';
      a.className = 'vehicle-link';
      a.onclick = function(e) { e.preventDefault(); window.parent.location.hash = '#device,id:' + d.id; };
      nameTd.appendChild(a);

      var speedTd = document.createElement('td');
      speedTd.textContent = row_data.speed + ' km/h';

      var inputTd = document.createElement('td');
      var input = document.createElement('input');
      input.id = 'input-' + d.id;
      input.placeholder = 'New name...';
      input.className = 'rename-input';
      inputTd.appendChild(input);

      var actionTd = document.createElement('td');
      var btn = document.createElement('button');
      btn.textContent = 'Rename';
      btn.className = 'rename-btn';
      btn.onclick = (function(id, inp) {
        return function() { renameDevice(id, inp.value); };
      }(d.id, input));
      actionTd.appendChild(btn);

      row.appendChild(emojiTd);
      row.appendChild(nameTd);
      row.appendChild(speedTd);
      row.appendChild(inputTd);
      row.appendChild(actionTd);
      list.appendChild(row);
    });
  }

  function renameDevice(id, newName) {
    if (!newName) { alert('Please enter a name'); return; }
    apiCall('Set', { typeName: 'Device', entity: { id: id, name: newName } },
      function() { alert('Vehicle renamed!'); window.refreshData(); },
      function(err) { alert('Error: ' + err); }
    );
  }

} // end browser-only block

// ---------------------------------------------------------------------------
// Export pure functions for Node.js test suite
// ---------------------------------------------------------------------------

if (typeof module !== 'undefined') {
  module.exports = { getAnimalEmoji, buildStatusLookup, buildDeviceIndex, filterMappable, buildRowData };
}
