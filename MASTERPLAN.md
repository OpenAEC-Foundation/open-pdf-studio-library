# MASTERPLAN — Wereldwijde bibliotheken voor Open PDF Studio

> Status: levend document. Laatste herziening: 2026-07-12.

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

Formaat en tekenrichtlijnen: zie `docs/data-format.md`. Het parametrische
catalogus-formaat (`parametric.json`, eerste vorm: `steel-sections` met
maatgedreven profielfamilies) is gedefinieerd en uitgerold over alle tien
staal-collecties (EN/AISC/VK/JIS/GB/IS 808/AS-NZS/GOST/KS/W-serie, 39
families, 427 maten); de app rendert doorsnede/boven-/zijaanzicht op ware
grootte uit de tabel. De platte SVG's blijven als fallback bestaan.
De `*-drafting-parametric`-sets wachten nog op hun eigen (tweede)
parametrische vorm.

## 3. Wave-overzicht

| Wave | Landen | Rationale |
|---|---|---|
| 1 | 🇺🇸 VS · 🇳🇱 NL · 🇩🇪 DE · 🇬🇧 VK | VS: hoog gebruik in statistieken. NL: bestaande content, referentie-land. DE/VK: grootste Europese bouwmarkten. |
| 2 | 🇫🇷 FR · 🇮🇹 IT · 🇪🇸 ES · 🇵🇱 PL · 🇧🇪 BE · 🇦🇹 AT · 🇨🇭 CH · 🇸🇪 SE · 🇳🇴 NO · 🇩🇰 DK · 🇫🇮 FI | Grote/middelgrote EU-markten; hoog hergebruik van de EN/ISO-laag. |
| 3 | 🇵🇹 PT · 🇮🇪 IE · 🇨🇿 CZ · 🇸🇰 SK · 🇭🇺 HU · 🇷🇴 RO · 🇧🇬 BG · 🇬🇷 GR · 🇭🇷 HR · 🇸🇮 SI · 🇪🇪 EE · 🇱🇻 LV · 🇱🇹 LT · 🇱🇺 LU | Rest van Europa; vrijwel volledig hergebruik + dunne nationale laag. |
| 4 | 🇨🇦 CA · 🇦🇺 AU · 🇳🇿 NZ · 🇯🇵 JP · 🇰🇷 KR · 🇨🇳 CN · 🇮🇳 IN · 🇧🇷 BR · 🇲🇽 MX · 🇹🇷 TR · 🇮🇱 IL · Golfregio | Anglosfeer hergebruikt VS/VK-collecties; daarna Azië, Latijns-Amerika, Midden-Oosten. |

> Waves beschrijven de geplande volgorde, maar landen kunnen eerder instappen:
> stempelsets (taalzeker, snel accuraat) gaan per land direct naar
> `available`; nationale symboolsets blijven `planned` tot review door iemand
> met marktkennis. Actuele status per collectie: `index.json` en de
> coverage-tabel in de README.

## 4. Gedeeld fundament (bouwen vóór/tijdens Wave 1)

| Collectie | Inhoud | Hergebruikt door |
|---|---|---|
| `iso7010-safety` | Veiligheidssignalering ISO 7010 (vluchtwegen, brandbestrijding, verbod/gebod/waarschuwing) — beschikbaar (v1.0.0, kernset 59 symbolen in de vijf vormcategorieën) | Alle landen behalve VS (VS gebruikt eigen conventies) |
| `en-steel-profiles` | Europese staalprofielen: doorsneden (HEA/HEB/HEM, IPE, UPN, hoekstaal, T, kokers, buis, plaat) + aanzichten — beschikbaar (v1.3.0, 17 symbolen — echte tabelgeometrie, fillets, hartlijnen; aanzichten op echte verhouding) + parametrische maatcatalogus v1.4.0 (steel-sections: HEA/HEB/HEM/IPE/UPN/L/T/SHS-RHS/CHS, 136 maten) | Alle Europese landen |
| `common-material-hatches` | Materiaal-arceringen (beton, metselwerk, isolatie, hout, staal, grond) — beschikbaar (v1.0.0, 12 patronen in het line-family-formaat van de app); renvooi-templates volgen als apart type | Wereldwijd |
| `common-north-arrows` | Noordpijlen (beschikbaar — eerste bewijs van de pipeline) | Wereldwijd |

## 5. Wave 1 — uitwerking per land

### 5.1 🇺🇸 Verenigde Staten (hoogste prioriteit nieuwe content)

De VS is een eigen normwereld: imperial units, eigen symboolconventies, eigen
profielen en papierformaten. Hergebruik van de EN/ISO-laag is beperkt (± 20%).

| Collectie | Inhoud | Status |
|---|---|---|
| `nfpa170-fire` | Brandveiligheidssymbolen volgens NFPA 170 (detectie, alarmering, blussing, egress) — zelf hertekend | beschikbaar (v1.0.0, 31 symbolen) |
| `us-drafting-parametric` | Grid bubbles, elevation datums (ft-in), section/detail markers, rebar callouts (`#4 @ 12" o.c.`) | gepland |
| `us-stamps` | APPROVED / REJECTED / REVISED / FOR CONSTRUCTION / NOT FOR CONSTRUCTION / PRELIMINARY / DRAFT | beschikbaar (v1.0.0, 16 stempels) |
| `aisc-steel-shapes` | AISC-symbolen: doorsneden (W, S, HP, C, L, WT, HSS, buis, plaat) + aanzichten + parametrische maatcatalogus v1.4.0 (W/S/C/L/HSS, 46 maten) | beschikbaar (v1.3.0, 17 symbolen — echte tabelgeometrie, fillets, hartlijnen; aanzichten op echte verhouding) |
| `us-wall-types` | Wandtypen in plattegrond: stud walls, CMU, brick veneer, beton, 1-HR/2-HR rated, shaft wall | beschikbaar (v1.0.0, 8 wandtypen) |
| `common-material-hatches` | + Amerikaanse arceringsvarianten waar afwijkend | gedeeld |
| `common-north-arrows` | — | beschikbaar |

Aandachtspunten: ANSI- en ARCH-papierformaten voor legenda-templates;
deur-/raamsymboliek en elektrasymbolen op Amerikaanse plattegronden wijken af
van de Europese — aparte research-stap in de productie-checklist.

### 5.2 🇳🇱 Nederland (referentie-land, content bestaat al in de app)

| Collectie | Inhoud | Status |
|---|---|---|
| `nen1414-fire` | NEN 1414-symbolen — kernset zelf getekend in SVG; volledige set (± 180, PNG in de app) migreert stapsgewijs | beschikbaar (v1.0.0, 32 kernsymbolen) |
| `nl-wall-types` | Wandtypen in plattegrond: metselwerk, kalkzandsteen, (gewapend) beton, cellenbeton, HSB, metal stud, WBDBO 30/60, schacht | beschikbaar (v1.0.0, 10 wandtypen) |
| `nl-drafting-parametric` | Stramienen, peilmaten, wapening, NL-staalnotatie, vloertypen, elektra-renvooi | gepland (migratie; wacht op parametrisch formaat) |
| `nl-stamps` | GOEDGEKEURD / AFGEKEURD / GEZIEN / VOOR UITVOERING / CONCEPT / REVISIETEKENING | beschikbaar (v1.0.0, 12 stempels) |
| `iso7010-safety` · `en-steel-profiles` · `common-*` | — | gedeeld |

### 5.3 🇩🇪 Duitsland

Hergebruik ± 60% (ISO/EN-laag). Nationale laag:

| Collectie | Inhoud | Status |
|---|---|---|
| `din14034-fire` | Brandveiligheidssymbolen voor Feuerwehrpläne (DIN 14034-6, DIN 14095) | beschikbaar (v1.0.0, 31 symbolen) |
| `de-drafting-parametric` | Achsen, Höhenkoten (DIN 406-notatie), Bewehrung-callouts | gepland (wacht op parametrisch formaat) |
| `de-stamps` | GEPRÜFT / FREIGEGEBEN / ZUR GENEHMIGUNG / ENTWURF / VORABZUG | beschikbaar (v1.0.0, 13 stempels) |
| `de-wall-types` | Wandtypen in Grundriss (DIN 1356-schraffuur): Mauerwerk, Stahlbeton, Trockenbau, Brandwand F30/F90, Schacht | beschikbaar (v1.0.0, 9 wandtypen) |

### 5.4 🇬🇧 Verenigd Koninkrijk

Hergebruik ± 50%. VK is metrisch maar heeft eigen staalprofielen en de
ISO 19650-statuscodes zijn er de facto verplicht op tekeningen.

| Collectie | Inhoud | Status |
|---|---|---|
| `uk-fire-symbols` | Brandveiligheidssymbolen volgens Britse tekenconventies (BS-reeks) | beschikbaar (v1.0.0, 26 symbolen) |
| `uk-steel-sections` | Doorsneden (UB, UC, PFC, RSA, T, kokers/buis) + aanzichten + parametrische maatcatalogus v1.4.0 (UB/UC/PFC/UKA, 45 maten) | beschikbaar (v1.3.0, 15 symbolen — echte tabelgeometrie, fillets, hartlijnen; aanzichten op echte verhouding) |
| `uk-wall-types` | Wandtypen in plattegrond: brickwork, blockwork, cavity wall, stud walls, 30/60 min fire-rated | beschikbaar (v1.0.0, 8 wandtypen) |
| `uk-stamps` | Suitability-codes (S0–S4) + APPROVED/DRAFT-set | beschikbaar (v1.0.0, 14 stempels) |
| `uk-drafting-parametric` | Grid references, levels, section markers | gepland (wacht op parametrisch formaat) |

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
| 🇦🇺 AU / 🇳🇿 NZ | AS/NZS-staalprofielen (beschikbaar, 15 symbolen); verder VK-achtig |
| 🇯🇵 JP | JIS-symboliek — eigen productieronde; JIS-staalprofielen beschikbaar |
| 🇰🇷 KR | KS-symboliek; KS-staalprofielen beschikbaar |
| 🇨🇳 CN | GB-symboliek; GB-staalprofielen beschikbaar |
| 🇮🇳 IN | IS-symboliek; Engelstalige stempels; IS 808-staalprofielen beschikbaar |
| 🇧🇷 BR | ABNT-conventies; Portugese stempels; W-serie-staalprofielen beschikbaar |
| 🇲🇽 MX + LATAM | Spaanse stempels; mix VS/EU-conventies |
| 🇹🇷 Türkiye | CEN-lid: volledige hergebruik EN/ISO-laag + Turkse stempels |
| 🇷🇺 Rusland | GOST/SPDS-documentatiepraktijk; Cyrillische stempels; GOST-staalprofielen beschikbaar |
| 🇿🇦 Zuid-Afrika | Engelstalige stempels; SANS-symboliek te researchen; eerste Afrikaanse land |
| 🇮🇱 Israël | EU/VS-mix; Hebreeuwse stempels (RTL); Europese staalprofielen gangbaar |
| Golfregio | VS/VK-mix; Engels + Arabisch |

## 9. Toekomstige sectoren (geschetst, niet uitgewerkt)

| Sector | Kern-normen | Status |
|---|---|---|
| `mep` (installatietechniek) | Nationale klimaat/sanitair-symboolreeksen | Eerste collectie beschikbaar: `common-hvac-symbols` (v1.0.0, 11) — in elk land-manifest |
| `electrical` | IEC 60617 (internationaal) + nationale reeksen | `iec60617-electrical` (v1.1.0, 36 zelf getekende kernsymbolen, afgestemd op IEC 60617:2026 DB) in elk land-manifest én in de AEC-pakketten; tekstvrije nationale lagen voor NL (19), VS (19), JP (14), VK (13) en AU (13). Alle 114 SVG's komen uit één semantische generator met geometrische qualifiers. |
| `process` (industrie/P&ID) | ISO 10628; in de VS de ISA-symboolreeks | Eerste collectie beschikbaar: `iso10628-pid` (v1.0.0, 14) — in elk land-manifest |
| `infra` (GWW) | Nationale wegontwerp/riolering-symboolreeksen | Sterk nationaal bepaald — nog niet gestart |

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
