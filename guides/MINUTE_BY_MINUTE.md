# Geotab Vibe Coding Tutorial - Minute-by-Minute Breakdown

## Pre-Session (Before 0:00)
- [ ] Participants have received pre-event email with registration link
- [ ] Testing environment ready (internet, screen sharing, audio)
- [ ] Code repository URL shared in chat
- [ ] AI coding assistants confirmed working

---

## 0:00-0:10 | Part 1: Introduction & Setup

### 0:00-0:03 | Welcome & Vibe Coding Introduction
**Instructor Actions:**
- Welcome everyone, introduce yourself
- "Today we're learning VIBE CODING - using AI to build real applications, fast"
- Show the end goal: a working fleet dashboard or AI query tool
- Quick poll: "Who has used AI coding assistants before?"

**Key Messages:**
- Vibe coding = conversation with AI to build real software
- No need to memorize API docs - let AI help you explore
- Focus on what you want to build, not syntax

**Screen:** Title slide → Demo of finished app

### 0:03-0:10 | Create Your Geotab Account
**Instructor Actions:**
- Share screen: https://my.geotab.com/registration.html
- Walk through registration form field by field
- Emphasize: save your credentials (database name, username, password, server)
- Show successful login and demo dashboard

**Participant Actions:**
- Fill out registration form
- Confirm email (if required)
- Log in and see demo data
- Write down credentials

**Screen:** Live registration walkthrough

**Troubleshooting Corner:**
- "Not getting email?" → Check spam folder
- "Form not loading?" → Try different browser
- "Password requirements?" → At least 8 chars, number, special char

**Checkpoint:** "Thumbs up if you're logged into MyGeotab!" (aim for 90%+)

---

## 0:10-0:25 | Part 2: Your First API Call - Vibe Style

### 0:10-0:13 | Understanding Geotab's API
**Instructor Actions:**
- Quick tour: https://geotab.github.io/sdk/software/api/reference/
- Explain: JSON-RPC format (simpler than it sounds!)
- Show API call structure: method, params, credentials
- "Don't worry about memorizing this - AI will help us"

**Key Concepts:**
```
API Call Structure:
{
  "method": "Get",
  "params": {
    "typeName": "Device",
    "credentials": {...}
  }
}
```

**Screen:** API documentation → JSON example

### 0:13-0:25 | Vibe Code Your First Connection
**Instructor Actions:**
- Open AI coding assistant (Claude Code, Copilot, etc.)
- "Let's ask AI to help us connect to Geotab"
- Type prompt: "Create a Node.js script to authenticate with Geotab API"
- Review generated code together
- Run the script
- Modify prompt: "Now fetch all vehicles and print their names"
- Run and show results

**Participant Actions:**
- Open their coding environment
- Follow along with prompts
- Run authentication script
- Fetch vehicle list
- Experiment with modifications

**Example Prompts to Try:**
```
1. "Create a Python script to authenticate with Geotab API using these credentials: [paste]"

2. "Using the Geotab SDK for Node.js, fetch all devices and print their names and serial numbers"

3. "Get the current GPS location for all vehicles in my fleet"

4. "Retrieve trips from the last 24 hours for vehicle ID: [id]"
```

**Screen:** Split screen - AI assistant + terminal

**Live Coding Tips:**
- Talk through what AI generates
- Point out key parts: credentials, API endpoint, method name
- Show how to ask AI to explain: "What does this function do?"
- Demonstrate iteration: "Make this output prettier"

**Checkpoint:** "Who has successfully fetched vehicle data?" (aim for 80%+)

**Catch-up Code:** Share a working authentication snippet in chat for those behind

---

## 0:25-0:40 | Part 3: Exploring Real-World Data

### 0:25-0:33 | Deep Dive into Telematics Data
**Instructor Actions:**
- "Let's explore what data Geotab actually tracks"
- Show different data types: Device, Trip, StatusData, LogRecord
- Demonstrate a few API calls to get:
  - Vehicle diagnostics (fuel level, engine RPM)
  - GPS coordinates and speed
  - Trip history with distance and duration
  - Fault codes and alerts

**Key API Entities:**
```
Device       → Vehicles and assets
Trip         → Journey from ignition on to off
StatusData   → Real-time diagnostics (fuel, speed, etc.)
LogRecord    → GPS breadcrumbs
FaultData    → Engine fault codes
DriverChange → Who's driving
```

**Example Vibe Prompts:**
```
"Get the latest fuel level for all vehicles"
"Show me all trips longer than 50 miles from yesterday"
"Find any vehicles with active fault codes"
"Get GPS coordinates for vehicle X over the last hour"
```

**Screen:** API responses → Real data visualization

### 0:33-0:40 | Build a Data Dashboard
**Instructor Actions:**
- "Let's build something visual in the next 7 minutes"
- Prompt AI: "Create a simple HTML dashboard showing vehicle locations on a map using Leaflet"
- Or: "Build a CLI tool with colored output showing vehicle health scores"
- Run the generated code
- Add a feature live: "Add vehicle names to the map markers"

**Participant Actions:**
- Choose: web dashboard or CLI tool
- Prompt AI to generate their version
- Customize with their own ideas
- Share screenshots in chat

**Example Projects:**
```
Option A: Web Map Dashboard
- Vehicle locations plotted on Leaflet/Mapbox
- Click markers for vehicle details
- Color-code by status (moving, idle, parked)

Option B: CLI Health Monitor
- Table format with vehicle names
- Health scores (green/yellow/red)
- Latest diagnostic data
- Refresh every 30 seconds

Option C: Trip Report Generator
- List of trips from today
- Total distance, fuel used
- Export to CSV
```

**Screen:** Live dashboard building with AI

**Checkpoint:** "Share a screenshot of your dashboard!" (aim for 70%+)

---

## 0:40-0:52 | Part 4: AI-Powered Insights with Geotab Ace API

### 0:40-0:43 | Introduction to Geotab Ace API
**Instructor Actions:**
- "Now let's add AI intelligence to our fleet data"
- Explain Geotab Ace: AI that understands your fleet
- Use cases: natural language queries, predictive insights, recommendations
- Show Ace API documentation

**Key Capabilities:**
- Natural language questions → structured data queries
- Predictive maintenance forecasting
- Route optimization suggestions
- Driver behavior analysis
- Anomaly detection

**Screen:** Ace API overview → Use case examples

### 0:43-0:52 | Build an AI Fleet Chatbot
**Instructor Actions:**
- Prompt AI: "Create a chatbot that uses Geotab Ace API to answer fleet questions"
- Show authentication with Ace
- Make first query: "Which vehicles are due for maintenance?"
- Add another: "What's the most efficient route for deliveries today?"
- Combine with my.geotab.com data for richer responses

**Participant Actions:**
- Set up Ace API credentials
- Create chatbot or query tool
- Test with different questions
- Combine Ace insights with raw API data

**Example Questions to Ask Ace:**
```
"Which drivers have the best safety scores?"
"Predict which vehicles will need maintenance in the next 30 days"
"What's the total fuel consumption this week vs last week?"
"Which routes have the most idle time?"
"How can I reduce my fleet's carbon footprint?"
```

**Advanced Prompt:**
```
"Create a Slack bot that accepts natural language fleet questions,
queries Geotab Ace API, fetches supporting data from my.geotab.com API,
and returns formatted insights with charts"
```

**Screen:** Live chatbot demo with real queries

**Checkpoint:** "Who got Ace API working?" (aim for 60%+)

**Note:** If Ace API credentials are complex, have a shared demo instance ready

---

## 0:52-1:00 | Part 5: Hackathon Ideas & Wrap-up

### 0:52-0:55 | Hackathon Project Ideas Speed Round
**Instructor Actions:**
- Rapid-fire project ideas (2-3 examples per category)
- Show quick mockups or wireframes
- "You can build any of these in 4-8 hours with vibe coding"
- Point to full ideas document

**Present Top 10 Ideas:**
1. **EcoFleet Optimizer** - Carbon footprint tracker with reduction recommendations
2. **SafeDrive Coach** - Driver safety scorecard with gamification
3. **PredictMaint AI** - Predictive maintenance alerts before breakdowns
4. **RouteGenius** - AI-powered route optimization
5. **FleetPulse Dashboard** - Real-time fleet health monitoring
6. **IdleKiller** - Idle time tracking and reduction challenges
7. **GeotabGPT** - Natural language fleet analytics chatbot
8. **EVReady Planner** - Fleet electrification ROI calculator
9. **ComplianceGuard** - HOS and safety compliance tracker
10. **DriverConnect** - Driver communication and feedback app

**Screen:** Idea gallery with screenshots

### 0:55-0:58 | Live Speed Coding Demo
**Instructor Actions:**
- "Watch me build a carbon footprint calculator in 3 minutes"
- Prompt: "Build a web app that calculates fleet CO2 emissions from Geotab trip data"
- Let AI generate
- Run it
- Add one feature: "Add a chart showing emissions by vehicle"
- Run again
- "That's vibe coding - idea to working prototype in minutes"

**Screen:** Full-screen coding session

### 0:58-1:00 | Wrap-up & Next Steps
**Instructor Actions:**
- Recap what we built today
- Share resources:
  - Code repository with all examples
  - API documentation links
  - Hackathon details and timeline
  - Discord/Slack community invite
- Announce prizes
- "Q&A time - drop questions in chat"
- Thank participants

**Key Resources to Share:**
```
📚 Geotab SDK Documentation: https://geotab.github.io/sdk/
💻 Code Examples Repository: [your-repo-url]
💬 Community Discord: [invite-link]
🏆 Hackathon Submission Form: [form-url]
📅 Hackathon Timeline: [schedule]
🎯 Judging Criteria: [rubric]
```

**Final Messages:**
- "Keep vibing - use AI to explore more"
- "Your demo account is active for [X days]"
- "Can't wait to see what you build!"
- "Recording will be available in 24 hours"

**Screen:** Resources slide

---

## Post-Session (After 1:00)
- [ ] Share recording link
- [ ] Send follow-up email with resources
- [ ] Post code examples to repository
- [ ] Open Discord/Slack for ongoing support
- [ ] Begin monitoring hackathon submissions

---

## Instructor Backup Plans

### If Running Behind (5+ minutes)
- **Skip:** Detailed API documentation tour (just share link)
- **Condense:** Multiple dashboard examples → pick one
- **Fast-forward:** Use pre-built code snippets instead of live generation

### If Running Ahead (5+ minutes)
- **Add:** More Q&A time
- **Expand:** Show advanced Ace API capabilities
- **Bonus:** Demonstrate error handling and production tips
- **Interactive:** Take audience suggestions for features to add

### If Technical Issues
- **Demo Account Issues:** Use instructor's backup account, share API key
- **Participant Coding Issues:** Share working code snippets in chat
- **API Down:** Have recorded API responses to simulate (mention it's cached)
- **Ace API Unavailable:** Focus more on my.geotab.com API, show Ace in recording

### If Audience Skill Mismatch
- **Too Advanced:** Speed up basics, add complexity to examples
- **Too Beginner:** Slow down, explain more fundamentals, use simpler prompts
- **Mixed Levels:** Create "bonus challenges" for advanced participants

---

## Energy & Engagement Tactics

### Keep It Interactive
- Polls every 10-15 minutes
- "Share your progress" moments
- Quick competitions: "First to fetch trip data wins!"
- Encourage questions in chat throughout

### Celebrate Wins
- Call out participants who share cool results
- Screenshot and show interesting approaches
- "That's a great idea for a hackathon project!"
- Create excitement around what's possible

### Handle Frustration
- "Errors are part of coding - let's debug together"
- "AI sometimes gets it wrong - that's okay, ask differently"
- "If you're stuck, we have working code in the repo"
- Normalize struggle as part of learning

### Maintain Momentum
- Use timers for exercises
- "You have 5 minutes to get this working"
- Background music during coding time (optional)
- Countdowns to build urgency: "3... 2... 1... show time!"

---

## Success Indicators During Session

**Green Flags (Going Well):**
- ✅ 80%+ participants completing checkpoints
- ✅ Active chat with questions and screenshots
- ✅ Variety in approaches (not everyone copying exactly)
- ✅ Excitement/surprise reactions to demos
- ✅ Participants helping each other in chat

**Red Flags (Adjust!):**
- ⚠️ Less than 50% completing checkpoints
- ⚠️ Silent chat (no engagement)
- ⚠️ Repeated same questions (concept not clear)
- ⚠️ Long pauses where nothing happens
- ⚠️ Participants leaving/disconnecting

**Adjustment Actions:**
- Slow down and re-explain
- Share working code immediately
- Take impromptu questions
- Switch to more demos, less hands-on
- Pair participants for problem-solving

---

*This timing is approximate and should be adjusted based on audience engagement and technical proficiency.*
