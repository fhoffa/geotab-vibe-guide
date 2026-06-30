# Geotab Agent Skills

Agent Skills that teach AI assistants how to build fleet management applications with the Geotab API.

These skills follow the open [Agent Skills](https://agentskills.io) format — each skill is a folder with a `SKILL.md` file containing structured metadata and instructions.

## Available Skills

| Skill | Description |
|-------|-------------|
| [`geotab`](geotab/SKILL.md) | Complete Geotab development guide — Python API, MyGeotab Add-Ins, Zenith styling, Ace AI queries, driver/trip assignment |
| [`geotab-motherduck-warehouse`](geotab-motherduck-warehouse/SKILL.md) | Replicate Geotab data into a MotherDuck (DuckDB) warehouse via MCP — incremental loads, bronze/silver/gold, dedup, gap detection, backfill, and the Ace → signed-CSV-URL loop |
| [`agentic-n8n`](agentic-n8n/SKILL.md) | Build automated fleet monitoring workflows with n8n |
| [`geotab-custom-mcp`](geotab-custom-mcp/SKILL.md) | Build MCP servers for conversational fleet management via Claude Desktop |

## How to Use These Skills

### Option 1: Claude Code Plugin (Recommended)

Install all Geotab skills in Claude Code with two commands:

```
/plugin marketplace add fhoffa/geotab-vibe-guide
/plugin install geotab-skills@geotab-vibe-guide
```

That's it. Claude Code now has access to Geotab API patterns, Add-In development, n8n automation, and MCP server building.

### Option 2: Claude.ai Upload

On paid Claude.ai plans, you can upload skills as a zip via **Settings > Capabilities > Skills > Upload skill**. See [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude).

Clone the repo and zip the skill folders:

```bash
git clone https://github.com/fhoffa/geotab-vibe-guide.git
cd geotab-vibe-guide
zip -r geotab-skills.zip skills/geotab/ skills/agentic-n8n/ skills/geotab-custom-mcp/ skills/README.md
```

Then upload `geotab-skills.zip` in Claude's Skills settings — Claude handles the rest.

> **Minimal alternative:** If you just want to get started quickly, copy-paste [`SKILL.md`](geotab/SKILL.md) and [`references/API_QUICKSTART.md`](geotab/references/API_QUICKSTART.md) into your project — that covers the core API patterns.

### Option 3: Clone This Repo

```bash
git clone https://github.com/fhoffa/geotab-vibe-guide.git
```

Then reference skills in your project's `CLAUDE.md`:
```markdown
For Geotab API development, follow the instructions in:
/path/to/geotab-vibe-guide/skills/geotab/SKILL.md
```

### For Other Agents

Use the [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref) CLI to generate `<available_skills>` XML for system prompts:
```bash
skills-ref to-prompt ./skills/geotab ./skills/agentic-n8n ./skills/geotab-custom-mcp
```

## Validating Skills

Use the [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref) reference library to validate skill format:

```bash
# Install the validator
git clone https://github.com/agentskills/agentskills.git
cd agentskills/skills-ref
pip install -e .

# Validate a skill
skills-ref validate /path/to/geotab-vibe-guide/skills/geotab
skills-ref validate /path/to/geotab-vibe-guide/skills/agentic-n8n
skills-ref validate /path/to/geotab-vibe-guide/skills/geotab-custom-mcp
```

## Skill Format

Each skill follows the [Agent Skills specification](https://agentskills.io/specification):

```
skill-name/
  SKILL.md          # Required: YAML frontmatter + markdown instructions
  references/       # Optional: supporting docs loaded on demand
  scripts/          # Optional: executable scripts
  assets/           # Optional: images, templates, etc.
```

The `SKILL.md` frontmatter requires `name` and `description`:

```yaml
---
name: skill-name
description: What this skill does and when to use it.
license: Apache-2.0
metadata:
  author: Your Name
  version: "1.0"
---
```

## Planning More Skills

See [SKILLS_TODO.md](SKILLS_TODO.md) for planned skills including trip analysis, safety scoring, predictive maintenance, and more.
