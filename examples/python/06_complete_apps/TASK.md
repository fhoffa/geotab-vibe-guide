# Task 06: Complete Hackathon-Ready Applications

## Goal
Build 2-3 complete, hackathon-ready applications that combine everything learned. These are full examples students can use as starting points for their projects.

## What to Build

### App 1: EcoFleet Carbon Tracker
**Purpose:** Complete application for tracking and reducing fleet carbon footprint

**Files:**
- `ecofleet/app.py` - Main Flask/FastAPI application
- `ecofleet/carbon_calculator.py` - Carbon emissions calculations
- `ecofleet/templates/` - Web interface
- `ecofleet/static/` - CSS/JS/images
- `ecofleet/README.md` - Full documentation

**Features:**
1. **Dashboard:**
   - Total fleet CO2 emissions (daily, weekly, monthly)
   - Emissions per vehicle
   - Trend charts (is it getting better?)
   - Comparison to industry average

2. **Vehicle Details:**
   - Emissions per vehicle
   - Fuel consumption breakdown
   - Eco-driving score
   - Improvement suggestions

3. **Leaderboard:**
   - Greenest drivers
   - Most improved vehicles
   - Weekly challenges

4. **Recommendations (using Ace API if available):**
   - Route optimization to reduce emissions
   - Driver coaching opportunities
   - EV conversion candidates
   - Idle time reduction targets

5. **Reports:**
   - Export emissions data
   - Sustainability reports for management
   - Cost savings from improvements

**Technology:**
- Flask/FastAPI backend
- Geotab API for trip and diagnostic data
- Chart.js for visualizations
- Bootstrap for UI
- Optional: Geotab Ace for recommendations

**Success Metric:** Students can demo a working carbon tracking app in under 5 minutes

---

### App 2: SafeDrive Coach
**Purpose:** Driver safety scoring and coaching platform

**Files:**
- `safedrive/app.py` - Main application
- `safedrive/safety_scorer.py` - Calculate safety scores
- `safedrive/templates/` - Web interface
- `safedrive/static/` - CSS/JS/images
- `safedrive/README.md` - Full documentation

**Features:**
1. **Safety Dashboard:**
   - Fleet-wide safety score
   - Individual driver scores
   - Safety events (speeding, harsh braking, etc.)
   - Trend over time

2. **Driver Profiles:**
   - Personal safety score (out of 100)
   - Breakdown by category:
     - Speed compliance: 85/100
     - Smooth driving: 92/100
     - Accident-free days: 45
   - Recent safety events with map
   - Improvement tips

3. **Gamification:**
   - Badges for achievements
   - Weekly/monthly challenges
   - Team competitions
   - Rewards for improvement

4. **Coaching:**
   - AI-powered tips (using Ace API)
   - Video tutorials for safe driving
   - Personalized action plans
   - Manager coaching tools

5. **Alerts:**
   - Email/SMS for serious events
   - Weekly summary reports
   - Recognition for top performers

**Scoring Algorithm:**
```python
Safety Score = (
    Speed_Compliance * 0.30 +
    Smooth_Driving * 0.30 +
    Distracted_Driving * 0.15 +
    Seatbelt_Use * 0.10 +
    Accident_Free_Days * 0.15
)
```

**Technology:**
- Flask/FastAPI backend
- Geotab ExceptionEvent API for safety events
- Chart.js for score visualizations
- Email integration (SendGrid or SMTP)
- Optional: Twilio for SMS alerts

**Success Metric:** Students can show a driver safety scorecard with real data

---

### App 3: FleetBot - Slack/Discord Integration
**Purpose:** Conversational bot for fleet management in team chat

**Files:**
- `fleetbot/bot.py` - Main bot application
- `fleetbot/geotab_handler.py` - Geotab API interface
- `fleetbot/ace_handler.py` - Ace API interface
- `fleetbot/commands.py` - Bot command handlers
- `fleetbot/README.md` - Full documentation with Slack/Discord setup

**Features:**
1. **Status Commands:**
   - `/fleet status` - Quick fleet overview
   - `/fleet vehicle [name]` - Vehicle details
   - `/fleet locate [name]` - Find a vehicle on map
   - `/fleet trips today` - Today's trips summary

2. **Natural Language Queries (using Ace API):**
   - "Which vehicles need maintenance?"
   - "How many miles did we drive yesterday?"
   - "Show me vehicles with low fuel"
   - "What's our safety score this week?"

3. **Alerts & Notifications:**
   - Post to channel when critical fault detected
   - Daily morning fleet summary
   - Weekly performance report
   - Trip completion notifications

4. **Interactive Elements:**
   - Buttons for quick actions
   - Select menus for vehicle choices
   - Map embeds showing locations
   - Chart images for trends

**Example Bot Interaction:**
```
User: /fleet status

FleetBot: 🚗 Fleet Status (2026-01-22 14:30)

          ✅ Active: 7 vehicles
          🟡 Idle: 5 vehicles
          🔴 Offline: 3 vehicles

          📊 Today: 487.2 miles
          ⚠️ Alerts: 2 vehicles need attention

          [View Dashboard] [See Alerts]

User: Which vehicles have low fuel?

FleetBot: 🔍 Checking fuel levels...

          ⛽ 2 vehicles have low fuel:

          1. Van 042 - 15% fuel remaining
             Last seen: 123 Main St (2 min ago)

          2. Car 205 - 18% fuel remaining
             Last seen: 456 Elm Ave (15 min ago)

          Would you like me to send alerts to the drivers?
          [Yes] [No]
```

**Technology:**
- Slack SDK or Discord.py
- Geotab API for data
- Geotab Ace for natural language
- Background task scheduler
- Webhook for real-time alerts

**Success Metric:** Students can ask the bot questions and get instant fleet insights

---

## Common Files for All Apps

### `shared/geotab_client.py`
**Purpose:** Reusable Geotab client that all apps can use

**Features:**
- Authentication and session management
- Common data fetching methods
- Error handling and retries
- Caching for frequently accessed data
- Rate limit handling

### `shared/config.py`
**Purpose:** Configuration management

**Features:**
- Load environment variables
- Validate required settings
- Default values
- Per-environment configuration (dev, prod)

### `shared/utils.py`
**Purpose:** Common utility functions

**Features:**
- Date/time formatting
- Distance conversions (miles/km)
- Speed conversions
- Color coding for statuses
- Data validation

## Documentation Requirements

Each app should have a comprehensive README with:

1. **Overview:** What the app does in 2-3 sentences
2. **Screenshots:** 3-5 screenshots showing key features
3. **Features:** Bulleted list of capabilities
4. **Tech Stack:** Languages, frameworks, APIs used
5. **Installation:**
   ```bash
   git clone...
   cd ecofleet
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your credentials
   python app.py
   ```
6. **Usage:** How to use the app
7. **Configuration:** Environment variables explained
8. **Deployment:** How to deploy to production
9. **Hackathon Tips:** How to extend this for a hackathon
10. **License:** MIT or similar

## Testing Checklist for Each App
- [ ] Runs without errors after setup
- [ ] All features work with real Geotab data
- [ ] Error handling works (try invalid vehicle name, etc.)
- [ ] UI is polished and professional
- [ ] Mobile responsive (for web apps)
- [ ] Documentation is clear and complete
- [ ] Can be deployed to production
- [ ] Impressive enough to demo

## Hackathon Readiness

Each app should be:
- **Complete:** Fully functional, not a prototype
- **Documented:** Clear README and code comments
- **Extensible:** Easy to add new features
- **Impressive:** Looks professional, works smoothly
- **Practical:** Solves a real problem

**Extension Ideas to Document:**

For EcoFleet:
- Add EV charging station finder
- Integrate with carbon offset APIs
- Add goals and gamification
- Fleet-wide sustainability reports

For SafeDrive:
- Add video dash cam review
- Integrate with insurance APIs for discounts
- Driver training module
- Accident reporting workflow

For FleetBot:
- Add more chat platforms (Teams, WhatsApp)
- Voice commands (Alexa, Google Assistant)
- Predictive alerts ("Truck 001 might need fuel soon")
- Integration with dispatch systems

## Success Criteria

Students should be able to:
1. Pick one of these apps as starting point
2. Understand all the code
3. Run it with their own data
4. Customize it for their hackathon idea
5. Deploy it to production
6. Demo it confidently

## Notes for Implementation

- **Start Simple:** Get basic functionality working first
- **Iterate:** Add polish and features incrementally
- **Test Often:** With real Geotab data
- **Document Everything:** Future you will thank you
- **Make it Pretty:** UI matters for demos
- **Handle Errors:** Gracefully handle API failures
- **Performance:** Apps should be fast and responsive

## Vibe Coding Prompts for Students

Document these in each app's README:

```
"Help me add a new feature to EcoFleet that shows EV conversion candidates"

"Modify SafeDrive to send weekly email reports to managers"

"Add a new FleetBot command to get maintenance recommendations"

"Create a dark mode for the EcoFleet dashboard"

"Add export to PDF functionality for SafeDrive reports"
```

## Bonus: Video Walkthroughs

If possible, create short video walkthroughs:
- 2-3 minutes showing app setup and demo
- Upload to YouTube
- Link in README
- Students can watch to understand quickly

---

**These apps represent the culmination of the tutorial. Students should feel proud showing them off and use them as foundations for hackathon projects.**
