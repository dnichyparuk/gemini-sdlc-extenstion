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

- [ ] Every script resolution uses a simple relative path from the extension root (e.g., `scripts/skill/commit.js`)
- [ ] Every resolution block includes a failure guard: `[ ! -f "$SCRIPT" ] && { echo "ERROR: ..."; exit 2; }`
- [ ] The error message in the failure guard names the specific script and explains how to fix it (e.g., "Is the sdlc extension linked?")
- [ ] Glob-based reference file lookups (REFERENCE.md, EXAMPLES.md, agent definitions) use patterns relative to the extension root
- [ ] No resolution pattern uses legacy Claude-specific paths (e.g., `~/.claude/plugins`)

## Severity Guide

| Finding | Severity |
|---------|----------|
| Missing failure guard — script runs if file is missing | high |
| Using `find ~/.claude/plugins` — legacy pattern, non-portable for Gemini | high |
| Script filename mismatch between resolution pattern and actual file | high |
| Glob reference lookup pattern too broad — could match wrong file | medium |
| Error message in failure guard doesn't name the script or suggest a fix | medium |
| Hardcoded absolute paths that don't use extension-root awareness | high |
