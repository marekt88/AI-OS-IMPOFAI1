---
title: bridgit-platforma
type: projekt
private: true
updated: 2026-09-15
tags: projekt, bridgit, bigquery, erp
---

# Bridgit platforma

Stavba samotnej platformy pre [[bridgit]]. IMPOFAI tu vystupuje ako technický partner, nie dodávateľ.

## Čo platforma rieši

Problém, ktorý web pomenúva takto: „Účtovníctvo má účtovník. Bankové výpisy chodia do internet bankingu. Fakturácia je v jednom systéme, sklad v inom, ponuky v Exceli. Údaje sú síce všade, ale nikde dokopy."

Argument pre cenu: ľudský CFO stojí 60 až 100+ tisíc eur ročne.

## Rozpracované smery

Z intake Q2 vyplýva pripravovaný onboarding flow, ktorý zatiaľ nie je hotový:

- Ak má klient podporované ERP, ponúkne sa mu plán plus 10 dní zadarmo s 20 tokenmi a automaticky vytvorenými reportmi
- Ak ERP nemá, nahrá vlastné exportované dáta do BigQuery a agenti fungujú nad ním
- Ak nemá ani jedno, dostane demo organizáciu s vymyslenými dátami

Cenová kotva, ktorá k tomu padla: 20 bridgit tokenov stojí 8,70 €. **Na webe to nikde nie je a v `decisions/log.md` tiež nie**, takže to zatiaľ nie je rozhodnutá cenotvorba, len úvaha.

## Čo treba dokončiť

- vytváranie organizácie cez ERP
- nahrávanie vlastných dát a vytvorenie databázy v BigQuery
- MCP nad BigQuery a jeho pripojenie pre agentov
- sprievodca pre nového používateľa
- úvodná analýza dát a personalizované návrhy

## Prevádzka

Denný report o 06:00 hlási otvorené incidenty. Opakujú sa tri rodiny chýb: `chat_message_failed` (edge function wall-clock limit, abandoned worker), `chat_message_stuck` v streamingu aj desiatky hodín, a `Schema export not_found` pre dataset `1d452349`. Posledná sa opakuje od začiatku septembra a vyzerá skôr na konfiguráciu než na výpadok.

## Otvorené

Podľa intake Q3 Bridgit free-tier **nie je** medzi prioritami tohto kvartálu, je to backlog. Ale onboarding flow je najpodrobnejšie rozpísaná vec v celom intake. Buď je priorita zle napísaná, alebo sa robí niečo, čo nie je priorita.
