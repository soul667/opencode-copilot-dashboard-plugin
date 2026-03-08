import fs from "node:fs/promises";
import { atomicWriteJson, extractCopilotAuth, fingerprintAuth, labelForAuth, readAuthFile } from "./auth-file.js";
import { resolveAccountIndexPath, resolveOpencodeAuthPath } from "./paths.js";
function clampPercent(value) {
    return Math.max(0, Math.min(100, Number(value.toFixed(1))));
}
export async function fetchCopilotUsage(token, fetchImpl = fetch) {
    const response = await fetchImpl("https://api.github.com/copilot_internal/user", {
        headers: {
            Authorization: `token ${token}`,
            "Editor-Version": "vscode/1.96.2",
            "User-Agent": "GitHubCopilotChat/0.26.7",
            "X-Github-Api-Version": "2025-04-01",
        },
    });
    if (!response.ok) {
        const error = response.status === 401 || response.status === 403 ? "Token expired" : `HTTP ${response.status}`;
        return { windows: [], error };
    }
    const payload = (await response.json());
    const windows = [];
    const premiumRemaining = payload.quota_snapshots?.premium_interactions?.percent_remaining;
    if (premiumRemaining !== undefined && premiumRemaining !== null) {
        windows.push({ label: "Premium", usedPercent: clampPercent(100 - premiumRemaining) });
    }
    const chatRemaining = payload.quota_snapshots?.chat?.percent_remaining;
    if (chatRemaining !== undefined && chatRemaining !== null) {
        windows.push({ label: "Chat", usedPercent: clampPercent(100 - chatRemaining) });
    }
    return { plan: payload.copilot_plan, windows };
}
export async function readAccountIndex(indexPath = resolveAccountIndexPath()) {
    try {
        const raw = await fs.readFile(indexPath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && Array.isArray(parsed.accounts)) {
            return parsed;
        }
    }
    catch {
    }
    return { version: 1, updatedAt: 0, accounts: [] };
}
export async function writeAccountIndex(index, indexPath = resolveAccountIndexPath()) {
    await atomicWriteJson(indexPath, index);
}
function mergeAccount(existing, currentAuth) {
    return {
        ...existing,
        ...currentAuth,
        discoveredAt: existing?.discoveredAt ?? currentAuth.discoveredAt,
        windows: existing?.windows ?? [],
        status: existing?.status ?? "unknown",
    };
}
function sortAccounts(accounts) {
    return [...accounts].sort((left, right) => {
        if (left.active !== right.active)
            return left.active ? -1 : 1;
        if (left.status !== right.status)
            return left.status === "ok" ? -1 : 1;
        return left.label.localeCompare(right.label);
    });
}
export async function syncAccountIndex(params) {
    const authFilePath = params?.authFilePath ?? resolveOpencodeAuthPath();
    const indexPath = params?.indexPath ?? resolveAccountIndexPath();
    const fetchImpl = params?.fetchImpl ?? fetch;
    const now = params?.now ?? Date.now();
    const authFile = await readAuthFile(authFilePath);
    const currentAuth = extractCopilotAuth(authFile);
    const index = await readAccountIndex(indexPath);
    const accountsById = new Map(index.accounts.map((account) => [account.id, account]));
    if (currentAuth) {
        const id = fingerprintAuth(currentAuth);
        const currentRecord = {
            id,
            label: labelForAuth(currentAuth),
            auth: currentAuth,
            discoveredAt: now,
            lastSeenAt: now,
            active: true,
            status: "unknown",
            windows: [],
        };
        accountsById.set(id, mergeAccount(accountsById.get(id), currentRecord));
        index.lastActiveId = id;
    }
    const refreshed = [];
    for (const account of accountsById.values()) {
        const usage = await fetchCopilotUsage(account.auth.access, fetchImpl);
        if (usage.error === "Token expired") {
            continue;
        }
        refreshed.push({
            ...account,
            active: account.id === index.lastActiveId,
            status: usage.error ? "unknown" : "ok",
            plan: usage.plan,
            windows: usage.windows,
            error: usage.error,
            lastCheckedAt: now,
        });
    }
    const nextIndex = {
        version: 1,
        updatedAt: now,
        lastActiveId: index.lastActiveId,
        accounts: sortAccounts(refreshed),
    };
    await writeAccountIndex(nextIndex, indexPath);
    return nextIndex;
}
export function renderDashboard(index) {
    if (index.accounts.length === 0) {
        return [
            "Copilot Dashboard",
            "",
            "No Copilot accounts discovered yet.",
            "Authenticate with your normal Copilot flow first, then rerun this dashboard command.",
        ].join("\n");
    }
    const lines = ["Copilot Dashboard", "", "Accounts:"];
    for (const account of index.accounts) {
        const marker = account.active ? "*" : "-";
        const windows = account.windows.length
            ? account.windows.map((window) => `${window.label} ${window.usedPercent}% used`).join(", ")
            : "quota unavailable";
        const plan = account.plan ?? "plan unknown";
        const status = account.error ? `status=${account.error}` : `status=${account.status}`;
        lines.push(`${marker} ${account.label} | ${plan} | ${windows} | ${status}`);
    }
    return lines.join("\n");
}
