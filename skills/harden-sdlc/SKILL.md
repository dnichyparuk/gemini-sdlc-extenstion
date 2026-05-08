---
name: harden-sdlc
description: "Use this skill after an SDLC pipeline failure to analyze hardening surfaces (plan and execute guardrails, review dimensions, copilot instructions) and propose user-approved edits that would prevent the same class of failure next time. Strengthen-only in v1 — never relaxes or removes existing rules. Required arguments: --failure-text <string> --skill <caller-name>. Optional: --step, --operation, --exit-code, --error-type, --user-intent, --args-string. Triggers on: harden, strengthen guardrails, prevent this failure, learn from this failure, after pipeline failure."
user-invocable: true
argument-hint: "--failure-text <text> --skill <name> [--step <s>] [--operation <op>]"
---

# Hardening After a Pipeline Failure

This skill runs after an SDLC pipeline failure to propose user-approved edits to
the project's hardening surfaces (plan guardrails, execute guardrails, review
dimensions, copilot instructions) so the same class of failure is caught earlier
next time.

**Announce at start:** "I'm using harden-sdlc (sdlc v{sdlc_version})." — extract the version from the `sdlc:` line in the session-start system-reminder.

---

## Step 0 — Parse Arguments

Required CLI flags: `--failure-text`, `--skill`. Optional: `--step`,
`--operation`, `--exit-code`, `--error-type`, `--user-intent`, `--args-string`.

---

## Step 1 — CONSUME: Run the Prepare Script

> **VERBATIM** — Run this bash block exactly as written.

```bash
SCRIPT="scripts/skill/harden-prepare.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT. Is the sdlc extension installed?" >&2; exit 2; }

MANIFEST_FILE=$(node "$SCRIPT" \
  --failure-text "$FAILURE_TEXT" \
  --skill "$SKILL_NAME" \
  --step "$STEP_NAME" \
  --operation "$OPERATION" \
  --exit-code "$EXIT_CODE_ARG" \
  --error-type "$ERROR_TYPE" \
  --user-intent "$USER_INTENT" \
  --args-string "$ARGS_STRING" \
  --output-file)
EXIT_CODE_PREPARE=$?
# Single canonical cleanup
trap '[ -n "$MANIFEST_FILE" ] && rm -f "$MANIFEST_FILE"' EXIT INT TERM
```

---

## Step 2 — CLASSIFY: Surface the Failure Classification

Read **only** the `failure.*` and `classification_hint` fields from
`MANIFEST_FILE`. Display a short preview to the user.

---

## Step 3 — ANALYZE: Dispatch the harden-orchestrator Agent

Use the `invoke_agent` tool with `agent_name: harden-orchestrator`.
Capture the returned JSON object as `RESULT`.

---

## Step 4 — Branch on Classification

If `RESULT.classification == "plugin-defect"` AND `RESULT.routeToErrorReport ==
true`: jump to **Step 6 — PLUGIN-DEFECT ROUTE**.

Otherwise (`user-code` or `ambiguous`), display classification and rationale.

---

## Step 5 — PRESENT and APPLY

For each proposal in `RESULT.proposals`, present the full patch preview. Use `ask_user`:
> Apply this proposal?
Options: **apply** | **skip** | **cancel**

### 5a. Validate Before Write

- For guardrails: construct prospective merged JSON and validate via `scripts/ci/validate-guardrails.js`.
- For dimensions: validate prospective dimension file against `schemas/review-dimension.schema.json`.

---

## Step 6 — PLUGIN-DEFECT ROUTE: Dispatch error-report-sdlc

Use `ask_user`: **dispatch error-report-sdlc** | **cancel**.

---

## Step 7 — Learning Capture

Append a summary line to `.claude/learnings/log.md`.

---

## See Also

- `agents/harden-orchestrator.md` — orchestrator agent
- [`/error-report-sdlc`](../error-report-sdlc/SKILL.md) — plugin-defect route
- [`/setup-sdlc`](../setup-sdlc/SKILL.md) — initial guardrail/dimension authoring
