// Unit tests: state file safety and lock takeover (core.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

process.env.AIOS_RUNNER_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "aios-state-"));
const { acquireLock, DIRS, ensureDirs, readState, writeState } = await import("../core.mjs");
ensureDirs();

test("writeState merges and writes atomically (no tmp files left)", () => {
  writeState("p1", { a: 1 });
  writeState("p1", { b: 2 });
  assert.deepEqual(readState("p1"), { a: 1, b: 2 });
  assert.deepEqual(fs.readdirSync(DIRS.state).filter((f) => f.includes(".tmp")), []);
  assert.deepEqual(fs.readdirSync(DIRS.locks).filter((f) => f.startsWith("state-")), []);
});

test("missing state = {}, damaged state throws and is not overwritten", () => {
  assert.deepEqual(readState("nope"), {});
  fs.writeFileSync(path.join(DIRS.state, "bad.json"), '{"lastSuccessAt": "2026-10-17T06:30');
  assert.throws(() => readState("bad"), /not valid JSON/);
  assert.throws(() => writeState("bad", { lastSlot: "x" }), /not valid JSON/);
  assert.match(fs.readFileSync(path.join(DIRS.state, "bad.json"), "utf8"), /lastSuccessAt/);
});

test("lock of a dead pid is taken over; lock of a live node pid is not", () => {
  const dead = spawnSync(process.execPath, ["-e", "0"]).pid;
  fs.writeFileSync(path.join(DIRS.locks, "k1.lock"), `${dead} 2026-10-18T00:00:00Z`);
  const r = acquireLock("k1");
  assert.ok(r);
  assert.equal(acquireLock("k1"), null); // held by us (alive node)
  r();
  assert.equal(fs.existsSync(path.join(DIRS.locks, "k1.lock")), false);
});

test("a reused pid that is not node counts as dead", async () => {
  const sleeper = spawn("sleep", ["5"]);
  fs.writeFileSync(path.join(DIRS.locks, "k2.lock"), `${sleeper.pid} 2026-10-18T00:00:00Z`);
  const r = acquireLock("k2");
  assert.ok(r, "lock held by a non-node pid should be taken over");
  r();
  sleeper.kill();
});

test("release never removes a lock that is not ours", () => {
  const r = acquireLock("k3");
  fs.writeFileSync(path.join(DIRS.locks, "k3.lock"), "999999 someone-else");
  r();
  assert.equal(fs.readFileSync(path.join(DIRS.locks, "k3.lock"), "utf8"), "999999 someone-else");
});
