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

### Approval stamps — US & German sets

![US and German approval stamps](docs/media/preview-stamps.svg)

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

| Country | Fire safety | Stamps | Drafting (parametric) | Steel profiles |
|---|---|---|---|---|
| 🇺🇸 United States | ✅ `nfpa170-fire` (31) | ✅ `us-stamps` (16) | 🔜 planned | 🔜 `aisc-steel-shapes` |
| 🇩🇪 Germany | ✅ `din14034-fire` (31) | ✅ `de-stamps` (13) | 🔜 planned | 🔜 `en-steel-profiles` |
| 🇳🇱 Netherlands | 🔜 `nen1414-fire` (migrating from the app) | 🔜 planned | 🔜 planned | 🔜 `en-steel-profiles` |
| 🇬🇧 United Kingdom | 🔜 next up | 🔜 next up | 🔜 planned | 🔜 planned |

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
