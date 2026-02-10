# Geotab Data Access: Data Connector vs API vs Ace

> **Three ways to get fleet data, three different tradeoffs.** This guide compares the OData Data Connector, the MyGeotab API, and Geotab Ace using identical questions against the same fleet. Use it to pick the right channel for your project.

## The Short Version

| | OData Data Connector | MyGeotab API | Geotab Ace |
|---|---|---|---|
| **Speed** | ~5–11s | ~0.5–2s | ~30–45s |
| **Data** | Pre-aggregated KPIs | Raw entities | Auto-generated SQL |
| **Code needed** | Minimal (HTTP GET) | Moderate (aggregation logic) | None (natural language) |
| **Best for** | Dashboards, BI tools, reports | Custom apps, real-time, granular analysis | Ad-hoc exploration, learning the data model |
| **Permissions** | Respects user's group/vehicle permissions | Respects user's group/vehicle permissions | Respects user's group/vehicle permissions |
| **Works in Add-Ins** | No (separate auth) | Yes | Yes (via [Ace API](../skills/geotab/references/ACE_API.md)) |
| **Guide** | [DATA_CONNECTOR.md](./DATA_CONNECTOR.md) | [API_REFERENCE_FOR_AI.md](./API_REFERENCE_FOR_AI.md) | [CUSTOM_MCP_GUIDE.md](./CUSTOM_MCP_GUIDE.md) |
| **Skill** | [DATA_CONNECTOR.md](../skills/geotab/references/DATA_CONNECTOR.md) | [API_QUICKSTART.md](../skills/geotab/references/API_QUICKSTART.md) | [ACE_API.md](../skills/geotab/references/ACE_API.md) |

---

## Test Setup

We ran 4 identical fleet analytics questions against all three channels on a demo database with 50 active vehicles.

## Timing Results

| Question | Data Connector | API | Ace |
|---|---|---|---|
| Q1: Total fleet distance (14 days) | 4.87s | 1.29s | ~41s |
| Q2: Top 5 vehicles by distance | 0s* | 0.01s* | ~46s |
| Q3: Fleet idle time percentage | 0s* | 0.02s* | ~35s |
| Q4: Vehicle count & health | 10.94s | 0.58s | ~30s |

\* Q2 and Q3 reused data already fetched in Q1 (client-side aggregation), so the real cost is the initial fetch.

---

## Q1: Total Fleet Distance in Last 14 Days

**Question:** *What is the total distance driven by the entire fleet in the last 14 days?*

| Metric | Data Connector | API | Ace |
|---|---|---|---|
| Total distance | 490,906 km | 415,543 km | 304,833 km |
| Vehicles | 50 | 50 | 50 |
| Trips | 29,526 | 25,000 (capped) | 29,526 |

### Why the numbers differ

- **Data Connector** queries the pre-aggregated `VehicleKpi_Daily` table. It returned 700 records (50 vehicles x 14 days) — complete data, no caps.
- **API** returns raw `Trip` objects. The result was capped at 25,000 records (the API's default limit), so the total is an undercount.
- **Ace** generated SQL against `VehicleKPI_Daily` but applied an `IsTracked = TRUE` filter it inferred on its own, which excluded some historical device assignments and lowered the total.

**Takeaway:** The Data Connector gives the most complete pre-aggregated picture. The API is fast but can hit result caps on large fleets — you need pagination. Ace writes good SQL but may apply filters you didn't ask for.

---

## Q2: Top 5 Vehicles by Distance

All three channels agreed on the same top 5 vehicles (same DeviceIds). The absolute distances differed for the same reasons as Q1 — Data Connector highest (complete daily aggregates), API slightly lower (25K trip cap), Ace lowest (implicit `IsTracked` filter).

Ace helpfully included `DeviceName` by auto-joining the metadata table — something you'd need to do manually with the Data Connector or the API.

---

## Q3: Fleet Idle Time Percentage

| Metric | Data Connector | API | Ace |
|---|---|---|---|
| Drive hours | 8,520 hrs | 7,214 hrs | 8,486 hrs |
| Idle hours | 104 hrs | 88 hrs | 103 hrs |
| Idle % | **1.2%** | **1.2%** | **1.2%** |

All three agree on 1.2% idle. The ratio is consistent even though absolute hours differ due to result caps (API) and filtering (Ace). The Data Connector and Ace query the same underlying `VehicleKPI_Daily` data, so their absolute hours are nearly identical.

---

## Q4: Vehicle Count & Device Health

| Metric | Data Connector | API | Ace |
|---|---|---|---|
| Total vehicles | 150 | 50 | 50 |
| Communicated (24h) | 50 | 50 | 50 |

### Why vehicle counts differ

- **Data Connector** (`LatestVehicleMetadata`) returned 150 records because it includes historical device assignments — vehicles with expired date ranges that are no longer active.
- **API** (`Device` entity) returned 50 active devices. This is the most accurate count for currently active vehicles.
- **Ace** filtered on active, tracked vehicles, matching the API's count.

**Takeaway:** For active vehicle counts, use the API's `Device` entity. The Data Connector's metadata table includes historical records.

---

## Detailed Channel Comparison

### OData Data Connector

**How it works:** HTTP GET requests with Basic Auth to an OData v4 endpoint. Returns pre-aggregated daily/hourly/monthly tables.

**Strengths:**
- Clean, BI-ready tables — no aggregation code needed
- Consistent schema across all databases
- Date range filters built in (`$search=last_14_day`)
- Server-side column selection (`$select`) and filtering (`$filter`) on any column
- Ideal for Power BI, Tableau, Excel with scheduled refresh
- Complete data (no result caps on KPI tables)
- Respects user permissions — results are scoped to the user's group/vehicle access

**Weaknesses:**
- New accounts have a 2–3 hour backfill delay
- Not accessible from MyGeotab Add-Ins (requires password-based auth on a separate server)
- Medium speed (~5–11s per query)

**Best for:** Recurring dashboards, BI tool connections, fleet-wide reports

**Guide:** [DATA_CONNECTOR.md](./DATA_CONNECTOR.md) | **Skill:** [DATA_CONNECTOR.md](../skills/geotab/references/DATA_CONNECTOR.md)

---

### MyGeotab API

**How it works:** REST/JSON-RPC calls to `my.geotab.com/apiv1`. Returns raw entity objects (Trip, Device, LogRecord, etc.).

**Strengths:**
- Fastest channel (~0.5–2s per query)
- Most flexible — full access to all 34+ entity types
- Rich filtering via search objects (by device, date, group, driver)
- Real-time data (DeviceStatusInfo for live positions)
- Works inside MyGeotab Add-Ins via the `api` object
- Respects user permissions — results are scoped to the user's group/vehicle access

**Weaknesses:**
- **Fleet-wide aggregation doesn't scale.** The API itself is fast for targeted queries (trips for one vehicle, current location of a device). But the pattern of "fetch all trips across the entire fleet, then aggregate in pandas" breaks down on production fleets — you'll hit result caps, need extensive pagination, and spend significant time on client-side computation. See [Demo vs Production](#demo-vs-production) below.
- Results capped at 5,000 per call (need pagination for large datasets)
- Requires code to aggregate (sum trips, calculate idle percentages, etc.)
- Duration fields may need parsing

**Best for:** Custom applications, real-time monitoring, Add-Ins, granular per-vehicle/per-trip analysis

**Guide:** [API_REFERENCE_FOR_AI.md](./API_REFERENCE_FOR_AI.md) | **Skill:** [API_QUICKSTART.md](../skills/geotab/references/API_QUICKSTART.md)

---

### Geotab Ace

**How it works:** Natural language questions sent to the Ace API. Returns auto-generated SQL, reasoning, and results.

**Strengths:**
- No code required — ask questions in plain English
- Returns the SQL it generated (learn the data model by reading it)
- Automatically joins tables, converts units, adds device names
- Great for exploration and ad-hoc questions
- Works in Add-Ins via the [Ace API](../skills/geotab/references/ACE_API.md)
- Respects user permissions — results are scoped to the user's group/vehicle access

**Weaknesses:**
- Slowest channel (~30–45s per question)
- May apply implicit filters you didn't ask for (e.g., `IsTracked = TRUE`)
- Can auto-convert units (km to miles) without being asked
- Results can vary between runs for the same question
- Rate limited

**Best for:** Ad-hoc exploration, fleet manager self-service, learning the data model, quick answers without coding

**Guide:** [CUSTOM_MCP_GUIDE.md](./CUSTOM_MCP_GUIDE.md) | **Skill:** [ACE_API.md](../skills/geotab/references/ACE_API.md)

---

## When to Use What

| Your situation | Use this |
|---|---|
| Building a Power BI / Tableau dashboard | Data Connector |
| Building a Python reporting script | Data Connector (if KPI-level data suffices) or API (if you need trip-level detail) |
| Building a MyGeotab Add-In | API (or Ace for natural language features) |
| Need real-time vehicle positions | API (`DeviceStatusInfo`) |
| Fleet manager wants quick answers | Ace |
| Need to validate data across sources | Cross-reference API `Device` count with Data Connector KPIs |
| Analyzing specific trips or routes | API (the Data Connector doesn't have trip-level data) |
| Monthly executive reports | Data Connector (`VehicleKpi_Monthly`) |
| Learning what data Geotab has | Ace (ask it questions, read the SQL it generates) |

---

## Data Accuracy Notes

Even identical questions can return different numbers across channels:

1. **Result caps:** The API has a default result limit. Always paginate for complete data.
2. **Historical records:** Data Connector metadata tables include inactive/historical device assignments. The API's `Device` entity returns only active devices.
3. **Implicit filters:** Ace may add filters like `IsTracked = TRUE` based on its interpretation of your question.
4. **Aggregation level:** The Data Connector gives you pre-aggregated daily/monthly totals. The API gives you raw per-trip data that you sum yourself. Small rounding differences are normal.
5. **Unit conversion:** Ace may auto-convert km to miles. The Data Connector and API always return metric units.
6. **Permissions:** All three channels respect user permissions — a user who only has access to certain groups will only see those vehicles. This can cause number differences when different users query the same fleet.

When numbers don't match, it's usually one of these reasons — not a bug.

---

## Demo vs Production

> **The benchmarks above were run on a demo database with 50 vehicles.** Production fleets can have hundreds or thousands of vehicles, and the API's aggregation pattern changes dramatically at scale.

The API itself scales well for targeted queries — fetching trips for a specific vehicle, getting a device's current location, reading fault codes for one asset. What *doesn't* scale is using it as a fleet-wide aggregation engine: "fetch all trips for all vehicles, then sum/group/rank in pandas." That pattern works smoothly on a demo but becomes impractical in production:

| | Demo (50 vehicles) | Production (500–5,000+ vehicles) |
|---|---|---|
| Trips per month | ~30K | 300K–3M+ |
| API calls needed | 1–6 (with pagination) | Dozens to hundreds |
| Client-side aggregation | Instant | Minutes, memory-intensive |
| Result cap issues | Rarely hit | Constantly hit |

**The practical takeaway:** If you're building something that works on a demo database using raw API calls and client-side aggregation, think about whether it will still work at production scale. For fleet-wide KPIs (distance, fuel, idle time, safety), the **OData Data Connector** was designed exactly for this — it gives you pre-aggregated daily/monthly tables that scale to any fleet size with the same query speed.

Use the **API** when you need per-trip, per-event, or real-time data for specific vehicles. Use the **Data Connector** when you need fleet-wide aggregates. This distinction barely matters on a demo database — but it's the difference between a working app and an unusable one in production.
