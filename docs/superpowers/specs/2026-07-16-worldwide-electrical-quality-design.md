# Worldwide Electrical Drawing Quality Design

## Doel

De elektrische bibliotheek wordt een wereldwijde, onderhoudbare tekenlaag in
plaats van zes los getekende SVG-sets. Eén semantische generator rendert de
internationale kern en de bestaande nationale overlays met vaste lijnprofielen,
tekstvrije geometrie en controleerbare betekenis.

## Gekozen aanpak

De release gebruikt een gedeelde geometrie-engine met nationale varianten.
Ieder symbool heeft een semantisch type, bijvoorbeeld `socket-earthed`,
`switch-two-way`, `distribution-board` of `motor-three-phase`. De renderer
combineert dat type met een tekenprofiel (`iec`, `nl`, `us`, `uk`, `jp` of
`au`). Bestandsnamen en metadata dragen de identiteit; letters en cijfers
worden niet in de SVG-geometrie ingebakken.

Een volledige reproductie van IEC 60617 valt buiten scope. De actuele
IEC 60617:2026-database bevat meer dan 1.500 auteursrechtelijk beheerde
symbolen. Deze repository levert een zelf getekende, beperkte kern voor
installatieplannen en schema's, met een expliciete verwijzing naar de officiële
normbron en zonder conformiteitsclaim voor de volledige database.

## Reikwijdte

### Bestaande collecties

- `iec60617-electrical`: internationale basis voor ieder land.
- `nl-electrical`: Nederlandse installatie- en renvooiconventies.
- `us-electrical`: Amerikaanse architectuurplattegrondconventies.
- `uk-electrical`: Britse architectuurplattegrondconventies.
- `jp-electrical`: Japanse plattegrondconventies.
- `au-electrical`: Australische plattegrondconventies.

Alle 98 bestaande SVG's worden opnieuw gegenereerd. De internationale kern
groeit daarnaast van 20 naar 36 bestanden met:

- `battery`, `circuit-breaker`, `earth`, `emergency-light`;
- `fire-alarm-call-point`, `fused-switch`, `generator`, `heat-detector`;
- `isolator`, `motor-single-phase`, `motor-three-phase`;
- `residual-current-device`, `siren`, `smoke-detector`;
- `transformer` en `visual-alarm-device`.

## Geometrisch contract

- Iedere SVG gebruikt `viewBox="0 0 64 64"`.
- Hoofdcontouren gebruiken lijngewicht `1.6`; details `0.8`; hulplijnen `0.7`.
- Lijnen gebruiken afgeronde eindes en verbindingen waar dat technisch past.
- Symboolgeometrie bevat geen `<text>`; toegankelijke namen staan in `<title>`
  en `<desc>`.
- Varianten die vroeger alleen met een letter of cijfer verschilden krijgen
  een geometrische qualifier: extra contacten, aardstreep, test/reset-markers,
  poolmarkeringen, beschermingsring of functiepunt.
- Alle expliciete coördinaten blijven tussen 4 en 60, zodat lijnen niet door de
  viewBox worden afgesneden.

## Generator en broncontract

`scripts/electrical-symbols.mjs` bevat:

- een expliciete lijst bestanden per collectie;
- classificatie van bestandsnaam naar semantisch type en variant;
- afzonderlijke kleine renderfuncties voor aansluitpunten, schakelaars,
  verlichting, verdeling, detectie, communicatie en machines;
- `generateElectricalSymbols(root)` voor de volledige in-memory output;
- een schrijvende modus en `--check` voor byte-identieke reproduceerbaarheid.

Een expliciete bestandslijst voorkomt dat een verwijderd of vergeten symbool
stil uit de gegenereerde set verdwijnt. Onbekende classificaties zijn een harde
fout.

## Kwaliteitsgate

`scripts/drawing-quality.mjs` wordt uitgebreid met elektrische controles:

- veilige SVG-policy;
- vaste viewBox;
- geen geometrische tekst;
- aanwezigheid van hoofd- en detaillijnprofielen;
- begrensde expliciete coördinaten;
- byte-identieke generatoroutput.

CI voert `check-electrical` uit via `check-drawings`. Unit tests bewijzen zowel
de semantische classificatie als onderscheid tussen belangrijke varianten,
waaronder enkel/dubbel stopcontact, geaard stopcontact, 1-/2-/3-/4-wegschakelaar
en enkel-/driefasenmotor.

## Metadata en documentatie

- De zes gewijzigde collecties krijgen versie `1.1.0`.
- `iec60617-electrical` krijgt `standardEdition: "2026 DB"` en een officiële
  IEC-referentie.
- README en `MASTERPLAN.md` noemen de 36-delige internationale kern, de
  nationale overlays en het tekstvrije tekencontract.
- README-previews en `index.json` worden opnieuw gegenereerd.

## Acceptatiecriteria

- 114 elektrische SVG's worden deterministisch gegenereerd.
- Geen van die SVG's bevat `<text>`.
- Alle zes collecties slagen voor schema-, veiligheids- en tekenkwaliteitstests.
- De 41 bestaande landen houden minimaal de internationale kern in hun
  electrical-sector.
- Index en README-media zijn actueel en GitHub Actions is groen.

## Buiten scope

- Een betaalde normdatabase kopiëren of volledige normconformiteit claimen.
- Nieuwe nationale overlays zonder aantoonbare afwijkende marktconventie.
- Elektrische berekeningen, kabeldimensionering of installatieregels.
- Integratie van de renderer in de desktopapp.

