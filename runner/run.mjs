#!/usr/bin/env node
// AI process runner (headless `claude -p` on the claude.ai subscription). See references/ai-runner.md.
//
//   node runner/run.mjs tick            cron entry point (every 5 min): git pull, start due processes, retry queued reports
//   node runner/run.mjs run <name> [--input file.json]   run one process now (manual: no waiting for deliverAt);
//                                       the input is available as {{input}} in prompt.md and as RUN_INPUT in after.mjs
//   node runner/run.mjs list            definitions, schedules and last results
//   node runner/run.mjs report-test     create a test issue in AI Bugs (checks the PM token)
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { acquireLock, DIRS, ensureDirs, listProcesses, loadProcess, readState, redact, REPO, runProcess, writeState } from "./core.mjs";
import { formatIn, latestSlot, parseCron } from "./cron.mjs";
import { flushQueue, noteRecovered, reportIssue } from "./pm.mjs";

const SELF = fileURLToPath(import.meta.url);

async function tick() {
  const release = acquireLock("tick");
  if (!release) return;
  try {
    writeState("_runner", { lastTickAt: new Date().toISOString() });
    // 1. deploy: fast-forward the server checkout to origin/main
    const pull = spawnSync("git", ["-C", REPO, "pull", "--ff-only", "--quiet"], { encoding: "utf8", timeout: 120_000 });
    if (pull.status !== 0) {
      await reportOnce("runner:git-pull", "git pull na serveri zlyhal, beží posledná verzia",
        `\`git pull --ff-only\` v \`${REPO}\` skončil chybou. Procesy bežia z poslednej stiahnutej verzie.\n\n\`\`\`\n${(pull.stderr || pull.stdout || String(pull.error)).slice(-1500)}\n\`\`\``);
    } else await noteRecovered("runner:git-pull", "Obnovené: `git pull` znova prechádza.");

    // 2. start due processes (each in its own detached child, so a long run never blocks the tick)
    const now = new Date();
    for (const name of listProcesses()) {
      let p;
      try {
        p = loadProcess(name);
        if (p.schedule) parseCron(p.schedule);
      } catch (err) {
        await reportOnce(`process:${name}:definition`, `Neplatná definícia procesu ${name}`, String(err.message), name);
        continue;
      }
      if (!p.enabled || !p.schedule) continue;
      const st = readState(name);
      const floor = new Date(Math.max(now.getTime() - p.catchUpMin * 60_000, st.lastSlot ? Date.parse(st.lastSlot) : 0));
      const slot = latestSlot(p.schedule, p.tz, floor, now);
      if (!slot) continue;
      writeState(name, { lastSlot: slot.toISOString() });
      const child = spawn(process.execPath, [SELF, "run-scheduled", name, slot.toISOString()], {
        detached: true,
        stdio: ["ignore", fs.openSync(path.join(DIRS.logs, `${name}.out`), "a"), fs.openSync(path.join(DIRS.logs, `${name}.out`), "a")],
      });
      child.unref();
      console.log(`[tick ${now.toISOString()}] started ${name} for slot ${formatIn(slot, p.tz)}`);
    }

    // 3. deliver reports that could not reach PM earlier
    await flushQueue();
  } finally {
    release();
  }
}

async function reportOnce(fingerprint, title, details, proc = null) {
  // repeated tick-level problems (every 5 min) would flood the task with comments: at most one per hour
  const st = readState("_runner");
  const last = st[fingerprint] ? Date.parse(st[fingerprint]) : 0;
  if (Date.now() - last < 3600e3) return;
  writeState("_runner", { [fingerprint]: new Date().toISOString() });
  await reportIssue({ fingerprint, title, details, process: proc });
}

async function run(name, { manual, slot, inputFile = null }) {
  const p = loadProcess(name);
  const release = acquireLock(`process-${name}`);
  if (!release) {
    console.log(`${name} is already running, skipped`);
    if (!manual) await reportOnce(`process:${name}:overlap`, `Proces ${name} ešte beží, ďalší beh preskočený`, `Beh pre slot ${slot} sa nespustil, lebo predchádzajúci beh ešte nedobehol.`, name);
    return 2;
  }
  try {
    const log = await runProcess(p, { manual, slot, inputFile });
    console.log(JSON.stringify({ process: name, runId: log.runId, ok: log.ok, ms: log.durationMs, error: log.error ?? null }));
    if (log.ok) {
      await noteRecovered(`process:${name}:`, `Obnovené: proces \`${name}\` znova prebehol úspešne (beh \`${log.runId}\`).`);
      return 0;
    }
    const kind = log.error.kind;
    const titles = {
      auth: "Claude Code na serveri nie je prihlásený predplatným",
      "mcp-auth": `MCP konektor v procese ${name} potrebuje znova prihlásiť`,
      timeout: `Proces ${name} prekročil časový limit`,
      "max-turns": `Proces ${name} narazil na limit krokov`,
      schema: `Proces ${name} nevrátil výstup v požadovanom tvare`,
      "after-failed": `Krok po behu procesu ${name} zlyhal`,
      "after-timeout": `Krok po behu procesu ${name} prekročil časový limit`,
    };
    const fingerprint = kind === "auth" ? "runner:auth" : `process:${name}:${kind}`;
    await reportIssue({
      fingerprint,
      title: titles[kind] ?? `Proces ${name} zlyhal (${kind})`,
      details: `${log.error.message}\n\n- spustenie: ${manual ? "ručne" : `rozvrh, slot ${slot}`}\n- trvanie: ${Math.round(log.durationMs / 1000)} s\n- volané nástroje: ${(log.steps.claude?.toolCalls ?? []).join(", ") || "žiadne"}`,
      process: name,
      runId: log.runId,
    });
    return 1;
  } finally {
    release();
  }
}

function list() {
  for (const name of listProcesses()) {
    try {
      const p = loadProcess(name);
      const st = readState(name);
      console.log(`${name}${p.enabled ? "" : " (disabled)"}\n  schedule: ${p.schedule ?? "manual only"} ${p.schedule ? p.tz : ""}\n  last: ${st.lastStatus ?? "never"} at ${st.lastRunAt ?? "-"}\n  last success: ${st.lastSuccessAt ?? "-"}`);
    } catch (err) {
      console.log(`${name}: INVALID ${err.message}`);
    }
  }
}

async function main() {
  ensureDirs();
  const argv = process.argv.slice(2);
  const inputAt = argv.indexOf("--input");
  const inputFile = inputAt >= 0 ? argv.splice(inputAt, 2)[1] : null;
  const [cmd, a, b] = argv;
  try {
    if (cmd === "tick") await tick();
    else if (cmd === "run" && a) process.exitCode = await run(a, { manual: true, slot: null, inputFile });
    else if (cmd === "run-scheduled" && a) process.exitCode = await run(a, { manual: false, slot: b });
    else if (cmd === "list") list();
    else if (cmd === "report-test") {
      const ok = await reportIssue({ fingerprint: `runner:test:${Date.now()}`, title: "Test hlásenia chýb (môžeš zmazať)", details: "Skúšobné hlásenie zo spúšťača AI procesov. Ak ho vidíš, hlásenie chýb do AI Bugs funguje." });
      console.log(ok ? "delivered" : "queued (PM unreachable or token missing)");
      process.exitCode = ok ? 0 : 1;
    } else {
      console.log("usage: run.mjs tick | run <name> | list | report-test");
      process.exitCode = 64;
    }
  } catch (err) {
    console.error(`[runner] crash: ${redact(err.stack ?? err)}`);
    await reportIssue({ fingerprint: `runner:crash:${cmd}`, title: `Spúšťač AI procesov spadol (${cmd})`, details: `\`\`\`\n${redact(err.stack ?? err).slice(0, 3000)}\n\`\`\`` }).catch(() => {});
    process.exitCode = 1;
  }
}

await main();
