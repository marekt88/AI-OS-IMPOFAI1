// Unit tests of the brief's worker status and system bugs: node --test processes/*/lib.test.mjs (no network, PM or calls).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bugCategory, readHeartbeat, splitSystemBugs, systemBugsLine, workerLine } from "./lib.mjs";

const now = new Date("2026-10-23T07:00:00Z");
const fmt = (d) => d.toISOString().slice(11, 16);
const hb = (o) => ({ lastPollAt: "2026-10-23T06:58:00Z", lastPollOk: true, consecutiveErrors: 0, running: null, ...o });

test("worker running, idle", () => {
  assert.equal(workerLine(hb(), { now, fmt }), "Worker beží.");
});

test("worker on a task, waiting and failed counts, never a task key", () => {
  const line = workerLine(hb({ running: { key: "IMP-1606", kind: "RESUME" } }), { now, fmt, runningName: "Hlasový asistent", waiting: 2, failed: 1 });
  assert.equal(line, "Worker beží a práve robí na úlohe „Hlasový asistent“, na tvoju odpoveď čakajú 2 úlohy, 1 beh zlyhal.");
  assert.doesNotMatch(workerLine(hb({ running: { key: "IMP-1606" } }), { now, fmt }), /IMP-/);
  assert.match(workerLine(hb(), { now, fmt, waiting: 5 }), /čaká|čakajú 5 úloh/);
  assert.match(workerLine(hb(), { now, fmt, waiting: 1 }), /na tvoju odpoveď čaká 1 úloha/);
});

test("worker down: no poll for over 15 min and no task running", () => {
  assert.equal(workerLine(hb({ lastPollAt: "2026-10-23T05:10:00Z" }), { now, fmt }), "Pozor, worker nebeží, naposledy sa ozval 05:10.");
  // a long task run blocks polling, that is not "down" (the watchdog reports runs over 60 min)
  assert.match(workerLine(hb({ lastPollAt: "2026-10-23T06:20:00Z", running: { key: "IMP-1" } }), { now, fmt }), /^Worker beží/);
});

test("worker with failing polls, missing heartbeat", () => {
  assert.match(workerLine(hb({ consecutiveErrors: 4 }), { now, fmt }), /posledných 4 kontrol zlyhalo/);
  assert.match(workerLine(null, { now, fmt }), /neviem zistiť/);
  assert.equal(readHeartbeat(path.join(os.tmpdir(), "no-such-heartbeat.json")), null);
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "hb-")), "heartbeat.json");
  fs.writeFileSync(f, JSON.stringify(hb()));
  assert.equal(readHeartbeat(f).lastPollOk, true);
});

test("system bugs: all high and urgent offered (urgent first, then oldest), others counted, categories", () => {
  const r = splitSystemBugs([
    { key: "IMP-3", name: "[AI runner] c", priority: "normal", status: "to_do", created_at: "2026-10-22T10:00:00Z" },
    { key: "IMP-2", name: "Worker AI tasks nebeží (heartbeat)", priority: "urgent", status: "to_do", created_at: "2026-10-23T06:00:00Z" },
    { key: "IMP-1", name: "[AI runner] a", priority: "high", status: "in_progress", created_at: "2026-10-22T15:00:00Z" },
    { key: "IMP-4", name: "Deploy do produkcie zlyhal", priority: null, status: "to_do" },
    { key: "IMP-5", name: "[AI runner] e", priority: "high", status: "complete" },
  ]);
  assert.deepEqual(r.urgent.map((b) => b.key), ["IMP-2", "IMP-1"]);
  assert.equal(r.open, 4);
  assert.equal(r.otherCount, 2);
  assert.deepEqual(r.categories, [
    { name: "AI runner", count: 2, urgent: 1 },
    { name: "server a nasadenie", count: 1, urgent: 0 },
    { name: "worker", count: 1, urgent: 1 },
  ]);
  assert.deepEqual(splitSystemBugs([]), { open: 0, urgent: [], otherCount: 0, categories: [] });
});

test("system bugs: no limit on the offer", () => {
  const bugs = Array.from({ length: 7 }, (_, i) => ({ key: `IMP-${i}`, name: `[AI runner] b${i}`, priority: "high", status: "to_do", created_at: `2026-10-1${i}T00:00:00Z` }));
  assert.equal(splitSystemBugs(bugs).urgent.length, 7);
});

test("system bugs line: count, categories and the proposal, never names or keys", () => {
  const s = splitSystemBugs([
    { key: "IMP-1", name: "[AI runner] Proces morning-brief zlyhal", priority: "high", status: "to_do" },
    { key: "IMP-2", name: "[AI runner] Test", priority: "normal", status: "to_do" },
    { key: "IMP-3", name: "Worker AI tasks nebeží (heartbeat)", priority: "high", status: "to_do" },
  ]);
  const line = systemBugsLine(s);
  assert.equal(line, "Otvorených systémových chýb je 3, podľa oblastí: AI runner 2, worker 1. Urgentných je 2, navrhujem ich presunúť do AI tasks, aby ich worker opravil.");
  assert.doesNotMatch(line, /IMP-|morning-brief/);
  assert.equal(systemBugsLine(splitSystemBugs([])), "Žiadne otvorené systémové chyby.");
  assert.match(systemBugsLine(splitSystemBugs([{ key: "IMP-2", name: "x", priority: "low", status: "to_do" }])), /Žiadna nie je urgentná/);
  assert.equal(bugCategory("Server: málo miesta na disku pre build"), "server a nasadenie");
  assert.equal(bugCategory("Niečo iné"), "ostatné");
});
