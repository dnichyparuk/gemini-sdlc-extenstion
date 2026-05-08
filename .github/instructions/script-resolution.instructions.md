---
applyTo: "**/skills/**/SKILL.md"
---
# script-resolution — Review Instructions

Reviews script resolution and reference lookup patterns in skills for runtime correctness within the Gemini CLI extension ecosystem.

Default severity: high

## Checklist

- Every script resolution uses a simple relative path from the extension root (e.g., `scripts/skill/commit.js`).
- Scripts are executed using `node` or the appropriate interpreter.
- Every resolution block includes a failure guard: `[ ! -f "$SCRIPT" ] && { echo "ERROR: ..."; exit 2; }`.
- The error message in the failure guard names the specific script and explains how to fix it (e.g., "Is the sdlc extension linked?").
- Glob-based reference file lookups (REFERENCE.md, EXAMPLES.md, agent definitions) use patterns relative to the extension root.
- No resolution pattern uses legacy Claude-specific paths (e.g., `~/.claude/plugins`).

## Canonical pattern

```bash
SCRIPT="scripts/<subdir>/<script>.js"
[ ! -f "$SCRIPT" ] && { echo "ERROR: Could not locate $SCRIPT. Is the sdlc extension installed?" >&2; exit 2; }
```

## Severity Guide

| Finding | Severity |
|---------|----------|
| Missing failure guard — script runs if file is missing | high |
| Using `find ~/.claude/plugins` — legacy pattern, non-portable for Gemini | high |
| Script filename mismatch between resolution pattern and actual file | high |
| Glob reference lookup pattern too broad | medium |
| Error message doesn't name the script or suggest a fix | medium |
| Hardcoded absolute paths that don't use extension-root awareness | high |

## Note

In Gemini CLI reviews, files matching these patterns are excluded: `**/node_modules/**`, `docs/**`.
