# Archive — frozen previous versions of this skill

Nothing in here is maintained. Each folder is a verbatim snapshot taken **before** a major revision, kept
so the revision can be diffed, audited, or reverted.

| Folder | Skill version | Snapshot of | Why archived |
|--------|---------------|-------------|--------------|
| [`v1.1/`](v1.1/) | 1.1 | `main` @ `35a8a05` (2026-07-16), i.e. after PR #113 + the field-test follow-ups | Geotab side rewritten around the official MyGeotab MCP **data agent** (`AskDataAgent`) — see [`../CHANGES_v1.1_to_v2.0.md`](../CHANGES_v1.1_to_v2.0.md) |

Notes:
- Relative links inside an archive folder point at the *live* guides, not at the snapshot, and some are
  stale on purpose (they describe `GetAceResults`, which v1.1 treated as the only bulk channel).
- To compare: `diff -ru archive/v1.1/references references` (from the skill folder).
- Don't edit archived files. Fix forward in the live skill.
