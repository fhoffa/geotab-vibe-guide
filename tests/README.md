# Tests

Validation tests for the Geotab Vibe Guide project. Each subdirectory is an independent test suite.

## Available Test Suites

### `gem-validation/`

Validates JSON configurations produced by the **Geotab Add-In Architect** Gem against the rules in [`resources/GEM_INSTRUCTIONS.txt`](../resources/resources/GEM_INSTRUCTIONS.txt) (see also [`guides/GOOGLE_GEM_CREATOR_GUIDE.md`](../guides/GOOGLE_GEM_CREATOR_GUIDE.md)).

**Run:**
```bash
bash tests/gem-validation/run.sh
```

**Validate your own Gem output:**
```bash
# Paste Gem JSON into a file, then:
node tests/gem-validation/validate.js my-addin.json
```

**Checks performed:**
| # | Check | What it catches |
|---|-------|-----------------|
| 1 | Required fields | Missing name, version, items, files, supportEmail |
| 2 | supportEmail | Using support@geotab.com (not allowed for custom Add-Ins) |
| 3 | Name characters | Disallowed chars like &, +, !, @ |
| 4 | Path trailing slash | `"ActivityLink/"` instead of `"ActivityLink"` |
| 5 | callback() | Missing `callback()` call in initialize (hangs the Add-In) |
| 6 | No style tags | `<style>` blocks (stripped by MyGeotab) |
| 7 | TypeName correctness | `"Driver"` or `"Vehicle"` instead of `"User"` / `"Device"` |
| 8 | Registration pattern | `}()` invocation instead of `};` assignment |
| 9 | Debug log | Missing debug-log toggle div |
| 10 | Clickable vehicle links | Listing devices without `window.parent.location.hash` navigation |
| 11 | Variable declarations | Undeclared variables (missing var/let/const) |

**Fixtures:**
- `fixtures/pass-*.json` — configs that should pass all checks
- `fixtures/fail-*.json` — configs that should fail on a specific check (noted in `_comment`)

### `ev-fuel-tracker/`

Validates the EV Mix and Fuel Tracker add-in (`examples/addins/ev-fuel-tracker/`).

**Run:**
```bash
bash tests/ev-fuel-tracker/run.sh
```

**Two suites in one script:**
1. **Config JSON checks** — verifies the install config uses the external-hosted format (absolute HTTPS URL, no `files` property, no trailing slash on path, etc.)
2. **HTML checks** — verifies the add-in HTML follows Geotab rules: `callback()` called, no `<style>` tags, clickable vehicle names via `window.parent.location.hash`, correct diagnostic IDs, debug panel, filter buttons

**Fixtures:**
- `fixtures/pass-config.json` — valid config (should pass all checks)
- `fixtures/fail-embedded-files.json` — config with `files` property (wrong for external-hosted)
- `fixtures/fail-relative-url.json` — relative URL instead of absolute GitHub Pages URL
- `fixtures/fail-trailing-slash.json` — path ends with `/`

### `gem-review/`

LLM-oriented review checklist for the Gem instructions. Not code — a set of 17 questions an AI assistant (or human) should answer after editing `resources/GEM_INSTRUCTIONS.txt`. Covers behavioral expectations ("would the Gem make vehicle names clickable?"), technical correctness, completeness, and tone.

**Run:** Read `tests/gem-review/REVIEW_CHECKLIST.md` and verify each question against `resources/GEM_INSTRUCTIONS.txt`.

## Adding New Test Suites

Create a new subdirectory with its own `run.sh` (for coded tests) or a checklist markdown file (for LLM review). Keep coded tests zero-dependency (Node.js only, no npm install).
