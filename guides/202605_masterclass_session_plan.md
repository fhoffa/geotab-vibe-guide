# Vibe Coding Demo + ACE
## Connect Europe 2026 — Barcelona

**Session:** 02:50 PM – 03:50 PM · 60 minutes  
**Speaker:** Felipe Hoffa  
**Repo:** [github.com/fhoffa/geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide)

---

This session is the hands-on half of a two-hour AI track. By the time it starts, the audience has seen what vibe coding is (Abhinav), real Geotab projects already in production (Jorge & Ronald), and 20 minutes of networking. This session goes deeper: here's what the developer community built, here's how you can build something right now, and here's what Geotab has opened up for your AI tools.

This document serves as both session guide and take-home reference. Everything linked here is publicly accessible.

---

## Session Flow at a Glance

| Time | Block | What Happens |
|------|-------|--------------|
| 02:50 | **Opening** (1 min) | Hackathon summary video |
| 02:51 | **Hackathon** (14 min) | What developers built, what worked, what didn't |
| 03:05 | **Gem demo** (10 min) | Build a MyGeotab Add-In live with the audience |
| 03:15 | **Vibe Guide** (3 min) | What this repo is and how to use it |
| 03:18 | **ACE** (10 min) | AI queries across three contexts |
| 03:28 | **Claude + MCP** (15 min) | Official Geotab MCP live demo |
| 03:43 | **Close + Q&A** (5 min) | Three things to do today |

---

---

# Part 1 — The Hackathon

> **Opening video:** [youtube.com/watch?v=BD0U9Zf-LvY](https://www.youtube.com/watch?v=BD0U9Zf-LvY) (1 min — plays as Felipe walks on stage)

## What Happened

The Geotab Vibe Coding Challenge ran February 12 – March 2, 2026. Any developer could participate — Geotab employees, resellers, partners, strangers on the internet. The tools: any AI assistant. The data: the Geotab fleet API. The prize: $25,000.

47 teams submitted projects. 43 repos were cloned and code-reviewed — not by humans reading READMEs, but by Claude Code reading every source file. We used vibe coding to judge vibe coding.

The judging rubric: **Useful (35%)** · **Original (25%)** · **Fun (15%)** · **Well-done (25%)**. Projects that used mock data had their Well-done score capped at 6.

## The Winners

All submissions were built in the open. All videos are in the [full playlist](https://www.youtube.com/playlist?list=PLG1fouPFF9lydA6SmkGlZbhDJyaI4MsBG). Full project directory with GitHub links: [guides/HACKATHON_PROJECTS.md](./HACKATHON_PROJECTS.md).

---

### 🏆 Vibe Master — FleetShield AI (Best Overall)
[GitHub](https://github.com/klickgenai/geotab-hackathon) · [Interview](https://www.youtube.com/watch?v=G3A8PjtovN8)

A predictive fleet safety and insurance intelligence platform. The operator says *"Run a coaching sweep"* and the system scores every driver against their 90-day baseline, updates their portal, and places real Twilio phone calls to flagged drivers — automatically, no human in the loop.

> *"Went beyond just visualizing data to illustrating a complete workflow, showing ROI, voice-agents, and what-if analysis. It really brought to life elements of our own product strategy."*

17 Claude agent tools, 9 scoring engines, 736-line CLAUDE.md. This is the architect mindset: you define the domain precisely, then the AI executes.

---

### 🔬 The Innovator — PoolFinder (Best Technical Creativity)
[GitHub](https://github.com/tmeb123/PoolFinder)

Fleet right-sizing using the Bron-Kerbosch clique algorithm — finds which vehicles could be shared or eliminated based on actual utilization overlap.

> *"Solves a targeted real world problem virtually all fleets have, with a good scientific approach behind the scenes."*

---

### 💡 The Disruptor — Check-Fleet Onboarding (Most Unique Idea)
[GitHub](https://github.com/amufti-cmd/geotab-check-fleet-onboarding-agent)

A 3-system reseller provisioning agent — automates new customer onboarding across Geotab, CRM, and billing in a single workflow.

> *"Very relevant problem for our partners. The efficiencies that this would bring to shorten the onboarding process + integrations are incredible."*

---

### 🤖 Best Use of Google Tools — Sentinel Fleet AI
[GitHub](https://github.com/JESUSMIJARES/geotab_vibe_coding_sentinel_fleet_ia)

Multi-agent safety audit integrating SmarterAI dashcam footage with Geotab telematics — the AI actively reasons through visual data to detect safety violations in real time.

> *"Stands out for its multi-layered integration of Google's AI tools. Leans into the latest agentic workflows, where the AI doesn't just wait for a prompt; it actively reasons."*

---

### 🌱 Green Award — SmartRoute (Best Sustainability Solution)
[GitHub](https://github.com/avkap007/geotab-hackathon-smartroute)

Waste collection route optimizer using the Clarke-Wright savings algorithm — skips bins that don't need servicing, reducing unnecessary trips.

> *"A practical, well-thought-out solution to a real problem. Works today using route data alone, but ready to unlock even greater savings when paired with bin sensors."*

---

### 🤝 Most Collaborative — LP Papillon / Attrix
[Watch](https://www.youtube.com/watch?v=EiZsIof1Scw)

LP (Attrix, Geotab reseller since 2015) won the community award for consistent generosity throughout the competition — sharing knowledge on Reddit, helping others debug, and keeping the hackathon feeling like a community rather than a competition. His submission: an AI-built Add-In scaffolding toolkit, then "Last Week in Fleet" built with it.

> *"LP stood out not for a single moment of helpfulness, but for a consistent pattern of generosity throughout the entire competition."*

---

## The Key Lesson

**The #1 differentiator across 47 submissions wasn't the idea. Wasn't the UI. It was whether the project connected to real fleet data.**

Project after project had polished demos. When the code was read, it showed `Math.random()`, `seed-data.ts`, `fakeData.ts`. Beautiful apps. No real data.

The ones that advanced: real API calls, real driver names, real trips, real fault codes.

Vibe coding gives you speed. Speed building on fake data is just a faster fake.

---

---

# Part 2 — Build With the Gem

## First: Set Up a Demo Database

You probably already have a MyGeotab account through your company. Don't experiment against that one.

Vibe coding is iterative — you'll install Add-Ins that are half-finished, paste JSON that breaks the layout, iterate a dozen times before it's right. That's the process. Do it in a dedicated sandbox.

**→ [my.geotab.com/registration.html](https://my.geotab.com/registration.html)**

A free demo database gives you a real Geotab API, real TypeNames, real responses — just simulated vehicles instead of your actual fleet. Everything you build and test against it works the same way in production. Install things, break things, reset, iterate. No risk to your live data, no colleagues wondering why there's a half-finished dashboard in their sidebar.

The demo database is also why the hackathon's real-data requirement mattered: teams that built against the real API from day one had working code. Teams that used `Math.random()` had a beautiful app that didn't actually do anything.

---

## What the Gem Is

The **Geotab Add-In Architect** is a Google Gemini Gem pre-loaded with the Geotab API knowledge base: TypeNames, field structures, auth patterns, inline CSS requirements, async polling — everything an Add-In needs, packaged as a conversational assistant.

**→ Open it here:** [Geotab Add-In Architect Gem](https://gemini.google.com/gem/1Y6IvbBj4ALgS9G3SgGodepM2dfArInrO)

**Full guide:** [guides/GOOGLE_GEM_USER_GUIDE.md](./GOOGLE_GEM_USER_GUIDE.md)

## Live Demo: Build Something With the Audience

The audience picks a fleet problem. The Gem builds it. The session installs it in MyGeotab together.

**Backup prompt if the room is quiet:**
> *"Safety coaching dashboard — show me my 10 riskiest drivers ranked by speeding and harsh braking events this week. Color-code them red/yellow/green."*

**Install steps:**
1. Copy the JSON from the Gem
2. MyGeotab → Administration → System Settings → Add-Ins → New Add-In → Configuration → Paste → Save
3. Hard refresh (`Ctrl+Shift+R`)
4. Click the new sidebar item

## The Gem Is Iterative

One prompt rarely produces the final result. The workflow is a conversation:

- Try the generated Add-In in MyGeotab
- Note what's wrong or missing — wrong columns, missing data, layout issues
- Describe changes back to the Gem: *"The table header is cut off. Make the columns wider and add a sort button."*
- Paste the updated JSON and hard refresh

**Tip:** In Gemini, switch from Fast to Thinking mode for complex requests. Thinking mode reasons through the MyGeotab Add-In constraints before generating code — better results for multi-panel layouts or anything involving async calls.

## When to Keep Going

For many Add-Ins, the Gem is the complete solution — iterate in the conversation until it's right. The signal to move into a real dev environment is complexity: you need tests, version control, external APIs with secret keys, teammates contributing, or the Add-In logic is growing beyond what a single JSON blob handles cleanly. That's when you copy the JSON from the Gem (not from MyGeotab — it strips the assets) and open Claude Code.

Full guide: [guides/GEM_TO_CLAUDE_CODE.md](./GEM_TO_CLAUDE_CODE.md)

---

---

# Part 3 — The Vibe Guide

## What This Repo Is

[github.com/fhoffa/geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide) has two layers:

### For Humans: `guides/`

| Guide | What it is |
|-------|------------|
| [GOOGLE_GEM_USER_GUIDE.md](./GOOGLE_GEM_USER_GUIDE.md) | How to use the Gem, step by step |
| [GEM_TO_CLAUDE_CODE.md](./GEM_TO_CLAUDE_CODE.md) | Gem → GitHub → Claude Code bridge |
| [GOOGLE_TOOLS_GUIDE.md](./GOOGLE_TOOLS_GUIDE.md) | Gemini Canvas, AI Studio, Gemini CLI |
| [CUSTOM_MCP_GUIDE.md](./CUSTOM_MCP_GUIDE.md) | Build your own Geotab MCP server today (community approach, works now) |
| [DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md) | ACE vs direct API — benchmarks and tradeoffs |
| [GEOTAB_ADDINS.md](./GEOTAB_ADDINS.md) | Add-In architecture and constraints |

### For AI Tools: `skills/`

Skills are SKILL.md files that package domain knowledge for AI tools. Any AI tool that supports Claude's skills format can load them.

| Skill | What it teaches |
|-------|----------------|
| [`skills/geotab`](../skills/geotab/) | Complete Geotab developer guide — API patterns, gotchas, TypeNames, auth, all of it |
| [`skills/agentic-n8n`](../skills/agentic-n8n/) | Fleet automation workflows with n8n |
| [`skills/geotab-custom-mcp`](../skills/geotab-custom-mcp/) | How to build and deploy custom MCP servers for Geotab |

Load into Claude Code:
```bash
git clone https://github.com/fhoffa/geotab-vibe-guide
```
Then tell Claude Code:
```
Read skills/geotab/SKILL.md and use it as your Geotab API reference.
```

## Why Skills Matter

Generic Claude doesn't know the Geotab API. A skill fixes that — one domain expert writes it once, every AI in your organization benefits. Claude Code, Codex, Gemini — same knowledge, any tool.

The format is open: [agentskills.io](https://agentskills.io). Your team can do this for any domain — your ERP, your dispatch system, your maintenance platform. One SKILL.md committed to GitHub. Done.

---

---

# Part 4 — ACE in Three Contexts

ACE is Geotab's AI query engine: natural language in, SQL-backed fleet intelligence out. It runs in three different places, each with different tradeoffs.

---

## Context 1: The MyGeotab Web UI

Already there. No setup. Fleet managers can ask questions in plain English and get answers directly in MyGeotab.

**What to ask:**
- *"Which vehicles drove the most distance this week?"*
- *"Which drivers had the most safety events?"*
- *"What's our fuel consumption trend this month?"*

**Hidden value — read the SQL ACE generates.** ACE shows you the query it ran. This is the fastest way to learn the Geotab data model: ask a question, read the SQL, understand the join. Better than documentation for developers who are new to the schema.


---

## Context 2: ACE as a Text Widget Inside Your Add-In

The Gem can build this in one prompt.

An Add-In with a text input: fleet manager types a question, ACE processes it, the answer appears inside MyGeotab — your interface, your branding.

**The one technical wrinkle:** ACE is async. You can't call it and wait synchronously. The pattern:

```
1. create-chat  →  get chat_id
2. send-prompt  →  get message_group_id
3. Wait ~10 seconds
4. Poll get-message-group every 8s until status === "DONE"
5. Read from message_group.messages[id].preview_array
```

**Gem prompt to build this:**
```
Build a "Fleet Insights" Add-In with a text input where managers can 
ask questions about the fleet. Use Geotab Ace with the async pattern:
create-chat → send-prompt → poll get-message-group until DONE every 8s.
Show a loading spinner "ACE is thinking…" while waiting.

Add preset buttons:
• "Which drivers need coaching this week?"
• "What's our fuel trend this month?"
• "Which vehicles might need maintenance?"
```

Auth comes from the MyGeotab session automatically — nothing extra to wire up.

---

## Context 3: ACE via the MCP (GetAceResults)

When Claude is connected to your fleet via the MCP, `GetAceResults` is one of its 20 tools. The important nuance is knowing when Claude will use it — and when it will use a faster tool instead.

You're always asking Claude in natural language. Claude decides which tool to call. For simple lookups it reaches for `Get` or `GetCountOf` (fast, < 1 second). For trend analysis or complex questions where you need AI reasoning, it calls `GetAceResults` (30–45 seconds). You don't specify the tool — Claude infers it from your question.

| | `GetAceResults` (ACE path) | `Get` / `GetCountOf` (direct path) |
|--|---------------------------|-------------------------------------|
| Speed | 30–45 seconds | < 1 second |
| Best for | Complex analysis, trend questions | Counts, lookups, real-time data |
| Caveat | May add implicit filters | 5K result cap per call |
| Who chooses | Claude, based on your question | Claude, based on your question |

Real benchmark: the same fleet-wide distance question — 41 seconds via ACE, 1.3 seconds via the direct MCP tool. Both are Claude answering in natural language — just different tools underneath.

And unlike both ACE and read-only API access, the MCP also has write tools: `Add`, `Set`, `Remove`, `DismissFaults`, group assignments. You can ask Claude to *change* things — and it will.

Full comparison: [guides/DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md)

Full comparison: [guides/DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md)

---

---

# Part 5 — Claude + the Official Geotab MCP

## The Shift

AI assistants are becoming a business tool — like email, like a browser. The question isn't whether your employees will use one. The question is: when they do, what can they do with your fleet?

*"My business is already evaluating AI assistants. What becomes possible when my fleet is part of that?"*

Geotab isn't adopting AI. Geotab is ready for the AI-native world you're already entering. Bring your tools — they'll meet you there.

## What MCP Is

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) is an open standard that lets AI assistants connect to external data and tools. It's not Geotab-specific — it's how Claude, Copilot, and others plug into external systems. Geotab has built a server that implements it.

**One key benefit over manual API use:** You no longer need to give Claude your Geotab password. The MCP server handles authentication — Claude connects through the server, your credentials stay out of the conversation.

## The 20 Tools

| Category | Tools |
|----------|-------|
| **Data Retrieval** | Get, GetCountOf, GetAceResults, ListEntities, GetEntity |
| **Fleet Management** | Add, Set, Remove, DecodeVins |
| **Safety & Compliance** | DismissFaults, GetHosRuleSets, EmissionEnrollDevices, EmissionDeadline, GetPostedRoadSpeeds |
| **Video — Go Focus** | SearchMedia, GetMediaUrl, GetDevicesInformation, DownloadMediaFile, UploadMediaFile |
| **Reporting** | SendReportProcessingRequest |

Full read *and* write. This isn't a read-only analytics layer.

## What Claude + MCP Can Do

The MCP unlocks four levels of capability that go well beyond single-question analysis:

---

### Level 1: Instant fleet answers, no dashboard needed

```
You: "Which vehicles haven't communicated in 24 hours?"

Claude: [queries Geotab live]
"2 vehicles offline: GVF-1204 (last seen near Lyon, 3 days ago) 
and GVF-0891 (last seen near Valencia, 5 days ago). 
Want their fault history?"
```

No MyGeotab tab open. No login. Your fleet is part of the conversation.

---

### Level 2: Multi-step investigations — chain of reasoning

ACE answers one question at a time. Claude can chain many steps together, carrying context across the conversation:

```
You: "Which drivers had the most harsh braking events last week?"

Claude: [GetAceResults] "Top 3: Martinez (14 events), Chen (11), 
Okonkwo (9). All assigned to the Southern Region group."

You: "Decode the VINs for their assigned vehicles."

Claude: [DecodeVins] "All three are 2021 diesel vans — 
Mercedes Sprinter, Ford Transit, Renault Master."

You: "Create a Safety Coaching Q2 group and add these drivers."

Claude: [Add + Set] "Done. Group created. All three assigned."
```

Query → analyze → act. One conversation. This is what FleetShield AI's operator does with a voice command.

---

### Level 3: Charting, mapping, and synthesis across tools

Claude isn't limited to Geotab data. In the same conversation it can:

- Pull fleet data via MCP
- Generate a chart from the results
- Cross-reference against external data (weather, road conditions, regulatory thresholds)
- Write a summary formatted for your reporting workflow

With the [Geotab skill](../skills/geotab/) loaded, Claude understands the data model deeply enough to translate ambiguous questions into the right API calls.

---

### Level 4: System changes and cross-company integrations

The MCP has full write access:

- Create groups, zones, alerts
- Update driver rules and notification settings
- Trigger report generation
- Dismiss faults, enroll vehicles in emissions programs

And Claude can connect to your other systems in the same session — your HR platform, your maintenance software, your dispatch system — if those have MCP servers or APIs Claude can reach.

---

## Beta and Setup

**The official Geotab MCP is coming. Talk to Geotab at this event to get on the early access list — this is the CTA for today.**

The official MCP gives you all 20 tools (full read + write), handles authentication through the server so your password never touches Claude, and is built and supported by Geotab.

**While you wait for official beta access — preview with this today:**  
[github.com/fhoffa/geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo) — ACE-only, read-only, 15-minute setup. Build the habit of asking your fleet questions through Claude before the full MCP arrives.

**For building your own MCP server:** [guides/CUSTOM_MCP_GUIDE.md](./CUSTOM_MCP_GUIDE.md)

---

---

# Part 6 — Take These Three Things Home

### 1. Try the Gem right now
[Geotab Add-In Architect Gem](https://gemini.google.com/gem/1Y6IvbBj4ALgS9G3SgGodepM2dfArInrO) — describe a fleet problem. A working MyGeotab Add-In in 10 minutes. Free, no code, no hosting. Then iterate with it — one prompt is the start, not the end.

### 2. Sign up for MCP beta
Talk to Geotab at this event. When the official MCP opens, you'll be among the first to connect your AI assistant to your live fleet.

### 3. Explore this repo
[github.com/fhoffa/geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide) — all guides, all prompts, all skills, links to all hackathon videos.

> *"You used to write instructions. Now you describe outcomes.  
> Bring your AI tools — Geotab is ready for that world."*

---

---

## Resources

| Resource | Link |
|----------|------|
| **Create a free demo database** | [my.geotab.com/registration.html](https://my.geotab.com/registration.html) |
| Geotab Add-In Architect Gem | [gemini.google.com/gem/1Y6IvbBj4ALgS9G3SgGodepM2dfArInrO](https://gemini.google.com/gem/1Y6IvbBj4ALgS9G3SgGodepM2dfArInrO) |
| Gem user guide | [guides/GOOGLE_GEM_USER_GUIDE.md](./GOOGLE_GEM_USER_GUIDE.md) |
| Gem → Claude Code bridge | [guides/GEM_TO_CLAUDE_CODE.md](./GEM_TO_CLAUDE_CODE.md) |
| Vibe guide repo | [github.com/fhoffa/geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide) |
| Official Geotab MCP (coming — sign up at event) | Talk to Geotab at Connect Europe 2026 |
| ACE-only MCP preview (works today) | [github.com/fhoffa/geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo) |
| Custom MCP server guide | [guides/CUSTOM_MCP_GUIDE.md](./CUSTOM_MCP_GUIDE.md) |
| ACE vs API comparison | [guides/DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md) |
| Hackathon intro video | [youtube.com/watch?v=BD0U9Zf-LvY](https://www.youtube.com/watch?v=BD0U9Zf-LvY) |
| FleetShield AI interview | [youtube.com/watch?v=G3A8PjtovN8](https://www.youtube.com/watch?v=G3A8PjtovN8) |
| Attrix / Last Week in Fleet | [youtube.com/watch?v=EiZsIof1Scw](https://www.youtube.com/watch?v=EiZsIof1Scw) |
| Full hackathon playlist | [youtube.com/playlist?list=PLG1fouPFF9lydA6SmkGlZbhDJyaI4MsBG](https://www.youtube.com/playlist?list=PLG1fouPFF9lydA6SmkGlZbhDJyaI4MsBG) |
| Create a free demo account | [my.geotab.com/registration.html](https://my.geotab.com/registration.html) |
| Agent skills format | [agentskills.io](https://agentskills.io) |
| MCP open standard | [modelcontextprotocol.io](https://modelcontextprotocol.io/) |

---

## Q&A Reference

**Does my team need to pay for Claude to use the MCP?**  
Not necessarily. Claude's free tier supports MCP through the desktop app via a JSON config file — but that's a developer path. Claude Pro ($20/month) adds a GUI-based integrations panel in settings, which is what most non-developer users will want.

It doesn't need to be Claude either. ChatGPT, Gemini, and [Goose](https://goose-docs.ai) (Block's free open-source agent) all support MCP. For serious work, some paid plan somewhere is likely — but that's a cost your organization is probably already evaluating for AI assistants in general, not something you're buying specifically for Geotab.

Claude is currently the most mature option for non-developer users: the integrations UI is point-and-click, no JSON editing required. The others tend to be more developer-focused. That may change — the ecosystem is moving fast.

**What about driver privacy?**  
The MCP runs against your Geotab account with the same permission model — users only see vehicles and drivers they already have access to. Your credentials are handled by the MCP server, not passed through the AI conversation.

But the more important question: the fleet data you query — driver names, locations, behavior events — will be analyzed by your AI provider. That data leaves your machine and goes to Claude, ChatGPT, Gemini, or whichever tool you're using. Make sure your organization has an account and contract with that provider that covers data handling, privacy obligations, and compliance with your applicable AI framework (GDPR, local regulations, internal policy). This isn't specific to Geotab — it applies to any business data you send to an AI assistant. The right provider contract makes this a solved problem; the wrong one makes it a liability.

**Does ACE work inside embedded Add-Ins?**  
Yes, verified. Auth comes from the MyGeotab session automatically. The async polling pattern is the critical part — the Gem handles it if you ask explicitly.

**Can I build my own MCP server for Geotab?**  
Yes. [guides/CUSTOM_MCP_GUIDE.md](./CUSTOM_MCP_GUIDE.md) covers the community approach (works now). The official Geotab MCP is the better long-term path — sign up for beta access at this event. For a quick ACE-only preview: [github.com/fhoffa/geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo).

**How do I teach my AI tool about our internal systems?**  
Same approach as this repo's skills: write a SKILL.md with your domain knowledge (API patterns, naming conventions, gotchas), commit it to GitHub, load it into your AI tool. Format: [agentskills.io](https://agentskills.io).

**How do I manage and share skills across my team?**  
A skill is just a file in a GitHub repo — manage it like any other internal documentation.

To share with your team, give them the raw GitHub URL and they load it directly:
```
Before we start, read https://raw.githubusercontent.com/your-org/your-repo/main/skills/SKILL.md
```

To keep it current: when your API or system changes, update the SKILL.md, commit, push. Everyone gets the updated version the next time they load it — no distribution step needed.

Private repos work fine for internal skills. Team members with repo access can clone it and load locally in Claude Code, or load from the raw URL if your GitHub organization allows it.

One person writes the skill once. Every AI user in your organization benefits. That's the leverage.
