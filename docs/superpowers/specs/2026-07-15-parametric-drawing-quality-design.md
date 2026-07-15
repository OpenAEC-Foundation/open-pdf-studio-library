# Parametric Drawing Quality Design

## Doel

De staal- en wandsymbolen worden niet langer als losstaande handgetekende SVG's onderhouden. Deterministische generators bouwen alle fallback-symbolen opnieuw uit catalogusmaten en gedeelde tekenprofielen. Daardoor krijgen dezelfde vormen in elk land dezelfde technische tekenkwaliteit, terwijl nationale maatcatalogi behouden blijven.

## Reikwijdte

- Alle tien beschikbare parametrische staalcollecties.
- Alle vier beschikbare wandcollecties voor Nederland, de Verenigde Staten, Duitsland en het Verenigd Koninkrijk.
- De gegenereerde README-previews en integriteitsindex.
- Geautomatiseerde controles voor geometrie, stijl en reproduceerbaarheid.

## Staalgeometrie

- Catalogusgedreven doorsneden gebruiken de standaardmaat uit `parametric.json`.
- I-, U-, T- en hoekprofielen krijgen echte SVG-boogsegmenten voor afrondingen.
- De opgegeven wortelstraal `r` wordt gebruikt waar de catalogus die bevat; vormen zonder straalkolom krijgen een begrensde constructieve afronding op basis van de wanddikte.
- Koker- en buisprofielen houden buiten- en binnencontouren in werkelijke verhouding.
- Elk doorsnedesymbool krijgt horizontale en verticale hartlijnen binnen het `0 0 64 64`-tekenvlak.
- Ingebakken profielnamen verdwijnen uit de geometrie; bestandsnaam, collectie en catalogus leveren de identiteit.

## Aanzichten

- Aanzichten gebruiken een expliciete voorbeeldlengte van viermaal de profielhoogte.
- Flens-, lijf- en wanddiktes worden uit de gekozen standaardmaat afgeleid en op dezelfde schaal getekend.
- Hartlijnen en verborgen contouren blijven binnen de viewBox.
- De app kan later dezelfde renderer met een projectspecifieke werkelijke lengte aanroepen; de repositoryfallback blijft deterministisch.

## Wandgeometrie

- Materiaal en functie worden door geometrische arcering uitgedrukt, niet door tekstlabels.
- Buitencontouren, materiaalhatches en hulplijnen gebruiken vaste lijnprofielen.
- Hatches eindigen op de binnenzijde van de wand en steken niet buiten de viewBox.
- Brandwerende, massieve, cellulaire, gemetselde, houten, metalen en samengestelde wanden houden visueel verschillende patronen.

## Kwaliteitscontract

- Gegenereerde staal- en wandsymbolen bevatten geen `<text>`.
- Alle SVG's gebruiken `viewBox="0 0 64 64"` en uitsluitend de bestaande veilige SVG-policy.
- Staalvormen met wortelafrondingen bevatten boogcommando's.
- Hartlijnen bevinden zich volledig binnen het tekenvlak.
- `--check` vergelijkt gegenereerde output byte-voor-byte met de repository.
- Elke gewijzigde collectie krijgt een minor-versiebump; index en README-media worden daarna opnieuw gegenereerd.

## Niet in deze release

- Het herschrijven van brand-, elektra- en installatiesymbolen buiten de wandsets.
- Nieuwe normtabellen of profielmaten toevoegen.
- Een runtime-renderer in de desktopapp integreren.

