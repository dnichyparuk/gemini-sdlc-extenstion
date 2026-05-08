---
name: jira-sdlc
description: "Manage Jira issues using Atlassian MCP tools. Caches project metadata to eliminate redundant calls. Supports creating, editing, transitioning, commenting, and searching issues."
user-invocable: true
argument-hint: "[--project <KEY>] [--force-refresh] [--init-templates] [--site <host>] [--skip-workflow-discovery]"
---

# Managing Jira Issues

Cache Jira project metadata on first use, then execute any Jira operation using cached values.

**Announce at start:** "I'm using jira-sdlc (sdlc v{sdlc_version})." — extract the version from the `sdlc:` line in the session-start system-reminder.

## Workflow

### Step 0 — Check Cache

Run `scripts/skill/jira.js` via Bash:

```bash
SCRIPT="scripts/skill/jira.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT."; exit 2; }

JIRA_CONTEXT_FILE=$(node "$SCRIPT" --output-file $ARGUMENTS --check)
EXIT_CODE=$?
# Single canonical cleanup
trap 'rm -f "$JIRA_CONTEXT_FILE"' EXIT INT TERM
```

### Step 1 — Deterministic Cache Initialization

If cache is missing or stale, run Phases 1-6 (Identity, Project, Issue Types, Field Schemas, Workflow, Save).

### Step 2 — Classify Operation

Parse user intent: `create`, `edit`, `search`, `transition`, `comment`, `link`, `assign`, `worklog`, `view`, `bulk`.

### Step 2.5 — Critique (write-ops only)

Build initial payload. Resolve templates from `scripts/templates/`. Run critique (Completeness, Correctness, Workflow validity).

### Step 2.6 — Approval (write-ops only)

Print full payload. Use `ask_user` for approval.

### Step 2.7 — Link verification — HARD GATE

Validate URLs in description/comment via `scripts/skill/jira.js --validate-body`.

### Step 3 — Execute Operation

Dispatch write MCP call only after Step 2.6/2.7 pass. Surface the hook's `permissionDecisionReason` if blocked.

---

## See Also

- [`/plan-sdlc`](../plan-sdlc/SKILL.md) — write an implementation plan from a Jira ticket
- [`/execute-plan-sdlc`](../execute-plan-sdlc/SKILL.md) — execute an existing plan
