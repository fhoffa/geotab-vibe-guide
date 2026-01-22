# Task 02: Fetch Data Examples

## Goal
Create examples showing how to fetch different types of Geotab data. Students use these in minutes 15-25 of tutorial.

## What to Build

### File 1: `get_vehicles.py`
**Purpose:** Fetch and display all vehicles

**Requirements:**
- Authenticate using the class from `01_authentication`
- Fetch all devices using `api.get('Device')`
- Display in a formatted table: Name, Serial Number, VIN, Device Type
- Count total vehicles
- Handle empty results gracefully

**Example Output:**
```
Fetching vehicles from Geotab...

Total Vehicles: 15

Name                Serial Number    VIN                Device Type
--------------------------------------------------------------------------------
Truck 001          G9xxxxxxxxxx     1HGBH41JXMN109186  GO9
Van 042            G9xxxxxxxxxx     2FMDK3GC4BBA12345  GO9
Car 103            G7xxxxxxxxxx     3VWDP7AJ5CM123456  GO7+
...
```

**Vibe Prompt:**
```
Create a Python script that authenticates with Geotab API and fetches all devices.
Display results in a formatted table showing: name, serial number, VIN, and device type.
Include a count of total vehicles. Handle cases where there are no devices.
```

### File 2: `get_trips.py`
**Purpose:** Fetch recent trips

**Requirements:**
- Fetch trips from the last 24 hours
- For each trip show: Vehicle name, Start time, End time, Distance, Duration
- Calculate total distance across all trips
- Format times in readable format (not just timestamps)
- Add command-line argument for date range (default: 24 hours)

**Example Output:**
```
Fetching trips from last 24 hours...

Recent Trips: 23

Vehicle      Start Time           End Time             Distance    Duration
--------------------------------------------------------------------------------
Truck 001    2026-01-22 08:30     2026-01-22 09:45     42.3 mi     1h 15m
Van 042      2026-01-22 09:00     2026-01-22 10:30     28.7 mi     1h 30m
...

Total Distance: 487.2 miles
```

### File 3: `get_locations.py`
**Purpose:** Get current GPS locations for all vehicles

**Requirements:**
- Fetch latest LogRecord for each device
- Display: Vehicle name, Latitude, Longitude, Speed, Timestamp
- Calculate how old the position is (e.g., "5 minutes ago")
- Add Google Maps link for each location
- Sort by most recently updated

**Example Output:**
```
Current Vehicle Locations:

Vehicle      Latitude    Longitude    Speed    Last Updated    Map Link
--------------------------------------------------------------------------------
Truck 001    43.6532     -79.3832     45 mph   2 min ago       [View Map]
Van 042      43.7184     -79.5181     0 mph    5 min ago       [View Map]
...
```

### File 4: `get_diagnostics.py`
**Purpose:** Fetch diagnostic data (fuel, odometer, etc.)

**Requirements:**
- Fetch latest StatusData for key diagnostics:
  - Fuel level (%)
  - Odometer (miles/km)
  - Engine hours
  - Speed
- Display for each vehicle in a table
- Highlight vehicles with low fuel (<20%) in red text
- Add timestamp for each reading

**Example Output:**
```
Vehicle Diagnostics:

Vehicle      Fuel Level    Odometer    Engine Hours    Speed    Updated
--------------------------------------------------------------------------------
Truck 001    78%          45,234 mi   1,234 hrs       45 mph   Just now
Van 042      15% ⚠️       82,901 mi   2,891 hrs       0 mph    3 min ago
...

⚠️  2 vehicles have low fuel (<20%)
```

### File 5: `get_fault_codes.py`
**Purpose:** Fetch active fault codes

**Requirements:**
- Fetch all FaultData with active faults
- Group by vehicle
- Show: Vehicle, Fault code, Description, Severity, Timestamp
- Count critical vs warning faults
- Handle case where there are no faults (good news!)

**Example Output:**
```
Active Fault Codes:

Vehicle: Truck 001
  [CRITICAL] P0420 - Catalyst System Efficiency Below Threshold (2 hours ago)
  [WARNING]  P0171 - System Too Lean (Bank 1) (5 hours ago)

Vehicle: Van 042
  [WARNING]  U0100 - Lost Communication with ECM/PCM (1 day ago)

Summary: 1 critical, 2 warnings across 2 vehicles
```

## Additional Files

### `requirements.txt`
```
mygeotab>=0.8.0
python-dotenv>=1.0.0
colorama>=0.4.0  # for colored terminal output
tabulate>=0.9.0  # for nice tables (optional)
```

### `README.md`
Include:
- Overview of what data you can fetch
- How to run each script
- Command-line arguments (for get_trips.py)
- What each Geotab entity means (Device, Trip, LogRecord, StatusData, FaultData)
- Links to API reference docs

## Testing Checklist
- [ ] All scripts work with real Geotab data
- [ ] Formatted output is readable and aligned
- [ ] Empty results are handled gracefully
- [ ] Times/dates are in readable format (not epoch timestamps)
- [ ] Scripts complete in reasonable time (<10 seconds)

## Success Criteria
Students should:
1. See real data from their Geotab account
2. Understand the different data types available
3. Be able to modify date ranges or filters easily
4. Have working code they can build upon

## Notes
- Use the authentication class from folder 01
- These scripts are building blocks for the dashboard (folder 03)
- Keep output clean and professional
- Add comments explaining the Geotab API structure
