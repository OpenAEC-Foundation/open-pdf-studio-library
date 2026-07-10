# Design: Open PDF Studio Library — wereldwijde bibliotheken

Datum: 2026-07-10
Status: goedgekeurd

## Doel

Deze repository wordt de wereldwijde content-bibliotheek voor Open PDF Studio:
symbolen, parametrische componenten, stempels en arceringen/legenda's, per land
en per sector geconsolideerd. Fase 1 werkt de sector AEC (bouw) volledig uit,
land-voor-land, grote markten eerst; overige sectoren worden op hoofdlijnen
geschetst voor latere fasen.

Deliverable van dit traject: een masterplan-document (MASTERPLAN.md) plus het
repo-skelet (schema's, mappenstructuur, validatie-tooling en de eerste
land-manifesten) zodat content-productie daarna land-voor-land kan starten.

## Kernmodel: collecties + land-manifesten

- **Collectie** = de eenheid van content. Elke collectie leeft precies één keer
  in `collections/<id>/` met een `collection.json` (metadata) en de content
  zelf. Voorbeelden: `iso7010-safety`, `nen1414-fire`, `nfpa170-fire`,
  `en-steel-profiles`, `aisc-steel-shapes`.
- **Land-manifest** = `countries/<iso2>.json`. Stelt per sector een
  geconsolideerd pakket samen door naar collecties te verwijzen. Gedeelde
  normen (ISO/EN) worden zo over tientallen landen hergebruikt zonder
  duplicatie, terwijl de gebruiker per land één compleet pakket ziet.
- **Wereldindex** = `index.json`, gegenereerd door tooling. Bevat
  regio's → landen → sectoren → collecties (met naam, vlag, aantallen,
  download-paden). Dit is het enige bestand dat de app hoeft op te halen;
  collecties worden daarna on-demand gedownload (GitHub raw/releases).

### Content-typen per collectie

1. **Symbolen** — statische SVG-stempels, stroke-based, `viewBox="0 0 64 64"`,
   conform de bestaande stijl in de app.
2. **Parametrische componenten** — verwijzingen naar template-ids in de app
   plus landspecifieke parameters (bijv. lokale staalprofieltabellen,
   notatieconventies voor stramienen/peilmaten/wapening).
3. **Stempels & annotatie-presets** — goedkeurings-, revisie- en
   status-stempels in de lokale taal en conventies.
4. **Arceringen & legenda's** — materiaal-arceringen en renvooi/legenda-
   templates volgens de lokale tekenstandaard.

Een collectie declareert welke typen zij bevat; een land-manifest mag
collecties van alle typen mengen.

## Repo-structuur

```
open-pdf-studio-library/
├── MASTERPLAN.md              # het masterplan (zie hieronder)
├── docs/
│   ├── data-format.md         # schema-uitleg + SVG-tekenrichtlijnen
│   └── contributing-content.md
├── schema/
│   ├── collection.schema.json
│   ├── country.schema.json
│   └── index.schema.json
├── collections/
│   └── <collection-id>/
│       ├── collection.json
│       ├── symbols/*.svg          # indien type: symbols
│       ├── parametric.json        # indien type: parametric
│       ├── stamps.json            # indien type: stamps
│       └── hatches.json           # indien type: hatches/legends
├── countries/
│   └── <iso2>.json
├── index.json                 # gegenereerd — niet met de hand bewerken
└── scripts/
    ├── validate.mjs           # schema- en verwijzings-validatie + SVG-checks
    └── build-index.mjs        # genereert index.json
```

CI (GitHub Action) draait `validate.mjs` en controleert dat `index.json`
actueel is.

## Masterplan-inhoud (MASTERPLAN.md)

Het masterplan bevat:

1. **Visie & einddoel** — elke gebruiker kiest regio + land + sector en krijgt
   een compleet, lokaal correct bibliotheekpakket.
2. **Wave-prioritering AEC** op marktomvang en gebruiksstatistieken:
   - **Wave 1:** VS (hoge prioriteit o.b.v. gebruiksstatistieken; eigen
     hoofdstuk), NL (bestaand — migreren als referentie-land), Duitsland, VK.
   - **Wave 2:** FR, IT, ES, PL, BE, AT, CH, SE, NO, DK, FI — grotendeels
     hergebruik van de gedeelde EN/ISO-laag plus dunne landspecifieke laag.
   - **Wave 3:** rest van Europa (PT, IE, CZ, HU, RO, GR, Baltische staten, …).
   - **Wave 4:** Anglosfeer buiten Europa (CA, AU, NZ — hergebruik VS/VK),
     daarna Azië, Latijns-Amerika, Midden-Oosten.
3. **Per land:** relevante tekennormen, benodigde collecties (nieuw vs.
   hergebruik), geschat hergebruikpercentage, productie-checklist
   (research → collectie-definitie → SVG-productie → review → manifest).
4. **VS-hoofdstuk:** imperial units, NFPA 170, gangbare Amerikaanse
   tekenconventies, AISC-staalprofielen (W-shapes), ANSI/ARCH-papierformaten,
   Engelstalige stempelset.
5. **Toekomstige sectoren (geschetst):** installatietechniek, elektrotechniek,
   procesindustrie/P&ID (ISO 10628), infra/GWW — met globale prioritering,
   zonder uitwerking per land.
6. **App-integratie (afhankelijkheid, buiten deze repo):** uitbreiding van de
   bestaande industrie/land-kiezer in de app naar regio → land → sector,
   lezend uit `index.json`, met on-demand download en lokale cache. Het
   bestaande filtermodel (categorie-metadata `industry`/`country`) blijft de
   basis.

## Juridische lijn

Alle symbolen worden zelf getekend naar de betekenis en het doel van de norm.
Er wordt nooit content uit normdocumenten gekopieerd (geen scans, geen
vector-extracties uit normbestanden). Normnamen en -nummers (NEN, ISO, DIN,
NFPA, …) noemen is toegestaan en gewenst voor vindbaarheid. Elke collectie
draagt een licentie-notitie die dit vastlegt.

## Migratie bestaande content

De bestaande NEN 1414- en NL-tekenwerk-content in de app wordt op termijn naar
deze repo gemigreerd als eerste collecties; NL fungeert als referentie-land
voor het dataformaat. De app blijft werken met gebundelde content totdat de
on-demand pipeline in de app is gebouwd.

## Testen & kwaliteit

- `scripts/validate.mjs`: JSON Schema-validatie van alle collecties,
  land-manifesten en de index; controle dat manifesten alleen naar bestaande
  collecties verwijzen; SVG-sanity-checks (parsebaar, viewBox, geen externe
  verwijzingen).
- CI draait validatie op elke push/PR.
- Reviewproces voor nieuwe collecties beschreven in
  `docs/contributing-content.md`.

## Buiten scope van dit traject

- Wijzigingen in de open-pdf-studio-app zelf (kiezer-UI, download-manager).
- Daadwerkelijke massaproductie van symbolen voor Wave 1-landen; wel worden
  NL en VS als eerste land-manifesten aangemaakt met de nu definieerbare
  collectie-verwijzingen als voorbeeld.
- Sector-uitwerking buiten AEC.
