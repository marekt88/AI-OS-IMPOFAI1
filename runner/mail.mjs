// E-mail for Marek instead of phone calls (Marek 2026-11-25: "všetky hovory vypni, posielaj mi správu na Gmail").
// Plain SMTP without dependencies and without Claude (an alert must arrive exactly when Claude is logged out).
// secrets.env: ALERT_SMTP_URL = smtps://<gmail address>:<app password>@smtp.gmail.com:465
//              (smtp://…:587 uses STARTTLS), ALERT_EMAIL_TO (optional, default = the SMTP user).
// Not configured → { sent: false, reason } and a line in the log; the caller never fails because of mail.
import net from "node:net";
import tls from "node:tls";
import { secrets } from "./core.mjs";

export function mailConfig() {
  const raw = secrets().ALERT_SMTP_URL;
  if (!raw) return null;
  const u = new URL(raw);
  const user = decodeURIComponent(u.username);
  return {
    secure: u.protocol === "smtps:",
    host: u.hostname,
    port: Number(u.port) || (u.protocol === "smtps:" ? 465 : 587),
    user,
    pass: decodeURIComponent(u.password).replace(/\s+/g, ""), // Gmail shows app passwords in groups of 4
    to: secrets().ALERT_EMAIL_TO || user,
  };
}

const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
const encWord = (s) => `=?UTF-8?B?${b64(s)}?=`;

/** RFC 5322 message, UTF-8 text body (base64, lines ≤ 76). */
export function buildMessage({ from, to, subject, text, date = new Date() }) {
  const body = b64(text).replace(/.{76}/g, "$&\r\n");
  return [
    `From: ${encWord("IMPOFAI server")} <${from}>`,
    `To: <${to}>`,
    `Subject: ${encWord(subject)}`,
    `Date: ${date.toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@aios-runner>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    body,
  ].join("\r\n");
}

function smtpSession(cfg, steps, timeoutMs) {
  return new Promise((resolve, reject) => {
    let sock = cfg.secure ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host }) : net.connect({ host: cfg.host, port: cfg.port });
    let buf = "";
    let waiting = null;
    const timer = setTimeout(() => fail(new Error("SMTP timeout")), timeoutMs);
    const fail = (e) => {
      clearTimeout(timer);
      sock.destroy();
      reject(e);
    };
    const onData = (d) => {
      buf += d;
      // a reply is complete when its last line is "NNN text" (not "NNN-")
      const lines = buf.split("\r\n");
      const done = lines.slice(0, -1).find((l) => /^\d{3} /.test(l));
      if (done && waiting) {
        const reply = buf;
        buf = "";
        const w = waiting;
        waiting = null;
        w(reply);
      }
    };
    const attach = () => {
      sock.on("data", onData);
      sock.on("error", fail);
    };
    attach();
    const read = () => new Promise((r) => (waiting = r));
    const cmd = async (line, expect) => {
      if (line != null) sock.write(line + "\r\n");
      const reply = await read();
      if (!new RegExp(`^${expect}`).test(reply)) throw new Error(`SMTP ${line?.split(" ")[0] ?? "greeting"}: ${reply.trim().slice(0, 200)}`);
      return reply;
    };
    const starttls = () =>
      new Promise((r, j) => {
        sock.removeListener("data", onData);
        sock = tls.connect({ socket: sock, servername: cfg.host }, () => r());
        sock.once("error", j);
        attach();
      });
    steps({ cmd, starttls })
      .then(() => {
        clearTimeout(timer);
        sock.end();
        resolve();
      })
      .catch(fail);
  });
}

/** Sends a plain-text e-mail to Marek. Never throws: returns { sent, reason? }. */
export async function sendMail({ subject, text }, { timeoutMs = 30_000 } = {}) {
  let cfg;
  try {
    cfg = mailConfig();
  } catch (e) {
    return { sent: false, reason: `ALERT_SMTP_URL is not a valid URL: ${e.message}` };
  }
  if (!cfg) {
    console.log(`[mail] not sent (ALERT_SMTP_URL missing in secrets.env): ${subject}`);
    return { sent: false, reason: "ALERT_SMTP_URL missing" };
  }
  const msg = buildMessage({ from: cfg.user, to: cfg.to, subject, text });
  try {
    await smtpSession(cfg, async ({ cmd, starttls }) => {
      await cmd(null, "220");
      await cmd("EHLO aios-runner", "250");
      if (!cfg.secure) {
        await cmd("STARTTLS", "220");
        await starttls();
        await cmd("EHLO aios-runner", "250");
      }
      await cmd(`AUTH PLAIN ${b64(`\0${cfg.user}\0${cfg.pass}`)}`, "235");
      await cmd(`MAIL FROM:<${cfg.user}>`, "250");
      await cmd(`RCPT TO:<${cfg.to}>`, "25");
      await cmd("DATA", "354");
      await cmd(msg.replace(/^\./gm, "..") + "\r\n.", "250");
      await cmd("QUIT", "221").catch(() => {});
    }, timeoutMs);
    console.log(`[mail] sent: ${subject}`);
    return { sent: true };
  } catch (e) {
    console.error(`[mail] failed: ${String(e.message).replace(cfg.pass, "***")}`);
    return { sent: false, reason: String(e.message).replace(cfg.pass, "***").slice(0, 300) };
  }
}
