// K1: start another process from a running one (usually from after.mjs), detached, with its own run,
// log and error reporting. The child waits for the process lock (--wait-lock, max 30 min) instead of
// being skipped, and inherits dry-run (RUN_DRY=1 → --dry-run).
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { envForcesDry, REPO, secrets } from "./core.mjs";

const RUNNER = path.join(REPO, "runner", "run.mjs");

/** Environment for the child runner: no secrets.env values (the child reads them itself) and no RUN_* of the parent run except RUN_DRY. */
function childEnv() {
  const env = { ...process.env };
  for (const k of Object.keys(secrets())) delete env[k];
  for (const k of Object.keys(env)) if (k.startsWith("RUN_") && k !== "RUN_DRY") delete env[k];
  if (envForcesDry()) env.RUN_DRY = "1";
  return env;
}

/**
 * spawnProcess(name, inputObj, { fromRunDir, label })
 * - writes inputObj to <fromRunDir>/<label>-input.json (when the file exists already: <label>-2-input.json, …)
 * - starts `node runner/run.mjs run <name> --input <file> --wait-lock [--dry-run]` detached
 * - stdout/stderr of the child go to <fromRunDir>/<label>.out
 * fromRunDir defaults to RUN_DIR (set for after.mjs), label to the process name.
 * Returns { pid, inputFile, outFile, dryRun }.
 */
export function spawnProcess(name, inputObj, { fromRunDir = process.env.RUN_DIR, label = name } = {}) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(String(name))) throw new Error(`spawnProcess: invalid process name "${name}"`);
  if (!fromRunDir) throw new Error("spawnProcess: fromRunDir missing (RUN_DIR not set)");
  if (!fs.existsSync(path.join(REPO, "runner", "run.mjs"))) throw new Error("spawnProcess: runner/run.mjs not found");
  fs.mkdirSync(fromRunDir, { recursive: true });
  const base = String(label).replace(/[^A-Za-z0-9._-]/g, "-") || name;
  let tag = base;
  for (let n = 2; fs.existsSync(path.join(fromRunDir, `${tag}-input.json`)); n++) tag = `${base}-${n}`;
  const inputFile = path.join(fromRunDir, `${tag}-input.json`);
  const outFile = path.join(fromRunDir, `${tag}.out`);
  fs.writeFileSync(inputFile, JSON.stringify(inputObj ?? {}, null, 2), { mode: 0o600 });
  const dryRun = envForcesDry();
  const args = [RUNNER, "run", name, "--input", inputFile, "--wait-lock"];
  if (dryRun) args.push("--dry-run");
  const fd = fs.openSync(outFile, "a");
  const child = spawn(process.execPath, args, { cwd: REPO, detached: true, stdio: ["ignore", fd, fd], env: childEnv() });
  child.unref();
  fs.closeSync(fd);
  console.log(`spawned ${name}${dryRun ? " (dry-run)" : ""}: pid ${child.pid}, input ${inputFile}, log ${outFile}`);
  return { pid: child.pid, inputFile, outFile, dryRun };
}
