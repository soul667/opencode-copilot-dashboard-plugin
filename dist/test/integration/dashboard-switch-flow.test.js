import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readAccountIndex, renderDashboard, syncAccountIndex } from "../../src/account-index.js";
import { replaceCopilotAuth } from "../../src/auth-file.js";
function makeAuth(token) {
    return { "github-copilot": { type: "oauth", refresh: token, access: token, expires: 0 } };
}
test("dashboard and switch flow works end-to-end on fixtures", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "copilot-dashboard-"));
    try {
        const authPath = path.join(dir, "auth.json");
        const indexPath = path.join(dir, "accounts.json");
        const fetchMock = async (_url, init) => {
            const token = String((init?.headers).Authorization);
            const isA = token.includes("token-a");
            return new Response(JSON.stringify({
                quota_snapshots: { chat: { percent_remaining: isA ? 80 : 55 } },
                copilot_plan: isA ? "Copilot Pro" : "Copilot Business",
            }), { status: 200 });
        };
        await fs.writeFile(authPath, `${JSON.stringify(makeAuth("token-a"))}\n`);
        await syncAccountIndex({ authFilePath: authPath, indexPath, fetchImpl: fetchMock, now: 100 });
        await fs.writeFile(authPath, `${JSON.stringify(makeAuth("token-b"))}\n`);
        const index = await syncAccountIndex({ authFilePath: authPath, indexPath, fetchImpl: fetchMock, now: 200 });
        const dashboard = renderDashboard(index);
        assert.match(dashboard, /Copilot Dashboard/);
        assert.match(dashboard, /Copilot Business/);
        const first = index.accounts.find((account) => account.auth.access === "token-a");
        assert.ok(first);
        await replaceCopilotAuth({ authFilePath: authPath, nextAuth: first.auth });
        const switched = JSON.parse(await fs.readFile(authPath, "utf8"));
        assert.equal(switched["github-copilot"].access, "token-a");
        const persisted = await readAccountIndex(indexPath);
        assert.equal(persisted.accounts.length, 2);
    }
    finally {
        await fs.rm(dir, { recursive: true, force: true });
    }
});
