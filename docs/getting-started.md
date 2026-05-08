# Getting Started

## Requirements

| Requirement | Version | Notes |
| --- | --- | --- |
| [Gemini CLI](https://geminicli.com/) | — | This is a Gemini CLI extension |
| Node.js | >= 16 | For helper scripts. Uses built-in modules, no `npm install` needed |
| git | — | Required for diff and commit analysis |
| gh (GitHub CLI) | — | Required for `/pr-sdlc`. Falls back to showing the description if unavailable |

## Installation

### Link locally

To use this extension in your Gemini CLI environment, clone this repository and link it:

```bash
gemini extensions link .
```

Verify the extension is active:
```bash
gemini extensions list
```

## First Use

Run the unified setup skill to configure the extension for your project:

```text
/setup-sdlc
```

This walks you through:
- **Version config** — version source, tag prefix, changelog
- **Ship config** — pipeline preset, bump type, review threshold
- **Review dimensions** — project-tailored code review criteria
- **PR template** — customized PR descriptions
- **Plan guardrails** — custom rules for plan critique phases

## What Gets Created

| File / Directory | Purpose |
| --- | --- |
| `.sdlc/config.json` | Unified project config — version, jira, commit, pr settings, and plan guardrails (created by `/setup-sdlc`) |
| `.sdlc/local.json` | User-local config — review and ship preferences (created by `/setup-sdlc`) |
| `.sdlc/review-dimensions/` | Per-project code review dimension files (created via `/setup-sdlc --dimensions`) |
| `.sdlc/pr-template.md` | Project PR template (created via `/setup-sdlc --pr-template`) |
