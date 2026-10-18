// Unit tests: recognising transient `claude -p` failures (incl. the real 2026-10-18 OAuth refresh failure).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.AIOS_RUNNER_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "aios-classify-"));
const { classifyTransient, isReadOnlyTool, retryDelays } = await import("../core.mjs");
const FX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

/** Builds the runClaude() result from transcript lines the way core.mjs does. */
function fromTranscript(lines, exitCode) {
  let result = null, apiError = null;
  const toolCalls = [];
  for (const m of lines) {
    if (m.type === "assistant") {
      if (m.is_api_error_message || m.error) apiError = { error: m.error, text: m.message.content.map((c) => c.text ?? "").join(" ") };
      for (const c of m.message.content) if (c.type === "tool_use") toolCalls.push(c.name);
    }
    if (m.type === "result") result = m;
  }
  return { exitCode, timedOut: false, result, apiError, stderr: "", toolCalls, toolErrors: [], toolOk: [] };
}

test("2026-10-18 morning-brief: OAuth refresh race with subtype success is transient auth-refresh", () => {
  const lines = fs.readFileSync(path.join(FX, "2026-10-18-oauth-refresh.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const out = fromTranscript(lines, 1);
  assert.equal(out.result.subtype, "success"); // the trap: success + is_error
  const t = classifyTransient(out);
  assert.equal(t?.cls, "auth-refresh");
  assert.equal(t.retrySafe, true);
});

test("2026-10-18 run.json error message (exit 1, subtype success) is recognised as well", () => {
  const log = JSON.parse(fs.readFileSync(path.join(FX, "2026-10-18-oauth-refresh.run.json"), "utf8"));
  assert.equal(log.error.kind, "claude-error"); // what the old runner made of it
  const text = log.error.message.replace(/^claude -p: success: /, "");
  const out = { exitCode: log.steps.claude.exitCode, timedOut: false, stderr: "", toolCalls: [], apiError: null,
    result: { type: "result", subtype: log.steps.claude.subtype, is_error: true, num_turns: 1, result: text } };
  assert.equal(classifyTransient(out)?.cls, "auth-refresh");
});

test("successful run is not transient", () => {
  assert.equal(classifyTransient({ exitCode: 0, timedOut: false, toolCalls: [], result: { subtype: "success", is_error: false, result: "ok" } }), null);
});

test("timeout is never retried inside a run", () => {
  assert.equal(classifyTransient({ exitCode: null, timedOut: true, toolCalls: [], result: null, stderr: "ECONNRESET" }), null);
});

test("a model-level error mentioning a number like IMP-502 is not transient", () => {
  const out = { exitCode: 1, timedOut: false, toolCalls: [], stderr: "", result: { subtype: "error_during_execution", is_error: true, result: "could not update IMP-502" } };
  assert.equal(classifyTransient(out), null);
});

test("network error and 429/529 are transient", () => {
  const net = { exitCode: 1, timedOut: false, toolCalls: [], stderr: "", result: { subtype: "success", is_error: true, terminal_reason: "api_error", num_turns: 1, result: "API Error: Connection error. (fetch failed: ECONNRESET)" } };
  assert.equal(classifyTransient(net)?.cls, "network");
  const rate = { exitCode: 1, timedOut: false, toolCalls: [], stderr: "", result: { subtype: "success", is_error: true, api_error_status: 429, num_turns: 1, result: "API Error: 429 rate_limit_error" } };
  assert.equal(classifyTransient(rate)?.cls, "rate");
  const over = { exitCode: 1, timedOut: false, toolCalls: [], stderr: "", apiError: { text: "API Error: 529 Overloaded" }, result: { subtype: "success", is_error: true, num_turns: 1, result: "API Error: 529 Overloaded" } };
  assert.equal(classifyTransient(over)?.cls, "rate");
  const noResult = { exitCode: 1, timedOut: false, toolCalls: [], result: null, stderr: "Error: getaddrinfo EAI_AGAIN api.anthropic.com" };
  assert.equal(classifyTransient(noResult)?.cls, "network");
});

test("transient error after a write tool ran is not retry-safe", () => {
  const out = { exitCode: 1, timedOut: false, stderr: "", toolCalls: ["ToolSearch", "mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_get_task", "mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_create_task"],
    result: { subtype: "success", is_error: true, api_error_status: 529, num_turns: 3, result: "API Error: 529 Overloaded" } };
  const t = classifyTransient(out);
  assert.equal(t.cls, "rate");
  assert.equal(t.retrySafe, false);
  assert.match(t.why, /pm_create_task/);
});

test("read-only tool detection", () => {
  for (const t of ["ToolSearch", "mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_get_task", "mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_list_tasks", "mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_search_brain", "mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_read_brain_note", "mcp__claude_ai_Gmail__search_threads", "mcp__claude_ai_Gmail__get_thread", "mcp__claude_ai_Fireflies__fireflies_get_transcripts"])
    assert.equal(isReadOnlyTool(t), true, t);
  for (const t of ["mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_create_task", "mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_update_brain_note", "mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_append_brain_section", "mcp__claude_ai_Gmail__send_message", "Bash"])
    assert.equal(isReadOnlyTool(t), false, t);
});

test("retry delays: 60 s then 120 s by default", () => {
  const saved = process.env.RUN_RETRY_DELAYS_MS;
  delete process.env.RUN_RETRY_DELAYS_MS;
  assert.deepEqual(retryDelays(), [60_000, 120_000]);
  process.env.RUN_RETRY_DELAYS_MS = "0,5";
  assert.deepEqual(retryDelays(), [0, 5]);
  if (saved == null) delete process.env.RUN_RETRY_DELAYS_MS; else process.env.RUN_RETRY_DELAYS_MS = saved;
});
