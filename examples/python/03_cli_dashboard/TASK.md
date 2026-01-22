# Task 03: CLI Dashboard

## Goal
Create an interactive command-line dashboard that students build in minutes 25-40 of tutorial. This should feel like a real monitoring tool.

## What to Build

### File 1: `dashboard.py`
**Purpose:** Main dashboard showing fleet overview

**Requirements:**
- Display key metrics at the top:
  - Total vehicles
  - Currently active (moving) vehicles
  - Idle vehicles
  - Total miles driven today
  - Vehicles with active faults
- Show list of vehicles with status indicators (🟢 active, 🟡 idle, 🔴 offline)
- Auto-refresh every 30 seconds
- Color-coded output (green=good, yellow=warning, red=critical)
- Clean, organized layout

**Example Output:**
```
╔══════════════════════════════════════════════════════════════╗
║               GEOTAB FLEET DASHBOARD                         ║
║               Last Updated: 2026-01-22 14:30:15             ║
╚══════════════════════════════════════════════════════════════╝

Fleet Summary
─────────────────────────────────────────────────────────────
  Total Vehicles:           15
  🟢 Active (Moving):        7
  🟡 Idle:                   5
  🔴 Offline:                3
  📊 Miles Today:          487.2
  ⚠️  Active Faults:         2

Vehicle Status
─────────────────────────────────────────────────────────────
🟢 Truck 001    45 mph    Last seen: 2 min ago
🟢 Van 042      32 mph    Last seen: 1 min ago
🟡 Car 103      0 mph     Last seen: 5 min ago (Idle: 15 min)
🟡 Truck 204    0 mph     Last seen: 3 min ago (Idle: 8 min)
🔴 Van 305      ---       Last seen: 2 hours ago
...

Alerts
─────────────────────────────────────────────────────────────
⚠️  Van 042: Low fuel (15%)
⚠️  Truck 001: Active fault code P0420

Press Ctrl+C to exit | Refreshing in 30s...
```

**Vibe Prompt:**
```
Create an interactive CLI dashboard for Geotab fleet monitoring that:
1. Shows fleet summary (total vehicles, active, idle, offline, miles driven today)
2. Lists all vehicles with status indicators and last seen time
3. Shows alerts for low fuel and active faults
4. Auto-refreshes every 30 seconds
5. Uses colored output and clean formatting
6. Handles Ctrl+C gracefully

Use colorama for colors, clear screen for refresh, and fetch data from Geotab API.
```

### File 2: `vehicle_detail.py`
**Purpose:** Detailed view for a single vehicle

**Requirements:**
- Take vehicle name/ID as command-line argument
- Show comprehensive vehicle information:
  - Basic info (name, VIN, serial, type)
  - Current location (lat/long, speed, map link)
  - Latest diagnostics (fuel, odometer, engine hours)
  - Recent trips (last 5)
  - Active fault codes
- Refresh option (--watch flag for continuous updates)

**Example Output:**
```
╔══════════════════════════════════════════════════════════════╗
║               VEHICLE DETAILS: Truck 001                     ║
╚══════════════════════════════════════════════════════════════╝

Basic Information
─────────────────────────────────────────────────────────────
  Name:             Truck 001
  VIN:              1HGBH41JXMN109186
  Serial Number:    G9xxxxxxxxxx
  Device Type:      GO9

Current Status
─────────────────────────────────────────────────────────────
  🟢 Status:        Active (Moving)
  Location:         43.6532°N, 79.3832°W
  Speed:            45 mph
  Last Updated:     2 minutes ago
  📍 Map:           https://maps.google.com/?q=43.6532,-79.3832

Diagnostics
─────────────────────────────────────────────────────────────
  ⛽ Fuel Level:     78%
  📏 Odometer:       45,234 miles
  ⏱️  Engine Hours:  1,234 hrs
  🔋 Battery:        13.8V

Recent Trips (Last 5)
─────────────────────────────────────────────────────────────
  1. 42.3 mi | 1h 15m | Today 08:30 - 09:45
  2. 28.7 mi | 1h 30m | Today 06:00 - 07:30
  3. 15.2 mi | 45m    | Yesterday 16:00 - 16:45
  ...

Active Fault Codes
─────────────────────────────────────────────────────────────
  [CRITICAL] P0420 - Catalyst System Efficiency Below Threshold
             Detected: 2 hours ago

Usage: python vehicle_detail.py [vehicle_name] [--watch]
```

### File 3: `trip_reporter.py`
**Purpose:** Generate trip reports for a date range

**Requirements:**
- Command-line arguments: start date, end date, optional vehicle filter
- Generate summary report with:
  - Total trips
  - Total distance
  - Total drive time
  - Average trip length
  - Busiest day
- Show top 10 longest trips
- Option to export to CSV

**Example Output:**
```
╔══════════════════════════════════════════════════════════════╗
║          TRIP REPORT: Jan 15 - Jan 22, 2026                 ║
╚══════════════════════════════════════════════════════════════╝

Summary
─────────────────────────────────────────────────────────────
  Total Trips:          145
  Total Distance:       3,427.8 miles
  Total Drive Time:     98h 23m
  Average Trip:         23.6 miles
  Busiest Day:          Jan 18 (32 trips, 487 mi)

Top 10 Longest Trips
─────────────────────────────────────────────────────────────
  1. Truck 001  | 128.4 mi | 3h 45m | Jan 16
  2. Van 042    | 115.7 mi | 3h 20m | Jan 18
  3. Car 103    | 98.2 mi  | 2h 50m | Jan 20
  ...

Report saved to: trip_report_2026-01-22.csv
```

### File 4: `alerts.py`
**Purpose:** Monitor and display fleet alerts

**Requirements:**
- Check for various alert conditions:
  - Low fuel (<20%)
  - Active critical fault codes
  - Vehicles offline >2 hours
  - Speeding events (if available)
  - Idle time >30 minutes
- Display grouped by severity (critical, warning, info)
- Option to send email alerts (bonus)
- Can run as continuous monitor

**Example Output:**
```
╔══════════════════════════════════════════════════════════════╗
║                    FLEET ALERTS                              ║
║               Last Check: 2026-01-22 14:30:15               ║
╚══════════════════════════════════════════════════════════════╝

🔴 CRITICAL ALERTS (2)
─────────────────────────────────────────────────────────────
  Truck 001: Critical fault code P0420
  Van 305:   Vehicle offline for 2h 15m

🟡 WARNINGS (3)
─────────────────────────────────────────────────────────────
  Van 042:   Low fuel (15%)
  Car 103:   Idle for 45 minutes
  Truck 204: Idle for 32 minutes

🟢 All other vehicles operating normally (10)

Press Ctrl+C to exit | Checking every 60s...
```

## Additional Files

### `requirements.txt`
```
mygeotab>=0.8.0
python-dotenv>=1.0.0
colorama>=0.4.0
tabulate>=0.9.0
click>=8.0.0  # for CLI arguments
rich>=13.0.0  # for beautiful terminal output (optional but recommended)
```

### `README.md`
Include:
- Overview of each tool
- Installation and setup
- Usage examples with screenshots
- Command-line arguments
- Tips for customization
- How to run as background service (for alerts.py)

## Testing Checklist
- [ ] All dashboards display real-time data
- [ ] Auto-refresh works correctly
- [ ] Colors and formatting work in terminal
- [ ] Ctrl+C exits cleanly
- [ ] Command-line arguments parsed correctly
- [ ] CSV export works (trip_reporter.py)
- [ ] Handles edge cases (no vehicles, no trips, etc.)

## Success Criteria
Students should:
1. Have working, professional-looking CLI tools
2. Understand how to combine multiple API calls
3. Be able to customize the dashboard for their needs
4. Feel proud showing this to someone!

## Bonus Features (Optional)
- [ ] Save/load dashboard preferences
- [ ] Multiple dashboard layouts (compact, detailed, custom)
- [ ] Sound alerts for critical issues
- [ ] Integration with system notifications
- [ ] Historic data charts (ASCII art graphs)

## Notes
- Use `rich` library for beautiful terminal output (optional but impressive)
- Clear screen between refreshes for smooth updates
- Add keyboard shortcuts (r=refresh, q=quit, etc.)
- Make it feel like a real monitoring tool!
- This is where students see the power of combining multiple data sources
