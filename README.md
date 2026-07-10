# Open PDF Studio Library

Worldwide symbol, stamp and template library for
[Open PDF Studio](https://github.com/OpenAEC-Foundation). Users pick
**region → country → sector** in the app and get a consolidated library
package for their market.

## Structure

- `MASTERPLAN.md` — the worldwide rollout plan (waves, countries, sectors).
- `collections/<id>/` — content collections (symbols, parametric components,
  stamps, hatches/legends). Each collection exists exactly once; shared
  standards (ISO/EN) are reused across countries.
- `countries/<iso2>.json` — country manifests composing collections per sector.
- `index.json` — generated world index; the only file the app fetches.
- `schema/` — JSON Schemas for all of the above.
- `docs/data-format.md` — data format and SVG drawing guidelines.

## Tooling

```bash
npm install
npm test              # unit + repo-integrity tests
npm run validate      # schema + cross-reference + SVG checks
npm run build-index   # regenerate index.json
```

## Contributing

See `docs/contributing-content.md`.

## Legal

All symbols are drawn from scratch to convey the meaning defined by the
referenced standards. No content is copied from standards documents.
