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
