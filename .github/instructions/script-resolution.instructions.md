---
applyTo: "**/skills/**/SKILL.md"
---
# script-resolution — Review Instructions

Reviews script resolution and reference lookup patterns in skills for runtime correctness within the Gemini CLI extension ecosystem. While Gemini CLI provides a simpler execution environment than Claude Code, maintaining procedural rigor in how dependencies are resolved is critical for extension reliability.

Default severity: high

## Checklist

- **Direct Path Resolution:** Every script resolution uses a simple relative path from the extension root (e.g., `scripts/skill/commit.js`).
- **Standard Execution:** Scripts are executed using `node` or the appropriate interpreter.
- **Exact Filenames:** The script filename in the resolution block must exactly match the file as it exists in the `scripts/` directory (case-sensitive, correct extension).
- **Mandatory Failure Guards:** Every resolution block ends with a failure guard: `[ ! -f "$SCRIPT" ] && { echo "ERROR: ..."; exit 2; }`. No silent continuation with a missing script.
- **Actionable Error Messages:** The error message in the failure guard names the specific script and explains how to fix it (e.g., "Is the sdlc extension linked?").
- **Specific Glob Patterns:** Glob-based reference file lookups (REFERENCE.md, EXAMPLES.md, agent definitions) use patterns specific enough to match exactly one file (e.g., `**/review-sdlc/REFERENCE.md` not `**/REFERENCE.md`).
- **No Hardcoded Absolute Paths:** No resolution pattern uses hardcoded absolute paths. Use relative paths or extension-aware path resolution provided by the agent context.
- **Cross-Step Consistency:** When a skill re-resolves the same script in a later step, both resolution blocks must use identical patterns to ensure consistent runtime behavior.

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
| Glob reference lookup pattern too broad (matches multiple files) | medium |
| Error message doesn't name the script or suggest a fix | medium |
| Hardcoded absolute paths | high |
| Divergent resolution patterns for the same script across steps | medium |

## Note

In Gemini CLI reviews, files matching these patterns are excluded: `**/node_modules/**`, `docs/**`.
