// action-executor: deterministic execution (pmTool, no model) and verification of a model run's transcript.
// Only what is verified here (real pmTool results, or tool calls proven by transcript.jsonl) counts as executed.
import fs from "node:fs";
import { APPROVALS_LIST, MAX_ACTIONS } from "../call-followup/lib.mjs";

export const PREFIX = "mcp__claude_ai_KAPSA__";
const READ = new Set(["pm_get_task", "pm_list_task_activity", "pm_list_task_lists", "pm_list_assignable_users"]);
const NON_PM = new Set(["ToolSearch", "StructuredOutput"]);
const KEY_RE = /\b[A-Z]{2,}-\d+\b/;

const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === "object"
  ? Object.fromEntries(Object.keys(v).filter((k) => k !== "response_format").sort().map((k) => [k, canon(v[k])])) : v);
// Argument names the followup model writes but the PM tools call differently (IMP-1542: `comment` instead of `body`).
const ARG_ALIASES = { pm_add_task_comment: { comment: "body", text: "body" } };
export function normalizeArgs(tool, args) {
  const al = ARG_ALIASES[tool];
  if (!al || !args) return args ?? {};
  return Object.fromEntries(Object.entries(args).map(([k, v]) => [al[k] && !(al[k] in args) ? al[k] : k, v]));
}
export const sameArgs = (a, b, tool) => JSON.stringify(canon(normalizeArgs(tool, a))) === JSON.stringify(canon(normalizeArgs(tool, b)));

export function auditText(ctx, quote) {
  const d = new Intl.DateTimeFormat("sk-SK", { timeZone: "Europe/Bratislava", day: "numeric", month: "numeric", year: "numeric" }).format(new Date());
  return `Vykonané asistentom po hovore ${ctx.conversation_id ?? "?"} (${ctx.kind ?? "?"}), ${d}. Podklad: „${quote}“.`;
}
export function approvalArgs(a, ctx) {
  return {
    task_list: APPROVALS_LIST,
    name: `Na schválenie: ${a.summary}`.slice(0, 500),
    assignee: "me",
    type: "task",
    priority: "normal",
    description: [
      `Asistent túto akciu nevykonal, potrebuje tvoje schválenie (riziko: ${a.risk}).`,
      "",
      `- čo: ${a.summary}`,
      `- nástroj: \`${a.tool}\``,
      `- argumenty: \`${JSON.stringify(normalizeArgs(a.tool, a.args))}\``,
      `- Marekov citát: „${a.quote}“`,
      `- hovor: ${ctx.conversation_id ?? "?"} (${ctx.kind ?? "?"}), beh ${ctx.source_run ?? "?"}`,
      `- dátum: ${new Date().toISOString()}`,
    ].join("\n"),
  };
}
const keyOf = (r) => (typeof r === "string" ? r.match(KEY_RE)?.[0] : r?.key ?? JSON.stringify(r ?? "").match(KEY_RE)?.[0]) ?? null;

/**
 * Executes the actions over HTTP (pmTool with PM_ACTIONS_TOKEN). Dry-run: only reads (backups), no writes.
 * Returns { ok, mode, dry_run, executed, skipped, approvals_created, backups, writes }.
 */
export async function runDeterministic(actions, ctx, { pmTool, dry }) {
  const call = (name, args) => pmTool(name, args, { tokenEnv: "PM_ACTIONS_TOKEN" });
  const res = { ok: true, mode: "pmtool", dry_run: dry, executed: [], skipped: [], approvals_created: [], backups: [], writes: [] };
  const write = async (name, args, action_id) => {
    if (dry) return { dry: true };
    const r = await call(name, args);
    res.writes.push({ tool: name, action_id, args, ref: keyOf(r) });
    return r;
  };
  for (const a of actions.slice(0, MAX_ACTIONS)) {
    try {
      if (a.confirmed !== true) { res.skipped.push({ action_id: a.id, reason: "nepotvrdené" }); continue; }
      if (a.risk === "needs_approval") {
        const r = await write("pm_create_task", approvalArgs(a, ctx), a.id);
        res.approvals_created.push({ action_id: a.id, task_key: dry ? "" : keyOf(r) ?? "", what: `${dry ? "(dry-run) " : ""}na schválenie: ${a.summary}` });
        continue;
      }
      const comment = auditText(ctx, a.quote);
      if (a.tool === "pm_delete_task") {
        const task = await call("pm_get_task", { task: a.target_key });
        let activity = null;
        try { activity = await call("pm_list_task_activity", { task: a.target_key }); } catch (err) { activity = { error: String(err.message) }; }
        if (keyOf(task) !== a.target_key || (a.target_name && task?.name && task.name.trim() !== a.target_name.trim())) {
          res.skipped.push({ action_id: a.id, reason: `úloha ${a.target_key} nesedí s potvrdeným názvom („${task?.name}“), nemažem` });
          continue;
        }
        res.backups.push({ action_id: a.id, task_key: a.target_key, task_json: JSON.stringify({ task, activity }) });
        await write("pm_add_task_comment", { task: a.target_key, body: comment }, a.id);
        await write("pm_delete_task", { task: a.target_key }, a.id);
        res.executed.push({ action_id: a.id, tool: a.tool, ref: a.target_key, what: `${dry ? "(dry-run) " : ""}${a.target_key}: zmazaná („${task?.name ?? a.target_name}“)`, audit_comment: comment });
        continue;
      }
      const r = await write(a.tool, normalizeArgs(a.tool, a.args), a.id);
      const ref = a.target_key || (dry ? "(nová)" : keyOf(r)) || "";
      if (a.tool !== "pm_create_task_list" && ref && ref !== "(nová)") await write("pm_add_task_comment", { task: ref, body: comment }, a.id);
      res.executed.push({ action_id: a.id, tool: a.tool, ref, what: `${dry ? "(dry-run) " : ""}${ref ? `${ref}: ` : ""}${a.summary}`, audit_comment: a.tool === "pm_create_task_list" ? "" : comment });
    } catch (err) {
      res.skipped.push({ action_id: a.id, reason: `chyba PM: ${String(err.message).slice(0, 300)}` });
    }
  }
  return res;
}

/** Parses transcript.jsonl → [{ id, tool, input, ok, text }] in call order (PM tools without prefix). */
export function transcriptCalls(file) {
  const calls = [];
  const byId = new Map();
  if (!fs.existsSync(file)) return calls;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    for (const c of m?.message?.content ?? []) {
      if (m.type === "assistant" && c.type === "tool_use") {
        const x = { id: c.id, tool: String(c.name).startsWith(PREFIX) ? c.name.slice(PREFIX.length) : c.name, input: c.input ?? {}, ok: null, text: "" };
        calls.push(x);
        byId.set(c.id, x);
      } else if (m.type === "user" && c.type === "tool_result" && byId.has(c.tool_use_id)) {
        const x = byId.get(c.tool_use_id);
        x.ok = !c.is_error;
        x.text = Array.isArray(c.content) ? c.content.map((t) => t.text ?? "").join("\n") : String(c.content ?? "");
      }
    }
  }
  return calls;
}

/**
 * Compares the write calls of a model run with the approved actions.
 * Returns { executed, skipped, approvals_created, backups, mismatch: [..], warnings: [..] } built only from proven calls.
 */
export function verifyModelRun(calls, actions, modelOut, ctx) {
  const out = { ok: true, mode: "model", executed: [], skipped: [], approvals_created: [], backups: [], mismatch: [], warnings: [] };
  const used = new Set();
  const touched = new Map(); // task key → action id (targets and created tasks), for audit comments
  const readFor = new Map(); // task key → { task, activity } read before
  const approvalsLeft = actions.filter((a) => a.risk === "needs_approval");
  const modelWhat = new Map((modelOut?.executed ?? []).map((e) => [e.action_id, e.what]));
  for (const a of actions) if (a.target_key) touched.set(a.target_key, a.id);
  let actionWrites = 0;
  for (const c of calls) {
    if (NON_PM.has(c.tool)) continue;
    if (READ.has(c.tool)) {
      const k = c.input.task;
      if (k && c.ok) readFor.set(k, { ...(readFor.get(k) ?? {}), [c.tool === "pm_get_task" ? "task" : "activity"]: c.text });
      continue;
    }
    // audit comment on a task this run touched
    if (c.tool === "pm_add_task_comment" && String(c.input.body ?? "").startsWith("Vykonané asistentom po hovore") && touched.has(c.input.task)
      && String(c.input.body).includes(String(ctx.conversation_id ?? ""))) {
      const e = out.executed.find((x) => x.ref === c.input.task);
      if (e) e.audit_comment = c.input.body;
      else out.pendingComments = [...(out.pendingComments ?? []), c.input]; // comment before delete
      continue;
    }
    // approval task
    if (c.tool === "pm_create_task" && c.input.task_list === APPROVALS_LIST && String(c.input.name ?? "").startsWith("Na schválenie:") && approvalsLeft.length) {
      const a = approvalsLeft.shift();
      if (c.ok) out.approvals_created.push({ action_id: a.id, task_key: c.text.match(KEY_RE)?.[0] ?? "", what: `na schválenie: ${a.summary}` });
      else out.skipped.push({ action_id: a.id, reason: `úloha na schválenie zlyhala: ${c.text.slice(0, 200)}` });
      used.add(a.id);
      continue;
    }
    // an approved action, called exactly as approved
    const a = actions.find((x) => !used.has(x.id) && x.risk !== "needs_approval" && x.tool === c.tool && sameArgs(x.args, c.input, c.tool));
    if (!a) {
      out.mismatch.push({ tool: c.tool, input: c.input, ok: c.ok, why: "zápis, ktorý nie je medzi schválenými akciami" });
      continue;
    }
    used.add(a.id);
    actionWrites++;
    if (!c.ok) { out.skipped.push({ action_id: a.id, reason: `chyba PM: ${c.text.slice(0, 300)}` }); continue; }
    if (a.tool === "pm_delete_task") {
      const b = readFor.get(a.target_key);
      if (!b?.task) out.mismatch.push({ tool: c.tool, input: c.input, ok: c.ok, why: "mazanie bez zálohy (pm_get_task pred zmazaním)" });
      else out.backups.push({ action_id: a.id, task_key: a.target_key, task_json: JSON.stringify(b) });
      if (!(out.pendingComments ?? []).some((x) => x.task === a.target_key)) out.warnings.push(`${a.target_key}: chýba auditný komentár pred zmazaním`);
    }
    const ref = a.target_key || c.text.match(KEY_RE)?.[0] || "";
    if (ref && !a.target_key) touched.set(ref, a.id);
    out.executed.push({ action_id: a.id, tool: a.tool, ref, what: modelWhat.get(a.id) ?? `${ref ? `${ref}: ` : ""}${a.summary}`, audit_comment: "" });
  }
  if (actionWrites > MAX_ACTIONS) out.mismatch.push({ why: `viac ako ${MAX_ACTIONS} zápisov akcií (${actionWrites})` });
  for (const a of actions) if (!used.has(a.id)) {
    const m = (modelOut?.skipped ?? []).find((s) => s.action_id === a.id);
    out.skipped.push({ action_id: a.id, reason: m?.reason ?? "nevykonané (v prepise behu nie je volanie)" });
  }
  // the model claims something it did not do
  for (const e of modelOut?.executed ?? []) if (!out.executed.some((x) => x.action_id === e.action_id) && !modelOut?.dry_run) out.warnings.push(`model tvrdí „${e.what}“, ale v prepise to nie je`);
  for (const e of out.executed) if (!e.audit_comment && e.tool !== "pm_create_task_list" && e.tool !== "pm_delete_task") out.warnings.push(`${e.ref}: chýba auditný komentár`);
  delete out.pendingComments;
  return out;
}
