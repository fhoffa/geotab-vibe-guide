# Geotab Vibe Coding Hackathon - Project Ideas

## How to Use This Guide
- Each idea includes: concept, key APIs to use, difficulty level, and vibe prompts to get started
- Mix and match features from different ideas
- Use AI to scaffold the project quickly
- Focus on one core feature first, then expand

---

## 🌱 Category 1: Fleet Optimization

### Idea 1.1: EcoFleet Carbon Tracker
**Concept:** Calculate and visualize your fleet's carbon footprint, with recommendations to reduce emissions.

**Key Features:**
- Fetch trip data and calculate fuel consumption
- Convert to CO2 emissions (by fuel type)
- Compare against industry benchmarks
- Suggest eco-driving practices
- Track improvement over time

**APIs to Use:**
- `Get.Trip` - retrieve all trips
- `Get.StatusData` - fuel level changes
- `Get.Device` - vehicle types and fuel types
- Geotab Ace - get optimization suggestions

**Difficulty:** ⭐⭐ Beginner-Intermediate

**Vibe Prompts to Start:**
```
"Create a Python script that fetches all trips from the last 30 days from Geotab API,
calculates total distance and fuel consumption, and estimates CO2 emissions based on
fuel type (diesel vs gasoline). Display results in a simple table."

"Build a web dashboard that shows fleet carbon footprint over time with a line chart.
Use Chart.js for visualization and Geotab API for trip data."

"Add a feature that compares my fleet's emissions to industry average and suggests
ways to reduce carbon footprint using Geotab Ace API."
```

**Bonus Features:**
- Leaderboard: greenest drivers
- Route-specific emissions tracking
- EV conversion ROI calculator
- Gamification: carbon reduction challenges

---

### Idea 1.2: RouteGenius Optimizer
**Concept:** Analyze historical route data and suggest optimizations for time, fuel, and efficiency.

**Key Features:**
- Visualize all routes on a map
- Identify inefficient routes (long idle times, detours)
- Suggest optimal stop order for deliveries
- Compare planned vs. actual routes
- Real-time traffic integration

**APIs to Use:**
- `Get.Trip` - route history
- `Get.LogRecord` - GPS breadcrumbs
- `Get.Zone` - delivery locations
- Geotab Ace - route optimization suggestions
- External: Google Maps API, Mapbox

**Difficulty:** ⭐⭐⭐ Intermediate-Advanced

**Vibe Prompts:**
```
"Create a map visualization showing all delivery routes from the past week using Geotab
GPS data and Leaflet.js. Color-code routes by efficiency (green = optimal, red = poor)."

"Build a route optimizer that takes a list of delivery addresses and uses historical
Geotab data to suggest the optimal visiting order to minimize drive time."

"Integrate with Geotab Ace to analyze idle time on routes and suggest where drivers
can reduce stops or take better paths."
```

---

### Idea 1.3: IdleKiller Challenge
**Concept:** Gamified idle time reduction platform with driver challenges and leaderboards.

**Key Features:**
- Track idle time per driver and vehicle
- Set team and individual goals
- Leaderboard with rewards
- Push notifications for excessive idling
- Weekly/monthly reports

**APIs to Use:**
- `Get.StatusData` - engine status and idle time
- `Get.Trip` - trip-specific idle time
- `Get.User` / `Get.Driver` - driver information
- Geotab Ace - idle reduction recommendations

**Difficulty:** ⭐⭐ Beginner-Intermediate

**Vibe Prompts:**
```
"Create a CLI tool that fetches idle time data for all drivers from Geotab API and
displays a leaderboard of who has the lowest idle time percentage."

"Build a web app with driver profiles showing their idle time over the past month
with a progress bar toward their reduction goal."

"Add Slack notifications that alert drivers when they exceed their daily idle time
threshold, with tips from Geotab Ace on how to improve."
```

---

## 🛡️ Category 2: Safety & Compliance

### Idea 2.1: SafeDrive Coach
**Concept:** Driver safety scoring system with coaching tips and gamification.

**Key Features:**
- Calculate safety scores (speeding, harsh braking, acceleration)
- Individual driver profiles and trends
- AI coaching tips from Ace
- Certification and badge system
- Safety incident alerts

**APIs to Use:**
- `Get.Trip` - trip safety metrics
- `Get.ExceptionEvent` - speeding, harsh braking events
- `Get.Driver` - driver information
- Geotab Ace - personalized coaching recommendations

**Difficulty:** ⭐⭐ Beginner-Intermediate

**Vibe Prompts:**
```
"Create a driver safety scorecard that fetches exception events from Geotab API
(speeding, harsh braking) and calculates a score out of 100 for each driver."

"Build a web dashboard showing driver safety trends over time with charts for each
safety metric (speed, braking, acceleration, cornering)."

"Integrate Geotab Ace to provide personalized safety coaching tips for each driver
based on their specific behaviors."
```

**Bonus Features:**
- Compare against fleet average
- Safety challenges and rewards
- Predictive accident risk scoring
- Manager coaching tools

---

### Idea 2.2: PredictMaint AI
**Concept:** Predictive maintenance system that alerts before breakdowns happen.

**Key Features:**
- Monitor engine fault codes
- Track maintenance history
- Predict upcoming maintenance needs
- Automated alert system
- Cost estimation for repairs

**APIs to Use:**
- `Get.FaultData` - engine diagnostic codes
- `Get.DVIRLog` - driver vehicle inspection reports
- `Get.Device` - vehicle specs and age
- Geotab Ace - predictive maintenance insights

**Difficulty:** ⭐⭐⭐ Intermediate-Advanced

**Vibe Prompts:**
```
"Create a maintenance dashboard that fetches all active fault codes from Geotab API
and displays them with severity levels (critical, warning, info)."

"Build a predictive maintenance system that uses Geotab Ace API to forecast which
vehicles will need service in the next 30 days based on diagnostics and usage patterns."

"Add automated email alerts when a critical fault code is detected or maintenance is
predicted, with details on what needs to be checked."
```

---

### Idea 2.3: ComplianceGuard
**Concept:** Hours of Service (HOS) and regulatory compliance tracker.

**Key Features:**
- Track driver hours automatically
- HOS violation alerts
- DVIR compliance monitoring
- Automated reporting for regulators
- Document management

**APIs to Use:**
- `Get.Trip` - driving hours
- `Get.Driver` - driver info and HOS rules
- `Get.DVIRLog` - inspection reports
- `Get.ShipmentLog` - load tracking

**Difficulty:** ⭐⭐⭐ Intermediate (requires HOS knowledge)

**Vibe Prompts:**
```
"Create a HOS compliance tracker that calculates total driving hours per driver per
day from Geotab trip data and alerts if they're approaching HOS limits."

"Build a DVIR compliance dashboard showing which vehicles have completed required
inspections and which are overdue."
```

---

## 🌍 Category 3: Environmental Impact

### Idea 3.1: Fleet Electrification Planner
**Concept:** Analyze fleet data to determine ROI for switching vehicles to electric.

**Key Features:**
- Analyze routes and daily mileage
- Calculate fuel costs vs. electricity costs
- Identify best candidates for EV replacement
- ROI calculator with payback period
- Charging infrastructure recommendations

**APIs to Use:**
- `Get.Trip` - daily mileage patterns
- `Get.StatusData` - fuel consumption
- `Get.Device` - vehicle specifications
- Geotab Ace - EV suitability analysis

**Difficulty:** ⭐⭐⭐ Intermediate-Advanced

**Vibe Prompts:**
```
"Build a tool that analyzes Geotab trip data to identify which vehicles in my fleet
have daily ranges under 200 miles and would be good candidates for electric vehicles."

"Create an ROI calculator that compares current fuel costs to projected electricity
costs for EV replacements, including purchase price, incentives, and maintenance savings."

"Use Geotab Ace to recommend optimal locations for EV charging stations based on
vehicle routes and depot locations."
```

---

### Idea 3.2: EcoDrive Challenge
**Concept:** Gamified eco-driving competition with real-time feedback and rewards.

**Key Features:**
- Eco-driving scores (smooth acceleration, optimal speed)
- Team and individual competitions
- Real-time feedback (if using Geotab GO device)
- Leaderboards and badges
- Carbon savings tracker

**APIs to Use:**
- `Get.Trip` - driving behavior metrics
- `Get.StatusData` - real-time driving data
- `Get.Driver` - driver information
- Geotab Ace - eco-driving tips

**Difficulty:** ⭐⭐ Intermediate

**Vibe Prompts:**
```
"Create an eco-driving scoring system that analyzes Geotab trip data for factors like
smooth acceleration, optimal speed, and minimal idling. Display scores in a web dashboard."

"Build a leaderboard showing the top eco-drivers of the month with their carbon savings
and fuel efficiency improvements."
```

---

## 🔧 Category 4: Integration & Automation

### Idea 4.1: FleetBot for Slack/Teams
**Concept:** Conversational bot that brings fleet insights into team communication tools.

**Key Features:**
- Natural language queries: "Where is truck 42?"
- Automated daily reports
- Alert notifications
- On-demand reports: "Trips over 100 miles today"
- Driver communication

**APIs to Use:**
- Geotab my.geotab.com API - all data queries
- Geotab Ace API - natural language understanding
- Slack/Teams API - messaging
- Optional: Twilio for SMS

**Difficulty:** ⭐⭐⭐ Intermediate

**Vibe Prompts:**
```
"Create a Slack bot that responds to commands like '/geotab where is [vehicle name]'
by fetching the latest GPS location from Geotab API and returning it with a map link."

"Build a chatbot that uses Geotab Ace API to answer natural language questions about
the fleet, like 'Which drivers worked overtime yesterday?' or 'How much fuel did we use
this week?'"

"Add automated daily reports that post to a Slack channel every morning with key metrics:
vehicles active, total miles driven, safety events, fuel consumption."
```

---

### Idea 4.2: GeotabFlow Automation
**Concept:** No-code/low-code automation platform for Geotab data (like Zapier for fleets).

**Key Features:**
- Trigger → Action workflows
- Examples: "If vehicle enters geofence → send email"
- Integration with 100+ apps
- Visual workflow builder
- Scheduled tasks and reports

**APIs to Use:**
- Geotab API - all entities
- Webhooks (if available)
- External: Zapier API, Integromat
- Email/SMS APIs

**Difficulty:** ⭐⭐⭐⭐ Advanced

**Vibe Prompts:**
```
"Design a workflow engine that polls Geotab API every minute for new trips, and when
a trip ends, automatically logs it to a Google Sheet with trip details."

"Create a rule-based alert system: if a vehicle enters a specific Zone (geofence),
send an SMS notification using Twilio."

"Build a visual workflow builder (drag-and-drop) where users can create automation
rules without coding."
```

---

### Idea 4.3: DataSync Pro
**Concept:** Sync Geotab data to external databases/data warehouses for advanced analytics.

**Key Features:**
- Incremental data sync
- Support for multiple destinations (PostgreSQL, BigQuery, Snowflake)
- Configurable sync schedules
- Data transformation pipelines
- Error handling and retry logic

**APIs to Use:**
- Geotab API - all entities
- Database connectors
- Data warehouses APIs

**Difficulty:** ⭐⭐⭐⭐ Advanced

**Vibe Prompts:**
```
"Create a Python script that syncs all new trips from Geotab API to a PostgreSQL
database every hour, tracking the last sync timestamp to avoid duplicates."

"Build an ETL pipeline that fetches Geotab data, transforms it into a star schema
(fact and dimension tables), and loads it into Google BigQuery."
```

---

## 🛠️ Category 5: Developer Tools & Extensions

### Idea 5.1: Geotab API Explorer
**Concept:** Interactive playground for exploring Geotab API without writing code.

**Key Features:**
- Visual API call builder
- Real-time response preview
- Code generator (Python, JavaScript, cURL)
- Save and share queries
- API documentation inline

**APIs to Use:**
- Geotab API (all methods)
- Optional: Geotab SDK documentation

**Difficulty:** ⭐⭐⭐ Intermediate

**Vibe Prompts:**
```
"Build a web-based API explorer where users can select a Geotab API method from a
dropdown, fill in parameters in a form, and see the JSON response."

"Add a code generator that shows how to make the same API call in Python, JavaScript,
and cURL based on the user's selected method and parameters."

"Create a query library where users can save and name their favorite API calls for
quick reuse."
```

---

### Idea 5.2: GeotabSDK for [Your Language]
**Concept:** Build an SDK or wrapper library for a language that doesn't have one yet.

**Languages to Consider:**
- Go
- Rust
- Ruby
- PHP
- Swift
- Kotlin

**Key Features:**
- Clean, idiomatic API
- Authentication handling
- Type safety
- Error handling
- Comprehensive documentation
- Unit tests

**Difficulty:** ⭐⭐⭐⭐ Advanced

**Vibe Prompts:**
```
"Create a Go SDK for Geotab API with methods for authentication and fetching devices,
trips, and GPS data. Use idiomatic Go patterns with proper error handling."

"Build a Rust wrapper for Geotab API with strong typing using structs for all API
entities (Device, Trip, etc.) and async/await for API calls."

"Write comprehensive documentation and usage examples for the SDK."
```

---

### Idea 5.3: MyGeotab Custom Add-In
**Concept:** Build a custom add-in that extends the MyGeotab interface.

**Key Features:**
- Embedded in MyGeotab UI
- Access to Geotab API from frontend
- Custom dashboards and reports
- Interactive visualizations
- Export capabilities

**APIs to Use:**
- Geotab JavaScript API
- MyGeotab Add-In SDK

**Difficulty:** ⭐⭐⭐ Intermediate-Advanced

**Vibe Prompts:**
```
"Create a MyGeotab add-in that displays a custom dashboard with vehicle health scores,
recent trips, and safety metrics using the Geotab JavaScript API."

"Build an add-in that adds a new 'Eco Report' page to MyGeotab showing carbon footprint
and fuel efficiency trends with interactive charts."
```

**Resources:**
- [MyGeotab SDK - Add-Ins](https://geotab.github.io/sdk/software/guides/developing-addins/)

---

## 🎯 Quick-Win Ideas (4-6 hours)

### Mini Idea 1: Trip Heatmap
Generate a heatmap showing where your fleet spends the most time.
**Prompt:** "Create a web map using Leaflet.js and heatmap.js that visualizes GPS density from Geotab LogRecords."

### Mini Idea 2: Fuel Price Alert
Alert when nearby fuel prices drop below a threshold.
**Prompt:** "Build a tool that checks fuel prices near vehicle locations using GasBuddy API and sends alerts via email."

### Mini Idea 3: Driver Scoreboard
Simple driver performance leaderboard.
**Prompt:** "Create a web page with a sortable table of drivers ranked by safety score, miles driven, and fuel efficiency from Geotab API."

### Mini Idea 4: Maintenance Calendar
Visual calendar showing upcoming maintenance.
**Prompt:** "Build a calendar view using FullCalendar.js that displays scheduled maintenance and predicted maintenance dates from Geotab."

### Mini Idea 5: Geofence Manager
Simple UI to create and manage geofences.
**Prompt:** "Create a map interface where users can draw geofences (polygons) and save them to Geotab using the Zone API."

---

## 🤖 Category: Next-Generation AI Integrations

### Idea 8.1: FleetVoice - Voice Assistant for Fleet Managers
**Concept:** Hands-free fleet management through voice commands, perfect for managers on the move.

**Key Features:**
- Voice queries: "How many vehicles are en route?" → spoken response
- Voice commands: "Alert me if any vehicle speeds over 80 mph"
- Location queries: "Where is vehicle 2417?"
- Multi-modal: Voice in, visual map out
- Fleet broadcast: Voice message to all drivers in a zone

**APIs to Use:**
- Geotab API (Device, Trip, LogRecord)
- Geotab Ace API (natural language processing)
- OpenAI Whisper or Google Speech-to-Text (voice input)
- ElevenLabs or Google TTS (voice output)
- Twilio (optional: phone integration)

**Difficulty:** ⭐⭐⭐ Intermediate-Advanced

**Vibe Prompts to Start:**
```
"Build a web app that accepts microphone input, transcribes it using OpenAI Whisper,
processes the query through Geotab Ace API, and speaks the response using
ElevenLabs text-to-speech."

"Create a voice command handler that recognizes patterns like 'where is vehicle [ID]'
and responds with location data from Geotab API in natural language."

"Build an Alexa Skill that queries Geotab fleet data and returns spoken responses
about vehicle status, driver locations, and fleet KPIs."
```

**Bonus Features:**
- Wake word detection ("Hey Fleet Manager...")
- Multi-language support
- Voice authentication for security
- Integration with car's voice system
- Voice-activated geofence creation

---

### Idea 8.2: FleetClips - AI-Generated Video Reports
**Concept:** Automatically generate professional video reports from fleet data - weekly summaries, safety highlights, driver recognition.

**Key Features:**
- Animated KPI dashboards (fuel efficiency, miles driven, safety scores)
- Map route visualizations with time-lapse vehicle movements
- AI avatar presenting weekly fleet summary
- Driver recognition videos ("Driver of the Week")
- Incident reconstruction videos with telemetry overlay
- Branded videos for customer reporting

**APIs to Use:**
- Geotab API (Trip, LogRecord, Device, StatusData)
- Geotab Ace API (generate narrative summaries)
- D-ID or Synthesia (AI avatar video)
- Remotion or Shotstack (programmatic video generation)
- Mapbox or Google Maps (map visualizations)
- OpenAI GPT or Claude (script writing)

**Difficulty:** ⭐⭐⭐⭐ Advanced

**Vibe Prompts to Start:**
```
"Create a Python script that fetches last week's fleet data from Geotab,
generates a narrative summary using Claude API, and creates an animated
bar chart video showing top 5 performing vehicles using matplotlib and ffmpeg."

"Build a web app that uses Remotion to generate a 30-second video showing
a map with vehicle routes animated over time, with overlaid statistics."

"Use D-ID API to create a video of an AI avatar presenting this week's
fleet performance summary. Script should be generated from Geotab data
using GPT-4."
```

**Bonus Features:**
- Scheduled automatic generation (every Monday morning)
- Custom branding and themes
- Export to YouTube, Vimeo, or email
- Interactive videos (clickable regions)
- Multi-language narration

---

### Idea 8.3: Fleet MCP Server - Conversational Fleet Control
**Concept:** Build a Model Context Protocol (MCP) server that lets AI assistants interact with Geotab fleets conversationally, with write-back capabilities.

> **Start here:** [MCP Server Guide](./CUSTOM_MCP_GUIDE.md)
>
> [![Geotab Ace MCP Demo](https://img.youtube.com/vi/-eID1rXS1p8/mqdefault.jpg)](https://www.youtube.com/watch?v=-eID1rXS1p8)

**Why Build Your Own MCP?**
- Official Geotab MCP is coming, but you can start today
- Custom MCP can include features official won't have
- Great way to learn MCP architecture
- Tailored to your specific workflow needs

**Key Features:**
- Natural language queries processed without writing code
- Multi-account fleet access in single conversations
- **Write operations**: Create groups, rules, zones via conversation
- Intelligent caching for large datasets (DuckDB integration)
- Asynchronous processing for complex analytics
- Privacy-preserving (automatic driver name redaction)

**APIs to Use:**
- Geotab API (all methods: Get, Add, Set, Remove)
- Geotab Ace API (natural language processing)
- Model Context Protocol (MCP) specification
- DuckDB (data caching and SQL queries)

**Difficulty:** ⭐⭐⭐⭐ Advanced

**Prerequisites:**
- Python 3.10+
- uv package manager
- Claude Desktop
- Familiarity with async Python

**Vibe Prompts to Start:**
```
"Fork the geotab-ace-mcp-demo repository and add write capabilities:
users should be able to say 'create a group called High Performers with
these vehicle IDs' and it creates the group via Geotab API."

"Extend the MCP server to support rule creation through conversation:
'Alert me when vehicle 123 exceeds 70 mph' should create a Geotab rule
with appropriate conditions and actions."

"Build an MCP server tool that automatically creates geofences based on
common stop locations: 'Find all locations where vehicles stop for more
than 30 minutes and create zones around them'."

"Add a Slack integration tool to the MCP server that posts fleet alerts
to a channel when Claude detects anomalies in the data."
```

**Bonus Features:**
- Multi-step workflows ("Create a group, then assign these rules to it")
- Approval flow for write operations (preview before commit)
- Audit logging of all changes made via AI
- Integration with Slack, Discord, or MS Teams
- Rollback capability ("undo my last change")
- Voice integration (combine with FleetVoice idea)

**Resources:**
- [geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo)
- [MCP Server Guide](./CUSTOM_MCP_GUIDE.md)
- [MCP Specification](https://modelcontextprotocol.io/)

---

### Idea 8.4: DriverAssist Voice - Hands-Free Driver Interface
**Concept:** Voice assistant specifically for drivers - hands-free navigation, status updates, safety coaching.

**Key Features:**
- Voice-guided DVIR (Driver Vehicle Inspection Report)
- Delivery confirmation: "Mark current stop as complete"
- Navigation updates: "What's my next stop?"
- Safety alerts: Spoken warnings about harsh braking patterns
- Break reminders: "You've been driving for 5 hours, take a break"
- Two-way messaging with dispatch

**APIs to Use:**
- Geotab API (Trip, LogRecord, StatusData, Driver)
- Speech-to-Text (Whisper, Google, Deepgram)
- Text-to-Speech (ElevenLabs, Google TTS)
- Routing API (Google Maps, Mapbox)

**Difficulty:** ⭐⭐⭐ Intermediate-Advanced

**Vibe Prompts to Start:**
```
"Build a mobile web app that listens for 'Hey Driver' wake word, then
processes commands like 'mark delivery complete' or 'what's my next stop'
using Geotab API and responds with voice."

"Create a voice-guided pre-trip inspection system that asks drivers
questions about vehicle condition and logs DVIR to Geotab API."

"Build a system that monitors driver hours via Geotab and proactively
reminds drivers about break requirements using voice alerts."
```

**Bonus Features:**
- Offline capability for areas without coverage
- Noise cancellation for loud environments
- Integration with vehicle speakers
- Emergency "panic button" voice command
- Driver authentication via voice biometrics

**Safety Note:** Ensure compliance with distracted driving laws - keep interactions brief and minimize cognitive load while vehicle is in motion.

---

### Idea 8.5: FleetNarrator - AI Report Writer
**Concept:** Transform raw fleet data into executive-ready narrative reports automatically.

**Key Features:**
- Weekly executive summaries: Top insights from fleet data
- Incident reports: Formal writeups with telemetry context
- Compliance documentation: Auto-generate regulatory reports
- Maintenance recommendations: Analyze diagnostics and suggest priorities
- Performance reviews: Driver and vehicle performance narratives
- Customer reports: Branded delivery performance summaries

**APIs to Use:**
- Geotab API (all data types)
- Geotab Ace API (insights and recommendations)
- OpenAI GPT-4 or Claude (narrative generation)
- PDF generation (ReportLab, wkhtmltopdf)
- Email delivery (SendGrid, AWS SES)

**Difficulty:** ⭐⭐⭐ Intermediate-Advanced

**Vibe Prompts to Start:**
```
"Create a Python script that fetches this week's fleet data, identifies
top 3 efficiency wins and 2 problem areas, and uses GPT-4 to write a
300-word executive summary. Export as PDF."

"Build a report generator that analyzes harsh braking incidents,
retrieves telemetry context, and writes formal incident reports
with recommendations using Claude API."

"Create a system that generates personalized driver performance reviews
by analyzing trip data, safety events, and fuel efficiency, then
compiling a narrative review document."
```

**Bonus Features:**
- Scheduled automatic generation and email delivery
- Customizable report templates
- Multi-language support
- Integration with BI tools (Tableau, Power BI)
- Natural language queries: "Generate a report about last month's fuel costs"

---

### Idea 8.6: PredictIQ - ML-Powered Predictive Maintenance
**Concept:** Use machine learning to predict vehicle failures before they happen, not just threshold alerts.

**Key Features:**
- Analyze historical diagnostic codes to predict breakdowns
- Battery health scoring for EVs (voltage, temp, usage patterns)
- Optimal service scheduling based on usage patterns
- Parts inventory predictions (what will be needed when)
- Failure probability dashboards per vehicle
- Proactive maintenance alerts with confidence scores

**APIs to Use:**
- Geotab API (StatusData, FaultData, Device, Trip)
- Geotab Ace API (anomaly detection)
- scikit-learn or TensorFlow (ML models)
- Pandas (data processing)
- Plotly or Streamlit (visualization)

**Difficulty:** ⭐⭐⭐⭐ Advanced (requires ML knowledge)

**Vibe Prompts to Start:**
```
"Create a Python script that fetches 6 months of diagnostic fault codes
from Geotab, builds a training dataset, and trains a Random Forest model
to predict engine failures within next 2 weeks."

"Build a battery health prediction system for EVs that analyzes voltage,
temperature, and usage patterns from Geotab StatusData and outputs a
health score (0-100) for each vehicle."

"Create a web dashboard that shows predicted failure probabilities for
each vehicle with explanations of which diagnostic patterns contributed
to the prediction."
```

**Bonus Features:**
- Continuous learning: Models improve over time
- Explainable AI: Why did the model predict this?
- Cost-benefit analysis: Predicted savings from early intervention
- Integration with maintenance scheduling systems
- Alert fatigue reduction: Only high-confidence predictions

---

### Idea 8.7: GeofenceGPT - Natural Language Geofence Creation
**Concept:** Create and manage geofences using plain English instead of drawing on maps.

**Key Features:**
- "Create a 500-meter zone around all customer sites"
- "Make a zone covering downtown Seattle"
- "Find all places where vehicles idle for 10+ minutes and create zones"
- Auto-name zones based on location (address lookup)
- Bulk geofence operations
- Smart zone suggestions based on usage patterns

**APIs to Use:**
- Geotab API (Zone, LogRecord, Trip)
- Geotab Ace API (natural language parsing)
- Geocoding API (Google Maps, Mapbox)
- OpenAI GPT or Claude (command parsing)
- Polygon generation libraries

**Difficulty:** ⭐⭐⭐ Intermediate-Advanced

**Vibe Prompts to Start:**
```
"Build a web app where users type 'create a zone around 123 Main St with
500m radius' and it geocodes the address, generates a circular polygon,
and saves it to Geotab via the Zone API."

"Create a tool that analyzes where vehicles stop frequently (>30 mins)
and automatically suggests geofence locations with proposed names based
on nearby addresses."

"Build a natural language processor that handles commands like 'make a
zone covering these 5 cities: [list]' and generates appropriate polygons
for each city boundary."
```

**Bonus Features:**
- Voice input for geofence creation
- Automatic zone naming using reverse geocoding
- Zone templates: "Create school zones around all schools in [city]"
- Batch operations: Create 50 customer zones from CSV
- Smart zone merging: Combine overlapping zones

---

## 🏆 Judging Tips

**What Judges Look For:**
1. **Working Demo** - Does it actually work?
2. **Problem-Solution Fit** - Does it solve a real fleet management problem?
3. **Use of Both APIs** - Integration of my.geotab.com + Ace
4. **User Experience** - Is it intuitive and polished?
5. **Innovation** - Unique approach or creative feature
6. **Vibe Factor** - Effective use of AI-assisted development

**Demo Tips:**
- Start with the problem statement
- Show live demo with real data
- Highlight 2-3 key features (not everything)
- Explain technical choices briefly
- Share what you'd build next
- Keep it under 5 minutes

**Common Pitfalls:**
- ❌ Spending too much time on UI polish
- ❌ Over-engineering with unnecessary features
- ❌ No working demo (just slides)
- ❌ Not using demo data effectively
- ❌ Ignoring one of the APIs

**Success Strategies:**
- ✅ Pick one problem, solve it well
- ✅ Use AI to scaffold quickly, then customize
- ✅ Test with real Geotab demo data
- ✅ Have a backup plan if live demo fails
- ✅ Show your personality and passion

---

## 🔌 MCP Power-Ups: Beyond Official MCP

**Build capabilities the official Geotab MCP won't have.** The official MCP endpoint will have API + Ace access, but runs in the cloud. Your custom MCP runs locally with unique advantages.

### Current State

| MCP Option | What It Has | What It Lacks |
|------------|-------------|---------------|
| **Official (coming)** | API + Ace, read/write, cloud-hosted | Local processing, custom tools/skills |
| **Felipe's demo** | Ace queries, DuckDB caching | Direct API calls (you can add!) |
| **Your hackathon project** | Whatever you build! | Nothing - sky's the limit |

### Unique Capabilities to Build

| Capability | Why Build It | Hackathon Project |
|------------|--------------|-------------------|
| **Direct API + Ace** | Felipe's demo is Ace-only | Add direct API calls for real-time data |
| **DuckDB Local Caching** | Official = cloud-only | Cache datasets locally, run SQL offline |
| **Custom Skills/Tools** | Build specialized methods | Fuel theft detection, parking optimization, carbon tracking |
| **MCP Composability** | Combine multiple MCP servers | Geotab + Google Maps + Slack working together |
| **Custom Frameworks** | Your analysis patterns | Safety scoring algorithms, route optimization |
| **Offline Mode** | Query cached data without internet | Field workers with spotty connectivity |

### MCP Composability

**Multiple MCP servers can work together** in the same conversation:

```
You: "Find my 5 vehicles with most idle time last week,
      then find the nearest charging stations to their usual locations,
      and post a summary to Slack."

Claude uses:
  → Geotab MCP: Query idle time data
  → Google Maps MCP: Find charging stations
  → Slack MCP: Post the summary
```

**Hackathon idea:** Build a Geotab MCP that's designed to work alongside other MCPs. Expose clean tools that compose well.

### Example: Add Direct API to Felipe's Demo

```
"Fork geotab-ace-mcp-demo and add direct API tools alongside Ace:
- geotab_get_vehicle_location(vehicle_id) → real-time position (<1s)
- geotab_get_trips(vehicle_id, date) → trip list
- geotab_create_zone(name, lat, lon, radius) → write operation

Keep Ace for complex questions, use direct API for real-time + writes."
```

### Example: Multi-MCP Workflow

```
"Build a fleet operations assistant that combines:
1. Geotab MCP for fleet data
2. Weather API MCP for conditions
3. Calendar MCP for scheduling

Enable queries like: 'Which vehicles are near areas with
severe weather warnings? Reschedule their deliveries.'"
```

### Why This Matters

- Official MCP: Great for standard queries, but one-size-fits-all
- Your MCP: Local processing, custom tools, works with other MCPs
- Composability: The whole is greater than the sum of parts

> **Guide:** [CUSTOM_MCP_GUIDE.md](./CUSTOM_MCP_GUIDE.md) | **Skill:** [geotab-custom-mcp](../skills/geotab-custom-mcp/SKILL.md)

---

## 🧠 Build Reusable Skills

**Create AI skills others can use.** Skills are packaged knowledge that any AI assistant can leverage. Building a skill is a great hackathon project because it's reusable and demonstrates deep understanding.

### What is a Skill?

A skill is a structured document (SKILL.md) that teaches AI assistants how to accomplish specific tasks. See [skills/](../skills/) for examples.

### High-Value Skills to Build

| Skill | Why It's Needed | Difficulty |
|-------|-----------------|------------|
| **geotab-trip-analysis** | Most common use case, no skill exists yet | ⭐⭐ |
| **geotab-safety-scoring** | Critical for fleet safety, complex calculations | ⭐⭐⭐ |
| **geotab-fuel-theft-detection** | Real money savings, pattern detection | ⭐⭐⭐ |
| **geotab-parking-optimization** | Find best spots from historical data | ⭐⭐⭐ |
| **geotab-predictive-maintenance** | High value, requires ML patterns | ⭐⭐⭐⭐ |
| **geotab-carbon-tracking** | Growing demand, ESG reporting | ⭐⭐ |
| **geotab-driver-coaching** | Combines safety + communication | ⭐⭐⭐ |

### Specialized Skill Ideas

**Fuel Theft Detection:**
```
"Create a skill that detects fuel theft by analyzing:
- Sudden fuel level drops without corresponding distance
- Fuel transactions that don't match vehicle location
- Unusual refueling patterns (time, location, amount)
- Comparison against expected consumption rates"
```

**Parking Spot Optimization:**
```
"Create a skill that finds optimal parking from historical data:
- Analyze where vehicles commonly stop and for how long
- Identify patterns by time of day, day of week
- Score locations by availability, safety, proximity to destinations
- Recommend best parking spots for delivery routes"
```

### Skill Building Prompt

```
"Create a SKILL.md file for [skill name] that teaches AI assistants how to:
- [specific capability 1]
- [specific capability 2]

Include code patterns, common mistakes to avoid, and example use cases.
Follow the format in skills/geotab-api-quickstart/SKILL.md"
```

### Why Judges Love Skill Projects

- **Reusable:** Your work helps everyone, not just your project
- **Deep expertise:** Shows you truly understand the domain
- **Documentation:** Proves you can communicate technical concepts
- **Community impact:** Skills become part of the ecosystem

> **See planned skills:** [skills/SKILLS_TODO.md](../skills/SKILLS_TODO.md) | **Skill format:** [CREATING_AGENT_SKILLS.md](./CREATING_AGENT_SKILLS.md)

---

## 💡 Mixing Ideas

Don't feel limited to one idea! Combine features:

**Example Combo 1:** SafeDrive Coach + EcoDrive Challenge
→ "Safety & Sustainability Driver Platform"

**Example Combo 2:** PredictMaint AI + DataSync Pro
→ "Fleet Intelligence Data Platform"

**Example Combo 3:** FleetBot + RouteGenius
→ "AI Route Optimizer with Slack Integration"

---

## 🚀 Getting Unstuck

**"I don't know where to start"**
→ Use this prompt: "I want to build [idea name]. Help me create a project plan with steps, technologies to use, and first 3 API calls to make."

**"My AI-generated code isn't working"**
→ Share the error with AI: "I got this error: [paste error]. Here's my code: [paste code]. How do I fix it?"

**"I'm not sure what tech stack to use"**
→ Ask AI: "What's the best tech stack for building [your idea] that works with Geotab API? Consider that I know [your languages]."

**"I need inspiration"**
→ Browse the Geotab SDK showcase: https://geotab.github.io/sdk/

**"I want to see examples"**
→ Check the code repository shared during the tutorial

---

## 📚 Resources

**Geotab Documentation:**
- API Reference: https://geotab.github.io/sdk/software/api/reference/
- SDK Guides: https://geotab.github.io/sdk/software/guides/
- Code Samples: https://github.com/Geotab/sdk

**AI Prompting Tips:**
- Be specific about inputs and outputs
- Ask for explanations: "Explain this code line by line"
- Iterate: "Make this better by adding [feature]"
- Debug together: "Why isn't this working? Here's the error..."

**Community:**
- Geotab Developer Forum: [link]
- Hackathon Discord: [link]
- Stack Overflow: Tag `geotab`

---

*Good luck! Remember: vibe coding is about rapid iteration and creative problem-solving. Don't be afraid to experiment!*
