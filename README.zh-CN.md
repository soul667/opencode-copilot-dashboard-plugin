# OpenCode Copilot Dashboard 插件

这是一个面向 Linux/WSL 的命令行插件，用于在 OpenCode 中管理 GitHub Copilot 多账号。

它会自动从 OpenCode 的 `auth.json` 发现 Copilot 凭证，维护本地账号索引，拉取配额窗口信息，并安全切换当前 Copilot 账号。

## 功能

- 自动发现 `~/.local/share/opencode/auth.json` 中的 Copilot 凭证
- 命令式 dashboard（无 GUI）查看账号与配额/状态
- 安全切换：只替换 `github-copilot` 节点
- 自动清理失效或过期凭证

## 命令

- `copilot-dashboard`（别名：`dashboard`）
  - 从当前 auth 状态刷新本地索引
  - 拉取 Copilot 使用窗口数据
  - 输出账号列表、当前激活账号与状态
- `copilot-switch`（别名：`switch`）
  - 参数：账号 `label` 或 `id`
  - 仅更新 auth.json 里的 `github-copilot`

## 数据路径（Linux/WSL）

- OpenCode 认证文件：`~/.local/share/opencode/auth.json`
- 插件账号索引：`~/.local/share/opencode-copilot-dashboard-plugin/accounts.json`

## 安装

### 方案 A（推荐）：让 OpenCode 按插件标识自动安装

直接在 `~/.config/opencode/opencode.json` 里添加：

```json
{
  "plugin": [
    "opencode-copilot-dashboard-plugin@latest"
  ]
}
```

OpenCode 会自动解析并安装该 npm 插件。

### 方案 B：先在 OpenCode 配置目录里手动 npm 安装

```bash
cd ~/.config/opencode
npm install opencode-copilot-dashboard-plugin
```

然后把插件加入 `~/.config/opencode/opencode.json`：

```json
{
  "plugin": [
    "opencode-copilot-dashboard-plugin"
  ]
}
```

确认 `~/.config/opencode/opencode.json` 中包含插件项：

```json
{
  "plugin": [
    "opencode-copilot-dashboard-plugin"
  ]
}
```

仅在本地开发插件时，才建议使用 `file:` 依赖方式。

## 安全说明

- 不会修改非 Copilot provider（如 `openai`、`google`）。
- 对 `auth.json` 的写入是原子操作（临时文件 + rename）。
- 写入失败时会保持原始 auth 内容不变。

## GitHub Actions

仓库内已包含两套工作流：

- `.github/workflows/npm-publish.yml`
  - 触发：发布 Release、或手动触发
  - 功能：若 npm 上不存在当前版本则自动发布
  - 必需 Secret：`NPM_PUBLISH_TOKEN`

- `.github/workflows/codex-pr-review.yml`
  - 触发：PR opened/synchronize/reopened
  - 功能：运行 Codex 代码审查并自动评论到 PR
  - 必需 Secret：`OPENAI_API_KEY`
  - 默认仅在非 fork PR 上运行（避免泄露密钥）
