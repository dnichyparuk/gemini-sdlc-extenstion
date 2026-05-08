# SDLC Skills Guide for Gemini CLI

This guide explains how to use the **SDLC Utilities** extension to automate your software development lifecycle. These skills provide a structured, "Plan → Critique → Improve → Do" workflow for common engineering tasks.

## 🚀 Getting Started

Once the extension is enabled, Gemini CLI will automatically discover these skills. You can activate them by describing your intent (e.g., "Create a PR for these changes") or by explicitly calling them using the `/` command.

---

## 🛠 Core Skills

### 📝 Commit Automation (`/commit-sdlc`)
Analyzes your staged changes and generates a commit message that matches your project's style (Conventional Commits, Ticket-prefixed, etc.).
- **When to use:** When you have changes ready to commit but want a high-quality, descriptive message.
- **Workflow:** Analyzes diff → Drafts message → Self-critiques against project config → Presents for approval → Commits.

### 🌿 Pull Request Creation (`/pr-sdlc`)
Generates a comprehensive, 8-section PR description from your branch's commits and diffs.
- **When to use:** When opening a new PR or updating an existing one.
- **Key Feature:** Automatically detects Jira tickets, business context, and technical impact.
- **Command:** `/pr-sdlc [--draft] [--auto]`

### 🔍 Code Review (`/review-sdlc`)
Performs a multi-dimension code review (security, performance, style, logic) on your current branch.
- **When to use:** Before requesting human review or as a final check before merging.
- **Workflow:** Scans changes → Applies project-specific review dimensions → Categorizes findings by severity.

### 🛠 Automated Implementation (`/execute-plan-sdlc`)
Executes a multi-step implementation plan with parallel task execution and automatic error recovery.
- **When to use:** After creating a plan with `plan-sdlc` or when you have a structured task list.
- **Key Feature:** Uses "waves" to execute independent tasks concurrently.

### 📋 Requirement Planning (`/plan-sdlc`)
Converts vague requirements or specs into a structured execution plan optimized for AI agents.
- **When to use:** Before starting any complex feature or refactor.
- **Workflow:** Analyzes requirements → Drafts steps → Critiques for completeness → Saves to `.sdlc/plans/`.

---

## 🏗 Advanced Pipelines

### 🚢 The Shipping Pipeline (`/ship-sdlc`)
A unified command that chains multiple skills into a single "Ship it" workflow.
- **Sequence:** Execute Plan → Commit → Review → Version Bump → PR.
- **Safety:** Automatically stops if the code review finds high-severity issues.

---

## ⚙️ Configuration & Customization

Most skills look for configuration in the `.sdlc/` directory:
- **`.sdlc/config.json`**: Main configuration for commit patterns, PR labels, and review thresholds.
- **`.sdlc/pr-template.md`**: Custom template for your pull requests.
- **`.sdlc/review-dimensions/`**: Custom Markdown files defining specific rules for code reviews.

## 💡 Best Practices

1. **Stage your changes:** Most skills (like `/commit-sdlc`) operate on *staged* changes. Use `git add` before invoking them.
2. **Use --auto sparingly:** While `--auto` skips approval prompts, it's best to review AI-generated PR descriptions and commit messages for accuracy.
3. **Follow the Critique:** If a skill asks you a clarifying question (e.g., "What is the business benefit of this change?"), provide a concise answer to significantly improve the output.

---

## ❓ Troubleshooting

- **Skill not activating?** Ensure the extension is linked: `gemini extensions link .`
- **Permission errors?** PR and Jira skills require `gh` and Jira CLI/MCP tools to be authenticated.
- **Version mismatch?** Run `node ./hooks/session-start.js` to see the currently loaded version and skill count.
