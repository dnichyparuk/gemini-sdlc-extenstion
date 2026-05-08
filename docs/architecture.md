# Architecture

## Overview

This repository is a **Gemini CLI Extension** that provides a suite of specialized skills and agents for software development lifecycle (SDLC) automation.

## Directory Structure

```text
sdlc-gemini/
├── gemini-extension.json      # Extension manifest
├── GEMINI.md                  # Extension context and instructions
├── agents/                    # Subagent definitions (orchestrators spawned by skills)
├── skills/                    # Skill definitions (user-invocable skills)
│   └── <skill-name>/
│       ├── SKILL.md           # Skill entry point (YAML frontmatter + instructions)
│       └── *.md               # Optional supporting files
├── hooks/                     # Lifecycle hooks (SessionStart, BeforeTool, etc.)
├── scripts/                   # Core business logic and Git/Jira utilities
│   ├── skill/                 # Invoked by skills to pre-compute context
│   ├── ci/                    # CI validation and maintenance
│   ├── state/                 # State persistence CLIs
│   ├── util/                  # Action utilities
│   └── lib/                   # Shared modules (git, config, state, ...)
├── docs/                      # Documentation
└── tests/                     # Behavioral and script execution tests
```

## How It Works

### Extension Layer

The `gemini-extension.json` file is the entry point. It tells Gemini CLI:
1. The identity and version of the extension.
2. Which lifecycle hooks to attach to session events.
3. Where to find the `GEMINI.md` context file.

### Skills Layer

Skills are the primary user interface. Each skill is a directory in `skills/` containing a `SKILL.md` file.
- **Auto-discovery:** Gemini CLI scans the `skills/` directory and matches user intent against the `description` in skill frontmatter.
- **Tooling:** Skills use standard Gemini tools like `ask_user`, `invoke_agent`, and `run_shell_command`.

### Agents (Subagents)

Complex drafting and orchestration tasks (like multi-dimension code reviews or commit message generation) are delegated to isolated subagents in the `agents/` directory.
- **Context Isolation:** Subagents inherit only the specific manifest provided in their prompt, keeping the main conversation context clean.
- **Efficiency:** Drafting happens on faster/cheaper models (e.g., Gemini 1.5 Flash) before being presented for approval.

### Lifecycle Hooks

Hooks allow the extension to intercept events and provide guardrails:
- **SessionStart:** Injects version info and project status into the system reminder.
- **BeforeTool:** Intercepts dangerous Git commands or unauthorized Jira writes.
- **AfterTool:** Validates edited files against project schemas.

## Architecture Principles

1. **Spec-driven development** — every skill has a specification at `docs/specs/<skill-name>.md` that defines WHAT the skill must do.
2. **Plan → Critique → Improve → Do → Critique → Improve** — mandatory dual critique gates in every pipeline.
3. **Parallel execution** — independent steps run concurrently via parallel tool calls.
4. **Context Isolation** — heavy lifting is offloaded to subagents to prevent transcript bloat.
