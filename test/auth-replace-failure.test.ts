import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { replaceCopilotAuth } from "../src/auth-file.js";

test("replaceCopilotAuth preserves original file when write fails", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "copilot-replace-fail-"));
  try {
    const authPath = path.join(dir, "auth.json");
    const original = { "github-copilot": { type: "oauth", refresh: "old", access: "old", expires: 0 } };
    await fs.writeFile(authPath, `${JSON.stringify(original)}\n`);

    await assert.rejects(() =>
      replaceCopilotAuth({
        authFilePath: authPath,
        nextAuth: { type: "oauth", refresh: "new", access: "new", expires: 0 },
        writeFileImpl: async () => {
          throw new Error("disk full");
        },
      }),
    );

    const nextRaw = await fs.readFile(authPath, "utf8");
    assert.deepEqual(JSON.parse(nextRaw), original);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
