# Google Tools for Vibe Coding

**Five tools. One idea. Ship it.**

Google provides a spectrum of AI-powered tools for vibe coding — from quick sketches to production-grade applications. This guide walks you through each one, when to use it, and how they fit together.

> Based on a presentation by [Mahin Sheth](https://www.linkedin.com/in/mahinsheth/) (Customer Engineer, Data & AI at Google) at Geotab Connect 2026.

---

## What is Vibe Coding?

Vibe coding is AI-assisted development where you describe your idea in plain English and let AI write the code. You don't need to be a programmer. You need to know what you want to build.

The term was coined by Andrej Karpathy in early 2025:

> "Fully giving in to the vibes, embracing exponentials, and forgetting that the code even exists."

**You are the architect. AI is the contractor.** You bring the domain expertise, the branding, the vision. AI handles the syntax, the packages, the boilerplate.

### What Vibe Coding is NOT

| Myth | Reality |
|------|---------|
| You need to be a programmer | Not anymore — tools like Gemini Canvas and Firebase Studio let anyone build functional apps |
| AI does everything, you just watch | You are still responsible for reviewing output, providing context, and delivering the result |
| It only works for toy projects | You can go from idea to deployed, shareable production app in hours |

---

## The Vibe Coding Lifecycle

Every vibe coding project follows this flow:

1. **Plan** — Define what your app should do. Use AI to brainstorm features, KPIs, and user flows you haven't thought of yet.
2. **Prototype** — Build a working version fast. Iterate on the UI and functionality until it feels right.
3. **Build** — Add real features: analytics, integrations, AI assistants, maps.
4. **Test & Verify** — Make sure it works. Let the tools auto-fix errors when possible.
5. **Deploy** — Push to production, get a shareable URL, collect feedback.

The middle is a continuous feedback loop. You iterate, you refine, you tell the AI "change this button to green" and it does.

---

## The Google Tools Spectrum

Google offers tools across a range of complexity. Pick the one that matches where you are:

| Tool | Best For | Complexity | Output |
|------|----------|------------|--------|
| **Gemini Canvas** | Quick sketches and single-page prototypes | Lowest | Single-file apps |
| **AI Studio (Build Mode)** | Developer prototyping with model access | Low-Medium | Multi-file prototypes |
| **Firebase Studio** | Full web/mobile apps with deployment | Medium | Production apps with URLs |
| **Gemini CLI** | Terminal-native developers | Medium | Code changes in your repo |
| **Project Astra (Antigravity)** | Complex multi-agent applications | Highest | Multi-file apps with planning |

> **You don't have to pick just one.** A common workflow: sketch in Gemini Canvas → prototype in AI Studio → deploy with Firebase Studio.

---

## Tool 1: Gemini Canvas

**Your AI sketchbook.**

Gemini Canvas is the simplest starting point. It lives inside the [Gemini app](https://gemini.google.com/) and lets you build single-file applications by describing what you want.

### When to Use It

- You have an idea and want to see if it's feasible
- You want a quick visual prototype
- You're a non-technical user exploring what's possible
- You're in the "plan" phase and want to sketch different approaches

### How It Works

1. Go to [gemini.google.com](https://gemini.google.com/)
2. Click the **Canvas** tool in the toolbar
3. Describe what you want to build
4. Watch it generate a working single-file application
5. Iterate by clicking on elements and annotating changes

### Key Features

- **Live preview** — See your app as it's being built
- **Visual annotation** — Click on any element and describe what to change ("make this button green", "move this chart to the left")
- **Code review** — View and edit the generated code directly
- **No setup required** — Works in your browser, no installation

### Example: Fleet Dashboard in Under a Minute

**Prompt:**
```
Build a dashboard that highlights vehicles with scheduled maintenance.
Connect to the Geotab API to fetch vehicle data.
```

Canvas will:
1. Search for the Geotab API documentation
2. Generate the code
3. Connect to the API (you provide credentials)
4. Render a working dashboard

> **Think of Canvas as the napkin sketch.** It gets you from "I have an idea" to "I can see it working" faster than anything else.

### Limitations

- Single-file applications only
- Best for prototypes, not production
- Limited control over architecture and tech stack

---

## Tool 2: AI Studio (Build Mode)

**The fastest path from prototype to something real.**

[AI Studio](https://aistudio.google.com/) is a developer-oriented environment where you get access to all Gemini models, pre-built components, and a build mode for creating multi-file applications.

### When to Use It

- You want to prototype with specific Gemini models (including Gemini 3)
- You need multi-file applications with proper structure
- You want to add pre-built functionalities (chatbots, image generation, maps)
- You're comfortable specifying technical preferences (React, Tailwind, etc.)

### How It Works

1. Go to [aistudio.google.com](https://aistudio.google.com/)
2. Start a new project or remix an existing one from the gallery
3. Describe your application or select a pre-built template
4. Choose your model (Gemini 3 Pro, Gemini 3 Flash, etc.)
5. Add system instructions, tools, and context
6. Build and iterate

### Key Features

- **Model selection** — Choose which Gemini model powers your app
- **System instructions** — Set coding guidelines, branding rules, technology preferences
- **Pre-built gallery** — Start from existing templates (image generation, audio, video, and more)
- **Remix mode** — Take any existing app and customize it with your own context
- **MCP server support** — Connect to external data sources and tools
- **Auto-fix** — When your code has errors, click "auto-fix" and Gemini will diagnose and repair them
- **Visual annotation** — Screenshot-based feedback, just like Canvas

### Example: Fleet Analytics App

**Prompt:**
```
Build a fleet analytics app. First, tell me if this is feasible.
If so, suggest key metrics to include.
```

AI Studio will:
1. Confirm feasibility and suggest features (route optimization, maintenance tracking, fuel analytics)
2. Ask if you want to proceed
3. Create ~10 files with components, mock data, and a complete UI
4. Include features like an AI assistant chatbot, fleet filtering, and service history

### Pre-Built Components You Can Add

AI Studio has reusable components you can drop into any project:

- **AI-powered chatbot** — Context-aware assistant embedded in your app
- **Image generation** — Powered by Imagen
- **Maps integration** — Use your Google Maps ID for live map data
- **Voice/audio** — Conversation and audio generation tools
- **Video generation** — Create video content programmatically

### Iterating on Your Prototype

AI Studio supports the same annotation workflow as Canvas:

1. Select an area of your app's preview
2. Add a text annotation ("make this more intuitive", "change the color scheme")
3. AI Studio captures the screenshot + your text and applies multimodal edits

> **AI Studio is great for building. For deploying, move to Firebase Studio.**

---

## Tool 3: Firebase Studio

**From prototype to production with a URL.**

[Firebase Studio](https://firebase.studio/) is a fully integrated IDE with a managed development and deployment environment. It's the tool you use when you're ready to ship.

### When to Use It

- You want to build web or mobile applications
- You need a sharable URL for your app
- You want managed hosting, performance monitoring, and security
- You're ready to go beyond prototypes

### How It Works

1. Go to [firebase.studio](https://firebase.studio/)
2. Choose **Prototyper mode** (AI-driven) or **Code mode** (VS Code-like editor)
3. Build your application using AI or code
4. Click **Publish** to deploy
5. Share the URL with anyone

### Key Features

- **Two modes:**
  - **Prototyper** — Describe what you want, iterate visually
  - **Code editor** — Full VS Code environment for hands-on development
- **One-click deploy** — Click "Publish" and get a live URL
- **Cloud Run backend** — Apps are containerized and hosted on Google Cloud
- **Version management** — Deploy specific versions, keep dev separate from production
- **Visual annotation** — Same screenshot-based editing as other tools

### How Deployment Works

When you click Publish:
1. Firebase Studio spins up a **Cloud Run** container
2. Your app is deployed and hosted on Google Cloud
3. You get a **shareable URL** — anyone can access it
4. The app auto-scales based on traffic

> **For the hackathon:** Build your app in Firebase Studio, click Publish, and submit the URL. Judges click the link and see your working app.

### Cost

- Firebase Studio itself is free to use
- Hosting costs are usage-based through your GCP billing account
- Token costs for Gemini API calls depend on your usage tier
- Containers are paused when not in use (you're not charged for idle time)

### Versioning

You can manage multiple versions of your app:
- Keep a **stable** published version live for users
- Work on a **dev** version with new features
- Deploy specific versions when ready

---

## Tool 4: Gemini CLI

**For developers who live in the terminal.**

[Gemini CLI](https://github.com/google-gemini/gemini-cli) is a lightweight, open-source command-line tool that brings Gemini into your existing development workflow. It's not a chatbot — it's an active development assistant.

### When to Use It

- You're comfortable with terminals and CLIs
- You want AI assistance inside your existing codebase
- You prefer keyboard-driven workflows over GUIs
- You want to fix builds, generate code, or refactor without leaving your editor

### How It Works

```bash
npm install -g @google/gemini-cli
gemini
```

That's it. Two commands and you have access.

### Key Features

- **Open source** — Free, no license required
- **Works in your repo** — Understands your codebase context
- **Extensions** — Add Google Search grounding, Maps, MCP servers
- **Lightweight** — No UI, no browser, just your terminal

### What You Can Do

```
# Fix a failed build
gemini "fix the TypeScript errors in src/components"

# Generate code
gemini "add a function that fetches vehicle data from the Geotab API"

# Refactor
gemini "refactor the dashboard component to use React hooks"
```

---

## Tool 5: Project Astra (Google Antigravity)

**The most powerful tool in the lineup.**

Project Astra (internally called "Jules", publicly available as Google Antigravity) is a complete agent development platform. It doesn't just generate code — it plans, reasons, builds, tests, and deploys multi-file applications using multiple AI agents working in parallel.

### When to Use It

- You're building complex, multi-file applications
- You want an agent that plans before it codes
- You need browser-based testing with computer use
- You want the highest level of AI assistance available

### How It Works

1. Open Project Astra / Antigravity
2. Describe your application (or use voice prompts)
3. Choose a mode:
   - **Fast mode** — Quick, one-off tasks
   - **Planning mode** — Detailed implementation plans using Gemini 3 Pro reasoning
4. Review the implementation plan
5. Approve and watch the agents build

### Key Features

- **Agent-first UI** — Multiple agents work on your project simultaneously
- **Implementation plans** — See exactly what will be built before any code is written. Review and edit the plan before proceeding.
- **Inbox system** — Manage notifications from different agents. Kick off 10 agents in the morning, check your inbox for results.
- **Browser mode** — Powered by Gemini 3.5 computer use. The AI can interact with your app in a real browser, clicking buttons, testing flows, capturing screenshots.
- **Reasoning mode** — Uses Gemini 3 Pro's thinking capabilities to break down complex tasks into steps
- **Voice prompting** — Describe your idea by speaking instead of typing
- **Model selection** — Choose between Gemini 3 Pro high/low thinking budgets

### Example: Personal Finance Dashboard

**Prompt:**
```
Build me a Next.js application called "Personal Finances Dashboard"
that shows different financial profiles, investment portfolios,
and spending breakdowns. Use a modern color scheme.
```

What happens:
1. Antigravity creates a **detailed implementation plan** — setup, dependencies, layout, components, testing
2. You review and approve (or edit) the plan
3. It creates ~10+ files with all components
4. You get a working app with charts, filters, and interactive elements
5. Total time: ~10-12 minutes for a complete application

### Browser Mode: AI That Clicks

Browser mode uses **Gemini 3.5 computer use** to interact with your running app:

- Navigate pages by clicking
- Test user flows visually
- Capture screenshots for feedback
- Update code based on what it sees in the browser

**Example:** "Go to my Geotab website, capture the color scheme, and apply it to this dashboard." The AI will navigate to the site, extract the colors, and update your app.

---

## Choosing the Right Tool

### Decision Tree

```
Do you have a specific idea?
├── No → Start with Gemini Canvas to explore and sketch
├── Yes → How complex is it?
    ├── Single page / quick prototype → Gemini Canvas
    ├── Multi-file app, want to prototype → AI Studio
    ├── Need to deploy with a URL → Firebase Studio
    ├── Terminal developer, existing codebase → Gemini CLI
    └── Complex app, need planning & multi-agent → Project Astra
```

### Common Workflow

Many projects flow through multiple tools:

1. **Gemini Canvas** — Sketch the idea, test feasibility
2. **AI Studio** — Build a proper prototype with components and mock data
3. **Firebase Studio** — Deploy to production with a shareable URL

Or for technical developers:

1. **Gemini CLI** — Generate initial code in your local repo
2. **Project Astra** — Scale up to a full application with planning and multi-agent support

---

## Context Engineering: The Key to Better Results

The biggest factor in vibe coding quality isn't the tool — it's the **context** you provide.

### What is Context Engineering?

Context engineering is the art of giving your AI agent enough information to accomplish a task accurately. It's the evolution of prompt engineering — instead of crafting the perfect sentence, you're assembling the right package of information.

### What to Include in Your Context

| Context Type | Example |
|-------------|---------|
| **Branding** | "Use these colors: header #1a365d, accent #38a169" |
| **Tech stack** | "Use React, Tailwind CSS, and Chart.js" |
| **Code guidelines** | "Follow our ESLint config, use TypeScript strict mode" |
| **API details** | "Use the Geotab API. Here's the SDK documentation." |
| **Screenshots** | Upload a screenshot of your existing app for style matching |
| **Documents** | Attach design specs, API docs, or branding guidelines |
| **Existing code** | Point to your codebase or paste relevant files |
| **Rules** | "Never use inline styles", "Always include error handling" |
| **Skills** | Define reusable capabilities and MCP servers |

### Bad vs. Good Prompts

**Bad:**
```
Make me a fleet dashboard.
```

**Good:**
```
Create a fleet analytics dashboard that shows:
- Total vehicles, active vehicles, and vehicles needing maintenance
- A map showing current vehicle positions using Leaflet
- A bar chart of trips per vehicle for the last 7 days

Use the Geotab API (https://geotab.github.io/sdk/software/api/reference/)
for data. Use React with Tailwind CSS. Match the color scheme from
the MyGeotab interface (dark sidebar, white content area).

Include a loading spinner while data is being fetched.
Add an AI chatbot that can answer questions about the fleet.
```

### Pro Tip: Use Gemini to Write Your Prompts

Not sure what to include? Ask Gemini first:

```
I want to build a fleet management dashboard.
What features should I include?
What details should I provide to get the best result?
```

Gemini will suggest features, KPIs, design patterns, and technical details you might not have thought of. Then use that expanded prompt in AI Studio or Project Astra.

---

## From Idea to Production: The Full Journey

### Step 1: Blueprint

Start with your idea. Use Gemini to expand it:
- What features should your app have?
- What KPIs matter for your use case?
- What does the user journey look like?

Create simple mockups and define the user flow.

### Step 2: Build with AI Studio

Craft your detailed prompt with all the context. Use AI Studio to:
- Build the prototype
- Connect to the Geotab API
- Add components (maps, charts, chatbots)
- Iterate on the design

### Step 3: Deploy with Firebase Studio

Move your project to Firebase Studio for production:
- Managed hosting on Cloud Run
- Sharable URLs
- Performance monitoring
- Security postures
- Load balancing
- Version management

### Step 4: Iterate with Real Feedback

Share your URL. Collect feedback. Feed it back into your tools. Improve. Repeat.

---

## Spec-Driven Vibe Coding

As vibe coding matures, the best practice is moving toward **spec-driven development**:

1. Write a specification document that defines:
   - Features and functionality
   - Tech stack and frameworks
   - Branding and style guidelines
   - API connections and data sources
   - Rules and constraints
   - MCP servers and skills

2. Provide this spec as context when you start building

3. The AI agent follows your spec, not just a single prompt

This produces more consistent, higher-quality results — especially for team projects and production applications.

> **Don't be the monkey. Be the architect, and let the contractor build.**
> — Mahin Sheth, Geotab Connect 2026

---

## Quick Links

| Tool | Link |
|------|------|
| Gemini App (Canvas) | [gemini.google.com](https://gemini.google.com/) |
| AI Studio | [aistudio.google.com](https://aistudio.google.com/) |
| Firebase Studio | [firebase.studio](https://firebase.studio/) |
| Gemini CLI | [Open source on GitHub](https://github.com/google-gemini/gemini-cli) |

---

## Related Guides

- [**Google Gem User Guide**](./GOOGLE_GEM_USER_GUIDE.md) — Build MyGeotab Add-Ins using the Geotab Add-In Architect Gem
- [**Antigravity Quickstart**](./ANTIGRAVITY_QUICKSTART.md) — Build interactive dashboards with Google Antigravity
- [**Beginner Guide**](./BEGINNER_GUIDE.md) — New to coding? Start here
- [**Hackathon Ideas**](./HACKATHON_IDEAS.md) — Project ideas for the Vibe Coding Challenge

---

**[Back to README](../README.md)**
