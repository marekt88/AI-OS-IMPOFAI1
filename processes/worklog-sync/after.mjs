// Claude Code work log → KAPSA. Reads the queue written by the Stop hook, logs sessions idle for IDLE_MIN with new
// commits (made during the session, no merges) into the project's work log, and drops them from the queue.
// State: ~/.aios-runner/state/worklog-sync.json { logged: { "<session>|<repo>": last logged HEAD } }.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pmTool } from "../../runner/pm.mjs";
import { readJson, STATE_DIR, writeJson } from "../../runner/voice-call.mjs";
import { IDLE_MIN, PROJECTS, logLine, sessions } from "./lib.mjs";

const dry = process.env.RUN_DRY !== "0";
const QUEUE = path.join(STATE_DIR, "worklog-queue.jsonl");
const STATE = path.join(STATE_DIR, "worklog-sync.json");
const state = readJson(STATE, { logged: {} });
state.logged ??= {};

const lines = fs.existsSync(QUEUE) ? fs.readFileSync(QUEUE, "utf8").split("\n").filter(Boolean) : [];
const done = new Set();
const fmt = (opts) => new Intl.DateTimeFormat(opts.locale, { timeZone: "Europe/Bratislava", ...opts.o });
for (const s of sessions(lines)) {
  if ((Date.now() - new Date(s.lastTs).getTime()) / 60_000 < IDLE_MIN) continue;
  done.add(s.key);
  const proj = PROJECTS[s.repo];
  const base = state.logged[s.key] ?? s.firstHead;
  if (!proj || base === s.lastHead) continue;
  let commits = [];
  try {
    commits = execFileSync("git", ["-C", s.repo, "log", "--no-merges", `--since=${s.firstTs}`, "--format=%h %s", `${base}..${s.lastHead}`], { encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
  } catch (e) {
    console.error(`${s.key}: git log failed: ${e.message}`);
  }
  if (commits.length) {
    const end = new Date(s.lastTs);
    const line = logLine(s, commits, fmt({ locale: "sk-SK", o: { hour: "2-digit", minute: "2-digit" } }).format(end));
    const day = fmt({ locale: "en-CA", o: {} }).format(end);
    if (dry) console.log(`[dry-run] ${proj.note} / ${day}\n${line}`);
    else await pmTool("pm_append_brain_section", { note: proj.note, heading: day, text: line });
    console.log(`${proj.name}: ${commits.length} commit(s) from session ${s.session_id.slice(0, 8)}`);
  }
  state.logged[s.key] = s.lastHead;
}
if (!dry) {
  // keep only sessions that are still active
  fs.writeFileSync(QUEUE, lines.filter((l) => !done.has((() => { try { const e = JSON.parse(l); return `${e.session_id}|${e.repo}`; } catch { return ""; } })())).map((l) => l + "\n").join(""));
  writeJson(STATE, state);
}
console.log(done.size ? `${done.size} finished session(s) processed` : "no finished sessions");
