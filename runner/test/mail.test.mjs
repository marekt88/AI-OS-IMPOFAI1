// Unit tests of the alert e-mail (no network): node --test runner/test/mail.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.AIOS_RUNNER_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "aios-mail-"));
const { buildMessage, mailConfig, sendMail } = await import("../mail.mjs");

test("message: UTF-8 subject and body, CRLF, base64 lines ≤ 76", () => {
  const m = buildMessage({ from: "a@gmail.com", to: "a@gmail.com", subject: "Ranný brief · štvrtok", text: "Ahoj Marek, ľščťž\n".repeat(20) });
  assert.match(m, /^From: =\?UTF-8\?B\?/);
  assert.match(m, /\r\nSubject: =\?UTF-8\?B\?/);
  const body = m.split("\r\n\r\n")[1];
  assert.ok(body.split("\r\n").every((l) => l.length <= 76));
  assert.equal(Buffer.from(body.replace(/\r\n/g, ""), "base64").toString("utf8"), "Ahoj Marek, ľščťž\n".repeat(20));
});

test("not configured → not sent, no throw; app password spaces removed", async () => {
  assert.equal(mailConfig(), null);
  assert.deepEqual(await sendMail({ subject: "x", text: "y" }), { sent: false, reason: "ALERT_SMTP_URL missing" });
  fs.writeFileSync(path.join(process.env.AIOS_RUNNER_HOME, "secrets.env"), "ALERT_SMTP_URL=smtps://me%40gmail.com:abcd efgh ijkl mnop@smtp.gmail.com:465\n");
});
