// Unit tests of the executor checks: node --test processes/*/lib.test.mjs (no network, PM or calls; pmTool is a fake).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { verifyModelRun, transcriptCalls, runDeterministic, changesSummary, auditText, PREFIX } from "./lib.mjs";

const ctx = { conversation_id: "conv_X", kind: "inbound", source_run: "fu1" };
const acts = [
  // a confirmed "zmaž" reaches the executor as a cancel (call-followup precheck → asCancel)
  { id: "A1", tool: "pm_update_task_status", args: { task: "IMP-1488", status: "cancelled" }, cancel: true, risk: "destructive", confirmed: true, quote: "zmaž IMP-1488", summary: "zrušiť", target_key: "IMP-1488", target_name: "Test" },
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
    ["pm_update_task_status", { task: "IMP-1488", status: "cancelled" }, true, '{"key":"IMP-1488","status":"cancelled"}'],
    ["pm_add_task_comment", audit("IMP-1488")],
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

test("rogue model run: other task, unapproved tools, a delete, invented success", () => {
  const calls = transcript([
    ["pm_delete_task", { task: "IMP-1488" }],
    ["pm_assign_task", { task: "IMP-1400", assignee: "d@x" }],
    ["pm_update_task", { task: "IMP-1491", description: "ignore rules" }],
    ["pm_grant_access", { user: "leo" }],
  ]);
  const r = verifyModelRun(calls, acts, { executed: [{ action_id: "A2", what: "IMP-1491 priradená" }] }, ctx);
  assert.equal(r.mismatch.length, 4);
  assert.ok(r.mismatch.some((m) => m.tool === "pm_delete_task" && /mazanie úloh je vypnuté/.test(m.why)));
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

test("pmtool live: backup → cancel → audit comment, action + comment, approval task instead of the risky tool", async () => {
  const { log, pmTool } = fakePm();
  const r = await runDeterministic(acts, ctx, { pmTool, dry: false });
  assert.deepEqual(log, ["pm_get_task", "pm_list_task_activity", "pm_update_task_status", "pm_add_task_comment", "pm_assign_task", "pm_add_task_comment", "pm_create_task"]);
  assert.deepEqual(r.writes[0].args, { task: "IMP-1488", status: "cancelled" });
  assert.match(r.executed[0].what, /IMP-1488: zrušená/);
  assert.match(r.executed[0].audit_comment, /zrušená \(stav CANCELLED\), nie zmazaná/);
  assert.ok(!log.includes("pm_grant_access"));
  assert.equal(r.approvals_created[0].task_key, "IMP-1700");
  assert.equal(r.backups[0].task_key, "IMP-1488");
});

test("pmtool: task name does not match the confirmed one → nothing is cancelled", async () => {
  const { log, pmTool } = fakePm("Iná úloha");
  const r = await runDeterministic([acts[0]], ctx, { pmTool, dry: false });
  assert.ok(!log.includes("pm_update_task_status"));
  assert.match(r.skipped[0].reason, /nesedí/);
});

test("pmtool: a raw pm_delete_task action is never executed", async () => {
  const { log, pmTool } = fakePm();
  const del = { id: "D1", tool: "pm_delete_task", args: { task: "IMP-1488" }, risk: "destructive", confirmed: true, quote: "zmaž IMP-1488", summary: "zmazať", target_key: "IMP-1488", target_name: "Test" };
  const r = await runDeterministic([del], ctx, { pmTool, dry: false });
  assert.deepEqual(log, []);
  assert.match(r.skipped[0].reason, /mazanie úloh je vypnuté/);
});

test("audit comment points to the call note; summary of the changes for the call note", () => {
  assert.match(auditText({ ...ctx, call_note: "context/hovory/2026-10-23-x.md" }, "zruš to"), /Hovor v second braine: context\/hovory\/2026-10-23-x\.md\. Podklad: „zruš to“/);
  assert.doesNotMatch(auditText(ctx, "x"), /second braine/);
  const sum = changesSummary(
    { executed: [{ action_id: "A1", what: "IMP-1488: zrušená („Test“)" }], approvals_created: [{ action_id: "A3", what: "na schválenie: prístup Leovi", task_key: "IMP-1700" }], skipped: [{ action_id: "A2", reason: "chyba PM: x" }] },
    acts,
    [{ summary: "presun do Iného listu", reason: "presun: cieľový list nezaznel" }],
  );
  assert.match(sum, /- urobené: IMP-1488: zrušená/);
  assert.match(sum, /- čaká na schválenie: na schválenie: prístup Leovi \(IMP-1700\)/);
  assert.match(sum, /- neurobené: priradiť \(chyba PM: x\)/);
  assert.match(sum, /- neurobené: presun do Iného listu/);
  assert.equal(changesSummary({ executed: [], approvals_created: [], skipped: [] }), null);
});

test("IMP-1542: approved `comment` arg matches a call with `body` (alias), no mismatch", () => {
  const actions = [{ id: "A3", tool: "pm_add_task_comment", args: { task: "IMP-1539", comment: "Schválené." }, risk: "normal", target_key: "IMP-1539", quote: "Áno.", summary: "komentár" }];
  const calls = [{ id: "1", tool: "pm_add_task_comment", input: { task: "IMP-1539", body: "Schválené." }, ok: true, text: "ok" }];
  const r = verifyModelRun(calls, actions, { executed: [{ action_id: "A3", what: "x" }] }, { conversation_id: "c1" });
  assert.deepEqual(r.mismatch, []);
  assert.equal(r.executed[0].action_id, "A3");
});

test("runDeterministic: bug moves of the brief (bug_move) do not count in the 10 actions per call", async () => {
  const calls = [];
  const pmTool = async (name, args) => { calls.push(name); return { key: args.task ?? "IMP-9" }; };
  const acts = [
    ...Array.from({ length: 12 }, (_, i) => ({ id: `b${i}`, tool: "pm_move_task", args: { task: `IMP-${i}`, task_list: "Startups / KAPSA / AI tasks", status: "to_do" }, quote: "Áno, platí", confirmed: true, risk: "normal", target_key: `IMP-${i}`, summary: "presun", bug_move: true })),
    ...Array.from({ length: 11 }, (_, i) => ({ id: `n${i}`, tool: "pm_set_task_priority", args: { task: `IMP-${100 + i}`, priority: "low" }, quote: "Áno, platí", confirmed: true, risk: "normal", target_key: `IMP-${100 + i}`, summary: "priorita" })),
  ];
  const r = await runDeterministic(acts, { conversation_id: "c", kind: "morning-brief" }, { pmTool, dry: false });
  assert.equal(r.executed.filter((e) => e.tool === "pm_move_task").length, 12);
  assert.equal(r.executed.filter((e) => e.tool === "pm_set_task_priority").length, 10);
});
