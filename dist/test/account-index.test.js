import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { syncAccountIndex } from "../src/account-index.js";
async function withTempDir(fn) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "copilot-index-"));
    try {
        await fn(dir);
    }
    finally {
        await fs.rm(dir, { recursive: true, force: true });
    }
}
function authFile(token) {
    return {
        "github-copilot": {
            type: "oauth",
            refresh: token,
            access: token,
            expires: 0,
        },
        openai: { type: "oauth", refresh: "oa", access: "oa", expires: 1 },
    };
}
test("syncAccountIndex discovers new credentials and updates metadata", async () => {
    await withTempDir(async (dir) => {
        const authPath = path.join(dir, "auth.json");
        const indexPath = path.join(dir, "accounts.json");
        await fs.writeFile(authPath, `${JSON.stringify(authFile("gho_token_a"))}\n`);
        const fetchMock = async () => new Response(JSON.stringify({ quota_snapshots: { chat: { percent_remaining: 80 } }, copilot_plan: "Copilot Pro" }), { status: 200 });
        const first = await syncAccountIndex({ authFilePath: authPath, indexPath, fetchImpl: fetchMock, now: 100 });
        assert.equal(first.accounts.length, 1);
        assert.equal(first.accounts[0]?.plan, "Copilot Pro");
        assert.deepEqual(first.accounts[0]?.windows, [{ label: "Chat", usedPercent: 20 }]);
        await fs.writeFile(authPath, `${JSON.stringify(authFile("gho_token_b"))}\n`);
        const second = await syncAccountIndex({ authFilePath: authPath, indexPath, fetchImpl: fetchMock, now: 200 });
        assert.equal(second.accounts.length, 2);
        assert.ok(second.accounts.some((account) => account.active));
    });
});
