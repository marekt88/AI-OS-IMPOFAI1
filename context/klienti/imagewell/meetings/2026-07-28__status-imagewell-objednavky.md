---
title: Status ImageWell, objednávkový systém
type: meeting
private: true
updated: 2026-07-28
created: 2026-07-28
tags: meeting, imagewell
---

# Status ImageWell, objednávkový systém

Hovor 2026-07-28, 46 minút. Projekt [[printingshop]], klient [[imagewell]].

Účastníci: Marek Tóth, Martin Zacharides, Daniel Lokaj, Filip Haraj.

## Zistenia

- Objednávkový systém sa prepája na **FileMaker** a **Stripe**, aby spracovanie objednávky prešlo bez ručného zásahu.
- Filip predviedol **hlasového agenta**, ktorý overí zákazníka a spravuje objednávky. Dáta idú do **Supabase**.
- Dohodnutý **záložný plán pri zlyhaní systému** vrátane transakčného e-mailu. To je ten istý mechanizmus, ktorý Zacharides zriadil mailom 28.7., viď [[2026-07-28-mailboxy-printingshop]].
- Produktová stratégia e-shopu počíta s **rôznymi cenami pre registrovaných a neregistrovaných** zákazníkov.
- Fakturačné procesy medzi Stripe a FileMakerom treba zosúladiť, inak sa rozídu čísla.

## Záväzky

- Vyčistiť a spravovať dáta v Supabase
- Dohodnúť partnerskú firmu na testovanie projektu

---
Zdroj: Fireflies `01KYETS6JVXRFHHBM46GEXX672`, https://app.fireflies.ai/view/01KYETS6JVXRFHHBM46GEXX672
Zapísané zo summary, nie z doslovného prepisu. Termíny prehnané cez `data/klienti/korekcie.json`.
