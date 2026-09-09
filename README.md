# What Would I Pay?

A prototype web app that lets you enter your household details and compare how different politicians' (and parties') tax and healthcare platforms would change what you actually keep each year.

- **Stack:** Vite + React 19 + TypeScript + Tailwind v4. No backend; all data ships as typed TypeScript.
- **Engine:** `src/engine/` — federal income tax, payroll tax, CTC/EITC, OBBBA deductions, ACA premium tax credits, Medicaid eligibility, Medicare premiums, rough state income tax, tariff pass-through.
- **Data:** `src/data/baseline2026.ts` (current law, cited), `src/data/platforms/` (one file per politician / party, every position cited with a confidence level), `src/data/states.ts`.
- **Research:** `docs/research/` — prior-art survey, data-source survey, and the raw position reports the dataset was built from.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # engine unit tests
npm run build
```

## How platforms work

A platform is a list of `PolicyPosition`s. Each has an `area` (e.g. `ctc`, `aca`), a one-line summary, citations, a confidence rating, and an optional `apply(params)` function that mutates a cloned copy of the baseline parameters. Politicians inherit unstated positions from their party baseline (`inheritsFrom`), and those show up as "Party default" in the UI.

## Photos and licenses

Source code is MIT. Politician avatars in `public/avatars/` are official portraits: US government works in the public domain, or California/Florida state works that those states place in the public domain, except:

- `shapiro.webp` — CC BY 4.0 (Maryland GovPics, cropped)
- `moore.webp` — CC BY-SA 4.0 (Maryland State Government, cropped); the cropped derivative is likewise CC BY-SA 4.0

Full credits with source links are generated into `public/avatars/CREDITS.md` by `node scripts/fetch-avatars.mjs`, which refuses to build any attribution-required image that isn't acknowledged in `scripts/avatar-credits.json`. Nobody depicted endorses this tool.

## Caveats

This is a directional estimator, not tax software. See the Methodology section in the app for what is and isn't modeled.
