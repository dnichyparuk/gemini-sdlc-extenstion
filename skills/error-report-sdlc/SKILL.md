---
name: error-report-sdlc
description: "Internal skill for reporting actionable SDLC errors to GitHub. Captures context, gets user consent, and creates tracking issues in rnagrodzki/sdlc-marketplace. NOT user-invocable."
user-invocable: false
disable-model-invocation: true
---

# Error-to-GitHub Issue Proposal

Internal procedure invoked by SDLC skills when an actionable error occurs.
Captures error context, verifies gh CLI availability, gets user consent, and
creates a tracking issue in `rnagrodzki/sdlc-marketplace`.

## Procedure

### Step 2 — Consent Gate 1: Offer (main context)

Use `ask_user`: **dispatch error-report-sdlc** | **cancel**.

### Step 3 — Run the Prepare Script (main context)

```bash
SCRIPT="scripts/skill/error-report-prepare.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT. Is the sdlc extension installed?" >&2; exit 2; }

ERROR_CONTEXT_FILE=$(node "$SCRIPT" \
  --skill "$SKILL_NAME" \
  --step "$STEP_NAME" \
  --operation "$OPERATION" \
  --error-text "$ERROR_TEXT" \
  --output-file)
EXIT_CODE=$?
# Single canonical cleanup
trap 'rm -f "$ERROR_CONTEXT_FILE"' EXIT INT TERM
```

### Step 4 — Dispatch the error-report-orchestrator Agent

Use the `invoke_agent` tool with `agent_name: error-report-orchestrator`.
Capture the returned JSON object as `PROPOSAL = { title, body }`.

### Step 5 — Consent Gate 2: Review (main context)

Use `ask_user` for the `yes / edit / cancel` choice.

### Step 6 — Create the GitHub Issue (main context)

```bash
gh issue create \
  --repo "rnagrodzki/sdlc-marketplace" \
  --title "$PROPOSAL_TITLE" \
  --body "$PROPOSAL_BODY" \
  --label "tooling-error" \
  --label "$SKILL_NAME"
```
