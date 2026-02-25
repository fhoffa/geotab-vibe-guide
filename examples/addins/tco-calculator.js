// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
//
// Fleet TCO Calculator — Annotated JavaScript
// =============================================
// This file contains all the logic for the TCO Calculator Add-In.
// It demonstrates several key Geotab Add-In patterns:
//
//   1. api.multiCall()  — batch API requests for performance
//   2. AddInData        — persist user data across sessions
//   3. Trip + Device    — combine entities for fleet analytics
//   4. geotab.addin[]   — standard Add-In lifecycle registration
//
// See tco-calculator.html for the UI structure.

"use strict";

// ── Module-level state ───────────────────────────────────────────
//
// These variables are shared across all functions in the Add-In.
// They live in the closure created by the geotab.addin factory function.

var _db = {};        // Vehicle lookup: { deviceId: { id, name, info, cls, mi } }
var _classMap = {};  // Persisted mapping: { deviceId: "L"|"M"|"H" }
var _api;            // Reference to the MyGeotab API object

// Stable key for storing/retrieving AddInData.
// AddInData is a general-purpose key-value store that Add-Ins can use
// to persist custom data in the Geotab database.
var S_ID = "fleet_tco_calculator";


// ── Bulk operations (called from HTML onclick handlers) ──────────

/**
 * Assign every vehicle to the same class, then persist and refresh.
 * Called by the "Set All Light/Medium/Heavy" buttons.
 *
 * @param {string} c - Class code: "L", "M", or "H"
 */
function bulkSet(c) {
  var ids = Object.keys(_db);
  for (var i = 0; i < ids.length; i++) {
    _classMap[ids[i]] = c;
  }
  saveMapping();
}

/**
 * Update a single vehicle's class (called from per-row <select> dropdowns).
 *
 * @param {string} deviceId - The Geotab device ID
 * @param {string} cls      - Class code: "L", "M", or "H"
 */
function updateClass(deviceId, cls) {
  _classMap[deviceId] = cls;
  saveMapping();
}


// ── Persistence via AddInData ────────────────────────────────────
//
// AddInData lets Add-Ins store arbitrary JSON in the Geotab database.
// Here we store the vehicle→class mapping so users don't have to
// re-classify vehicles every time they open the calculator.
//
// API pattern:
//   api.call("Add", { typeName: "AddInData", entity: { addInId: "...", details: {...} } })
//
// The "Add" method with AddInData acts as an upsert — if a record
// with the same addInId exists, it gets replaced.

function saveMapping() {
  _api.call("Add", {
    typeName: "AddInData",
    entity: {
      addInId: S_ID,
      details: { map: _classMap }
    }
  }, function () {
    // After saving, re-fetch everything to ensure consistency
    refresh(_api);
  });
}


// ── Read class parameters from the UI ────────────────────────────
//
// Reads all 15 input fields (5 per class × 3 classes) and returns
// a structured object used by the TCO formula.
//
// Parameter key:
//   p = purchase price ($)
//   r = residual value ($)
//   y = useful life (years)
//   f = fuel cost ($/gallon)
//   m = maintenance cost ($/mile)

function getParameters() {
  return {
    L: {
      p: parseFloat(document.getElementById("L_p").value),
      r: parseFloat(document.getElementById("L_r").value),
      y: parseFloat(document.getElementById("L_y").value),
      f: parseFloat(document.getElementById("L_f").value),
      m: parseFloat(document.getElementById("L_m").value)
    },
    M: {
      p: parseFloat(document.getElementById("M_p").value),
      r: parseFloat(document.getElementById("M_r").value),
      y: parseFloat(document.getElementById("M_y").value),
      f: parseFloat(document.getElementById("M_f").value),
      m: parseFloat(document.getElementById("M_m").value)
    },
    H: {
      p: parseFloat(document.getElementById("H_p").value),
      r: parseFloat(document.getElementById("H_r").value),
      y: parseFloat(document.getElementById("H_y").value),
      f: parseFloat(document.getElementById("H_f").value),
      m: parseFloat(document.getElementById("H_m").value)
    }
  };
}


// ── Main data fetch ──────────────────────────────────────────────
//
// Uses api.multiCall() to fetch three entity types in a single
// round-trip — this is much faster than three separate api.call()s.
//
// Entities fetched:
//   1. Device     — all vehicles (name, year, make, model)
//   2. Trip       — trips from the last 30 days (for mileage)
//   3. AddInData  — previously saved vehicle class assignments
//
// NOTE: The date range is hardcoded to 30 days. The dateRange <select>
// in the UI is not wired up — a good enhancement exercise!

function refresh(api) {
  _api = api;

  // Build the "from" date — 30 days ago
  var fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);

  // multiCall takes an array of [methodName, params] pairs.
  // All three calls execute server-side in a single HTTP request.
  api.multiCall([
    ["Get", { typeName: "Device" }],
    ["Get", { typeName: "Trip", search: { fromDate: fromDate.toISOString() } }],
    ["Get", { typeName: "AddInData", search: { addInId: S_ID } }]
  ], function (results) {
    var devices = results[0];
    var trips   = results[1];
    var stored  = results[2];

    // Restore the saved class mapping (if any)
    if (stored.length > 0) {
      _classMap = stored[0].details.map || {};
    }

    // Build the vehicle lookup from Device entities.
    // Default class is "L" (Light) for any vehicle not previously classified.
    _db = {};
    devices.forEach(function (device) {
      var cls = _classMap[device.id] || "L";
      _db[device.id] = {
        id:   device.id,
        name: device.name,
        info: (device.year || "") + " " + (device.make || "") + " " + (device.model || ""),
        cls:  cls,
        mi:   0  // Will be summed from trips below
      };
    });

    // Sum trip distances per device.
    // IMPORTANT: Geotab returns Trip.distance in kilometers.
    // We convert to miles: km × 0.621371 = miles
    trips.forEach(function (trip) {
      if (_db[trip.device.id]) {
        _db[trip.device.id].mi += (trip.distance || 0) * 0.621371;
      }
    });

    // Re-render the table with updated data
    render();
  });
}


// ── Render the vehicle table and summary ─────────────────────────
//
// Iterates all vehicles, computes per-vehicle TCO, builds HTML rows,
// and updates the fleet summary totals.

function render() {
  var params = getParameters();
  var tbody = document.getElementById("tco-body");
  tbody.innerHTML = "";

  var totalMiles = 0;
  var totalTco = 0;
  var ids = Object.keys(_db);

  for (var i = 0; i < ids.length; i++) {
    var vehicle = _db[ids[i]];
    var cp = params[vehicle.cls];  // Cost parameters for this vehicle's class

    // ── TCO Formula ────────────────────────────────────────────
    //
    //   Depreciation (monthly) = (purchase − residual) / life_years / 12
    //   Fuel cost              = miles × 0.1 × fuel_price_per_gallon
    //                            ↑ 0.1 = 1/10 MPG (assumes 10 MPG for all classes)
    //                            NOTE: Using a flat 10 MPG for all classes is a
    //                            simplification. Real fleets vary widely:
    //                              Light trucks ~15-20 MPG
    //                              Medium trucks ~8-12 MPG
    //                              Heavy trucks ~5-7 MPG
    //   Maintenance cost       = miles × maintenance_rate_per_mile
    //
    var depreciation = ((cp.p - cp.r) / cp.y) / 12;
    var fuelCost     = vehicle.mi * 0.1 * cp.f;
    var maintCost    = vehicle.mi * cp.m;
    var vehicleTco   = depreciation + fuelCost + maintCost;

    totalMiles += vehicle.mi;
    totalTco += vehicleTco;

    // Build the table row with an inline class selector.
    // When the user changes the <select>, updateClass() is called
    // which persists the change and re-renders.
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + vehicle.name + "</td>" +
      "<td>" + vehicle.info + "</td>" +
      "<td>" +
        "<select onchange=\"updateClass('" + vehicle.id + "', this.value)\" " +
          "class=\"form-select form-select-sm\">" +
          "<option value=\"L\"" + (vehicle.cls === "L" ? " selected" : "") + ">Light</option>" +
          "<option value=\"M\"" + (vehicle.cls === "M" ? " selected" : "") + ">Medium</option>" +
          "<option value=\"H\"" + (vehicle.cls === "H" ? " selected" : "") + ">Heavy</option>" +
        "</select>" +
      "</td>" +
      "<td>" + vehicle.mi.toFixed(0) + "</td>" +
      "<td class=\"text-end fw-bold\">$" + vehicleTco.toFixed(2) + "</td>";

    tbody.appendChild(tr);
  }

  // Update fleet summary
  document.getElementById("sum-miles").textContent = Math.round(totalMiles).toLocaleString();
  document.getElementById("sum-tco").textContent = "$" + Math.round(totalTco).toLocaleString();

  // Hide the "Calculating..." spinner
  document.getElementById("loading").style.display = "none";
}


// ── Add-In lifecycle registration ────────────────────────────────
//
// Every MyGeotab Add-In must register via geotab.addin["addin-name"].
// The name here must match what's used in the configuration JSON.
//
// Lifecycle methods:
//   initialize(api, state, callback) — called once when Add-In first loads
//   focus(api, state)                — called each time user navigates to page
//   blur(api, state)                 — called when user leaves the page
//
// CRITICAL: You must call callback() in initialize or the Add-In will
// appear to hang. Even if your async work isn't done yet, call callback()
// to let MyGeotab know the page is ready.

geotab.addin["fleet-tco-calc"] = function () {
  return {
    initialize: function (api, state, callback) {
      console.log("TCO Calculator: initialize called");

      // Load initial data
      refresh(api);

      // Wire up the RECALCULATE ALL button to re-fetch and re-render
      document.getElementById("saveBtn").onclick = function () {
        refresh(api);
      };

      // CRITICAL: Must call callback() to signal MyGeotab that
      // the Add-In is ready. Without this, the page hangs.
      callback();
    }

    // NOTE: This Add-In omits focus() and blur(). MyGeotab doesn't
    // require them — they're optional. Adding a focus() handler that
    // calls refresh(api) would be a good enhancement so the data
    // refreshes each time the user navigates back to this page.
  };
};

console.log("TCO Calculator Add-In registered");
