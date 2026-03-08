import type { CopilotAccountIndex, CopilotUsageSnapshot } from "./types.js";
export type FetchLike = typeof fetch;
export declare function fetchCopilotUsage(token: string, fetchImpl?: FetchLike): Promise<CopilotUsageSnapshot>;
export declare function readAccountIndex(indexPath?: string): Promise<CopilotAccountIndex>;
export declare function writeAccountIndex(index: CopilotAccountIndex, indexPath?: string): Promise<void>;
export declare function syncAccountIndex(params?: {
    authFilePath?: string;
    indexPath?: string;
    fetchImpl?: FetchLike;
    now?: number;
}): Promise<CopilotAccountIndex>;
export declare function renderDashboard(index: CopilotAccountIndex): string;
