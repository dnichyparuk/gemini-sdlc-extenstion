---
name: plan-sdlc
description: "Use for writing implementation plans from requirements, specs, or design docs. Designated skill for plan mode. Analyzes scope, maps file structure, decomposes tasks, and produces plans for execute-plan-sdlc."
user-invocable: true
argument-hint: "[--spec] [--from-openspec <change-name>] [spec-file-path]"
---

# Plan (SDLC)

Write an implementation plan from requirements, a spec, or a user description. Produces a plan in the format consumed by execute-plan-sdlc — with per-task complexity/risk/dependency metadata embedded.

**Announce at start:** "I'm using plan-sdlc (sdlc v{sdlc_version})." — extract the version from the `sdlc:` line in the session-start system-reminder. If no version is in context, omit the parenthetical.

## Step 0: Mode Detection, Routing, and Setup

**Mode detection:** Check whether a system-reminder contains "Plan mode is active". If yes, extract the designated plan file path from "You should create your plan at `<path>`". That path is the only writable file.

**Gather requirements:** If no spec or requirements document is in context, use `ask_user`:
> What do you want to implement? (describe in free form, bullet points, or provide a file path)

**OpenSpec integration (opt-in — requires `--spec` flag or explicit spec path):**

**Hook context fast-path:** If the session-start system-reminder contains an `OpenSpec active:` line, use its data to skip the initial `glob` for `openspec/config.yaml`.

1. `glob` for `openspec/config.yaml`. If absent, skip this entire block — no OpenSpec in this project.
2. **Gate check:** If `openspec/config.yaml` exists but neither `--spec` flag was passed NOR the user provided a path into `openspec/changes/`:
   a. **Classify the request:** Determine whether the user's task involves functional changes vs non-functional changes.
   b. **Non-functional changes:** Print:
      > OpenSpec detected — pass `--spec` to include spec context in planning.
      Then skip the rest of this block.
   c. **Functional changes:** Check whether an active OpenSpec change already covers this work — `glob` `openspec/changes/*/proposal.md`. If a match is found, treat it as if the user passed `--spec`. If no match, use `ask_user`:
      > This looks like a functional change. This project uses OpenSpec for spec-driven development.
      >
      > Options:
      > 1. **Start OpenSpec flow** — run `/opsx:propose` to spec this out first
      > 2. **Continue planning directly** — skip spec workflow
      > 3. **Use existing spec** — pass `--spec` if you already have an OpenSpec change for this
      >
      > Select (1/2/3):

      - On **1**: Stop plan-sdlc. Tell user to run `/opsx:propose`.
      - On **2**: Continue with standard planning.
      - On **3**: Re-run the OpenSpec loading logic.
3. If the user provided a spec file path pointing into `openspec/changes/<name>/`, extract `<name>` as the active change.
4. Otherwise, `glob` `openspec/changes/*/proposal.md`. If exactly one non-archived change exists, use it. If ambiguous, use `ask_user`:
   > Multiple active OpenSpec changes found. Which one are you working on?
5. Once the active change is identified, `read_file` in parallel:
   - `openspec/changes/<name>/proposal.md`
   - `openspec/changes/<name>/design.md`
   - All files matching `openspec/changes/<name>/specs/*.md`
   - `openspec/changes/<name>/tasks.md`
6. Store these as `openspecContext`. Update the plan file header.

**Complexity routing:**
- 1 file, clear change: Skip plan in normal mode, lightweight plan in plan mode.
- 2–3 files: Lightweight plan.
- 4+ files: Full pipeline (Steps 1–7).

**Session recovery:** If plan file has content, use `ask_user`:
> Found existing plan draft. Resume from critique (Step 3), or restart?

**Initialize plan file:** Write the skeleton header immediately.

**Context detection and guardrail loading (scripts/skill/plan.js):**

> **VERBATIM** — Run this bash block exactly as written.

```bash
SCRIPT="scripts/skill/plan.js"
[ ! -f "$SCRIPT" ] && { echo "{}"; exit 0; }

PLAN_OUTPUT_FILE=$(node "$SCRIPT" --output-file)
EXIT_CODE=$?
echo "PLAN_OUTPUT_FILE=$PLAN_OUTPUT_FILE"
echo "EXIT_CODE=$EXIT_CODE"
# Single canonical cleanup
trap 'rm -f "$PLAN_OUTPUT_FILE"' EXIT INT TERM
```

**Normal mode path resolution:** Resolve the output path before writing. Naming: `YYYY-MM-DD-<feature-name>.md`.

**planFile marker:** record the resolved plan path.

```bash
SCRIPT="scripts/skill/plan.js"
[ -f "$SCRIPT" ] && node "$SCRIPT" --mark plan-file --path "<resolved-plan-path>" 2>/dev/null || true
```

## Step 1 (CONSUME): Requirements Discovery and Exploration

**Structured discovery:** When requirements are vague, use `ask_user` with 2–3 targeted questions.

**Codebase exploration:** Use read-only tools (`glob`, `grep_search`, `read_file`).

**Write to plan file:** Fill headers, append requirements checklist.

## Step 2 (PLAN): Decompose Into Tasks

**Scope check:** If Requirements span independent subsystems, use `ask_user` to offer splitting.

**Task decomposition rules:**
- Unit units of work.
- 1–5 files per task.
- Order: foundations → features → polish.

**Per-task metadata:** complexity, risk, depends on, verify.

**Verification strategy:** Feature → tests, config → build, etc.

## Step 3 (CRITIQUE): Self-Review Plan

Check quality gates (coverage, deps, context, guardrails).

**Markers:** Record `guardrailsEvaluated` and `critiqueRan` using `scripts/skill/plan.js --mark`.

## Step 4 (IMPROVE): Revise Plan and Present for Approval

Fix issues. Append Guardrail Compliance section if applicable. Offer **harden** via `/harden-sdlc` if blocked.

Present to user via `ask_user`:
1. Requirements-to-task mapping.
2. Full task list summary.
3. Options: approve / change / question.

## Step 5 (CRITIQUE): Plan Review Loop

Skip for lightweight plans. Dispatch a plan reviewer subagent (using `invoke_agent`).

**Review loop:** Approved → Step 7. Issues → Step 6. Max 3 iterations → escalate to user. Offer **harden** if loop doesn't converge.

## Step 6 (IMPROVE): Apply Review Fixes

Fix issues, rewrite plan file, re-dispatch reviewer.

## Step 6.5 (LINK VERIFICATION): Validate URLs in plan content — HARD GATE

```bash
LINKS_LIB="scripts/lib/links.js"
[ ! -f "$LINKS_LIB" ] && { echo "ERROR: Could not locate $LINKS_LIB."; exit 2; }
node "$LINKS_LIB" --file "$plan_path" --json
LINK_EXIT=$?
```

On non-zero exit, stop and surface violations.

## Step 7: Handoff

**Plan mode:** Announce path, call `ExitPlanMode`.

**Normal mode:** Announce path, present Workflow Continuation menu.

## Workflow Continuation

Present next actions:
- ship (invoke `/ship-sdlc`)
- execute (invoke `/execute-plan-sdlc`)
- done
