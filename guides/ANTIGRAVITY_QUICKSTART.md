# Vibe Coding with Google Antigravity

**Stop coding. Start vibing.**

This guide teaches you how to build an interactive Geotab fleet dashboard without writing a single line of code yourself. You will use **Google Antigravity** (a powerful AI-native IDE) to do the heavy lifting.

## 🏁 Prerequisites

1.  **Google Antigravity IDE** installed. [Download it here](https://antigravity.google/).
2.  A **Geotab Demo Account**. [Get one here](https://my.geotab.com/registration.html) if you haven't already.
    > **Important:** Click **"Create a Demo Database"** (not "I'm a New Customer") to get pre-populated sample data.

> **New to Antigravity?** Check out the [Getting Started Codelab](https://codelabs.developers.google.com/getting-started-google-antigravity) for a deep dive, or watch the [Antigravity & Agentic Engineering demo](https://www.youtube.com/watch?v=avEXlVw2lU8&t=2867) from our Google AI Tools session.

---

## 🌊 The Vibe Coding Workflow

1.  **Open** your project in Antigravity.
2.  **Summon** the Agent (Cmd+L or click the star icon).
3.  **Prompt** the agent to do work.
4.  **Review** and **Run**.

---

## 🚀 Let's Build: Interactive Fleet Map

We are going to build a Python web app that fetches vehicle locations and puts them on a map.

### Step 0: Setup Dependencies
Antigravity can install packages for you.

**Prompt Antigravity:**
> "Install `mygeotab`, `streamlit`, `pandas`, and `python-dotenv` using pip."

*Action:* Wait for the installation to complete.

### Step 1: Secure Your Credentials
Don't paste passwords into chat. Create a `.env` file first.

**Prompt Antigravity:**
> "Create a .env file template for Geotab credentials (server, database, username, password). Don't fill it in, just create the file."

*Action:* Fill in your real credentials in the created `.env` file.

### Step 2: Connection & Data Fetching

Let's get the data flowing.

**Prompt Antigravity:**
> "Create a Python script that uses `mygeotab` SDK to authenticate using the .env file. Then, fetch all 'Device' objects **and their current location (DeviceStatusInfo)**. Print their names and coordinates."

*Action:* Run the script to verify it works.

### Step 3: Make it Interactive (The "Vibe" Part)

Now, let's turn that text output into a visual app. We'll use **Streamlit** or **Flask**—let the AI decide or specify your preference.

**Prompt Antigravity:**
> "Update the script to be a Streamlit app. It should:
> 1. Display a map with markers for all vehicles.
> 2. Show a data table of vehicle details below the map.
> 3. Add a refresh button to update the data.
> Use `st.map` for the visualization."

**Prompt Antigravity:**
> "Run the streamlit app so I can see it."

*Action:* Antigravity will run the command for you. Click "Open in Browser" or the link it provides (usually `http://localhost:8501`).

### Step 4: Polish & Style

Make it look professional.

**Prompt Antigravity:**
> "Make the dashboard look premium. Add a title 'Fleet Vibe Commander', use a wide layout, and add a sidebar that filters vehicles. Display key metrics (Total Vehicles, Active Vehicles) using `st.metric` at the top."

---

## 🧠 Pro Tips for Antigravity

*   **"Fix this"**: If you get an error, just paste the error into the chat. Antigravity will fix the code.
*   **"Explain this"**: Not sure what the code does? Ask for a walkthrough.
*   **"Add X"**: Want a chart? A download button? Just ask.

---

## 🎯 Challenge: The "Vibe" Check

Can you add a feature that uses **Geotab Ace** (or simulates an AI analysis) to tell you which vehicle is driving most efficiently?

**Try this prompt:**
> "Add a section that calculates a simple 'Vibe Score' for each vehicle based on random mocked data (0-100) for now, and display it as a progress bar."

---

**[⬅️ Back to README](../README.md)**

---

## 🛠️ Troubleshooting

**"ModuleNotFoundError: No module named 'mygeotab'"**
- You missed Step 0! Just tell Antigravity: *"Fix the missing module error by installing mygeotab"*.

**"Authentication Failed"**
- Check your `.env` file. Ensure `GEOTAB_DATABASE` is correct (case-sensitive).

**Streamlit doesn't open**
- Antigravity usually provides a button to open the app. If not, look in the terminal for the "Local URL".
