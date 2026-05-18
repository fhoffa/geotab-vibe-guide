#!/usr/bin/env node
"use strict";

/**
 * Validator for the EV Mix and Fuel Tracker add-in.
 *
 * Two modes:
 *   node validate.js config.json     — validate a config JSON (external-hosted format)
 *   node validate.js --html page.html — validate the add-in HTML directly
 *
 * Exit codes: 0 = all pass, 1 = one or more fail
 */

var fs = require("fs");
var path = require("path");

// ---------------------------------------------------------------------------
// Config checks (for the JSON install file)
// ---------------------------------------------------------------------------

var configChecks = [];

function configCheck(name, fn) { configChecks.push({ name: name, fn: fn }); }

configCheck("has required fields (name, supportEmail, version, items)", function (cfg) {
    var missing = ["name", "supportEmail", "version", "items"].filter(function (f) {
        return cfg[f] === undefined;
    });
    if (missing.length) return { pass: false, message: "Missing: " + missing.join(", ") };
    return { pass: true };
});

configCheck("supportEmail is not support@geotab.com", function (cfg) {
    if (/support@geotab\.com/i.test(cfg.supportEmail)) {
        return { pass: false, message: "supportEmail must not be support@geotab.com" };
    }
    return { pass: true };
});

configCheck("name has no disallowed characters (&, +, !, @)", function (cfg) {
    if (/[&+!@]/.test(cfg.name)) {
        return { pass: false, message: 'name "' + cfg.name + '" contains &, +, !, or @' };
    }
    return { pass: true };
});

configCheck("path has no trailing slash", function (cfg) {
    var bad = (cfg.items || []).filter(function (item) {
        return item.path && /\/$/.test(item.path);
    });
    if (bad.length) return { pass: false, message: "path should not end with /" };
    return { pass: true };
});

configCheck("items use external GitHub Pages URL", function (cfg) {
    var items = cfg.items || [];
    if (!items.length) return { pass: false, message: "items array is empty" };
    var bad = items.filter(function (item) {
        return !item.url || !/^https?:\/\//.test(item.url);
    });
    if (bad.length) return { pass: false, message: "All items must use an absolute https:// URL (external-hosted)" };
    return { pass: true };
});

configCheck("no embedded files property (should be external-hosted)", function (cfg) {
    if (cfg.files !== undefined) {
        return { pass: false, message: "External-hosted config must not include a 'files' property" };
    }
    return { pass: true };
});

configCheck("URL points to ev_tracker_v2.html", function (cfg) {
    var items = cfg.items || [];
    var ok = items.some(function (item) { return item.url && /ev_tracker_v2\.html/.test(item.url); });
    if (!ok) return { pass: false, message: "No item URL references ev_tracker_v2.html" };
    return { pass: true };
});

// ---------------------------------------------------------------------------
// HTML checks (for the add-in page itself)
// ---------------------------------------------------------------------------

var htmlChecks = [];

function htmlCheck(name, fn) { htmlChecks.push({ name: name, fn: fn }); }

htmlCheck("no <style> tags (CSS must be inline)", function (html) {
    if (/<style[\s>]/i.test(html)) {
        return { pass: false, message: "<style> tags are stripped by MyGeotab – use inline style= attributes" };
    }
    return { pass: true };
});

htmlCheck('no typeName "Driver" or "Vehicle"', function (html) {
    if (/typeName['":\s]+(["'])Driver\1/i.test(html) || /typeName['":\s]+(["'])Vehicle\1/i.test(html)) {
        return { pass: false, message: 'Use "User" instead of "Driver", "Device" instead of "Vehicle"' };
    }
    return { pass: true };
});

htmlCheck("initialize calls callback()", function (html) {
    if (/initialize/.test(html) && !/callback\s*\(\s*\)/.test(html)) {
        return { pass: false, message: "initialize must call callback() or the add-in hangs" };
    }
    return { pass: true };
});

htmlCheck("vehicles are clickable (window.parent.location.hash)", function (html) {
    if (!/window\.parent\.location\.hash/.test(html)) {
        return { pass: false, message: "Vehicle navigation requires setting window.parent.location.hash" };
    }
    return { pass: true };
});

htmlCheck("debug-log panel present", function (html) {
    if (!/debug-log/.test(html)) {
        return { pass: false, message: "Missing debug-log element (needed for debugging in production)" };
    }
    return { pass: true };
});

htmlCheck("copyDebugData function present", function (html) {
    if (!/copyDebugData/.test(html)) {
        return { pass: false, message: "Missing copyDebugData() function" };
    }
    return { pass: true };
});

htmlCheck("uses DiagnosticFuelLevelId for fuel level", function (html) {
    if (!/DiagnosticFuelLevelId/.test(html)) {
        return { pass: false, message: "Should query DiagnosticFuelLevelId for ICE fuel readings" };
    }
    return { pass: true };
});

htmlCheck("uses DiagnosticElectricVehicleBatteryStateOfChargeId for EV battery", function (html) {
    if (!/DiagnosticElectricVehicleBatteryStateOfChargeId/.test(html)) {
        return { pass: false, message: "Should query DiagnosticElectricVehicleBatteryStateOfChargeId for EV battery SoC" };
    }
    return { pass: true };
});

htmlCheck("uses DeviceStatusInfo for live speed", function (html) {
    if (!/DeviceStatusInfo/.test(html)) {
        return { pass: false, message: "Should query DeviceStatusInfo for live speed data" };
    }
    return { pass: true };
});

htmlCheck("alert threshold is 20%", function (html) {
    if (!/<\s*20/.test(html) && !/<20/.test(html)) {
        return { pass: false, message: "Expected a < 20 threshold check for low fuel/battery alerts" };
    }
    return { pass: true };
});

htmlCheck("EV type classification overrides Gas default", function (html) {
    if (!/type.*=.*['\"]EV['\"]/.test(html) && !/'EV'/.test(html) && !/"EV"/.test(html)) {
        return { pass: false, message: "Should classify devices with EV battery data as type 'EV'" };
    }
    return { pass: true };
});

htmlCheck("geotab.addin registration uses assignment (not invocation)", function (html) {
    // Must end with }; not }() or }());
    if (/geotab\.addin\[/.test(html) && /\}\s*\(\s*\)\s*;/.test(html)) {
        return { pass: false, message: "Use geotab.addin['key']=function(){return{...};} not self-invocation" };
    }
    return { pass: true };
});

htmlCheck("filter buttons present for EV / Gas / Low", function (html) {
    var hasEv  = /filterTable\s*\(\s*['"]ev['"]\s*\)/.test(html);
    var hasGas = /filterTable\s*\(\s*['"]gas['"]\s*\)/.test(html);
    var hasLow = /filterTable\s*\(\s*['"]low['"]\s*\)/.test(html);
    if (!hasEv || !hasGas || !hasLow) {
        return { pass: false, message: "Missing filter buttons for EV, Gas, or Low (<20%) views" };
    }
    return { pass: true };
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function runChecks(checks, subject) {
    return checks.map(function (c) {
        try {
            var result = c.fn(subject);
            return { name: c.name, pass: result.pass, message: result.message || "" };
        } catch (e) {
            return { name: c.name, pass: false, message: "Check threw: " + e.message };
        }
    });
}

function printResults(label, results) {
    console.log("\n--- " + label + " ---");
    var allPass = true;
    results.forEach(function (r) {
        var line = (r.pass ? "  PASS" : "  FAIL") + "  " + r.name;
        if (!r.pass && r.message) line += "\n        → " + r.message;
        console.log(line);
        if (!r.pass) allPass = false;
    });
    return allPass;
}

var args = process.argv.slice(2);

if (!args.length) {
    console.log("Usage:");
    console.log("  node validate.js config.json          # validate install config");
    console.log("  node validate.js --html page.html     # validate add-in HTML");
    process.exit(0);
}

var allPassed = true;

if (args[0] === "--html") {
    var htmlFile = args[1];
    if (!htmlFile) { console.error("--html requires a file path"); process.exit(1); }
    var html = fs.readFileSync(htmlFile, "utf8");
    var results = runChecks(htmlChecks, html);
    if (!printResults(path.basename(htmlFile), results)) allPassed = false;
} else {
    args.forEach(function (file) {
        var raw = fs.readFileSync(file, "utf8");
        var cfg;
        try { cfg = JSON.parse(raw); } catch (e) { console.log("\n--- " + file + " ---\n  FAIL  Invalid JSON: " + e.message); allPassed = false; return; }
        var results = runChecks(configChecks, cfg);
        if (!printResults(file, results)) allPassed = false;
    });
}

console.log(allPassed ? "\nAll checks passed." : "\nSome checks failed.");
process.exit(allPassed ? 0 : 1);
