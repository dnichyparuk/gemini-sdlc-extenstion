---
name: review-sdlc
description: "Use this skill for multi-dimension code reviews (security, performance, style, logic). Runs scripts/skill/review.js to prepare git data, then delegates to review-orchestrator. Supports --base, --dimensions, and --dry-run."
user-invocable: true
argument-hint: "[--base <branch>] [--committed] [--staged] [--dimensions <name,...>]"
---

# Reviewing Changes

Thin dispatcher — runs the prepare script, then delegates everything to the
`review-orchestrator` agent (which spawns dimension subagents in parallel).

**Announce at start:** "I'm using review-sdlc (sdlc v{sdlc_version})." — extract the version from the `sdlc:` line in the session-start system-reminder. If no version is in context, omit the parenthetical.

---

## Step 0 — Resolve and Run scripts/skill/review.js

> **VERBATIM** — Run this bash block exactly as written. Do not modify, rephrase, or simplify the commands.

```bash
SCRIPT="scripts/skill/review.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT. Is the sdlc extension installed?" >&2; exit 2; }

MANIFEST_FILE=$(node "$SCRIPT" --output-file $ARGUMENTS --json)
EXIT_CODE=$?
echo "MANIFEST_FILE=$MANIFEST_FILE"
echo "EXIT_CODE=$EXIT_CODE"
# Single canonical cleanup
trap 'rm -f "$MANIFEST_FILE"' EXIT INT TERM
```

**On non-zero `EXIT_CODE`:**

- Exit code 1: show the stderr message to the user and stop.
- Exit code 2: show `Script error — see output above` and stop.

**On script crash (exit 2):** Invoke error-report-sdlc — `glob` `**/error-report-sdlc/REFERENCE.md`, follow with skill=review-sdlc, step=Step 0 — scripts/skill/review.js execution, error=stderr.

**Do NOT read the manifest file contents into the main context.** The orchestrator will read it.

---

## Step 1 — Dry Run Check

Only if `--dry-run` was passed in `$ARGUMENTS`:

Read `MANIFEST_FILE` and output the review plan (base branch, changed files count, dimensions status, and plan critique).

Stop here. The `trap` declared at Step 1 cleans up `$MANIFEST_FILE` automatically on shell exit.

---

## Step 2 — Spawn Orchestrator Agent

Spawn a single Agent using `subagent_type: review-orchestrator` with the following
context as the prompt:

```
MANIFEST_FILE: {the temp file path from Step 0}
PROJECT_ROOT: {current working directory}
```

Wait for the orchestrator to return its summary.

**On orchestrator failure:** Re-dispatch once with the same inputs. If the second
attempt also fails, invoke error-report-sdlc.

---

## Step 3 — Parse Orchestrator Summary and Display Full Comment Body

The user MUST see the full consolidated review (every per-dimension finding, every severity) in the terminal before any posting prompt.

1. Display the orchestrator's summary to the user verbatim.
2. Parse the summary to extract `comment_file` path and PR metadata.
3. **Display full comment body.** Use the `read_file` tool to load the file at `comment_file`, then emit its full contents verbatim inside a fenced markdown block.

---

## Step 4 — Handle Posting

This step runs entirely in the main context. The comment body at `comment_file` is authoritative.

### PR exists

Prompt: `Post this review comment to PR #<number>? (yes / save / cancel)`

- `yes` → **Link verification — HARD GATE.** Validate every URL embedded in the comment body via `scripts/lib/links.js`. On zero exit, post via `gh api`.
- `save` → Save review to `.sdlc/reviews/<branch>-<YYYY-MM-DD>.md`.
- `cancel` → no action.

### No PR

Propose creating a draft PR or saving to file.

---

## Step 5 — Offer Self-Fix

If findings exist, offer to fix:

- **fix** — invoke `received-review-sdlc` (findings are in conversation context)
- **harden** — run `/harden-sdlc` to analyze why this failed.
- **no** — done

---

## Step 6 — Cleanup

Remove the diff directory: `rm -rf "{diff_dir}"`.

---

## See Also

- `agents/review-orchestrator.md` — full orchestration logic
- [`/setup-sdlc --dimensions`](../setup-sdlc/SKILL.md) — creates review dimensions
- [`/received-review-sdlc`](../received-review-sdlc/SKILL.md) — responds to findings
- [`/commit-sdlc`](../commit-sdlc/SKILL.md) — commit after review approval
