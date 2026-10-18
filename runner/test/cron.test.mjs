// Unit tests: retrySlot decisions (cron.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { deliverDeadline, pendingRetryDue, retryDecision } from "../cron.mjs";

const tz = "Europe/Bratislava";
const slot = new Date("2026-10-18T06:30:00Z"); // 8:30 CEST, morning-brief slot
const MIN = 60_000;

test("deliverAt deadline = 9:00 local + 30 min on the slot's day", () => {
  assert.equal(new Date(deliverDeadline("09:00", tz, slot)).toISOString(), "2026-10-18T07:30:00.000Z");
  // winter time (CET, UTC+1)
  assert.equal(new Date(deliverDeadline("09:00", tz, new Date("2026-11-02T07:30:00Z"))).toISOString(), "2026-11-02T08:30:00.000Z");
  assert.equal(deliverDeadline(null, tz, slot), null);
});

test("auth / claude-error / timeout get one retry 10 min later", () => {
  for (const kind of ["auth", "claude-error", "timeout"]) {
    const d = retryDecision({ kind, failedAt: new Date("2026-10-18T06:33:00Z"), slot, deliverAt: "09:00", tz, estimateMs: 10 * MIN });
    assert.equal(d.retry, true, kind);
    assert.equal(d.at.toISOString(), "2026-10-18T06:43:00.000Z");
    assert.equal(d.deadline.toISOString(), "2026-10-18T07:30:00.000Z");
  }
});

test("other kinds are not retried", () => {
  for (const kind of ["schema", "mcp-auth", "required-tools", "after-failed", "process-reported", "max-turns"])
    assert.deepEqual(retryDecision({ kind, failedAt: slot, slot, tz, estimateMs: MIN }).retry, false, kind);
});

test("a retry is never retried again", () => {
  const d = retryDecision({ kind: "auth", failedAt: slot, slot, tz, estimateMs: MIN, isRetry: true });
  assert.deepEqual(d, { retry: false, reason: "already-retried" });
});

test("brief: no retry when it would finish after deliverAt + 30 min", () => {
  // failed 9:15 local, retry 9:25, needs 10 min → 9:35 > 9:30
  const d = retryDecision({ kind: "timeout", failedAt: new Date("2026-10-18T07:15:00Z"), slot, deliverAt: "09:00", tz, estimateMs: 10 * MIN });
  assert.equal(d.retry, false);
  assert.equal(d.reason, "late");
  // exactly on the deadline is still fine
  const ok = retryDecision({ kind: "timeout", failedAt: new Date("2026-10-18T07:10:00Z"), slot, deliverAt: "09:00", tz, estimateMs: 10 * MIN });
  assert.equal(ok.retry, true);
});

test("without deliverAt there is no deadline", () => {
  const d = retryDecision({ kind: "auth", failedAt: new Date("2026-10-18T20:00:00Z"), slot, tz, estimateMs: 60 * MIN });
  assert.equal(d.retry, true);
  assert.equal(d.deadline, null);
});

test("pendingRetryDue", () => {
  const p = { at: "2026-10-18T06:43:00.000Z", deadline: "2026-10-18T07:30:00.000Z" };
  assert.deepEqual(pendingRetryDue(p, new Date("2026-10-18T06:40:00Z"), 10 * MIN), { run: false });
  assert.deepEqual(pendingRetryDue(p, new Date("2026-10-18T06:45:00Z"), 10 * MIN), { run: true });
  assert.deepEqual(pendingRetryDue(p, new Date("2026-10-18T07:25:00Z"), 10 * MIN), { run: false, late: true });
  assert.deepEqual(pendingRetryDue({ at: p.at, deadline: null }, new Date("2026-10-18T07:30:00Z"), 10 * MIN), { run: true });
  // left over from a cron pause (> 60 min after its time): dropped without running
  assert.deepEqual(pendingRetryDue({ at: p.at, deadline: null }, new Date("2026-10-18T09:00:00Z"), 10 * MIN), { run: false, drop: "stale" });
  // a success after the failure cancels it
  const f = { ...p, failedAt: "2026-10-18T06:33:00.000Z" };
  assert.deepEqual(pendingRetryDue(f, new Date("2026-10-18T06:45:00Z"), 10 * MIN, "2026-10-18T06:35:00.000Z"), { run: false, drop: "succeeded" });
  assert.deepEqual(pendingRetryDue(f, new Date("2026-10-18T06:45:00Z"), 10 * MIN, "2026-10-17T06:30:00.000Z"), { run: true });
  assert.deepEqual(pendingRetryDue(null, new Date(), MIN), { run: false });
});

test("no retry when the schedule itself runs again before the retry time", () => {
  const d = retryDecision({ kind: "claude-error", failedAt: new Date("2026-10-18T10:01:00Z"), slot, tz, estimateMs: MIN, schedule: "*/5 * * * *" });
  assert.equal(d.reason, "next-slot");
  const daily = retryDecision({ kind: "claude-error", failedAt: new Date("2026-10-18T06:33:00Z"), slot, deliverAt: "09:00", tz, estimateMs: MIN, schedule: "30 8 * * *" });
  assert.equal(daily.retry, true);
});

test("no slot retry when the failed run already called a write tool", () => {
  const d = retryDecision({ kind: "timeout", failedAt: new Date("2026-10-18T06:33:00Z"), slot, tz, estimateMs: MIN, writes: ["mcp__x__pm_create_task"] });
  assert.equal(d.retry, false);
  assert.equal(d.reason, "writes");
});
