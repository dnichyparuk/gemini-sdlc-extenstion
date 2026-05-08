# SDLC Gemini Extension

## Overview
This extension automates the Software Development Lifecycle (SDLC) using a suite of specialized skills and agents. It provides a structured "Plan → Critique → Improve → Do" workflow for common engineering tasks like commits, PRs, and code reviews.

## Components

### Skills
- `/commit-sdlc`: Smart commit message generation with project-style matching.
- `/pr-sdlc`: Multi-section PR description generation from branch diffs.
- `/review-sdlc`: Multi-dimension automated code reviews (security, logic, etc.).
- `/ship-sdlc`: End-to-end pipeline (Execute → Commit → Review → Version → PR).
- `/plan-sdlc`: Requirement decomposition and implementation planning.
- `/execute-plan-sdlc`: Parallel implementation of tasks from a plan.

### Agents (Subagents)
- `commit-orchestrator`: Drafts commit messages in isolation.
- `review-orchestrator`: Orchestrates parallel dimension reviews.
- `error-report-orchestrator`: Standardizes tool failure reporting.

## Best Practices
- **Isolation:** Use `invoke_agent` for complex drafting to keep the main conversation context clean.
- **Verification:** Always run mechanical verification (build, tests, lint) after implementation steps.
- **Approval:** Never execute state-changing git/gh commands without explicit user approval via `ask_user`.
