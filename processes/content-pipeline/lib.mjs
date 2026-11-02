// Pure decisions of the content-pipeline poller (navrh.md §1, one state machine): no network, unit-tested.
// Stages = custom statuses of the KAPSA list "Obsah" (Marek 2026-11-02, replaces the stage labels):
//   Nápad → Scenár → Video → Ozvučenie → Hotové (→ Publikované, set by Socials; Zrušené = cancelled).
// A person moves the card one column forward = approval; the job of that column starts. Back = return, no job.
export const STAGES = ["Nápad", "Scenár", "Video", "Ozvučenie", "Hotové"];
/** custom statuses of the list, created by pm_set_task_list_statuses (board order) */
export const LIST_STATUSES = [
  { name: "Nápad", color: "gray", category: "to_do" },
  { name: "Scenár", color: "blue", category: "in_progress" },
  { name: "Video", color: "purple", category: "in_progress" },
  { name: "Ozvučenie", color: "orange", category: "in_progress" },
  { name: "Hotové", color: "teal", category: "in_review" },
  { name: "Publikované", color: "green", category: "complete" },
  { name: "Zrušené", color: "gray", category: "cancelled" },
];
const IDX = Object.fromEntries(STAGES.map((s, i) => [s, i]));
const JOB_OF = { Scenár: "SCRIPT_NEW", Video: "VIDEO_JOB", Ozvučenie: "AUDIO_JOB", Hotové: "FINALIZE" };

/** Stage of a task (its custom status), null outside the pipeline (Publikované, Zrušené, built-in status). */
export function stageOf(task) {
  const name = task?.custom_status?.name ?? null;
  return name in IDX ? name : null;
}

/**
 * Transition from the last processed stage to the current one.
 * Returns { kind: "none" | "first" | "job" | "return" | "invalid", job? }.
 * `has` = what already exists on a task seen for the first time ({ script, video }), so a card that a person
 * moved to Scenár before the poller saw it still gets its script, but migrated cards do not redo work.
 */
export function transition(prev, cur, has = {}) {
  if (!prev) {
    if (cur === "Scenár" && !has.script) return { kind: "job", job: "SCRIPT_NEW" };
    return { kind: "first" };
  }
  if (prev === cur) return { kind: "none" };
  const a = IDX[prev];
  const b = IDX[cur];
  if (b < a) return { kind: "return" };
  if (b - a !== 1) return { kind: "invalid" };
  return { kind: "job", job: JOB_OF[cur] };
}

/**
 * Which job a new human comment starts in a stage (null = none, "REPLY" = one explanatory reply).
 * While a job of the stage runs (agent run queued/running) comments wait for the next tick after it.
 */
export function commentJob(stage, agentRunStatus, has = {}) {
  const busy = agentRunStatus === "running" || agentRunStatus === "queued";
  if (stage === "Scenár") return busy ? null : has.script ? "SCRIPT_REVISION" : "SCRIPT_NEW";
  if (stage === "Video") return busy ? null : "VIDEO_REVISION";
  if (stage === "Ozvučenie") return busy ? null : "AUDIO_REVISION";
  if (stage === "Hotové") return "REPLY";
  return null; // Nápad: comments are notes for the idea
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

/** What a task already has, from its attachment names. */
export function artifacts(attachments) {
  const names = (attachments ?? []).map((a) => a.file_name);
  return {
    script: names.some((n) => /_script-v\d+\.json$/.test(n)),
    video: names.some((n) => /_video-v\d+\.mp4$/.test(n)),
    final: names.some((n) => /_final-v\d+\.mp4$/.test(n)),
  };
}

/** Resource gate for heavy jobs (render, audio). Thresholds from navrh.md §4, not measured yet. */
export function resourceGate({ diskFreeGb, memAvailableMb, swapFreeMb }, t = { disk: 5, mem: 3000, swap: 1000 }) {
  if (diskFreeGb < t.disk) return { ok: false, code: "E_DISK", why: `voľný disk ${diskFreeGb.toFixed(1)} GB < ${t.disk} GB` };
  if (memAvailableMb < t.mem) return { ok: false, code: "E_RAM", why: `voľná RAM ${memAvailableMb} MB < ${t.mem} MB` };
  if (swapFreeMb < t.swap) return { ok: false, code: "E_RAM", why: `voľný swap ${swapFreeMb} MB < ${t.swap} MB` };
  return { ok: true };
}
