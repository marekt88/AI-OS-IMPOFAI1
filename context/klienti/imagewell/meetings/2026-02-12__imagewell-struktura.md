---
title: ImageWell, štruktúra projektu
type: meeting
private: true
updated: 2026-02-12
created: 2026-02-12
tags: meeting, imagewell
---

# ImageWell, štruktúra projektu

Hovor 2026-02-12, 28 minút. Projekt [[printingshop]], klient [[imagewell]].

Účastníci: Marek Tóth.

## Zistenia

- Hlasový asistent rozpozná **registrovaného zákazníka** a dá mu prístup k histórii objednávok. Neregistrovaný dostane len základné informácie.
- Objednávka sa spracúva ako **JSON** a ukladá do Supabase.
- Denná synchronizácia z FileMakeru drží zákaznícke dáta aktuálne.
- E-mailová komunikácia sa automatizuje, ale **grafické prílohy schvaľuje človek** pred odoslaním.

## Poznámka

Ten posledný bod je dobrý vzor: automatizuje sa všetko okrem kroku, kde chyba stojí najviac.

---
Zdroj: Fireflies `01KH92BQATJH5GM156P2HPZ0JT`, https://app.fireflies.ai/view/01KH92BQATJH5GM156P2HPZ0JT
Zapísané zo summary, nie z doslovného prepisu. Termíny prehnané cez `data/klienti/korekcie.json`.
