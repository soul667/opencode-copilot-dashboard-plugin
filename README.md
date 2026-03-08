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

## Install

### Option A (recommended): let OpenCode install by plugin spec

Add this directly to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "opencode-copilot-dashboard-plugin@latest"
  ]
}
```

OpenCode will resolve and install the plugin package automatically.

### Option B: preinstall with npm in OpenCode config directory

```bash
cd ~/.config/opencode
npm install opencode-copilot-dashboard-plugin
```

Then add plugin into `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "opencode-copilot-dashboard-plugin"
  ]
}
```

Ensure the plugin is listed in `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "opencode-copilot-dashboard-plugin"
  ]
}
```

For local development only, you may still use a `file:` dependency.

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
