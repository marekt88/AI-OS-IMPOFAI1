// Morning brief: deterministic parts (no model) for the KAPSA AI tasks worker status and the system bugs.
// System bugs = open tasks of "Startups / KAPSA / AI Bugs" (KAPSA app, AI tasks worker, AI runner). Only urgent ones
// (priority high or urgent) are offered for a move to AI tasks, the rest is only counted (Marek, 2026-10-23). Marek
// agrees to all offered moves with one yes; a move is 2 executor actions (move + prompt) of the 10 per call, so at most
// MAX_MOVABLE bugs are offered, the other urgent ones in the next brief.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const SYSTEM_BUGS_LIST = "cmv0zalyu0009p327hpyvas8d"; // Startups / KAPSA / AI Bugs (= runner/pm.mjs BUGS_LIST)
export const AI_TASKS_LIST = "Startups / KAPSA / AI tasks";
export const WORKER_STALE_MIN = 15; // same as the worker watchdog: no poll for 15 min = the worker does not run
export const MAX_MOVABLE = 4;
const URGENT_RANK = { urgent: 0, high: 1 };

export const heartbeatFile = () =>
  process.env.KAPSA_WORKER_HEARTBEAT || path.join(os.homedir(), "kapsa-worker", "state", "heartbeat.json");

/** heartbeat.json of the worker ({ lastPollAt, lastPollOk, consecutiveErrors, running }) or null. */
export function readHeartbeat(file = heartbeatFile()) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Splits open system bugs: urgent = offered for the move (urgent before high, then oldest, at most MAX_MOVABLE),
 * moreUrgent = urgent ones over the limit, otherCount = the rest (only counted).
 */
export function splitSystemBugs(tasks = [], max = MAX_MOVABLE) {
  const open = tasks.filter((t) => t && t.status !== "complete");
  const all = open
    .filter((t) => t.priority in URGENT_RANK)
    .sort((a, b) => URGENT_RANK[a.priority] - URGENT_RANK[b.priority] || String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")))
    .map((t) => ({ key: t.key, name: t.name, priority: t.priority, status: t.status, created_at: t.created_at ?? null }));
  return { urgent: all.slice(0, max), moreUrgent: all.length - Math.min(all.length, max), otherCount: open.length - all.length };
}

const n = (k, one, few, many) => `${k} ${k === 1 ? one : k >= 2 && k <= 4 ? few : many}`;

/**
 * One spoken sentence about the worker (no task keys, TTS would read them).
 * hb = heartbeat.json or null; runningName = name of the task it works on; waiting = AI tasks waiting for Marek
 * (needs review), failed = AI tasks with a failed run; null = unknown (PM not readable). fmt = local time formatter.
 */
export function workerLine(hb, { now = new Date(), runningName = null, waiting = null, failed = null, fmt = (d) => d.toISOString() } = {}) {
  const parts = [];
  const last = hb?.lastPollAt ? new Date(hb.lastPollAt) : null;
  if (!last || Number.isNaN(last.getTime())) {
    parts.push("Stav workera neviem zistiť, chýba jeho záznam o behu");
  } else {
    const ageMin = (now.getTime() - last.getTime()) / 60_000;
    const running = hb.running?.key ? (runningName ? `práve robí na úlohe „${runningName}“` : "práve robí na jednej úlohe") : null;
    if (ageMin > WORKER_STALE_MIN && !hb.running?.key) parts.push(`Pozor, worker nebeží, naposledy sa ozval ${fmt(last)}`);
    else if ((hb.consecutiveErrors ?? 0) >= 3) parts.push(`Pozor, worker beží s chybami, posledných ${hb.consecutiveErrors} kontrol zlyhalo`);
    else parts.push(`Worker beží${running ? ` a ${running}` : ""}`);
  }
  if (waiting) parts.push(`na tvoju odpoveď ${waiting === 1 ? "čaká" : "čakajú"} ${n(waiting, "úloha", "úlohy", "úloh")}`);
  if (failed) parts.push(`${n(failed, "beh zlyhal", "behy zlyhali", "behov zlyhalo")}`);
  return `${parts.join(", ")}.`;
}
