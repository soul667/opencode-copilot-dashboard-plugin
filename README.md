# OpenCode Copilot Dashboard Plugin

Command-first OpenCode plugin for GitHub Copilot account management in Linux/WSL.

It automatically discovers Copilot credentials from OpenCode auth state, keeps a local account index, fetches usage windows, and lets you switch active Copilot account safely.

## Features

- Auto-discover credentials from `~/.local/share/opencode/auth.json`
- Command dashboard (no GUI) for accounts + quota/status
- Safe switch by replacing only the `github-copilot` node
- Automatic pruning for expired/invalid credentials

## Commands

- `copilot-dashboard` (alias: `dashboard`)
  - Refreshes local index from current auth state
  - Fetches Copilot usage windows
  - Prints account list + active account + status
- `copilot-switch` (alias: `switch`)
  - Input: account `label` or `id`
  - Updates only `github-copilot` in auth.json

## Data Paths (Linux/WSL)

- OpenCode auth file: `~/.local/share/opencode/auth.json`
- Plugin account index: `~/.local/share/opencode-copilot-dashboard-plugin/accounts.json`

## Install (local project)

```bash
cd /path/to/opencode-copilot-dashboard-plugin
npm install
npm run build
```

Then add plugin into `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "opencode-copilot-dashboard-plugin"
  ]
}
```

If using local file dependency in `~/.config/opencode/package.json`:

```json
{
  "dependencies": {
    "opencode-copilot-dashboard-plugin": "file:/absolute/path/to/opencode-copilot-dashboard-plugin"
  }
}
```

## Safety Notes

- This plugin does not modify non-Copilot providers (`openai`, `google`, etc.).
- `auth.json` updates are atomic (temp write + rename).
- Failed writes keep original auth content unchanged.

## GitHub Actions

Two workflows are included:

- `.github/workflows/npm-publish.yml`
  - Trigger: release published, or manual dispatch
  - Publishes package to npm if the version does not already exist
  - Required secret: `NPM_PUBLISH_TOKEN`

- `.github/workflows/codex-pr-review.yml`
  - Trigger: pull request opened/synchronize/reopened
  - Runs Codex review and posts a PR comment
  - Required secret: `OPENAI_API_KEY`
  - Runs only for non-fork PRs by default
