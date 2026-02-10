# Geotab Data Connector: Fleet Analytics Without Code

> **What is it?** The Data Connector gives you a direct data feed from your fleet — daily KPIs, safety scores, fault codes, vehicle metadata — through a standard OData endpoint. Think of it as a pre-built analytics layer on top of your Geotab data. Instead of writing API calls to fetch trips, calculate idle time, and aggregate by vehicle, the Data Connector hands you clean, ready-to-analyze tables.

> **Who is this for?** Anyone who wants fleet analytics in Python, Excel, Power BI, Tableau, or any tool that speaks HTTP. Great for server-side scripts, standalone apps, and BI dashboards where you want pre-aggregated KPIs without fetching raw trips and computing aggregates yourself.
>
> **Note:** The Data Connector uses HTTP Basic Auth on a separate server — it's not accessible from MyGeotab Add-Ins (which only have a session token, not your password). For Add-In analytics, use the standard MyGeotab API or Ace instead.

## Before You Start

### Requirements

- A Geotab database on a **ProPlus plan** — free demo databases include this, and most customer databases already have it
- Your MyGeotab credentials (database name, email, password)

### Activating the Data Connector

The Data Connector is a MyGeotab add-in. On production databases you install it from the Geotab Marketplace. On **demo databases** (and some sales channels), the Marketplace isn't available — you need to install it manually:

1. In MyGeotab, go to **Administration > System Settings > Add-Ins**
2. Add a new add-in with this configuration:
   ```json
   {
     "url": "https://app.geotab.com/addins/geotab/dataConnector/manifest.json"
   }
   ```
3. Save and refresh the page

Without this step, queries will return **412** or **403** errors.

> **Full setup docs:** [Data Connector Partner Setup](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-conn-partner#h.wiq7fzud3vwa) and [Data Connector User Guide](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-connector)

### New Database? Wait for the Data Pipeline

If you just activated the Data Connector, your **metadata tables** (vehicle info, groups) will be available right away. But the **KPI and safety tables will be empty for 2–3 hours** while the data pipeline backfills. This is normal — just wait and try again.

---

## How It Works (The 30-Second Version)

The Data Connector exposes an OData v4 endpoint. You query it with HTTP GET requests using Basic Auth. That's it.

- **Base URL:** `https://odata-connector-{serverNumber}.geotab.com/odata/v4/svc/`
- **Auth:** HTTP Basic with `database_name/username` as the username and your MyGeotab password
- **Format:** JSON responses with fleet data in the `value` array

Your database lives on server 1 or server 2. The wrong server returns a **406 Jurisdiction Mismatch** — try both to find yours.

> **SAML/SSO users:** The Data Connector only supports basic authentication. If your organization uses SAML/SSO to log into MyGeotab, create a service account with basic auth credentials to connect.

---

## Prompts to Try

> [!CAUTION]
> **NEVER paste real production credentials into an AI chat.**
> If using a real fleet database, ask the AI to write code that loads credentials from a `.env` file instead.
> Only paste passwords if you are using a **disposable demo database**.
> See [CREDENTIALS.md](./CREDENTIALS.md) for safe `.env` setup, or [CLAUDE_PROMPTS.md](./CLAUDE_PROMPTS.md) for more prompts that follow this pattern.

### Prompt 1: "Connect and Explore" (Start Here)

Copy this into Claude, ChatGPT, or your AI assistant:

```text
I want to explore my fleet data using the Geotab Data Connector (OData API).

My credentials:
- Database: [your_database_name]
- Username: [your_email@example.com]
# SECURITY: For production databases, use a .env file instead of pasting credentials.
# Only paste your password if this is a disposable DEMO database:
- Password: [your_password]

The Data Connector uses HTTP Basic Auth with "database/username" as the username.
The base URL is: https://odata-connector-{server}.geotab.com/odata/v4/svc/
(Try server 1 and 2 — one will return 200, the other 406.)

Please:
1. Find which server my database is on (try both 1 and 2).
2. Query the LatestVehicleMetadata table to see my vehicles.
3. Show me what tables are available (query the service document at the base URL).
4. Pick a KPI table and pull the last 14 days of data using ?$search=last_14_day
5. Give me a summary of what you find.
```

---

### Prompt 2: "Fleet Utilization Report"

```text
Using the Geotab Data Connector credentials from earlier, build me a fleet utilization report.

Pull VehicleKpi_Daily for the last 14 days and show me:
1. Total distance driven per vehicle
2. Drive time vs idle time (as hours and as a percentage)
3. Number of trips per vehicle
4. Which vehicles are underutilized (lowest distance/drive time)

Use pandas for the analysis. Show me a clean summary table.

Reminder: Date filters use ?$search=last_14_day (not $filter).
If the response has @odata.nextLink, follow it to get all pages.
```

---

### Prompt 3: "Find the Gas Guzzlers"

```text
Using the Data Connector, pull VehicleKpi_Daily for the last 30 days.

Calculate fuel economy (km per litre) for each vehicle and show me:
1. The 5 worst fuel economy vehicles
2. The 5 best fuel economy vehicles
3. Fleet average
4. Any vehicles with zero fuel data (TotalFuel_Litres = 0)

Use ?$search=last_30_day for the date filter.
Only include vehicles that actually have fuel data.
```

---

### Prompt 4: "Safety Dashboard Data"

```text
Using the Data Connector, I want to build a safety overview.

1. Pull FleetSafety_Daily for the last 30 days — what's the fleet-level safety trend?
2. Pull VehicleSafety_Daily for the same period — which vehicles rank worst?
3. Pull DriverSafety_Daily — which drivers need coaching?

Summarize the rankings and show me who needs attention.
Use ?$search=last_30_day for all queries.

Note: Safety data may lag up to 2 days behind other KPIs (it benchmarks against
fleets across Geotab, not just yours).
```

---

### Prompt 5: "After-Hours Usage Detection"

```text
Using VehicleKpi_Daily from the Data Connector, check for after-hours vehicle usage in the last 14 days.

Look at the AfterHours_Count, AfterHoursDistance_Km, and AfterHoursDrivingDuration_Seconds columns.

Show me:
1. Which vehicles had after-hours activity
2. How many events per vehicle
3. Total after-hours distance and time
4. The days with the most after-hours activity

Flag any vehicles with significant after-hours usage.
```

---

### Prompt 6: "Fleet Health Check"

> **Note:** Step 5 queries FaultMonitoring, which may be empty on some demo databases — fault data availability varies. See [FAULT_MONITORING.md](./FAULT_MONITORING.md) for details on what to expect.

```text
Using the Data Connector, give me a fleet health report.

1. Query LatestVehicleMetadata — show Device_Health distribution (how many healthy vs unhealthy)
2. How many vehicles have active faults in the last 24 hours?
3. What fuel types are in my fleet?
4. How many vehicles are reporting odometer data?
5. Query FaultMonitoring for current active faults — what are the most common fault codes?

Give me an executive summary I could show a fleet manager.
```

---

### Prompt 7: "Build a Python Dashboard"

```text
Using the Data Connector data we've been exploring, build me a simple Streamlit dashboard.

The dashboard should show:
1. A fleet summary card (total vehicles, total distance this month, fleet safety score)
2. A bar chart of distance by vehicle for the last 30 days
3. An idle time leaderboard (worst idlers)
4. A table of vehicles with active faults

Use the Data Connector OData endpoint with requests + Basic Auth.
Store credentials using python-dotenv (.env file).
Handle pagination (@odata.nextLink).
```

---

### Prompt 8: "Map My Fleet"

```text
Using LatestVehicleMetadata from the Data Connector, map my fleet's last known positions.

Use the LastGps_Latitude and LastGps_Longitude fields.
Show each vehicle as a point on a map with its name, manufacturer, model, and device health.
Color-code by health status (green = healthy, red = needs attention).

Use folium (Python) or any mapping library you prefer.
```

---

## Available Tables Quick Reference

When writing prompts, reference these table names:

| Table | Needs Date Filter? | What's In It |
|---|---|---|
| **VehicleKpi_Daily** | Yes | Distance, drive/idle time, fuel, trips, stops per vehicle per day |
| **VehicleKpi_Hourly** | Yes | Same metrics at hourly granularity |
| **VehicleKpi_Monthly** | Yes | Same metrics, monthly rollup |
| **DriverKPI_Daily** | Yes | Same metrics but by driver |
| **DriverKPI_Monthly** | Yes | Monthly driver metrics |
| **FleetSafety_Daily** | Yes | Fleet-level safety rankings |
| **VehicleSafety_Daily** | Yes | Per-vehicle safety rankings |
| **DriverSafety_Daily** | Yes | Per-driver safety rankings |
| **FaultMonitoring_Daily** | Yes | Daily fault code activity |
| **FaultMonitoring** | No | Current faults with lifecycle details — see [FAULT_MONITORING.md](./FAULT_MONITORING.md) for concepts |
| **LatestVehicleMetadata** | No | VIN, make, model, last GPS, odometer, health |
| **DeviceGroups** | No | Vehicle-to-group mappings |
| **DriverGroups** | No | Driver-to-group mappings |
| **LatestDriverMetadata** | No | Driver names, timezones, account status |

## Give Your AI the Full Context

Instead of manually explaining the Data Connector's quirks to your AI, give it the skill reference file. It covers date filter syntax, auth format, pagination, error codes, and all the gotchas.

**Option A: Upload the file directly.** Download [DATA_CONNECTOR.md](../skills/geotab/references/DATA_CONNECTOR.md) and upload it to your AI chat as context.

**Option B: Upload the full skills zip.** Grab [geotab-skills.zip](https://github.com/fhoffa/geotab-vibe-guide/releases/download/latest/geotab-skills.zip) — it includes the Data Connector reference plus all other Geotab skills. Upload the whole thing so your AI has everything it needs.

**Option C: Claude Code users.** Install the skills as a plugin — see [skills/README.md](../skills/README.md) for instructions.

---

## Going Deeper

- **Fault monitoring deep dive:** See [FAULT_MONITORING.md](./FAULT_MONITORING.md) — fault cycles, persistence, DTC lifecycle, severity, and maintenance prompts
- **Data Connector vs API vs Ace:** See [DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md) — benchmarks and tradeoffs for all three data channels
- **For AI assistants implementing code:** See the [Data Connector skill reference](../skills/geotab/references/DATA_CONNECTOR.md) for complete code patterns, pagination handling, and all table schemas with column types
- **Official schema reference:** [Data Connector Schema and Dictionary](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-conn-schema) — authoritative column definitions for every table
- **Official user guide:** [Data Connector User Guide](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-connector)
- **For BI tools:** The official docs cover Power BI, Excel, and Tableau setup in detail
