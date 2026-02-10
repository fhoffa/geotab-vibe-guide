# Fault Monitoring: Understanding Vehicle Diagnostic Trouble Codes

> **What is it?** Fault monitoring tracks the lifecycle of vehicle fault codes — from when a problem first appears, through its active state, to when it clears (or doesn't). Instead of seeing a raw list of fault events, you get organized **fault cycles** that tell you whether a problem is ongoing, how long the vehicle has been driving with it, and how many miles have accumulated since it started.

> **Who is this for?** Anyone working with vehicle fault data — whether through the Data Connector, the MyGeotab API, or Ace. The concepts here apply regardless of how you access the data. If you're building maintenance dashboards, predictive maintenance tools, or fleet health reports, start here.

> **Access methods:**
> - **Data Connector:** `FaultMonitoring` and `FaultMonitoring_Daily` tables (requires Pro plan or higher)
> - **MyGeotab API:** `FaultData` entity for raw fault events
> - **Ace:** Natural language queries about vehicle faults

> **TODO — Demo account data varies.** Fault data availability depends on which demo database you get. We tested two 50-vehicle demo databases (Feb 2026) and found very different results:
>
> | Data Source | Database 1 (no faults) | Database 2 (has faults) |
> |---|---|---|
> | `FaultMonitoring` (OData) | 0 records | 10 fault cycles |
> | `FaultMonitoring_Daily` (OData) | 0 records | 281 daily records |
> | `FaultData` (API) | 0 records | 6,962 fault events |
> | `ExceptionEvent` (API) | 50,000 records | 28,566 records |
>
> Database 2's faults were all **GoDevice faults** (GPS antenna unplugged, engine hours stale) — not engine DTCs (OBD-II/J1939). These still demonstrate the full fault cycle lifecycle (persistent cycles, durations, counts), but won't have breakdown risk scores (those apply to engine DTCs only). Real production fleets will have both GoDevice and engine faults.
>
> **If your demo database has no fault data:** Try creating another demo database — fault data availability varies. Exception events (speeding, harsh cornering, etc.) are always available and are a different data category from diagnostic fault codes.

## Where Do Fault Codes Come From?

Geotab gathers fault codes from two primary sources:

**Diagnostic Trouble Codes (DTCs):** These codes signal potential vehicle problems. Some are legally mandated, others are manufacturer-specific. The two common standards are:
- **OBDII** — Light and medium-duty vehicles. The codes you see when a "check engine" light comes on.
- **J1939** — Heavy-duty vehicles (trucks, buses, construction equipment). Uses SPN/FMI codes instead of OBDII PIDs.

**GoDevice-Specific Faults:** These codes flag issues with the Geotab telematics device itself, or combine vehicle data to generate a fault code based on device logic. These are separate from engine DTCs.

The `DiagnosticType` column tells you which type you're looking at (OBDII, SPN, PID/SID, etc.).

## Fault Cycles Explained

Raw fault data is a stream of individual events — "fault X detected at time Y." That's hard to work with. Fault monitoring organizes these events into **cycles** that answer practical questions:

### What is a Fault Cycle?

A fault cycle groups consecutive fault detections of the same type on the same vehicle. The cycle starts when the fault first appears and ends when enough ignition cycles pass without the fault being detected.

Here's how it works:

1. **Fault detected** → A new cycle opens with a unique ID
2. **Fault persists across ignition cycles** → The cycle stays open, timestamps and odometer values update
3. **Fault stops appearing** → After enough "clean" ignition cycles (no fault detected), the cycle closes
4. **Same fault reappears later** → A new cycle opens with a new ID — it's treated as a separate occurrence

### Fault States Within a Cycle

Each fault in a cycle goes through states that reflect the DTC lifecycle:

| State | What It Means |
|---|---|
| **Pending** | Fault condition detected but not yet confirmed. The vehicle's computer has seen the issue but is waiting to see if it recurs. |
| **Active** | Fault condition is actively present. The vehicle is currently experiencing the problem. |
| **Confirmed** | Fault has been confirmed through multiple detection cycles. The problem is verified and persistent. |

Not every fault goes through all three states — it depends on the DTC standard and the vehicle's diagnostic system.

### Persistent vs. Closed Cycles

The `IsPersistentCycle` field is the most important flag:

- **`True` (Persistent):** The fault cycle is ongoing. The vehicle currently has this fault. The `AnyStatesDateTimeLastSeen` timestamp can still update as new detections occur.
- **`False` (Closed):** Enough clean ignition cycles passed — the fault is no longer active. The cycle has a defined start and end.

### Reading the Timeline

Use these column pairs to understand the full picture:

| Question | Columns to Use |
|---|---|
| When did this fault cycle start and end? | `AnyStatesDateTimeFirstSeen`, `AnyStatesDateTimeLastSeen` |
| Is it still happening? | `IsPersistentCycle` |
| How long was it in each state? | `PendingDuration`, `ActiveDuration`, `ConfirmedDuration` |
| How far did the vehicle drive with this fault? | `PendingDistance`, `ActiveDistance`, `ConfirmedDistance` |
| How many times was the fault detected in each state? | `PendingCount`, `ActiveCount`, `ConfirmedCount` |
| What was the odometer at key moments? | `*OdometerFirstSeen`, `*OdometerLastSeen` for each state |

## Risk of Breakdown — Fault Severity (Beta)

> **Note:** This feature is currently in development and is considered Beta. It may change at any time.

The risk of breakdown model correlates fault lifecycles with towing events across the Geotab fleet. It answers: "Given this fault code, what's the chance the vehicle ends up getting towed?"

### Severity Tiers

| Severity | Chance of Tow | What It Means |
|---|---|---|
| Low | 0–4% | Fault rarely leads to a towing event. Monitor but not urgent. |
| Medium | 4–8.5% | Moderate risk. Schedule maintenance soon. |
| High | 8.5–15% | Significant risk. Prioritize repair. |
| Critical | >15% | High likelihood of breakdown. Immediate attention needed. |

This data is derived from fleet-wide patterns — it's statistical, not diagnostic. A "Critical" fault code doesn't guarantee a breakdown, but it means vehicles with this code historically have a high rate of towing events.

## Prompts to Try

These prompts work with any AI tool. Adjust the data access method to your setup.

### Prompt 1: "What's Broken Right Now?" (Data Connector)

```text
Using the Data Connector, query the FaultMonitoring table and show me:

1. All persistent fault cycles (IsPersistentCycle = true)
2. Group by fault code — which fault codes affect the most vehicles?
3. For each persistent fault, show how long the vehicle has been driving with it
   (use AnyStatesDateTimeFirstSeen to calculate duration)
4. Flag any faults where ActiveDistance or ConfirmedDistance exceeds 1000 km

Give me a priority list: which vehicles need attention first?
```

### Prompt 2: "Fault History Timeline" (Data Connector)

```text
Using FaultMonitoring_Daily from the Data Connector, pull the last 30 days of fault activity.

Show me:
1. How many unique fault codes were active per day across the fleet
2. Which vehicles had the most fault-days (a vehicle with 3 faults on one day = 3 fault-days)
3. Are there any fault codes that appear across multiple vehicles? (fleet-wide issues)
4. Create a timeline showing fault activity trending up or down

Use ?$search=last_30_day for the date filter.
```

### Prompt 3: "Maintenance Priority Report" (Data Connector)

```text
Combine FaultMonitoring with LatestVehicleMetadata from the Data Connector.

For each vehicle with persistent faults:
1. Show vehicle name, VIN, manufacturer, model
2. List all active fault codes with descriptions
3. Show how long each fault has been present (duration) and distance driven
4. Include the vehicle's last known location (GPS) and odometer

Sort by: vehicles with the most persistent faults first, then by longest fault duration.
Format this as a maintenance work order that a fleet manager could hand to a mechanic.
```

### Prompt 4: "Fleet-Wide Fault Trends" (Data Connector)

```text
Using FaultMonitoring from the Data Connector, analyze fleet-wide fault patterns:

1. What are the top 10 most common fault codes across all vehicles (persistent and closed)?
2. For each, show: fault code, description, DiagnosticType (OBDII vs J1939 vs other),
   total number of cycles, how many are currently persistent
3. What percentage of the fleet has at least one persistent fault?
4. Are there any fault codes that tend to recur? (same fault code, multiple closed cycles
   on the same vehicle)

This helps identify systemic issues vs. one-off problems.
```

### Prompt 5: "Fault Codes via the API" (MyGeotab API)

```text
Using the Geotab MyGeotab API, query FaultData to get recent fault codes.

My credentials are in a .env file (GEOTAB_DATABASE, GEOTAB_USERNAME, GEOTAB_PASSWORD, GEOTAB_SERVER).

1. Authenticate and get credentials
2. Query FaultData for the last 7 days using a search with fromDate
3. Show me the most common diagnostic codes
4. Group faults by device to show which vehicles have the most issues
5. For each fault, show the diagnostic name, fault state, and datetime

Use the standard API at https://{server}/apiv1 with JSON-RPC calls.
```

---

## Available Data

### FaultMonitoring Table (Snapshot — No Date Filter)

The main table for fault cycle analysis. Each row is one fault cycle on one vehicle.

**Key columns for getting started:**

| Column | What It Tells You |
|---|---|
| `DeviceId` | Which vehicle |
| `FaultCode` + `FaultCodeDescription` | What the problem is |
| `DiagnosticType` | What standard (OBDII, SPN/J1939, etc.) |
| `AnyStatesDateTimeFirstSeen` | When the cycle started |
| `AnyStatesDateTimeLastSeen` | When last detected (or cycle ended) |
| `IsPersistentCycle` | Is it still happening? |

**Detailed state columns** (Pending, Active, Confirmed — each has DateTime, Odometer, Duration, Distance, Count variants). See the [Data Connector skill reference](../skills/geotab/references/DATA_CONNECTOR.md) for the full schema.

### FaultMonitoring_Daily Table (Time-Series — Use `$search`)

Daily log of every fault cycle. One row per fault-cycle per day, between the cycle's first-seen and last-seen dates. Useful for trending and day-by-day analysis. Same fault identification columns as FaultMonitoring but without the lifecycle/duration columns.

---

## Going Deeper

- **Data Connector setup and all table schemas:** See [DATA_CONNECTOR.md](./DATA_CONNECTOR.md) for connection instructions and prompts
- **Full column reference:** See the [Data Connector skill reference](../skills/geotab/references/DATA_CONNECTOR.md) for complete schemas with types
- **Official documentation:** [Data Connector Schema and Dictionary](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-conn-schema)
- **Fault Monitoring User Guide:** [Maintenance Fault Monitoring](https://docs.google.com/document/d/1uZjSAqGvok5yBa2M_k7p4dRSp0RBvThOYzvyKhLuy6Q/)
- **Compare data access methods:** [DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md) for Data Connector vs API vs Ace
