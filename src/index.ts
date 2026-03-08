import { tool } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "@opencode-ai/plugin/tool";
import { readAccountIndex, renderDashboard, syncAccountIndex } from "./account-index.js";
import { replaceCopilotAuth } from "./auth-file.js";
import { resolveAccountIndexPath, resolveOpencodeAuthPath } from "./paths.js";

export default async function CopilotDashboardPlugin() {
  const dashboardTool = tool({
    description: "Show discovered Copilot accounts and quota status",
    args: {},
    async execute(_args: Record<string, never>, context: ToolContext) {
      context.metadata({ title: "Copilot Dashboard" });
      const index = await syncAccountIndex();
      return renderDashboard(index);
    },
  });

  const switchTool = tool({
    description: "Switch the active Copilot account by label or id",
    args: {
      account: tool.schema.string().describe("Account label or id to activate"),
    },
    async execute(args: { account: string }, context: ToolContext) {
      context.metadata({ title: `Switch Copilot: ${args.account}` });
      const index = await syncAccountIndex();
      const match = index.accounts.find(
        (account) => account.id === args.account || account.label === args.account,
      );
      if (!match) {
        throw new Error(`Unknown Copilot account: ${args.account}`);
      }

      await replaceCopilotAuth({
        authFilePath: resolveOpencodeAuthPath(),
        nextAuth: match.auth,
      });

      const nextIndex = await readAccountIndex(resolveAccountIndexPath());
      return [
        `Switched active Copilot account to ${match.label}.`,
        nextIndex.accounts.length > 0 ? "Run the dashboard command again to verify the updated active account." : "",
      ]
        .filter(Boolean)
        .join("\n");
    },
  });

  return {
    tool: {
      dashboard: dashboardTool,
      switch: switchTool,
      "copilot-dashboard": dashboardTool,
      "copilot-switch": switchTool,
    },
  };
}
