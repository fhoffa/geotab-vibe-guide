---
name: geotab-ace
description: Query fleet data using Geotab Ace AI. Use when you need natural language queries, trend analysis, or pre-aggregated insights. Ace is slower than direct API but handles complex analytical questions automatically.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
---

# Geotab Ace API

Geotab Ace is an AI-powered query interface that lets you ask natural language questions about fleet data. It automatically generates SQL queries, aggregates data, and returns analyzed results.

> **Enable Ace First:** Ace must be enabled by an admin in **Administration → Beta Features**. It's graduating from beta soon but may still require admin activation. With a demo account, you're the admin - just enable it yourself!

> **Reference Implementation:** [github.com/fhoffa/geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo) - Full working code for Ace queries, polling, DuckDB caching, and more.

## When to Use Ace vs Direct API

| Metric | Direct API | Ace AI |
|--------|-----------|--------|
| **Speed** | 300-500ms | 30-90 seconds |
| **Data freshness** | Real-time | 2-24 hours behind |
| **Query type** | Structured (Get/Set) | Natural language |
| **Best for** | Live data, writes, simple lookups | Trends, insights, complex aggregations |

### Use Direct API When:
- You need real-time data (current location, live status)
- You're writing/updating data (Set, Add, Remove)
- You need specific records by ID
- Speed is critical

### Use Ace When:
- You want trend analysis ("Which vehicles drove most last month?")
- You need complex aggregations across multiple data types
- You're exploring data with natural language questions
- You want AI-generated insights and reasoning

## Ace Query Pattern

Ace queries are **asynchronous** and require three steps:

```
1. create-chat       → Get a chat_id
2. send-prompt       → Send question, get message_group_id
3. get-message-group → Poll until status is DONE
```

All calls use `GetAceResults` with `serviceName: 'dna-planet-orchestration'`.

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
- Download full results via `download_url`
- Store large downloads in DuckDB for local querying (see [reference implementation](https://github.com/fhoffa/geotab-ace-mcp-demo))

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

**Be explicit with dates:**
```
❌ "trips last month"
✅ "trips from 2026-01-04 to 2026-02-03"
```

**Ask for limited results:**
```
❌ "all vehicles with trips"
✅ "top 10 vehicles by distance"
```

**Note:** Ace results may differ from direct API due to:
- Different data sources (BigQuery vs live)
- Different aggregation logic
- "Active" vs "all" device filtering

## Data Freshness

- Typical lag: 2-24 hours behind real-time
- New demo accounts: wait ~1 day before Ace has data
- Don't use Ace for "what's happening right now" queries

## Common Issues

| Issue | Cause & Fix |
|-------|-------------|
| No chat_id | Ace not enabled (Admin → Beta Features), or rate limited - retry |
| Query times out | Complex queries take 60-90s - simplify or increase timeout |
| Empty data array | Question too vague, no data for period, or new account |
| Stale results | Ace lags real-time - use direct API for current data |

## Resources

- **Reference Implementation:** [geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo) - Full Python code
- **Custom MCP Guide:** [CUSTOM_MCP_GUIDE.md](../../guides/CUSTOM_MCP_GUIDE.md) - Build your own MCP server
- **Add-Ins:** [geotab-addins skill](../geotab-addins/SKILL.md) - Using Ace in Add-Ins
- **Direct API:** [geotab-api-quickstart skill](../geotab-api-quickstart/SKILL.md)
