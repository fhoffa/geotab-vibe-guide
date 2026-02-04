# Using the Geotab Add-In Architect Gem

**Build custom MyGeotab pages in minutes using Google Gemini.**

This guide shows you how to use the **Geotab Add-In Architect** Gem to generate MyGeotab Add-Ins without writing code.

---

## What This Gem Does

The Geotab Add-In Architect generates **ready-to-paste JSON configurations** that add custom pages to your MyGeotab interface. No coding, no hosting, no technical setup required.

**You describe what you want → The Gem creates the configuration → You paste it into MyGeotab → Done.**

---

## Getting Started

### Step 1: Open the Gem

Go to [Geotab Add-In Architect Gem](https://gemini.google.com/gem/1Y6IvbBj4ALgS9G3SgGodepM2dfArInrO)

Or search for "Geotab Add-In Architect" in Google Gemini's Gem store.

### Step 2: Describe What You Want

Tell the Gem what your Add-In should do. Be specific:

**Good prompt:**
```
Create an Add-In that shows:
- Total number of vehicles in my fleet
- Total number of drivers
- My username and database name
Use a clean card-based layout with blue accents.
```

**Bad prompt:**
```
Make me an add-in
```

### Step 3: Copy the JSON

The Gem will output a JSON configuration block. Select and copy the entire JSON (from the opening `{` to the closing `}`).

### Step 4: Install in MyGeotab

1. Log into **MyGeotab**
2. Go to: **Administration → System → System Settings → Add-Ins**
3. Enable **"Allow unverified Add-Ins"** → Yes (required for custom Add-Ins)
4. Click **"New Add-In"**
5. Click the **"Configuration"** tab
6. **Paste** the JSON you copied
7. Click **"Save"**
8. **Hard refresh** the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
9. Look for your new menu item in the **left sidebar**

---

## Example Prompts

### Fleet Overview Dashboard

```
Build an Add-In dashboard that shows:
- Total vehicles
- Total drivers
- Current user and database
- A refresh button to reload the data

Use a modern card layout with shadows and a gradient header.
```

### Vehicle List

```
Create an Add-In that displays a table of all my vehicles showing:
- Vehicle name
- Serial number
- Vehicle type

Make it sortable by clicking column headers.
```

### Trip Summary

```
Build an Add-In showing trips from the last 24 hours:
- Vehicle name
- Trip start time
- Trip distance
- Trip duration

Include a total count at the top.
```

### Driver Scorecard

```
Create an Add-In that shows my drivers with their:
- Name
- Email
- Group membership

Display it as a clean list (never use alternating row colors).
```

Ps: Why [not to use alternating row colors](https://ux.stackexchange.com/questions/3562/to-use-or-not-to-use-zebra-stripes-or-alternating-row-colors-for-tables/121430#121430).

### Quick Stats Widget

```
Make a simple Add-In that displays three big numbers:
- Active vehicles today
- Total trips today
- Total distance driven today

Use large fonts and colorful cards.
```

---

## Tips for Better Results

### Be Specific About Data

Tell the Gem exactly what data you want to see:

| Instead of... | Say... |
|--------------|--------|
| "Show vehicles" | "Show vehicle name, serial number, and group" |
| "Display trips" | "Show trips from the last 7 days with distance and duration" |
| "Driver info" | "Show driver name, email, and license number" |

### Describe the Layout

The Gem can create various layouts:

- **"Use cards with shadows"** - Modern card-based design
- **"Display as a table"** - Traditional data table
- **"Use a gradient header"** - Colorful header section
- **"Make it minimalist"** - Simple, clean design
- **"Add a refresh button"** - Interactive elements

### Request Specific Colors

```
Use these colors:
- Header: dark blue (#1a365d)
- Cards: white with light gray border
- Accent color: green (#38a169)
```

### Ask for Loading States

```
Show "Loading..." while fetching data, then display the results.
```

### Request Charts and Visualizations

The Gem can use **Chart.js** to create interactive charts:

```
Create a bar chart showing trips per vehicle for the last 7 days.
```

```
Build a dashboard with a pie chart of vehicles by type and a line chart of daily trip counts.
```

```
Show a doughnut chart breaking down my fleet by vehicle group.
```

### Request Interactive Maps

Ask for **Leaflet maps** to display vehicle locations:

```
Create a map showing the current position of all my vehicles with markers.
```

```
Build a map Add-In that shows where each vehicle is located.
When I click a marker, show the vehicle name and current speed.
```

```
Display my vehicles on an interactive map. Auto-zoom to fit all markers.
```

### Use CSS Frameworks

Request **Bootstrap** or other CSS frameworks for professional styling:

```
Use Bootstrap styling for a clean, professional look.
```

```
Create a dashboard using Bootstrap cards and the grid layout.
Make it responsive so it works on mobile too.
```

```
Style the Add-In with Bootstrap. Use the dark theme.
```

### Request Clickable Links

Make your Add-In interactive by asking for clickable links that navigate to other MyGeotab pages:

```
Create a vehicle list where clicking the vehicle name opens that vehicle's detail page in MyGeotab.
```

```
Build a table of vehicles with clickable links to:
- View the vehicle's page
- View the vehicle's trip history
- View the vehicle's exceptions
```

```
Show a list of vehicles. When I click a vehicle name, take me to that vehicle's page.
Add a "View Trips" link next to each vehicle that opens trip history.
```

**Available navigation destinations:**
- Vehicle detail page
- Trip history
- Exceptions/rule violations
- Live map tracking
- Zone/geofence pages

### Request Creative Integrations

Add-Ins can do more than display data. Ask for integrations with email, calendars, maps, and more:

**Email with vehicle info:**
```
Add a "Report Issue" button next to each vehicle that opens an email
with the vehicle name and serial number pre-filled in the body.
```

**Calendar events:**
```
Add a "Schedule Maintenance" link that creates a Google Calendar event
with the vehicle name and details pre-filled.
```

**Maps integration:**
```
When showing vehicle locations, add a "Open in Google Maps" link
that opens the vehicle's position in a new tab.
```

**Call or text drivers:**
```
Show driver phone numbers as clickable links to call them.
Add a "Text Driver" button that opens SMS with a pre-written message.
```

**WhatsApp messages:**
```
Add a WhatsApp button next to each driver that opens a chat
with a vehicle status update pre-filled.
```

**Copy to clipboard:**
```
Add a "Copy Details" button that copies vehicle info to the clipboard
so I can paste it into other apps.
```

**Download data:**
```
Add an "Export CSV" button that downloads all the vehicle data
as a spreadsheet file.
```

**Print reports:**
```
Add a "Print" button that opens the print dialog for the current view.
```

**Voice readout:**
```
Add a "Read Aloud" button that speaks the fleet statistics
using text-to-speech. Good for hands-free use.
```

---

## Troubleshooting

### Add-In doesn't appear in the menu

1. **Hard refresh** the page: `Ctrl+Shift+R`
2. Check that you **saved** the configuration
3. Look under the correct menu section (usually "Activity")

### "Issue Loading This Page" error

The JSON may have a syntax error. Ask the Gem:
```
The Add-In shows an error. Can you check the JSON for syntax issues and regenerate it?
```

### Data not showing

1. Open browser **Developer Tools** (F12) → Console tab
2. Look for red error messages
3. Share the error with the Gem:
```
I'm getting this error in the console: [paste error message]
Can you fix it?
```

### Styles not applying

Embedded Add-Ins must use inline styles. Ask the Gem:
```
The styling isn't working. Can you make sure all CSS is inline using style="" attributes?
```

---

## What the Gem Can Build

### Data Display
- Vehicle lists and counts
- Driver rosters
- Trip summaries
- Fuel reports
- Exception events (speeding, harsh braking, etc.)
- Group hierarchies

### Dashboards
- Fleet overview with key metrics
- Safety scorecards
- Activity summaries
- Custom KPI displays

### Charts and Visualizations
- **Bar charts** - Compare trips, distances, or counts across vehicles
- **Pie/doughnut charts** - Show fleet composition by type or group
- **Line charts** - Track trends over time
- Uses **Chart.js** library from CDN

### Interactive Maps
- **Vehicle position maps** - Show current location of all vehicles
- **Clickable markers** - Display vehicle name, speed, status on click
- **Auto-zoom** - Fit all vehicles in view
- Uses **Leaflet** library with OpenStreetMap tiles

### Interactive Features
- Refresh buttons
- Simple filters
- Data tables
- Search boxes (basic)
- **Clickable links** to vehicle pages, trip history, exceptions, and maps

### Styling Options
- Card layouts
- Tables
- Gradient backgrounds
- Color themes
- Responsive designs
- **Bootstrap framework** - Professional, mobile-friendly layouts

---

## Limitations

**The Gem creates embedded Add-Ins which have some constraints:**

| Can Do | Cannot Do |
|--------|-----------|
| Display any Geotab data | Connect to external APIs |
| Use CDN libraries (Chart.js, Leaflet, Bootstrap) | Use React or complex frameworks |
| Build responsive layouts | Include images (without URLs) |
| Load CSS dynamically via JavaScript | Use static `<link>` or `<style>` tags |
| Multiple API calls | Real-time streaming updates |
| Navigate to other MyGeotab pages | Open external websites |

**For advanced Add-Ins** (external APIs, React frameworks, complex state management), you'll need external hosting. See the [Building Geotab Add-Ins guide](GEOTAB_ADDINS.md) for hosted options.

---

## Using Geotab Ace for Complex Questions

The Gem uses the direct Geotab API, which is great for displaying data. For **complex analytical questions**, tell the Gem to use Geotab Ace instead.

**When to ask for Ace:**
- Questions requiring AI analysis: "Which drivers need coaching?"
- Trend analysis: "What's my fuel efficiency trend?"
- Recommendations: "How can I reduce costs?"

**Key things to tell the Gem about Ace:**
- Ace uses the same API connection (no separate auth)
- Ace takes 30-60 seconds - needs a loading indicator
- Reference implementation: `github.com/fhoffa/geotab-ace-mcp-demo/blob/main/geotab_ace.py`

**The Wait-and-Poll Pattern (important!):**
Ace is async - you can't just make one call. Tell the Gem:
1. **create-chat** → get `chat_id` (underscore, not camelCase)
2. **send-prompt** with `chat_id` and `prompt` → get `message_group.id`
3. Wait 10 seconds, then **poll get-message-group** every 8 seconds until `status.status === "DONE"`
4. Extract answer from `message_group.messages[id].preview_array` (data) and `.reasoning` (explanation)

This is different from regular API calls which return immediately.

> ✅ **Verified:** Ace works from embedded Add-Ins (tested Feb 2026). See skill for working code.

**Important: Ace Data Latency**
- Ace data runs **behind** real-time API - don't expect the very latest records
- New demo accounts: wait **~1 day** before Ace has data to answer questions
- For real-time data, the Add-In should use direct API calls instead

**Example prompts for Ace Add-Ins:**

```
Create an Add-In with a text input where I can ask questions about my fleet.
Use Geotab Ace API (GetAceResults with serviceName "dna-planet-orchestration")
to process the question. Follow the async pattern:
create-chat → send-prompt → wait 10s → poll get-message-group every 8s until DONE.
The answer is in message_group.messages[id].preview_array (data) and .reasoning (text).
Include a loading spinner since Ace takes 30-60 seconds.
```

```
Build a "Fleet Insights" Add-In that has preset buttons for common questions:
- "Which drivers need safety coaching?"
- "What's our fuel efficiency trend this month?"
- "Which vehicles might need maintenance soon?"
When clicked, send the question to Geotab Ace and display the AI response.
```

```
Create an Add-In that combines regular API data with Ace insights.
Show a table of vehicles from the API, and add an "Ask Ace" button
that sends "What can you tell me about this fleet?" to get AI analysis.
```

**Note:** Ace queries take longer (10-60 seconds) but provide AI-powered insights that would otherwise require complex code.

> **When to use Ace vs direct API:** [ADVANCED_INTEGRATIONS.md](./ADVANCED_INTEGRATIONS.md#geotab-ace-when-to-use-ai-vs-direct-api)

---

## Quick Reference: Common Data Types

When describing what data you want, use these terms:

| You Want | Tell the Gem |
|----------|-------------|
| Vehicles/trucks | "Device data" or "vehicles" |
| Drivers | "Drivers" or "users who are drivers" |
| GPS locations | "LogRecord data" or "GPS points" |
| Geofences | "Zone data" or "geofences" |
| Speeding events | "ExceptionEvent data for speeding" |
| Trip history | "Trip data" |
| Fuel fill-ups | "FuelTransaction data" |
| Vehicle groups | "Group data" |
| Rules | "Rule data" |

---

## Need More Help?

**Ask the Gem itself:**
```
What kinds of Add-Ins can you create? Give me 5 example prompts.
```

```
What data can I display from MyGeotab?
```

```
How do I make the Add-In refresh automatically when I navigate to it?
```

**External resources:**
- [Geotab Add-In Development Guide](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
- [MyGeotab API Reference](https://geotab.github.io/sdk/software/api/reference/)

---

## Example: Complete Workflow

### 1. You ask:
```
Create a simple fleet dashboard showing:
- How many vehicles I have
- How many drivers
- My username
Make it look professional with a dark header and white cards.
```

### 2. The Gem responds with JSON:
```json
{
  "name": "Fleet Dashboard",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
  "version": "1.0",
  "items": [{
    "url": "dashboard.html",
    "path": "ActivityLink",
    "menuName": {
      "en": "Fleet Dashboard"
    }
  }],
  "files": {
    "dashboard.html": "<!DOCTYPE html>..."
  }
}
```

### 3. You paste into MyGeotab:
Administration → System Settings → Add-Ins → New Add-In → Configuration → Paste → Save

### 4. You see your new page:
Find "Fleet Dashboard" in the left sidebar and click it.

---

**That's it. Describe what you want, copy the JSON, paste into MyGeotab, and your custom page is live.**
