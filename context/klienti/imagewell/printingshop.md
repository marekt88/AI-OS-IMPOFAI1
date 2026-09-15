---
title: printingshop
type: projekt
private: true
updated: 2026-08-25
tags: projekt, imagewell, eshop, n8n
---

# Printing Shop

E-shop `printingshop.sk` pre klienta [[imagewell]]. Príjem objednávok, ich spracovanie a zápis do výrobného systému.

ClickUp: `Clients > Zacharides > Eshop zacharides`, list `901516842219`.

## Ako to má fungovať

Objednávka príde cez e-shop, prejde n8n workflowom a zapíše sa do **FileMakeru**, aby o nej vedel obchod aj výroba. FileMaker dodáva DataSystem, kontakt Škurla.

Zacharides k tomu zriadil dve poistky:

- `printingshop@imagewell.eu` — záložná adresa, chodia na ňu kópie všetkých dát k objednávke pre prípad, že n8n workflow zlyhá
- `objednavky@imagewell.eu` — voliteľná notifikácia o novej objednávke zapísanej do FileMakeru

Prvá adresa je dôležitejšia. Je to priznanie, že workflow môže spadnúť a že bez kópie by sa objednávka stratila.

## Súvisiace systémy

| Systém | Na čo |
|---|---|
| n8n, self-hosted | spracovanie objednávky |
| FileMaker / DataSystem | výrobný a obchodný systém |
| SMSAPI | odosielanie SMS |
| printingshop.sk | e-shop, transakčné maily |

## Záznamy

- [[2026-07-28-mailboxy-printingshop]]
- [[2026-08-25-smsapi-pristup]]

## Otvorené

Nie je zapísané, čo sa stane, keď n8n spadne a kópia príde len na záložný mail. Kto ju spracuje ručne a v akom čase? Bez toho je záloha len archív, nie poistka.
