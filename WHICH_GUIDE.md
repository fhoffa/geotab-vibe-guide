# Which Guide Do I Need?

Quick navigation to the right resource for your needs.

## For Humans

| Situation | Use This | Why |
|-----------|----------|-----|
| **Easiest path (Try this first!)** | [GOOGLE_GEM_USER_GUIDE.md](./guides/GOOGLE_GEM_USER_GUIDE.md) | **Zero coding required - build Add-Ins by describing (or drawing) what you want!** |
| Complete beginner | [BEGINNER_GLOSSARY.md](./guides/BEGINNER_GLOSSARY.md) | Explains GitHub, APIs, vibe coding, and all terms used in these guides |
| Using Claude on web | [INSTANT_START_WITH_CLAUDE.md](./guides/INSTANT_START_WITH_CLAUDE.md) | Zero to working code in 60 seconds |
| Want ready-made prompts | [CLAUDE_PROMPTS.md](./guides/CLAUDE_PROMPTS.md) | 10+ copy-paste prompts for instant productivity |
| **Building a MyGeotab Add-In** | [GEOTAB_ADDINS.md](./guides/GEOTAB_ADDINS.md) | **Custom pages inside MyGeotab** |
| What is Geotab? | [GEOTAB_OVERVIEW.md](./GEOTAB_OVERVIEW.md) | Platform overview, 6 pillars, use cases, write-back capabilities |
| Setting up credentials | [CREDENTIALS.md](./guides/CREDENTIALS.md) | Concise .env setup |
| Credential issues | [CREDENTIALS.md](./guides/CREDENTIALS.md) | Detailed troubleshooting |
| Teaching workshop | [TUTORIAL_DESIGN.md](./guides/TUTORIAL_DESIGN.md) | Full curriculum design |
| Running workshop | [slides/README.md](./slides/README.md) | Slides + facilitator notes |
| Need project ideas | [HACKATHON_IDEAS.md](./guides/HACKATHON_IDEAS.md) | 20+ hackathon projects |
| Advanced integrations | [ADVANCED_INTEGRATIONS.md](./guides/ADVANCED_INTEGRATIONS.md) | MCP servers, voice interfaces, AI content generation |
| **Building MCP server** | [CUSTOM_MCP_GUIDE.md](./guides/CUSTOM_MCP_GUIDE.md) | **Conversational fleet access via Claude Desktop** |
| Writing prompts | [CLAUDE_PROMPTS.md](./guides/CLAUDE_PROMPTS.md) | AI prompt templates |

## For AI Coding Tools

| Situation | Use This | Tokens | Why |
|-----------|----------|--------|-----|
| Repo orientation (best first step) | [AGENT_SUMMARY.md](./AGENT_SUMMARY.md) | ~250 | Canonical map of entry points and rules |
| Choosing implementation skill | [skills/README.md](./skills/README.md) | ~600 | Pick the right skill and loading strategy |
| Starting/Coding session | [VIBE_CODING_CONTEXT.md](./VIBE_CODING_CONTEXT.md) | ~400 | Session context & reference |
| Looking up API details | [GEOTAB_API_REFERENCE.md](./guides/GEOTAB_API_REFERENCE.md) | ~300 | One-page API card |
| Need full examples | [API_REFERENCE_FOR_AI.md](./guides/API_REFERENCE_FOR_AI.md) | ~800 | Complete API patterns for AI tools |

## Quick Decision Tree

```
Are you a human or AI tool?
│
├─ HUMAN
│  │
│  ├─ Complete beginner? (New to coding, GitHub, APIs, etc.)
│  │  └─> BEGINNER_GLOSSARY.md (learn all the terms first!)
│  │
│  ├─ Want to create your first Geotab add-in in 15 seconds?
│  │  └─> GOOGLE_GEM_USER_GUIDE.md (generate Add-Ins with the Gem - NO CODE!)
│  │
│  ├─ Using Claude?
│  │
│  ├─ Just getting started?
│  │  └─> INSTANT_START_WITH_CLAUDE.md (fastest) or API_REFERENCE_FOR_AI.md (local setup)
│  │
│  ├─ Teaching a workshop?
│  │  └─> TUTORIAL_DESIGN.md → slides/README.md
│  │
│  └─ Building a project?
│      │
│      ├─ Standalone dashboard app? (reports, maps, data analysis)
│      │  └─> INSTANT_START_WITH_CLAUDE.md → HACKATHON_IDEAS.md → CLAUDE_PROMPTS.md
│      │
│      ├─ Custom page IN MyGeotab? (extend the interface)
│      │  └─> GEOTAB_ADDINS.md → TRANSFORM_ADDIN_ZENITH.md (for styling)
│      │
│      └─ Quick Add-In without coding? (Google Gemini users)
│         └─> GOOGLE_GEM_USER_GUIDE.md
│
└─ AI TOOL
   │
   ├─ Starting session?
   │  └─> VIBE_CODING_CONTEXT.md (paste as context)
   │
   └─ Need API details?
      └─> GEOTAB_API_REFERENCE.md (lookup)
```

## Token Budget Guide for AI Tools

If you need to minimize context size:

1. **Always load**: AGENT_SUMMARY.md (~250 tokens) - Canonical orientation
2. **Choose skill early**: skills/README.md (~600 tokens) - Route to correct `skills/*/SKILL.md`
3. **Then load**: VIBE_CODING_CONTEXT.md (~400 tokens) - Essential patterns & reference
4. **Don't load fully**: API_REFERENCE_FOR_AI.md, CREDENTIALS.md - Retrieve specific sections only if needed

## How Instructors Use These

**Pre-workshop:**
1. Share GOOGLE_GEM_USER_GUIDE.md (easiest) or INSTANT_START_WITH_CLAUDE.md with participants
2. Review TUTORIAL_DESIGN.md for philosophy
3. Practice with slides/README.md

**During workshop:**
1. Present from slides/README.md
2. Share VIBE_CODING_CONTEXT.md for AI tool users
3. Share CLAUDE_PROMPTS.md for prompting help

**After workshop:**
1. Share HACKATHON_IDEAS.md for inspiration
2. Point to CREDENTIALS.md for troubleshooting
3. Reference RESOURCES.md for continued learning
