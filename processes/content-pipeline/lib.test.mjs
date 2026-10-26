// node --test processes/content-pipeline/lib.test.mjs (no network)
import test from "node:test";
import assert from "node:assert/strict";
import { commentJob, humanComments, resourceGate, stageOf, transition } from "./lib.mjs";

test("stageOf", () => {
  assert.deepEqual(stageOf([{ name: "napad" }, { name: "navrhnute" }]), { stage: "navrhnute" });
  assert.match(stageOf(["navrhnute", "ready-for-posting"]).error, /viac/);
  assert.match(stageOf(["napad"]).error, /žiadny/);
});

test("transition", () => {
  assert.equal(transition(null, "navrhnute").kind, "first");
  assert.equal(transition("navrhnute", "navrhnute").kind, "none");
  assert.deepEqual(transition("navrhnute", "schvalene-na-video"), { kind: "job", job: "VIDEO_JOB" });
  assert.deepEqual(transition("pripravene-na-audio", "schvalene-na-audio"), { kind: "job", job: "AUDIO_JOB" });
  assert.deepEqual(transition("schvalene-na-audio", "ready-for-posting"), { kind: "job", job: "FINALIZE" });
  assert.equal(transition("ready-for-posting", "schvalene-na-audio").kind, "return");
  assert.equal(transition("navrhnute", "schvalene-na-audio").kind, "invalid");
  assert.equal(transition("schvalene-na-video", "pripravene-na-audio").kind, "none");
});

test("commentJob", () => {
  assert.equal(commentJob("navrhnute"), "SCRIPT_REVISION");
  assert.equal(commentJob("pripravene-na-audio"), "VIDEO_REVISION");
  assert.equal(commentJob("schvalene-na-audio", "running"), null);
  assert.equal(commentJob("schvalene-na-audio", "needs_review"), "AUDIO_REVISION");
  assert.equal(commentJob("ready-for-posting"), "REPLY");
  assert.equal(commentJob("schvalene-na-video"), null);
});

test("humanComments: own token ignored, other agents and users kept, cursor", () => {
  const items = [
    { id: "1", kind: "comment", body: "a", actor_type: "user" },
    { id: "2", kind: "comment", body: "b", actor_type: "agent", agent_name: "Socials" },
    { id: "3", kind: "status_changed", body: null, actor_type: "user" },
    { id: "4", kind: "comment", body: "c", actor_type: "agent", agent_name: "Claude (OAuth)" },
    { id: "5", kind: "comment", body: null, actor_type: "user", deleted_at: "x" },
  ];
  assert.deepEqual(humanComments(items, { ownAgentNames: ["Socials"] }).map((e) => e.id), ["1", "4"]);
  assert.deepEqual(humanComments(items, { ownAgentNames: ["Socials"], afterId: "1" }).map((e) => e.id), ["4"]);
  assert.deepEqual(humanComments(items, { ownAgentNames: ["Socials"], afterId: "zz" }), []);
});

test("resourceGate", () => {
  assert.equal(resourceGate({ diskFreeGb: 23, memAvailableMb: 5000, swapFreeMb: 3800 }).ok, true);
  assert.equal(resourceGate({ diskFreeGb: 1.9, memAvailableMb: 5000, swapFreeMb: 3800 }).code, "E_DISK");
  assert.equal(resourceGate({ diskFreeGb: 20, memAvailableMb: 2500, swapFreeMb: 3800 }).code, "E_RAM");
});
