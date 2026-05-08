---
name: ship-sdlc
description: "End-to-end feature shipping pipeline. Chains execution, commit, review, fixing, versioning, and PR creation in one flow. Supports --auto, --bump, --draft, and --quality. Handles resume and workspace isolation."
user-invocable: true
argument-hint: "[--auto] [--steps <csv>] [--quality full|balanced|minimal] [--bump patch|minor|major|<label>] [--draft] [--dry-run] [--resume] [--workspace branch|worktree|prompt] [--openspec-change <name>] [--init-config] [--gc] [--ttl-days <N>]"
---

# Ship Pipeline

End-to-end feature shipping: execute plan, commit, review, fix critical issues, version, and open a PR. Chains six sub-skills sequentially with a conditional review-fix loop.

**Announce at start:** "I'm using ship-sdlc (sdlc v{sdlc_version})." — extract the version from the `sdlc:` line in the session-start system-reminder. If no version is in context, omit the parenthetical.

## Step 0 — Plan Mode Check

If the system context contains "Plan mode is active":

1. Announce: "This skill requires write operations (git commit, gh pr create, git tag). Exit plan mode first, then re-invoke `/ship-sdlc`."
2. Stop. Do not proceed to subsequent steps.

---

## Step 1 (CONSUME): Load Config, Parse Flags, Detect Context

### 1a. --init-config handler

If `--init-config` was passed:

**Redirect:** Suggest running `/setup-sdlc` instead for unified configuration. If user insists on `--init-config`, proceed with the existing walkthrough.

1. Read `./config-format.md` and run the interactive walkthrough to collect the user's answers.
2. Locate and call `scripts/util/ship-init.js` via Bash:
```bash
SCRIPT="scripts/util/ship-init.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT. Is the sdlc extension installed?" >&2; exit 2; }

INIT_OUTPUT_FILE=$(node "$SCRIPT" --output-file --steps execute,commit,review,pr,archive-openspec --bump patch --auto --threshold high --workspace prompt)
EXIT_CODE=$?
# Single canonical cleanup
trap 'rm -f "$INIT_OUTPUT_FILE"' EXIT INT TERM
```

### 1a-gc. --gc handler

If `--gc` (with optional `--ttl-days <N>`) was passed, run `scripts/skill/ship.js --gc` and stop.

```bash
SCRIPT="scripts/skill/ship.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT."; exit 2; }
PREPARE_OUTPUT_FILE=$(node "$SCRIPT" --output-file --gc)  # add --ttl-days <N> when provided
trap 'rm -f "$PREPARE_OUTPUT_FILE"' EXIT INT TERM
```

### 1b. Load ship config

Check for ship config via `scripts/skill/ship.js` output. Print loaded config verbosely.

### 1c. Prepare pipeline context

Locate and run `scripts/skill/ship.js` with all CLI flags:
```bash
SCRIPT="scripts/skill/ship.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT."; exit 2; }

PREPARE_OUTPUT_FILE=$(node "$SCRIPT" --output-file --has-plan --auto --bump patch --workspace branch)
EXIT_CODE=$?
# Single canonical cleanup
trap 'rm -f "$PREPARE_OUTPUT_FILE"' EXIT INT TERM
```

### 1d-1g. Context Analysis
Follow the analysis patterns for flag resolution, resume check, context detection, and auto-skip logic as pre-computed by the prepare script.

---

## Step 2 (PLAN): Build Pipeline Plan

The pipeline table is generated from the `steps` array in the `scripts/skill/ship.js` output.

| Step | Skill | Status | Args | Pause |
|------|-------|--------|------|-------|
| 1 | execute-plan-sdlc | will_run | ... | no |
| 2 | commit-sdlc | will_run | `--auto` | no |
| 3 | review-sdlc | will_run | `--committed` | no |
| 4 | received-review-sdlc | conditional | (if crit/high) | YES |
| 5 | commit-sdlc (fixes) | conditional | `--auto` | no |
| 6 | version-sdlc | skipped | — | — |
| 7 | pr-sdlc | will_run | `--auto --draft` | no |

---

## Step 3 (CRITIQUE): Validate Pipeline

Verify `gh` auth, branch status, and coherent flags.

---

## Step 4 (DO): Present Pipeline and Confirm

Display the pipeline table. If not `--auto`, use `ask_user` to confirm execution.

---

## Step 5 (EXECUTE): Run Pipeline Steps Sequentially

### Agent dispatch protocol

All sub-skills are dispatched as Agents using the `invoke_agent` tool. This ensures context isolation between steps.

For each step that will run:

1. **Print verbose progress header.**
2. **Record step start** via `scripts/state/ship.js`.
3. **Dispatch Agent** with `invoke_agent`:
   - `agent_name`: derived from skill name (e.g., `execute-plan-sdlc`).
   - `model`: as specified in the pipeline plan.
   - `prompt`: "You are executing the <skill-name> skill. Invoke `/<skill-name> <args>` using the Skill tool. Return a structured result with status, summary, and artifacts."
4. **Record step completion/failure.**
5. **Use result to determine next step.**

### Between Step Hooks

**Between execute and commit:** Stage changes with `git add -A -- ':!.sdlc/'`.
**Between review and received-review:** Evaluate the verdict and findings threshold.
**Between last commit and version:** Rebase on default branch.

### State persistence

```bash
SCRIPT="scripts/state/ship.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT."; exit 2; }
```

---

## Step 6 (REPORT): Pipeline Summary

Display a full summary table of all steps and their results. Provide next-step advisories (e.g., for OpenSpec or versioning).

---

## Best Practices & Error Recovery

- **Context Isolation:** Always use `invoke_agent` to keep the ship pipeline context clean.
- **State Preservation:** Never delete the state file on failure; it is required for `--resume`.
- **Binding Plan:** Follow the pipeline table statuses strictly; the LLM does not override "will_run".

---

## See Also

- [`/execute-plan-sdlc`](../execute-plan-sdlc/SKILL.md)
- [`/commit-sdlc`](../commit-sdlc/SKILL.md)
- [`/review-sdlc`](../review-sdlc/SKILL.md)
- [`/received-review-sdlc`](../received-review-sdlc/SKILL.md)
- [`/version-sdlc`](../version-sdlc/SKILL.md)
- [`/pr-sdlc`](../pr-sdlc/SKILL.md)
