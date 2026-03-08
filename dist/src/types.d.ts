export type CopilotAuthEntry = {
    type: "oauth";
    refresh: string;
    access: string;
    expires: number;
    [key: string]: unknown;
};
export type AuthFile = Record<string, unknown> & {
    "github-copilot"?: CopilotAuthEntry;
};
export type UsageWindow = {
    label: string;
    usedPercent: number;
    resetAt?: number;
};
export type CopilotUsageSnapshot = {
    plan?: string;
    windows: UsageWindow[];
    error?: string;
};
export type CopilotAccountRecord = {
    id: string;
    label: string;
    auth: CopilotAuthEntry;
    discoveredAt: number;
    lastSeenAt: number;
    lastCheckedAt?: number;
    active: boolean;
    status: "ok" | "unknown";
    plan?: string;
    windows: UsageWindow[];
    error?: string;
};
export type CopilotAccountIndex = {
    version: 1;
    updatedAt: number;
    lastActiveId?: string;
    accounts: CopilotAccountRecord[];
};
