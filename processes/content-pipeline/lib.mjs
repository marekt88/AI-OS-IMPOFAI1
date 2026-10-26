// Pure decisions of the content-pipeline poller (navrh.md §1, one state machine): no network, unit-tested.
export const STAGES = ["navrhnute", "schvalene-na-video", "pripravene-na-audio", "schvalene-na-audio", "ready-for-posting"];
const IDX = Object.fromEntries(STAGES.map((s, i) => [s, i]));

/** The single stage label of a task, or an error when there is none or more than one. */
export function stageOf(labels) {
  const st = (labels ?? []).map((l) => (typeof l === "string" ? l : l.name)).filter((n) => n in IDX);
  if (st.length === 1) return { stage: st[0] };
  return { error: st.length ? `viac etapových labelov (${st.join(", ")})` : "žiadny etapový label" };
}

/**
 * Transition from the last processed stage to the current label.
 * Returns { kind: "none" | "first" | "job" | "return" | "invalid", job? }.
 * Forward moves are allowed only one step at a time, except the automatic video → audio step made by the poller itself.
 */
export function transition(prev, cur) {
  if (!prev) return { kind: "first" };
  if (prev === cur) return { kind: "none" };
  const a = IDX[prev];
  const b = IDX[cur];
  if (b < a) return { kind: "return" };
  if (b - a !== 1) return { kind: "invalid" };
  if (cur === "schvalene-na-video") return { kind: "job", job: "VIDEO_JOB" };
  if (cur === "pripravene-na-audio") return { kind: "none" }; // set by the poller after a finished video
  if (cur === "schvalene-na-audio") return { kind: "job", job: "AUDIO_JOB" };
  if (cur === "ready-for-posting") return { kind: "job", job: "FINALIZE" };
  return { kind: "invalid" };
}

/** Which job a new human comment starts in a stage (null = none, "REPLY" = one explanatory reply). */
export function commentJob(stage, agentRunStatus) {
  if (stage === "navrhnute") return "SCRIPT_REVISION";
  if (stage === "pripravene-na-audio") return "VIDEO_REVISION";
  if (stage === "schvalene-na-audio") return ["needs_review", "failed", null, undefined].includes(agentRunStatus) ? "AUDIO_REVISION" : null;
  if (stage === "ready-for-posting") return "REPLY";
  return null; // schvalene-na-video: the video job is running or queued
}

/** Comments written by people: user entries, or agent entries from another token (Marek's Claude/voice), never our own. */
export function humanComments(items, { ownAgentNames = [], afterId = null } = {}) {
  const list = (items ?? []).filter((e) => e.kind === "comment" && e.body && !e.deleted_at);
  let start = 0;
  if (afterId) {
    const i = list.findIndex((e) => e.id === afterId);
    start = i >= 0 ? i + 1 : list.length; // unknown cursor: treat everything as already seen
  }
  return list.slice(start).filter((e) => e.actor_type === "user" || (e.actor_type === "agent" && !ownAgentNames.includes(e.agent_name)));
}

/** Resource gate for heavy jobs (render, audio). Thresholds from navrh.md §4, not measured yet. */
export function resourceGate({ diskFreeGb, memAvailableMb, swapFreeMb }, t = { disk: 5, mem: 3000, swap: 1000 }) {
  if (diskFreeGb < t.disk) return { ok: false, code: "E_DISK", why: `voľný disk ${diskFreeGb.toFixed(1)} GB < ${t.disk} GB` };
  if (memAvailableMb < t.mem) return { ok: false, code: "E_RAM", why: `voľná RAM ${memAvailableMb} MB < ${t.mem} MB` };
  if (swapFreeMb < t.swap) return { ok: false, code: "E_RAM", why: `voľný swap ${swapFreeMb} MB < ${t.swap} MB` };
  return { ok: true };
}
