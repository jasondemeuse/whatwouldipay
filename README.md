# What Would I Pay?

A prototype web app that lets you enter your household details and compare how different politicians' (and parties') tax and healthcare platforms would change what you actually keep each year.

- **Stack:** Vite + React 19 + TypeScript + Tailwind v4. No backend; all data ships as typed TypeScript.
- **Engine:** `src/engine/`, federal income tax, payroll tax, CTC/EITC, OBBBA deductions, ACA premium tax credits, Medicaid eligibility, Medicare premiums, rough state income tax, tariff pass-through.
- **Data:** `src/data/baseline2026.ts` (current law, cited), `src/data/platforms/` (one file per politician / party, every position cited with a confidence level), `src/data/states.ts`.
- **Research:** `docs/research/`, prior-art survey, data-source survey, and the raw position reports the dataset was built from.
- **Two views:** the simple view (default) asks one question per screen and ranks the answer; the full comparison (`?v=full`, or the header toggle) has every line item, the policy lever matrix, spending priorities and adjustable assumptions. Both read and write the same state, and every view is a permalink.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # engine unit tests
npm run build
```

## How platforms work

A platform is a list of `PolicyPosition`s. Each has an `area` (e.g. `ctc`, `aca`), a one-line summary, citations, a confidence rating, and an optional `apply(params)` function that mutates a cloned copy of the baseline parameters. Politicians inherit unstated positions from their party or lane baseline (`inheritsFrom`), and those show up as "Party default" in the UI. Three helpers encode the three kinds of entry:

- `pos(area, summary, confidence, citations, apply)`, a position that changes numbers.
- `note(area, summary, confidence, citations)`, on the record, no parameter effect; the party default still applies.
- `hold(area, summary, confidence, citations)`, a documented "keeps current law" (for example a non-cosponsorship) that blocks the party default.

Confidence: `high` = explicit numeric proposal, sponsored bill or signed law; `medium` = clear direction without numbers; `low` = inferred from votes or general statements. Every position needs at least one citation with a specific URL; `npm test` fails on empty citations, bare-domain links, duplicate areas, missing avatars, or a position that writes an assumption-owned field.

### Adding a politician

1. Add a `Platform` object in `src/data/platforms/democrats.ts` or `republicans.ts` (independents live in `democrats.ts`) and append it to the exported array at the bottom of that file.
2. Pick `inheritsFrom` from the baselines in `parties.ts` (`party-gop`, `party-dem`, `party-progressive`, `party-lib`, `party-maga`).
3. Optionally add spending-side commitments under the same id in `src/data/platforms/spending.ts`, naming the `scorer` for every figure.
4. Add the person to `scripts/avatar-sources.json` (a bioguide ID for members of Congress, or a Wikimedia Commons file name) and run `npm run avatars`. The script refuses non-free licenses and any attribution-required image not acknowledged in `scripts/avatar-credits.json`.
5. Run `npm test`; the dataset lint will tell you what's missing.

### Rolling the baseline to a new tax year

Everything statutory lives in `src/data/baseline2026.ts` with a source tag per block; `src/data/states.ts` carries the state tables; `src/data/spending.ts` carries the receipt shares. Update those, add a dated entry to `src/data/changelog.ts`, and bump `SITE.modelUpdated` in `src/lib/labels.ts`.

## Licenses

Source code is MIT (see `LICENSE`). The policy dataset under `src/data/` is additionally CC BY 4.0. Politician avatars in `public/avatars/` are official portraits: US government works in the public domain, or California/Florida state works that those states place in the public domain, except:

- `shapiro.webp`: CC BY 4.0 (Maryland GovPics, cropped)
- `moore.webp`: CC BY 4.0 (Maryland GovPics, cropped)

Full credits with source links are generated into `public/avatars/CREDITS.md` by `node scripts/fetch-avatars.mjs`, which refuses to build any attribution-required image that isn't acknowledged in `scripts/avatar-credits.json`. Nobody depicted endorses this tool.

## Caveats

This is a directional estimator, not tax software. See the Methodology section in the app for what is and isn't modeled.
