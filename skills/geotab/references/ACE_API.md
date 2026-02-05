# Geotab Ace API

Geotab Ace is an AI-powered query interface that lets you ask natural language questions about fleet data. It automatically generates SQL queries, aggregates data, and returns analyzed results.

> **Enable Ace First:** Ace must be enabled by an admin in **Administration > Beta Features**. It's graduating from beta soon but may still require admin activation. With a demo account, you're the admin - just enable it yourself!

> **Reference Implementation:** [github.com/fhoffa/geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo) - Full working code for Ace queries, polling, DuckDB caching, and more.

## When to Use Ace vs Direct API

| Metric | Direct API | Ace AI |
|--------|-----------|--------|
| **Speed** | 300-500ms | 30-90 seconds |
| **Data freshness** | Real-time | ~20 min to hours behind |
| **Date handling** | UTC | Device local timezone |
| **Best for** | Live data, writes, simple lookups | Trends, insights, complex aggregations |

### Use Direct API When:
- You need real-time data (current location, live status)
- You're writing/updating data (Set, Add, Remove)
- You need specific records by ID
- Speed is critical

### API Optimization: Trips-First Pattern

For aggregations like "top vehicles by distance", don't query devices then trips per device:

```javascript
// Slow: 5000+ API calls (one per device)
api.call('Get', { typeName: 'Device' }, function(devices) {
    devices.forEach(function(d) {
        api.call('Get', { typeName: 'Trip', search: { deviceSearch: { id: d.id } } }, ...);
    });
});

// Fast: 1 API call, aggregate in memory
api.call('Get', {
    typeName: 'Trip',
    search: { fromDate: yesterday, toDate: today },
    resultsLimit: 50000
}, function(trips) {
    var byDevice = {};
    trips.forEach(function(t) {
        if (!byDevice[t.device.id]) byDevice[t.device.id] = 0;
        byDevice[t.device.id] += t.distance || 0;
    });
    // Sort and get top N
});
```

### Use Ace When:
- You want trend analysis ("Which vehicles drove most last month?")
- You need complex aggregations across multiple data types
- You're exploring data with natural language questions
- You want AI-generated insights and reasoning

## Ace Query Pattern

Ace queries are **asynchronous** and require three steps:

```
1. create-chat       -> Get a chat_id
2. send-prompt       -> Send question, get message_group_id
3. get-message-group -> Poll until status is DONE
```

All calls use `GetAceResults` with `serviceName: 'dna-planet-orchestration'`.

**CRITICAL: `customerData: true`** - Every GetAceResults call MUST include `customerData: true` or Ace will return empty data:

```javascript
api.call('GetAceResults', {
    serviceName: 'dna-planet-orchestration',
    functionName: 'create-chat',
    customerData: true,  // REQUIRED! Without this, Ace returns no data
    functionParameters: {}
}, successCallback, errorCallback);
```

### Response Structure

```javascript
// Results are nested in apiResult.results[0]
response.apiResult.results[0].chat_id
response.apiResult.results[0].message_group_id
response.apiResult.results[0].message_group.status.status  // "DONE" or "FAILED"
response.apiResult.results[0].message_group.messages[id].preview_array  // Data rows
response.apiResult.results[0].message_group.messages[id].reasoning      // AI explanation
```

### message_group_id Variants

Handle both response formats:
```javascript
var mgId = data.message_group_id || ((data.message_group || {}).id);
```

## Row Limits (Important!)

Ace returns **only 10 rows** in `preview_array`. For complete results:

| Field | Description |
|-------|-------------|
| `preview_array` | Up to 10 rows |
| `download_url` | Link to full CSV/JSON |
| `total_row_count` | Actual number of matches |

**Strategies:**
- Ask for "top N" or "worst N" to fit in preview
- Download full results via `signed_urls` (see below)
- Store large downloads in DuckDB for local querying (see [reference implementation](https://github.com/fhoffa/geotab-ace-mcp-demo))

### Fetching Full CSV Data (CORS-Approved)

The `signed_urls` in Ace responses are **CORS-approved for geotab.com origin** - embedded Add-Ins can fetch them directly:

```javascript
// In your poll handler, after status === "DONE":
var csvUrl = null;
var messages = data.message_group.messages || {};
Object.keys(messages).forEach(function(key) {
    var msg = messages[key];
    if (msg.signed_urls && msg.signed_urls.length > 0) {
        csvUrl = msg.signed_urls[0];
    }
});

if (csvUrl) {
    fetch(csvUrl)
        .then(function(res) { return res.text(); })
        .then(function(csvText) {
            // Parse CSV - first row is headers
            var rows = csvText.split('\n');
            var headers = rows[0].split(',');
            console.log('Got ' + (rows.length - 1) + ' total rows');
            // Now you have ALL data, not just 10 rows!
        })
        .catch(function(err) {
            console.error('CSV fetch error:', err);
        });
}
```

**Why this matters:** A query like "Get 100 recent GPS logs" only shows 10 in `preview_array`, but the signed URL contains all 100+ results.

**Note:** CORS allows `geotab.com` origin - embedded Add-Ins work. External/hosted Add-Ins may need to request expanded CORS policy from Geotab.

## Rate Limiting

| Timing | Value |
|--------|-------|
| Between queries | 8+ seconds minimum |
| First poll delay | 8 seconds after send-prompt |
| Poll interval | Every 5 seconds |
| Max attempts | ~30 (about 2.5 minutes) |

**Key issues:**
- `create-chat` can fail silently (no `chat_id` returned)
- Add retry logic: 3 attempts with 3s delay
- Don't run multiple Ace queries in parallel

## Timestamps

Ace returns UTC timestamps **without** the Z suffix:

```javascript
// Ace format
"2026-02-03 22:03:20.665"

// To parse correctly:
new Date(timeStr.replace(' ', 'T') + 'Z')
```

## Question Phrasing

**Specify exact column names** (best practice):
```
Bad:  "What are the top 3 vehicles by distance?"
Good: "What are the top 3 vehicles by distance? Return columns: device_name, miles"
```

Ace doesn't always honor requested names, but the `columns` array tells you what it actually used. **Use column position** instead of names:

```javascript
var cols = res.columns;  // e.g., ["DeviceName", "Trip_End_Time_UTC"]
var row = parsed[0];
var name = row[cols[0]];  // First column = device
var time = row[cols[1]];  // Second column = time
```

This works regardless of what Ace names the columns.

**Specify timezone for timestamps:**
```
Bad:  "What is the most recent trip?"
Good: "What is the most recent trip? Return columns: device_name, trip_end_time. Use UTC timezone."
```

By default, Ace may return times in device-local timezone. Specify UTC for consistent comparison.

**Be explicit with dates:**
```
Bad:  "trips last month"
Good: "trips from 2026-01-04 to 2026-02-03"
```

**Ask for limited results:**
```
Bad:  "all vehicles with trips"
Good: "top 10 vehicles by distance"
```

**Note:** Ace results may differ from direct API due to:
- **Timezone:** Ace uses `Local_Date` (device timezone), API uses UTC. A "yesterday" query can return completely different date ranges!
- Different data sources (BigQuery vs live)
- "Active" vs "all" device filtering (Ace filters `IsTracked=TRUE`)

## Why Counts Differ: API vs Ace

| Method | Count | What's Included |
|--------|-------|-----------------|
| `GetCountOf Device` | 6538 | ALL devices (active + inactive) |
| Ace "How many vehicles?" | 3161 | Only tracked, active devices |

**Ace always applies these filters:**
```sql
WHERE IsTracked = TRUE
  AND Device_ActiveTo >= CURRENT_DATETIME()
```

This is usually what you want for analysis (ignore test devices, retired vehicles).

## Ace BigQuery Tables

Ace queries these pre-built tables (from actual SQL we've observed):

| Table | Use Case |
|-------|----------|
| `LatestVehicleMetadata` | Device info with IsTracked filter |
| `Trip` | Trip data with TripStartDateTime, TripEndDateTime |
| `VehicleKPI_Daily` | Pre-aggregated daily stats (faster for distance queries) |

**Device timezone matters:** Ace uses `Local_Date` and `DeviceTimeZoneId` for daily aggregations. A "yesterday" query respects each device's timezone, not UTC.

## Data Freshness

- Typical lag: **~20 minutes to a few hours** behind real-time (can be fresher than expected!)
- New demo accounts: wait ~1 day before Ace has data
- For "right now" queries, use direct API instead

## Common Issues

| Issue | Cause & Fix |
|-------|-------------|
| Empty data / preview_array | Missing `customerData: true` in GetAceResults call - add it! |
| No chat_id | Ace not enabled (Admin > Beta Features), or rate limited - retry |
| Query times out | Complex queries take 60-90s - simplify or increase timeout |
| Empty data array | Question too vague, no data for period, or new account |
| Stale results | Ace lags real-time - use direct API for current data |

## Resources

- **Reference Implementation:** [geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo) - Full Python code
- **Custom MCP Guide:** [CUSTOM_MCP_GUIDE.md](../../../guides/CUSTOM_MCP_GUIDE.md) - Build your own MCP server
- **Add-Ins:** [ADDINS.md](ADDINS.md) - Using Ace in Add-Ins
- **Direct API:** [API_QUICKSTART.md](API_QUICKSTART.md)
