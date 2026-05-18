#!/bin/bash
# Validate the EV Mix and Fuel Tracker add-in
#
# Runs two suites:
#   1. Config JSON checks  (fixtures/pass-* and fail-*)
#   2. HTML source checks  (ev_tracker_v2.html)
#
# Usage: bash tests/ev-fuel-tracker/run.sh

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
VALIDATOR="$DIR/validate.js"
FIXTURES="$DIR/fixtures"
HTML="$ROOT/examples/addins/ev-fuel-tracker/ev_tracker_v2.html"
CONFIG="$ROOT/examples/addins/ev-fuel-tracker/ev-fuel-tracker-config.json"
ERRORS=0

echo "=== EV Fuel Tracker Add-In Tests ==="
echo ""

# --- Config: pass-* fixtures ---
echo "-- Config checks (pass fixtures) --"
for f in "$FIXTURES"/pass-*.json; do
    [ -f "$f" ] || continue
    name="$(basename "$f")"
    if node "$VALIDATOR" "$f" > /dev/null 2>&1; then
        echo "  OK   $name  (expected pass, got pass)"
    else
        echo "  FAIL $name  (expected pass, got FAIL)"
        node "$VALIDATOR" "$f" 2>&1 | sed 's/^/       /'
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "-- Config checks (fail fixtures) --"
for f in "$FIXTURES"/fail-*.json; do
    [ -f "$f" ] || continue
    name="$(basename "$f")"
    if node "$VALIDATOR" "$f" > /dev/null 2>&1; then
        echo "  FAIL $name  (expected fail, got PASS)"
        ERRORS=$((ERRORS + 1))
    else
        echo "  OK   $name  (expected fail, got fail)"
    fi
done

# --- Live config file ---
echo ""
echo "-- Live config (ev-fuel-tracker-config.json) --"
if node "$VALIDATOR" "$CONFIG" > /dev/null 2>&1; then
    echo "  OK   ev-fuel-tracker-config.json passes all config checks"
else
    echo "  FAIL ev-fuel-tracker-config.json has config errors:"
    node "$VALIDATOR" "$CONFIG" 2>&1 | sed 's/^/       /'
    ERRORS=$((ERRORS + 1))
fi

# --- HTML checks ---
echo ""
echo "-- HTML checks (ev_tracker_v2.html) --"
if node "$VALIDATOR" --html "$HTML" > /dev/null 2>&1; then
    echo "  OK   ev_tracker_v2.html passes all HTML checks"
else
    echo "  FAIL ev_tracker_v2.html has HTML errors:"
    node "$VALIDATOR" --html "$HTML" 2>&1 | sed 's/^/       /'
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
    echo "All tests passed."
    exit 0
else
    echo "$ERRORS test(s) failed."
    exit 1
fi
