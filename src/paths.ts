import os from "node:os";
import path from "node:path";

export function resolveOpencodeAuthPath(homeDir = os.homedir()): string {
  return path.join(homeDir, ".local", "share", "opencode", "auth.json");
}

export function resolvePluginStateDir(homeDir = os.homedir()): string {
  return path.join(homeDir, ".local", "share", "opencode-copilot-dashboard-plugin");
}

export function resolveAccountIndexPath(homeDir = os.homedir()): string {
  return path.join(resolvePluginStateDir(homeDir), "accounts.json");
}
