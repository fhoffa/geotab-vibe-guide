# Geotab Vibe Coding Workshop - Slides & Facilitator Guide

**Duration:** 60 minutes
**Format:** Hands-on workshop with live coding
**Goal:** Participants leave with working code and hackathon project ideas

This is the single source of truth for running a vibe coding workshop. Each slide includes what's on screen AND facilitator notes.

---

## Pre-Session Checklist

- [ ] Participants received pre-event email with [registration link](https://my.geotab.com/registration.html)
- [ ] Test environment ready (internet, screen sharing, audio)
- [ ] Repository URL ready to share: `github.com/fhoffa/geotab-vibe-guide`
- [ ] Backup demo account credentials ready
- [ ] Reviewed the detailed guides you'll reference
- [ ] Tested all demos work with current credentials

---

## Slide Deck

### Slide 1: Title (0:00)

**On Screen:**
```
VIBE CODING WITH GEOTAB
From Zero to Hackathon Hero in 60 Minutes

[Geotab logo] [Event name/date]
```

**Facilitator Notes:**
- Welcome everyone as they join
- "We'll start in 1 minute"
- Share repo link in chat: `github.com/fhoffa/geotab-vibe-guide`

---

### Slide 2: What We'll Build (0:01)

**On Screen:**
```
TODAY'S JOURNEY

0:00 - Quick Setup (5 min)
0:05 - First API Call (13 min)
0:18 - Visual Dashboards (12 min)
0:30 - AI-Powered Queries (12 min)
0:42 - Going Agentic (8 min)
0:50 - Hackathon Ideas (10 min)

You'll leave with: Working code + Project ideas
```

**Facilitator Notes:**
- "By the end, you'll have real code connecting to real fleet data"
- Quick poll: "Who has used AI coding assistants before?" (hands/chat)

---

### Slide 3: What is Vibe Coding? (0:02)

**On Screen:**
```
VIBE CODING = AI-Assisted Development

Traditional: Read docs → Write code → Debug → Repeat
Vibe: Describe what you want → AI writes code → Iterate

"The goal is working software, not memorizing APIs"
```

**Facilitator Notes:**
- "Vibe coding means describing what you want and letting AI help"
- "You still need to understand the code - AI is your co-pilot, not autopilot"
- Show 30-second demo of finished dashboard (optional)

---

### Slide 4: Account Setup (0:03)

**On Screen:**
```
GET YOUR CREDENTIALS

Option A: Use shared demo account (fastest)
  → Credentials in chat now

Option B: Create your own
  → my.geotab.com/registration.html
  → Takes ~2 minutes

You need: Database, Username, Password, Server
```

**Facilitator Notes:**
- Share credentials in chat immediately
- "Thumbs up when you have credentials ready"
- Don't wait for 100% - aim for 90% and move on
- Stragglers can use shared account

> **Detailed setup:** [CREDENTIALS.md](../guides/CREDENTIALS.md)

---

### Slide 5: Geotab API Overview (0:05)

**On Screen:**
```
GEOTAB API BASICS

Format: JSON-RPC (simpler than REST)
Auth: Authenticate once → Get session → Make requests

Common Data Types:
• Device (vehicles)
• Trip (journeys)
• LogRecord (GPS points)
• StatusData (diagnostics)
• User (drivers)

Reference: geotab.github.io/sdk/software/api/reference/
```

**Facilitator Notes:**
- "Don't memorize this - AI knows it"
- Show API reference briefly (30 seconds max)
- "The pattern is always: authenticate, then request data"

---

### Slide 6: Live Coding - Authentication (0:07)

**On Screen:**
```
YOUR FIRST API CALL

Prompt for Claude/ChatGPT:

"I want to explore the Geotab API.

Database: [your_database]
Username: [your_email]
Password: [your_password]
Server: my.geotab.com

Connect and show me what vehicles are in this fleet."
```

**Facilitator Notes:**
- **DEMO LIVE:** Open Claude, paste prompt with real credentials
- Show AI connecting and fetching data
- "Watch - it authenticates, then fetches devices"
- Share the prompt in chat for participants to copy

> **Full guide:** [INSTANT_START_WITH_CLAUDE.md](../guides/INSTANT_START_WITH_CLAUDE.md)

---

### Slide 7: Understanding the Response (0:12)

**On Screen:**
```
WHAT YOU GET BACK

{
  "result": [
    {
      "id": "b123",
      "name": "Truck 42",
      "serialNumber": "G9...",
      "deviceType": "GO9"
    },
    ...
  ]
}

Now try: "Show me recent trips for Truck 42"
```

**Facilitator Notes:**
- Walk through response structure briefly
- "Each vehicle has an ID - you'll use this for other queries"
- Encourage participants to try: "Show me trips" or "Get GPS locations"
- **Checkpoint:** "Who has fetched vehicle data?" (aim for 80%+)
- Share working code in chat for those behind

---

### Slide 8: Choose Your Dashboard Path (0:18)

**On Screen:**
```
BUILD SOMETHING VISUAL

Choose your adventure:

A. NO-CODE (Google Gem)
   → Custom MyGeotab page in 2 minutes
   → No coding required

B. VISUAL IDE (Antigravity)
   → Interactive map dashboard
   → Streamlit app

C. CLI DASHBOARD (Terminal)
   → Colored tables
   → Auto-refresh
```

**Facilitator Notes:**
- "Pick based on your comfort level"
- "I'll demo ONE path, but guides exist for all three"
- Let audience vote or pick based on skill level

---

### Slide 9: Path A - Google Gem (No-Code) (0:20)

**On Screen:**
```
NO-CODE ADD-IN WITH GOOGLE GEM

1. Open: gemini.google.com/gem/geotab-add-in-architect
2. Prompt:
   "Create an Add-In showing:
   - Total vehicles
   - Total drivers
   - Refresh button
   Use a card layout."
3. Copy JSON → Paste in MyGeotab → Done

Admin → System Settings → Add-Ins → New → Paste
```

**Facilitator Notes:**
- **If demoing this path:** Open Gem, show prompt, get JSON
- Show pasting into MyGeotab (or screenshot if time-limited)
- "No hosting, no code - just describe what you want"

> **Full guide:** [GOOGLE_GEM_USER_GUIDE.md](../guides/GOOGLE_GEM_USER_GUIDE.md)

---

### Slide 10: Path B - Antigravity IDE (0:20)

**On Screen:**
```
VISUAL DASHBOARD WITH ANTIGRAVITY

1. Open Antigravity IDE
2. Prompt:
   "Create a Streamlit app that:
   - Connects to Geotab API
   - Shows vehicles on an interactive map
   - Displays vehicle names on markers"
3. Run and see your fleet on a map

[Screenshot of map with vehicle markers]
```

**Facilitator Notes:**
- **If demoing this path:** Open Antigravity, show the prompt
- Run the app, show vehicles appearing on map
- "This is a real app you could deploy"

> **Full guide:** [ANTIGRAVITY_QUICKSTART.md](../guides/ANTIGRAVITY_QUICKSTART.md)

---

### Slide 11: Path C - CLI Dashboard (0:20)

**On Screen:**
```
TERMINAL DASHBOARD

Prompt:
"Create a CLI dashboard that displays:
- Vehicle names in a table
- Status (moving/stopped)
- Last GPS coordinates
Refresh every 30 seconds with colored output."

[Screenshot of colorful terminal table]
```

**Facilitator Notes:**
- **If demoing this path:** Show prompt, run result
- "Great for monitoring scripts or cron jobs"
- Works in any terminal

---

### Slide 12: Dashboard Checkpoint (0:28)

**On Screen:**
```
SHOW YOUR WORK!

Share a screenshot in chat of your dashboard

• Got something visual? +1
• Added a feature? +2
• Helped someone else? +3

[QR code to chat/Discord]
```

**Facilitator Notes:**
- **Checkpoint:** "Share screenshots!" (aim for 70%+)
- Call out interesting approaches
- "That's a great idea for a hackathon project!"
- Share working code for anyone stuck

---

### Slide 13: Geotab Ace API (0:30)

**On Screen:**
```
AI-POWERED FLEET INSIGHTS

Geotab Ace = AI that understands your fleet

Ask in natural language:
• "Which vehicles need maintenance soon?"
• "What's my fleet's fuel consumption trend?"
• "Who are my safest drivers?"

Ace translates questions → SQL queries → Answers
```

**Facilitator Notes:**
- "Ace is like ChatGPT for your fleet data"
- "It knows your vehicles, trips, drivers, diagnostics"
- "You don't write SQL - just ask questions"

---

### Slide 14: Live Coding - Ace Integration (0:33)

**On Screen:**
```
BUILD A FLEET CHATBOT

Prompt:
"Create a tool that uses Geotab Ace API to answer
fleet questions. It should:
1. Accept a natural language question
2. Send it to Ace API
3. Display the response

Support questions like:
- 'Which drivers have the best safety scores?'
- 'What's my fuel consumption this week?'"
```

**Facilitator Notes:**
- **DEMO:** Show Ace query in action
- Reference: [geotab_ace.py](https://github.com/fhoffa/geotab-ace-mcp-demo/blob/main/geotab_ace.py)
- If Ace is complex to set up, have pre-built demo ready
- **Checkpoint:** "Who got Ace working?" (aim for 60%+)

---

### Slide 14.5: Level Up with MCP (0:38)

**On Screen:**
```
MCP: CONVERSATIONAL FLEET CONTROL

Model Context Protocol lets Claude talk to your fleet directly.

Instead of writing code:
  You: "How many vehicles had trips today?"
  Claude: *queries your fleet* "47 vehicles completed 312 trips..."

Setup (advanced):
1. Clone: github.com/fhoffa/geotab-ace-mcp-demo
2. Configure credentials
3. Add to Claude Desktop
4. Ask questions naturally!

[Demo video: youtube.com/watch?v=-eID1rXS1p8]
```

**Facilitator Notes:**
- "MCP is for developers who want Claude to have direct fleet access"
- "Build your own now - official Geotab MCP coming later"
- Show 30-second clip from demo video if time permits
- "This is advanced - great hackathon project for experienced developers"
- Don't demo live unless pre-configured - just show the concept

> **Full guide:** [CUSTOM_MCP_GUIDE.md](../guides/CUSTOM_MCP_GUIDE.md)

---

### Slide 15: Going Agentic (0:42)

**On Screen:**
```
FROM DASHBOARDS TO AGENTS

Traditional          →    Agentic
─────────────────────────────────────
You check dashboards      System monitors 24/7
You notice problems       System detects & alerts
You take action           System acts automatically

The Loop: MONITOR → DETECT → DECIDE → ACT → repeat
```

**Facilitator Notes:**
- "An agent watches your fleet and takes action without you"
- "Dashboards require YOU to look - agents work while you sleep"
- Examples: speeding alerts, maintenance tickets, customer ETAs

---

### Slide 16: When to Go Agentic (0:45)

**On Screen:**
```
BUILT-IN VS EXTERNAL AGENTS

Geotab handles:           Build external when you need:
• Basic rules/exceptions  • Slack/Teams/SMS alerts
• Email notifications     • Multi-step workflows
• Zone entry/exit         • ServiceNow/Jira tickets
                          • AI-powered decisions
                          • Custom integrations

Tools: n8n, Make, Zapier, Python + cron
```

**Facilitator Notes:**
- "Check if Geotab's built-in rules work first"
- "Build external agents for complex workflows"
- Show one prompt example for n8n workflow

> **Full guide:** [AGENTIC_OVERVIEW.md](../guides/AGENTIC_OVERVIEW.md)

---

### Slide 17: Agentic Example (0:47)

**On Screen:**
```
EXAMPLE: SPEEDING ALERT WORKFLOW

Prompt for n8n:
"Build a workflow that:
1. Polls Geotab every 5 minutes for speeds
2. Filters for speed > 75 mph
3. Sends Slack alert to #fleet-alerts
4. Tracks alerts to avoid duplicates"

[Diagram: Geotab → n8n → Slack]
```

**Facilitator Notes:**
- "This runs automatically, forever"
- "You can add more steps: create ticket, alert driver, etc."
- Point to quickstart guide for hands-on setup

> **Step-by-step:** [AGENTIC_QUICKSTART_N8N.md](../guides/AGENTIC_QUICKSTART_N8N.md)

---

### Slide 18: Hackathon Ideas (0:50)

**On Screen:**
```
BUILD SOMETHING AWESOME

🌿 EcoFleet Optimizer - Carbon footprint tracker
🛡️ SafeDrive Coach - Driver safety gamification
🔧 PredictMaint AI - Maintenance before breakdowns
📊 FleetPulse - Real-time health monitoring
💬 GeotabGPT - Natural language fleet chatbot

Categories: Optimization | Safety | Environment | Integrations | Tools
```

**Facilitator Notes:**
- Speed round: 30 seconds per idea
- "Which one excites you?"
- Encourage combinations: "SafeDrive + Agentic = auto-coaching"

> **Full list:** [HACKATHON_IDEAS.md](../guides/HACKATHON_IDEAS.md)

---

### Slide 19: Speed Coding Demo (0:55)

**On Screen:**
```
WATCH: 3-MINUTE BUILD

"Build a web app that:
1. Fetches all trips from Geotab
2. Calculates estimated CO2 emissions
3. Shows a chart by vehicle"

[Live coding area]
```

**Facilitator Notes:**
- **LIVE DEMO:** Build something in 3 minutes
- Paste prompt, run code, show result
- Add one feature: "Now add a date filter"
- "That's vibe coding - describe, generate, iterate"

---

### Slide 20: Resources & Next Steps (0:58)

**On Screen:**
```
KEEP BUILDING

📚 SDK Docs: geotab.github.io/sdk/
💻 This Repo: github.com/fhoffa/geotab-vibe-guide
🚀 Instant Start: guides/INSTANT_START_WITH_CLAUDE.md
🤖 Agentic Guide: guides/AGENTIC_OVERVIEW.md
💡 Ideas: guides/HACKATHON_IDEAS.md

Your demo account stays active - keep experimenting!

[QR codes for links]
```

**Facilitator Notes:**
- Share all links in chat
- "Your account works - keep exploring"
- "Use AI to try more APIs"
- "Can't wait to see what you build!"

---

### Slide 21: Q&A (0:59)

**On Screen:**
```
QUESTIONS?

[Contact info]
[Discord/Slack invite]
[Hackathon deadline if applicable]
```

**Facilitator Notes:**
- Take 1-2 questions if time permits
- "More questions? Find us in Discord/Slack"
- Thank everyone for participating

---

## Backup Slides

### Backup A: Troubleshooting

**On Screen:**
```
COMMON ISSUES

❌ Authentication failed
   → Check credentials, especially database name

❌ No data returned
   → Demo account may have limited data
   → Try different date ranges

❌ Rate limited
   → Wait 1 minute, reduce request frequency

❌ Ace not responding
   → Check session is still valid
   → Ace may have different auth requirements
```

---

### Backup B: Python Code Reference

**On Screen:**
```python
from dotenv import load_dotenv
import os, requests
load_dotenv()

url = f"https://{os.getenv('GEOTAB_SERVER')}/apiv1"

# Authenticate
auth = requests.post(url, json={
    "method": "Authenticate",
    "params": {
        "database": os.getenv('GEOTAB_DATABASE'),
        "userName": os.getenv('GEOTAB_USERNAME'),
        "password": os.getenv('GEOTAB_PASSWORD')
    }
})
creds = auth.json()["result"]["credentials"]

# Fetch devices
resp = requests.post(url, json={
    "method": "Get",
    "params": {"typeName": "Device", "credentials": creds}
})
print(resp.json()["result"])
```

---

### Backup C: Extended Resources

**On Screen:**
```
LEARN MORE

Guides in this repo:
• CREDENTIALS.md - Setup help
• GEOTAB_API_REFERENCE.md - API details
• GEOTAB_ADDINS.md - Building Add-Ins
• DEMO_DATABASE_REFERENCE.md - What's in demo data

External:
• community.geotab.com - Official community
• reddit.com/r/GEOTAB - Reddit community
• developers.geotab.com - Developer portal
```

---

## Facilitator Playbook

### Running Behind?

| Cut This | Save |
|----------|------|
| Detailed API docs tour | 2 min |
| Show all 3 dashboard paths | 4 min |
| Extended Ace demo | 3 min |
| Speed coding demo | 3 min |

### Running Ahead?

- Deeper Q&A
- Show multiple dashboard paths
- Live feature requests from audience
- More hackathon idea discussion

### Technical Issues?

| Problem | Solution |
|---------|----------|
| Account creation failing | Use shared backup credentials |
| API not responding | Show cached responses, note it's cached |
| Participant stuck | Share working code immediately |
| Ace unavailable | Focus on main API, mention Ace in follow-up |

### Audience Skill Mismatch?

- **Too advanced:** Speed up basics, add complexity, show agentic systems deeper
- **Too beginner:** Slow down, use simpler prompts, more demos less hands-on
- **Mixed:** Create "bonus challenges" for advanced while helping beginners

---

## Engagement Tips

### Keep Interactive
- Polls every 10-15 minutes
- "Share your progress" moments
- Quick competitions: "First to fetch trips wins!"
- Encourage chat questions throughout

### Celebrate Wins
- Call out participants sharing cool results
- Screenshot interesting approaches
- "That's a great hackathon idea!"

### Handle Frustration
- "Errors are part of coding - let's debug together"
- "AI sometimes gets it wrong - rephrase and try again"
- "Working code is in the repo if you're stuck"

---

## Success Indicators

**Green Flags:**
- 80%+ completing checkpoints
- Active chat with questions and screenshots
- Variety in approaches
- Participants helping each other

**Red Flags → Adjust:**
- <50% completing checkpoints → Slow down, share more code
- Silent chat → Ask direct questions, encourage sharing
- Same questions repeated → Re-explain concept
- Participants leaving → Switch to more demos, less hands-on

---

## Quick Reference Links

| Topic | Guide |
|-------|-------|
| Credentials & Setup | [CREDENTIALS.md](../guides/CREDENTIALS.md) |
| Instant Start | [INSTANT_START_WITH_CLAUDE.md](../guides/INSTANT_START_WITH_CLAUDE.md) |
| Antigravity IDE | [ANTIGRAVITY_QUICKSTART.md](../guides/ANTIGRAVITY_QUICKSTART.md) |
| No-Code Add-Ins | [GOOGLE_GEM_USER_GUIDE.md](../guides/GOOGLE_GEM_USER_GUIDE.md) |
| MCP Server Setup | [CUSTOM_MCP_GUIDE.md](../guides/CUSTOM_MCP_GUIDE.md) |
| Agentic Systems | [AGENTIC_OVERVIEW.md](../guides/AGENTIC_OVERVIEW.md) |
| Hackathon Ideas | [HACKATHON_IDEAS.md](../guides/HACKATHON_IDEAS.md) |
| API Reference | [GEOTAB_API_REFERENCE.md](../guides/GEOTAB_API_REFERENCE.md) |

---

## Creating Actual Slides

This document serves as both script and slide content. To create visual slides:

### Recommended Tools
- **Google Slides** - Collaborative, easy sharing
- **Canva** - Modern templates, design-friendly
- **reveal.js** - HTML-based (for developers)

### Design Tips
- Dark theme (developer-friendly)
- Large, readable code snippets
- Syntax highlighting for code
- Screenshots of actual outputs
- Minimal text per slide
- QR codes for links

### Export
- PDF backup for offline use
- Share link before session

---

*Timing is approximate. Adjust based on audience engagement and skill level.*
