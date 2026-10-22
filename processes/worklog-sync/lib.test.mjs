import test from "node:test";
import assert from "node:assert/strict";
import { logLine, sessions } from "./lib.mjs";

test("sessions keep first and last HEAD per session and repo", () => {
  const e = (ts, head) => JSON.stringify({ ts, session_id: "abcdef123", repo: "/r", branch: "dev", head });
  const [s] = sessions([e("2026-10-22T08:00:00Z", "a"), "broken", e("2026-10-22T09:00:00Z", "b")]);
  assert.equal(s.firstHead, "a");
  assert.equal(s.lastHead, "b");
  assert.match(logLine(s, ["b1 Fix x"], "11:00"), /1 commit: b1 Fix x · session abcdef12/);
});
