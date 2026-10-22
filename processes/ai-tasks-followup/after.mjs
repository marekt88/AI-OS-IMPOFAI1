// AI tasks voice assistant (internal test) — after the call: Marek's answers → task activity, one line in the work log.
// The model only extracts answers; this script checks every quote against the transcript and allows "deploy" /
// "schvaľujem" only when Marek confirmed it clearly (answerComment). Comments go with the runner's token, whose name
// differs from the worker's, so the worker reads them as Marek's replies.
import fs from "node:fs";
import { pmTool } from "../../runner/pm.mjs";
import { AI_TASKS_LIST, answerComment, newTaskCheck } from "../ai-tasks-call/lib.mjs";

const input = JSON.parse(fs.readFileSync(process.env.RUN_INPUT, "utf8"));
const { output: o = {} } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
const dry = process.env.RUN_DRY !== "0" || input.dry_run === true;
const tasks = (input.tasks ?? []).map((t) => ({ key: t.task_key, name: t.name }));
const fmt = new Intl.DateTimeFormat("sk-SK", { timeZone: "Europe/Bratislava", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
const when = fmt.format(new Date(input.ended_at ?? Date.now()));

const lines = [];
for (const ans of o.answers ?? []) {
  const name = tasks.find((t) => t.key === ans.task_key)?.name ?? ans.task_key;
  const r = answerComment(ans, tasks, input.transcript, when);
  if (!r.ok) {
    lines.push(`${name}: ${r.reason}`);
    continue;
  }
  const what = r.downgraded ? `${ans.decision} nepotvrdené jednoznačne (len odpoveď)` : ans.decision;
  if (dry) {
    console.log(`[dry-run] ${ans.task_key}: ${what}\n${r.body}\n`);
  } else {
    await pmTool("pm_add_task_comment", { task: ans.task_key, body: r.body });
  }
  lines.push(`${name}: ${what}`);
}

// new tasks agreed in the call → AI tasks (the worker picks them up as TO DO)
for (const nt of o.new_tasks ?? []) {
  const c = newTaskCheck(nt, input.transcript);
  if (!c.ok) {
    lines.push(`nová úloha ${nt.name}: nevytvorená, ${c.reason}`);
    continue;
  }
  const description = `${nt.description}\n\n(Odsúhlasené v hlasovom hovore ${when}. Marekove slová: „${String(nt.quote).trim()}“)`;
  if (dry) {
    console.log(`[dry-run] new task "${nt.name}"\n${description}\n--- prompt ---\n${nt.prompt}\n`);
  } else {
    const t = await pmTool("pm_create_task", { task_list: AI_TASKS_LIST, name: nt.name, description, prompt: nt.prompt, type: "feature" });
    if (nt.from_task_key && tasks.some((x) => x.key === nt.from_task_key)) {
      await pmTool("pm_add_task_comment", { task: nt.from_task_key, body: `Z hlasového hovoru (${when}) vznikla nová úloha v AI tasks: ${nt.name}${t?.key ? ` (${t.key})` : ""}.` });
    }
  }
  lines.push(`nová úloha ${nt.name}: vytvorená`);
}
console.log(lines.join("\n") || "no answers");

const hm = new Intl.DateTimeFormat("sk-SK", { timeZone: "Europe/Bratislava", hour: "2-digit", minute: "2-digit" }).format(new Date());
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" }).format(new Date());
const log = `- ${hm} · hlasový asistent AI tasks · hovor ${input.conversation_id ?? "?"} (${tasks.length} ${tasks.length === 1 ? "úloha" : "úlohy"}) · ${lines.join("; ") || "bez odpovedí"} · ${dry ? "dry-run, nič nezapísané" : "odpovede zapísané do aktivity"} · kódovací agent pokračuje`;
if (!dry) {
  try {
    await pmTool("pm_append_brain_section", { note: "context/projekty/kapsa-dennik.md", heading: day, text: log });
  } catch (e) {
    console.error(`work log failed: ${e.message}`);
  }
}
console.log(log);
