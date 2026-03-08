import type { ToolContext } from "@opencode-ai/plugin/tool";
export default function CopilotDashboardPlugin(): Promise<{
    tool: {
        dashboard: {
            description: string;
            args: {};
            execute(args: Record<string, never>, context: ToolContext): Promise<string>;
        };
        switch: {
            description: string;
            args: {
                account: import("zod").ZodString;
            };
            execute(args: {
                account: string;
            }, context: ToolContext): Promise<string>;
        };
        "copilot-dashboard": {
            description: string;
            args: {};
            execute(args: Record<string, never>, context: ToolContext): Promise<string>;
        };
        "copilot-switch": {
            description: string;
            args: {
                account: import("zod").ZodString;
            };
            execute(args: {
                account: string;
            }, context: ToolContext): Promise<string>;
        };
    };
}>;
