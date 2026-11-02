// node --test processes/content-pipeline/lib.test.mjs (no network)
import test from "node:test";
import assert from "node:assert/strict";
import { artifacts, commentJob, humanComments, resourceGate, stageOf, transition } from "./lib.mjs";

test("stageOf: custom status of the list", () => {
  assert.equal(stageOf({ custom_status: { name: "Video" } }), "Video");
  assert.equal(stageOf({ custom_status: { name: "Publikované" } }), null);
  assert.equal(stageOf({ custom_status: null }), null);
});

test("transition", () => {
  assert.equal(transition(null, "Nápad").kind, "first");
  assert.deepEqual(transition(null, "Scenár"), { kind: "job", job: "SCRIPT_NEW" }); // moved before the poller saw it
  assert.equal(transition(null, "Scenár", { script: true }).kind, "first"); // migrated card with a script
  assert.equal(transition(null, "Video", { video: true }).kind, "first");
  assert.equal(transition("Scenár", "Scenár").kind, "none");
  assert.deepEqual(transition("Nápad", "Scenár"), { kind: "job", job: "SCRIPT_NEW" });
  assert.deepEqual(transition("Scenár", "Video"), { kind: "job", job: "VIDEO_JOB" });
  assert.deepEqual(transition("Video", "Ozvučenie"), { kind: "job", job: "AUDIO_JOB" });
  assert.deepEqual(transition("Ozvučenie", "Hotové"), { kind: "job", job: "FINALIZE" });
  assert.equal(transition("Hotové", "Ozvučenie").kind, "return");
  assert.equal(transition("Video", "Nápad").kind, "return");
  assert.equal(transition("Nápad", "Video").kind, "invalid");
});

test("commentJob", () => {
  assert.equal(commentJob("Scenár", "needs_review", { script: true }), "SCRIPT_REVISION");
  assert.equal(commentJob("Scenár", "failed", { script: false }), "SCRIPT_NEW");
  assert.equal(commentJob("Scenár", "running", { script: true }), null);
  assert.equal(commentJob("Video", "needs_review"), "VIDEO_REVISION");
  assert.equal(commentJob("Video", "running"), null);
  assert.equal(commentJob("Ozvučenie", null), "AUDIO_REVISION");
  assert.equal(commentJob("Hotové"), "REPLY");
  assert.equal(commentJob("Nápad"), null);
});

test("artifacts", () => {
  assert.deepEqual(artifacts([{ file_name: "x_script-v2.json" }, { file_name: "IMP-1_video-v1.mp4" }]), { script: true, video: true, final: false });
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
