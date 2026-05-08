---
name: version-sdlc
description: "Semantic versioning and release management. Handles version bumping (major, minor, patch), release tags, and automated changelog generation. Supports --pre labels and --auto for non-interactive releases."
user-invocable: true
argument-hint: "[major|minor|patch|<label>] [--pre <label>] [--changelog] [--hotfix] [--auto]"
---

# Versioning Releases Skill

Consume pre-computed version context from `scripts/skill/version.js` and execute either
the one-time init setup or a full semantic release: version bump, annotated git tag,
optional CHANGELOG entry, release commit, and push to origin.

**Announce at start:** "I'm using version-sdlc (sdlc v{sdlc_version})." — extract the version from the `sdlc:` line in the session-start system-reminder.

## Workflow

### Step 0: Resolve and Run scripts/skill/version.js

> **VERBATIM** — Run this bash block exactly as written. Do not modify, rephrase, or simplify the commands.

```bash
SCRIPT="scripts/skill/version.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT. Is the sdlc extension installed?" >&2; exit 2; }

VERSION_CONTEXT_FILE=$(node "$SCRIPT" --output-file $ARGUMENTS)
EXIT_CODE=$?
# Single canonical cleanup
trap 'rm -f "$VERSION_CONTEXT_FILE"' EXIT INT TERM
```

### Branch A: Init Workflow (`flow === "init"`)

If the user invoked with `--init`, read and follow the init procedure (scaffold CI, create config).

### Branch B: Release Workflow (`flow === "release"`)

#### Step 1: Read Context
Extract `currentVersion`, `bumpOptions`, `conventionalSummary`.

#### Step 2 (PLAN): Determine Bump Type and Draft CHANGELOG
Apply semver rules. suggest major if breaking changes detected. Draft CHANGELOG in "Keep a Changelog" format.

#### Step 3-4 (CRITIQUE/IMPROVE): Self-review
Check for semver correctness and changelog completeness.

#### Step 5 (DO): Present Release Plan
Show release plan and draft changelog. Use `ask_user` for approval.

#### Step 6-7: Verify Pre-conditions
Check version file existence, tag conflicts, and git identity.

#### Step 8 (EXECUTE): Execute the Release
1. **Update version file** using `replace` tool. Verify `git diff` shows 1 line changed.
2. **Update CHANGELOG.md**.
3. **Stage and commit**.
4. **Link verification — HARD GATE.**
5. **Git tag and Push.**

---

## See Also

- [`/commit-sdlc`](../commit-sdlc/SKILL.md)
- [`/jira-sdlc`](../jira-sdlc/SKILL.md)
- [`/pr-sdlc`](../pr-sdlc/SKILL.md)
