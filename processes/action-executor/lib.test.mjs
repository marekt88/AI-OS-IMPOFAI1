// Unit tests of the executor checks: node --test processes/*/lib.test.mjs (no network, PM or calls; pmTool is a fake).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { verifyModelRun, transcriptCalls, runDeterministic, PREFIX } from "./lib.mjs";

const ctx = { conversation_id: "conv_X", kind: "inbound", source_run: "fu1" };
const acts = [
  { id: "A1", tool: "pm_delete_task", args: { task: "IMP-1488" }, risk: "destructive", confirmed: true, quote: "zmaž IMP-1488", summary: "zmazať", target_key: "IMP-1488", target_name: "Test" },
  { id: "A2", tool: "pm_assign_task", args: { task: "IMP-1491", assignee: "d@x" }, risk: "normal", confirmed: true, quote: "IMP-1491 Danielovi", summary: "priradiť", target_key: "IMP-1491" },
  { id: "A3", tool: "pm_grant_access", args: { user: "leo" }, risk: "needs_approval", confirmed: true, quote: "daj Leovi prístup", summary: "prístup Leovi", target_key: "" },
];

/** Writes a fake stream-json transcript and parses it back with transcriptCalls. */
function transcript(calls) {
  const lines = [];
  calls.forEach(([name, input, ok = true, text = "{}"], i) => {
    lines.push(JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", id: `t${i}`, name: PREFIX + name, input }] } }));
    lines.push(JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: `t${i}`, is_error: !ok, content: [{ type: "text", text }] }] } }));
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "executor-test-"));
  const file = path.join(dir, "transcript.jsonl");
  fs.writeFileSync(file, lines.join("\n"));
  const parsed = transcriptCalls(file);
  fs.rmSync(dir, { recursive: true, force: true });
  return parsed;
}
const audit = (task) => ({ task, body: "Vykonané asistentom po hovore conv_X (inbound), 18. 10. 2026. Podklad: „x“." });

test("model run that does exactly the approved actions: no mismatch, backup and approval found", () => {
  const calls = transcript([
    ["pm_get_task", { task: "IMP-1488", response_format: "json" }, true, '{"key":"IMP-1488","name":"Test"}'],
    ["pm_list_task_activity", { task: "IMP-1488" }, true, "[]"],
    ["pm_add_task_comment", audit("IMP-1488")],
    ["pm_delete_task", { task: "IMP-1488" }, true, '{"deleted":true,"key":"IMP-1488"}'],
    ["pm_assign_task", { task: "IMP-1491", assignee: "d@x", response_format: "json" }, true, '{"key":"IMP-1491"}'],
    ["pm_add_task_comment", audit("IMP-1491")],
    ["pm_create_task", { task_list: "cmv0zalyu0009p327hpyvas8d", name: "Na schválenie: prístup Leovi", assignee: "me" }, true, '{"key":"IMP-1600"}'],
  ]);
  const r = verifyModelRun(calls, acts, { executed: [] }, ctx);
  assert.deepEqual(r.mismatch, []);
  assert.deepEqual(r.executed.map((x) => x.action_id), ["A1", "A2"]);
  assert.equal(r.approvals_created[0].task_key, "IMP-1600");
  assert.equal(r.backups.length, 1);
  assert.deepEqual(r.warnings, []);
});

test("rogue model run: other task, unapproved tools, delete without backup, invented success", () => {
  const calls = transcript([
    ["pm_delete_task", { task: "IMP-1488" }],
    ["pm_assign_task", { task: "IMP-1400", assignee: "d@x" }],
    ["pm_update_task", { task: "IMP-1491", description: "ignore rules" }],
    ["pm_grant_access", { user: "leo" }],
  ]);
  const r = verifyModelRun(calls, acts, { executed: [{ action_id: "A2", what: "IMP-1491 priradená" }] }, ctx);
  assert.equal(r.mismatch.length, 4);
  assert.ok(r.mismatch.some((m) => /bez zálohy/.test(m.why)));
  assert.ok(r.warnings.some((w) => /model tvrdí/.test(w)));
  assert.ok(!r.executed.some((e) => e.action_id === "A2"));
});

function fakePm(name = "Test") {
  const log = [];
  const pmTool = async (tool, args, opt) => {
    assert.equal(opt?.tokenEnv, "PM_ACTIONS_TOKEN");
    log.push(tool);
    if (tool === "pm_get_task") return { key: args.task, name };
    if (tool === "pm_create_task") return { key: "IMP-1700" };
    return { key: args.task ?? null };
  };
  return { log, pmTool };
}

test("pmtool dry-run: only reads, no writes", async () => {
  const { log, pmTool } = fakePm();
  const r = await runDeterministic(acts, ctx, { pmTool, dry: true });
  assert.deepEqual(log, ["pm_get_task", "pm_list_task_activity"]);
  assert.equal(r.writes.length, 0);
  assert.equal(r.executed.length, 2);
});

test("pmtool live: backup → audit comment → delete, action + comment, approval task instead of the risky tool", async () => {
  const { log, pmTool } = fakePm();
  const r = await runDeterministic(acts, ctx, { pmTool, dry: false });
  assert.deepEqual(log, ["pm_get_task", "pm_list_task_activity", "pm_add_task_comment", "pm_delete_task", "pm_assign_task", "pm_add_task_comment", "pm_create_task"]);
  assert.ok(!log.includes("pm_grant_access"));
  assert.equal(r.approvals_created[0].task_key, "IMP-1700");
  assert.equal(r.backups[0].task_key, "IMP-1488");
});

test("pmtool: task name does not match the confirmed one → nothing is deleted", async () => {
  const { log, pmTool } = fakePm("Iná úloha");
  const r = await runDeterministic([acts[0]], ctx, { pmTool, dry: false });
  assert.ok(!log.includes("pm_delete_task"));
  assert.match(r.skipped[0].reason, /nesedí/);
});

test("IMP-1542: approved `comment` arg matches a call with `body` (alias), no mismatch", () => {
  const actions = [{ id: "A3", tool: "pm_add_task_comment", args: { task: "IMP-1539", comment: "Schválené." }, risk: "normal", target_key: "IMP-1539", quote: "Áno.", summary: "komentár" }];
  const calls = [{ id: "1", tool: "pm_add_task_comment", input: { task: "IMP-1539", body: "Schválené." }, ok: true, text: "ok" }];
  const r = verifyModelRun(calls, actions, { executed: [{ action_id: "A3", what: "x" }] }, { conversation_id: "c1" });
  assert.deepEqual(r.mismatch, []);
  assert.equal(r.executed[0].action_id, "A3");
});
