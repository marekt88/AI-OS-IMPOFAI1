---
title: Klienti a projekty
type: index
private: true
---

# Klienti a projekty

Navigačná stránka. Každý klient má vlastnú stránku, pod ňou projekty, pod projektmi maily, meetingy a WhatsApp.

Táto stránka sa v 3D brainne nekreslí, je len v inventári. Kreslia sa klienti, projekty a jednotlivé záznamy.

## Štruktúra

```
context/klienti/
  <klient>.md              profil klienta, kontakty, stav
  <klient>/
    <projekt>.md           kontext projektu
    emails/<dátum>__<téma>.md
    meetings/<dátum>__<téma>.md
    whatsapp/<dátum>__<téma>.md
```

## Aktívni klienti

- [[imagewell]] — ImageWell / Zacharides, tri projekty
- [[startfin]] — StartFin
- [[bridgit]] — Bridgit, partnerstvo pri stavbe platformy
- [[dubove-parkety]] — Dubové Parkety

V ClickUpe sú ďalšie priečinky bez doteraz nájdenej mailovej stopy: Plus Reality, Lestero, Gartner, 1plus1, Colorlak. Smerovanie pre ne je pripravené v `data/klienti/routing.json`, čaká na prvý mail alebo hovor.

## Pravidlá

Všetko pod `context/klienti/` má vo frontmatteri `private: true`. Pred zdieľaním repozitára spusti `node scripts/private-scan.mjs`.

Do týchto súborov **nikdy** nejde heslo, API kľúč ani doslovné telo mailu. Zapisuje sa zistenie a odkaz na zdroj.
