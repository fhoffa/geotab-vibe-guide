# F1 Operations Hub

MyGeotab Add-In for monitoring zone breaches during the Las Vegas F1 Grand Prix.

## Key Fix: No More Flicker

The original v1.8 rebuilt the entire table every 10 seconds (`innerHTML = ''`), causing visual flicker.

**v2.0 uses row IDs** - existing rows update in place, only new rows are added, removed rows are deleted. No flicker.

```javascript
// Check if row exists
var row = document.getElementById('row-' + id);
if (row) {
  // Update badge only
  row.querySelector('.badge').textContent = count;
} else {
  // Create new row
  tbl.appendChild(createRow(id, name, count));
}
```

## Features

- Monitors 6 hardcoded F1 zone rule IDs
- Demo "Mobile Generator - Sector 7" always shown
- **Locate** - Opens asset on MyGeotab map
- **WhatsApp** - Pre-filled alert message
- Countdown to Nov 21, 2026 race
- Auto-refresh every 10s

## Install

1. MyGeotab → Administration → System Settings → Add-Ins
2. New Add-In → Paste contents of `f1-operations-hub.json`
3. Save and refresh
