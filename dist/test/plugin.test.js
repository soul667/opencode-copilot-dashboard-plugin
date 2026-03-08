import test from "node:test";
import assert from "node:assert/strict";
import plugin from "../src/index.js";
test("plugin exposes dashboard and switch tools", async () => {
    const hooks = await plugin();
    assert.ok(hooks.tool);
    assert.ok(hooks.tool.dashboard);
    assert.ok(hooks.tool.switch);
    assert.ok(hooks.tool["copilot-dashboard"]);
    assert.ok(hooks.tool["copilot-switch"]);
});
