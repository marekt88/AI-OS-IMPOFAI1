// Inbound calls (K7): poll ElevenLabs for finished inbound conversations of the personal assistant
// since the last processed one and start call-followup (kind "inbound") for each. Read-only towards
// ElevenLabs. Cursor: ~/.aios-runner/state/inbound-call.cursor.json (not lastSuccessAt).
// First run: the cursor is set to "now", older calls are never processed.
// RUN_DRY=1: lists and parses, followups get dry_run, the cursor and voice-usage stay untouched.
import path from "node:path";
import { elevenlabs, isDry, readJson, recordUsage, startFollowup, STATE_DIR, writeJson } from "../../runner/voice-call.mjs";
import { reportIssue } from "../../runner/pm.mjs";
import { AGENT_ID, classifyListed, parseConversation } from "./lib.mjs";

const RUN_DIR = process.env.RUN_DIR;
const CURSOR = process.env.INBOUND_CURSOR_FILE || path.join(STATE_DIR, "inbound-call.cursor.json");
const STUCK_SECS = 3 * 3600; // a conversation not "done" after 3 h is given up
const REPORT_EVERY_SECS = 3600; // API errors: fail the run (→ AI Bugs) at most once an hour
const nowUnix = Math.floor(Date.now() / 1000);
const dry = isDry();

const cur = readJson(CURSOR, null);
if (!cur) {
  if (!dry) writeJson(CURSOR, { after_unix: nowUnix, processed: [], created_at: new Date().toISOString() });
  console.log(`first run: cursor set to now (${new Date(nowUnix * 1000).toISOString()}), older calls ignored${dry ? " [dry-run: not saved]" : ""}`);
  process.exit(0);
}
const processed = new Set(cur.processed ?? []);
const save = (patch = {}) => {
  if (dry) return;
  Object.assign(cur, patch, { processed: [...processed].slice(-300), updated_at: new Date().toISOString() });
  writeJson(CURSOR, cur);
};

try {
  // 1. list (newest first by default; page through everything since the cursor)
  const listed = [];
  let pageCursor = null;
  for (let page = 0; page < 10; page++) {
    const q = new URLSearchParams({ agent_id: AGENT_ID, call_start_after_unix: String(cur.after_unix), page_size: "100" });
    if (pageCursor) q.set("cursor", pageCursor);
    const r = await elevenlabs("GET", `/v1/convai/conversations?${q}`);
    listed.push(...(r.conversations ?? []));
    if (!r.has_more || !r.next_cursor) break;
    pageCursor = r.next_cursor;
  }

  // 2. handle oldest first
  listed.sort((a, b) => (a.start_time_unix_secs ?? 0) - (b.start_time_unix_secs ?? 0));
  let oldestPending = null;
  const stats = { listed: listed.length, followups: 0, skipped: {} };
  const skip = (why, id) => {
    stats.skipped[why] = (stats.skipped[why] ?? 0) + 1;
    if (id) processed.add(id);
  };
  for (const c of listed) {
    const cls = classifyListed(c, processed);
    if (cls === "seen") continue;
    if (cls === "pending") {
      if (nowUnix - (c.start_time_unix_secs ?? nowUnix) > STUCK_SECS) {
        // never dropped silently: AI Bugs gets the conversation id, Marek's call can be processed by hand
        const at = c.start_time_unix_secs ? new Date(c.start_time_unix_secs * 1000).toISOString() : "?";
        const issue = {
          fingerprint: `process:inbound-call:stuck:${c.conversation_id}`,
          title: `Prichádzajúci hovor ${c.conversation_id} je v ElevenLabs viac ako 3 h v stave ${c.status}`,
          details: `Hovor začal ${at} a stále nie je \`done\`, takže ho inbound-call nespracoval a followup sa nespustil.\nSkontroluj ho v ElevenLabs. Keď je hotový, followup sa dá spustiť ručne (vstup ako \`followup-<id>-input.json\` v behu inbound-call).`,
          process: "inbound-call",
          runId: process.env.RUN_ID ?? null,
        };
        if (dry) console.log(`[dry-run] would report: ${issue.title}`);
        else await reportIssue(issue);
        skip("stuck-reported", c.conversation_id);
      } else oldestPending = Math.min(oldestPending ?? Infinity, c.start_time_unix_secs ?? nowUnix);
      continue;
    }
    if (cls !== "candidate") {
      skip(cls, c.conversation_id);
      continue;
    }
    const conv = await elevenlabs("GET", `/v1/convai/conversations/${c.conversation_id}`);
    const p = parseConversation(conv);
    if (p.skip) {
      skip(p.skip, c.conversation_id);
      continue;
    }
    // 1) mark as processed and save the cursor BEFORE anything else: a crash or kill after this point never
    //    starts a second followup for the same conversation (call-followup also refuses duplicate conversation_id)
    processed.add(p.id);
    save();
    // 2) usage: unverified callers are counted separately and never use up Marek's daily cap
    try {
      recordUsage({ kind: "inbound", secs: p.durationSecs, conversationId: p.id, answered: p.userTurns > 0, unverified: !p.caller.verified });
    } catch (err) {
      console.error(`voice-usage not updated: ${err.message}`);
    }
    if (p.userTurns === 0) {
      stats.skipped["no-user-turns"] = (stats.skipped["no-user-turns"] ?? 0) + 1;
      continue;
    }
    console.log(JSON.stringify({ conversation_id: p.id, started: p.startedAt, secs: p.durationSecs, caller: p.caller.external_number, verified: p.caller.verified, user_turns: p.userTurns }));
    try {
      await startFollowup({
        runDir: RUN_DIR,
        kind: "inbound",
        purpose: p.caller.verified
          ? "Prichádzajúci hovor od Mareka: úlohy, nápady a otázky, ktoré potvrdil"
          : `Prichádzajúci hovor z neovereného čísla ${p.caller.external_number || "(neznáme)"}: iba poznámka, žiadne akcie`,
        content: { conversation_id: p.id, started_at: p.startedAt, duration_secs: p.durationSecs, termination_reason: p.terminationReason, elevenlabs_summary: p.summary },
        transcript: p.transcript,
        conversationId: p.id,
        caller: p.caller,
        depth: 0,
        label: `followup-${p.id}`,
      });
    } catch (err) {
      // already marked processed: fail the run loudly (AI Bugs) with the id instead of retrying silently
      save({ failed_followups: [...(cur.failed_followups ?? []), { conversation_id: p.id, at: new Date().toISOString(), error: String(err.message).slice(0, 300) }].slice(-50) });
      throw Object.assign(new Error(`followup for ${p.id} could not be started: ${err.message}`), { always: true });
    }
    stats.followups++;
  }

  // 3. move the cursor: to the oldest still running call, else a little before now (ids dedupe overlaps)
  save({ after_unix: oldestPending ?? Math.max(cur.after_unix, nowUnix - 600), last_ok_at: new Date().toISOString(), failures: 0 });
  console.log(JSON.stringify({ ...stats, pending: oldestPending != null, dry_run: dry }));
} catch (err) {
  const failures = (cur.failures ?? 0) + 1;
  const lastReport = cur.last_failure_report_unix ?? 0;
  const report = err.always || nowUnix - lastReport >= REPORT_EVERY_SECS; // a lost followup is always reported
  save({ failures, last_error: String(err.message).slice(0, 500), ...(report ? { last_failure_report_unix: nowUnix } : {}) });
  console.error(`inbound poll failed (${failures}x in a row): ${err.message}`);
  // transient API errors every 5 minutes would flood AI Bugs with comments: fail the run once an hour
  process.exit(report ? 1 : 0);
}
