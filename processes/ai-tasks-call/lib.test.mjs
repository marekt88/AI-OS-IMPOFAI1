import test from "node:test";
import assert from "node:assert/strict";
import { answerComment, callVariables, kindOf, pendingItem, speakable } from "./lib.mjs";

const task = { key: "IMP-1563", name: "Pridať do pätičky verejnej stránky krátky text", preview_url: "https://x" };
const c = (id, at, who, body) => ({ id, created_at: at, actor_type: who === "user" ? "user" : "agent", agent_name: who === "user" ? null : who, body });

test("pending only when the newest comment is the worker's and not announced yet", () => {
  const worker = c("c2", "2026-10-22T10:00:00Z", "Kapsa", "**Otázky pred začatím**\n1. Aký text?");
  assert.equal(pendingItem(task, [c("c1", "2026-10-22T09:00:00Z", "user", "ano"), worker], {}).kind, "questions");
  assert.equal(pendingItem(task, [worker], { "IMP-1563": "c2" }), null);
  assert.equal(pendingItem(task, [worker, c("c3", "2026-10-22T11:00:00Z", "user", "deploy")], {}), null);
  assert.equal(pendingItem(task, [c("c4", "2026-10-22T11:00:00Z", "Claude code -PM", "x")], {}), null);
});

test("kinds and speakable text (no links, code, keys)", () => {
  assert.equal(kindOf("**Preview je pripravený**"), "preview");
  assert.equal(kindOf("**Potrebujem schválenie:** prune"), "approval");
  const s = speakable("Vetva ai/IMP-1563, preview https://imp-1563.x.sslip.io\n```\nerror\n```");
  assert.doesNotMatch(s, /IMP-1563|https|```/);
});

test("call variables name tasks, never keys", () => {
  const v = callVariables([{ key: "IMP-1563", name: task.name, kind: "preview", text: "hotovo" }]);
  assert.match(v.call_content, /Pridať do pätičky/);
  assert.doesNotMatch(JSON.stringify(v), /IMP-1563/);
});

const tr = [
  { role: "agent", message: "Takže úlohu Pridať do pätičky verejnej stránky krátky text nasadiť do produkcie, platí?" },
  { role: "user", message: "Áno." },
  { role: "agent", message: "A pri druhej úlohe?" },
  { role: "user", message: "Tam ešte zmeň farbu tlačidla na modrú a nasaď to potom." },
];

test("deploy only when confirmed: own words or plain yes to a read-back with name + action", () => {
  const ok = answerComment({ task_key: "IMP-1563", decision: "deploy", quote: "Áno.", comment: "nasadiť" }, [task], tr, "22.10. 10:00");
  assert.match(ok.body, /^deploy/);
  const weak = answerComment({ task_key: "IMP-1563", decision: "deploy", quote: "A pri druhej", comment: "?" }, [task], tr, "x");
  assert.equal(weak.ok, false); // quote is the agent's words, not Marek's
  const other = { key: "IMP-1600", name: "Zmeniť farbu tlačidla" };
  const changes = answerComment({ task_key: "IMP-1600", decision: "changes", quote: "zmeň farbu tlačidla na modrú", comment: "Zmeň farbu tlačidla na modrú." }, [task, other], tr, "x");
  assert.match(changes.body, /Odpoveď z hlasového hovoru/);
  assert.doesNotMatch(changes.body, /^deploy/);
});

test("deploy said without a clear read-back is downgraded (no deploy keyword at the start)", () => {
  const t2 = [{ role: "agent", message: "Ako to vyzerá?" }, { role: "user", message: "Áno." }];
  const r = answerComment({ task_key: "IMP-1563", decision: "deploy", quote: "Áno.", comment: "asi áno" }, [task], t2, "x");
  assert.equal(r.downgraded, true);
  assert.doesNotMatch(r.body, /^deploy/);
});

import { newTaskCheck } from "./lib.mjs";
test("new task only after a read-back with its name and a plain yes, or Marek's own words", () => {
  const t = [
    { role: "agent", message: "Vytvorím v AI tasks novú úlohu Export denníka do PDF: tlačidlo, ktoré stiahne denník projektu. Platí?" },
    { role: "user", message: "Áno." },
    { role: "user", message: "A ešte vytvor úlohu na notifikácie e-mailom pri nasadení." },
  ];
  assert.equal(newTaskCheck({ name: "Export denníka do PDF", prompt: "x", quote: "Áno." }, t).ok, true);
  assert.equal(newTaskCheck({ name: "Notifikácie e-mailom pri nasadení", prompt: "x", quote: "vytvor úlohu na notifikácie e-mailom pri nasadení" }, t).ok, true);
  assert.equal(newTaskCheck({ name: "Úplne iná úloha o fakturácii", prompt: "x", quote: "Áno." }, t).ok, false);
  assert.equal(newTaskCheck({ name: "Export denníka do PDF", prompt: "", quote: "Áno." }, t).ok, false);
});
