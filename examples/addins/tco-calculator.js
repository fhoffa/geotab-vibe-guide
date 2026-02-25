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


// ── Date range helper ────────────────────────────────────────────
//
// Converts the dateRange <select> value into { from, to } ISO strings.

function getDates(val) {
  var now = new Date();
  var start = new Date();
  var end = new Date();

  if (val === "30") start.setDate(now.getDate() - 30);
  else if (val === "60") start.setDate(now.getDate() - 60);
  else if (val === "90") start.setDate(now.getDate() - 90);
  else if (val === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (val === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  } else if (val === "lastYear") {
    start = new Date(now.getFullYear() - 1, 0, 1);
    end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
  }

  return { from: start.toISOString(), to: end.toISOString() };
}


// ── Main data fetch ──────────────────────────────────────────────
//
// Uses api.multiCall() to fetch Device and Trip in a single round-trip,
// then separately fetches AddInData (so a failure there doesn't block display).
//
// Entities fetched:
//   1. Device     — all vehicles (name, year, make, model)
//   2. Trip       — trips for the selected date range (for mileage)
//   3. AddInData  — previously saved vehicle class assignments (separate call)

function refresh(api) {
  _api = api;

  // Build date range from the selector (wired up in initialize)
  var dates = getDates(document.getElementById("dateRange").value);

  // Fetch Device and Trip data via multiCall.
  // NOTE: AddInData is fetched separately so that a failure (e.g., no saved
  // data yet, or permission issues) does not block the main data load.
  api.multiCall([
    ["Get", { typeName: "Device" }],
    ["Get", { typeName: "Trip", search: { fromDate: dates.from, toDate: dates.to } }]
  ], function (results) {
    var devices = results[0];
    var trips   = results[1];

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
  }, function (error) {
    // Error callback — log and hide the loading indicator
    console.error("TCO Calculator: multiCall failed", error);
    document.getElementById("loading").textContent = "Error loading data. Check console.";
  });

  // Separately try to load saved class mappings from AddInData.
  // This is non-blocking — if it fails, vehicles just use the default class "L".
  api.call("Get", {
    typeName: "AddInData",
    search: { addInId: S_ID }
  }, function (stored) {
    if (stored && stored.length > 0) {
      _classMap = stored[0].details.map || {};
    }
  }, function () {
    // AddInData not found or not accessible — that's fine, use defaults
    console.log("TCO Calculator: No saved class mappings found, using defaults");
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

      // Wire up the RECALCULATE ALL button to re-fetch and re-render
      document.getElementById("saveBtn").onclick = function () {
        refresh(api);
      };

      // Wire up the date range selector to re-fetch when changed
      document.getElementById("dateRange").onchange = function () {
        refresh(api);
      };

      // Load initial data
      refresh(api);

      // CRITICAL: Must call callback() to signal MyGeotab that
      // the Add-In is ready. Without this, the page hangs.
      callback();
    },

    // Refresh data each time the user navigates back to this page.
    focus: function (api) {
      refresh(api);
    }
  };
};

console.log("TCO Calculator Add-In registered");
