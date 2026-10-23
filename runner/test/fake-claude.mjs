#!/usr/bin/env node
// Fake `claude` CLI for runner tests: no network, no real Claude. Controlled by env:
//   FAKE_DIR   state dir (attempt counter, recorded args/prompts)
//   FAKE_PLAN  comma list of attempt outcomes: ok | oauth | net | no-tools | overloaded-after-write | not-json
//   FAKE_TOOL  tool name reported as called successfully in "ok"; FAKE_OUTPUT structured_output JSON
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = process.env.FAKE_DIR;
const args = process.argv.slice(2);
if (args[0] === "auth" && args[1] === "status") {
  process.stdout.write(process.env.FAKE_AUTH ?? JSON.stringify({ loggedIn: true, authMethod: "claude.ai", subscriptionType: "max" }));
  process.exit(0);
}
const countFile = path.join(dir, "count");
const n = (fs.existsSync(countFile) ? Number(fs.readFileSync(countFile, "utf8")) : 0) + 1;
fs.writeFileSync(countFile, String(n));
fs.writeFileSync(path.join(dir, `args-${n}.json`), JSON.stringify({ args, env: { RUN_DRY: process.env.RUN_DRY ?? null } }, null, 1));
fs.writeFileSync(path.join(dir, `prompt-${n}.txt`), args.at(-1));
const plan = (process.env.FAKE_PLAN ?? "ok").split(",");
const step = plan[Math.min(n, plan.length) - 1];
const out = (o) => process.stdout.write(JSON.stringify(o) + "\n");
const tool = process.env.FAKE_TOOL ?? "mcp__x__pm_get_current_identity";
if (step === "oauth") {
  const fx = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "2026-10-18-oauth-refresh.jsonl");
  process.stdout.write(fs.readFileSync(fx, "utf8"));
  process.exit(1);
} else if (step === "net") {
  out({ type: "result", subtype: "success", is_error: true, terminal_reason: "api_error", num_turns: 1, result: "API Error: Connection error. (fetch failed: ECONNRESET)" });
  process.exit(1);
} else if (step === "no-tools") {
  // 2026-10-23: connectors not loaded at init, the model gives up without calling any required tool
  out({ type: "system", subtype: "init", tools: ["StructuredOutput", "ToolSearch"], mcp_servers: [{ name: "plugin:kapsa:kapsa", status: "needs-auth" }] });
  out({ type: "result", subtype: "success", is_error: false, num_turns: 2, result: "", structured_output: { ok: false, error: "tools not available" } });
  process.exit(0);
} else if (step === "overloaded-after-write") {
  out({ type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "mcp__x__pm_create_task", input: {} }] } });
  out({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "created IMP-1" }] } });
  out({ type: "assistant", is_api_error_message: true, error: "server_error", message: { content: [{ type: "text", text: "API Error: 529 Overloaded" }] } });
  out({ type: "result", subtype: "success", is_error: true, terminal_reason: "api_error", num_turns: 2, api_error_status: 529, result: "API Error: 529 Overloaded" });
  process.exit(1);
} else {
  out({ type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: tool, input: {} }] } });
  out({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "ok" }] } });
  out({ type: "result", subtype: "success", is_error: false, num_turns: 2, result: "done", structured_output: JSON.parse(process.env.FAKE_OUTPUT ?? '{"ok":true}') });
  process.exit(0);
}
