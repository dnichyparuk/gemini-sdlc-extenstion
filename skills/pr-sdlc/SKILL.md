---
name: pr-sdlc
description: "Use this skill when creating or updating a pull request, updating a PR description, or generating PR content from commits and diffs. Handles full PR workflow: generates descriptions, self-critiques, manages labels, and executes gh CLI after approval. Supports --auto."
user-invocable: true
argument-hint: "[--draft] [--update] [--base <branch>] [--auto] [--label <name>]"
---

# Creating Pull Requests

Consume pre-computed git context from `scripts/skill/pr.js` and generate an 8-section
PR description readable by both technical and non-technical stakeholders.

**Announce at start:** "I'm using pr-sdlc (sdlc v{sdlc_version})." — extract the version from the `sdlc:` line in the session-start system-reminder. If no version is in context, omit the parenthetical.

## Step 0 — Plan Mode Check

If the system context contains "Plan mode is active":

1. Announce: "This skill requires write operations (gh pr create/edit). Exit plan mode first, then re-invoke `/pr-sdlc`."
2. Stop. Do not proceed to subsequent steps.

---

## When to Use This Skill

- Creating a new pull request on any branch
- Updating an existing PR title or description
- Writing or rewriting a PR description
- Summarizing branch changes for review

## PR Template

> **Custom template**: If `PR_CONTEXT_JSON.customTemplate` is not null, use it as the
> template instead of the default 8-section structure below. Parse every `## Heading`
> line as a section name; the text under each heading is the fill instruction for that
> section. Apply the same fill rules: real content, "N/A", or "Not detected" — never
> fabricate. All sections defined in the custom template must appear in the output.

When no custom template is present, every PR uses this 8-section flat structure. **All sections in the active template are always present.**

```markdown
## Summary
[1-3 sentence plain-language overview accessible to anyone — no jargon]

## JIRA Ticket
[Auto-detected from branch name or commit messages, e.g. PROJ-123.
"Not detected" if no ticket reference found.]

## Business Context
[Why this change is needed from a business/product perspective.
What problem or opportunity prompted it.
"N/A" only for pure internal tooling/infra with no business dimension.]

## Business Benefits
[What value this delivers — user impact, revenue, efficiency,
risk reduction, compliance, etc.
"N/A" only for pure internal tooling/infra with no business dimension.]

## Technical Design
[Architectural approach, key decisions, patterns used.
Non-obvious trade-offs or alternatives considered.]

## Technical Impact
[What systems, services, APIs, or areas are affected.
Breaking changes, migration needs, performance implications.
"N/A" if the change is fully isolated with no external impact.]

## Changes Overview
[Bullet-point list grouped by logical concern (not by file).
Each bullet describes a concept or behavior change — e.g.:
- Webhook handler validates event ID before processing and records it after success
- New migration adds processed_events table with TTL index
- Retry deduplication test coverage added
No file paths in this section.]

## Testing
[How this was verified: manual steps, automated tests, edge cases.
If no tests added, explain why.]
```

**Section fill rules:**

- ALL sections in the active template MUST always be present — never omit one (8 sections for the default; the custom template's sections when a custom template is active)
- Fill with real content when derivable from commits, diff, or user answers
- Use **"N/A"** when a section genuinely doesn't apply (state why briefly)
- Use **"Not detected"** when detection was attempted but yielded nothing
- **Never fabricate** — if unsure, ask a clarifying question before filling
- Ask clarifying questions (especially for Business Context and Business Benefits)
  when git data alone isn't sufficient to fill the section confidently

---

## Workflow

### Step 0: Resolve and Run scripts/skill/pr.js

> **VERBATIM** — Run this bash block exactly as written. Do not modify, rephrase, or simplify the commands.

```bash
SCRIPT="scripts/skill/pr.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT. Is the sdlc extension installed?" >&2; exit 2; }

PR_CONTEXT_FILE=$(node "$SCRIPT" --output-file $ARGUMENTS)
EXIT_CODE=$?
# Single canonical cleanup
trap 'rm -f "$PR_CONTEXT_FILE"' EXIT INT TERM
```

Read and parse `PR_CONTEXT_FILE` as `PR_CONTEXT_JSON`.

**On non-zero `EXIT_CODE`:**

- Exit code 1: The JSON still contains an `errors` array. Show each error to the user and stop.
- Exit code 2: Show `Script error — see output above` and stop.

**On script crash (exit 2):** Invoke error-report-sdlc — `glob` `**/error-report-sdlc/REFERENCE.md`, follow with skill=pr-sdlc, step=Step 0 — scripts/skill/pr.js execution, error=stderr.

**If `PR_CONTEXT_JSON.errors` is non-empty**, show each error message and stop.

**If `PR_CONTEXT_JSON.warnings` is non-empty**, show the warnings prominently before continuing.
Do not ask for confirmation — the Step 5 approval gate (`ask_user`) is the consent point before PR creation.

---

### Step 1: Consume the Context

Read `PR_CONTEXT_JSON` now.

### Step 2 (PLAN): Draft PR Description

Draft all sections of the active PR template.

**OpenSpec enrichment (automatic when detected):**

**Hook context fast-path:** If the session-start system-reminder contains an `OpenSpec active:` line, use its data to skip the initial `glob` for `openspec/config.yaml`.

1. `glob` for `openspec/config.yaml`. If absent, skip this block entirely.
2. Identify the active change: `glob` `openspec/changes/*/proposal.md` (exclude `archive/`).
3. If an active change is found, `read_file` in parallel:
   - `proposal.md` — use intent and scope to pre-fill **Business Context** and **Business Benefits** (reduces need for `ask_user` clarification)
   - `design.md` (if exists) — use architectural approach for **Technical Design** section
4. Add to the PR description, below the title: `**OpenSpec:** openspec/changes/<name>/`

For each section, apply the fill rules:
- **Business Context / Benefits**: Infer from `context.commits` and `context.diffContent`. If insufficient evidence, **use ask_user** to ask the user.

Also draft the PR title: under 72 characters. If `prConfig` is non-null, constrain the title generation based on `allowedTypes` and `allowedScopes`.

#### Step 2b: Infer Labels

Label assignment is **mode-dispatched** based on `PR_CONTEXT_JSON.prConfig?.labels?.mode`.

#### Step 3 (CRITIQUE): Self-review the Draft

Before presenting to the user, review the draft against quality gates (sections present, specificity, no file paths, title length, pattern match, no fabrication, documentation sync, label validity, link verification).

#### Step 4 (IMPROVE): Revise Based on Critique

Fix each issue found in Step 3. If a business section still can't be filled confidently, **use ask_user** to ask a targeted clarifying question.

### Step 5 (DO): Present for Review

Show complete title, labels, and description. **Do not execute any `gh` command before receiving explicit user approval via ask_user.**

**Auto mode:** When `PR_CONTEXT_JSON.isAuto` is true, skip the `ask_user` prompt entirely.

Use `ask_user` to ask:
> Create this PR as shown? (or Update PR #<number> as shown?)

Options: **yes** | **edit** | **cancel**

### Step 6: Create or Update PR

**Only execute after explicit `yes` from Step 5.**

**Pre-execution title pattern validation:** Validate title against `prConfig.titlePattern` regex via node script.

**Link verification — HARD GATE:** Validate URLs in final PR body via `scripts/skill/pr.js --validate-body`.

**Just-in-time label creation:** Check `forcedLabels` against `repoLabels`. Create any missing labels via `gh label create`.

**Create mode:**
```bash
gh pr create --title "<title>" --body "<body>" [--draft] [--label "<l1>" --label "<l2>"]
```

**Post-failure account-switch recovery:** If `gh pr create` fails (spec E7), invoke `scripts/skill/pr-recover-gh-account.js` once to switch account and retry.

**Update mode:**
```bash
gh pr edit --title "<title>" --body "<body>" [--add-label "<l1>,<l2>"]
```

After success, display the PR URL.

**On script crash (exit 2):** Invoke error-report-sdlc.

---

## Best Practices

1. **Read ALL commits**
2. **Diff is ground truth**
3. **Ask rather than guess** — use `ask_user`
4. **No file paths in Changes Overview**
5. **Flag risks**
6. **Preserve author intent**

## See Also

- [`/commit-sdlc`](../commit-sdlc/SKILL.md)
- [`/review-sdlc`](../review-sdlc/SKILL.md)
- [`/version-sdlc`](../version-sdlc/SKILL.md)
