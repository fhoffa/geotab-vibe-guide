# Geotab Vibe Coding Workshop - Minute-by-Minute Guide

**Duration:** 60 minutes
**Format:** Hands-on workshop with live coding
**Goal:** Participants leave with working code and hackathon project ideas

This guide is for **facilitators** running a vibe coding workshop. It links to detailed guides rather than duplicating content.

---

## Pre-Session Checklist

- [ ] Participants received pre-event email with [registration link](https://my.geotab.com/registration.html)
- [ ] Test environment ready (internet, screen sharing, audio)
- [ ] Repository URL ready to share: `github.com/fhoffa/geotab-vibe-guide`
- [ ] Backup demo account credentials ready (in case participants have issues)
- [ ] Reviewed the detailed guides you'll reference

---

## 0:00-0:05 | Introduction & Quick Setup (5 min)

### 0:00-0:02 | Welcome & Vibe Coding Intro

**Say:**
- "Today we're learning VIBE CODING - using AI to build real applications, fast"
- "No need to memorize API docs - AI helps you explore"
- "By the end, you'll have working code connecting to real fleet data"

**Show:** Demo of finished dashboard (30 seconds)

**Quick poll:** "Who has used AI coding assistants before?" (hands/chat)

### 0:02-0:05 | Account Setup (Fast Track)

**Two paths - pick based on audience:**

**Path A: Pre-created accounts (fastest)**
- Share pre-created demo credentials in chat
- Everyone uses same account for learning
- "We'll use a shared demo account to save time"

**Path B: Self-registration (if time permits)**
- Share: https://my.geotab.com/registration.html
- "Create your account now - you have 3 minutes"
- Walk through quickly, don't wait for everyone

**Checkpoint:** "Thumbs up if you have credentials ready!" (aim for 90%+)

> **Detailed setup:** [CREDENTIALS.md](./CREDENTIALS.md)

---

## 0:05-0:18 | First API Experience (13 min)

### 0:05-0:07 | API Overview (2 min)

**Quick explanation:**
- "Geotab's API uses JSON-RPC - simpler than it sounds"
- "You authenticate once, then make requests for data"
- "Common data types: Devices (vehicles), Trips, GPS locations, Diagnostics"

**Show:** API reference briefly (don't linger): https://geotab.github.io/sdk/software/api/reference/

### 0:07-0:18 | Live Coding: Instant Start (11 min)

**Choose your tool** (pick ONE based on audience):

#### Option A: Claude Web (Recommended for beginners)
Share this prompt template:
```
I want to explore the Geotab API.

Database: [demo_database]
Username: [demo_email]
Password: [demo_password]
Server: my.geotab.com

Connect and show me what vehicles are in this fleet.
```

**Demo live:** Paste credentials, watch Claude connect and fetch data in real-time.

> **Full guide:** [INSTANT_START_WITH_CLAUDE.md](./INSTANT_START_WITH_CLAUDE.md)

#### Option B: Local Python (For developers)
```python
from dotenv import load_dotenv
import os, requests
load_dotenv()

url = f"https://{os.getenv('GEOTAB_SERVER')}/apiv1"
auth = requests.post(url, json={"method": "Authenticate", "params": {
    "database": os.getenv('GEOTAB_DATABASE'),
    "userName": os.getenv('GEOTAB_USERNAME'),
    "password": os.getenv('GEOTAB_PASSWORD')
}})
creds = auth.json()["result"]["credentials"]

# Fetch devices
resp = requests.post(url, json={"method": "Get", "params": {
    "typeName": "Device", "credentials": creds
}})
print(f"Found {len(resp.json()['result'])} vehicles")
```

**Participant actions:**
- Follow along with the chosen approach
- Fetch vehicle list
- Try: "Show me recent trips for one vehicle"

**Checkpoint:** "Who has successfully fetched vehicle data?" (aim for 80%+)

**Catch-up:** Share working code snippet in chat for those behind.

---

## 0:18-0:30 | Building Something Visual (12 min)

### Choose Your Path

Present three options - let participants pick based on comfort level:

### Path A: No-Code Add-In (Google Gem)
**Best for:** Non-coders, fastest results

"Want a custom page in MyGeotab without writing code?"

**Demo:** Open [Geotab Add-In Architect Gem](https://gemini.google.com/gem/1Y6IvbBj4ALgS9G3SgGodepM2dfArInrO)

**Prompt:**
```
Create an Add-In that shows:
- Total number of vehicles
- Total number of drivers
- A refresh button
Use a clean card layout.
```

Copy JSON → Paste in MyGeotab → Done.

> **Full guide:** [GOOGLE_GEM_USER_GUIDE.md](./GOOGLE_GEM_USER_GUIDE.md)

### Path B: Visual IDE (Antigravity)
**Best for:** Developers who want a visual app

"Let's build an interactive map dashboard."

**Steps:**
1. Open Antigravity IDE
2. Prompt: "Create a Streamlit app that shows my Geotab vehicles on a map"
3. Run and see results

> **Full guide:** [ANTIGRAVITY_QUICKSTART.md](./ANTIGRAVITY_QUICKSTART.md)

### Path C: CLI Dashboard (Code-focused)
**Best for:** Terminal lovers

**Prompt AI:**
```
Create a CLI dashboard that displays:
- Vehicle names in a table
- Current status (moving/stopped)
- Last GPS coordinates
Refresh every 30 seconds with colored output.
```

### Live Demo (5 min)

Pick ONE path and demo it live. Show:
1. The prompt you use
2. AI generating code/config
3. Running/deploying the result
4. Adding one feature: "Now add vehicle names to the markers"

**Checkpoint:** "Share a screenshot of your dashboard!" (aim for 70%+)

---

## 0:30-0:42 | AI-Powered Insights: Ace API (12 min)

### 0:30-0:33 | What is Geotab Ace? (3 min)

**Explain:**
- "Ace is AI that understands your fleet data"
- "Ask questions in natural language, get structured answers"
- "It translates your questions into database queries"

**Use cases:**
- "Which vehicles need maintenance soon?"
- "What's my fleet's fuel consumption trend?"
- "Who are my safest drivers?"

### 0:33-0:42 | Build an AI Query Tool (9 min)

**Prompt AI:**
```
Create a tool that uses Geotab Ace API to answer fleet questions.
It should:
1. Accept a natural language question
2. Send it to Ace API
3. Display the response

Example questions to support:
- "Which drivers have the best safety scores?"
- "What's my total fuel consumption this week?"
```

**Reference implementation:** [geotab_ace.py](https://github.com/fhoffa/geotab-ace-mcp-demo/blob/main/geotab_ace.py)

**Live demo:** Ask a real question, show the response.

**Checkpoint:** "Who got Ace working?" (aim for 60%+)

**Note:** If Ace credentials are complex, have a shared demo ready.

---

## 0:42-0:50 | Going Agentic (8 min)

### 0:42-0:45 | What Are Agentic Systems? (3 min)

**Explain the shift:**

| Traditional | Agentic |
|-------------|---------|
| You check dashboards | System monitors automatically |
| You notice problems | System detects and alerts |
| You take action | System acts (alerts, tickets, API calls) |

**The loop:** `MONITOR → DETECT → DECIDE → ACT → repeat`

**Quick examples:**
- Speeding alert → Slack message
- Fault code detected → Create maintenance ticket
- Vehicle near customer → Send ETA notification

### 0:45-0:50 | When to Go Agentic (5 min)

**Built-in Geotab features handle:**
- Basic rules and exceptions
- Email notifications
- Zone entry/exit alerts

**Build external agents when you need:**
- Different destinations (Slack, Teams, SMS)
- Multi-step workflows (fault → find shop → create ticket → alert driver)
- AI-powered decisions
- External integrations (ServiceNow, Jira, Salesforce)

**Show one prompt:**
```
Build an n8n workflow that:
1. Polls Geotab every 5 minutes for vehicle speeds
2. Filters for speed > 75 mph
3. Sends Slack alert to #fleet-alerts
4. Tracks alerts to avoid duplicates
```

> **Full guide:** [AGENTIC_OVERVIEW.md](./AGENTIC_OVERVIEW.md)
> **Step-by-step:** [AGENTIC_QUICKSTART_N8N.md](./AGENTIC_QUICKSTART_N8N.md)

---

## 0:50-1:00 | Hackathon Ideas & Wrap-up (10 min)

### 0:50-0:55 | Project Ideas Speed Round (5 min)

**Rapid-fire - 30 seconds each:**

1. **EcoFleet Optimizer** - Carbon footprint tracker with reduction tips
2. **SafeDrive Coach** - Driver safety scorecard with gamification
3. **PredictMaint AI** - Predictive maintenance before breakdowns
4. **FleetPulse Dashboard** - Real-time fleet health monitoring
5. **GeotabGPT** - Natural language fleet chatbot

**Categories to explore:**
- Fleet optimization (routes, fuel, idle time)
- Safety & compliance (HOS, driver behavior)
- Environmental impact (carbon, EV planning)
- Integrations (Slack, CRM, ticketing systems)
- Developer tools (API explorers, SDKs)

> **Full list:** [HACKATHON_IDEAS.md](./HACKATHON_IDEAS.md)

### 0:55-0:58 | Speed Coding Demo (3 min)

**Live demo:** "Watch me build a carbon footprint calculator in 3 minutes"

```
Build a web app that:
1. Fetches all trips from Geotab
2. Calculates estimated CO2 emissions
3. Shows a chart by vehicle
```

Run it. Add one feature. "That's vibe coding."

### 0:58-1:00 | Wrap-up & Resources (2 min)

**Share in chat:**
```
📚 SDK Documentation: https://geotab.github.io/sdk/
💻 This Repository: github.com/fhoffa/geotab-vibe-guide
🚀 Instant Start: guides/INSTANT_START_WITH_CLAUDE.md
🤖 Agentic Guide: guides/AGENTIC_OVERVIEW.md
💡 Hackathon Ideas: guides/HACKATHON_IDEAS.md
```

**Final messages:**
- "Your demo account is active - keep experimenting"
- "Use AI to explore more APIs"
- "Can't wait to see what you build!"

---

## Instructor Backup Plans

### Running Behind?
- **Skip:** Detailed API docs tour (just share link)
- **Condense:** Pick one dashboard path instead of showing all three
- **Fast-forward:** Use pre-built code snippets

### Running Ahead?
- **Add:** More Q&A time
- **Expand:** Show multiple dashboard paths
- **Bonus:** Live feature requests from audience

### Technical Issues?
| Problem | Solution |
|---------|----------|
| Account creation failing | Use shared backup credentials |
| API not responding | Show cached responses, mention it's cached |
| Participant stuck | Share working code in chat immediately |
| Ace API unavailable | Focus on my.geotab.com API, show Ace in recording |

### Audience Skill Mismatch?
- **Too advanced:** Speed up basics, add complexity
- **Too beginner:** Slow down, use simpler prompts, more demos
- **Mixed:** Create "bonus challenges" for advanced participants

---

## Engagement Tactics

### Keep It Interactive
- Polls every 10-15 minutes
- "Share your progress" moments
- Quick competitions: "First to fetch trips wins!"
- Encourage chat questions throughout

### Celebrate Wins
- Call out participants sharing cool results
- Screenshot and display interesting approaches
- "That's a great hackathon idea!"

### Handle Frustration
- "Errors are part of coding - let's debug together"
- "AI sometimes gets it wrong - ask differently"
- "Working code is in the repo if you're stuck"

---

## Success Indicators

**Green Flags:**
- 80%+ completing checkpoints
- Active chat with questions and screenshots
- Variety in approaches (not everyone copying exactly)
- Participants helping each other

**Red Flags (Adjust!):**
- Less than 50% completing checkpoints
- Silent chat
- Same questions repeated (concept unclear)
- Participants leaving

**Adjustments:**
- Slow down and re-explain
- Share working code immediately
- Switch to more demos, less hands-on
- Take impromptu questions

---

## Quick Links for Facilitators

| Topic | Guide |
|-------|-------|
| Credentials & Setup | [CREDENTIALS.md](./CREDENTIALS.md) |
| Instant Start (Claude) | [INSTANT_START_WITH_CLAUDE.md](./INSTANT_START_WITH_CLAUDE.md) |
| Antigravity IDE | [ANTIGRAVITY_QUICKSTART.md](./ANTIGRAVITY_QUICKSTART.md) |
| No-Code Add-Ins | [GOOGLE_GEM_USER_GUIDE.md](./GOOGLE_GEM_USER_GUIDE.md) |
| Agentic Systems | [AGENTIC_OVERVIEW.md](./AGENTIC_OVERVIEW.md) |
| Hackathon Ideas | [HACKATHON_IDEAS.md](./HACKATHON_IDEAS.md) |
| API Reference | [GEOTAB_API_REFERENCE.md](./GEOTAB_API_REFERENCE.md) |

---

*Timing is approximate. Adjust based on audience engagement and skill level.*
