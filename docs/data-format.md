# Data format

## Collection

`collections/<id>/collection.json`, validated by `schema/collection.schema.json`:

```json
{
  "id": "nfpa170-fire",
  "name": { "en": "Fire safety symbols (NFPA 170)", "nl": "Brandveiligheidssymbolen (NFPA 170)" },
  "sector": "aec",
  "types": ["symbols"],
  "standard": "NFPA 170",
  "scope": "national",
  "status": "planned",
  "version": "0.1.0",
  "license": "repository"
}
```

- `id` — kebab-case, must equal the directory name.
- `name` — localized; `en` is required, add the local language of the market.
- `sector` — `aec` | `mep` | `electrical` | `process` | `infra`.
- `types` — any of `symbols`, `parametric`, `stamps`, `hatches`, `legends`.
- `standard` — optional; the standard the content is drawn *for* (never copied *from*).
- `scope` — `international` (ISO-level), `regional` (e.g. EN), `national`.
- `status` — `planned` (declared, no content yet) or `available` (content present).
- `license` — `repository` means the repo LICENSE applies.

Content files per type (required once `status` is `available`):

| type | content |
|---|---|
| `symbols` | `symbols/*.svg` |
| `parametric` | `parametric.json` |
| `stamps` | `stamps.json` |
| `hatches` | `hatches.json` |
| `legends` | `legends.json` |

## SVG drawing guidelines

- `viewBox="0 0 64 64"`, stroke-based (`fill="none" stroke="#000" stroke-width="2"`),
  solid fills only where the symbol's meaning requires it.
- Self-contained: no external references (`href`/`url()` to http(s)), no scripts,
  no raster images. The `xmlns` attribute is of course fine.
- One symbol per file; the file name (kebab-case) is the symbol id.
- Text inside symbols: `text-anchor="middle"`, `fill="#000" stroke="none"`.

## Stamps

`stamps.json` in a collection with type `stamps`:

```json
{
  "stamps": [
    { "id": "approved", "text": "APPROVED", "color": "#22c55e" },
    { "id": "draft", "text": "DRAFT", "color": "#3b82f6" }
  ]
}
```

- `id` — kebab-case, unique within the collection.
- `text` — the stamp text as it appears on the drawing, in the market's
  language and conventional casing (usually uppercase).
- `color` — `#rrggbb`; conventions: green = approved/positive,
  red = rejected/negative, blue = informational, amber = provisional,
  gray = void/archival.

This maps 1:1 onto the app's built-in stamp model (`text`/`color`); the app
renders the bordered stamp shape itself.

## Hatches

`hatches.json` in a collection with type `hatches`:

```json
{
  "hatches": [
    {
      "id": "steel",
      "name": { "en": "Steel", "nl": "Staal" },
      "lineFamilies": [
        { "angle": 45, "originX": 0, "originY": 0, "deltaX": 0, "deltaY": 12 },
        { "angle": 45, "originX": 0, "originY": 3, "deltaX": 0, "deltaY": 12 }
      ]
    }
  ]
}
```

- `id` — kebab-case, unique within the collection.
- `name` — localized; `en` required.
- `lineFamilies` — the app's hatch model (shared with open-2d-studio, so
  pattern ids round-trip): each family is a repeating set of parallel lines.
  `angle` in degrees, `deltaY` = spacing between lines, `deltaX` = stagger,
  `originX`/`originY` = offset. `dashPattern` makes lines dashed; a
  `dashPattern` containing `0` renders a grid of dots; a negative value is a
  gap. An **empty** `lineFamilies` array means solid fill.

## Parametric catalogs

`parametric.json` in a collection with type `parametric`. The first (and so far
only) catalog format is `steel-sections`, validated by
`schema/parametric-steel.schema.json` plus row-level checks in
`scripts/validate.mjs`:

```json
{
  "format": "steel-sections",
  "formatVersion": 1,
  "units": "mm",
  "label": { "en": "Steel — US (AISC)", "nl": "Staal — VS (AISC)" },
  "families": [
    {
      "id": "w-shapes",
      "name": { "en": "W shapes (wide flange)", "nl": "W-profielen" },
      "shape": "i",
      "columns": ["designation", "h", "b", "tw", "tf", "r"],
      "defaultSize": "W12x26",
      "sizes": [
        ["W12x26", 310, 165, 5.8, 9.7, 9]
      ]
    }
  ]
}
```

- `label` — localized group label shown by the app (include the standard name).
- `families` — one entry per section family. `id` is kebab-case and unique
  within the catalog.
- `shape` — drives both the rendered cross-section and the column layout:

  | shape | meaning | columns |
  |---|---|---|
  | `i` | I/H-section (two flanges + web) | `designation, h, b, tw, tf, r` |
  | `u` | channel (web + two flanges, opening sideways) | `designation, h, b, tw, tf, r` |
  | `tee` | T-section (top flange + web) | `designation, h, b, tw, tf, r` |
  | `box` | square/rectangular hollow section | `designation, h, b, t` |
  | `angle` | L-angle (vertical leg h, horizontal leg b) | `designation, h, b, t` |
  | `pipe` | circular hollow section | `designation, d, t` |

- All dimensions are real-world **mm**. `r` is the root-fillet radius used for
  drawing only. Tapered-flange series (older channel/I standards) are stored
  with their mean flange thickness — a documented parallel-flange
  simplification, the same one the app's built-in NL tables use.
- `columns` must match the shape's column list exactly (self-documenting data).
- `defaultSize` must be one of the designations in `sizes`.
- No SVG per size: the app renders cross-section, top view and side view from
  the table, sized to real-world dimensions via its measure scale, with the
  size switchable after placement (dynamic-block behaviour).
- Sizes are **written out by hand** from publicly known section series
  (dimensions of standardized sections are facts); never copy table files or
  scans from standards documents or vendor catalogs.

A steel collection may carry **both** `symbols` (flat SVG previews/cross
sections — the fallback for consumers without a parametric renderer) and
`parametric` (the size catalog). Apps that understand `steel-sections` should
prefer the catalog and skip the flat SVGs to avoid duplicate palette entries.

## Country manifest

`countries/<iso2>.json`, validated by `schema/country.schema.json`:

```json
{
  "id": "us",
  "name": { "en": "United States" },
  "flag": "🇺🇸",
  "region": "north-america",
  "wave": 1,
  "sectors": {
    "aec": { "collections": ["nfpa170-fire", "common-north-arrows"] }
  }
}
```

Every referenced collection must exist. Planned collections may be referenced —
the app shows them as "coming soon" based on their `status` in the index.

## World index

`index.json` is generated by `npm run build-index` — never edit by hand.
It groups countries by region and carries a flat collection map with
download paths. The app fetches this single file, then downloads collection
content on demand.
