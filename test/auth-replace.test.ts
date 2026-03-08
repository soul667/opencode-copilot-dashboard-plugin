import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { replaceCopilotAuth } from "../src/auth-file.js";

test("replaceCopilotAuth rewrites only github-copilot", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "copilot-replace-"));
  try {
    const authPath = path.join(dir, "auth.json");
    const original = {
      openai: { type: "oauth", refresh: "oa", access: "oa", expires: 1 },
      google: { type: "oauth", refresh: "gg", access: "gg", expires: 2 },
      "github-copilot": { type: "oauth", refresh: "old", access: "old", expires: 0 },
    };
    await fs.writeFile(authPath, `${JSON.stringify(original)}\n`);

    await replaceCopilotAuth({
      authFilePath: authPath,
      nextAuth: { type: "oauth", refresh: "new", access: "new", expires: 0 },
    });

    const next = JSON.parse(await fs.readFile(authPath, "utf8"));
    assert.deepEqual(next.openai, original.openai);
    assert.deepEqual(next.google, original.google);
    assert.deepEqual(next["github-copilot"], { type: "oauth", refresh: "new", access: "new", expires: 0 });
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
