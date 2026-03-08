import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { syncAccountIndex, writeAccountIndex } from "../src/account-index.js";
import type { CopilotAccountIndex } from "../src/types.js";

test("syncAccountIndex prunes entries whose usage fetch reports expired tokens", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "copilot-prune-"));
  try {
    const authPath = path.join(dir, "auth.json");
    const indexPath = path.join(dir, "accounts.json");
    await fs.writeFile(
      authPath,
      `${JSON.stringify({ "github-copilot": { type: "oauth", refresh: "valid", access: "valid", expires: 0 } })}\n`,
    );
    const existing: CopilotAccountIndex = {
      version: 1,
      updatedAt: 0,
      accounts: [
        {
          id: "expired000001",
          label: "copilot-old",
          auth: { type: "oauth", refresh: "expired", access: "expired", expires: 0 },
          discoveredAt: 1,
          lastSeenAt: 1,
          active: false,
          status: "unknown",
          windows: [],
        },
      ],
    };
    await writeAccountIndex(existing, indexPath);

    const fetchMock: typeof fetch = async (_url, init) => {
      const authHeader = String((init?.headers as Record<string, string>).Authorization);
      if (authHeader.includes("expired")) {
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
      }
      return new Response(JSON.stringify({ quota_snapshots: { premium_interactions: { percent_remaining: 60 } } }), {
        status: 200,
      });
    };

    const next = await syncAccountIndex({ authFilePath: authPath, indexPath, fetchImpl: fetchMock, now: 1000 });
    assert.equal(next.accounts.length, 1);
    assert.equal(next.accounts[0]?.auth.access, "valid");
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
