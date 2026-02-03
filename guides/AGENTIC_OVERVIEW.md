# Agentic Fleet Systems: Overview

**Autonomous agents that monitor your fleet and take action—without you lifting a finger.**

This guide explains what "agentic" means, when you need it, and how to prompt AI to build it for you.

---

## What is an "Agentic" System?

Traditional fleet tools require you to check dashboards and take action manually. An **agentic system** flips this:

| Traditional Approach | Agentic Approach |
|---------------------|------------------|
| You check the dashboard | The system monitors continuously |
| You notice a problem | The system detects it automatically |
| You decide what to do | The system decides (rules or AI) |
| You take action | The system acts (alerts, tickets, API calls) |

### The Agentic Loop

```
MONITOR → DETECT → DECIDE → ACT → (repeat forever)
```

1. **Monitor**: Continuously watch Geotab data (locations, speeds, faults, trips)
2. **Detect**: Identify conditions that matter (speeding, geofence entry, idle time)
3. **Decide**: Apply rules or AI reasoning to determine response
4. **Act**: Send alerts, create tickets, update systems, notify people

### Example Flows

**Simple: Speeding Alert**
```
MONITOR: Check vehicle speeds every 5 minutes
DETECT:  Speed > 80 mph
DECIDE:  Alert supervisor
ACT:     Send Slack message with vehicle, driver, location
```

**Medium: Maintenance Automation**
```
MONITOR: Watch for engine fault codes
DETECT:  Critical fault code appears
DECIDE:  Check if vehicle is near service center
ACT:     → Create ticket in ServiceNow
         → Alert driver via SMS
         → Notify fleet manager
         → Update vehicle status in CRM
```

**Advanced: AI Safety Coaching**
```
MONITOR: Analyze driving patterns over 7 days
DETECT:  Driver's safety score declining
DECIDE:  AI determines personalized coaching needed
ACT:     → Generate custom training recommendations
         → Schedule coaching session
         → Send materials to driver
         → Log intervention in HR system
```

**External Events: Weather Protection**
```
MONITOR: Weather API for fleet regions
DETECT:  Severe storm warning issued
DECIDE:  Identify affected vehicles and drivers
ACT:     → Create temporary hazard zones in Geotab
         → Alert drivers in affected areas
         → Notify dispatch of potential delays
         → Remove zones when weather clears
```

---

## When Do You Need an Agentic System?

**Important:** Geotab's built-in features handle many scenarios:

| Built-In Feature | What It Does |
|------------------|--------------|
| **Rules & Exceptions** | Trigger on speeding, harsh braking, after-hours use |
| **Zones (Geofences)** | Detect entry/exit from defined areas |
| **Notifications** | Send email alerts when rules trigger |

**Build an external agent when you need:**

- **Different destinations**: Slack, Teams, Discord, SMS (not just email)
- **External integrations**: ServiceNow, Jira, Salesforce, Google Sheets
- **Multi-step workflows**: Fault detected → find service center → create ticket → alert driver
- **AI-powered decisions**: Pattern analysis, personalized recommendations
- **Custom logic**: "Alert on 3rd speeding event this week" or "Notify customer when 15 min away"

---

## Choosing Your Tool

| If you want... | Use this | Complexity |
|----------------|----------|------------|
| Visual drag-and-drop, quick setup | **n8n** or **Make** | Low |
| Simplest possible automation | **Zapier** | Very Low |
| Full control, free | **Python script + cron** | Low-Medium |
| AI reasoning and decisions | **Google ADK** or **LangGraph** | Medium |
| Enterprise compliance | **Workato** | Medium |

**Recommendation:** Start with [n8n](https://n8n.io/) — it's visual, free to self-host, and has AI agent capabilities.

---

## Vibe Prompts: What to Ask AI

Copy these prompts directly into Claude, ChatGPT, or your AI assistant. Customize the bracketed sections.

### Basic Monitoring Agent

```
Build an n8n workflow that:
1. Polls the Geotab API every [5 minutes] for vehicle data
2. Filters for vehicles where speed > [75 mph]
3. Sends a Slack message to [#fleet-alerts] with vehicle name, driver, and location
4. Tracks which alerts were already sent to avoid duplicates

Use HTTP Request nodes for the Geotab API. I'll provide my credentials.
```

### Multi-Step Workflow

```
Build an automation that handles engine fault codes:
1. Monitor Geotab for fault codes on any vehicle
2. When a critical fault appears:
   - Look up the vehicle's current location
   - Find the nearest service center from [my list]
   - Create a ticket in [ServiceNow/Jira/Sheets]
   - Send SMS to the driver with service center directions
   - Alert the fleet manager on Slack
3. Log everything to a Google Sheet for tracking

I'm using [n8n/Make/Zapier]. Walk me through the setup.
```

### External Event Monitoring

```
Build an agent that monitors weather and protects my fleet:
1. Check Tomorrow.io weather API every 30 minutes
2. When severe weather is forecast for [my region]:
   - Create a temporary hazard zone in Geotab
   - Alert all drivers currently in the affected area
   - Notify dispatch about potential delays
3. Remove the zone when the weather clears

Show me how to set this up with [n8n/Python].
```

### AI-Powered Safety Coach

```
Build an AI agent that improves driver safety:
1. Every [Sunday evening], analyze each driver's week:
   - Speeding events, harsh braking, idle time
   - Compare to their previous weeks and fleet average
2. Use AI to write personalized coaching feedback
3. Send each driver their summary via [email/Slack]
4. Flag high-risk drivers for manager review

Use [Google ADK/LangGraph] for the AI reasoning.
```

### Customer Delivery Updates

```
Build a system that keeps customers informed:
1. When a vehicle enters a zone near the delivery address:
   - Send the customer an SMS: "Your delivery is 15 minutes away"
2. When the vehicle arrives at the address:
   - Send: "Your driver has arrived"
3. When the driver marks delivery complete in Geotab:
   - Send: "Delivery complete. Thank you!"

Use Geotab zones and [Twilio/SMS API] for messages.
```

### Proactive Route Optimization

```
Build an agent that optimizes routes based on traffic:
1. Monitor Google Maps Traffic API for my fleet's common routes
2. When major delays detected:
   - Identify which vehicles are heading toward the problem
   - Calculate alternate routes
   - Send new route to affected drivers
   - Update customer ETAs automatically
3. Log all route changes for reporting
```

### Voice Agent for Fleet Queries

```
Build a voice assistant for fleet managers:
1. Accept voice input: "Where is truck 42?" or "Who's speeding right now?"
2. Query the Geotab API for relevant data
3. Respond with spoken answer

Use [Vapi/OpenAI Whisper] for voice and Geotab API for data.
Start with just location queries, then we'll add more.
```

---

## What to Include in Your Prompts

When asking AI to build your agent, always specify:

| Element | Why It Matters | Example |
|---------|----------------|---------|
| **Trigger** | When should it run? | "Every 5 minutes" or "When a fault code appears" |
| **Data source** | What to monitor | "Geotab vehicle speeds" or "Trip completion events" |
| **Condition** | When to act | "Speed over 75" or "Fault code is critical" |
| **Action** | What to do | "Send Slack message" or "Create Jira ticket" |
| **Destination** | Where alerts go | "#fleet-alerts channel" or "fleet-manager@company.com" |
| **Tool preference** | Platform to use | "Using n8n" or "As a Python script" |

### Good Prompt Example

> "Build an n8n workflow that checks Geotab every 10 minutes for vehicles idling more than 15 minutes. When found, send a Slack message to #operations with the vehicle name, driver, location, and idle duration. Don't alert for the same vehicle twice within an hour."

### Weak Prompt Example

> "Make something that alerts me about idle vehicles."

The good prompt gives clear trigger, condition, action, destination, and edge case handling.

---

## Data Flow Patterns

Your agents can work in multiple directions:

### Geotab → External (Most Common)
Monitor fleet data, act on external systems.
```
Speeding event → Slack alert
Fault code → ServiceNow ticket
Trip complete → Customer notification
```

### External → Geotab (Powerful but Underused)
Monitor external sources, prepare your fleet.
```
Weather forecast → Create hazard zones
Traffic closure → Update routes
New customer order → Assign vehicle
```

### Bidirectional (Full Integration)
```
Order placed → Assign vehicle → Track delivery → Update customer → Mark complete
```

---

## Common Pitfalls to Mention

Tell your AI assistant about these when building:

- **Rate limiting**: "Don't poll more than once per minute"
- **Duplicate alerts**: "Track what's already been sent"
- **Credential security**: "Use environment variables for API keys"
- **Error handling**: "Retry failed API calls 3 times"
- **Alert fatigue**: "Consolidate multiple events into one message"

---

## Getting Started

### Path 1: Visual/No-Code (Recommended)
1. **[n8n Quickstart Guide](./AGENTIC_QUICKSTART_N8N.md)** — Build your first workflow
2. Copy a vibe prompt from above
3. Iterate: start simple, add complexity

### Path 2: AI-Powered Agents
1. Review [Google ADK Documentation](https://google.github.io/adk-docs/)
2. Use the "AI-Powered Safety Coach" prompt above as a starting point
3. Start with one metric, then expand

### Path 3: Simple Scripts
1. Ask AI: "Write a Python script that polls Geotab API every 5 minutes and sends Slack alerts for speeding"
2. Deploy to cron, GitHub Actions, or AWS Lambda

---

## Resources

**Visual Tools:**
- [n8n](https://n8n.io/) — Visual workflow automation with AI
- [Make](https://www.make.com/) — Visual automation platform
- [Zapier](https://zapier.com/) — Simplest automation tool

**AI Agent Frameworks:**
- [Google ADK](https://google.github.io/adk-docs/) — Build AI agents with tools
- [LangGraph](https://langchain-ai.github.io/langgraph/) — Graph-based agent workflows

**Voice:**
- [Vapi](https://vapi.ai/) — Phone and voice AI agents

**Geotab:**
- [Geotab API Reference](https://geotab.github.io/sdk/software/api/reference/)

---

**Ready to build? [Start with the n8n Quickstart →](./AGENTIC_QUICKSTART_N8N.md)**
