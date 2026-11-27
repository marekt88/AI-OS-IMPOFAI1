// Pure decisions of the content-pipeline poller (navrh.md §1, one state machine): no network, unit-tested.
// Stages = custom statuses of the KAPSA list "Obsah" (Marek 2026-11-02, replaces the stage labels):
//   Nápad (with its script) → Video → Ozvučenie → Hotové (→ Naplánované, Publikované set by Socials; Zrušené).
// Marek 2026-11-23: Nápad and Scenár are one step, a new idea gets its script right away (content-napady queues
// it, the poller starts content-scenare); video and audio start only when a person moves the card.
// A person moves the card one column forward = approval; the job of that column starts. Back = return, no job.
export const STAGES = ["Nápad", "Video", "Ozvučenie", "Hotové"];
/** removed stages → the stage that replaced them (state files and cards from before 2026-11-23) */
export const LEGACY_STAGE = { Scenár: "Nápad" };
/** custom statuses of the list, created by pm_set_task_list_statuses (board order) */
export const LIST_STATUSES = [
  { name: "Nápad", color: "gray", category: "to_do" },
  { name: "Video", color: "purple", category: "in_progress" },
  { name: "Ozvučenie", color: "orange", category: "in_progress" },
  { name: "Hotové", color: "teal", category: "in_review" },
  { name: "Naplánované", color: "yellow", category: "in_review" }, // Socials plans and publishes it (Postiz), Marek 2026-11-23
  { name: "Publikované", color: "green", category: "complete" },
  { name: "Zrušené", color: "gray", category: "cancelled" },
];
const IDX = Object.fromEntries(STAGES.map((s, i) => [s, i]));
const JOB_OF = { Video: "VIDEO_JOB", Ozvučenie: "AUDIO_JOB", Hotové: "FINALIZE" };

/** Stage of a task (its custom status), null outside the pipeline (Publikované, Zrušené, built-in status). */
export function stageOf(task) {
  const name = task?.custom_status?.name ?? null;
  return name in IDX ? name : null;
}

/**
 * Transition from the last processed stage to the current one.
 * Returns { kind: "none" | "first" | "job" | "return" | "invalid" | "no_script", job? }.
 * `has` = what the task has ({ script, video }): Nápad → Video needs a finished script ("no_script" = move back).
 */
export function transition(prev, cur, has = {}) {
  // A card that enters the board straight into Video (from Zrušené, a built-in status or another list, e.g. an old
  // card from before the pipeline) has no previous stage. It still asks for a video (IMP-1610, 2026-11-25):
  // with a script the video starts, without one the script is written first and the video follows it.
  if (!prev && cur === "Video" && !has.video) return has.script ? { kind: "job", job: "VIDEO_JOB" } : { kind: "script_then_video" };
  if (!prev) return { kind: "first" };
  if (prev === cur) return { kind: "none" };
  const a = IDX[prev];
  const b = IDX[cur];
  if (b < a) return { kind: "return" };
  if (b - a !== 1) return { kind: "invalid" };
  // Marek 2026-11-26: picking an idea = moving it to Video; without a script it is written first, then the video
  if (cur === "Video" && !has.script) return { kind: "script_then_video" };
  return { kind: "job", job: JOB_OF[cur] };
}

/**
 * Which job a new human comment starts in a stage (null = none, "REPLY" = one explanatory reply).
 * While a job of the stage runs (agent run queued/running) comments wait for the next tick after it.
 */
export function commentJob(stage, agentRunStatus, has = {}) {
  const busy = agentRunStatus === "running" || agentRunStatus === "queued";
  if (stage === "Nápad") return busy ? null : has.script ? "SCRIPT_REVISION" : "SCRIPT_NEW"; // comment on an idea = (re)write its script
  if (stage === "Video") return busy ? null : "VIDEO_REVISION";
  if (stage === "Ozvučenie") return busy ? null : "AUDIO_REVISION";
  if (stage === "Hotové") return "REPLY";
  return null;
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
