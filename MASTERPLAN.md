# MASTERPLAN — Wereldwijde bibliotheken voor Open PDF Studio

> Status: levend document. Laatste herziening: 2026-07-10.

## 1. Visie

Elke gebruiker van Open PDF Studio kiest **regio → land → sector** en krijgt
een compleet, lokaal correct bibliotheekpakket: symbolen volgens de normen van
dat land, parametrische componenten met lokale profielen en notaties, stempels
in de eigen taal en arceringen/legenda's volgens de lokale tekenstandaard.

Fase 1 is de sector **AEC (bouw)**, wereldwijd, grote markten eerst. Overige
sectoren volgen daarna (hoofdstuk 9).

## 2. Hoe het werkt

- **Collectie** = content-eenheid, leeft één keer in `collections/<id>/`.
  Gedeelde normen (ISO/EN) worden over tientallen landen hergebruikt.
- **Land-manifest** = `countries/<iso2>.json`, stelt per sector een
  geconsolideerd pakket samen uit collecties.
- **Wereldindex** = `index.json` (gegenereerd), het enige bestand dat de app
  ophaalt; collecties worden on-demand gedownload.

Formaat en tekenrichtlijnen: zie `docs/data-format.md`.

## 3. Wave-overzicht

| Wave | Landen | Rationale |
|---|---|---|
| 1 | 🇺🇸 VS · 🇳🇱 NL · 🇩🇪 DE · 🇬🇧 VK | VS: hoog gebruik in statistieken. NL: bestaande content, referentie-land. DE/VK: grootste Europese bouwmarkten. |
| 2 | 🇫🇷 FR · 🇮🇹 IT · 🇪🇸 ES · 🇵🇱 PL · 🇧🇪 BE · 🇦🇹 AT · 🇨🇭 CH · 🇸🇪 SE · 🇳🇴 NO · 🇩🇰 DK · 🇫🇮 FI | Grote/middelgrote EU-markten; hoog hergebruik van de EN/ISO-laag. |
| 3 | 🇵🇹 PT · 🇮🇪 IE · 🇨🇿 CZ · 🇸🇰 SK · 🇭🇺 HU · 🇷🇴 RO · 🇧🇬 BG · 🇬🇷 GR · 🇭🇷 HR · 🇸🇮 SI · 🇪🇪 EE · 🇱🇻 LV · 🇱🇹 LT · 🇱🇺 LU | Rest van Europa; vrijwel volledig hergebruik + dunne nationale laag. |
| 4 | 🇨🇦 CA · 🇦🇺 AU · 🇳🇿 NZ · 🇯🇵 JP · 🇰🇷 KR · 🇨🇳 CN · 🇮🇳 IN · 🇧🇷 BR · 🇲🇽 MX · Golfregio | Anglosfeer hergebruikt VS/VK-collecties; daarna Azië, Latijns-Amerika, Midden-Oosten. |

## 4. Gedeeld fundament (bouwen vóór/tijdens Wave 1)

| Collectie | Inhoud | Hergebruikt door |
|---|---|---|
| `iso7010-safety` | Veiligheidssignalering ISO 7010 (vluchtwegen, brandbestrijding, verbod/gebod/waarschuwing) — kernset ± 60 symbolen | Alle landen behalve VS (VS gebruikt eigen conventies) |
| `en-steel-profiles` | Parametrische Europese staalprofielen (HEA/HEB/HEM, IPE, UNP, kokers, buizen) | Alle Europese landen |
| `common-material-hatches` | Materiaal-arceringen (beton, metselwerk, isolatie, hout, staal, grond) + renvooi-templates | Wereldwijd |
| `common-north-arrows` | Noordpijlen (beschikbaar — eerste bewijs van de pipeline) | Wereldwijd |

## 5. Wave 1 — uitwerking per land

### 5.1 🇺🇸 Verenigde Staten (hoogste prioriteit nieuwe content)

De VS is een eigen normwereld: imperial units, eigen symboolconventies, eigen
profielen en papierformaten. Hergebruik van de EN/ISO-laag is beperkt (± 20%).

| Collectie | Inhoud | Status |
|---|---|---|
| `nfpa170-fire` | Brandveiligheidssymbolen volgens NFPA 170 (detectie, alarmering, blussing, egress) — zelf hertekend | gepland |
| `us-drafting-parametric` | Grid bubbles, elevation datums (ft-in), section/detail markers, rebar callouts (`#4 @ 12" o.c.`) | gepland |
| `us-stamps` | APPROVED / REJECTED / REVISED / FOR CONSTRUCTION / NOT FOR CONSTRUCTION / PRELIMINARY / DRAFT | gepland |
| `aisc-steel-shapes` | Parametrische AISC-profielen: W, S, C, L, HSS | gepland |
| `common-material-hatches` | + Amerikaanse arceringsvarianten waar afwijkend | gedeeld |
| `common-north-arrows` | — | beschikbaar |

Aandachtspunten: ANSI- en ARCH-papierformaten voor legenda-templates;
deur-/raamsymboliek en elektrasymbolen op Amerikaanse plattegronden wijken af
van de Europese — aparte research-stap in de productie-checklist.

### 5.2 🇳🇱 Nederland (referentie-land, content bestaat al in de app)

| Collectie | Inhoud | Status |
|---|---|---|
| `nen1414-fire` | ± 180 symbolen NEN 1414 (migratie uit de app; PNG → her-tekenen naar SVG waar haalbaar) | gepland (migratie) |
| `nl-drafting-parametric` | Stramienen, peilmaten, wapening, NL-staalnotatie, vloertypen, elektra-renvooi | gepland (migratie) |
| `nl-stamps` | GOEDGEKEURD / AFGEKEURD / GEZIEN / VOOR UITVOERING / CONCEPT / TER GOEDKEURING | gepland |
| `iso7010-safety` · `en-steel-profiles` · `common-*` | — | gedeeld |

### 5.3 🇩🇪 Duitsland

Hergebruik ± 60% (ISO/EN-laag). Nationale laag:

| Collectie | Inhoud | Status |
|---|---|---|
| `din14034-fire` | Brandveiligheidssymbolen voor Feuerwehrpläne (DIN 14034-6, DIN 14095) | te definiëren in Wave-1-productie |
| `de-drafting-parametric` | Achsen, Höhenkoten (DIN 406-notatie), Bewehrung-callouts | idem |
| `de-stamps` | GEPRÜFT / FREIGEGEBEN / ZUR GENEHMIGUNG / ENTWURF / VORABZUG | idem |

### 5.4 🇬🇧 Verenigd Koninkrijk

Hergebruik ± 50%. VK is metrisch maar heeft eigen staalprofielen en de
ISO 19650-statuscodes zijn er de facto verplicht op tekeningen.

| Collectie | Inhoud | Status |
|---|---|---|
| `uk-fire-symbols` | Brandveiligheidssymbolen volgens Britse tekenconventies (BS-reeks) | te definiëren in Wave-1-productie |
| `uk-steel-sections` | Parametrisch: UB, UC, PFC, RSA | idem |
| `uk-stamps` | Suitability-codes (S0–S7, A-reeks) + APPROVED/DRAFT-set | idem |
| `uk-drafting-parametric` | Grid references, levels, section markers | idem |

## 6. Wave 2 — Europa breed

Elk Wave-2-land krijgt: de volledige gedeelde laag (`iso7010-safety`,
`en-steel-profiles`, `common-*`) + een dunne nationale laag van gemiddeld
2–3 collecties (nationale brandveiligheids-plansymbolen, stempels in de
landstaal, nationale notatie-conventies). Specifiek te researchen per land:

| Land | Nationale laag (verwacht) |
|---|---|
| 🇫🇷 FR | NF-plansymbolen brandveiligheid; tampons (VU / BON POUR EXÉCUTION / PROJET) |
| 🇮🇹 IT | UNI-conventies; timbri (APPROVATO / BOZZA / PER COSTRUZIONE) |
| 🇪🇸 ES | UNE-conventies; sellos (APROBADO / BORRADOR / PARA CONSTRUCCIÓN) |
| 🇵🇱 PL | PN-conventies; pieczątki (ZATWIERDZONO / PROJEKT) |
| 🇧🇪 BE | Hergebruik NL-collecties + NBN-check + tweetalige stempels (NL/FR) |
| 🇦🇹 AT | Hergebruik DE-collecties + ÖNORM-check |
| 🇨🇭 CH | Hergebruik DE-collecties + SIA-conventies + drietalige stempels (DE/FR/IT) |
| 🇸🇪🇳🇴🇩🇰🇫🇮 | SS/NS/DS/SFS-checks; stempels per taal; verder vrijwel volledig gedeelde laag |

## 7. Wave 3 — rest van Europa

PT, IE (hergebruik VK), CZ, SK, HU, RO, BG, GR, HR, SI, EE, LV, LT,
LU (hergebruik BE/FR/DE). Aanpak identiek aan Wave 2; verwacht hergebruik
70–90%. Productie kan grotendeels parallel omdat de gedeelde laag dan af is.

## 8. Wave 4 — buiten Europa

| Land/regio | Aanpak |
|---|---|
| 🇨🇦 Canada | VS-collecties + tweetalige stempels (EN/FR) + CSA-check |
| 🇦🇺 AU / 🇳🇿 NZ | AS/NZS-staalprofielen; verder VK-achtig |
| 🇯🇵 JP | JIS-symboliek — eigen productieronde |
| 🇰🇷 KR | KS-symboliek |
| 🇨🇳 CN | GB-symboliek |
| 🇮🇳 IN | IS-symboliek; Engelstalige stempels |
| 🇧🇷 BR | ABNT-conventies; Portugese stempels |
| 🇲🇽 MX + LATAM | Spaanse stempels; mix VS/EU-conventies |
| Golfregio | VS/VK-mix; Engels + Arabisch |

## 9. Toekomstige sectoren (geschetst, niet uitgewerkt)

| Sector | Kern-normen | Opmerking |
|---|---|---|
| `mep` (installatietechniek) | Nationale klimaat/sanitair-symboolreeksen | Grote overlap met AEC-doelgroep — eerste kandidaat |
| `electrical` | IEC 60617 (internationaal!) + nationale reeksen | IEC-laag is één keer bouwen, wereldwijd bruikbaar |
| `process` (industrie/P&ID) | ISO 10628; in de VS de ISA-symboolreeks | Aparte doelgroep, hoge symbooldichtheid |
| `infra` (GWW) | Nationale wegontwerp/riolering-symboolreeksen | Sterk nationaal bepaald |

Sector-ids liggen al vast in de schema's; een sector activeren = collecties
toevoegen + land-manifesten uitbreiden. Geen datamodel-wijziging nodig.

## 10. Productieproces per land (checklist)

1. **Research** — welke normen gelden, welke symbolen zijn gangbaar op
   tekeningen in dat land; bronnen: normoverzichten, publiek beschikbare
   voorbeeldtekeningen, marktkennis.
2. **Collectie-definitie** — `collection.json` (status `planned`) +
   symbolenlijst als issue in de repo-tracker.
3. **Productie** — SVG's zelf tekenen volgens `docs/data-format.md`
   (stroke-based, viewBox 64×64); parametrische componenten als parameterset
   op bestaande app-templates.
4. **Review** — check door iemand met marktkennis + `npm run validate`.
5. **Publicatie** — status → `available`, land-manifest bijwerken,
   `npm run build-index`, PR.

## 11. Juridische lijn

Alle symbolen worden **zelf getekend** naar de betekenis en het doel van de
norm. Nooit content uit normdocumenten kopiëren (geen scans, geen
vector-extracties uit normbestanden). Normnamen en -nummers noemen is
toegestaan en gewenst voor vindbaarheid. Elke collectie draagt een
licentie-notitie (`license`-veld).

## 12. App-integratie (afhankelijkheid, buiten deze repo)

De app (open-pdf-studio) heeft al een industrie/land-kiezer en een
filtermodel op categorie-metadata. Benodigde uitbreiding, als vervolgtraject
in die repo:

1. Regio → land → sector-kiezer die `index.json` van deze repo leest.
2. On-demand download van collecties (GitHub raw/releases) + lokale cache.
3. Import van collectie-formaten (symbols/parametric/stamps/hatches) in het
   bestaande palette-model.
4. Migratie: gebundelde NL-content vervangen door collecties uit deze repo.

## 13. Succes-metrieken

- Aantal landen met manifest / met ≥ 80% collecties `available`.
- Hergebruikgraad (gedeelde vs. nationale collecties per land).
- Download-statistieken per land/collectie zodra de app-integratie live is.
