// AI tasks voice assistant (internal test, IMPOFAI only) — the call.
// Every tick: new messages of the coding agent (worker) in "Startups / KAPSA / AI tasks" that Marek has not answered
// → one call about all of them. While the worker is still running, wait up to BATCH_WAIT_MIN so more tasks fit into
// the call. After an answered call ai-tasks-followup writes Marek's answers into the task activity.
// State: ~/.aios-runner/state/ai-tasks-call.json { announced: { KEY: comment id }, lastCallAt, lastUnansweredAt }.
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { pmTool } from "../../runner/pm.mjs";
import { callGuard, isDry, placeCallAndWait, readJson, STATE_DIR, writeJson } from "../../runner/voice-call.mjs";
import { spawnProcess } from "../../runner/spawn.mjs";
import { AI_TASKS_LIST, BATCH_WAIT_MIN, MIN_GAP_MIN, RECENT_DONE_DAYS, RETRY_UNANSWERED_MIN, callVariables, pendingItem } from "./lib.mjs";

const RUN_DIR = process.env.RUN_DIR;
const STATE = path.join(STATE_DIR, "ai-tasks-call.json");
const WORKER_LOCK = path.join(os.homedir(), "kapsa-worker", "run.lock");
const minsSince = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 60_000 : Infinity);

const state = readJson(STATE, { announced: {} });
state.announced ??= {};

// 1) new messages of the worker, oldest first
// open tasks + tasks completed in the last days (their last message can be "deployed" or "next steps")
const recent = Date.now() - RECENT_DONE_DAYS * 86_400_000;
const tasks = ((await pmTool("pm_list_tasks", { task_list: AI_TASKS_LIST, limit: 100, sort: "created_at" })).items ?? []).filter(
  (t) => t.status !== "complete" || new Date(t.updated_at).getTime() > recent,
);
// AI_TASKS_FORCE=1: a call Marek scheduled himself (at job). It also brings up open tasks whose last message is the
// worker's even if they were announced before, skips the pacing rules and the daily minute cap (kind "manual").
const FORCE = process.env.AI_TASKS_FORCE === "1";
const items = [];
for (const t of tasks) {
  const act = await pmTool("pm_list_task_activity", { task: t.key, kind: "comments", order: "desc", limit: 20 });
  const it = pendingItem(t, act.items ?? [], state.announced) ?? (FORCE && t.status !== "complete" ? pendingItem(t, act.items ?? [], {}) : null);
  if (it) items.push(it);
}
if (!items.length) {
  console.log("no new messages from the coding agent");
  process.exit(0);
}
items.sort((a, b) => (a.at < b.at ? -1 : 1));
console.log(`pending: ${items.map((i) => `${i.key} (${i.kind})`).join(", ")}`);

// 2) batching and pacing (not for a scheduled call)
const workerBusy = (() => {
  try {
    execFileSync("flock", ["-n", WORKER_LOCK, "true"]);
    return false;
  } catch {
    return true;
  }
})();
if (!FORCE && workerBusy && minsSince(items[0].at) < BATCH_WAIT_MIN) {
  console.log(`worker is running and the oldest message is ${minsSince(items[0].at).toFixed(0)} min old: waiting to call about more tasks at once`);
  process.exit(0);
}
if (!FORCE && minsSince(state.lastCallAt) < MIN_GAP_MIN) {
  console.log(`last call ${minsSince(state.lastCallAt).toFixed(0)} min ago (< ${MIN_GAP_MIN}): next tick`);
  process.exit(0);
}
if (!FORCE && minsSince(state.lastUnansweredAt) < RETRY_UNANSWERED_MIN) {
  console.log(`last call was not answered ${minsSince(state.lastUnansweredAt).toFixed(0)} min ago: retry after ${RETRY_UNANSWERED_MIN} min`);
  process.exit(0);
}
const guard = callGuard({ kind: FORCE ? "manual" : "ai-tasks" });
if (!guard.allowed) {
  console.log(`no call now: ${guard.reason} (the messages stay pending)`);
  process.exit(0);
}

// 3) call
const r = await placeCallAndWait(callVariables(items), { runDir: RUN_DIR, kind: "ai-tasks" });
if (r.dryRun) {
  console.log("dry-run: no call, nothing marked as announced");
  process.exit(0);
}
state.lastCallAt = new Date().toISOString();
if (!r.answered) {
  state.lastUnansweredAt = state.lastCallAt;
  writeJson(STATE, state);
  console.log("call not answered: the messages stay pending, retry later");
  process.exit(0);
}
for (const it of items) state.announced[it.key] = it.comment_id;
state.lastUnansweredAt = null;
writeJson(STATE, state);

// 4) Marek's answers → task activity
await spawnProcess(
  "ai-tasks-followup",
  { conversation_id: r.conversationId, ended_at: new Date().toISOString(), dry_run: isDry(), tasks: items.map((it, i) => ({ label: `Úloha ${i + 1}`, task_key: it.key, name: it.name, kind: it.kind, agent_message: it.text })), transcript: r.transcript },
  { fromRunDir: RUN_DIR, label: "ai-tasks-followup" },
);
console.log(`call answered (${r.conversationId}): ai-tasks-followup started for ${items.length} task(s)`);
