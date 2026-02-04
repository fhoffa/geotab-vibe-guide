# Creating Agent Skills - Hackathon Guide

## Documentation Philosophy: Guides vs. Skills

**This repository separates content into two types:**

| **Guides** (`guides/`) | **Skills** (`skills/`) |
|------------------------|------------------------|
| Conversational and prompt-focused | Technical code and patterns |
| Teach humans how to describe what they want | Teach AI how to implement it correctly |
| Full of example prompts to copy-paste | Full of working code examples |
| Explain concepts and "why" | Define patterns and "how" |
| User-facing documentation | AI-facing reference material |

**When writing guides:**
- Focus on prompts users can give to AI
- Explain what's possible and when to use it
- Keep code minimal - reference skills for details
- Be conversational, not technical

**When writing skills:**
- Include complete, working code patterns
- Document technical gotchas and edge cases
- Make examples copy-pasteable
- Be precise and implementation-focused

**Example:** The Add-In navigation pattern...
- **Guide says:** "Tell your AI: Make the vehicle names clickable so they navigate to the vehicle's page."
- **Skill contains:** The actual JavaScript code pattern with `window.parent.location.hash`

---

## What Are Agent Skills?

Agent Skills is an **open standard** for packaging specialized knowledge and workflows that AI assistants can use across platforms. Think of skills as reusable AI plugins that work with Claude, GitHub Copilot, VS Code, Cursor, and other AI tools.

**Perfect for Hackathons:** Skills let you create portable AI tools that anyone can use to quickly build Geotab integrations.

## Why Create Skills at This Hackathon?

Creating Agent Skills during the hackathon is valuable because:

1. **Portable Knowledge** - Skills work across AI platforms (Claude Code, VS Code Copilot, GitHub Copilot, etc.)
2. **Reusable** - Package your Geotab expertise once, use it everywhere
3. **Shareable** - Other developers can instantly benefit from your knowledge
4. **Competitive Advantage** - Judges love innovative tooling that helps the whole ecosystem
5. **Quick Value** - Can be built in 2-4 hours alongside your main project

## The Agent Skills Standard

The specification is delightfully tiny - you can read it in minutes at [agentskills.io/specification](https://agentskills.io/specification).

### Basic Structure

A skill is a directory containing at minimum a `SKILL.md` file:

```
my-skill/
├── SKILL.md          # Required - the skill instructions
├── scripts/          # Optional - helper scripts
├── references/       # Optional - documentation, examples
└── assets/          # Optional - images, templates
```

### SKILL.md Format

Every skill has YAML frontmatter + Markdown content:

```markdown
---
name: skill-name
description: Clear description of what the skill does and when to use it
---

# Your Instructions Here

Provide clear, detailed instructions that help AI assistants accomplish the task.
Include examples, common patterns, and gotchas to avoid.
```

**Critical:** The `description` field is how AI assistants decide when to use your skill. Make it specific and trigger-focused.

## Geotab Skills You Can Build

### High-Value Skills for Fleet Managers

#### 1. **geotab-api-quickstart**
Teaches AI how to authenticate and make basic Geotab API calls.

**Value:** Every project needs this. Make it the foundation.

```yaml
---
name: geotab-api-quickstart
description: Authenticate with Geotab API and fetch basic fleet data (devices, trips, drivers). Use when someone wants to connect to MyGeotab or fetch fleet information.
---
```

**Content should include:**
- Authentication patterns (username, password, database)
- Common API methods (Get Device, Trip, Driver)
- Error handling
- Sample code in Python and JavaScript

---

#### 2. **geotab-trip-analysis**
Specialized knowledge for analyzing trip data - fuel efficiency, routes, idle time.

```yaml
---
name: geotab-trip-analysis
description: Analyze trip data from Geotab API to calculate fuel efficiency, identify inefficient routes, and detect excessive idle time. Use when building fleet optimization or reporting features.
---
```

**Content should include:**
- Trip data structure
- Calculating fuel consumption
- Idle time patterns
- Route efficiency metrics
- Example queries

---

#### 3. **geotab-safety-scoring**
Build driver safety scorecards using exception events.

```yaml
---
name: geotab-safety-scoring
description: Calculate driver safety scores from Geotab exception events (speeding, harsh braking, acceleration). Use when building safety dashboards or driver coaching tools.
---
```

**Content should include:**
- ExceptionEvent types
- Safety metrics calculation
- Scoring algorithms
- Benchmarking against fleet average
- Example code for scorecards

---

#### 4. **geotab-addin-builder**
Your existing Add-In knowledge, formatted as a skill.

```yaml
---
name: geotab-addin-builder
description: Build custom Add-Ins for MyGeotab interface with external hosting. Use when extending MyGeotab UI with custom dashboards or tools.
---
```

See [skills/geotab-addins/SKILL.md](../skills/geotab-addins/SKILL.md) for the full implementation.

---

#### 5. **geotab-ace-integration**
Teach AI how to use Geotab Ace for natural language queries.

```yaml
---
name: geotab-ace-integration
description: Integrate Geotab Ace API for natural language queries about fleet data. Use when building conversational interfaces or chat-based fleet tools.
---
```

**Content should include:**
- Ace API authentication
- Sending natural language queries
- Processing responses
- Best practices for prompts
- Multi-turn conversations

---

#### 6. **geotab-predictive-maintenance**
Package predictive maintenance patterns.

```yaml
---
name: geotab-predictive-maintenance
description: Monitor engine diagnostics and predict maintenance needs using FaultData and StatusData from Geotab. Use when building maintenance scheduling or vehicle health monitoring.
---
```

**Content should include:**
- FaultData structure
- Critical fault codes
- StatusData diagnostics
- Prediction patterns
- Alert thresholds

---

#### 7. **geotab-geofence-management**
Create and manage zones programmatically.

```yaml
---
name: geotab-geofence-management
description: Create, update, and manage geofences (zones) in Geotab. Use when building location-based features or automated zone creation.
---
```

**Content should include:**
- Zone API usage
- Polygon creation
- Address geocoding
- Zone triggers and alerts

---

## How to Create a Skill in 30 Minutes

### Step 1: Pick Your Topic (5 min)

Choose knowledge you have that would help others:
- Geotab API patterns you've discovered
- Common workflows you've automated
- Integration techniques that work well
- Debugging strategies

### Step 2: Create the Directory Structure (2 min)

```bash
mkdir -p skills/your-skill-name
cd skills/your-skill-name
touch SKILL.md
```

### Step 3: Write the Frontmatter (3 min)

```yaml
---
name: your-skill-name
description: [What does it do?] [When should it be used?]
---
```

**Pro tip:** Spend time on the description. Make it trigger-rich with specific keywords AI assistants will match against user requests.

### Step 4: Write Clear Instructions (15 min)

Structure your content:

```markdown
## Purpose
Quick overview of what this skill teaches.

## When to Use This Skill
Specific scenarios where this knowledge applies.

## Core Concepts
Key knowledge needed to understand the topic.

## Step-by-Step Patterns

### Pattern 1: [Common Task]
```[language]
[code example]
```

**Explanation:** Why this works and when to use it.

### Pattern 2: [Another Task]
...

## Common Mistakes to Avoid

❌ **Mistake:** What people do wrong
✅ **Solution:** How to do it right

## Complete Working Example
[Full code that actually works]

## References
- Link to official docs
- Related resources
```

### Step 5: Test It (5 min)

Ask Claude Code to use your skill:

```
Using the [skill-name] skill, help me [task that skill covers]
```

Iterate based on what the AI does. Did it understand? Did it use the patterns correctly?

## Advanced: Adding Supporting Files

### scripts/

Add helper scripts that your skill references:

```
skills/geotab-trip-analyzer/
├── SKILL.md
└── scripts/
    ├── fetch_trips.py
    └── calculate_efficiency.py
```

Reference them in your skill:

```markdown
Use the reference implementation in `scripts/fetch_trips.py` to see working code.
```

### references/

Include documentation, API examples, or sample responses:

```
skills/geotab-api-quickstart/
├── SKILL.md
└── references/
    ├── sample_device_response.json
    └── authentication_flow.md
```

### assets/

Add diagrams, architecture images, or templates:

```
skills/geotab-addin-builder/
├── SKILL.md
└── assets/
    └── addin-lifecycle-diagram.png
```

## Distribution & Sharing

### Option 1: Include in Your Hackathon Repo

```
my-hackathon-project/
├── src/
├── skills/          # Your custom skills here
│   └── my-skill/
│       └── SKILL.md
└── README.md
```

### Option 2: Publish to GitHub

Create a dedicated skills repository:

```
geotab-agent-skills/
├── skills/
│   ├── geotab-api-quickstart/
│   ├── geotab-trip-analysis/
│   └── geotab-safety-scoring/
└── README.md
```

Others can use your skills by pointing their AI tools to your repo.

### Option 3: Submit to Anthropic's Skills Repository

Contribute to the official collection:
- [github.com/anthropics/skills](https://github.com/anthropics/skills)

## Tips for Great Skills

### ✅ Do:
- Use real, working code examples
- Include error handling
- Show common patterns AND edge cases
- Explain WHY not just HOW
- Keep it under 500 lines
- Test with actual AI assistants
- Use specific, trigger-rich descriptions

### ❌ Don't:
- Write vague instructions
- Skip error handling examples
- Assume knowledge without explaining
- Create overly complex mega-skills
- Forget to test it
- Use generic descriptions

## Hackathon Strategy: Skills First

**Unconventional approach that works:**

1. **Hour 0-1:** Build your foundational skill (e.g., geotab-api-quickstart)
2. **Hour 2-3:** Use that skill with AI to build your main project 10x faster
3. **Hour 4-5:** Extract patterns from your project into 2-3 more skills
4. **Hour 6:** Polish your main demo
5. **Demo:** Show both your app AND the skills that make building it easy

**Why this works:**
- Skills = force multiplier for your development
- Judges see tooling innovation
- You create lasting value beyond just one app
- If your main project hits issues, you still have valuable skills to demo

## Example Skill Showcase

### Show judges this workflow:

**"Here's a Geotab trip analysis dashboard I built in 4 hours."**

**"But the real innovation is these 3 Agent Skills I created that let ANYONE build this in 30 minutes:"**

1. `geotab-trip-analysis` - Trip data patterns
2. `geotab-chart-builder` - Visualizing fleet data
3. `geotab-deployment` - Deploying Geotab Add-Ins

**"Let me demo using these skills with Claude Code to rebuild a feature from scratch..."**

[Live code with AI using your skills - takes 5 minutes to build something that would normally take an hour]

## Getting Started Right Now

### Quick Start Template

```bash
# Create your first skill
mkdir -p skills/my-geotab-skill
cd skills/my-geotab-skill

cat > SKILL.md << 'EOF'
---
name: my-geotab-skill
description: [Your description here - be specific!]
---

# [Skill Name]

## Purpose
[What this skill teaches]

## Core Knowledge
[Key concepts]

## Working Example
```python
# Your working code here
```

## Common Mistakes
❌ **Wrong:** [What not to do]
✅ **Right:** [What to do instead]
EOF
```

### Test It

Ask Claude Code:

```
I want to use the skill I just created. Read skills/my-geotab-skill/SKILL.md
and help me [task the skill covers].
```

## Resources & Learning

**Agent Skills Specification:**
- [agentskills.io/specification](https://agentskills.io/specification)
- [github.com/agentskills/agentskills](https://github.com/agentskills/agentskills)

**Examples:**
- [github.com/anthropics/skills](https://github.com/anthropics/skills)
- [Anthropic's skill-creator skill](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)

**Platform Support:**
- Claude Code (CLI)
- VS Code Copilot
- GitHub Copilot
- Google Antigravity
- Cursor
- OpenCode
- Letta

**Geotab Resources:**
- [API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [SDK Guides](https://geotab.github.io/sdk/software/guides/)

---

## Your Hackathon TODO List

**Skills to Build This Weekend:**

### Essential Skills (Build These First)
- [ ] `geotab-api-quickstart` - Authentication and basic API usage
- [ ] `geotab-trip-analysis` - Trip data analysis patterns
- [ ] `geotab-addin-builder` - Building MyGeotab Add-Ins (already started in skills/geotab-addins/)

### High-Value Skills (Pick 2-3)
- [ ] `geotab-ace-integration` - Using Geotab Ace API
- [ ] `geotab-safety-scoring` - Driver safety metrics
- [ ] `geotab-predictive-maintenance` - Fault code analysis
- [ ] `geotab-geofence-management` - Zone creation and management
- [ ] `geotab-data-visualization` - Chart patterns for fleet data
- [ ] `geotab-report-builder` - Automated reporting patterns

### Innovation Skills (Bonus Points)
- [ ] `geotab-voice-commands` - Voice-controlled fleet queries
- [ ] `geotab-ai-insights` - Integrating LLMs with fleet data
- [ ] `geotab-custom-mcp` - Building Model Context Protocol servers
- [ ] `geotab-webhook-automation` - Event-driven fleet automations

**Remember:** Even creating 2-3 solid skills is hackathon-worthy! Quality over quantity.

---

*Skills are the future of AI-assisted development. Build skills at this hackathon and you're not just creating a project—you're building infrastructure for the entire Geotab developer ecosystem.*

## Sources

This guide is based on the Agent Skills open standard:
- [Specification - Agent Skills](https://agentskills.io/specification)
- [GitHub - agentskills/agentskills](https://github.com/agentskills/agentskills)
- [skills/spec/agent-skills-spec.md at main · anthropics/skills](https://github.com/anthropics/skills/blob/main/spec/agent-skills-spec.md)
- [Agent Skills - Simon Willison](https://simonwillison.net/2025/Dec/19/agent-skills/)
- [Use Agent Skills in VS Code](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [Authoring Google Antigravity Skills](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)
- [Google Antigravity Skills Documentation](https://antigravity.google/docs/skills)
- [skills/skills/skill-creator/SKILL.md at main · anthropics/skills](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)
