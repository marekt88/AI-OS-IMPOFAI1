---
title: Mailboxy pre printingshop.sk
type: email
private: true
updated: 2026-07-29
created: 2026-07-28
tags: email, imagewell, printingshop, n8n
---

# Mailboxy pre printingshop.sk

Vlákno s Martinom Zacharidesom, 28. a 29.7.2026. Projekt [[printingshop]], klient [[imagewell]].

## O čo ide

Klient vygeneroval mailboxy pre projekt Printing Shop a poslal ich v zazipovanej prílohe. Heslá poslal osobitne cez WhatsApp, teda mimo mailu. Nasledujúci deň poslal prílohu znova s poznámkou, že to overil.

## Dve adresy a načo sú

| Adresa | Účel |
|---|---|
| `printingshop@imagewell.eu` | záložná, chodia na ňu kópie všetkých dát k objednávke pre prípad chyby v n8n workflowoch |
| `objednavky@imagewell.eu` | voliteľná notifikácia o novej objednávke zapísanej do FileMakeru, aby o nej vedel obchod a výroba |

Druhú adresu klient označil za voliteľnú, lebo úspešná objednávka sa aj tak objaví vo FileMakeri.

## Čo z toho vyplýva

Klient sám ráta s tým, že n8n workflow môže zlyhať, a preto si vypýtal kópiu dát mimo neho. Je to rozumné, ale neúplné: nikde nie je napísané, kto tú záložnú schránku sleduje a v akom čase na ňu reaguje. Bez toho je to archív zlyhaní, nie záchrana objednávky.

## Ďalší krok

Dohodnúť, kto kontroluje záložnú schránku a ako rýchlo. Ideálne to nahradiť alertom, ktorý sa ozve sám.

---
Zdroj: Gmail, vlákno `19fa919a9ca91cfc`, odosielateľ `zacharides@imagewell.eu`. Prílohy s heslami sa neprepisujú.
