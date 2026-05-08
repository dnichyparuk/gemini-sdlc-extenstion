# SDLC Gemini Extension

Enterprise-grade SDLC automation for [Gemini CLI](https://geminicli.com/). This extension provides a suite of specialized skills and agents to automate your software development lifecycle, from requirement planning to pull requests and releases.

> **Project Origin:** This extension is a port of the [sdlc-marketplace](https://github.com/rnagrodzki/sdlc-marketplace) project, originally designed for Claude Code.

## Installation

### Link locally

To use this extension in your Gemini CLI environment:

```bash
gemini extensions link .
```

See [GUIDE.md](GUIDE.md) for a full first-use walkthrough and detailed skill reference.

---

## 🌊 Automated Workflows

The SDLC extension follows a rigorous **"Plan → Critique → Improve → Do"** pattern, ensuring high quality through automated quality gates.

### The Shipping Pipeline (`/ship-sdlc`)

```text
       ┌──────────┐
       │ Requirements │
       └─────┬────┘
             ▼
     ┌───────────────┐
     │  /plan-sdlc   │ ──► Critiques & Decomposes
     └───────┬───────┘
             ▼
     ┌───────────────┐
     │/execute-plan  │ ──► Parallel Implementation
     └───────┬───────┘
             ▼
     ┌───────────────┐
     │ /commit-sdlc  │ ──► Project-style Matching
     └───────┬───────┘
             ▼
     ┌───────────────┐
     │ /review-sdlc  │ ──► Multi-dimension Audit
     └───────┬───────┘
             ▼
      (Quality Gate) ──────┐
      │   Issues?    │     │
      └──────┬───────┘     │
         No  │     Yes     ▼
             │      ┌───────────────┐
             │      │/received-review│ ──► Automated Fixes
             │      └───────┬───────┘
             │              │
             ▼ ◄────────────┘
     ┌───────────────┐
     │/version-sdlc  │ ──► SemVer & Tags
     └───────┬───────┘
             ▼
     ┌───────────────┐
     │   /pr-sdlc    │ ──► Multi-section Summary
     └───────┬───────┘
             ▼
       ┌──────────┐
       │   Ship!  │
       └──────────┘
```

---

## Skills

| Skill | Description |
| --- | --- |
| [`/pr-sdlc`](docs/skills/pr-sdlc.md) | Create a PR with an auto-generated structured description |
| [`/review-sdlc`](docs/skills/review-sdlc.md) | Run multi-dimension code review on the current branch |
| [`/received-review-sdlc`](docs/skills/received-review-sdlc.md) | Process code review feedback with verification and implementation |
| [`/version-sdlc`](docs/skills/version-sdlc.md) | Bump version, create git tag, and generate CHANGELOG |
| [`/commit-sdlc`](docs/skills/commit-sdlc.md) | Analyze staged changes and generate project-style commit messages |
| [`/plan-sdlc`](docs/skills/plan-sdlc.md) | Write implementation plans optimized for autonomous execution |
| [`/execute-plan-sdlc`](docs/skills/execute-plan-sdlc.md) | Execute implementation plans with adaptive intelligence and recovery |
| [`/ship-sdlc`](docs/skills/ship-sdlc.md) | Chain execution, commit, review, and PR into a single pipeline |

| [`/jira-sdlc`](docs/skills/jira-sdlc.md) | Create, edit, search, and transition Jira issues with cached project metadata |
| [`/setup-sdlc`](docs/skills/setup-sdlc.md) | Unified project setup — configure version, ship, review, PR templates, guardrails, and jira settings in one flow |
| [`/harden-sdlc`](docs/skills/harden-sdlc.md) | After a pipeline failure, analyze hardening surfaces (guardrails, review dimensions, copilot instructions) and propose user-approved edits that would catch the same class of failure earlier next time |
| [`/verify-pipeline-sdlc`](docs/skills/verify-pipeline-sdlc.md) | Analyze a failed CI run on a PR, classify the root cause, and either apply a minimal fix or emit a proposal — invoked by ship-sdlc's verify-pipeline step under --auto |

---

## Documentation

| Document | Description |
| --- | --- |
| [GUIDE.md](GUIDE.md) | **Primary User Guide** for the SDLC extension |
| [Getting Started](docs/getting-started.md) | Installation and first-use walkthrough |
| [Architecture](docs/architecture.md) | Extension structure, agent dispatch model, and name resolution |
| [Cost Tiers](docs/cost-tiers.md) | Per-skill/agent model assignments and dispatch overrides |
| [Adding Skills](docs/adding-skills.md) | How to create custom skills for your project |
| [Skill Best Practices](docs/skill-best-practices.md) | Design patterns for reliable, maintainable skills |
| [OpenSpec Integration](docs/openspec-integration.md) | Using SDLC skills with OpenSpec for spec-driven development |

## Troubleshooting

### Extension not recognized

Ensure the extension is linked to your Gemini CLI:
```bash
gemini extensions link .
```
Verify the extension appears in `gemini extensions list`.

### Hook execution errors

If hooks (like `session-start`) fail, ensure you have Node.js installed and available in your PATH. The extension uses `node` to execute lifecycle logic.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

[AGPL-3.0](LICENSE)
