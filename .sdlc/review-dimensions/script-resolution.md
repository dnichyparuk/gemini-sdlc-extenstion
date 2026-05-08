---
name: script-resolution
description: "Reviews script resolution and reference lookup patterns in skills for runtime correctness within the Gemini CLI extension ecosystem"
triggers:
  - "**/skills/**/SKILL.md"
skip-when:
  - "**/node_modules/**"
  - "docs/**"
severity: high
model: gemini-1.5-flash
---

# Script Resolution Review

Review the runtime script resolution and file reference lookup patterns embedded in skill markdown files. This project resolves Node.js helper scripts using simple relative paths from the extension root. This ensures the extension is portable across different environments.

## Checklist

- [ ] **Direct Path Resolution:** Every script resolution uses a simple relative path from the extension root (e.g., `scripts/skill/commit.js`).
- [ ] **Exact Filenames:** The script filename in the resolution block exactly matches the file as it exists in the `scripts/` directory.
- [ ] **Mandatory Failure Guards:** Every resolution block includes a failure guard: `[ ! -f "$SCRIPT" ] && { echo "ERROR: ..."; exit 2; }`.
- [ ] **Actionable Error Messages:** The error message in the failure guard names the specific script and explains how to fix it (e.g., "Is the sdlc extension linked?").
- [ ] **Specific Glob Patterns:** Glob-based reference file lookups (REFERENCE.md, EXAMPLES.md, agent definitions) use patterns specific enough to match exactly one file.
- [ ] **No Hardcoded Absolute Paths:** No resolution pattern uses hardcoded absolute paths.
- [ ] **Cross-Step Consistency:** When a skill re-resolves the same script in a later step, both resolution blocks use identical patterns.
- [ ] **Legacy Paths:** No resolution pattern uses legacy Claude-specific paths (e.g., `~/.claude/plugins`).

## Severity Guide

| Finding | Severity |
|---------|----------|
| Missing failure guard — script runs if file is missing | high |
| Using `find ~/.claude/plugins` — legacy pattern, non-portable for Gemini | high |
| Script filename mismatch between resolution pattern and actual file | high |
| Glob reference lookup pattern too broad (matches multiple files) | medium |
| Error message in failure guard doesn't name the script or suggest a fix | medium |
| Hardcoded absolute paths | high |
| Divergent resolution patterns for the same script across steps | medium |
