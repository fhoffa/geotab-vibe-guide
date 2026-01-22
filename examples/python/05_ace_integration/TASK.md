# Task 05: Geotab Ace API Integration

## Goal
Create examples showing how to use Geotab Ace API for AI-powered fleet insights. This is minutes 40-52 of the tutorial.

## ⚠️ IMPORTANT NOTE
If Geotab Ace API is not available or you don't have credentials:
1. Create placeholder/mock examples showing what it WOULD do
2. Document that real Ace API integration requires separate credentials
3. Add TODO comments where real API calls would go
4. Focus on the concept and structure, using mock responses

## What to Build

### File 1: `ace_client.py`
**Purpose:** Client class for Geotab Ace API

**Requirements:**
- Create `GeotabAceClient` class
- Handle authentication (if different from main API)
- Methods for common Ace operations:
  - `ask_question(question: str)` - Natural language query
  - `get_recommendations(vehicle_id: str)` - Get recommendations
  - `predict_maintenance(vehicle_id: str)` - Predictive maintenance
- Error handling and rate limiting
- Type hints and docstrings

**If Ace API is not available:**
- Create the class structure with mock responses
- Document expected input/output formats
- Add TODO comments for real implementation

### File 2: `chatbot.py`
**Purpose:** Interactive CLI chatbot for fleet queries

**Requirements:**
- Simple command-line interface
- Accept natural language questions about fleet
- Examples of questions to try:
  - "Which vehicles need maintenance soon?"
  - "What's the total fuel consumption this week?"
  - "Which drivers have the best safety scores?"
  - "Show me vehicles with low fuel"
- Display responses in readable format
- Keep conversation history
- Type 'quit' or 'exit' to end

**Example Session:**
```
╔══════════════════════════════════════════════════════════════╗
║           GEOTAB ACE FLEET CHATBOT                          ║
║     Ask questions about your fleet in natural language      ║
╚══════════════════════════════════════════════════════════════╝

You: Which vehicles need maintenance soon?

Ace: Based on diagnostics and usage patterns, 3 vehicles may need
maintenance within the next 30 days:

  1. Truck 001 (45,234 miles)
     - Oil change due in 234 miles
     - Tire rotation recommended

  2. Van 042 (82,901 miles)
     - Active fault code P0420 requires attention
     - Brake inspection due in 2 weeks

  3. Car 103 (67,123 miles)
     - Scheduled 60k service overdue by 123 miles

You: What's my fleet's average fuel efficiency?

Ace: Your fleet's average fuel efficiency over the past 30 days is:
  - 12.4 MPG across all vehicles
  - This is 8% better than the industry average
  - Top performer: Car 103 (18.2 MPG)
  - Needs improvement: Truck 204 (8.1 MPG)

You: quit

Thank you for using Geotab Ace!
```

**Vibe Prompt:**
```
Create an interactive CLI chatbot that:
1. Accepts natural language questions about fleet data
2. Uses Geotab Ace API to get AI-powered answers
3. Displays responses in a readable, formatted way
4. Maintains conversation history
5. Provides helpful example questions on startup
6. Gracefully exits on 'quit' or 'exit'

Include error handling for API failures and a clean UI with colors.
```

### File 3: `maintenance_predictor.py`
**Purpose:** Predictive maintenance report

**Requirements:**
- For each vehicle, predict maintenance needs
- Use Ace API to analyze:
  - Fault code history
  - Odometer/engine hours
  - Usage patterns
  - Diagnostic trends
- Generate report with:
  - Vehicles needing immediate attention
  - Upcoming maintenance (next 30/60/90 days)
  - Maintenance cost estimates
  - Recommended service schedule
- Option to export to PDF or CSV

**Example Output:**
```
╔══════════════════════════════════════════════════════════════╗
║         PREDICTIVE MAINTENANCE REPORT                       ║
║              Generated: 2026-01-22 14:30                    ║
╚══════════════════════════════════════════════════════════════╝

IMMEDIATE ATTENTION REQUIRED (2 vehicles)
─────────────────────────────────────────────────────────────
🔴 Van 042
   - Active fault code P0420 (critical)
   - Estimated cost: $800-1,200
   - Recommended action: Schedule repair this week

🔴 Truck 204
   - Brake wear detected (88% worn)
   - Estimated cost: $400-600
   - Recommended action: Schedule within 5 days

UPCOMING MAINTENANCE (Next 30 days)
─────────────────────────────────────────────────────────────
🟡 Truck 001
   - Oil change due in 234 miles
   - Estimated cost: $80-120
   - Can wait: 7-10 days

🟡 Car 103
   - 60k service overdue by 123 miles
   - Estimated cost: $300-450
   - Schedule within 2 weeks

SCHEDULED MAINTENANCE (30-90 days)
─────────────────────────────────────────────────────────────
🟢 5 vehicles have routine maintenance scheduled
   - Total estimated cost: $2,400
   - See detailed schedule below

Total Maintenance Budget (Next 90 days): $4,400 - $6,200

Report saved to: maintenance_report_2026-01-22.pdf
```

### File 4: `smart_insights.py`
**Purpose:** Generate AI-powered fleet insights and recommendations

**Requirements:**
- Analyze fleet performance using Ace API
- Generate insights on:
  - Fuel efficiency optimization
  - Route optimization opportunities
  - Driver behavior patterns
  - Cost reduction recommendations
  - Safety improvements
- Present in dashboard format
- Include actionable recommendations

**Example Output:**
```
╔══════════════════════════════════════════════════════════════╗
║            SMART FLEET INSIGHTS                             ║
║              Powered by Geotab Ace                          ║
╚══════════════════════════════════════════════════════════════╝

KEY INSIGHTS (This Week)
─────────────────────────────────────────────────────────────

💰 COST SAVINGS OPPORTUNITY: $1,240/month
   Your fleet is experiencing 18% excess idle time compared to
   industry average. Reducing idle time could save:
   - 142 gallons of fuel per month
   - Reduced engine wear
   - Lower maintenance costs

   Recommended actions:
   ✓ Enable idle time alerts for drivers
   ✓ Provide anti-idling training
   ✓ Set 5-minute idle threshold

🚗 ROUTE OPTIMIZATION: 12% efficiency gain possible
   Analysis shows 3 routes consistently exceed optimal distance:
   - Route A (Truck 001): +8.4 miles/day average
   - Route B (Van 042): +6.2 miles/day average
   - Route C (Car 103): +4.1 miles/day average

   Recommended actions:
   ✓ Review and optimize delivery sequences
   ✓ Use real-time traffic data
   ✓ Consider alternative routes

⚠️ SAFETY ALERT: 3 drivers need attention
   Excessive harsh braking events detected:
   - Driver A: 12 events this week (+40% vs average)
   - Driver B: 8 events this week (+25% vs average)
   - Driver C: 7 events this week (+20% vs average)

   Recommended actions:
   ✓ Schedule safety training
   ✓ Review driving conditions (weather, routes)
   ✓ Check vehicle brake systems

🌱 ENVIRONMENTAL IMPACT
   Your fleet's carbon footprint this month: 2.4 tons CO2
   - 5% lower than last month ✓
   - 12% lower than industry average ✓

   Further reduction opportunities:
   ✓ EV conversion candidates: 3 vehicles identified
   ✓ Eco-driving training could reduce emissions by 8%

NEXT STEPS
─────────────────────────────────────────────────────────────
1. Review idle time data with drivers
2. Test optimized routes for Route A
3. Schedule safety training for flagged drivers
4. Evaluate EV conversion ROI

Generated: 2026-01-22 14:30 | Next update: Tomorrow
```

### File 5: `ace_demo.py`
**Purpose:** Quick demo script showing Ace capabilities

**Requirements:**
- Simple script that runs through example queries
- Shows different types of Ace functionality:
  - Natural language Q&A
  - Predictive analysis
  - Recommendations
  - Data summarization
- Useful for tutorial demonstrations
- Well-commented to explain what's happening

## Additional Files

### `requirements.txt`
```
mygeotab>=0.8.0
python-dotenv>=1.0.0
requests>=2.31.0
colorama>=0.4.0
rich>=13.0.0
# Add Ace-specific dependencies if available
```

### `mock_responses.py`
**Purpose:** Mock Ace API responses for testing/demo

**Requirements:**
- If real Ace API unavailable, create realistic mock responses
- Cover all use cases (Q&A, predictions, recommendations)
- Document the expected structure of real responses
- Easy to swap with real API when available

### `README.md`
Include:
- What Geotab Ace API is and what it does
- Authentication setup (if different from main API)
- How to run each example
- Example questions to try
- Limitations and rate limits
- Link to Ace API documentation
- Note about mock vs real API

## Testing Checklist
- [ ] Ace client authenticates successfully (or mock works)
- [ ] Chatbot accepts and responds to questions
- [ ] Maintenance predictor generates report
- [ ] Insights are relevant and actionable
- [ ] Error handling for API failures
- [ ] Clear documentation if using mocks

## Success Criteria
Students should:
1. Understand what Ace API can do
2. See natural language queries in action
3. Get excited about AI-powered insights
4. Have working code to build upon
5. Understand how to combine Ace with direct API data

## Important Notes

**If Ace API is available:**
- Test thoroughly with real credentials
- Document rate limits and quotas
- Show best practices for prompt engineering
- Include examples of effective questions

**If Ace API is NOT available:**
- Create convincing mock responses
- Document expected API structure
- Make it easy to swap mocks for real API
- Focus on teaching the concepts
- Add large disclaimer in README

**Ethical Considerations:**
- Don't make predictions that could affect employment decisions
- Make it clear that AI predictions are estimates
- Recommend human review of critical decisions
- Respect privacy in driver behavior analysis

## Vibe Coding Tips for Students
Document these prompts in README:
```
"Create a chatbot that uses Geotab Ace API to answer fleet questions"

"Generate a predictive maintenance report using AI analysis of vehicle diagnostics"

"Build a tool that provides actionable fleet optimization insights"

"Combine Geotab Ace predictions with real-time vehicle data"
```
