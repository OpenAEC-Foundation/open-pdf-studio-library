# Contributing content

## Adding a new country

1. Check `MASTERPLAN.md` for the country's wave and expected collections.
2. Create `countries/<iso2>.json` (see `docs/data-format.md`).
3. Reference shared collections (`iso7010-safety`, `common-*`, …) plus the
   national layer. Declare missing national collections as `planned`.
4. Run `npm run validate && npm run build-index && npm test`.
5. Open a PR titled `country: <iso2>`.

## Adding or filling a collection

1. Create/extend `collections/<id>/` with `collection.json`.
2. Draw content following the SVG guidelines in `docs/data-format.md`.
   Draw everything from scratch — never copy from standards documents,
   other software's cliparts, or scanned material.
3. Set `status` to `available` only when the content is complete enough to
   be useful (rule of thumb: covers the symbols commonly seen on real
   drawings in that market).
4. Bump `version` (semver) on every change inside an existing collection.
   The new version must be strictly higher than the version in the base branch.
5. Run `npm run validate && npm run build-index && npm run build-media && npm test`.
   Before opening a PR, also run `npm run check-index`, `npm run check-media`
   and `npm run check-versions -- --base origin/main`.
6. Open a PR titled `collection: <id>`. Review requires one person with
   knowledge of the target market.

## Hard rules

- No references to third-party commercial software products anywhere in
  content, code, comments or commit messages. Standard names/numbers
  (ISO, EN, NEN, DIN, NFPA, BS, AISC, …) are fine and encouraged.
- All content is drawn from scratch (see Legal note in README).
