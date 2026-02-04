---
name: agentic-n8n
description: Build automated fleet monitoring workflows using n8n. Use this skill when asked to create agents, automations, or monitoring systems that connect Geotab to external services like Slack, Discord, email, or other APIs.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
---

# Agentic Fleet Monitoring with n8n

## When to Use This Skill

- Building automated monitoring that runs on a schedule
- Sending Geotab alerts to Slack, Discord, Teams, or email
- Creating multi-step workflows (detect → decide → act)
- Integrating Geotab with external systems without writing code
- Any "if this happens in Geotab, do that" automation

## n8n Basics

n8n is a visual workflow builder. Workflows consist of **nodes** connected together:

```
[Trigger] → [Action] → [Action] → [Action]
```

### Common Nodes

| Node | Purpose |
|------|---------|
| **Schedule Trigger** | Run workflow on interval (every 5 min, hourly, etc.) |
| **HTTP Request** | Call any API (including Geotab) |
| **IF** | Branch based on condition |
| **Filter** | Only pass items matching criteria |
| **Slack** | Send Slack messages |
| **Discord** | Send Discord messages |
| **Send Email** | Send email alerts |
| **Code** | Custom JavaScript logic |

## Geotab API Pattern in n8n

### Step 1: Authenticate

**HTTP Request node:**
{% raw %}
```
Method: POST
URL: https://my.geotab.com/apiv1
Body (JSON):
{
  "method": "Authenticate",
  "params": {
    "database": "{{ $vars.GEOTAB_DATABASE }}",
    "userName": "{{ $vars.GEOTAB_USERNAME }}",
    "password": "{{ $vars.GEOTAB_PASSWORD }}"
  }
}
```
{% endraw %}

### Step 2: Fetch Data

**HTTP Request node (after Authenticate):**
{% raw %}
```
Method: POST
URL: https://my.geotab.com/apiv1
Body (JSON):
{
  "method": "Get",
  "params": {
    "typeName": "Trip",
    "credentials": {{ JSON.stringify($json.result.credentials) }},
    "search": {
      "fromDate": "{{ $now.minus({hours: 1}).toISO() }}",
      "toDate": "{{ $now.toISO() }}"
    }
  }
}
```
{% endraw %}

### Common TypeNames

| TypeName | Data |
|----------|------|
| `Device` | Vehicles |
| `Trip` | Completed trips |
| `User` | Users and drivers |
| `DeviceStatusInfo` | Current location/status |
| `ExceptionEvent` | Rule violations (speeding, etc.) |
| `FaultData` | Engine fault codes |
| `Zone` | Geofences |
| `LogRecord` | GPS breadcrumbs |

## Workflow Patterns

### Pattern: Speeding Alerts to Slack

```
Schedule (15 min)
  → HTTP Request (Authenticate)
  → HTTP Request (Get Trips)
  → Filter (speedingDuration > 30)
  → Slack (Send message)
```

**Filter node condition:**
{% raw %}
```
{{ $json.result.speedingDuration > 30 }}
```
{% endraw %}

**Slack message:**
{% raw %}
```
🚨 *Speeding Alert*
*Vehicle:* {{ $json.result.device.name }}
*Duration:* {{ $json.result.speedingDuration }} seconds
```
{% endraw %}

### Pattern: Fault Code Alert

```
Schedule (5 min)
  → HTTP Request (Authenticate)
  → HTTP Request (Get FaultData, last hour)
  → Filter (severity == "Critical")
  → Slack + Email (parallel)
```

### Pattern: Geofence Entry Notification

```
Schedule (5 min)
  → HTTP Request (Authenticate)
  → HTTP Request (Get ExceptionEvent for zone rules)
  → Filter (new events only)
  → Discord (Send notification)
```

### Pattern: Daily Fleet Summary

```
Schedule (daily at 8am)
  → HTTP Request (Authenticate)
  → HTTP Request (Get Trips, last 24h)
  → Code (calculate totals)
  → Email (send summary)
```

**Code node for summary:**
```javascript
const trips = $input.all();
const totalDistance = trips.reduce((sum, t) => sum + (t.json.result?.distance || 0), 0);
const totalTrips = trips.length;

return [{
  json: {
    totalTrips,
    totalDistanceKm: (totalDistance / 1000).toFixed(1),
    date: new Date().toISOString().split('T')[0]
  }
}];
```

## Credential Security

**Never hardcode credentials.** Use n8n Variables:

1. Go to **Settings** → **Variables**
2. Add:
   - `GEOTAB_DATABASE`
   - `GEOTAB_USERNAME`
   - `GEOTAB_PASSWORD`

Reference in nodes: {% raw %}`{{ $vars.GEOTAB_DATABASE }}`{% endraw %}

## Alert Destinations

### Slack Webhook

1. Create app at api.slack.com/apps
2. Enable Incoming Webhooks
3. Copy webhook URL
4. Use in Slack node with "Webhook" authentication

### Discord Webhook

1. Server Settings → Integrations → Webhooks
2. Create webhook, copy URL
3. Use in Discord node

### Email

n8n Cloud includes email sending. Self-hosted needs SMTP config.

## Avoiding Common Mistakes

### Rate Limiting
Don't poll every second. Use 5-15 minute intervals for most cases.

### Duplicate Alerts
Track what you've already alerted on. Use a **Code** node to filter:
```javascript
// Store last run timestamp in static data
const lastRun = $getWorkflowStaticData('global').lastRun || 0;
$getWorkflowStaticData('global').lastRun = Date.now();

// Filter to only new items
return $input.all().filter(item => {
  const itemTime = new Date(item.json.result?.start).getTime();
  return itemTime > lastRun;
});
```

### Credential Expiry
Geotab sessions expire. Always authenticate at the start of each workflow run.

## Testing

1. Build workflow
2. Click "Test Workflow" (or Cmd/Ctrl + Enter)
3. Check each node for errors (red = error)
4. Fix issues, re-test
5. When working, click "Active" to enable

## n8n Resources

- [n8n Documentation](https://docs.n8n.io/)
- [HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Expressions](https://docs.n8n.io/code/expressions/)
- [Built-in Variables](https://docs.n8n.io/code/builtin/current-node/)

## Related Skills

- `geotab-api-quickstart` - Geotab API basics for Python
- `geotab-addins` - Building MyGeotab Add-Ins
