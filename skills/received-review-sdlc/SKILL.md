---
name: received-review-sdlc
description: "Process and respond to code review findings. Evaluates feedback, proposes fixes, and executes user-approved changes. Supports --pr and --auto for streamlined feedback loops."
user-invocable: true
argument-hint: "[--pr <url|number>] [--auto] [--dry-run]"
---

# Responding to Code Review Feedback

Process reviewer comments with technical rigor. Each item is verified against the full
codebase context before any response is drafted. Internal self-critique gates ensure quality.

**Announce at start:** "I'm using received-review-sdlc (sdlc v{sdlc_version})." — extract the version from the `sdlc:` line in the session-start system-reminder.

---

## Workflow

### Step 1 — READ: Gather Review Feedback

Run `scripts/skill/received-review.js` via Bash:

```bash
SCRIPT="scripts/skill/received-review.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT."; exit 2; }

REVIEW_CONTEXT_FILE=$(node "$SCRIPT" --output-file $ARGUMENTS --pr <PR_NUMBER>)
EXIT_CODE=$?
# Single canonical cleanup
trap 'rm -f "$REVIEW_CONTEXT_FILE"' EXIT INT TERM
```

### Step 2 — UNDERSTAND: Categorize and Flag

For each item, classify as `bug`, `style`, `architecture`, etc. If any item is unclear, **STOP** and ask for clarification.

### Step 3 — VERIFY: Check Against Full Codebase Context

1. **Read the referenced code.**
2. **Trace callers and dependents** via `grep_search`.
3. **Evaluate ripple effects.**

### Step 4 — EVALUATE: Assess Each Item

Verdict: `agree, will fix` | `agree, won't fix` | `disagree` | `needs discussion`.

### Step 5-6 (CRITIQUE/IMPROVE): Self-Critique the Evaluation

Review for verification completeness and technical grounding.

### Step 7 — RESPOND (DO): Draft Responses

Draft factual acknowledgments and action plans. Avoid performative openers.

### Step 10 — PRESENT: Show Findings and Proposed Plan

Show analysis summary table, action plan, and drafted responses. Use `ask_user` for consent:
> No changes have been made yet. How to proceed?

Options: **implement** | **edit** | **skip**.

### Step 11 — IMPLEMENT: Execute Changes

Apply code changes. post responses to PR threads via `gh api`.

### Step 11.5 — LINK VERIFICATION — HARD GATE

Validate URLs in replies via `scripts/lib/links.js`.

### Step 12 — REPLY & RESOLVE: Post PR Thread Replies

Confirm thread resolution.

---

## See Also

- [`/review-sdlc`](../review-sdlc/SKILL.md)
- [`/commit-sdlc`](../commit-sdlc/SKILL.md)
- [`/pr-sdlc`](../pr-sdlc/SKILL.md)
