---
name: setup-sdlc
description: "Use this skill when setting up the SDLC plugin for a project, initializing configuration, or when any skill reports missing config. Renders a selective-section menu so users choose which sections to configure; each selected section prints a verbose header before any prompt. Supports direct sub-flow entry via --only, --dimensions, --pr-template, --guardrails, --execution-guardrails, --openspec-enrich. Arguments: [--migrate] [--skip <section>] [--force] [--only <ids>] [--dimensions] [--pr-template] [--guardrails] [--execution-guardrails] [--openspec-enrich] [--remove-openspec] [--add] [--no-copilot]"
user-invocable: true
argument-hint: "[--migrate] [--skip <section>] [--force] [--only <ids>] [--dimensions] [--pr-template] [--guardrails] [--execution-guardrails] [--openspec-enrich] [--remove-openspec] [--add] [--no-copilot]"
---

# SDLC Setup

Unified setup skill that replaces the fragmented first-use experience. Detects existing
configuration, migrates legacy files, walks the user through missing sections, and
delegates content creation to specialized sub-files.

**Announce at start:** "I'm using setup-sdlc (sdlc v{sdlc_version})." -- extract the version from the `sdlc:` line in the session-start system-reminder.

---

## Plan Mode Check

If the system context contains "Plan mode is active":

1. Announce: "This skill requires write operations. Exit plan mode first, then re-invoke `/setup-sdlc`."
2. Stop. Do not proceed to subsequent steps.

---

## Workflow

### Step 0 -- Pre-flight

Run `scripts/skill/setup.js` via Bash to get current state:

> **VERBATIM** -- Run this bash block exactly as written.

```bash
SCRIPT="scripts/skill/setup.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT. Is the sdlc extension installed?" >&2; exit 2; }

PREPARE_OUTPUT_FILE=$(node "$SCRIPT" --output-file)
EXIT_CODE=$?
# Single canonical cleanup
trap 'rm -f "$PREPARE_OUTPUT_FILE"' EXIT INT TERM
```

Read and parse `PREPARE_OUTPUT_FILE`.

### Step 1 -- Selective-Section Menu

If `--only` or sub-flow flags (`--dimensions`, etc.) are passed, use those sections. Otherwise, render a multi-select menu from `prepare.sections[]`.

### Step 2 -- Migration

If legacy files are detected, use `ask_user`:
> Legacy config files detected. Migrate to unified config before proceeding?

On **yes**: Run migration via inline Node.js.

### Step 3 -- Dispatch Loop

For each selected section:

#### A. Header
Print the section purpose and files modified.

#### B. Scan Phase
Search the codebase for relevant patterns (e.g., Jira keys, version files).

#### C. Interactive Walkthrough
Follow the specific sub-file for the section:
- `version` → follows `scripts/lib/version.js` logic
- `ship` → follows `scripts/util/ship-init.js` logic
- `jira` → follows `scripts/skill/jira.js` logic
- `review` → follows `skills/setup-sdlc/setup-dimensions.md`
- `commit` → follows regex building logic
- `pr` → follows `skills/setup-sdlc/setup-pr-template.md` and `setup-pr-labels.md`

#### D. Review and Write
Show proposed config. Use `ask_user` for approval. Then call `scripts/util/setup-init.js`.

---

## See Also

- [`/version-sdlc`](../version-sdlc/SKILL.md)
- [`/ship-sdlc`](../ship-sdlc/SKILL.md)
- [`/review-sdlc`](../review-sdlc/SKILL.md)
- [`/jira-sdlc`](../jira-sdlc/SKILL.md)
