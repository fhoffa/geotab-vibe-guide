// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
//
// Fleet TCO Calculator — Annotated JavaScript
// =============================================
// Full-featured Total Cost of Ownership calculator for Geotab fleets.
//
// Geotab API patterns demonstrated:
//   1. api.multiCall()   — batch Device + Trip + StatusData + AddInData
//   2. AddInData         — persist class mappings across sessions
//   3. StatusData        — real fuel/engine data via diagnostic IDs
//   4. Trip              — mileage (km) and idling duration
//   5. GetAceResults     — 3-step Ace AI integration
//   6. geotab.addin[]    — standard Add-In lifecycle
//
// Technical constraints: ES5 only (var, function, string +), inline CSS,
// window.parent.location.hash for MyGeotab navigation.

"use strict";

// ── Version banner ───────────────────────────────────────────────
// Logs immediately on script load so you can verify the right
// version is running, even before initialize() is called.
var TCO_VERSION = "3.0.0";
console.log("TCO Calculator v" + TCO_VERSION + " loaded at " + new Date().toISOString());

// ── Module-level state ───────────────────────────────────────────

var _db = {};            // Vehicle lookup: { deviceId: { id, name, info, cls, mi, idleHrs, fuelGal, ... } }
var _classMap = {};      // Persisted mapping: { deviceId: "L"|"M"|"H" }
var _api;                // Reference to the MyGeotab API object
var _sortField = "name"; // Current sort column
var _sortAsc = true;     // Sort direction
var _aceChatId = null;   // Ace AI chat session ID (reused across queries)

// Stable key for AddInData persistence.
var S_ID = "fleet_tco_calculator";


// ── Debug logging ────────────────────────────────────────────────
//
// Writes timestamped messages to the on-page debug panel (#debug-log)
// and to the browser console. The panel is toggled by the "Debug Log"
// button fixed at the bottom of the page.

function dbg(msg) {
  var el = document.getElementById("debug-log");
  if (el) {
    var ts = new Date().toISOString().substring(11, 23);
    el.textContent += "[" + ts + "] " + msg + "\n";
    el.scrollTop = el.scrollHeight;
  }
  console.log("[tco] " + msg);
}

// Copy the full vehicle dataset as JSON to the clipboard.
// Useful for debugging or pasting into external tools.
function copyDebugData() {
  var data = { vehicles: _db, classMap: _classMap, params: getParameters() };
  var text = JSON.stringify(data, null, 2);
  var ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  dbg("Debug data copied to clipboard (" + text.length + " chars)");
}


// ── Date range helper ────────────────────────────────────────────
//
// Reads the #dateRange selector and returns the "from" date.
// Supports: 30/60/90 days, month-to-date, year-to-date.

function getFromDate() {
  var el = document.getElementById("dateRange");
  var val = el ? el.value : "30";
  var now = new Date();
  if (val === "mtd") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (val === "ytd") {
    return new Date(now.getFullYear(), 0, 1);
  }
  var days = parseInt(val, 10) || 30;
  var d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}


// ── Bulk operations (called from HTML onclick handlers) ──────────

function bulkSet(c) {
  var ids = Object.keys(_db);
  for (var i = 0; i < ids.length; i++) {
    _classMap[ids[i]] = c;
  }
  saveMapping();
}

function updateClass(deviceId, cls) {
  _classMap[deviceId] = cls;
  saveMapping();
}


// ── Persistence via AddInData ────────────────────────────────────
//
// AddInData stores arbitrary JSON in the Geotab database, keyed by addInId.
// The "Add" method acts as an upsert — existing records are replaced.

function saveMapping() {
  _api.call("Add", {
    typeName: "AddInData",
    entity: {
      addInId: S_ID,
      details: { map: _classMap }
    }
  }, function () {
    refresh(_api);
  }, function (err) {
    console.error("AddInData save error:", err);
  });
}


// ── Read class parameters from the UI ────────────────────────────
//
// 6 parameters per class (p=purchase, r=residual, y=life, f=fuel, m=maint, i=idle).

function getParameters() {
  function v(id) { var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; }
  return {
    L: { p: v("L_p"), r: v("L_r"), y: v("L_y"), f: v("L_f"), m: v("L_m"), i: v("L_i") },
    M: { p: v("M_p"), r: v("M_r"), y: v("M_y"), f: v("M_f"), m: v("M_m"), i: v("M_i") },
    H: { p: v("H_p"), r: v("H_r"), y: v("H_y"), f: v("H_f"), m: v("H_m"), i: v("H_i") }
  };
}


// ── Parse ISO 8601 duration to hours ─────────────────────────────
//
// Trip.idlingDuration returns a TimeSpan string like "01:30:00" or
// an ISO 8601 duration like "PT1H30M". This handles both formats.

function parseDurationToHours(val) {
  if (!val) return 0;
  // Handle "HH:MM:SS" format
  if (typeof val === "string" && val.indexOf(":") > -1) {
    var parts = val.split(":");
    return (parseFloat(parts[0]) || 0) +
           (parseFloat(parts[1]) || 0) / 60 +
           (parseFloat(parts[2]) || 0) / 3600;
  }
  // Handle "PT1H30M15S" ISO 8601 format
  if (typeof val === "string" && val.indexOf("PT") === 0) {
    var h = 0, m = 0, s = 0;
    var hMatch = val.match(/(\d+)H/);
    var mMatch = val.match(/(\d+)M/);
    var sMatch = val.match(/(\d+)S/);
    if (hMatch) h = parseFloat(hMatch[1]);
    if (mMatch) m = parseFloat(mMatch[1]);
    if (sMatch) s = parseFloat(sMatch[1]);
    return h + m / 60 + s / 3600;
  }
  // If numeric (seconds), convert
  if (typeof val === "number") return val / 3600;
  return 0;
}


// ── Main data fetch ──────────────────────────────────────────────
//
// Uses api.multiCall() to batch four entity types in one round-trip:
//   1. Device     — vehicle metadata
//   2. Trip       — distance (km) and idling duration
//   3. StatusData — fuel used (DiagnosticDeviceTotalFuelId, liters)
//   4. AddInData  — saved vehicle class assignments
//
// NOTE on StatusData diagnostic IDs:
//   DiagnosticDeviceTotalFuelId returns cumulative fuel in liters.
//   We fetch the latest reading per device using the date range.
//   Convert liters to gallons: liters / 3.78541

function refresh(api) {
  _api = api;
  var fromDate = getFromDate();
  dbg("════════════════════════════════════════");
  dbg("Refreshing — from: " + fromDate.toISOString());

  api.multiCall([
    ["Get", { typeName: "Device" }],
    ["Get", { typeName: "Trip", search: { fromDate: fromDate.toISOString() }, resultsLimit: 50000 }],
    ["Get", { typeName: "StatusData", search: {
      diagnosticSearch: { id: "DiagnosticDeviceTotalFuelId" },
      fromDate: fromDate.toISOString()
    }, resultsLimit: 50000 }],
    ["Get", { typeName: "AddInData", search: { addInId: S_ID } }]
  ], function (results) {
    var devices  = results[0];
    var trips    = results[1];
    var fuelData = results[2];
    var stored   = results[3];

    dbg("Devices: " + devices.length + ", Trips: " + trips.length +
        ", FuelData: " + fuelData.length + ", Stored: " + stored.length);

    // Restore saved class mapping
    if (stored.length > 0) {
      _classMap = stored[0].details.map || {};
    }

    // Build vehicle lookup from Device entities
    _db = {};
    devices.forEach(function (d) {
      _db[d.id] = {
        id:      d.id,
        name:    d.name || d.id,
        info:    ((d.year || "") + " " + (d.make || "") + " " + (d.model || "")).trim(),
        cls:     _classMap[d.id] || "L",
        mi:      0,       // miles — summed from trips
        idleHrs: 0,       // idle hours — summed from trips
        fuelGal: 0        // fuel gallons — from StatusData
      };
    });

    // Sum trip distances and idle time per device.
    // Trip.distance is in kilometers; convert: km * 0.621371 = miles
    // Trip.idlingDuration is a TimeSpan string.
    trips.forEach(function (t) {
      if (_db[t.device.id]) {
        _db[t.device.id].mi += (t.distance || 0) * 0.621371;
        _db[t.device.id].idleHrs += parseDurationToHours(t.idlingDuration);
      }
    });

    // Map fuel StatusData to vehicles.
    // StatusData.data for DiagnosticDeviceTotalFuelId is cumulative liters.
    // We take the max reading per device in the period as an approximation.
    var fuelMax = {};  // { deviceId: maxLiters }
    fuelData.forEach(function (sd) {
      var did = sd.device.id;
      if (!fuelMax[did] || sd.data > fuelMax[did]) {
        fuelMax[did] = sd.data;
      }
    });
    var fuelMin = {};
    fuelData.forEach(function (sd) {
      var did = sd.device.id;
      if (!fuelMin[did] || sd.data < fuelMin[did]) {
        fuelMin[did] = sd.data;
      }
    });
    // Fuel used in period = max - min reading (cumulative counter delta)
    Object.keys(fuelMax).forEach(function (did) {
      if (_db[did]) {
        var liters = (fuelMax[did] || 0) - (fuelMin[did] || 0);
        _db[did].fuelGal = Math.max(0, liters) / 3.78541;
      }
    });

    render();
  }, function (err) {
    dbg("FATAL multiCall error: " + err);
    var loadEl = document.getElementById("loading");
    if (loadEl) loadEl.textContent = "Error loading data: " + err;
  });
}


// ── TCO calculation for a single vehicle ─────────────────────────
//
// TCO = Fixed Cost + Operational Cost + Waste Cost
//
//   Fixed (monthly depreciation) = (purchase - residual) / life_years / 12
//   Operational = fuel_gallons * fuel_price + miles * maint_rate
//   Waste = idle_hours * idle_cost_per_hour
//
// This replaces the original flat "miles * 0.1 * fuel_price" formula
// with real fuel data from StatusData when available, falling back to
// an estimate (miles / 10 MPG) when fuel data is zero.

function calcTco(vehicle, params) {
  var cp = params[vehicle.cls];
  var fixed = ((cp.p - cp.r) / Math.max(cp.y, 1)) / 12;

  // Fuel cost: use real fuel data if available, else estimate at 10 MPG
  var gallons = vehicle.fuelGal > 0 ? vehicle.fuelGal : (vehicle.mi * 0.1);
  var fuelCost = gallons * cp.f;

  var maintCost = vehicle.mi * cp.m;
  var wasteCost = vehicle.idleHrs * cp.i;

  return {
    fixed: fixed,
    fuel: fuelCost,
    maint: maintCost,
    waste: wasteCost,
    total: fixed + fuelCost + maintCost + wasteCost
  };
}


// ── Sorting ──────────────────────────────────────────────────────
//
// Called from <th onclick="sortTable('field')"> in the HTML.
// Toggles direction if the same column is clicked again.

function sortTable(field) {
  if (_sortField === field) {
    _sortAsc = !_sortAsc;
  } else {
    _sortField = field;
    _sortAsc = true;
  }
  render();
}

function getSortedIds() {
  var ids = Object.keys(_db);
  var params = getParameters();
  ids.sort(function (a, b) {
    var va, vb;
    if (_sortField === "tco") {
      va = calcTco(_db[a], params).total;
      vb = calcTco(_db[b], params).total;
    } else if (_sortField === "mi" || _sortField === "idleHrs") {
      va = _db[a][_sortField];
      vb = _db[b][_sortField];
    } else {
      va = (_db[a][_sortField] || "").toLowerCase();
      vb = (_db[b][_sortField] || "").toLowerCase();
    }
    if (va < vb) return _sortAsc ? -1 : 1;
    if (va > vb) return _sortAsc ? 1 : -1;
    return 0;
  });
  return ids;
}


// ── Render the vehicle table and dashboard ───────────────────────

function render() {
  var params = getParameters();
  var tbody = document.getElementById("tco-body");
  if (!tbody) { dbg("render() skipped — DOM not ready"); return; }
  tbody.innerHTML = "";

  var totalMiles = 0, totalIdle = 0, totalFuelCost = 0, totalMaintCost = 0, totalTco = 0;
  var totalWaste = 0, totalOperational = 0;
  var ids = getSortedIds();

  for (var i = 0; i < ids.length; i++) {
    var v = _db[ids[i]];
    var tco = calcTco(v, params);

    totalMiles += v.mi;
    totalIdle += v.idleHrs;
    totalFuelCost += tco.fuel;
    totalMaintCost += tco.maint;
    totalWaste += tco.waste;
    totalOperational += tco.fuel + tco.maint;
    totalTco += tco.total;

    // Store computed TCO on vehicle for focus card and CSV
    v.tco = tco.total;
    v.tcoBreakdown = tco;

    var tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    // Clicking a row shows the Vehicle Focus Card in column 2.
    // We use an IIFE to capture the current vehicle in the closure.
    (function (vehicle) {
      tr.onclick = function () { showFocus(vehicle); };
    })(v);

    // Vehicle name links to MyGeotab device detail page.
    // IMPORTANT: Must use window.parent.location.hash (not window.location)
    // because Add-Ins run inside an iframe.
    var nameLink = "<a href=\"#\" onclick=\"event.stopPropagation();" +
      "window.parent.location.hash='device,id:" + v.id + "';return false;\" " +
      "style=\"color:#2563eb;text-decoration:none;\">" + v.name + "</a>";

    tr.innerHTML =
      "<td>" + nameLink + "</td>" +
      "<td>" + v.info + "</td>" +
      "<td>" +
        "<select onchange=\"event.stopPropagation();updateClass('" + v.id + "',this.value)\" " +
          "class=\"form-select form-select-sm\" style=\"min-width:85px;\">" +
          "<option value=\"L\"" + (v.cls === "L" ? " selected" : "") + ">Light</option>" +
          "<option value=\"M\"" + (v.cls === "M" ? " selected" : "") + ">Medium</option>" +
          "<option value=\"H\"" + (v.cls === "H" ? " selected" : "") + ">Heavy</option>" +
        "</select>" +
      "</td>" +
      "<td>" + Math.round(v.mi).toLocaleString() + "</td>" +
      "<td>" + v.idleHrs.toFixed(1) + "</td>" +
      "<td style=\"text-align:right;font-weight:bold;\">$" + tco.total.toFixed(2) + "</td>";

    tbody.appendChild(tr);
  }

  // Update fleet summary (null-safe for when DOM isn't fully loaded)
  function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
  setText("sum-miles", Math.round(totalMiles).toLocaleString());
  setText("sum-idle", Math.round(totalIdle).toLocaleString());
  setText("sum-fuel", "$" + Math.round(totalFuelCost).toLocaleString());
  setText("sum-maint", "$" + Math.round(totalMaintCost).toLocaleString());
  setText("sum-tco", "$" + Math.round(totalTco).toLocaleString());
  var loadEl = document.getElementById("loading");
  if (loadEl) loadEl.style.display = "none";

  dbg("Rendered " + ids.length + " vehicles — TCO: $" + Math.round(totalTco) +
      ", Waste: $" + Math.round(totalWaste));

  // Update health gauge
  renderGauge(totalTco, totalWaste);
}


// ── SVG Health Gauge ─────────────────────────────────────────────
//
// Odometer-style semicircular arc. The "efficiency" percentage is:
//   efficiency = 1 - (waste / total)
// where waste = idle costs. A fleet with zero idle waste = 100% efficient.
// The arc color transitions from red (0%) to green (100%).

function renderGauge(totalTco, totalWaste) {
  var pct = totalTco > 0 ? Math.max(0, Math.min(1, 1 - (totalWaste / totalTco))) : 1;
  var angle = pct * 180;       // 0=left (bad), 180=right (good)
  var rad = angle * Math.PI / 180;

  // Arc parameters: center at (80,90), radius 70, from 180deg to 0deg
  var cx = 80, cy = 90, r = 70;

  // Background arc (gray, full semicircle)
  var bgPath = "M " + (cx - r) + " " + cy +
    " A " + r + " " + r + " 0 0 1 " + (cx + r) + " " + cy;

  // Foreground arc (colored, partial)
  var endX = cx - r * Math.cos(rad);
  var endY = cy - r * Math.sin(rad);
  var largeArc = angle > 180 ? 1 : 0;
  var fgPath = "M " + (cx - r) + " " + cy +
    " A " + r + " " + r + " 0 " + largeArc + " 1 " + endX.toFixed(1) + " " + endY.toFixed(1);

  // Color: red(0%) -> yellow(50%) -> green(100%)
  var color;
  if (pct < 0.5) {
    color = "#e74c3c";
  } else if (pct < 0.75) {
    color = "#f39c12";
  } else {
    color = "#27ae60";
  }

  var svg = document.getElementById("healthGauge");
  if (!svg) return;
  svg.innerHTML =
    "<path d=\"" + bgPath + "\" fill=\"none\" stroke=\"#e0e0e0\" stroke-width=\"14\" stroke-linecap=\"round\"/>" +
    "<path d=\"" + fgPath + "\" fill=\"none\" stroke=\"" + color + "\" stroke-width=\"14\" stroke-linecap=\"round\"/>" +
    "<text x=\"" + cx + "\" y=\"" + (cy - 15) + "\" text-anchor=\"middle\" " +
      "font-size=\"28\" font-weight=\"bold\" fill=\"" + color + "\">" + Math.round(pct * 100) + "%</text>" +
    "<text x=\"" + cx + "\" y=\"" + (cy + 2) + "\" text-anchor=\"middle\" " +
      "font-size=\"10\" fill=\"#888\">EFFICIENCY</text>";

  var gaugeLabel = document.getElementById("gaugeLabel");
  if (gaugeLabel) gaugeLabel.textContent =
    "Idle waste: $" + Math.round(totalWaste).toLocaleString() + " of $" + Math.round(totalTco).toLocaleString() + " total";
}


// ── Vehicle Focus Card ───────────────────────────────────────────
//
// Shown when a table row is clicked. Replaces the gauge with a detail
// card for the selected vehicle, including navigation links.

function showFocus(v) {
  var tco = v.tcoBreakdown;
  var gv = document.getElementById("gaugeView");
  var fv = document.getElementById("focusView");
  if (gv) gv.style.display = "none";
  if (fv) fv.style.display = "block";

  var classNames = { L: "Light", M: "Medium", H: "Heavy" };
  var html =
    "<div style=\"font-weight:bold; font-size:14px; margin-bottom:6px;\">" +
      "<a href=\"#\" onclick=\"window.parent.location.hash='device,id:" + v.id + "';return false;\" " +
        "style=\"color:#2563eb;\">" + v.name + "</a>" +
    "</div>" +
    "<div style=\"color:#666; margin-bottom:8px;\">" + v.info + " &middot; " + classNames[v.cls] + "</div>" +
    "<table style=\"width:100%;font-size:11px;\">" +
      "<tr><td>Miles</td><td style=\"text-align:right;\">" + Math.round(v.mi).toLocaleString() + "</td></tr>" +
      "<tr><td>Idle Hours</td><td style=\"text-align:right;\">" + v.idleHrs.toFixed(1) + "</td></tr>" +
      "<tr><td>Fuel (gal)</td><td style=\"text-align:right;\">" + v.fuelGal.toFixed(1) + "</td></tr>" +
      "<tr style=\"border-top:1px solid #eee;\"><td>Fixed</td><td style=\"text-align:right;\">$" + tco.fixed.toFixed(2) + "</td></tr>" +
      "<tr><td>Fuel Cost</td><td style=\"text-align:right;\">$" + tco.fuel.toFixed(2) + "</td></tr>" +
      "<tr><td>Maintenance</td><td style=\"text-align:right;\">$" + tco.maint.toFixed(2) + "</td></tr>" +
      "<tr><td>Idle Waste</td><td style=\"text-align:right;color:#e74c3c;\">$" + tco.waste.toFixed(2) + "</td></tr>" +
      "<tr style=\"border-top:2px solid #002b49;font-weight:bold;\"><td>Total TCO</td><td style=\"text-align:right;\">$" + tco.total.toFixed(2) + "</td></tr>" +
    "</table>" +
    "<div style=\"margin-top:8px;\">" +
      "<a href=\"#\" onclick=\"window.parent.location.hash='tripsHistory,devices:!(" + v.id + ")';return false;\" " +
        "style=\"color:#2563eb;font-size:11px;margin-right:12px;\">Trip History</a>" +
      "<a href=\"#\" onclick=\"window.parent.location.hash='map,liveVehicleIds:!(" + v.id + ")';return false;\" " +
        "style=\"color:#2563eb;font-size:11px;\">Live Map</a>" +
    "</div>";

  var fb = document.getElementById("focusBody");
  if (fb) fb.innerHTML = html;
}

function closeFocus() {
  var fv = document.getElementById("focusView");
  var gv = document.getElementById("gaugeView");
  if (fv) fv.style.display = "none";
  if (gv) gv.style.display = "block";
}


// ── CSV Export ───────────────────────────────────────────────────
//
// Generates a CSV string from the current table data and triggers
// a browser download. Works without any server-side support.

function exportCsv() {
  var params = getParameters();
  var ids = getSortedIds();
  var rows = ["Vehicle,Year/Make/Model,Class,Miles,Idle Hours,Fuel (gal),Fixed $,Fuel $,Maint $,Idle Waste $,Total TCO $"];

  for (var i = 0; i < ids.length; i++) {
    var v = _db[ids[i]];
    var tco = calcTco(v, params);
    var classNames = { L: "Light", M: "Medium", H: "Heavy" };
    // Escape commas in vehicle names by quoting
    var name = v.name.indexOf(",") > -1 ? '"' + v.name + '"' : v.name;
    var info = v.info.indexOf(",") > -1 ? '"' + v.info + '"' : v.info;
    rows.push([
      name, info, classNames[v.cls],
      Math.round(v.mi), v.idleHrs.toFixed(1), v.fuelGal.toFixed(1),
      tco.fixed.toFixed(2), tco.fuel.toFixed(2), tco.maint.toFixed(2),
      tco.waste.toFixed(2), tco.total.toFixed(2)
    ].join(","));
  }

  var blob = new Blob([rows.join("\n")], { type: "text/csv" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "fleet_tco_report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// ── Ace AI Integration ───────────────────────────────────────────
//
// Uses the 3-step GetAceResults pattern:
//   Step 1: create-chat — get a chat session ID
//   Step 2: send-prompt — submit the user's question
//   Step 3: get-message-group — poll until status is DONE or FAILED
//
// CRITICAL: customerData:true is REQUIRED on every call.
// Initial poll delay: 8 seconds. Subsequent polls: 5 seconds.
// Max 30 attempts (~2.5 minutes timeout).

function askAce(prompt) {
  var resultEl = document.getElementById("aceResult");
  var bodyEl = document.getElementById("aceBody");
  if (resultEl) resultEl.style.display = "block";
  if (bodyEl) bodyEl.innerHTML = "<i>Thinking...</i>";

  // Step 1: create or reuse chat session
  function sendPrompt(chatId) {
    _aceChatId = chatId;
    // Step 2: send the user's question
    _api.call("GetAceResults", {
      serviceName: "dna-planet-orchestration",
      functionName: "send-prompt",
      customerData: true,
      functionParameters: { chat_id: chatId, prompt: prompt }
    }, function (res) {
      var data = res.apiResult.results[0];
      var mgId = data.message_group_id || ((data.message_group || {}).id);
      if (!mgId) {
        bodyEl.innerHTML = "Ace did not return a message group. Try again.";
        return;
      }
      // Step 3: poll after 8 second delay
      setTimeout(function () { pollAce(chatId, mgId, 0); }, 8000);
    }, function (err) {
      bodyEl.innerHTML = "Ace error: " + err;
    });
  }

  // Reuse existing chat session if available
  if (_aceChatId) {
    sendPrompt(_aceChatId);
  } else {
    _api.call("GetAceResults", {
      serviceName: "dna-planet-orchestration",
      functionName: "create-chat",
      customerData: true,
      functionParameters: {}
    }, function (res) {
      var chatId = res.apiResult.results[0].chat_id;
      if (!chatId) {
        bodyEl.innerHTML = "Ace not available. Check that Ace is enabled for your database.";
        return;
      }
      sendPrompt(chatId);
    }, function (err) {
      bodyEl.innerHTML = "Ace create-chat error: " + err;
    });
  }
}

function pollAce(chatId, mgId, attempt) {
  if (attempt > 30) {
    document.getElementById("aceBody").innerHTML = "Ace timed out. Try a simpler question.";
    return;
  }
  _api.call("GetAceResults", {
    serviceName: "dna-planet-orchestration",
    functionName: "get-message-group",
    customerData: true,
    functionParameters: { chat_id: chatId, message_group_id: mgId }
  }, function (res) {
    var data = res.apiResult.results[0];
    var status = data.message_group.status.status;

    if (status === "DONE") {
      var messages = data.message_group.messages || {};
      var keys = Object.keys(messages);
      var html = "";
      for (var i = 0; i < keys.length; i++) {
        var msg = messages[keys[i]];
        if (msg.reasoning) {
          html += "<div style=\"margin-bottom:6px;\">" + msg.reasoning + "</div>";
        }
        // Render preview_array as a table
        var preview = msg.preview_array || [];
        var cols = msg.columns || [];
        if (preview.length > 0) {
          html += "<table style=\"width:100%;font-size:11px;border-collapse:collapse;\">";
          if (cols.length > 0) {
            html += "<tr>";
            for (var c = 0; c < cols.length; c++) {
              html += "<th style=\"border-bottom:1px solid #ccc;padding:3px;text-align:left;\">" + cols[c] + "</th>";
            }
            html += "</tr>";
          }
          for (var r = 0; r < preview.length; r++) {
            html += "<tr>";
            var rowKeys = Object.keys(preview[r]);
            for (var k = 0; k < rowKeys.length; k++) {
              html += "<td style=\"border-bottom:1px solid #eee;padding:3px;\">" + preview[r][rowKeys[k]] + "</td>";
            }
            html += "</tr>";
          }
          html += "</table>";
        }
      }
      document.getElementById("aceBody").innerHTML = html || "Ace returned no data for this query.";
    } else if (status === "FAILED") {
      document.getElementById("aceBody").innerHTML = "Ace query failed. Try rephrasing your question.";
    } else {
      // Still processing — poll again in 5 seconds
      setTimeout(function () { pollAce(chatId, mgId, attempt + 1); }, 5000);
    }
  }, function () {
    // Network error — retry
    setTimeout(function () { pollAce(chatId, mgId, attempt + 1); }, 5000);
  });
}


// ── Add-In lifecycle registration ────────────────────────────────
//
// geotab.addin["name"] must match the addin name used in config JSON.
// initialize() is called once; focus() each time the user returns.
// CRITICAL: Always call callback() or the page hangs.

geotab.addin["fleet-tco-calc"] = function () {
  return {
    initialize: function (api, state, callback) {
      dbg("TCO Calculator v" + TCO_VERSION + " — initialize called");
      dbg("DOM: tco-body=" + !!document.getElementById("tco-body") +
          " dateRange=" + !!document.getElementById("dateRange"));

      // Wire up controls (null-safe)
      function bind(id, evt, fn) { var el = document.getElementById(id); if (el) el[evt] = fn; }
      bind("saveBtn", "onclick", function () { refresh(api); });
      bind("dateRange", "onchange", function () { refresh(api); });
      bind("csvBtn", "onclick", exportCsv);
      bind("focusClose", "onclick", closeFocus);
      bind("aceClose", "onclick", function () {
        var el = document.getElementById("aceResult");
        if (el) el.style.display = "none";
      });
      bind("aceBtn", "onclick", function () {
        var el = document.getElementById("aceInput");
        var q = el ? el.value.trim() : "";
        if (q) askAce(q);
      });
      bind("aceInput", "onkeydown", function (e) {
        if (e.keyCode === 13) {
          var el = document.getElementById("aceInput");
          var q = el ? el.value.trim() : "";
          if (q) askAce(q);
        }
      });

      refresh(api);
      callback();
    },

    focus: function (api) {
      _api = api;
      refresh(api);
    },

    blur: function () {
      dbg("TCO Calculator: blur");
    }
  };
};

console.log("TCO Calculator Add-In registered");
