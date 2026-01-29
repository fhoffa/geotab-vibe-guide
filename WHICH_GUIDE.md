# Which Guide Do I Need?

Quick navigation to the right resource for your needs.

## For Humans

| Situation | Use This | Why |
|-----------|----------|-----|
| Complete beginner | [BEGINNER_GLOSSARY.md](./guides/BEGINNER_GLOSSARY.md) | Explains GitHub, Python, APIs, vibe coding, and all terms used in these guides |
| Using Claude on web | [INSTANT_START_WITH_CLAUDE.md](./guides/INSTANT_START_WITH_CLAUDE.md) | Zero to working code in 60 seconds |
| Using Google Gemini | [GOOGLE_GEM_USER_GUIDE.md](./guides/GOOGLE_GEM_USER_GUIDE.md) | Generate Add-Ins via the Geotab Add-In Architect Gem |
| Want ready-made prompts | [CLAUDE_PROMPTS.md](./guides/CLAUDE_PROMPTS.md) | 10+ copy-paste prompts for instant productivity |
| First time here | [INSTANT_START_WITH_CLAUDE.md](./guides/INSTANT_START_WITH_CLAUDE.md) | The fastest path - start here! |
| **Building a MyGeotab Add-In** | [GEOTAB_ADDINS.md](./guides/GEOTAB_ADDINS.md) | **Custom pages inside MyGeotab** |
| What is Geotab? | [GEOTAB_OVERVIEW.md](./GEOTAB_OVERVIEW.md) | Platform overview, 6 pillars, use cases, write-back capabilities |
| Setting up credentials | [CREDENTIALS.md](./guides/CREDENTIALS.md) | Concise .env setup |
| Credential issues | [CREDENTIALS.md](./guides/CREDENTIALS.md) | Detailed troubleshooting |
| Teaching workshop | [TUTORIAL_DESIGN.md](./guides/TUTORIAL_DESIGN.md) | Full curriculum design |
| Running workshop | [MINUTE_BY_MINUTE.md](./guides/MINUTE_BY_MINUTE.md) | Step-by-step timing |
| Need project ideas | [HACKATHON_IDEAS.md](./guides/HACKATHON_IDEAS.md) | 20+ hackathon projects |
| Advanced integrations | [ADVANCED_INTEGRATIONS.md](./guides/ADVANCED_INTEGRATIONS.md) | MCP servers, voice interfaces, AI content generation |
| Writing prompts | [CLAUDE_PROMPTS.md](./guides/CLAUDE_PROMPTS.md) | AI prompt templates |

## For AI Coding Tools

| Situation | Use This | Tokens | Why |
|-----------|----------|--------|-----|
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
│  ├─ Using Claude on the web?
│  │  └─> INSTANT_START.md (60 seconds to working code!)
│  │
│  ├─ Using Google Gemini?
│  │  └─> GOOGLE_GEM_USER_GUIDE.md (generate Add-Ins with the Gem!)
│  │
│  ├─ Just getting started?
│  │  └─> INSTANT_START.md (fastest) or QUICKSTART.md (local setup)
│  │
│  ├─ Teaching a workshop?
│  │  └─> TUTORIAL_DESIGN.md → MINUTE_BY_MINUTE.md
│  │
│  └─ Building a project?
│      │
│      ├─ Standalone Python app? (dashboards, reports, data analysis)
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

1. **Always load**: VIBE_CODING_CONTEXT.md (~400 tokens) - Essential patterns & reference
2. **Don't load**: API_REFERENCE_FOR_AI.md, CREDENTIALS.md - Retrieve specific sections only if needed

## How Instructors Use These

**Pre-workshop:**
1. Share INSTANT_START_WITH_CLAUDE.md or CREDENTIALS.md with participants
2. Review TUTORIAL_DESIGN.md for philosophy
3. Practice with MINUTE_BY_MINUTE.md

**During workshop:**
1. Present from MINUTE_BY_MINUTE.md
2. Share VIBE_CODING_CONTEXT.md for AI tool users
3. Share CLAUDE_PROMPTS.md for prompting help

**After workshop:**
1. Share HACKATHON_IDEAS.md for inspiration
2. Point to CREDENTIALS.md for troubleshooting
3. Reference RESOURCES.md for continued learning
