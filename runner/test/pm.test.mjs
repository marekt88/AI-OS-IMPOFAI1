// Unit tests: pmTool token selection and hasSecret (local HTTP server instead of PM, no network).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const seen = [];
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (d) => (body += d));
  req.on("end", () => {
    seen.push({ auth: req.headers.authorization, body: JSON.parse(body) });
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { content: [{ type: "text", text: JSON.stringify({ ok: true }) }] } }));
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const home = fs.mkdtempSync(path.join(os.tmpdir(), "aios-pm-"));
fs.writeFileSync(path.join(home, "secrets.env"),
  `PM_MCP_URL=http://127.0.0.1:${server.address().port}/api/mcp\nPM_MCP_TOKEN=report-token-123456\nPM_ACTIONS_TOKEN=actions-token-abcdef\n`);
process.env.AIOS_RUNNER_HOME = home;
delete process.env.PM_ACTIONS_TOKEN;
delete process.env.PM_OTHER_TOKEN;
const { pmTool, hasSecret } = await import("../pm.mjs");

test("default token is PM_MCP_TOKEN", async () => {
  assert.deepEqual(await pmTool("pm_get_current_identity", {}), { ok: true });
  assert.equal(seen.at(-1).auth, "Bearer report-token-123456");
  assert.equal(seen.at(-1).body.params.name, "pm_get_current_identity");
  assert.equal(seen.at(-1).body.params.arguments.response_format, "json");
});

test("tokenEnv selects another secret", async () => {
  await pmTool("pm_get_task", { task: "IMP-1" }, { tokenEnv: "PM_ACTIONS_TOKEN" });
  assert.equal(seen.at(-1).auth, "Bearer actions-token-abcdef");
});

test("explicit token wins", async () => {
  await pmTool("pm_get_task", { task: "IMP-1" }, { token: "explicit-token-999", tokenEnv: "PM_ACTIONS_TOKEN" });
  assert.equal(seen.at(-1).auth, "Bearer explicit-token-999");
});

test("missing tokenEnv secret fails, no fallback to PM_MCP_TOKEN", async () => {
  const n = seen.length;
  await assert.rejects(pmTool("pm_get_task", {}, { tokenEnv: "PM_OTHER_TOKEN" }), /PM_OTHER_TOKEN missing/);
  assert.equal(seen.length, n);
});

test("hasSecret", () => {
  assert.equal(hasSecret("PM_ACTIONS_TOKEN"), true);
  assert.equal(hasSecret("PM_OTHER_TOKEN"), false);
});

test("dry-run: write tools are not sent, read tools are", async () => {
  process.env.RUN_DRY = "1";
  try {
    const n = seen.length;
    assert.deepEqual(await pmTool("pm_create_task", { name: "x" }, { tokenEnv: "PM_ACTIONS_TOKEN" }), { dry_run: true, tool: "pm_create_task", args: { name: "x" } });
    assert.equal(seen.length, n);
    await pmTool("pm_get_task", { task: "IMP-1" });
    assert.equal(seen.length, n + 1);
  } finally {
    delete process.env.RUN_DRY;
  }
});

test.after(() => server.close());
