# ⚡ Vibe Prompts: Copy, Paste, Build.

> **New to Claude?** Start with [INSTANT_START_WITH_CLAUDE.md](./INSTANT_START_WITH_CLAUDE.md) for a guided tutorial on using Claude for Geotab development. This page is a quick reference for specific prompts.

This is your control center. Copy these prompts into Claude, ChatGPT, or your AI assistant to build Geotab apps instantly.

> [!CAUTION]
> **NEVER paste real production credentials into an AI chat.**
> If using a real fleet database, ask the AI to write code that loads credentials from a `.env` file.
> Only paste passwords if you are using a **disposable demo database**.

## 🟢 1. The "Hello World" Prompt (Start Here)
**Goal:** Connect to your fleet and see what's possible.

```text
I want to explore the Geotab API and build something cool.

Database: [Insert Database Name]
Username: [Insert Email]
# SECURITY NOTE: For production, assume credentials are in a .env file.
# Only if this is a DEMO account:
Password: [Insert Password]
Server: my.geotab.com

1. Connect to my fleet.
2. Show me a summary of my vehicles and recent trips.
3. Suggest 3 simple project ideas I could build right now based on this data.
```

---

## 🟡 2. The "Deep Dive" Prompt
**Goal:** Understand your specific data patterns.

```text
Look at the actual data from my fleet (trips, exceptions, engine status) for the last 7 days.
1. Identify the top 3 most common events or behaviors.
2. Find one outlier or anomaly (e.g., a very long trip, high idling).
3. Create a simple ASCII chart or table summarizing fleet activity by day.
```

---

## 🟠 3. The "Builder" Prompt
**Goal:** Generate a working script for a specific idea.

```text
Let's build the [PROJECT IDEA NAME] we discussed.

Requirements:
1. Write a complete, single-file Python script.
2. Use the `mygeotab` library.
3. Include error handling for authentication and API limits.
4. Add clear comments explaining how to run it.
5. Save the output to a CSV file named 'fleet_report.csv'.

Do not ask clarification questions yet, just give me the best v1 implementation.
```

---

## 🔴 4. The "Web Dashboard" Prompt
**Goal:** Turn your script into a visual web app.

```text
Take the logic we just wrote and convert it into a simple web dashboard.

Stack:
- Python (Flask or Streamlit)
- Chart.js for visualization

Features:
1. A map showing vehicle locations (if lat/lon available).
2. A table of the data.
3. Auto-refresh every 60 seconds.

Give me the complete code in one file (if Streamlit) or the necessary files.
```

---

## 🟣 5. The "Fix It" Prompt
**Goal:** Debug errors when they happen.

```text
I am getting this error:
[PASTE ERROR MESSAGE HERE]

1. Explain why this is happening.
2. Fix the code to handle this case gracefully.
3. Explain how to prevent it in the future.
```

---

## 📚 Quick Reference Prompts

### Get All Vehicles
```text
Create a Python script to fetch all devices (vehicles) from my account and display their Name, SerialNumber, and ID in a table.
```

### Analyze Fuel Usage
```text
Fetch 'StatusData' for fuel levels for the last 24 hours. Calculate the total fuel consumed per vehicle and Identify the least efficient vehicle.
```

### Check Safety Events
```text
Fetch 'ExceptionEvent' data for speeding and harsh braking from the last week. Rank drivers by detailed safety score (100 = perfect).
```

### Export Data
```text
Fetch all Trip data for the last 30 days and export it to a clean CSV file with columns: Vehicle, StartTime, EndTime, Distance, MaxSpeed.
```

---

### 💡 Pro Tips
*   **Be Specific**: "Make it better" < "Add retry logic for network errors"
*   **Iterate**: Build small, test, then add features.
*   **Ask for Explanations**: "Explain how the authentication session is being kept alive."
