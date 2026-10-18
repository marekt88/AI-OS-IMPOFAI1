#!/usr/bin/env node
// AI process runner (headless `claude -p` on the claude.ai subscription). See references/ai-runner.md.
//
//   node runner/run.mjs tick            cron entry point (every 5 min): git pull, start due processes and due slot retries,
//                                       retry queued reports
//   node runner/run.mjs run <name> [--input file.json] [--dry-run] [--wait-lock]
//                                       run one process now (manual: no waiting for deliverAt);
//                                       the input is available as {{input}} in prompt.md and as RUN_INPUT in after.mjs;
//                                       --dry-run: RUN_DRY=1, {{dry_run}}="true", no state/lastSuccessAt, no AI Bugs reports;
//                                       --wait-lock: wait for a running instance (max 30 min) instead of skipping
//   node runner/run.mjs list            definitions, schedules and last results
//   node runner/run.mjs report-test     create a test issue in AI Bugs (checks the PM token)
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { acquireLock, DIRS, envForcesDry, ensureDirs, inputForcesDry, isReadOnlyTool, listProcesses, loadProcess, readState, redact, REPO, runProcess, writeState } from "./core.mjs";
import { formatIn, latestSlot, parseCron, pendingRetryDue, retryDecision } from "./cron.mjs";
import { flushQueue, noteRecovered, reportIssue } from "./pm.mjs";

const SELF = fileURLToPath(import.meta.url);
const WAIT_LOCK_MAX_MS = Number(process.env.RUN_WAIT_LOCK_MAX_MS) || 30 * 60_000; // env override only for tests
const WAIT_LOCK_POLL_MS = Number(process.env.RUN_WAIT_LOCK_POLL_MS) || 15_000;

function startScheduled(name, slotIso, extra = []) {
  const out = path.join(DIRS.logs, `${name}.out`);
  const child = spawn(process.execPath, [SELF, "run-scheduled", name, slotIso, ...extra], {
    detached: true,
    stdio: ["ignore", fs.openSync(out, "a"), fs.openSync(out, "a")],
  });
  child.unref();
}

/** How long a run needs until its output is ready (for the retry deadline). */
// after a timeout the last success says nothing: assume the full time limit again
const estimateMs = (p, st, kind = null) => (kind === "timeout" ? Math.max(st.lastPrepMs ?? 0, p.timeoutMin * 60_000) : st.lastPrepMs ?? p.timeoutMin * 60_000);

async function tick() {
  const release = acquireLock("tick");
  if (!release) return;
  try {
    writeState("_runner", { lastTickAt: new Date().toISOString() });
    // 1. deploy: fast-forward the server checkout to origin/main (AIOS_NO_GIT_PULL=1 only for tests)
    if (process.env.AIOS_NO_GIT_PULL !== "1") {
      const pull = spawnSync("git", ["-C", REPO, "pull", "--ff-only", "--quiet"], { encoding: "utf8", timeout: 120_000 });
      if (pull.status !== 0) {
        await reportOnce("runner:git-pull", "git pull na serveri zlyhal, beží posledná verzia",
          `\`git pull --ff-only\` v \`${REPO}\` skončil chybou. Procesy bežia z poslednej stiahnutej verzie.\n\n\`\`\`\n${(pull.stderr || pull.stdout || String(pull.error)).slice(-1500)}\n\`\`\``);
      } else await noteRecovered("runner:git-pull", "Obnovené: `git pull` znova prechádza.");
    }

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

      // 2a. one retry of a failed slot (retrySlot), planned by run() as state.pendingRetry
      if (st.pendingRetry) {
        const due = pendingRetryDue(st.pendingRetry, now, estimateMs(p, st, st.pendingRetry.kind), st.lastSuccessAt);
        if (due.drop) {
          writeState(name, { pendingRetry: null });
          console.log(`[tick ${now.toISOString()}] dropped retry of ${name} for slot ${st.pendingRetry.slot}: ${due.drop}`);
        } else if (due.late) {
          writeState(name, { pendingRetry: null });
          await reportIssue({ fingerprint: `process:${name}:retry-skipped`, title: `Opakovaný pokus procesu ${name} sa už nestihne`, process: name,
            details: `Beh pre slot ${st.pendingRetry.slot} zlyhal (${st.pendingRetry.kind}). Druhý pokus by skončil po termíne ${formatIn(new Date(st.pendingRetry.deadline), p.tz)}, preto sa nespustil.` });
        } else if (due.run) {
          writeState(name, { pendingRetry: null });
          startScheduled(name, st.pendingRetry.slot, ["--retry"]);
          console.log(`[tick ${now.toISOString()}] started retry of ${name} for slot ${st.pendingRetry.slot}`);
        }
      }

      const floor = new Date(Math.max(now.getTime() - p.catchUpMin * 60_000, st.lastSlot ? Date.parse(st.lastSlot) : 0));
      const slot = latestSlot(p.schedule, p.tz, floor, now);
      if (!slot) continue;
      writeState(name, { lastSlot: slot.toISOString() });
      startScheduled(name, slot.toISOString());
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

/** Wait for the process lock (polling); null after maxMs. */
async function waitForLock(key, maxMs) {
  const until = Date.now() + maxMs;
  for (;;) {
    const release = acquireLock(key);
    if (release) return release;
    if (Date.now() >= until) return null;
    await new Promise((r) => setTimeout(r, Math.min(WAIT_LOCK_POLL_MS, Math.max(0, until - Date.now()))));
  }
}

async function run(name, { manual, slot, inputFile = null, dryRun = false, waitLock = false, isRetry = false }) {
  const p = loadProcess(name);
  // dry-run never writes to PM, so no AI Bugs reports or "Obnovené" comments either (printed instead)
  const report = async (issue) => {
    if (dryRun) {
      console.log(`[dry-run] would report: ${issue.title}\n${issue.details}`);
      return false;
    }
    return reportIssue(issue);
  };
  let release = acquireLock(`process-${name}`);
  if (!release && waitLock) {
    console.log(`${name} is running, waiting for the lock (max ${Math.round(WAIT_LOCK_MAX_MS / 60_000)} min)`);
    const t0 = Date.now();
    release = await waitForLock(`process-${name}`, WAIT_LOCK_MAX_MS);
    if (!release) {
      console.log(`${name}: lock wait timed out after ${Math.round((Date.now() - t0) / 1000)} s`);
      await report({ fingerprint: `process:${name}:lock-wait-timeout`, title: `Proces ${name} sa nespustil, predchádzajúci beh nedobehol do ${Math.round(WAIT_LOCK_MAX_MS / 60_000)} min`, process: name,
        details: `Beh čakal na zámok \`process-${name}\` a čakanie vypršalo. Vstup ostal uložený, beh sa dá spustiť ručne:\n\n\`node runner/run.mjs run ${name}${inputFile ? ` --input ${inputFile}` : ""}${dryRun ? " --dry-run" : ""}\`` });
      return 2;
    }
    console.log(`${name}: lock acquired after ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (!release) {
    console.log(`${name} is already running, skipped`);
    if (!manual) await reportOnce(`process:${name}:overlap`, `Proces ${name} ešte beží, ďalší beh preskočený`, `Beh pre slot ${slot} sa nespustil, lebo predchádzajúci beh ešte nedobehol.`, name);
    return 2;
  }
  try {
    const log = await runProcess(p, { manual, slot, inputFile, dryRun, retryOf: isRetry ? slot : null });
    console.log(JSON.stringify({ process: name, runId: log.runId, ok: log.ok, dryRun, ms: log.durationMs, attempts: log.steps.claudeAttempts?.length ?? null, error: log.error ?? null }));
    if (log.ok) {
      if (!dryRun) await noteRecovered(`process:${name}:`, `Obnovené: proces \`${name}\` znova prebehol úspešne (beh \`${log.runId}\`).`);
      return 0;
    }
    const kind = log.error.kind;
    const refresh = kind === "auth" && /obnova prihlásenia|refresh/i.test(log.error.message);
    const titles = {
      auth: refresh ? "Claude Code na serveri: obnova prihlásenia (OAuth refresh) zlyhala aj po opakovaní" : "Claude Code na serveri nie je prihlásený predplatným",
      "mcp-auth": `MCP konektor v procese ${name} potrebuje znova prihlásiť`,
      timeout: `Proces ${name} prekročil časový limit`,
      "max-turns": `Proces ${name} narazil na limit krokov`,
      schema: `Proces ${name} nevrátil výstup v požadovanom tvare`,
      "after-failed": `Krok po behu procesu ${name} zlyhal`,
      "after-timeout": `Krok po behu procesu ${name} prekročil časový limit`,
    };

    // retrySlot: a scheduled slot that failed on auth / claude-error / timeout gets one more attempt in 10 min
    let retryNote = "";
    if (!manual && !dryRun && p.schedule) {
      const st = readState(name);
      const d = retryDecision({ kind, failedAt: new Date(), slot: slot ? new Date(slot) : new Date(), deliverAt: p.after ? p.deliverAt : null, tz: p.tz, estimateMs: estimateMs(p, st, kind), isRetry, schedule: p.schedule,
        writes: [...new Set((log.steps.claude?.toolCalls ?? []).filter((t) => !isReadOnlyTool(t)))] });
      if (d.retry) {
        writeState(name, { pendingRetry: { slot, kind, at: d.at.toISOString(), deadline: d.deadline?.toISOString() ?? null, failedRunId: log.runId, failedAt: new Date().toISOString() } });
        retryNote = `\n- ďalší pokus: ${formatIn(d.at, p.tz)} (jeden, spustí ho tick)`;
      } else if (d.reason === "late") {
        retryNote = `\n- ďalší pokus sa nespustí: skončil by po termíne ${formatIn(d.deadline, p.tz)} (deliverAt + 30 min)`;
        await report({ fingerprint: `process:${name}:retry-skipped`, title: `Opakovaný pokus procesu ${name} sa už nestihne`, process: name, runId: log.runId,
          details: `Beh pre slot ${slot} zlyhal (${kind}). Druhý pokus o ${formatIn(d.at, p.tz)} by skončil po termíne ${formatIn(d.deadline, p.tz)}, preto sa nespustí.` });
      } else if (d.reason === "already-retried") retryNote = "\n- toto bol už opakovaný pokus, ďalší nebude";
      else if (d.reason === "writes") retryNote = `\n- ďalší pokus sa nespustí: beh už volal zápisové nástroje (${d.writes ?? "pozri volané nástroje"}), opakovanie by zapisovalo dvakrát`;
    }

    const fingerprint = kind === "auth" ? "runner:auth" : `process:${name}:${kind}`;
    const attempts = log.steps.claudeAttempts ?? [];
    await report({
      fingerprint,
      title: titles[kind] ?? `Proces ${name} zlyhal (${kind})`,
      details: `${log.error.message}\n\n- spustenie: ${manual ? "ručne" : `rozvrh, slot ${slot}${isRetry ? " (opakovaný pokus)" : ""}`}\n- trvanie: ${Math.round(log.durationMs / 1000)} s\n- pokusy claude -p: ${attempts.length || "-"}${attempts.length ? ` (${attempts.map((a) => a.transient ?? (a.ok ? "ok" : a.phase === "auth-status" ? "auth" : "chyba")).join(", ")})` : ""}\n- volané nástroje: ${(log.steps.claude?.toolCalls ?? []).join(", ") || "žiadne"}${retryNote}`,
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
      console.log(`${name}${p.enabled ? "" : " (disabled)"}\n  schedule: ${p.schedule ?? "manual only"} ${p.schedule ? p.tz : ""}\n  last: ${st.lastStatus ?? "never"} at ${st.lastRunAt ?? "-"}\n  last success: ${st.lastSuccessAt ?? "-"}` +
        (st.pendingRetry ? `\n  pending retry: ${st.pendingRetry.at} (slot ${st.pendingRetry.slot}, ${st.pendingRetry.kind})` : "") +
        (st.lastDryRun ? `\n  last dry-run: ${st.lastDryRun.ok ? "ok" : `failed:${st.lastDryRun.error}`} at ${st.lastDryRun.at}` : ""));
    } catch (err) {
      console.log(`${name}: INVALID ${err.message}`);
    }
  }
}

function takeFlag(argv, flag) {
  const i = argv.indexOf(flag);
  if (i < 0) return false;
  argv.splice(i, 1);
  return true;
}

async function main() {
  ensureDirs();
  const argv = process.argv.slice(2);
  const inputAt = argv.indexOf("--input");
  const inputFile = inputAt >= 0 ? argv.splice(inputAt, 2)[1] : null;
  // inherited RUN_DRY=1 / VOICE_NO_CALL=1 and an input with "dry_run": true always win
  const dryRun = takeFlag(argv, "--dry-run") || envForcesDry() || inputForcesDry(inputFile);
  const waitLock = takeFlag(argv, "--wait-lock");
  const isRetry = takeFlag(argv, "--retry");
  if (dryRun) process.env.RUN_DRY = "1"; // inherited by claude -p, after.mjs and spawnProcess children
  else delete process.env.RUN_DRY;
  const [cmd, a, b] = argv;
  try {
    if (cmd === "tick") await tick();
    else if (cmd === "run" && a) process.exitCode = await run(a, { manual: true, slot: null, inputFile, dryRun, waitLock });
    else if (cmd === "run-scheduled" && a) process.exitCode = await run(a, { manual: false, slot: b, dryRun, waitLock, isRetry });
    else if (cmd === "list") list();
    else if (cmd === "report-test") {
      const ok = await reportIssue({ fingerprint: `runner:test:${Date.now()}`, title: "Test hlásenia chýb (môžeš zmazať)", details: "Skúšobné hlásenie zo spúšťača AI procesov. Ak ho vidíš, hlásenie chýb do AI Bugs funguje." });
      console.log(ok ? "delivered" : "queued (PM unreachable or token missing)");
      process.exitCode = ok ? 0 : 1;
    } else {
      console.log("usage: run.mjs tick | run <name> [--input file] [--dry-run] [--wait-lock] | list | report-test");
      process.exitCode = 64;
    }
  } catch (err) {
    console.error(`[runner] crash: ${redact(err.stack ?? err)}`);
    if (!dryRun) await reportIssue({ fingerprint: `runner:crash:${cmd}`, title: `Spúšťač AI procesov spadol (${cmd})`, details: `\`\`\`\n${redact(err.stack ?? err).slice(0, 3000)}\n\`\`\`` }).catch(() => {});
    process.exitCode = 1;
  }
}

await main();
