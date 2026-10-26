// Upload of a (binary) file to a KAPSA task over PM MCP with a long timeout (runner/pm.mjs uses 30 s, too short for
// 25 MB as base64). Dry-run never sends. Files over 25 MB are refused before sending (E_SIZE), KAPSA would reject them.
import fs from "node:fs";
import path from "node:path";
import { secrets } from "../../runner/core.mjs";

const PM_MCP_URL = "https://project-managment.impofai.com/api/mcp";
export const MAX_BYTES = 25 * 1024 * 1024;
const MIME = { ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json", ".md": "text/markdown" };

export async function uploadTaskFile(task, file, { name = path.basename(file), tokenEnv = "CONTENT_PM_TOKEN", timeoutMs = 300_000 } = {}) {
  const size = fs.statSync(file).size;
  if (size > MAX_BYTES) throw new Error(`E_SIZE: ${name} má ${(size / 1048576).toFixed(1)} MB > 25 MB`);
  if (process.env.RUN_DRY === "1") return { dry_run: true, task, name, size };
  const token = secrets()[tokenEnv] || process.env[tokenEnv];
  if (!token) throw new Error(`${tokenEnv} missing`);
  const ext = path.extname(name).toLowerCase();
  const isText = [".json", ".md"].includes(ext);
  const args = { task, file_name: name, mime_type: MIME[ext], response_format: "json", ...(isText ? { content_text: fs.readFileSync(file, "utf8") } : { content_base64: fs.readFileSync(file).toString("base64") }) };
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(secrets().PM_MCP_URL || PM_MCP_URL, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${token}` },
        body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name: "pm_upload_task_attachment", arguments: args } }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const text = body.result?.content?.map((c) => c.text ?? "").join("\n") ?? "";
      if (body.error || body.result?.isError) throw new Error(`upload ${name}: ${(body.error?.message ?? text).slice(0, 300)}`);
      return JSON.parse(text);
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, attempt * 5000));
    }
  }
  throw new Error(`E_UPLOAD: ${last.message}`);
}

/** Next version number for "<KEY>_<kind>-vN.<ext>" among the task's attachments. */
export function nextVersion(attachments, key, kind) {
  const re = new RegExp(`^${key}_${kind}-v(\\d+)\\.`);
  return 1 + Math.max(0, ...(attachments ?? []).map((a) => Number(a.file_name?.match(re)?.[1] ?? 0)));
}
