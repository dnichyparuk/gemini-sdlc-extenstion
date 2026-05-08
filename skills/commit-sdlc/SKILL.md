---
name: commit-sdlc
description: "Use this skill when committing staged changes, creating a git commit, or generating a commit message. Analyzes staged diff and recent history to generate messages matching project style. Handles stashing, user confirmation, and auto-restoring stashes. Supports --auto."
user-invocable: true
argument-hint: "[--no-stash] [--scope <scope>] [--type <type>] [--amend] [--auto]"
---


# Smart Commit Skill

Consume pre-computed commit context from `scripts/skill/commit.js`, generate a commit message
matching the project's style, optionally stash unstaged changes, commit after user
confirmation, and auto-restore the stash.

**Announce at start:** "I'm using commit-sdlc (sdlc v{sdlc_version})." — extract the version from the `sdlc:` line in the session-start system-reminder. If no version is in context, omit the parenthetical.

## When to Use This Skill

- Committing staged changes with an auto-generated message
- Generating a commit message that matches the project's existing style
- Isolating staged changes from unstaged work before committing
- Amending the most recent commit with updated staged changes

## Workflow

## Step 0 — Plan Mode Check

If the system context contains "Plan mode is active":

1. Announce: "This skill requires write operations (git commit). Exit plan mode first, then re-invoke `/commit-sdlc`."
2. Stop. Do not proceed to subsequent steps.

---

### Step 0: Resolve and Run scripts/skill/commit.js

> **VERBATIM** — Run this bash block exactly as written. Do not modify, rephrase, or simplify the commands.

```bash
# Locate the prepare script relative to the extension root
SCRIPT="scripts/skill/commit.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT. Is the sdlc extension installed?" >&2; exit 2; }

COMMIT_CONTEXT_FILE=$(node "$SCRIPT" --output-file $ARGUMENTS)
EXIT_CODE=$?
# Single canonical cleanup
trap 'rm -f "$COMMIT_CONTEXT_FILE"' EXIT INT TERM
```

Read and parse `COMMIT_CONTEXT_FILE` as `COMMIT_CONTEXT_JSON`.

**On non-zero `EXIT_CODE`:**

- Exit code 1: The JSON still contains an `errors` array. Show each error to the user and stop.
- Exit code 2: Show `Script error — see output above` and stop.

**On script crash (exit 2):** Invoke error-report-sdlc — `glob` for `**/error-report-sdlc/REFERENCE.md`, follow with skill=commit-sdlc, step=Step 0 — skill/commit.js execution, error=stderr.

**If `COMMIT_CONTEXT_JSON.errors` is non-empty**, show each error message and stop.

**If `COMMIT_CONTEXT_JSON.warnings` is non-empty**, show the warnings to the user before continuing.

---

### Step 1 (CONSUME): Quick Context Read

Read just enough from `COMMIT_CONTEXT_JSON` for the main-context flow: `currentBranch`, `flags`, `staged.files`, `staged.fileCount`, `staged.diffStat`, `unstaged.hasChanges`, `commitConfig.subjectPattern`, `commitConfig.subjectPatternError`. Heavy fields — `staged.diff`, `recentCommits`, `lastCommitMessage`, full `commitConfig` — are consumed by the orchestrator agent below; do **not** read or quote them in main context.

### Step 2 (PLAN): Dispatch the commit-orchestrator Agent

Dispatch the dedicated `commit-orchestrator` agent.

Use the `invoke_agent` tool with:

- `agent_name`: `commit-orchestrator`
- `prompt` (exactly two lines, no other content):

  ```text
  MANIFEST_FILE: <COMMIT_CONTEXT_FILE>
  PROJECT_ROOT: <cwd>
  ```

  Substitute `<COMMIT_CONTEXT_FILE>` with the absolute temp-file path captured in Step 0. Substitute `<cwd>` with the current working directory.

The orchestrator reads the manifest, applies every `commitConfig` constraint, detects style from `recentCommits`, runs its own self-critique loop, and returns ONLY the final commit message string.

Capture the orchestrator's return value as `MESSAGE`. If `MESSAGE` is empty, the orchestrator detected an `errors[]` array in the manifest — surface those errors and stop.

**OpenSpec scope hint (main context, optional):** If `flags.scope` is NOT set, `glob` for `openspec/config.yaml`. If found, `glob` `openspec/changes/*/proposal.md` (exclude `archive/`). If exactly one active change exists, or one matches the current branch name, append an `OpenSpec-Change: <change-directory-name>` trailer to `MESSAGE`. The hook context fast-path applies: if the session-start system-reminder has an `OpenSpec active:` line, use it instead of `glob`.

### Step 3 (CRITIQUE) and Step 4 (IMPROVE)

The orchestrator agent owns Steps 3 (CRITIQUE) and 4 (IMPROVE) internally.

### Step 5 (DO): Present and Execute

Show the full commit plan to the user with the `MESSAGE` returned by the orchestrator and the staged-file summary read in Step 1. **Do not execute any git commands before receiving explicit user approval via ask_user.**

**Auto mode:** When `flags.auto` is true, skip the `ask_user` prompt entirely. Still display the full commit plan for visibility, then proceed directly to execution. Treat the response as an implicit `yes`.

```
Commit
────────────────────────────────────────────
Message:    feat(auth): add OAuth2 PKCE flow

            Replaces the implicit flow with PKCE to comply with
            the new OAuth 2.1 requirements.

Staged:     3 files changed, +142, -12
  src/auth/pkce.ts
  src/auth/index.ts
  tests/auth/pkce.test.ts

Trailer:    OpenSpec-Change: add-oauth2-pkce  (if applicable)

Stash:      2 unstaged files will be stashed and restored
────────────────────────────────────────────

```

Use `ask_user` to ask:
> Commit as shown?

Options:
- **yes** — commit as shown
- **edit** — tell me what to change
- **cancel** — abort

Omit the `Stash:` line if `unstaged.hasChanges` is false or `flags.noStash` is true.
Show `Amend:` instead of `Commit:` heading when `flags.amend` is true.

**On `yes`:**

0. **Subject pattern gate (hard gate):** If `commitConfig` is non-null and `commitConfig.subjectPattern` is set, validate the subject line before proceeding:

   ```bash
   node -e "
     const pattern = new RegExp(process.argv[1]);
     const subject = process.argv[2];
     if (!pattern.test(subject)) { process.exit(1); }
   " "<subjectPattern>" "<subject line>"
   ```

   - If the check **passes** (exit 0): continue to step 1.
   - If the check **fails** (exit 1): show the error message from `commitConfig.subjectPatternError` if set, otherwise show the pattern itself as a fallback. Do **not** proceed with the commit. Use `ask_user` to offer:
     - **edit subject** — let the user revise the subject line to match the pattern; re-run the gate
     - **harden** — run `/harden-sdlc` to analyze why this failed. When the user selects **harden**, activate `harden-sdlc` with `--failure-text "Subject pattern reject: subject '<line>' does not match pattern '<subjectPattern>' — error: <subjectPatternError>"`, `--skill commit-sdlc`, `--step "Step 5 — subject pattern gate"`, `--operation "subject pattern validation"`.
     - **cancel** — abort the commit

1. **Link verification — HARD GATE.** Before `git commit`, validate every URL embedded in the commit message body via the shared link validator.

   ```bash
   LINKS_LIB="scripts/lib/links.js"
   [ ! -f "$LINKS_LIB" ] && { echo "ERROR: Could not locate $LINKS_LIB." >&2; exit 2; }
   printf '%s' "$message" | node "$LINKS_LIB" --json
   LINK_EXIT=$?
   ```

   On non-zero exit (`LINK_EXIT != 0`):
   - The script has already printed the violation list to stderr.
   - Do NOT execute `git commit`. Surface the violation list verbatim to the user.
   - Stop. Do not retry. Do not edit URLs without user input. Do not bypass.

   On zero exit, proceed to the stash + commit steps below.

2. If `unstaged.hasChanges` is true AND `flags.noStash` is false:
   ```bash
   git stash push --keep-index -m "commit-sdlc: temp stash"
   ```
3. Execute the commit:
   - If `flags.amend` is true: `git commit --amend -m "<message>"`
   - Otherwise: `git commit -m "<message>"`
4. If stash was created in step 2:
   ```bash
   git stash pop
   ```

**On `edit`:** Ask what to change, revise the message, and present again. Loop until explicit `yes` or `cancel`.

**On `cancel`:** Abort without changes.

**Hook failure handling**: If `git commit` fails due to a pre-commit hook, the stash is still in place. Inform the user: "Pre-commit hook failed. Your unstaged changes are stashed (`git stash list` to see). Fix the hook issue, re-stage your changes, and re-run `/commit-sdlc`."

### Step 6 (CRITIQUE): Verify

Run `git log -1 --oneline` to confirm the commit was created.

Show the result:

```
✓ Committed: a1b2c3d feat(auth): add OAuth2 PKCE flow
  Files:   3 files changed, +142, -12
  Stash:   restored (2 unstaged files back in working tree)
```

## See Also

- [`/review-sdlc`](../review-sdlc/SKILL.md)
- [`/pr-sdlc`](../pr-sdlc/SKILL.md)
- [`/version-sdlc`](../version-sdlc/SKILL.md)
