#!/usr/bin/env node

/**
 * Gem Output Validator
 *
 * Validates a Geotab Add-In configuration JSON (as produced by the
 * "Geotab Add-In Architect" Gem) against the rules in
 * resources/GEM_INSTRUCTIONS.txt (and guides/GOOGLE_GEM_CREATOR_GUIDE.md).
 *
 * Usage:
 *   node validate.js <config.json>            # validate one file
 *   node validate.js fixtures/*.json          # validate many files
 *   cat config.json | node validate.js -      # read from stdin
 *
 * Exit codes:
 *   0  all checks passed
 *   1  one or more checks failed
 */

"use strict";

// ---------------------------------------------------------------------------
// Checks – each function receives the parsed config and the raw JSON string.
// Return { pass: true } or { pass: false, message: "..." }.
// ---------------------------------------------------------------------------

var checks = [];

function check(name, fn) {
    checks.push({ name: name, fn: fn });
}

// 1. Required top-level fields (Gem only produces embedded configs with "files")
check("has required fields (name, supportEmail, version, items, files)", function (cfg) {
    var missing = ["name", "supportEmail", "version", "items", "files"].filter(function (f) {
        return cfg[f] === undefined;
    });
    if (missing.length) return { pass: false, message: "Missing: " + missing.join(", ") };
    return { pass: true };
});

// 2. supportEmail is not support@geotab.com
check("supportEmail is not support@geotab.com", function (cfg) {
    if (/support@geotab\.com/i.test(cfg.supportEmail)) {
        return { pass: false, message: "supportEmail must not be support@geotab.com" };
    }
    return { pass: true };
});

// 3. name field – no disallowed characters
check("name has no disallowed characters (&, +, !, @)", function (cfg) {
    if (/[&+!@]/.test(cfg.name)) {
        return { pass: false, message: 'name "' + cfg.name + '" contains &, +, !, or @' };
    }
    return { pass: true };
});

// 4. path has no trailing slash
check("path has no trailing slash", function (cfg) {
    var bad = (cfg.items || []).filter(function (item) {
        return item.path && /\/$/.test(item.path);
    });
    if (bad.length) return { pass: false, message: "path should not end with /" };
    return { pass: true };
});

// Helper: extract all HTML file contents from the config
function htmlContents(cfg) {
    if (!cfg.files) return [];
    return Object.keys(cfg.files).map(function (k) { return cfg.files[k]; });
}

// 5. callback() is called in initialize
check("initialize calls callback()", function (cfg) {
    var pages = htmlContents(cfg);
    if (!pages.length) return { pass: true };
    var missing = pages.filter(function (html) {
        // must contain both "initialize" and "callback()" nearby
        return /initialize/.test(html) && !/callback\s*\(\s*\)/.test(html);
    });
    if (missing.length) return { pass: false, message: "initialize function must call callback()" };
    return { pass: true };
});

// 6. No <style> tags
check("no <style> tags (CSS must be inline)", function (cfg) {
    var pages = htmlContents(cfg);
    var bad = pages.filter(function (html) { return /<style[\s>]/i.test(html); });
    if (bad.length) return { pass: false, message: "<style> tags are stripped by MyGeotab – use inline style" };
    return { pass: true };
});

// 7. No typeName: "Driver" or "Vehicle"
check('no typeName "Driver" or "Vehicle"', function (cfg) {
    var pages = htmlContents(cfg);
    var bad = pages.filter(function (html) {
        return /typeName['":\s]+(["'])Driver\1/i.test(html) ||
               /typeName['":\s]+(["'])Vehicle\1/i.test(html);
    });
    if (bad.length) {
        return { pass: false, message: 'Use "User" with isDriver:true instead of "Driver", and "Device" instead of "Vehicle"' };
    }
    return { pass: true };
});

// 8. Registration ends with }; not }();
check("add-in registration uses }; not }()", function (cfg) {
    var pages = htmlContents(cfg);
    var bad = pages.filter(function (html) {
        return /geotab\.addin\[/.test(html) && /\}\s*\(\s*\)\s*;/.test(html);
    });
    if (bad.length) return { pass: false, message: "Add-in function should be assigned (};), not invoked (}())" };
    return { pass: true };
});

// 9. Debug log div included
check("has debug log toggle", function (cfg) {
    var pages = htmlContents(cfg);
    if (!pages.length) return { pass: true };
    var missing = pages.filter(function (html) {
        return !/debug-log/.test(html);
    });
    if (missing.length) return { pass: false, message: "Every Add-In should include the debug-log toggle div" };
    return { pass: true };
});

// 10. Copy Debug Data button included
check("has Copy Debug Data button", function (cfg) {
    var pages = htmlContents(cfg);
    if (!pages.length) return { pass: true };
    var missing = pages.filter(function (html) {
        return !/copyDebugData/.test(html);
    });
    if (missing.length) return { pass: false, message: "Every Add-In should include a copyDebugData() function and button for AI-assisted debugging" };
    return { pass: true };
});

// 11. Vehicle links are clickable (when the add-in lists devices)
check("vehicle names are clickable links (when listing devices)", function (cfg) {
    var pages = htmlContents(cfg);
    var needsLinks = pages.filter(function (html) {
        // Add-in fetches Device data
        return /typeName['":\s]+(["'])Device\1/.test(html) &&
               /\.forEach/.test(html);
    });
    if (!needsLinks.length) return { pass: true }; // doesn't list devices

    var missing = needsLinks.filter(function (html) {
        return !/window\.parent\.location\.hash/.test(html) ||
               !/device,id:/.test(html);
    });
    if (missing.length) {
        return {
            pass: false,
            message: "When listing vehicles, make names clickable with window.parent.location.hash = 'device,id:' + device.id"
        };
    }
    return { pass: true };
});

// 11. Variables are declared (spot-check for common patterns)
check("variables are declared with var/let/const", function (cfg) {
    var pages = htmlContents(cfg);
    // Look for obvious undeclared assignments at statement start:
    // e.g. "container = " without var/let/const preceding it
    // This is a heuristic – not exhaustive
    var bad = pages.filter(function (html) {
        // Strip string literals to avoid false positives
        var stripped = html.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
        // Look for assignment at start of statement (after ; or {) without declaration
        return /[;{]\s*([a-z_]\w+)\s*=\s*[^=]/i.test(stripped) &&
               !/var |let |const /.test(stripped);
    });
    // Only flag if there are NO declarations at all (all-undeclared)
    if (bad.length) {
        return { pass: false, message: "Variables should be declared with var, let, or const" };
    }
    return { pass: true };
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function validate(json, filename) {
    var cfg;
    try {
        cfg = JSON.parse(json);
    } catch (e) {
        return { filename: filename, error: "Invalid JSON: " + e.message, results: [] };
    }

    var results = checks.map(function (c) {
        try {
            var result = c.fn(cfg, json);
            return { name: c.name, pass: result.pass, message: result.message || "" };
        } catch (e) {
            return { name: c.name, pass: false, message: "Check threw: " + e.message };
        }
    });
    return { filename: filename, error: null, results: results };
}

function printReport(report) {
    var label = report.filename || "stdin";
    console.log("\n--- " + label + " ---");

    if (report.error) {
        console.log("  FAIL  " + report.error);
        return false;
    }

    var allPass = true;
    report.results.forEach(function (r) {
        var icon = r.pass ? "  PASS" : "  FAIL";
        var line = icon + "  " + r.name;
        if (!r.pass && r.message) line += "\n        → " + r.message;
        console.log(line);
        if (!r.pass) allPass = false;
    });
    return allPass;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

var fs = require("fs");
var args = process.argv.slice(2);

if (!args.length) {
    console.log("Usage: node validate.js <config.json> [config2.json ...]");
    console.log("       cat config.json | node validate.js -");
    process.exit(0);
}

var allPassed = true;

if (args.length === 1 && args[0] === "-") {
    // Read from stdin
    var chunks = [];
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", function (chunk) { chunks.push(chunk); });
    process.stdin.on("end", function () {
        var report = validate(chunks.join(""), "stdin");
        if (!printReport(report)) allPassed = false;
        process.exit(allPassed ? 0 : 1);
    });
} else {
    args.forEach(function (file) {
        var json = fs.readFileSync(file, "utf8");
        var report = validate(json, file);
        if (!printReport(report)) allPassed = false;
    });
    console.log(allPassed ? "\nAll checks passed." : "\nSome checks failed.");
    process.exit(allPassed ? 0 : 1);
}
