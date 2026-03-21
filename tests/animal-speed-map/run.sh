#!/bin/bash
# Run Animal Speed Map unit tests
#
# Tests pure JavaScript functions extracted from animal-speed-map.js.
# No browser or network required — runs entirely in Node.js.
#
# Usage: bash tests/animal-speed-map/run.sh

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Animal Speed Map Tests ==="
node "$DIR/test.js"
