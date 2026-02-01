# Agentic Fleet Systems: Overview

**Autonomous agents that monitor your fleet and take action—without you lifting a finger.**

This guide explains what "agentic" means for fleet management, when you need it, and which tools to use.

---

## What is an "Agentic" System?

Traditional fleet tools require you to check dashboards, run reports, and take action manually. An **agentic system** flips this:

| Traditional Approach | Agentic Approach |
|---------------------|------------------|
| You check the dashboard | The system monitors continuously |
| You notice a problem | The system detects it automatically |
| You decide what to do | The system decides (rules or AI) |
| You take action | The system acts (alerts, tickets, API calls) |

### The Agentic Loop

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   MONITOR → DETECT → DECIDE → ACT → (repeat forever)   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

1. **Monitor**: Continuously watch Geotab data (vehicle locations, speeds, fault codes, trips)
2. **Detect**: Identify conditions that matter (speeding, geofence entry, engine fault, idle time)
3. **Decide**: Apply rules or AI reasoning to determine response
4. **Act**: Send alerts, create tickets, update systems, notify people

---

## Geotab Already Has Alerts—When Do You Need More?

**Important:** Geotab's built-in features handle many common scenarios:

| Built-In Feature | What It Does |
|------------------|--------------|
| **Rules & Exceptions** | Trigger on speeding, harsh braking, after-hours use, etc. |
| **Zones (Geofences)** | Detect entry/exit from defined areas |
| **Notifications** | Send email alerts when rules trigger |
| **Reports** | Scheduled email reports |

**Use Geotab native features when:**
- Email alerts are sufficient
- You need standard rule-based triggers (speed > X, zone entry, fault codes)
- You're okay with Geotab's built-in notification destinations

---

## When External Agentic Systems Add Value

Build an external agent when you need capabilities **beyond** Geotab's native features:

### 1. Different Alert Destinations
Geotab sends email. You need **Slack, Teams, Discord, SMS, PagerDuty**, or push notifications.

### 2. Integration with External Systems
- Create tickets in **ServiceNow, Jira, Zendesk**
- Update records in **Salesforce, HubSpot, SAP**
- Log to **Google Sheets, Airtable, databases**
- Trigger webhooks in **custom applications**

### 3. Multi-Step Workflows
Not just "alert when X happens" but:
```
Fault code detected →
  Check vehicle location →
  Find nearest service center →
  Create maintenance ticket →
  Alert driver with directions →
  Notify fleet manager →
  Update CRM status
```

### 4. AI-Powered Decisions
Beyond threshold rules—using LLMs to:
- Analyze patterns and trends
- Generate personalized coaching recommendations
- Summarize incidents in natural language
- Make context-aware decisions

### 5. Cross-System Correlation
Combine Geotab data with external data:
- Weather conditions + driving behavior
- Traffic data + route optimization
- Customer delivery windows + ETA calculations

### 6. Custom Business Logic
Rules that don't fit Geotab's rule builder:
- "Alert only if this is the driver's 3rd speeding event this week"
- "Notify customer when delivery is 15 minutes away, but only during business hours"
- "Escalate to manager if no response within 30 minutes"

---

## Decision Guide

```
Can Geotab's built-in Rules + Email handle it?
├── Yes → Use native Geotab features (simplest!)
└── No → Why not?
    ├── Need Slack/Teams/SMS → Agentic system
    ├── Need external system integration → Agentic system
    ├── Need multi-step workflow → Agentic system
    ├── Need AI reasoning → Agentic system
    └── Need custom logic → Agentic system
```

---

## Real-World Examples

### Simple: Speeding Alert
```
MONITOR: Check vehicle speeds every 5 minutes
DETECT:  Speed > 80 mph
DECIDE:  Alert supervisor
ACT:     Send Slack message with vehicle ID, driver, location
```

### Medium: Maintenance Automation
```
MONITOR: Watch for engine fault codes
DETECT:  Critical fault code appears
DECIDE:  Check if vehicle is near service center
ACT:
  - Create ticket in ServiceNow
  - Alert driver via SMS
  - Notify fleet manager via email
  - Update vehicle status in CRM
```

### Advanced: AI-Powered Safety Coaching
```
MONITOR: Analyze driving patterns over 7 days
DETECT:  Driver's safety score declining
DECIDE:  AI determines personalized coaching needed
ACT:
  - Generate custom training content
  - Schedule coaching session in calendar
  - Send training materials to driver
  - Log intervention in HR system
```

---

## Choosing Your Approach

### Decision Tree

```
Do you need AI reasoning (not just rules)?
├── No → Do you prefer visual/no-code tools?
│   ├── Yes → n8n or Make
│   └── No → Simple Python script + cron
└── Yes → Do you need enterprise features?
    ├── Yes → Google ADK + Vertex AI or Microsoft AutoGen + Azure
    └── No → LangGraph or CrewAI
```

### Framework Comparison

| Approach | Complexity | Best For | Learning Curve | Pricing |
|----------|------------|----------|----------------|---------|
| **Zapier** | Visual | Simplest automations, beginners | Very Low | Free tier, then $20+/mo |
| **Make** | Visual | Complex visual workflows | Low | Free tier, then $9+/mo |
| **n8n** | Visual | Self-hosted, data privacy | Low | Free (self-host) or cloud |
| **Workato** | Visual | Enterprise, compliance | Medium | Enterprise pricing |
| **Cron + Python** | Code | Full control, free | Low | Free |
| **Temporal.io** | Code | Mission-critical, durable | Medium | Free (self-host) |
| **LangGraph** | Code | AI reasoning, complex logic | Medium | Free |
| **Google ADK** | Code | AI agents, Google Cloud | Medium | Pay per use |
| **CrewAI** | Code | Multi-agent collaboration | Medium | Free |
| **AutoGen** | Code | Enterprise, Azure integration | High | Pay per use |

---

## Architecture Patterns

### Pattern 1: Polling Loop (Simplest)

```
┌──────────┐     ┌────────────┐     ┌──────────┐
│  Timer   │────▶│ Fetch Data │────▶│ Check    │
│ (5 min)  │     │ from Geotab│     │ Condition│
└──────────┘     └────────────┘     └────┬─────┘
                                         │
                              ┌──────────▼──────────┐
                              │ Condition met?      │
                              │ Yes → Send Alert    │
                              │ No  → Wait for next │
                              └─────────────────────┘
```

**Pros:** Simple, no infrastructure needed
**Cons:** Delay between event and detection (up to polling interval)

### Pattern 2: Webhook/Event-Driven

```
┌──────────┐     ┌────────────┐     ┌──────────┐
│ Geotab   │────▶│ Webhook    │────▶│ Process  │
│ Event    │     │ Endpoint   │     │ & Act    │
└──────────┘     └────────────┘     └──────────┘
```

**Pros:** Near real-time, efficient
**Cons:** Requires webhook support, always-on endpoint

### Pattern 3: Multi-Agent Orchestration

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Monitor    │────▶│ Analyzer    │────▶│ Actor       │
│ Agent      │     │ Agent (AI)  │     │ Agent       │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      └───────────────────┴───────────────────┘
                    Coordinator
```

**Pros:** Complex reasoning, scalable
**Cons:** More infrastructure, higher cost

---

## Data Flow Directions

Most examples focus on **Geotab → External** (monitoring fleet, alerting elsewhere). But agents can work in multiple directions:

### Direction 1: Geotab → External (Outbound)
**Monitor fleet data, act on external systems.**

```
Geotab speeding event → Slack alert
Geotab fault code → ServiceNow ticket
Geotab trip completion → Customer notification
```

This is the most common pattern—and what the [n8n Quickstart](./AGENTIC_QUICKSTART_N8N.md) teaches.

---

### Direction 2: External → Geotab (Inbound)
**Monitor external sources, act on your fleet.**

```
Weather forecast → Create hazard zones in Geotab
Traffic news → Update routes for drivers
Customer order → Assign vehicle to delivery
Price change → Update fuel stop recommendations
```

**This is powerful but underutilized.** Your agents can proactively prepare your fleet for external events.

---

### Direction 3: Bidirectional
**Full integration loop between systems.**

```
Customer places order in Shopify
  → Agent assigns nearest vehicle in Geotab
  → Geotab tracks delivery progress
  → Agent updates customer with ETA
  → Delivery completes in Geotab
  → Agent marks order delivered in Shopify
```

---

## External Event Monitoring

Your agents can watch the world and act on your fleet proactively.

### Weather Monitoring
```
MONITOR: Weather API (OpenWeather, Tomorrow.io)
DETECT:  Severe weather warning for fleet area
ACT:
  - Create temporary hazard zones in Geotab
  - Alert drivers in affected areas
  - Suggest alternate routes
  - Notify dispatch of potential delays
```

### Traffic & Road Closures
```
MONITOR: Traffic APIs (Google Maps, HERE, Waze)
DETECT:  Road closure or major accident on common routes
ACT:
  - Create avoidance zones in Geotab
  - Re-route affected vehicles
  - Update customer ETAs
  - Log disruption for reporting
```

### News & Events
```
MONITOR: News APIs, event calendars, city feeds
DETECT:  Major event (concert, sports game, parade)
ACT:
  - Create temporary zones around venue
  - Adjust delivery windows for area
  - Alert drivers about parking/traffic
  - Pre-position vehicles outside affected area
```

### Fuel Price Monitoring
```
MONITOR: Fuel price APIs (GasBuddy, OPIS)
DETECT:  Price drop at stations along routes
ACT:
  - Update recommended fuel stops
  - Alert drivers near cheap stations
  - Log savings opportunities
```

### Customer System Integration
```
MONITOR: Your CRM, order system, or scheduling tool
DETECT:  New order, appointment change, cancellation
ACT:
  - Assign/reassign vehicles in Geotab
  - Update driver assignments
  - Adjust routes and schedules
  - Confirm with customer
```

---

## Example: Proactive Weather Agent

Here's a concrete example of an external → Geotab agent:

```python
# weather_zone_agent.py
import requests
from geotab_api import GeotabAPI

def check_weather_and_update_zones():
    # 1. MONITOR: Check weather for fleet operating area
    weather = requests.get(
        "https://api.tomorrow.io/v4/weather/forecast",
        params={"location": "Austin,TX", "apikey": WEATHER_API_KEY}
    ).json()

    # 2. DETECT: Severe weather?
    alerts = [w for w in weather["alerts"] if w["severity"] == "severe"]

    if alerts:
        for alert in alerts:
            # 3. ACT: Create hazard zone in Geotab
            geotab.add("Zone", {
                "name": f"WEATHER HAZARD: {alert['event']}",
                "externalReference": f"weather-{alert['id']}",
                "points": alert["affected_area"],
                "zoneTypes": ["ZoneTypeCustomerId"],  # or appropriate type
                "activeFrom": alert["start"],
                "activeTo": alert["end"]
            })

            # 4. ACT: Alert affected drivers
            vehicles_in_zone = geotab.get("Device", search={
                "fromDate": now,
                "zoneId": zone_id
            })

            for vehicle in vehicles_in_zone:
                send_driver_alert(vehicle, alert)
```

**Schedule this to run every 30 minutes** and your fleet is automatically warned about incoming weather.

---

## Voice Agents

Voice interfaces add a natural interaction layer to fleet management. See [Advanced Integrations](./ADVANCED_INTEGRATIONS.md) for detailed voice implementation patterns.

### Voice Agent Types

| Type | Use Case | Example |
|------|----------|---------|
| **Query Agents** | Answer questions | "Where is truck 42?" → spoken response |
| **Command Agents** | Take actions via voice | "Mark delivery complete" → updates Geotab |
| **Proactive Agents** | Call/alert humans | System calls dispatcher about critical fault |
| **Phone Agents** | Handle inbound calls | Customer calls to check delivery ETA |

### Voice for Fleet Managers

Hands-free fleet queries while in the field:
```
"Hey Fleet, where are my drivers?"
"Which vehicles need maintenance this week?"
"Alert me if anyone speeds over 80"
```

### Voice for Drivers

Safe, hands-free interaction:
```
"What's my next stop?"
"Mark this delivery complete"
"Report a vehicle issue"
```

### Phone-Based Voice Agents

AI agents that make or receive actual phone calls:

**Outbound (Agent calls humans):**
```
Critical fault detected →
  Agent calls dispatcher: "Vehicle 2417 has a critical engine fault
  at mile marker 145 on I-35. Driver has been notified. Should I
  dispatch roadside assistance?"
```

**Inbound (Humans call agent):**
```
Customer calls delivery line →
  Agent answers: "Hi, I can help you track your delivery.
  What's your order number?"
  Customer: "12345"
  Agent: "Your delivery is 15 minutes away. The driver is
  John in a white van. Anything else I can help with?"
```

### Voice Agent Tools

| Tool | Type | Best For |
|------|------|----------|
| **Vapi** | Phone AI | Building phone agents quickly |
| **Bland.ai** | Phone AI | Enterprise phone automation |
| **Twilio + AI** | Phone infrastructure | Custom phone solutions |
| **Retell AI** | Phone AI | Conversational phone agents |
| **OpenAI Whisper** | Speech-to-text | Transcription |
| **ElevenLabs** | Text-to-speech | Natural-sounding voices |
| **Deepgram** | Speech-to-text | Real-time transcription |

### Example: Proactive Alert Call Agent

```python
# critical_fault_caller.py
from vapi import Vapi
from geotab_api import GeotabAPI

def check_faults_and_call():
    # 1. Monitor for critical faults
    faults = geotab.get("FaultData", search={
        "fromDate": fifteen_minutes_ago,
        "severity": "Critical"
    })

    for fault in faults:
        # 2. Check if we already called about this fault
        if already_notified(fault["id"]):
            continue

        # 3. Make phone call to dispatcher
        vapi.calls.create(
            phone_number=DISPATCHER_PHONE,
            assistant_id=FLEET_ALERT_ASSISTANT,
            context={
                "vehicle": fault["device"]["name"],
                "fault_code": fault["code"],
                "description": fault["description"],
                "location": get_vehicle_location(fault["device"]["id"]),
                "driver": get_driver_name(fault["device"]["id"])
            }
        )

        # 4. Mark as notified
        mark_notified(fault["id"])
```

**The assistant handles the conversation:**
- Explains the situation to the dispatcher
- Answers follow-up questions about vehicle/driver
- Can dispatch roadside assistance if requested
- Logs the call outcome

---

## Tool Deep Dives

### n8n (Recommended for Beginners)

[n8n](https://n8n.io/) is a visual workflow automation platform with AI capabilities.

**Why n8n for fleet agents:**
- Visual builder—see your logic as a flowchart
- 500+ built-in integrations (Slack, email, databases, APIs)
- Self-hostable (your data stays yours)
- AI agent support with memory and tools
- Free tier available

**Example workflow:**
```
Geotab API (poll) → Filter (speed > 75) → Slack Message
```

**[Start with the n8n Quickstart Guide →](./AGENTIC_QUICKSTART_N8N.md)**

---

### Zapier (Simplest Entry Point)

[Zapier](https://zapier.com/) is the most beginner-friendly automation tool with 6,000+ app integrations.

**Why Zapier:**
- Easiest to learn—build your first automation in minutes
- Huge library of pre-built integrations
- No self-hosting required
- Good free tier for simple workflows

**Limitations:**
- Can get expensive at scale
- Less flexible than n8n for complex logic
- No self-hosting option (data goes through Zapier)

**Example Zap:**
```
Webhook (receive Geotab data) → Filter → Slack Message
```

**Resources:** [zapier.com](https://zapier.com/)

---

### Make (formerly Integromat)

[Make](https://www.make.com/) offers more visual complexity than Zapier with better pricing.

**Why Make:**
- More powerful than Zapier for complex scenarios
- Visual workflow builder with branching
- Better pricing for high-volume workflows
- Good balance of simplicity and power

**Example scenario:**
```
HTTP Request (poll Geotab) → Router → [Slack, Email, Google Sheets]
```

**Resources:** [make.com](https://www.make.com/)

---

### Workato (Enterprise-Grade)

[Workato](https://www.workato.com/) is designed for enterprise automation with compliance and governance features.

**Why Workato:**
- SOC 2, HIPAA, GDPR compliance built-in
- Enterprise-grade security and audit trails
- IT governance and approval workflows
- Handles complex enterprise integrations (SAP, Salesforce, ServiceNow)

**Best for:** Large organizations with compliance requirements

**Resources:** [workato.com](https://www.workato.com/)

---

### Google ADK (For AI-Powered Agents)

[Google Agent Development Kit](https://google.github.io/adk-docs/) is a code-first framework for building AI agents.

**Why Google ADK:**
- Model-agnostic (works with Gemini, but also other LLMs)
- Multi-agent orchestration built-in
- Deploys to Cloud Run or Vertex AI
- Under 100 lines for basic agents
- Python, Go, and TypeScript support

**Example agent:**
```python
from google.adk import Agent, Tool

fleet_agent = Agent(
    name="safety_monitor",
    model="gemini-2.0-flash",
    tools=[geotab_tool, slack_tool],
    instructions="""
    Monitor fleet safety events. When you detect
    harsh braking or speeding, alert the supervisor
    with context about the driver's recent behavior.
    """
)
```

**Resources:**
- [ADK Documentation](https://google.github.io/adk-docs/)
- [ADK Python GitHub](https://github.com/google/adk-python)
- [Multi-Agent Codelab](https://codelabs.developers.google.com/codelabs/production-ready-ai-with-gc/3-developing-agents/build-a-multi-agent-system-with-adk)

---

### LangGraph (For Complex Workflows)

[LangGraph](https://langchain-ai.github.io/langgraph/) models agent logic as a graph—nodes are steps, edges are transitions.

**Why LangGraph:**
- Precise control over branching and error handling
- Visual debugging of agent execution
- Lowest latency/token usage in benchmarks
- Strong community and documentation

**Example use case:**
```
Detect fault code →
  Is it critical?
    Yes → Check driver location → Route to nearest service → Alert driver
    No → Log for next maintenance review
```

---

### Simple Python + Cron (For Minimalists)

Sometimes you don't need a framework. A Python script running on a schedule does the job.

**Example:**
```python
# run_every_5_minutes.py
import requests
from datetime import datetime, timedelta

# Fetch recent trips from Geotab
trips = geotab_api.get("Trip", search={"fromDate": datetime.now() - timedelta(hours=1)})

# Check for speeding
for trip in trips:
    if trip.get("speedingDuration", 0) > 60:  # More than 60 seconds
        send_slack_alert(f"Vehicle {trip['device']['name']} had speeding event")
```

**Run with cron:**
```bash
*/5 * * * * python /path/to/run_every_5_minutes.py
```

**Hosting options:**
- Cron on any Linux server
- GitHub Actions (free for public repos)
- AWS Lambda + EventBridge
- Google Cloud Run Jobs
- Replit (free tier with limitations)

---

## Integration Points

### Alert Destinations

| Destination | How to Connect |
|-------------|----------------|
| **Slack** | Webhook URL or Slack API |
| **Microsoft Teams** | Incoming Webhook connector |
| **Email** | SMTP, SendGrid, AWS SES |
| **SMS** | Twilio, AWS SNS |
| **Discord** | Webhook URL |
| **PagerDuty** | Events API |

### External Systems

| System | Integration Pattern |
|--------|---------------------|
| **ServiceNow** | REST API for ticket creation |
| **Salesforce** | REST API or MuleSoft |
| **SAP** | RFC or REST APIs |
| **Google Sheets** | Sheets API (for logging) |
| **Databases** | Direct connection (Postgres, MySQL) |
| **Custom Apps** | Webhooks or REST APIs |

---

## Getting Started

### Path 1: Visual/No-Code (Recommended for beginners)

1. **[n8n Quickstart Guide](./AGENTIC_QUICKSTART_N8N.md)** — Build your first monitoring workflow
2. Start with a simple use case (speeding → Slack)
3. Gradually add complexity (multiple conditions, more integrations)

### Path 2: Code-First with AI

1. Review [Google ADK Documentation](https://google.github.io/adk-docs/get-started/)
2. Start with the [Multi-Agent Codelab](https://codelabs.developers.google.com/codelabs/production-ready-ai-with-gc/3-developing-agents/build-a-multi-agent-system-with-adk)
3. Build a simple agent that monitors one metric

### Path 3: Simple Scripts

1. Write a Python script that polls Geotab API
2. Add condition checking and alerting
3. Deploy to cron, GitHub Actions, or serverless

---

## Common Pitfalls

### Rate Limiting
Don't poll Geotab API every second. Use reasonable intervals (5-15 minutes for most use cases).

### Alert Fatigue
Too many alerts = ignored alerts. Set meaningful thresholds and consolidate notifications.

### Credential Security
Never hardcode API keys. Use environment variables or secrets management.

### Error Handling
Networks fail. APIs timeout. Build retry logic and graceful degradation.

### State Management
Track what you've already processed to avoid duplicate alerts.

---

## Next Steps

| Your Goal | Start Here |
|-----------|------------|
| Build first agent (visual) | [n8n Quickstart](./AGENTIC_QUICKSTART_N8N.md) |
| Understand Geotab API | [API Reference](./GEOTAB_API_REFERENCE.md) |
| Build AI-powered agents | [Google ADK Docs](https://google.github.io/adk-docs/) |
| Integrate with Slack/Teams | [Advanced Integrations](./ADVANCED_INTEGRATIONS.md) |
| Hackathon project ideas | [Hackathon Ideas](./HACKATHON_IDEAS.md) |

---

## Resources

**Frameworks:**
- [n8n - AI Workflow Automation](https://n8n.io/ai-agents/)
- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [CrewAI Documentation](https://docs.crewai.com/)
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)

**Comparisons:**
- [AI Agent Frameworks Comparison (DataCamp)](https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen)
- [Framework Comparison (Langfuse)](https://langfuse.com/blog/2025-03-19-ai-agent-comparison)
- [Top AI Agent Frameworks (Turing)](https://www.turing.com/resources/ai-agent-frameworks)

**Geotab:**
- [Geotab API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Geotab SDK Guides](https://geotab.github.io/sdk/software/guides/)

---

**Ready to build? [Start with the n8n Quickstart →](./AGENTIC_QUICKSTART_N8N.md)**
