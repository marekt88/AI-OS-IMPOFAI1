// Minimal 5-field cron ("min hour day-of-month month day-of-week") evaluated in an IANA time zone.
// Supports *, numbers, lists (1,5), ranges (1-5) and steps (*/15, 8-18/2). Day-of-week 0 or 7 = Sunday.

const RANGES = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];

function parseField(field, [min, max]) {
  const out = new Set();
  for (const part of field.split(",")) {
    const [base, stepRaw] = part.split("/");
    const step = stepRaw ? Number(stepRaw) : 1;
    let lo, hi;
    if (base === "*") [lo, hi] = [min, max];
    else if (base.includes("-")) [lo, hi] = base.split("-").map(Number);
    else lo = hi = Number(base);
    if (![lo, hi, step].every(Number.isInteger) || lo < min || hi > max || lo > hi || step < 1) {
      throw new Error(`invalid cron field "${field}"`);
    }
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

export function parseCron(expr) {
  const fields = String(expr).trim().split(/\s+/);
  if (fields.length !== 5) throw new Error(`cron "${expr}" must have 5 fields`);
  const sets = fields.map((f, i) => parseField(f, RANGES[i]));
  if (sets[4].has(7)) sets[4].add(0);
  return { sets, domStar: fields[2] === "*", dowStar: fields[4] === "*" };
}

const fmtCache = new Map();
function partsIn(date, tz) {
  let fmt = fmtCache.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", weekday: "short",
    });
    fmtCache.set(tz, fmt);
  }
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { minute: +p.minute, hour: +p.hour, day: +p.day, month: +p.month, year: +p.year, dow };
}

export function matches(cron, date, tz) {
  const { sets, domStar, dowStar } = cron;
  const t = partsIn(date, tz);
  if (!sets[0].has(t.minute) || !sets[1].has(t.hour) || !sets[3].has(t.month)) return false;
  const dom = sets[2].has(t.day);
  const dow = sets[4].has(t.dow);
  // classic cron: if both day fields are restricted, either may match
  if (!domStar && !dowStar) return dom || dow;
  return dom && dow;
}

/** Latest minute in (from, to] that matches the cron expression, or null. */
export function latestSlot(expr, tz, from, to) {
  const cron = parseCron(expr);
  const end = Math.floor(to.getTime() / 60000) * 60000;
  const start = Math.floor(from.getTime() / 60000) * 60000;
  for (let t = end; t > start; t -= 60000) {
    if (matches(cron, new Date(t), tz)) return new Date(t);
  }
  return null;
}

/** "HH:MM" today in tz → Date (searches the next 24 hours from the start of today in tz). */
export function todayAt(hhmm, tz, now = new Date()) {
  const [h, m] = hhmm.split(":").map(Number);
  const cron = parseCron(`${m} ${h} * * *`);
  const today = partsIn(now, tz);
  for (let t = now.getTime() - 24 * 3600e3; t <= now.getTime() + 24 * 3600e3; t += 60000) {
    const d = new Date(Math.floor(t / 60000) * 60000);
    const p = partsIn(d, tz);
    if (p.day === today.day && p.month === today.month && matches(cron, d, tz)) return d;
  }
  return null;
}

export function formatIn(date, tz) {
  return new Intl.DateTimeFormat("sk-SK", { timeZone: tz, dateStyle: "medium", timeStyle: "short" }).format(date);
}

// ---------- retrySlot: one more attempt for a scheduled slot that failed ----------
export const RETRY_KINDS = ["auth", "claude-error", "timeout"];
export const RETRY_DELAY_MIN = 10;
export const RETRY_GRACE_MIN = 30; // a process with deliverAt: the retry must be ready by deliverAt + 30 min

/** deliverAt ("HH:MM") on the day of `slot` in tz + graceMin, as epoch ms; null without deliverAt. */
export function deliverDeadline(deliverAt, tz, slot, graceMin = RETRY_GRACE_MIN) {
  if (!deliverAt) return null;
  const at = todayAt(deliverAt, tz, slot);
  return at ? at.getTime() + graceMin * 60_000 : null;
}

/**
 * Should a failed scheduled run get one more attempt?
 * → { retry: true, at: Date, deadline } | { retry: false, reason: "kind"|"already-retried"|"late", at?, deadline? }
 * estimateMs = how long the run needs until its output is ready (last successful prepMs, else timeoutMin).
 * schedule: when the cron has a slot of its own before the retry time, no retry ("next-slot").
 * writes: write tools the failed run called (not read-only) → no retry ("writes").
 */
export function retryDecision({ kind, failedAt, slot, deliverAt = null, tz, estimateMs, isRetry = false, schedule = null, writes = [], delayMin = RETRY_DELAY_MIN, graceMin = RETRY_GRACE_MIN }) {
  if (isRetry) return { retry: false, reason: "already-retried" };
  if (!RETRY_KINDS.includes(kind)) return { retry: false, reason: "kind" };
  if (writes.length) return { retry: false, reason: "writes", writes: writes.join(", ") }; // the failed run already wrote something: never twice
  const at = new Date(failedAt.getTime() + delayMin * 60_000);
  // a frequent schedule (e.g. */5) runs again before the retry anyway
  if (schedule && latestSlot(schedule, tz, failedAt, at)) return { retry: false, reason: "next-slot", at };
  const deadline = deliverDeadline(deliverAt, tz, slot ?? failedAt, graceMin);
  if (deadline != null && at.getTime() + estimateMs > deadline) return { retry: false, reason: "late", at, deadline: new Date(deadline) };
  return { retry: true, at, deadline: deadline != null ? new Date(deadline) : null };
}

/**
 * A pendingRetry from state is due → { run: true } | { run: false } | { run: false, late: true } (would finish after
 * the deadline) | { run: false, drop: "succeeded"|"stale" } (remove without running or reporting).
 */
export const RETRY_STALE_MIN = 60;
export function pendingRetryDue(pending, now, estimateMs, lastSuccessAt = null) {
  if (!pending?.at || Date.parse(pending.at) > now.getTime()) return { run: false };
  // a success after the failure (e.g. a manual run) makes the retry pointless
  if (lastSuccessAt && pending.failedAt && Date.parse(lastSuccessAt) > Date.parse(pending.failedAt)) return { run: false, drop: "succeeded" };
  // left over from a pause of the cron (no tick for a long time): drop silently
  if (now.getTime() - Date.parse(pending.at) > RETRY_STALE_MIN * 60_000) return { run: false, drop: "stale" };
  if (pending.deadline && now.getTime() + estimateMs > Date.parse(pending.deadline)) return { run: false, late: true };
  return { run: true };
}
