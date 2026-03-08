import test from "node:test";
import assert from "node:assert/strict";
import plugin from "../../src/index.js";

test("plugin exposes a switch tool definition", async () => {
  const hooks = await plugin();
  assert.ok(hooks.tool?.switch);
});
