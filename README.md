# Open PDF Studio Library

[![validate](https://github.com/OpenAEC-Foundation/open-pdf-studio-library/actions/workflows/validate.yml/badge.svg)](https://github.com/OpenAEC-Foundation/open-pdf-studio-library/actions/workflows/validate.yml)

**The worldwide symbol, stamp and template library for
[Open PDF Studio](https://github.com/OpenAEC-Foundation).**
Pick **region → country → sector** in the app and get a consolidated,
locally correct library package for your market: drawing symbols per your
national standards, approval stamps in your language, parametric drafting
components with your local conventions.

Everything here is drawn from scratch, versioned, validated in CI and
downloadable on demand — the app fetches a single [`index.json`](index.json)
and pulls collections as needed.

## What it looks like

### 🇺🇸 `nfpa170-fire` — fire safety symbols (NFPA 170), 31 symbols

![NFPA 170 fire safety symbols](docs/media/preview-nfpa170-fire.svg)

### 🇩🇪 `din14034-fire` — Feuerwehrplan symbols (DIN 14034-6), 31 symbols

![DIN 14034-6 Feuerwehrplan symbols](docs/media/preview-din14034-fire.svg)

### 🇬🇧 `uk-fire-symbols` — fire safety symbols (BS 1635 conventions), 26 symbols

![UK fire safety symbols](docs/media/preview-uk-fire-symbols.svg)

### Approval stamps — 11 countries, in each market's own language

![Approval stamps in 11 languages](docs/media/preview-stamps.svg)

### Shared collections — used by every country

![North arrows](docs/media/preview-north-arrows.svg)

## How it works

Content exists exactly **once** as a *collection* (`collections/<id>/`);
shared standards like ISO 7010 are reused across dozens of countries.
*Country manifests* (`countries/<iso2>.json`) compose collections into one
consolidated package per sector. A generated *world index* (`index.json`)
is the only file the app fetches.

```
collections/nfpa170-fire/     ← content, drawn once
countries/us.json             ← composes the US package
index.json                    ← world index (generated)
```

Full format documentation: [docs/data-format.md](docs/data-format.md).

## Current coverage

| Country | Fire safety symbols | Stamps |
|---|---|---|
| 🇺🇸 United States | ✅ `nfpa170-fire` (31) | ✅ `us-stamps` (16) |
| 🇩🇪 Germany | ✅ `din14034-fire` (31) | ✅ `de-stamps` (13) |
| 🇬🇧 United Kingdom | ✅ `uk-fire-symbols` (26) | ✅ `uk-stamps` (14, incl. ISO 19650 S-codes) |
| 🇳🇱 Netherlands | 🔜 `nen1414-fire` (migrating from the app) | 🔜 planned |
| 🇫🇷 France | 🧭 needs local review | ✅ `fr-stamps` (12) |
| 🇮🇹 Italy | 🧭 needs local review | ✅ `it-stamps` (12) |
| 🇪🇸 Spain | 🧭 needs local review | ✅ `es-stamps` (11) |
| 🇵🇹 Portugal | 🧭 needs local review | ✅ `pt-stamps` (10) |
| 🇹🇷 Türkiye | 🧭 needs local review | ✅ `tr-stamps` (11) |
| 🇮🇱 Israel | 🧭 needs local review | ✅ `il-stamps` (8) |
| 🇮🇳 India | 🧭 needs local review | ✅ `in-stamps` (12, incl. GOOD FOR CONSTRUCTION) |
| 🇧🇷 Brazil | 🧭 needs local review | ✅ `br-stamps` (10) |
| 🇨🇳 China | 🧭 needs local review | ✅ `cn-stamps` (11, incl. 可用于施工 / 竣工图) |
| 🇷🇺 Russia | 🧭 needs local review | ✅ `ru-stamps` (11, GOST/SPDS practice) |

Parametric collections (steel profiles, grid/level/rebar components) are
defined but waiting on the parametric format — see the plan.
**🧭 = this is where you come in:** the country manifest and stamps exist,
the national symbol set needs someone who knows the local drawings.

The full rollout plan — four waves, from the largest construction markets to
worldwide coverage, plus future sectors (MEP, electrical, process/P&ID,
infrastructure) — lives in [MASTERPLAN.md](MASTERPLAN.md).

## 🌍 Help build your country's library

This library only becomes truly worldwide with people who know their local
market. **If you work in AEC anywhere in the world, you can make Open PDF
Studio speak your country's drawing language** — usually in a weekend:

- **Adopt a country** — create the manifest and define which national
  collections it needs. A thin national layer on top of the shared ISO/EN
  collections is often just 2–3 collections.
- **Draw a collection** — fire safety plan symbols, drafting conventions,
  material hatches. Stroke-based SVG, 64×64, guidelines in
  [docs/data-format.md](docs/data-format.md).
- **Add your stamps** — the approval stamps used on drawings in your
  language (`APPROVED` / `GEPRÜFT` / `BON POUR EXÉCUTION` / …) are a
  15-minute JSON file — see an example in
  [`collections/de-stamps/stamps.json`](collections/de-stamps/stamps.json).
- **Review** — you know what real drawings in your market look like?
  Reviewing a proposed collection is just as valuable as drawing one.

Start with [docs/contributing-content.md](docs/contributing-content.md),
or simply [open a country request](https://github.com/OpenAEC-Foundation/open-pdf-studio-library/issues/new?template=country-request.yml)
and tell us what's used on drawings where you work. Every symbol is drawn from scratch — no content is ever copied
from standards documents, so contributions stay clean.

## Tooling

```bash
npm install
npm test              # unit + repo-integrity tests
npm run validate      # schema + cross-reference + SVG checks
npm run build-index   # regenerate index.json
```

CI runs all three on every push and PR.

## Legal

All symbols are drawn from scratch to convey the meaning defined by the
referenced standards (ISO, EN, NEN, DIN, NFPA, BS, AISC, …). No content is
copied from standards documents. See [LICENSE](LICENSE).
