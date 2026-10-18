// Integration tests of run.mjs with a fake `claude` (fake-claude.mjs), a temporary AIOS_RUNNER_HOME and
// temporary process definitions (AIOS_PROCESSES_DIR). No real Claude, no PM, no phone calls, no git pull.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUN = path.join(HERE, "..", "run.mjs");
const SPAWN = path.join(HERE, "..", "spawn.mjs");
const TOOL = "mcp__x__pm_get_current_identity";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aios-runner-test-"));
  const home = path.join(root, "home"), procs = path.join(root, "processes"), fake = path.join(root, "fake");
  fs.mkdirSync(home); fs.mkdirSync(procs); fs.mkdirSync(fake);
  const def = (name, json, files = {}) => {
    fs.mkdirSync(path.join(procs, name));
    fs.writeFileSync(path.join(procs, name, "process.json"), JSON.stringify(json));
    for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(procs, name, f), c);
  };
  const schema = JSON.stringify({ type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] });
  def("t-basic", { schedule: null, model: "haiku", allowedTools: [TOOL], requireTools: [TOOL] }, { "prompt.md": "dry={{dry_run}} since={{since}}", "schema.json": schema });
  def("t-dryt", { schedule: null, allowedTools: ["mcp__x", "mcp__y__pm_create_task"], requireTools: [TOOL, "mcp__y__pm_create_task"], dryRunAllowedTools: ["mcp__x"] }, { "prompt.md": "x", "schema.json": schema });
  def("t-src", { schedule: null, claude: false });
  def("t-ctx", { schedule: null, allowedTools: [TOOL], requireTools: [TOOL], context: [{ var: "followups", process: "t-src", mode: "since" }, { var: "last", process: "t-src" }] },
    { "prompt.md": "F={{followups}}\nL={{last}}", "schema.json": schema });
  def("t-after", { schedule: null, claude: false }, { "after.mjs":
    `import fs from "node:fs";\nimport { spawnProcess } from ${JSON.stringify(SPAWN)};\nfs.writeFileSync(process.env.RUN_DIR + "/env.json", JSON.stringify({ RUN_DRY: process.env.RUN_DRY }));\nspawnProcess("t-src", { from: "t-after" }, { label: "child" });\n` });
  def("t-sched", { schedule: "0 3 * * *", catchUpMin: 5, allowedTools: [TOOL], requireTools: [TOOL] }, { "prompt.md": "s", "schema.json": schema });
  const env = (extra = {}) => ({ ...process.env, AIOS_RUNNER_HOME: home, AIOS_PROCESSES_DIR: procs, CLAUDE_BIN: path.join(HERE, "fake-claude.mjs"),
    FAKE_DIR: fake, FAKE_TOOL: TOOL, RUN_RETRY_DELAYS_MS: "0,0", AIOS_NO_GIT_PULL: "1", RUN_DRY: "",
    PATH: `${path.dirname(process.execPath)}:${process.env.PATH}`, ...extra });
  const run = (args, extra) => spawnSync(process.execPath, [RUN, ...args], { env: env(extra), encoding: "utf8", timeout: 60_000 });
  // async variant: keeps the test's event loop free (a lock-holder child must be reaped, or its pid stays "alive")
  const runAsync = (args, extra) => new Promise((resolve) => {
    const c = spawn(process.execPath, [RUN, ...args], { env: env(extra) });
    let stdout = "", stderr = "";
    c.stdout.on("data", (d) => (stdout += d));
    c.stderr.on("data", (d) => (stderr += d));
    c.on("close", (status) => resolve({ status, stdout, stderr }));
  });
  const runs = (name) => (fs.existsSync(path.join(home, "runs", name)) ? fs.readdirSync(path.join(home, "runs", name)).sort() : []);
  const runLog = (name, id) => JSON.parse(fs.readFileSync(path.join(home, "runs", name, id, "run.json"), "utf8"));
  const state = (name) => { try { return JSON.parse(fs.readFileSync(path.join(home, "state", `${name}.json`), "utf8")); } catch { return {}; } };
  const queued = () => { try { return fs.readFileSync(path.join(home, "state", "undelivered.jsonl"), "utf8"); } catch { return ""; } };
  const resetFake = () => fs.rmSync(path.join(fake, "count"), { force: true });
  return { root, home, procs, fake, env, run, runAsync, runs, runLog, state, queued, resetFake };
}

test("OAuth refresh failure twice, then success: 3 attempts logged, dry-run keeps state", () => {
  const t = setup();
  const r = t.run(["run", "t-basic", "--dry-run"], { FAKE_PLAN: "oauth,oauth,ok" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const [id] = t.runs("t-basic");
  assert.match(id, /-dry$/);
  const log = t.runLog("t-basic", id);
  assert.equal(log.ok, true);
  assert.equal(log.dryRun, true);
  assert.deepEqual(log.steps.claudeAttempts.map((a) => a.transient), ["auth-refresh", "auth-refresh", null]);
  assert.deepEqual(log.steps.claudeAttempts.map((a) => a.ok), [false, false, true]);
  assert.ok(fs.existsSync(path.join(t.home, "runs", "t-basic", id, "transcript-attempt1.jsonl")));
  const st = t.state("t-basic");
  assert.equal(st.lastSuccessAt, undefined);
  assert.equal(st.successRuns, undefined);
  assert.equal(st.lastDryRun.ok, true);
  assert.match(fs.readFileSync(path.join(t.fake, "prompt-3.txt"), "utf8"), /^dry=true /);
  assert.equal(JSON.parse(fs.readFileSync(path.join(t.fake, "args-3.json"), "utf8")).env.RUN_DRY, "1");
});

test("OAuth refresh fails on all 3 attempts → kind auth (not claude-error), reported", () => {
  const t = setup();
  const r = t.run(["run", "t-basic"], { FAKE_PLAN: "oauth" });
  assert.equal(r.status, 1);
  const log = t.runLog("t-basic", t.runs("t-basic")[0]);
  assert.equal(log.error.kind, "auth");
  assert.equal(log.steps.claudeAttempts.length, 3);
  assert.match(t.queued(), /"fingerprint":"runner:auth"/); // no PM token in the test home → queued, not sent
  assert.match(t.queued(), /OAuth refresh/);
  assert.equal(t.state("t-basic").lastStatus, "failed:auth");
});

test("network error on all attempts stays claude-error", () => {
  const t = setup();
  t.run(["run", "t-basic", "--dry-run"], { FAKE_PLAN: "net" });
  const log = t.runLog("t-basic", t.runs("t-basic")[0]);
  assert.equal(log.error.kind, "claude-error");
  assert.deepEqual(log.steps.claudeAttempts.map((a) => a.transient), ["network", "network", "network"]);
  assert.equal(t.queued(), ""); // dry-run reports nothing
});

test("transient error after a write tool is not repeated", () => {
  const t = setup();
  t.run(["run", "t-basic", "--dry-run"], { FAKE_PLAN: "overloaded-after-write,ok" });
  const log = t.runLog("t-basic", t.runs("t-basic")[0]);
  assert.equal(log.ok, false);
  assert.equal(log.steps.claudeAttempts.length, 1);
  assert.match(log.steps.claudeAttempts[0].note, /pm_create_task/);
});

test("dryRunAllowedTools replaces allowedTools and narrows requireTools in dry-run", () => {
  const t = setup();
  const r = t.run(["run", "t-dryt", "--dry-run"], { FAKE_PLAN: "ok" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const a = JSON.parse(fs.readFileSync(path.join(t.fake, "args-1.json"), "utf8")).args;
  const i = a.indexOf("--allowedTools");
  assert.deepEqual(a.slice(i + 1, i + 2), ["mcp__x"]);
  assert.ok(!a.includes("mcp__y__pm_create_task"));
  t.resetFake();
  const live = t.run(["run", "t-dryt"], { FAKE_PLAN: "ok" }); // live: requires pm_create_task, which the fake did not call
  assert.equal(live.status, 1);
  assert.match(live.stdout, /required-tools/);
});

test("context mode since: all successful outputs since lastSuccessAt, dry runs excluded", () => {
  const t = setup();
  const input = (n) => { const f = path.join(t.root, `in-${n}.json`); fs.writeFileSync(f, JSON.stringify({ n })); return f; };
  for (const n of [1, 2, 3]) assert.equal(t.run(["run", "t-src", "--input", input(n)]).status, 0);
  t.run(["run", "t-src", "--input", input(99), "--dry-run"]);
  assert.equal(t.state("t-src").successRuns.length, 3);
  assert.equal(t.run(["run", "t-ctx"], { FAKE_PLAN: "ok" }).status, 0);
  const p1 = fs.readFileSync(path.join(t.fake, "prompt-1.txt"), "utf8");
  const f1 = JSON.parse(p1.split("\nL=")[0].slice(2));
  assert.deepEqual(f1.map((x) => x.output.n), [1, 2, 3]);
  assert.match(p1.split("\nL=")[1], /"n": 3/); // mode last unchanged
  const ctxLog = t.runLog("t-ctx", t.runs("t-ctx")[0]);
  assert.equal(ctxLog.context[0].runIds.length, 3);
  assert.equal(t.run(["run", "t-src", "--input", input(4)]).status, 0);
  assert.equal(t.run(["run", "t-ctx"], { FAKE_PLAN: "ok" }).status, 0);
  const f2 = JSON.parse(fs.readFileSync(path.join(t.fake, "prompt-2.txt"), "utf8").split("\nL=")[0].slice(2));
  assert.deepEqual(f2.map((x) => x.output.n), [4]);
});

test("context since: at most 20 newest, index capped at 100 (built from run dirs when missing)", () => {
  const t = setup();
  // fake 25 successful t-src runs directly on disk, no successRuns in state yet
  for (let i = 0; i < 25; i++) {
    const at = new Date(Date.now() - (30 - i) * 60_000).toISOString();
    const id = at.replace(/[:.]/g, "-");
    const dir = path.join(t.home, "runs", "t-src", id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "run.json"), JSON.stringify({ ok: true, startedAt: at, finishedAt: at }));
    fs.writeFileSync(path.join(dir, "output.json"), JSON.stringify({ output: { i } }));
  }
  assert.equal(t.run(["run", "t-ctx", "--dry-run"], { FAKE_PLAN: "ok" }).status, 0);
  const f = JSON.parse(fs.readFileSync(path.join(t.fake, "prompt-1.txt"), "utf8").split("\nL=")[0].slice(2));
  assert.equal(f.length, 20);
  assert.equal(f[0].output.i, 5);
  assert.equal(f[19].output.i, 24);
});

test("--wait-lock waits for a running instance and then runs", async () => {
  const t = setup();
  const holder = spawn(process.execPath, ["-e", "setTimeout(() => {}, 1500)"]);
  fs.mkdirSync(path.join(t.home, "locks"), { recursive: true });
  fs.writeFileSync(path.join(t.home, "locks", "process-t-src.lock"), String(holder.pid));
  const f = path.join(t.root, "in.json"); fs.writeFileSync(f, "{}");
  const t0 = Date.now();
  const r = await t.runAsync(["run", "t-src", "--input", f, "--wait-lock", "--dry-run"], { RUN_WAIT_LOCK_MAX_MS: "10000", RUN_WAIT_LOCK_POLL_MS: "200" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(Date.now() - t0 >= 1000);
  assert.match(r.stdout, /lock acquired/);
  holder.kill();
});

test("--wait-lock gives up after the limit and reports to AI Bugs (queued here)", () => {
  const t = setup();
  fs.mkdirSync(path.join(t.home, "locks"), { recursive: true });
  fs.writeFileSync(path.join(t.home, "locks", "process-t-src.lock"), String(process.pid)); // alive for the whole test
  const f = path.join(t.root, "in.json"); fs.writeFileSync(f, "{}");
  const r = t.run(["run", "t-src", "--input", f, "--wait-lock"], { RUN_WAIT_LOCK_MAX_MS: "800", RUN_WAIT_LOCK_POLL_MS: "200" });
  assert.equal(r.status, 2);
  assert.match(t.queued(), /lock-wait-timeout/);
  assert.match(t.queued(), /--input/);
  const skip = t.run(["run", "t-src", "--input", f]); // without --wait-lock: skipped at once
  assert.equal(skip.status, 2);
});

test("spawnProcess (K1) from after.mjs: input file, .out log, --wait-lock, RUN_DRY inherited", async () => {
  const t = setup();
  const f = path.join(t.root, "in.json"); fs.writeFileSync(f, "{}");
  const r = t.run(["run", "t-after", "--input", f, "--dry-run"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const parent = path.join(t.home, "runs", "t-after", t.runs("t-after")[0]);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(parent, "env.json"), "utf8")), { RUN_DRY: "1" });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(parent, "child-input.json"), "utf8")), { from: "t-after" });
  let child;
  for (let i = 0; i < 50 && !child; i++) { await sleep(200); child = t.runs("t-src").find((x) => x.endsWith("-dry") && fs.existsSync(path.join(t.home, "runs", "t-src", x, "output.json"))); }
  assert.ok(child, "child run did not appear");
  await sleep(300);
  const log = t.runLog("t-src", child);
  assert.equal(log.dryRun, true);
  assert.equal(log.inputFile, path.join(parent, "child-input.json"));
  assert.ok(fs.existsSync(path.join(parent, "child.out")));
});

test("retrySlot: failed scheduled run plans one retry, tick starts it, retry is not retried again", async () => {
  const t = setup();
  const slot = new Date(Date.now() - 60_000).toISOString();
  const r = t.run(["run-scheduled", "t-sched", slot], { FAKE_PLAN: "oauth,oauth,oauth,ok" });
  assert.equal(r.status, 1);
  let st = t.state("t-sched");
  assert.equal(st.pendingRetry.kind, "auth");
  assert.equal(st.pendingRetry.slot, slot);
  assert.ok(Math.abs(Date.parse(st.pendingRetry.at) - Date.now() - 10 * 60_000) < 30_000);
  assert.match(t.queued(), /ďalší pokus/);
  // not due yet: tick does nothing
  t.run(["tick"], { FAKE_PLAN: "oauth,oauth,oauth,ok" });
  assert.ok(t.state("t-sched").pendingRetry);
  // make it due and tick again → retry run (4th claude call = ok)
  fs.writeFileSync(path.join(t.home, "state", "t-sched.json"), JSON.stringify({ ...t.state("t-sched"), pendingRetry: { ...st.pendingRetry, at: new Date(Date.now() - 1000).toISOString() } }));
  assert.equal(t.run(["tick"], { FAKE_PLAN: "oauth,oauth,oauth,ok" }).status, 0);
  assert.equal(t.state("t-sched").pendingRetry, null);
  let retryLog;
  for (let i = 0; i < 50 && !retryLog; i++) {
    await sleep(200);
    const ids = t.runs("t-sched");
    if (ids.length === 2) { try { const l = t.runLog("t-sched", ids[1]); if (l.finishedAt) retryLog = l; } catch { /* still running */ } }
  }
  assert.ok(retryLog, "retry run did not finish");
  assert.equal(retryLog.ok, true);
  assert.equal(retryLog.retryOf, slot);
  st = t.state("t-sched");
  assert.equal(st.lastStatus, "ok");
  // a failing retry plans nothing more
  t.resetFake();
  t.run(["run-scheduled", "t-sched", slot, "--retry"], { FAKE_PLAN: "oauth" });
  assert.equal(t.state("t-sched").pendingRetry ?? null, null);
});

test("dry-run runs are pruned separately from live runs", () => {
  const t = setup();
  fs.writeFileSync(path.join(t.procs, "t-src", "process.json"), JSON.stringify({ schedule: null, claude: false, keepRuns: 2 }));
  const f = path.join(t.root, "in.json"); fs.writeFileSync(f, "{}");
  for (let i = 0; i < 3; i++) t.run(["run", "t-src", "--input", f]);
  for (let i = 0; i < 2; i++) t.run(["run", "t-src", "--input", f, "--dry-run"]);
  const ids = t.runs("t-src");
  assert.equal(ids.filter((x) => x.endsWith("-dry")).length, 2);
  // live: keepRuns 2, but the newest 20 successRuns are protected → all 3 stay
  assert.equal(ids.filter((x) => !x.endsWith("-dry")).length, 3);
});

test("fail-safe dry-run: inherited RUN_DRY=1 / VOICE_NO_CALL=1 always win (run.mjs, runProcess, after env, spawnProcess)", async () => {
  const t = setup();
  const f = path.join(t.root, "in.json"); fs.writeFileSync(f, "{}");
  // 1. run.mjs without --dry-run, but env RUN_DRY=1 / VOICE_NO_CALL=1
  for (const extra of [{ RUN_DRY: "1" }, { VOICE_NO_CALL: "1" }]) {
    const r = t.run(["run", "t-after", "--input", f], extra);
    assert.equal(r.status, 0, r.stdout + r.stderr);
  }
  const ids = t.runs("t-after");
  assert.equal(ids.length, 2);
  for (const id of ids) {
    assert.match(id, /-dry$/);
    assert.equal(t.runLog("t-after", id).dryRun, true);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(t.home, "runs", "t-after", id, "env.json"), "utf8")), { RUN_DRY: "1" });
  }
  // 2. runProcess called directly with dryRun:false (the incident) while the env says RUN_DRY=1
  const script = `const c = await import(${JSON.stringify(path.join(HERE, "..", "core.mjs"))}); c.ensureDirs();
    const log = await c.runProcess(c.loadProcess("t-after"), { manual: true, inputFile: ${JSON.stringify(f)}, dryRun: false });
    console.log(JSON.stringify({ runId: log.runId, dryRun: log.dryRun }));`;
  const d = spawnSync(process.execPath, ["--input-type=module", "-e", script], { env: t.env({ RUN_DRY: "1" }), encoding: "utf8" });
  assert.equal(d.status, 0, d.stderr);
  const res = JSON.parse(d.stdout.trim().split("\n").at(-1));
  assert.equal(res.dryRun, true);
  assert.match(res.runId, /-dry$/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(t.home, "runs", "t-after", res.runId, "env.json"), "utf8")).RUN_DRY, "1");
  assert.equal(t.state("t-after").lastSuccessAt, undefined);
  // 3. the spawned children are dry as well
  await sleep(1500);
  const live = t.runs("t-src").filter((x) => !x.endsWith("-dry"));
  assert.deepEqual(live, []);
  assert.ok(t.runs("t-src").length >= 1);
});

test("fail-safe dry-run: JSON input with dry_run:true forces dry-run without --dry-run", () => {
  const t = setup();
  const f = path.join(t.root, "in.json"); fs.writeFileSync(f, JSON.stringify({ dry_run: true, x: 1 }));
  const r = t.run(["run", "t-after", "--input", f]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const [id] = t.runs("t-after");
  assert.match(id, /-dry$/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(t.home, "runs", "t-after", id, "env.json"), "utf8")).RUN_DRY, "1");
  assert.equal(t.state("t-after").lastSuccessAt, undefined);
  // dry_run:false or a non-JSON input do not force anything
  const g = path.join(t.root, "in2.json"); fs.writeFileSync(g, JSON.stringify({ dry_run: false }));
  const r2 = t.run(["run", "t-src", "--input", g, "--wait-lock"], { RUN_WAIT_LOCK_POLL_MS: "200" }); // the spawned dry child may hold the lock
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.ok(t.runs("t-src").some((x) => !x.endsWith("-dry")));
});

test("retrySlot: a manual success cancels the planned retry (no second brief)", () => {
  const t = setup();
  const slot = new Date(Date.now() - 60_000).toISOString();
  t.run(["run-scheduled", "t-sched", slot], { FAKE_PLAN: "oauth,oauth,oauth,ok" });
  assert.ok(t.state("t-sched").pendingRetry);
  assert.equal(t.run(["run", "t-sched"], { FAKE_PLAN: "oauth,oauth,oauth,ok" }).status, 0); // 4th call = ok
  assert.equal(t.state("t-sched").pendingRetry, null);
  // even if a stale pendingRetry survived, a later success makes tick drop it
  const st = t.state("t-sched");
  fs.writeFileSync(path.join(t.home, "state", "t-sched.json"), JSON.stringify({ ...st, pendingRetry: { slot, kind: "auth", at: new Date(Date.now() - 1000).toISOString(), failedAt: new Date(Date.parse(st.lastSuccessAt) - 60_000).toISOString(), deadline: null } }));
  t.run(["tick"]);
  assert.equal(t.state("t-sched").pendingRetry, null);
  assert.equal(t.runs("t-sched").length, 2); // no retry run started
});

test("after.mjs advance-since.json {advance:false}: success, but lastSuccessAt stays", () => {
  const t = setup();
  fs.mkdirSync(path.join(t.procs, "t-undeliv"));
  fs.writeFileSync(path.join(t.procs, "t-undeliv", "process.json"), JSON.stringify({ schedule: null, claude: false }));
  fs.writeFileSync(path.join(t.procs, "t-undeliv", "after.mjs"),
    `import fs from "node:fs";\nconst input = JSON.parse(fs.readFileSync(process.env.RUN_INPUT, "utf8"));\nif (!input.answered) fs.writeFileSync(process.env.RUN_ADVANCE_FILE, JSON.stringify({ advance: false }));\n`);
  const f1 = path.join(t.root, "a.json"); fs.writeFileSync(f1, JSON.stringify({ answered: true }));
  const f2 = path.join(t.root, "b.json"); fs.writeFileSync(f2, JSON.stringify({ answered: false }));
  assert.equal(t.run(["run", "t-undeliv", "--input", f1]).status, 0);
  const first = t.state("t-undeliv").lastSuccessAt;
  assert.ok(first);
  assert.equal(t.run(["run", "t-undeliv", "--input", f2]).status, 0);
  const st = t.state("t-undeliv");
  assert.equal(st.lastSuccessAt, first);
  assert.equal(st.lastStatus, "ok:not-delivered");
  assert.equal(st.successRuns.length, 2);
  assert.equal(st.lastSuccessRunId, t.runs("t-undeliv")[1]);
});
