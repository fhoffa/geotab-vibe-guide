# Build Your First Fleet Agent with n8n

**From zero to automated fleet monitoring in 30 minutes.**

This guide walks you through building an agent that monitors your Geotab fleet and sends Slack alerts when vehicles speed—using n8n's visual workflow builder.

---

## What You'll Build

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Schedule  │────▶│ Fetch Trips │────▶│   Filter    │────▶│ Send Slack  │
│ (every 15m) │     │ from Geotab │     │  Speeding   │     │   Alert     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**The workflow:**
1. Runs every 15 minutes automatically
2. Fetches recent trips from Geotab API
3. Filters for trips with speeding events
4. Sends a Slack message for each speeding event

---

## Why Not Just Use Geotab's Built-In Alerts?

**Good question!** Geotab has native Rules and Notifications that can email you when speeding occurs. Use those if email is sufficient.

**Build this n8n workflow when you need:**
- **Slack/Teams/Discord** instead of email
- **Richer context** in alerts (driver history, nearby locations)
- **Multi-step workflows** (alert → log to spreadsheet → create ticket)
- **Custom logic** ("only alert if 3rd offense this week")
- **Integration with other systems** (CRM, dispatch, maintenance)

This tutorial teaches the pattern—once you understand it, you can build any workflow.

---

## Prerequisites

1. **Geotab credentials** — [Create a free demo account](https://my.geotab.com/registration.html) if you don't have one
   > **Important:** Click **"Create a Demo Database"** (not "I'm a New Customer") to get pre-populated sample data.
2. **n8n account** — Free cloud account (we'll create this)
3. **Alert destination** (pick one):
   - Slack workspace (need permission to create webhooks)
   - Discord server (need permission to create webhooks)
   - Email address (works out of the box with n8n Cloud)
   - None (just testing? Skip this for now)

---

## Step 1: Set Up n8n Cloud

### Create Your Account

1. Go to [n8n.io](https://n8n.io/) and click **"Get Started Free"**
2. Sign up with email or Google
3. You'll land in your n8n dashboard

### Understand the Interface

- **Left sidebar**: Your workflows
- **Canvas**: Where you build (drag and drop nodes)
- **Right panel**: Node settings
- **Top bar**: Save, Execute, Activate

---

## Step 2: Create a New Workflow

1. Click **"Add Workflow"** (or the + button)
2. Name it: `Geotab Speeding Monitor`
3. You'll see a blank canvas with a trigger placeholder

---

## Step 3: Add the Schedule Trigger

Your agent needs to run automatically. We'll use a schedule trigger.

1. Click the **trigger placeholder** (or search for "Schedule")
2. Select **"Schedule Trigger"**
3. Configure it:
   - **Trigger Interval**: Minutes
   - **Minutes Between Triggers**: 15

**Why 15 minutes?** Balances responsiveness with API rate limits. Adjust based on your needs.

---

## Step 4: Add Geotab Authentication

Before fetching data, you need to authenticate with Geotab.

1. Click **+** to add a new node after the Schedule
2. Search for **"HTTP Request"**
3. Configure the authentication call:

**HTTP Request Settings:**

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://my.geotab.com/apiv1` |
| Body Content Type | JSON |

**Body (JSON):**
{% raw %}
```json
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

4. **Set up variables** (keeps credentials secure):
   - Go to **Settings** (gear icon) → **Variables**
   - Add these variables:
     - `GEOTAB_DATABASE`: your database name
     - `GEOTAB_USERNAME`: your email
     - `GEOTAB_PASSWORD`: your password

5. Name this node: `Authenticate`

---

## Step 5: Fetch Recent Trips

Now fetch trips from the last hour to check for speeding.

1. Click **+** after the Authenticate node
2. Add another **"HTTP Request"** node
3. Configure:

**HTTP Request Settings:**

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://my.geotab.com/apiv1` |
| Body Content Type | JSON |

**Body (JSON):**
{% raw %}
```json
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

4. Name this node: `Fetch Trips`

---

## Step 6: Filter Speeding Trips

Only send alerts for trips with speeding events.

1. Click **+** after Fetch Trips
2. Search for **"Filter"** node
3. Add it and configure:

**Filter Conditions:**
- **Field**: `result` → `speedingDuration`
- **Operation**: `is greater than`
- **Value**: `30` (trips with more than 30 seconds of speeding)

Alternatively, use an **IF** node for more complex conditions:
- Condition: {% raw %}`{{ $json.result.speedingDuration > 30 }}`{% endraw %}

4. Name this node: `Filter Speeding`

---

## Step 7: Choose Your Alert Destination

Pick the option that works for you:

| Option | Best For | Setup Difficulty |
|--------|----------|------------------|
| **Slack** | Teams already using Slack | Easy |
| **Discord** | Personal projects, gaming communities | Easy |
| **Email** | Universal, no new tools needed | Easiest |
| **Console/Debug** | Testing without any setup | None |

---

## Option A: Slack Alerts

### Set Up Slack Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name it `Fleet Alerts`, select your workspace
4. Go to **"Incoming Webhooks"** → Enable it
5. Click **"Add New Webhook to Workspace"**
6. Select the channel for alerts (e.g., `#fleet-alerts`)
7. Copy the **Webhook URL** (looks like `https://hooks.slack.com/services/...`)

### Add Slack Node

1. Click **+** after the Filter node
2. Search for **"Slack"**
3. Configure:
   - **Authentication**: Webhook
   - **Webhook URL**: (paste your URL)

**Message:**
{% raw %}
```
🚨 *Speeding Alert*

*Vehicle:* {{ $json.result.device.name }}
*Duration:* {{ $json.result.speedingDuration }} seconds
*Trip Distance:* {{ ($json.result.distance / 1000).toFixed(1) }} km
*Time:* {{ $json.result.start }}

<https://my.geotab.com|View in MyGeotab>
```
{% endraw %}

---

## Option B: Discord Alerts

### Set Up Discord Webhook

1. Open Discord and go to your server
2. Click the **gear icon** next to your channel name → **Integrations**
3. Click **"Webhooks"** → **"New Webhook"**
4. Name it `Fleet Alerts` and copy the **Webhook URL**

### Add Discord Node

1. Click **+** after the Filter node
2. Search for **"Discord"**
3. Configure:
   - **Webhook URL**: (paste your URL)

**Message:**
{% raw %}
```
🚨 **Speeding Alert**

**Vehicle:** {{ $json.result.device.name }}
**Duration:** {{ $json.result.speedingDuration }} seconds
**Trip Distance:** {{ ($json.result.distance / 1000).toFixed(1) }} km
**Time:** {{ $json.result.start }}
```
{% endraw %}

---

## Option C: Email Alerts

### Add Email Node

1. Click **+** after the Filter node
2. Search for **"Send Email"**
3. Configure:
   - **To**: your-email@example.com
   - **Subject**: {% raw %}`Speeding Alert: {{ $json.result.device.name }}`{% endraw %}

**Body:**
{% raw %}
```
Speeding Alert

Vehicle: {{ $json.result.device.name }}
Duration: {{ $json.result.speedingDuration }} seconds
Trip Distance: {{ ($json.result.distance / 1000).toFixed(1) }} km
Time: {{ $json.result.start }}

View in MyGeotab: https://my.geotab.com
```
{% endraw %}

**Note:** n8n Cloud includes email sending. Self-hosted requires SMTP configuration.

---

## Option D: Just Testing? Use Debug Output

If you just want to see if the workflow works without setting up notifications:

1. Click **+** after the Filter node
2. Search for **"No Operation, do nothing"** (or skip adding a node)
3. Run the workflow in test mode—you'll see the data in the n8n interface

This lets you verify everything works before connecting to Slack/Discord/Email.

---

## Step 8: Name Your Alert Node

Whatever option you chose, name the node: `Send Alert`

---

## Step 9: Test Your Workflow

1. Click **"Test Workflow"** (or Cmd/Ctrl + Enter)
2. Watch data flow through each node
3. Check for errors (red nodes indicate issues)

### Common Issues:

| Problem | Solution |
|---------|----------|
| Authentication fails | Check credentials in Variables |
| No trips returned | Expand time range or check database has data |
| Slack/Discord not sending | Verify webhook URL, check app permissions |
| Email not sending | n8n Cloud includes email; self-hosted needs SMTP setup |

---

## Step 10: Activate for Production

Once testing works:

1. Click **"Save"** (top right)
2. Toggle **"Active"** switch to ON
3. Your workflow now runs every 15 minutes automatically

---

## Complete Workflow Overview

Your finished workflow should look like:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Schedule   │────▶│ Authenticate │────▶│ Fetch Trips  │
│  (15 min)    │     │   (HTTP)     │     │    (HTTP)    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                     ┌──────────────┐     ┌──────────────┐
                     │ Send Slack   │◀────│   Filter     │
                     │   Alert      │     │  Speeding    │
                     └──────────────┘     └──────────────┘
```

---

## Extend Your Agent

Now that you have the basics, try these enhancements:

### Add More Alert Channels

**Prompt for AI assistance:**
```
Add an email notification in addition to Slack. Send to fleet-manager@company.com
with the same speeding information formatted nicely in HTML.
```

### Monitor Multiple Conditions

**Prompt:**
```
Extend the workflow to also detect:
- Harsh braking events (ExceptionEvent with type harsh braking)
- Vehicles entering a specific geofence (Zone entry)
Send different colored alerts for each type.
```

### Add AI Analysis

**Prompt:**
```
Before sending the alert, use an AI node to analyze the driver's
speeding history from the past week and add a recommendation
to the Slack message (like "This is the 3rd speeding event this week -
consider scheduling a coaching session").
```

### Log to Google Sheets

**Prompt:**
```
Add a Google Sheets node that logs every speeding event with:
- Timestamp
- Vehicle name
- Driver (if available)
- Speeding duration
- Location
This creates an audit trail for compliance.
```

### Geofence Entry Alerts

**Prompt:**
```
Create a new workflow that:
1. Polls for vehicles currently inside a specific Zone
2. Compares to the previous poll
3. Sends an alert when a vehicle ENTERS the zone
4. Includes estimated arrival time
```

---

## Alternative: Webhook-Triggered Workflow

Instead of polling, you can trigger workflows instantly via webhook:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Webhook    │────▶│ Process Data │────▶│ Send Alert   │
│  (instant)   │     │   & Filter   │     │   (Slack)    │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. Add a **Webhook** node as trigger (instead of Schedule)
2. Copy the webhook URL n8n provides
3. Configure an external system to POST to that URL when events occur

This is more complex but provides real-time alerting.

---

## Troubleshooting

### "Authentication failed"
- Double-check your Geotab credentials in n8n Variables
- Ensure your demo database is active
- Try logging into my.geotab.com manually to verify credentials work

### "No data returned"
- Check that your Geotab database has trip data in the time range
- Expand the time range (try last 24 hours instead of 1 hour)
- Verify you're using the correct Geotab server URL

### "Slack message not sending"
- Test the webhook URL directly with curl:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test message"}' \
    YOUR_WEBHOOK_URL
  ```
- Check the channel permissions for your Slack app

### "Workflow stops after authentication"
- The credentials object must be passed correctly to the next node
- Check that `$json.result.credentials` is populated after authentication
- Add a **Debug** node to inspect the data at each step

---

## Next Steps

| Goal | Resource |
|------|----------|
| Understand agentic systems | [Agentic Overview](./AGENTIC_OVERVIEW.md) |
| Learn more n8n features | [n8n Documentation](https://docs.n8n.io/) |
| Build AI-powered workflows | [n8n AI Agents](https://n8n.io/ai-agents/) |
| Explore more Geotab data | [API Reference](./GEOTAB_API_REFERENCE.md) |
| Hackathon project ideas | [Hackathon Ideas](./HACKATHON_IDEAS.md) |

---

## Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [n8n Webhook Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n AI Agents Guide](https://n8n.io/ai-agents/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Geotab API Reference](https://geotab.github.io/sdk/software/api/reference/)

---

**Congratulations! You've built your first autonomous fleet monitoring agent.**

Your workflow is now watching your fleet 24/7 and will alert you the moment a vehicle speeds. This is the foundation—extend it to monitor any condition, integrate any system, and add AI reasoning as needed.

**[← Back to Agentic Overview](./AGENTIC_OVERVIEW.md)**
