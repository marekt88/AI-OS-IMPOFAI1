// Error reporting into the PM task list "AI Bugs" — talks to PM MCP over plain HTTP with its own token,
// so it works even when Claude Code (login, connectors) is the thing that is broken.
import fs from "node:fs";
import { DIRS, redact, secrets } from "./core.mjs";

const PM_MCP_URL = "https://project-managment.impofai.com/api/mcp";
export const BUGS_LIST = "cmv0zalyu0009p327hpyvas8d"; // Startups / Projekt Manazment / AI Bugs
const ISSUES_FILE = () => `${DIRS.state}/issues.json`;
const QUEUE_FILE = () => `${DIRS.state}/undelivered.jsonl`;

let rpcId = 0;
export async function pmTool(name, args) {
  const token = secrets().PM_MCP_TOKEN;
  if (!token) throw new Error("PM_MCP_TOKEN missing in ~/.aios-runner/secrets.env");
  const res = await fetch(secrets().PM_MCP_URL || PM_MCP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method: "tools/call", params: { name, arguments: { ...args, response_format: "json" } } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`PM MCP HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`PM MCP ${body.error.code}: ${body.error.message}`);
  const text = body.result?.content?.map((c) => c.text ?? "").join("\n") ?? "";
  if (body.result?.isError) throw new Error(`PM tool ${name}: ${text.slice(0, 300)}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function loadIssues() {
  try {
    return JSON.parse(fs.readFileSync(ISSUES_FILE(), "utf8"));
  } catch {
    return {};
  }
}
function saveIssues(v) {
  fs.writeFileSync(ISSUES_FILE(), JSON.stringify(v, null, 2));
}

/**
 * Report a problem. One open task per fingerprint (e.g. "process:morning-brief:run-failed"):
 * the first occurrence creates a bug task, repeats add a comment to it. If PM is unreachable the
 * report is queued in ~/.aios-runner/state/undelivered.jsonl and retried on the next tick.
 */
export async function reportIssue({ fingerprint, title, details, process: proc = null, runId = null }) {
  const at = new Date().toISOString();
  const safe = { fingerprint, title: redact(title), details: redact(details ?? ""), process: proc, runId, at };
  try {
    await deliver(safe);
    return true;
  } catch (err) {
    fs.appendFileSync(QUEUE_FILE(), JSON.stringify({ ...safe, deliveryError: redact(String(err.message ?? err)) }) + "\n");
    console.error(`[runner] could not deliver issue ${fingerprint}: ${redact(String(err.message ?? err))}`);
    return false;
  }
}

async function deliver({ fingerprint, title, details, process: proc, runId, at }) {
  const issues = loadIssues();
  const known = issues[fingerprint];
  const where = [`- čas: ${at}`, proc ? `- proces: \`${proc}\`` : null, runId ? `- beh: \`${runId}\` (log: \`~/.aios-runner/runs/${proc}/${runId}/\`)` : null, `- odtlačok: \`${fingerprint}\``]
    .filter(Boolean)
    .join("\n");
  if (known?.taskKey) {
    let open = false;
    try {
      const t = await pmTool("pm_get_task", { task: known.taskKey });
      open = t?.status && t.status !== "complete";
    } catch {
      open = false;
    }
    if (open) {
      await pmTool("pm_add_task_comment", { task: known.taskKey, body: `Znova: ${title}\n\n${where}\n\n${details}`.slice(0, 9500) });
      issues[fingerprint] = { ...known, count: (known.count ?? 1) + 1, lastAt: at, recoveredAt: null };
      saveIssues(issues);
      return;
    }
  }
  const task = await pmTool("pm_create_task", {
    task_list: BUGS_LIST,
    name: `[AI runner] ${title}`.slice(0, 480),
    type: "bug",
    priority: "high",
    description: `${details}\n\n---\n${where}\n\nNahlásil spúšťač AI procesov (\`runner/\` v repozitári AI-OS). Opakovaný výskyt pribudne ako komentár. Po oprave úlohu uzavri.`.slice(0, 49000),
  });
  const key = task?.key ?? task?.task?.key;
  issues[fingerprint] = { taskKey: key ?? null, count: 1, firstAt: at, lastAt: at };
  saveIssues(issues);
}

/** A process that had an open issue succeeded again → note it on the task (the human closes it). */
export async function noteRecovered(fingerprintPrefix, message) {
  const issues = loadIssues();
  for (const [fp, info] of Object.entries(issues)) {
    if (!fp.startsWith(fingerprintPrefix) || !info.taskKey || info.recoveredAt) continue;
    try {
      await pmTool("pm_add_task_comment", { task: info.taskKey, body: message });
      issues[fp] = { ...info, recoveredAt: new Date().toISOString() };
    } catch {
      /* best effort */
    }
  }
  saveIssues(issues);
}

/** Retry queued reports (called from every tick). */
export async function flushQueue() {
  let lines;
  try {
    lines = fs.readFileSync(QUEUE_FILE(), "utf8").split("\n").filter(Boolean);
  } catch {
    return;
  }
  const left = [];
  for (const line of lines) {
    const item = JSON.parse(line);
    try {
      await deliver(item);
    } catch {
      left.push(line);
    }
  }
  fs.writeFileSync(QUEUE_FILE(), left.length ? left.join("\n") + "\n" : "");
}
