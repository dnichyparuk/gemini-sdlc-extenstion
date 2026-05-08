---
name: verify-pipeline-sdlc
description: "Analyze and fix failed CI runs on pull requests. Classifies root causes and either applies minimal fixes or emits proposals. Integrated with ship-sdlc."
user-invocable: true
argument-hint: "[--pr <number>] [--logs <path-or-string>] [--auto]"
---

# Verify Pipeline (SDLC)

Analyze failed CI logs, classify the root cause, and either apply a minimal fix or emit a proposal.

**Announce at start:** "I'm using verify-pipeline-sdlc (sdlc v{sdlc_version})." — extract version from session-start.

---

## Workflow

### Step 1: CONSUME — load logs

Resolve logs internally via `scripts/lib/git.js::fetchFailedCheckLogs`:

```bash
node -e "
const { fetchPrChecks, fetchFailedCheckLogs } = require('./scripts/lib/git.js');
const checks = fetchPrChecks(process.argv[1]);
const failed = checks.find(c => c && c.bucket === 'fail');
if (!failed || !failed.link) { process.stderr.write('no failed check found\n'); process.exit(0); }
const m = failed.link.match(/\/actions\/runs\/(\d+)/);
if (!m) { process.stderr.write('no runId in link\n'); process.exit(0); }
const out = fetchFailedCheckLogs(m[1], { maxLines: 200 });
if (out.ok) process.stdout.write(out.excerpt);
" "$PR_NUMBER"
```

### Step 2: CLASSIFY — invoke the deterministic classifier

```bash
SCRIPT="scripts/skill/verify-pipeline-sdlc-classify.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT."; exit 2; }
echo "$LOGS" | node "$SCRIPT"
```

Categories: `lint`, `test-failure`, `type-error`, `build-error`, `dependency`, `infra`, `unknown`.

### Step 3: PROPOSE OR APPLY

- **Actionable (lint, test-failure, type-error)**: Apply minimal fix using `replace` tool if `--auto` is set.
- **Non-trivial (build-error, dependency, infra)**: Emit proposal.

### Step 4: VERDICT — single JSON line on stdout

Emit exactly one of: `fix-applied`, `proposal`, `abort`.

---

## See Also

- [`/ship-sdlc`](../ship-sdlc/SKILL.md)
- [`/commit-sdlc`](../commit-sdlc/SKILL.md)
