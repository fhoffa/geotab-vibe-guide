# Agent Summary (Source of Truth)

Use this file as the quickest orientation for AI coding assistants working in this repository.

## What this repository is

Educational starter kit for building Geotab fleet apps with AI-assisted "vibe coding." Content is split between:

- `guides/`: human-facing tutorials and conceptual walkthroughs.
- `skills/`: implementation-oriented skill packs and references for coding agents.

## Canonical entry points

| Need | Use this file first | Then go to |
|---|---|---|
| Fast session bootstrap | `VIBE_CODING_CONTEXT.md` | `guides/GEOTAB_API_REFERENCE.md` or `guides/API_REFERENCE_FOR_AI.md` |
| Build code with agent skills | `skills/README.md` | Selected `skills/*/SKILL.md` + only needed `references/*` file(s) |
| Human-oriented onboarding/navigation | `README.md` | `WHICH_GUIDE.md` and `guides/README.md` |
| Add-In implementation | `guides/GEOTAB_ADDINS.md` | `examples/addins/README.md` |


## Skill-first workflow (important)

When a task needs implementation depth, route through the skill system first:

1. Open `skills/README.md` to choose the right skill.
2. Start with `skills/geotab/SKILL.md` for broad Geotab API work.
3. For focused Add-In work, load `skills/geotab/references/ADDINS.md` (and related Add-In references) from the `geotab` skill.
4. Use `skills/agentic-n8n/SKILL.md` for automation workflows.
5. Use `skills/geotab-custom-mcp/SKILL.md` for MCP server work.

Prefer loading the selected `SKILL.md` and only the specific reference file needed for the active task.

## Critical implementation rules

1. Never hardcode credentials.
2. Use `.env` + `python-dotenv`; call `load_dotenv()` before reading env vars.
3. Test authentication once before loops (failed auth can lock the account temporarily).
4. For Add-Ins, keep compatibility constraints in mind (ES5 patterns and required callback usage).

## Navigation strategy for agents

1. Load **only** `VIBE_CODING_CONTEXT.md` first to keep context small.
2. Pull in one deeper file based on the immediate task (API reference, Add-In guide, or selected skill reference).
3. Avoid broad multi-file loads unless the task explicitly requires cross-doc synthesis.

## Maintenance notes

- If top-level paths or examples change, update this file and `WHICH_GUIDE.md` in the same PR.
- Treat this file as a compact index, not a long tutorial.
