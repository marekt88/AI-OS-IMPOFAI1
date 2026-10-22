// Claude Code work log: pure helpers for worklog-sync.
export const IDLE_MIN = 30; // a session counts as finished after this long without a turn
export const PROJECTS = {
  "/home/marek/impofai-pm": { name: "KAPSA", note: "context/projekty/kapsa-dennik.md" },
};

/** Queue lines → sessions { key, session_id, repo, branch, firstHead, lastHead, firstTs, lastTs }. */
export function sessions(lines) {
  const out = new Map();
  for (const l of lines) {
    let e;
    try {
      e = JSON.parse(l);
    } catch {
      continue;
    }
    if (!e.session_id || !e.repo || !e.head) continue;
    const key = `${e.session_id}|${e.repo}`;
    const s = out.get(key);
    if (!s) out.set(key, { key, session_id: e.session_id, repo: e.repo, branch: e.branch, firstHead: e.head, lastHead: e.head, firstTs: e.ts, lastTs: e.ts });
    else Object.assign(s, { branch: e.branch, lastHead: e.head, lastTs: e.ts });
  }
  return [...out.values()];
}

/** One work-log line; commits = ["abc1234 subject", …]. */
export function logLine(s, commits, hm) {
  const shown = commits.slice(0, 8).join("; ");
  const more = commits.length > 8 ? ` (+${commits.length - 8} ďalších)` : "";
  return `- ${hm} · Claude Code na serveri (vetva ${s.branch}) · ${commits.length} ${commits.length === 1 ? "commit" : commits.length <= 4 ? "commity" : "commitov"}: ${shown}${more} · session ${s.session_id.slice(0, 8)}`;
}
