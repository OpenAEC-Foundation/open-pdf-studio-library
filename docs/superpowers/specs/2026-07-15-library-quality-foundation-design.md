# Library Quality Foundation Design

**Datum:** 2026-07-15  
**Status:** goedgekeurd ontwerp  
**Doelrelease:** kwaliteitsfundament vóór de visuele revisie

## 1. Doel

Deze release maakt de bibliotheekcontracten betrouwbaar, maakt bijdragen met
SVG-content veilig, voorkomt stille cachefouten door vergeten versiebumps en
zorgt dat gegenereerde index- en previewbestanden aantoonbaar actueel zijn.
De bestaande collectie- en landenstructuur blijft achterwaarts compatibel.

De daaropvolgende visuele release gebruikt dit fundament voor echte
staalcurves, parametrische aanzichten, losse symboolmetadata, uniforme
tekenprofielen, verbeterde wandarceringen en visuele regressietests.

## 2. Scope

### In scope

- `index.json` valideren tegen een actueel publiek schema.
- Veilige, parsergebaseerde SVG-validatie met een element- en
  attribuut-allowlist.
- XML-escaping voor alle dynamische tekst in README-previews.
- Een deterministische `--check`-modus voor README-media.
- Verplichte semver-verhoging bij wijzigingen aan collectie-inhoud.
- SHA-256-integriteitsinformatie voor consumeerbare collectiebestanden.
- Licentie, beschrijving en optionele provenance/reviewmetadata doorgeven aan
  de wereldindex.
- CI uitbreiden met de nieuwe contract- en generatiecontroles.
- Onjuiste coverage-claims in de README corrigeren.

### Buiten scope

- Bestaande SVG-geometrie opnieuw tekenen.
- Alle symbolen direct van gelokaliseerde itemmetadata voorzien.
- Nieuwe landen, sectoren of collecties toevoegen.
- Wijzigingen in de consumerende desktopapp.
- Een netwerkservice of database introduceren.

## 3. Compatibiliteitsregels

- `index.json.formatVersion` blijft `1` omdat bestaande velden niet worden
  verwijderd of van betekenis veranderen.
- `files` blijft een array van relatieve bestandspaden.
- Nieuwe indexvelden zijn additief: `license`, `description`, `review` en
  `integrity`.
- Bestaande `collection.json`-bestanden blijven geldig. Nieuwe provenance- en
  reviewvelden zijn optioneel.
- Alle paden in `files` en `integrity` zijn relatief aan het bestaande
  collectiepad en gebruiken `/` als separator.

## 4. Publiek indexcontract

`schema/index.schema.json` wordt het afdwingbare contract. De validator
compileert dit schema en valideert zowel het gegenereerde object als het
gecommitteerde `index.json`.

Een collectie-entry krijgt deze vorm:

```json
{
  "name": { "en": "Example collection" },
  "description": { "en": "Example description" },
  "sector": "aec",
  "types": ["symbols"],
  "scope": "national",
  "status": "available",
  "version": "1.2.0",
  "license": "repository",
  "path": "collections/example/",
  "files": ["symbols/example.svg"],
  "integrity": {
    "symbols/example.svg": "sha256-<64 lowercase hex characters>"
  }
}
```

Voor iedere entry in `files` is precies één integriteitswaarde verplicht.
Bestanden die niet aan consumenten worden geleverd, zoals `collection.json`,
worden niet in `files` of `integrity` opgenomen.

## 5. Collection provenance en review

`schema/collection.schema.json` krijgt optionele velden:

```json
{
  "standardEdition": "2025",
  "jurisdiction": ["NL"],
  "references": [
    {
      "title": "Public standard overview",
      "identifier": "Example 123",
      "url": "https://example.org/overview"
    }
  ],
  "review": {
    "status": "market-verified",
    "verifiedAt": "2026-07-15",
    "verifiedBy": ["github-handle"]
  }
}
```

Toegestane reviewstatussen zijn `unreviewed`, `technical-reviewed` en
`market-verified`. Bij `market-verified` zijn een ISO-datum en ten minste één
reviewer verplicht. Een bestaande collectie zonder `review` doet geen
impliciete verificatieclaim. Referenties beschrijven alleen herkomst en
controleerbaarheid; repositorycontent wordt niet uit externe documenten
gekopieerd.

## 6. SVG-beveiligingsmodel

SVG wordt als onbetrouwbare bijdrage behandeld. De validator gebruikt een
standaardenconforme XML-parser en accepteert alleen statische tekengeometrie.

Toegestane elementen worden beperkt tot de elementen die de huidige corpus
nodig heeft, waaronder `svg`, `g`, `path`, `line`, `polyline`, `polygon`,
`rect`, `circle`, `ellipse`, `text`, `tspan`, `title` en `desc`.

Actieve of externe content wordt altijd geweigerd, waaronder:

- event-attributen zoals `onload` en `onclick`;
- `script`, `foreignObject`, `image`, `iframe`, `object` en `embed`;
- animatie-elementen;
- `href`, `xlink:href`, `javascript:`, `data:` en externe `url(...)`-waarden;
- `DOCTYPE` en entiteitsdeclaraties;
- onbekende elementen en onbekende attributen.

De bestaande geometrische en presentatieattributen worden expliciet
geallowlist. De structurele regels blijven gelden: één `svg`-root en
`viewBox="0 0 64 64"`.

## 7. Veilige previewgeneratie

`scripts/build-readme-media.mjs` gebruikt één centrale `escapeXmlText()`-
functie voor bestandslabels, collectienamen en stempeltekst. Het script bouwt
alle output eerst in geheugen op.

Zonder argumenten schrijft het script de verwachte mediabestanden. Met
`--check` vergelijkt het byte-voor-byte met `docs/media/`, rapporteert het
ontbrekende, afwijkende en verweesde gegenereerde bestanden en schrijft het
niets.

## 8. Versiecontrole

Een nieuw script vergelijkt de huidige tree met een opgegeven Git-basisref.
Voor iedere bestaande collectie met gewijzigde consumeerbare content of
gewijzigde publieke metadata moet de semverwaarde strikt hoger zijn dan in de
basisref. Nieuwe collecties zijn geldig met hun initiële versie.

De vergelijking gebruikt numerieke semversegmenten; lexicografische
vergelijking is niet toegestaan. Het script geeft per overtreding de
collectie-id, oude versie en huidige versie terug en eindigt met exitcode `1`.

In pull requests gebruikt CI de basis-SHA van de pull request. Bij pushes
wordt de voorgaande commit gebruikt wanneer die beschikbaar is.

## 9. CI en foutafhandeling

De workflow krijgt minimaal leesrechten, een volledige Git-history voor de
versiecontrole en Node-dependencycaching. De kwaliteitsgate voert uit:

1. `npm ci`;
2. unit- en integriteitstests;
3. collectie-, landen-, content- en indexschemavalidatie;
4. controle van de gegenereerde wereldindex;
5. controle van gegenereerde README-media;
6. collectieversiecontrole wanneer een bruikbare basis-SHA beschikbaar is.

Alle scripts verzamelen zoveel mogelijk fouten in één run en tonen
repositoryrelatieve paden. Geen controles wijzigen bestanden wanneer ze in
checkmodus draaien.

## 10. Teststrategie

Iedere gedragswijziging volgt red-green-refactor. Minimaal worden regressies
vastgelegd voor:

- de huidige `files`-afwijking tussen index en schema;
- ontbrekende of extra integriteitswaarden;
- `onload`, `javascript:`, `foreignObject`, actieve elementen, entiteiten en
  onbekende attributen in SVG;
- geldige bestaande SVG-geometrie;
- XML-escaping van `&`, `<`, `>` en aanhalingstekens;
- previewverschillen en verweesde previewbestanden in `--check`-modus;
- gewijzigde collectie-inhoud zonder versiebumps;
- geldige major-, minor- en patchverhogingen;
- nieuwe collecties zonder basisversie;
- deterministische indexchecksums.

De volledige bestaande suite moet groen blijven.

## 11. Documentatie

`docs/data-format.md` beschrijft de nieuwe indexvelden, provenancevelden,
reviewstatussen, veiligheidsregels en integriteitscontrole. De bijdragegids
legt uit wanneer een versie moet worden verhoogd.

De README verandert `all of Europe` in een nauwkeurige omschrijving van de
EU-dekking plus geselecteerde overige markten. `complete national symbol
sets` wordt vervangen door `production-ready core collections` zolang
uitbreiding van kernsets nog in het masterplan staat.

## 12. Acceptatiecriteria

De release is gereed wanneer:

- de huidige `index.json` geldig is volgens `schema/index.schema.json`;
- iedere downloadbare file een deterministische SHA-256-waarde heeft;
- alle bekende actieve SVG-testgevallen worden geweigerd;
- alle bestaande geldige SVG's blijven slagen;
- de previewgenerator veilig escaped en `--check` ondersteunt;
- versiecontrole aantoonbaar vergeten bumps blokkeert;
- README en formaatdocumentatie de werkelijke status beschrijven;
- alle tests, validatie- en generatiechecks zonder fouten eindigen.
