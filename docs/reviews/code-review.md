# Code review — WhatWouldIPay, pre-first-public-release

Reviewer: engineering manager, skeptical pass · 2026-09-09 · commit `c2ebaaf`

Findings marked **(verified)** were reproduced with throwaway scripts run outside the repo against the
real modules. No repo file was modified except this one.

## Verdict

This is a genuinely good prototype wearing the costume of a finished product, and the gap between the
two is the problem. The engine is readable, the 2026 baseline is cited line by line, the accessibility
work in `AssumptionsPanel` and `PositionsPanel` (roving tabindex, focus trap, focus return,
`aria-modal`, skip link) is better than most commercial front ends, `tsc -b` is clean, `npm audit` is
clean, and 24 tests run in 186 ms. But almost every claim the product makes about itself is falsifiable
by reading the repo. It advertises a source count while **15 of 172 positions have no citation at all**,
11 more cite a bare homepage and 8 cite Wikipedia. It presents 25 distinguishable platforms while
**only 18 produce distinct numbers** — Newsom, Pritzker, Beshear and Moore are byte-identical to each
other, and DeSantis and the GOP baseline are byte-identical to *current law*, so selecting them shows a
$0 change for every household in America. The README asserts MIT while **there is no LICENSE file**, and
one avatar is CC BY-SA 4.0 with no file-level marking. `strict` is off in TypeScript, so the clean
`tsc -b` proves almost nothing. A married-filing-separately household has its spouse's wages collected
by the form and **silently discarded** by the engine. A 66-year-old with a 60-year-old spouse loses the
spouse's health premium entirely. Opening any link Facebook has touched (`?fbclid=…`) **wipes the
user's saved household**, and every permalink to the methodology page rewrites itself into a broken URL
300 ms after it loads. None of this is hard to fix — most items are an afternoon — but the honest
summary is that the modelling is a B+, the product design an A−, and the release engineering a D. Ship
as-is and you get the one review a numbers-about-politics project cannot survive: *"their own dataset
doesn't meet the standard they advertise."*

---

## Command output

```
$ npm run build                      # tsc -b && vite build — clean, 132 ms
dist/assets/index-BcbGl-Ud.js   414.33 kB │ gzip: 128.28 kB
dist/assets/dist-DXcnnGpQ.js     23.92 kB │ gzip:   9.35 kB   (modern-screenshot, lazily imported)
dist/assets/index-nliP72XL.css   34.38 kB │ gzip:   7.34 kB
dist/index.html                   0.64 kB │ gzip:   0.40 kB
13 × .woff2                     390.22 kB total (221 kB latin/latin-ext; 169 kB Cyrillic/Greek/Vietnamese)

$ npx tsc -b --noEmit                # clean — but see B2: `strict` is off, so this proves little

$ npm run lint                       # oxlint — 0 errors, 6 warnings
src/components/PlatformPicker.tsx:11:14  react(only-export-components)
src/components/PlatformPicker.tsx:19:14  react(only-export-components)
src/components/PositionsPanel.tsx:12:14  react(only-export-components)
src/components/PositionsPanel.tsx:31:14  react(only-export-components)
src/components/HouseholdForm.tsx:27:17   react(only-export-components)
src/App.tsx:66:25                        react(use-memo): expected an inline function expression

$ npm test                           # vitest — 5 files, 24 tests, all pass, 186 ms
$ npm audit                          # found 0 vulnerabilities

$ git log --oneline                  # 12 commits, one author, all dated 2026-09-08
c2ebaaf Beyond your paycheck: income-tax receipt and spending-side commitments per platform
56ecd6f Collect child ages: age-tiered credits, marketplace child pricing, work-requirement exemption
d8c7c06 Tier 3: dark theme, methodology page, share image, guess-first mode
…
f95d7b1 Scaffold WhatWouldIPay: engine, 2026 baseline, state tax tables, UI shell
```

**History shape.** Twelve commits in one day, each a large feature drop ("Tier 2: permalinks, verdict
sentence, animated numbers, sort, mobile summary"). No branches, tags, merge commits, PRs or CI.
Nothing here has survived a second reader, and there is no convention for a contributor to imitate.
`git ls-files` is otherwise clean — 113 files, 1.5 MB `.git`, no `dist/`, no `.DS_Store`; largest
tracked files are `package-lock.json` (92 KB) and `docs/research/08-spending.md` (92 KB).

---

## Blockers

### B1 — MFS households: the form collects spouse wages, the engine throws them away
`src/components/HouseholdForm.tsx:38,97,139` · `src/engine/calculate.ts:46,140-146,180,374`

```ts
// HouseholdForm.tsx:38 — MFS counts as "joint" for field visibility
const joint = value.filingStatus === 'mfj' || value.filingStatus === 'mfs'
{joint && money('spouseWages', 'Spouse wages (W-2)')}   // :139
{joint && <IntField label="Spouse age" … />}            // :97

// calculate.ts:140-146 — MFS counts as single for arithmetic
const isJoint = fs === 'mfj'
const wages = h.wages + (isJoint ? h.spouseWages : 0)
```

`spouseAge` is likewise read only under `isJoint` (`:180` senior deduction, `:374` Medicare adults), and
`householdSize` (`:46`) counts one adult for MFS, so FPL, ACA pricing and Medicaid eligibility are
computed for a household one person smaller than the one described.

**Failing scenario (verified):**
```ts
const withSpouse = calculate({ ...base, filingStatus: 'mfs', wages: 60000, spouseWages: 60000 }, BASELINE_2026, 'b')
const alone      = calculate({ ...base, filingStatus: 'mfs', wages: 60000, spouseWages: 0     }, BASELINE_2026, 'b')
expect(withSpouse.netIncome).not.toBe(alone.netIncome)   // FAILS — both are exactly 47,150
```

**Why it matters.** The product's only promise is "the money you keep". For an entire filing status it
returns a number it has the information to know is wrong, with no warning. **Fix:** hide the spouse
fields for MFS (and make `householdSize` explicit), or model MFS honestly — `ByFilingStatus` already
carries `mfs` everywhere. Add a test per filing status and an assertion that no collected field is
silently unread.

### B2 — TypeScript `strict` is off, so `tsc -b` is checking almost nothing
`tsconfig.app.json` · `tsconfig.node.json`

Neither config sets `strict`, `strictNullChecks` or `noImplicitAny`. Every `?.`, every `!`, and the
`RefObject<HTMLDivElement | null>` at `ShareBar.tsx:7` are decorative. Concretely hidden today:

- `BeyondPaycheck.tsx:100` — `RECEIPT.find(r => r.borrowed)!.share` crashes the page if that row is ever
  removed from `src/data/spending.ts`.
- `urlState.ts:72` — `(h as unknown as Record<string, number>)[key] = …`, a double cast that will write a
  number into `h.state` or `h.filingStatus` the moment `H_KEYS` gains a row.
- `HouseholdForm.tsx:46-47` — `value[k] as number` / `set(k, n as never)`; `money()` accepts any
  `keyof Household`, so `money('state', …)` typechecks and produces garbage.
- `ResultsView.tsx:146` `platform!`, `calculate.ts:259` `ctc.youngChildBonus!`, `main.tsx:6`
  `getElementById('root')!`.

For a repo whose pitch is "typed TypeScript, no backend, check our work" (`README.md:5`), this is the
most damaging line in the config. **Fix:** `"strict": true` and fix the fallout *first* — several
findings below become compile errors.

### B3 — Any unrecognized query parameter silently wipes the user's saved state
`src/lib/urlState.ts:57-59,82-84` · `src/App.tsx:36-50,73-86`

```ts
if ([...q.keys()].length === 0) return null      // ANY key counts as "the URL carries state"
```

Arrive at `?fbclid=…` (Facebook appends this to every shared link) or `?utm_source=…` and `parse`
returns a fully-defaulted `AppState` with `selected: []` (`''.split(',')` filtered against valid ids
yields `[]`). `load()` (`App.tsx:38-39`) returns it *before* reading localStorage, and the persist
effect (`:76-81`) immediately overwrites localStorage with those defaults. The saved household and
selection are gone and unrecoverable.

**Why it matters.** The most common way this app will be opened is from a social share — i.e. with a
tracking parameter attached. **Fix:**
```ts
const KNOWN = new Set([...H_KEYS.map(([, s]) => s), 'ka', 'p', 'epw', 'ppt', 'tpt'])
if (![...q.keys()].some((k) => KNOWN.has(k))) return null
```

### B4 — Every methodology permalink rewrites itself into a broken URL 300 ms after it loads
`src/lib/urlState.ts:97-101` · `src/App.tsx:83-85,54-62`

```ts
const base = `${location.origin}${location.pathname}`     // urlState.ts:99 — hash dropped
setTimeout(() => { if (window.location.href !== url) window.history.replaceState(null, '', url) }, 300)
```

Open `/#/methodology`; 300 ms later the effect rewrites the address bar to `/` with the hash stripped.
`replaceState` fires no `hashchange`, so `useHashRoute` still holds `#/methodology` and the page *looks*
fine — but reload, bookmark or copy-paste and you land on the calculator. The credibility surface has a
self-destroying link. **Fix:** preserve `location.hash` in `permalink()`, or keep the route in App state
and append it at the `replaceState` call site.

### B5 — The citation layer does not meet the standard the product advertises
`src/App.tsx:141-143` · `README.md:7` · `src/data/platforms/*.ts`

`App.tsx:141-143` renders `{politicianCount} politicians · {sourceCount} sources`; `README.md:7` says
"every position cited with a confidence level". Audit of `PLATFORMS` (verified): **172 positions, 15
with `citations: []`, 11 citing a bare homepage, 8 citing Wikipedia, 28 citations with no `date`.**

**Zero citations (15):** `vance/medicare` `republicans.ts:44` · `desantis/aca` `:112` · `cruz/aca` `:149`
· `hawley/payroll` `:241` · `aoc/capitalGains` `democrats.ts:39` · `aoc/medicare` `:40` ·
`ossoff/payroll` `:56` · `newsom/singlePayer` `:94` · `whitmer/singlePayer` `:201` · `whitmer/medicaid`
`:202` · `pritzker/medicaid` `:227` · `pritzker/capitalGains` `:228` · `pritzker/medicare` `:229` ·
`beshear/medicare` `:256` · `gallego/payroll` `:343`.

`democrats.ts:227` is the worst: `pritzker/medicaid` is a `pos()` with a real parameter change
(`reverseHealthCuts`) and an empty citation array. `democrats.ts:39` asserts AOC "Supports taxing
unrealized gains of the ultra-wealthy" at `confidence: 'medium'` with nothing behind it.

**Bare homepages (11)** — these cite nothing and will rot immediately: `party-maga/payroll` and
`hawley/tipsOvertime` → `https://www.hawley.senate.gov/`; `ossoff/aca` → `https://www.ossoff.senate.gov/`;
`pritzker/tariffs` → `https://gov.illinois.gov/`; `beshear/tariffs`, `beshear/medicaid` →
`https://kentuckylantern.com/`; `beshear/aca` → `https://www.wkyt.com` (and that one drives a real
parameter change, `restoreEnhancedAca`); `moore/incomeRates`, `moore/capitalGains`, `moore/ctc` →
`https://mgaleg.maryland.gov`; `moore/tariffs` → `https://governor.maryland.gov/`.

**Wikipedia (8):** `rubio/eitc`, `ossoff/singlePayer`, `shapiro/incomeRates`, `shapiro/other`,
`buttigieg/singlePayer`, `whitmer/eitc`, `whitmer/socialSecurityBenefits`, `gallego/singlePayer` —
plus at least one in the spending dataset. Shapiro's entire entry rests on one Wikipedia article, and
`docs/research/02-data-sources.md` frames primary sourcing as the project's edge.

**Why it matters.** Attributing an unsourced tax position to a named living politician is the failure
mode this project cannot survive. **Fix:** make it structurally impossible — a data-lint test (T1) that
fails on `citations.length === 0` and on `new URL(c.url).pathname === '/'`; require `date`; add a
`tier: 'primary' | 'secondary' | 'tertiary'` to `Citation` (`types.ts:287-293`) and render tertiary
sources visibly differently, the way `Scorer` already does for budget figures.

### B6 — Seven of 25 platforms are duplicates, and two of them are identical to current law
`src/data/platforms/*.ts` · `src/engine/calculate.ts:91-95`

Comparing `applyPlatform(BASELINE_2026, …)` byte-for-byte across all platforms (verified):
**18 distinct parameter bundles out of 25.**

| identical group | platforms |
|---|---|
| **identical to the unmodified 2026 baseline** | `party-gop`, `desantis` |
| Dem baseline | `party-dem`, `shapiro`, `whitmer` |
| MAGA lane | `party-maga`, `hawley` |
| Dem + tariff repeal | `newsom`, `pritzker`, `beshear`, `moore` |

Newsom, Pritzker, Beshear and Moore return the same number for every household — four separately
researched governors the UI presents as distinguishable choices. Hawley adds nothing to the lane he
defines. DeSantis (`republicans.ts:98-117`) has **zero** parameter changes, so picking him renders a
"$0 change vs current law" verdict indistinguishable from picking nothing.

**Why it matters.** A comparison tool where 28 % of the roster is a duplicate — and where the
Republican baseline *is* current law — invites the reading that the model can't tell anyone apart. The
research is honest about this; the UI is silent about it. **Fix:** hash the bundle at module load and
either surface "produces the same result as the Democratic baseline for your household" in
`PlatformPicker`/`ResultsView`, or add a test that fails on collision so each duplicate is a deliberate,
documented decision.

### B7 — The research notes ship an unresolved "Verify before shipping" list
`docs/research/04-positions.md:49-58` · `src/data/platforms/index.ts:12-13`

```
## Verify before shipping
1. Whitmer on tariffs: the "auto tariffs can be useful" claim is unverified.
…
5. AOC's current top-rate number (no 2025–26 restatement of 70%).
6. Harris: full 2026 pass.
```

`index.ts:12-13` points readers at "the verify-before-shipping lists". The `docs/research/*.md` headers
also advertise that the dataset was compiled by an AI research pass with "WebSearch quota exhausted
early" and items "marked UNVERIFIED". A repo that documents its own unfinished verification, next to a
UI rendering confidence badges as if verification were complete, hands critics the story for free.
**Fix:** close the eight items, or demote the affected positions to `confidence: 'low'` with an
"unverified" marker rendered in the UI; rewrite the doc headers as neutral provenance notes.

### B8 — No LICENSE file, and a CC BY-SA image inside an "MIT" repo
repo root (absent) · `README.md:23,25-26` · `package.json:2-5` · `public/avatars/CREDITS.md`

`README.md:23` says "Source code is MIT". There is no `LICENSE`, `CONTRIBUTING.md`,
`CODE_OF_CONDUCT.md` or `.github/`, and `package.json` has no `license` field. Without a LICENSE file
the code is legally all-rights-reserved regardless of the README, so nobody can fork or contribute.

Compounding it: `moore.webp` is **CC BY-SA 4.0** — a share-alike license — and nothing at the file level
says so. A downstream consumer who clones "the MIT repo" and copies `public/avatars/` inherits an
obligation they cannot discover from the file. `docs/research/07-politician-photos.md` notes a CC BY 4.0
(non-viral) alternative exists for Moore.

**Fix:** add `LICENSE` (MIT) and `"license": "MIT"`; state explicitly that `src/data/**` and
`public/avatars/**` are covered separately (CC-BY-4.0 is the natural choice for the dataset — it is the
valuable artifact and MIT-on-code says nothing about it); either swap the Moore portrait for the CC BY
alternative or add `public/avatars/LICENSE` plus a per-file marking.

### B9 — The avatar license gate fails *open*
`scripts/fetch-avatars.mjs:57,75`

```js
attributionRequired: (em.AttributionRequired?.value ?? '').toLowerCase() === 'true',   // :57
if (m.attributionRequired && !ack[p.id]) throw …                                        // :75
```

Commons' `extmetadata.AttributionRequired` is frequently **absent**. Absent → `false` → the guard passes
→ an attribution-required (or outright non-free) image is downloaded, cropped and committed with no
acknowledgement. There is **no license allowlist anywhere in the script**: a CC BY-NC, CC BY-ND or
all-rights-reserved file passes as long as that one field isn't the literal string `"true"`. The guard
at `:75` also only requires `ack[p.id]` to be *truthy* — a file whose license later changes from CC BY
to CC BY-NC still builds. Corroborating: `CREDITS.json` records `"license": "Public domain",
"licenseUrl": ""` for 9 of the 11 Commons files — no template name, nothing verifiable — and
`CREDITS.md`'s prose ("state works that California and Florida place in the public domain") doesn't
match provenance (Beshear = Kentucky Air Guard, Whitmer = "LBJLibraryNow", Pritzker = "Courtesy Photo
United States Department of Defense").

**Fix:** fail closed — an explicit `LICENSE_ALLOW` regex (`public domain|pd-|cc0|cc by 4\.0|cc by-sa
4\.0`), throw when `LicenseShortName` is missing, treat a missing `AttributionRequired` as `true` for
anything not an explicit PD/CC0 template, and assert `ack[p.id].license === m.license`. Regenerate
`CREDITS.json` capturing the Commons template name.

### B10 — "Source on GitHub" is a placeholder
`src/App.tsx:150`

```tsx
<a href="https://github.com/" className="underline hover:text-ink" rel="noreferrer">Source on GitHub</a>
```

github.com's home page — and the only anchor in the app carrying `rel="noreferrer"` *without*
`target="_blank"`, exactly backwards from the other nine. On an open-source launch this is the link
every visitor clicks. The real URL already exists in the repo at `scripts/avatar-sources.json:3`.
**Fix:** real URL, `target="_blank" rel="noreferrer"`, hoisted to a `SITE` constant beside
`MODEL_UPDATED`.

### B11 — Mixed-age households lose the younger spouse's coverage entirely
`src/engine/calculate.ts:373-400`

```ts
const adultsOnMedicare = (h.age >= p.medicare.eligibilityAge ? 1 : 0) + (mfj && h.spouseAge >= … ? 1 : 0)
if (h.healthCoverage === 'medicare' || adultsOnMedicare > 0) {
  …
  return { cost: premiums + oop, coverage: 'medicare', items }   // early return; the switch never runs
}
```

**Failing scenario (verified):**
```ts
calculate({ ...base, filingStatus: 'mfj', age: 66, spouseAge: 60,
            healthCoverage: 'marketplace', wages: 50000 }, BASELINE_2026, 'b')
// effectiveCoverage 'medicare', healthcareCost 6,434.80
// breakdown: [ Medicare Part B premium (1) 2,434.80, Medicare out-of-pocket 4,000 ]
// The 60-year-old's benchmark premium (~$14k gross, several thousand net at this income) is absent.
```

The 60-to-66 mixed-age couple is one of the most healthcare-anxious households in America and exactly
the audience for the Medicare-eligibility-age positions in the dataset. **Fix:** price coverage per
adult and sum — Medicare for each 65+ adult, then the existing `switch` for the rest with household
size reduced accordingly.

### B12 — "Guess first" doesn't hide the answer
`src/components/ResultsView.tsx:30-35,120-146,226-233,249-277` · `src/App.tsx:215`

`hidden()` (`:35`) gates only the headline card. The comparison table renders `Net income` for every
platform unconditionally (`:226-233`), the line-item accordion exposes it (`:249-277`), and
`MobileSummary` (`App.tsx:215`) shows best/worst deltas on mobile. `guessMode` is local `useState` in
`ResultsView`, so nothing else in the tree knows the game is on. The feature fails on the first scroll.
**Fix:** lift `guessMode`/`revealed` to `App` (or a context) and gate all three surfaces on the same
predicate — or cut the feature for v1.

---

## Major

### Engine and data model

**M1 — Positions write outside their own policy area, so the "why" attribution is wrong.**
`src/data/platforms/republicans.ts:168-180` · `src/data/platforms/parties.ts:128-138` ·
`src/engine/attribution.ts:69-73`

Verified by diffing each closure's writes against its declared `area`:

```
CROSS  paul/incomeRates      also writes deductions.tips.enabled, deductions.overtime.enabled,
                             capitalGains.brackets.{single,mfj,mfs,hoh}[0].rate
CROSS  party-lib/incomeRates also writes capitalGains.niitRate, capitalGains.brackets.*
```

`deltasByArea` (`attribution.ts:71`) buckets by `position.area`, so the entire loss of the tips and
overtime deductions under Rand Paul is booked to **incomeRates**, and `LeverMatrix` shows **no
`tipsOvertime` change for Paul at all**. Likewise the Libertarian platform's total repeal of capital
gains tax is invisible in the positions UI, because `party-lib` has no `capitalGains` position.
**Why it matters:** the per-position bridge is the feature that distinguishes this from a spreadsheet,
and it is silently misattributing. **Fix:** declare a `touches: ParamPath[]` per position and assert at
test time that every write lands inside the position's own area; split the offending closures.

**M2 — `apply` closures are the wrong primitive for the data layer.**
`src/engine/types.ts:302-303` · `src/data/platforms/helpers.ts:27-107`

The helper vocabulary (`setTopRate`, `scrapTheCap`, `ctcArpa`) reads well, but the closures cost:
1. **Not serializable** — the dataset can never be exported as JSON, published as an API, schema-
   validated, or contributed to by a researcher who doesn't write TypeScript.
   `docs/research/02-data-sources.md` names "nobody keeps a machine-readable per-politician platform
   database" as the whole thesis; the current schema does not produce one.
2. **Not diffable** — the UI cannot render "this changes `ctc.amountPerChild` 2200 → 3000". That is why
   `attribute()` must `structuredClone` all of `PolicyParams` and re-run `calculate()` **per position**
   (13 clones + 13 engine runs for Booker), and why `explainZero()` (`attribution.ts:77-149`) is 70
   lines of prose reverse-engineering why nothing moved.
3. **Order-dependent** — `addSurtax` (`helpers.ts:36-38`) *pushes*; `setTopRate` (`:27-33`) *replaces*.
   `democrats.ts:301-311` (Booker) reads `p.incomeTax.brackets[fs]`, derives a rate, rewrites the array,
   then calls `setTopRate`, which re-reads and rewrites it. Safe today only because `party-dem`'s
   `incomeRates` happens to be suppressed.
4. **Implicitly coupled to the baseline** — `democrats.ts:25` `addSurtax(p, 0.33, 10_000_000)` means
   "70 %" only while the top ordinary rate is exactly 37 %. Change `baseline2026.ts:37` and the summary
   silently becomes a lie. Same at `:360` ("52 %").
5. **Silently overridable** — see M3.

**Fix (incremental):** keep a small set of *named presets with declared arguments and a declared touched-
path set*, and represent everything else as `deltas: Array<{op:'set'; path; value}>` interpreted by the
engine. Free serialization, free "what changed" rendering, cheap attribution, and M1 becomes a compile-
time/test-time error rather than a silent misattribution.

**M3 — `applyAssumptions` is not idempotent; `attribution.ts` hand-patches it, and the two code paths
have drifted.** `src/engine/assumptions.ts:10-15` · `src/engine/attribution.ts:47-53` · `src/App.tsx:88-101`

```ts
p.tariffs.pctOfIncome  *= a.tariffPassThrough      // multiplicative, in place
p.tariffs.maxAnnualCost *= a.tariffPassThrough
```

**Failing scenario (verified):**
```ts
const p = cloneParams(BASELINE_2026)
applyAssumptions(p, { ...DEFAULT_ASSUMPTIONS, tariffPassThrough: 1.5 })
applyAssumptions(p, { ...DEFAULT_ASSUMPTIONS, tariffPassThrough: 1.5 })
expect(p.tariffs.pctOfIncome).toBeCloseTo(0.015)   // FAILS: 0.0225 — it compounded
```

`attribute()` calls it once per position then repairs the damage by re-deriving the two fields from
`start` (`attribution.ts:52-53`). `App.tsx:100` — the *headline* number — does not. Four fields are
effectively assumption-owned (`tariffs.pctOfIncome`, `tariffs.maxAnnualCost`,
`singlePayer.employerPremiumToWages`, `singlePayer.employerPassthrough`); a position writing any of them
would change the headline while contributing **zero** to the bridge, breaking the exact property
`attribution.ts:29-32` promises in its own docstring. Verified: no position writes any of them today, so
the trap is armed but not sprung. **Fix:** make `applyAssumptions` pure with respect to the unscaled
baseline (store `tariffs.consumerPassThrough` and apply at the point of use in `calculate()`), delete the
repair lines, declare `ASSUMPTION_OWNED` paths and test that no position touches them, and have
`App.tsx:100` and `attribute()` share one `evaluate(household, platform, assumptions)` so they cannot
drift.

**M4 — The Positions drawer and the engine disagree about what a platform contains.**
`src/engine/calculate.ts:79-89` (`resolvedPositions`) vs `:102-123` (`effectivePositions`) ·
`src/components/PositionsPanel.tsx:92`

Two near-identical inheritance resolvers with different rules. `resolvedPositions` (what the engine
applies) returns strictly more than `effectivePositions` (what the drawer renders) for **all 18
politicians** (verified):

| platform | applied | shown | hidden areas |
|---|---|---|---|
| vance | 23 | 14 | incomeRates, salt, payroll, tipsOvertime, capitalGains, medicaid ×2, medicare ×2 |
| hawley | 21 | 14 | payroll ×2, tipsOvertime, medicaid ×2, medicare ×2 |
| rubio / cruz / haley | 18 | 14 | eitc·incomeRates, payroll, aca, medicare·medicaid |
| party-maga | 17 | 14 | payroll, medicaid, medicare |
| aoc | 14 | 11 | salt, capitalGains, medicare |
| everyone else | — | — | 1–3 each |

To be precise: the hidden ones are all `note()` positions with no `apply`, so **no number is wrong**.
But Vance's drawer omits inherited MAGA-lane statements like *"Don't Cut Medicaid: reverse provider-tax
cuts…"* and *"International reference pricing…"*, and the GOP baseline's *"Keep the $40,000 SALT cap,
reverting to $10,000 in 2030"*. Cause, `effectivePositions:113`:

```ts
const show = !ownHere || (pos.apply !== undefined && !overridesParent(platform, pos.area))
```

**Fix:** delete `effectivePositions`; render `resolvedPositions(platform, all)` directly, tagging
`source.id !== platform.id` as inherited; test that the two sets are identical.

**M5 — Inheritance suppression produces two live semantic surprises.**
`src/engine/calculate.ts:97-100`

**(a) `vance/aca` is a verified no-op whose comment claims the opposite.** `republicans.ts:36-39`:
```js
], (p) => {
  // Override the MAGA-lane restoration: Vance opposed the enhanced credits.
  p.aca.cliffAt400 = true
}),
```
The comment is false — `party-maga`'s `aca` position is *already* suppressed by the mere presence of
this one, so the closure never runs "on top of" anything, and diffing it against the baseline yields
zero changed leaves (verified: `NO-OP vance/aca`). It survives only because the baseline already has
`cliffAt400: true`. Restore the enhanced credits in a future baseline and this sets `cliffAt400 = true`
while leaving the enhanced `applicablePct` schedule intact — an incoherent hybrid. **Fix:** replace with
`hold('aca', …)` (`helpers.ts:19`), the primitive that exists for exactly this, and delete the closure.
Same class: `party-gop/tariffs` (`parties.ts:26`) is a verified no-op (`tariffs(TARIFF.keep)` sets
`multiplier = 1`, already the baseline) that is load-bearing only by accident, because it makes
`overridesParent` true.

**(b) Twelve state-level notes sit beside a silently applied federal change.** e.g.
`democrats.ts:277` (Moore's Maryland $500 child credit) renders next to an invisibly applied federal
ARPA $3,000 CTC from `party-dem`; `democrats.ts:271,218,145,244,81` (five governors' "no federal
position" notes) render next to a silently applied 39.6 % top rate; `democrats.ts:195` (Michigan EITC)
next to the federal childless expansion. Only `buttigieg` (`:177`) says out loud that the party default
is doing the work. **Fix:** add `scope: 'federal' | 'state'` to `PolicyPosition` and render state-scope
notes in a visually separate block; at minimum append "— party default applies here" to the other
eleven.

**M6 — `overridesParent` is area-granular, so a second position in one area deletes the parent's.**
`src/engine/calculate.ts:97-100`. Give a politician two positions in one area — a note *and* an `apply`
— and **all** ancestor positions in that area vanish. No platform hits this today (verified: zero
duplicate-area platforms; `area: 'other'` is used exactly twice, both without `apply`), which is
precisely why it will bite the first contributor with nothing to catch it. **Fix:** forbid duplicate
areas in the data lint (T1), or make override granularity explicit (`overrides?: PolicyArea[]`).

**M7 — `restoreEnhancedAca` leaks a live alias into eight platforms' params.**
`src/data/platforms/helpers.ts:40-43`

```js
p.aca.applicablePct = [...ENHANCED_ACA_SCHEDULE]     // shallow — inner tuples are shared objects
```

Verified: `p.aca.applicablePct[0] === ENHANCED_ACA_SCHEDULE[0]` is `true`, and the module constant is
not frozen. Used by 8 platforms. It is safe today only because nothing mutates a tuple element in place
and because `attribution.ts:48`'s next `structuredClone` happens to break the aliasing — two accidents
deep. **Fix:** `ENHANCED_ACA_SCHEDULE.map(([a, b]) => [a, b])`, and `Object.freeze` the constant.

**M8 — A URL parameter can allocate a billion-element array.**
`src/lib/urlState.ts:71-73` · `src/engine/calculate.ts:39-43,355`

`childrenUnder17` and `otherDependents` inherit the generic `Math.min(n, 1e9)` clamp; downstream,
`while (ages.length < h.childrenUnder17) ages.push(8)` and `Array(h.otherDependents).fill(18)`.
Measured (verified): `k=1e6` → 5.5 ms; `k=5e7` → 506 ms and a ~400 MB array; `?k=1000000000` is 20× that
— an out-of-memory tab kill delivered by a link, amplified ~25× because it runs once per platform.
**Fix:** clamp per field in `parse()` (children/dependents ≤ 10, ages 0–120, money ≤ 1e8) and again in
`childAges()`.

**M9 — localStorage is trusted where the URL is validated, and the engine has no input guards.**
`src/App.tsx:41-49` · `src/engine/calculate.ts:137`

```ts
household:  { ...DEFAULT_HOUSEHOLD, ...parsed.household },       // zero validation
assumptions:{ ...DEFAULT_ASSUMPTIONS, ...parsed.assumptions },
```

The key is versioned `wwip:v1` (`:32`) but the version is never checked. A `wages: "abc"` from an older
build paints `$NaN` across the UI, and there is **no error boundary anywhere in `src/`**, so a throw
blanks the page. The engine accepts negatives too: `calculate({ …, wages: -50000 })` returns
`payrollTax: -3825` — a negative payroll tax (verified). **Fix:** one `sanitizeHousehold(unknown)` used
by both `parse()` and `load()`; non-negative clamps at the top of `calculate()`; check the stored
version; add a root error boundary.

**M10 — The five biggest healthcare levers are unsourced assumptions the user cannot adjust.**
`src/data/baseline2026.ts:141-142,171,196,226,232` · `src/engine/types.ts:274-281`

`aca.avgOutOfPocket: 1500` ("Not sourced to a single survey"), `medicare.avgOutOfPocket: 4000`,
`employerInsurance.avgOutOfPocket: 1200`, `uninsured.avgOutOfPocket: 2500` ("Not sourced…"), and
`tariffs.pctOfIncome: 0.01` / `maxAnnualCost: 3000` — each can move a household result by four figures,
each is self-labelled as an assumption (which is to the author's credit), and none is exposed in
`Assumptions`, which offers only a `tariffPassThrough` multiplier, not the shape of the incidence curve.
`baseline2026.ts:139` concedes tariffs are regressive while the model makes them exactly proportional.
Also: `benchmarkPremiumAge40: 625 * 12` (`:157-158`) cites `[KFF-BM]`, a generic state-indicator landing
page, for a number every marketplace household depends on; `:136` cites `[TF-TARIFF]`, a tag **not
defined** in the source key at `:8-24`; and `:181` records CBO's work-requirement coverage loss as
"~5.3M by 2034" while `platforms/spending.ts:48` cites CBO for "+7.5M uninsured" on the same law, with
no reconciliation. **Fix:** promote the five to `Assumptions` with documented ranges (`AssumptionsPanel`
already exists), fix the tag, and reconcile the two CBO figures.

**M11 — There is no single place to update for a new tax year.**
Federal 2026 constants are duplicated outside `baseline2026.ts`: `states.ts:18`
`const FED_STD = { single: 16100, mfj: 32200 }` duplicates `baseline2026.ts:53` (verified — will
silently drift); `helpers.ts:64-81` hard-codes CTC dollar amounts and `:85` hard-codes EITC
`phaseOutStart: 13650` / `mfjBonus: 7280` in "2024 dollars"; `personas.ts:38` states `$83,730` in prose
*and* as `52000 + 31730` in data; `data/spending.ts:22,53-59` hard-codes FY2025 constants;
`Methodology.tsx:47,57` inlines the benchmark-premium and tariff descriptions with their citation URLs,
duplicating `baseline2026.ts:16,140`. The year is baked into the module name and export
(`baseline2026.ts` / `BASELINE_2026`, 32 references across 6 files), so rolling to 2027 is a rename, not
a data edit. **Fix:** export a `TAX_YEAR`, re-export `BASELINE` from `src/data/baseline/index.ts`,
import `FED_STD` from the baseline in `states.ts`, and derive the methodology copy from the data.

**M12 — 51 documented state-tax caveats are rendered nowhere.**
`src/data/states.ts` · `src/engine/stateTax.ts:21-22`

Coverage is complete and well sourced — 50 states + DC, 51 rules, all with a `source`, 43 with `notes`
(verified). But `STATE_TAX` is imported only by `src/engine/`; `notes` and `source` appear in **no
component or page** (verified). So the tool silently ships known-wrong state numbers:
`states.ts:48` (AR) "…**so this overstates tax for most filers**"; `:315` (WI) "**overstates the
deduction for most filers**"; `:282` (UT) "6 % taxpayer credit not modeled, **so this slightly
overstates tax**"; `:145` (MD) "County income taxes 2.25–3.20 % excluded — **material**"; `:231` (NY)
"NYC 3.078–3.876 % and Yonkers excluded — **material for NYC residents**"; plus OR, PA, OH, KY, MI in
the same class, and ME/ND/VT/MA admitting stale or unverified values. Additionally `stateTax.ts:38`
collapses filing status to `joint = fs === 'mfj'`, so **`hoh` and `mfs` are entirely unmodelled in all
51 jurisdictions** — a HoH filer gets single brackets and the single standard deduction everywhere, and
this is not in the Methodology exclusions list (`Methodology.tsx:251`). Three graduated rules also carry
a dead `rate` field that `stateTax.ts:44` never reads (`states.ts:103` ID, `:163` MS, `:242` OH).
**Fix:** render `STATE_TAX[state].notes` beside the state-tax line; add a `confidence` so AR/WI/UT can be
flagged as known-biased; model HoH, or document the gap.

**M13 — Attribution runs eagerly for every selected platform on every keystroke.**
*Status 2026-09-09: re-measured at 3.84 ms per keystroke for 8 platforms (the URL cap) with calculate plus attribution. Left eager; not worth the extra memo layer.*
`src/App.tsx:88-100`

`attribute()` does `structuredClone(PolicyParams)` + a full `calculate()` **per position** — 136
apply-positions across the dataset. Measured in Node (verified):

| selection | per keystroke |
|---|---|
| 4 platforms (typical) | **1.75 ms** (18 attribution steps) |
| all 25 platforms | **9.68 ms** |

**Answer to the perf question: it does not currently matter.** Even 25 platforms fits inside a 16 ms
frame in Node; a browser will be 2–4× slower and still survive, and React's render is the larger cost.
But it is pure waste: `attribution` is read only when `explainFor === platform.id`
(`App.tsx:104,196-200`) plus `LeverMatrix`/`BeyondPaycheck`. **Fix:** split `results` (cheap) from a
separate `useMemo` for the one explained platform; memoize `deltasByArea` per platform id for the
matrix; debounce the money inputs ~150 ms. That retires the question permanently.

**M14 — Engine simplifications that deserve a visible "known limitations" list.**
`src/engine/calculate.ts` (various)
- `:243` NIIT is levied on `min(gainsInTaxable, agi − threshold)` — taxable gains, not net investment
  income over MAGI.
- `:160-161` Additional Medicare tax uses `wages + seIncome`, not `seBase` (92.35 %).
- `:280` EITC excludes all MFS filers; post-2021 §32(d)(2) admits some separated spouses.
- `:288` The childless-EITC age window tests `h.age` only, never `spouseAge`.
- `:263` Non-refundable CTC offsets NIIT and surtax (both inside `taxBeforeCredits`), which §26 forbids.
- `:311-313` The tariff rebate is subtracted **every year** and **regardless of the multiplier**;
  Hawley's American Worker Rebate Act is one-time. A 4-child MFJ household under `hawley` gets
  `tariffCost = −3,400` (verified) — tariffs become a $3,400/yr income source.
- `:475-481` `acaNetPremium` hard-codes `fplPct > 400` while the surrounding params are configurable.
- `:423` The Medicaid caretaker exemption keys off `childAges()`, which **defaults missing ages to 8**
  (`:41`), so any household with children and no ages entered is silently exempted from the work
  requirement — a policy assumption hiding inside a padding function.
- `types.ts:26` documents `socialSecurityBenefits` as "**Taxable** Social Security benefits received"
  while `:174` then applies the 85 % inclusion ratio. Either the comment is wrong or benefits are
  under-taxed by 15 %.
- `states.ts:344` lists WI as non-expansion; Wisconsin covers adults to 100 % FPL and has no coverage
  gap, so `calculate.ts:446` puts a Wisconsin household in `coverageGap` incorrectly.

**M15 — Stale comments that contradict the code beneath them.**
`src/data/platforms/helpers.ts:63,70-75`
```ts
/** ARPA-style CTC: $3,000 base ($3,600 under 6 not modeled — no child ages), fully refundable, monthly. */
export function ctcArpa(p) { … p.ctc.youngChildBonus = { amount: 600, underAge: 6 } }  // it IS modeled
```
Stale since commit `56ecd6f` ("Collect child ages"). `:70` documents the American Family Act as
"$3,600 ages 6–17, $4,320 ages 1–5, **$6,360 newborns**" while the implementation has one
`youngChildBonus` tier, so a newborn is credited $4,320 — precision promised in the doc but not in the
code.

**M16 — The five `TARIFF` multipliers are uncited magic numbers driving a top-two lever.**
`src/data/platforms/helpers.ts:95-107`. `repeal: 0.25`, `targeted: 0.5`, `keep: 1`, `expand: 1.25`,
`none: 0`, used 24 times across the three platform files, with no `Citation` and no derivation — unlike
every other number in the dataset. `App.tsx:238-244` is admirably honest that they are "our judgment,
not sourced figures", but that honesty lives only in the methodology prose, not in the data. The
`repeal` docstring at `:96` ("Repeal the 2025+ tariffs; only the pre-2025 Section 301 China tariffs
remain") is also stale against `baseline2026.ts:136-138`, which says the IEEPA tariffs were *already*
struck down in February 2026 and the $840 baseline already reflects only the survivors. **Fix:** attach a
`Citation` and a one-line derivation to each multiplier, and rewrite the docstring against the current
baseline.

### React and UI

**M17 — Nothing below `App` is memoized, and the expensive work is in the leaves.**
*Status 2026-09-09: dataset counts moved to module constants; `resolvedSpending` now runs once per platform in `BeyondPaycheck` and `Verdict`; persona matching compares fields instead of JSON strings. The remaining items are cosmetic at current sizes.*
Zero `useCallback` and zero `React.memo` in all of `src/`. Every keystroke re-renders `ResultsView`
(364 lines), `LeverMatrix`, `BeyondPaycheck`, `AssumptionsPanel` and the 57-line inline `Methodology`.
- `BeyondPaycheck.tsx:138` calls `resolvedSpending(platform, all)` **inside a nested map** — 7 categories
  × N platforms — and again at `:175`: ~40 inheritance-chain walks plus Map allocations per keystroke.
- `App.tsx:111-112` — `politicianCount`/`sourceCount` rebuild `flatMap(flatMap(map))` + a `Set` over
  module-constant data on every render. Move beside `PLATFORM_IDS` (`:34`).
- `HouseholdForm.tsx:39` — `PERSONAS.find(p => JSON.stringify(p.household) === JSON.stringify(value))`:
  six serializations per render, key-order fragile (reordering the `Household` literal silently breaks
  persona highlighting). `PERSONAS.find` runs again at `:73`.
- `ResultsView.tsx:41-47` — `sorted`, `rows`, `maxAbsDelta` rebuilt every render.
- `Verdict.tsx:11,15` — `resolvedSpending` called twice on the same platform in one function.
- `AssumptionsPanel.tsx:14` — dirty-check via `JSON.stringify` on a three-field object.

**M18 — `PositionsPanel`'s dialog effect depends on an unstable callback.**
`src/components/PositionsPanel.tsx:92` · `src/App.tsx:214`. `}, [onClose])` with
`onClose={() => setPositionsFor(null)}` — a fresh closure per App render. Any App re-render while the
drawer is open tears the effect down and back up: restore `body.overflow`, call `opener?.focus?.()`
(yanking focus *out* of the dialog), re-lock scroll, re-focus `focusables()[0]`. It escapes notice only
because the focus trap makes App re-renders rare while open. **Fix:** `useCallback` in App; split into a
scroll-lock effect (`[]`) and a key-handler effect (`[onClose]`).

**M19 — `useMemo(load, [])` at `App.tsx:66` is wrong, and the linter already says so.**
oxlint flags this exact line. `useMemo` is a hint, not a guarantee; `load()` reads
`window.location.search` and `localStorage`, so a re-run after the URL has been rewritten (B4) yields a
*different* result, and it runs twice under `StrictMode`. **Fix:** `const [saved] = useState(load)`.

**M20 — Three segmented controls; only one implements the ARIA pattern it claims.**
`AssumptionsPanel.tsx:104-159` is correct (roving `tabIndex` `:135`, arrow/Home/End `:137-151`).
`ThemeToggle.tsx:20-32` uses `role="radio"` with **no `tabIndex`** and **no `onKeyDown`** — three tab
stops, dead arrow keys. `ResultsView.tsx:82-92` has the same defect on the sort control. **Fix:** extract
`Segmented` into `src/components/Segmented.tsx` and use it in all three; this also kills three of the
duplicated class strings in the Nit section.

**M21 — Disclosure buttons carry no `aria-expanded`/`aria-controls`.** `aria-expanded` appears **zero
times** in `src/`. `ResultsView.tsx:254-261` is a custom accordion whose only state affordance is a
`+`/`−` glyph at `:260` rendered in `text-ink-4` (M24). **Fix:** `aria-expanded` + `aria-controls`, or
`<details>/<summary>` as sibling code already uses.

**M22 — `WhyPanel` tooltips are mouse-only.** `WhyPanel.tsx:134-136` uses `onMouseEnter`/`onMouseLeave`
on an `<li>`; the revealed content at `:161-168` ("Running total after this step…") is unreachable by
keyboard and by touch. **Fix:** make each bar row a `<button>` with `onFocus`/`onBlur`.

**M23 — `MobileSummary` is an `aria-live` region full of animated numbers.** `MobileSummary.tsx:16` —
`role="status" aria-live="polite"` around three `Money`/`Delta` components, so every keystroke in a wage
field re-announces the whole summary. That is a screen-reader denial-of-service on the primary input
path. **Fix:** drop `aria-live` from the container; announce one debounced sentence in a dedicated
visually-hidden live region.

**M24 — `text-ink-3` / `text-ink-4` fail WCAG AA.** `index.css:23` `--color-ink-3: oklch(0.58 …)`
≈ 4.2:1 on white, used for small text in **82 places**. `index.css:24` `--color-ink-4: oklch(0.75 …)`
≈ 2.2:1, used for real text at `ResultsView.tsx:260`, `:340-344` (`text-[10px]` scale labels) and
`HouseholdForm.tsx:265`. **Fix:** darken `--color-ink-3` toward L 0.50; restrict `--color-ink-4` to
borders and dividers.

**M25 — Tables have no `scope` and no row headers.** `scope=` appears zero times in `src/`. In
`ResultsView.tsx:211-216` the column headers lack `scope="col"`, and the label column is a `<td>`
(`:227,235,299`) where `<th scope="row">` belongs. Same in `LeverMatrix.tsx:46,73` and
`BeyondPaycheck.tsx:134`. A six-column comparison table with no headers is unnavigable in table-reading
mode. Add `<caption class="sr-only">`.

**M26 — Flash of light theme, plus a light/dark mismatch before JS runs.**
`ThemeToggle.tsx:12` (`useEffect(() => initTheme(), [])`) · `index.html` · `index.css:139-149`.
Nothing stamps `data-theme` before React mounts, so dark-mode users get a white flash; worse,
`index.css:143-147` sets `color-scheme: dark` from a pure media query while the token block at
`:148-149` requires the JS-applied `.system-dark` class, so between paint and hydration you get
dark-rendered form controls on a light page. It also couples a global document concern to one leaf
component. **Fix:** a 4-line blocking script in `<head>` that reads `wwip:theme` and stamps
`data-theme`/`.system-dark` before the stylesheet.

**M27 — "Save as image" silently does nothing when no platform is selected.**
`App.tsx:183,212` · `ShareBar.tsx:18,81`. `ShareCard` mounts only when `results.length > 0`, but
`ShareBar` always receives `imageNode={shareCardRef}` — a truthy ref object — so the button renders and
`saveImage` exits at `if (!node) return` with no state change and no message. **Fix:**
`imageNode={results.length ? shareCardRef : undefined}`.

**M28 — The share-image flow swallows every error, and ships a soft image.** `ShareBar.tsx:22,28-32,34-35`
- `catch { /* cancelled or unsupported */ }` covers a failed dynamic import, `domToBlob` throwing
  (`SecurityError` on a tainted canvas), an unsupported `File` constructor, *and* a genuine user cancel —
  identically. Distinguish `AbortError`; surface the rest.
- `scale: 1` on a 1200×630 card is visibly soft on every retina device — use `devicePixelRatio`.
- `backgroundColor: '#faf9f6'` is hard-coded light and duplicates `ShareCard.tsx:22-26` — two sources of
  truth for the same five colors, and a dark-mode user gets a light card.
- The `<a>` is never appended to the DOM before `.click()` — historically unreliable in Safari.
- `ShareCard.tsx:20` `.slice(0, 5)` silently drops platforms 6+ with no "+3 more", so the picture
  misrepresents the comparison it links to.

**M29 — Cleared number inputs snap to `0`.** `HouseholdForm.tsx:219` —
`Number(value.replace(/[^0-9]/g,'')) || 0`. Select-all-delete in "Your age" commits `0` and re-renders as
`"0"`, so you cannot clear-then-retype; same at `:126` for child ages. `IntField` has no upper clamp
either: age accepts `999`, `otherDependents` is unbounded (only `childrenUnder17` is capped, at `:106`).
**Fix:** mirror `MoneyField`'s `draft` pattern — raw string in local state, commit on parse, coerce on
blur.

**M30 — Permalinks are not stable across deploys.** `urlState.ts:38-44` omits any field equal to
`defaults`, and `defaults` is `PERSONAS[0].household` (`App.tsx:25`). Editing the first persona silently
changes what every previously shared link decodes to — a data-integrity bug for a product whose promise
is "this comparison has its own link" (`ShareBar.tsx:67`). Related: `urlState.ts:48`
(`if (state.selected.length)`) makes an intentionally empty selection unrepresentable, so "Clear
selection" (`PlatformPicker.tsx:80`) yields a URL that reloads back to the saved selection. **Fix:** a
frozen, versioned `URL_DEFAULTS` decoupled from `PERSONAS`; write `p=` explicitly.

**M31 — Methodology anchors are dead, and the skip link navigates you off the page.**
`Methodology.tsx:95` builds `href={\`#/methodology${href}\`}` → `#/methodology#how`; the fragment is the
literal string `/methodology#how`, no element has that id, nothing scrolls, and the `scroll-mt-20` at
`:321` / `scroll-padding-top` at `index.css:60` exist for a scroll that never happens. Conversely
`App.tsx:120` `<a href="#main">` sets `location.hash = '#main'`, `useHashRoute` fires, `isMethodology`
flips false, and the methodology page **unmounts**. Same at `Verdict.tsx:83` (`href="#beyond-h"`).
**Fix:** namespace in-page anchors under the route, or handle with `preventDefault` + `scrollIntoView` +
`tabIndex={-1}` focus.

**M32 — `.no-print` doesn't hide anything.** `index.css:123-127` sets only
`position: static !important` — never `display: none`. `MobileSummary`, `ShareBar` (including the Print
button) and the sort control all print. Meanwhile `ShareCard` is `position: fixed; left: -20000px`
(`ShareCard.tsx:32-34`) with **no** `.no-print` class, so it stays fixed and can emit a blank trailing
page. **Fix:** `@media print { .no-print { display: none !important } }` and add the class to `ShareCard`.

**M33 — No Open Graph / Twitter metadata despite shipping a 1200×630 share card.** `index.html:1-14` has
no `og:title`, `og:description`, `og:image`, `twitter:card`, canonical URL, `theme-color`,
`color-scheme` meta or `<noscript>`. A shared permalink unfurls as a bare link. The description also
says "2028 presidential hopefuls" while in-app copy says "politicians" throughout. **Fix:** add the OG
block with a `/og.png` rendered once at build time.

### Testing, tooling and repo

**M34 — The suite is engine-only: no component tests, no output snapshots, no data lint, no CI.**
24 tests, all pure functions. Missing:
- **T1 — data lint** (would have caught B5, B6, M6): every position has ≥1 citation; every URL is
  `https?` and has a path beyond `/`; every citation has a `date`; no duplicate `area` within a
  platform; every `inheritsFrom` resolves; every `kind: 'politician'` has an avatar file and a matching
  id in `scripts/avatar-sources.json` (20 = 20 today, verified); no two platforms produce identical
  parameter bundles; `resolvedPositions ≡ effectivePositions`; no position writes an assumption-owned
  path or a path outside its own area.
- **T2 — golden outputs**: snapshot `{netIncome, federalIncomeTax, healthcareCost, effectiveCoverage}`
  for 5 personas × 25 platforms. `platforms.test.ts:35-49` only asserts `Number.isFinite` and
  `console.log`s the interesting part — a smoke test wearing a snapshot's clothes.
- **T3 — urlState edge cases**: two tests today (`urlState.test.ts:10,25`). Missing: absurd numbers
  (M8), tracking params (B3), hash preservation (B4), duplicate ids (`?p=aoc,aoc` → two identical
  columns and duplicate React keys), `ka` length ≠ `k`, and a `parse(serialize(x)) === x` property test.
- **T4 — attribution `zeroReason` across areas**: I probed 4 households × 25 platforms and nothing fell
  through to the generic `'No effect on your household.'` — good, but nothing locks it in.
- **T5 — component tests**: zero. Minimum: `HouseholdForm` number parsing (`"52k"` → 52000,
  `HouseholdForm.tsx:31-32`), the `PositionsPanel` focus trap/return, `ShareBar`'s clipboard fallback.

**Minimal CI** — `.github/workflows/ci.yml`, on push and PR, Node 22: `npm ci` →
`npx tsc -b --noEmit` → `npm run lint -- --max-warnings=0` → `npm test` → `npm run build`, plus
`npm audit --audit-level=high`, plus a separate `data` job running T1 so dataset PRs fail loudly.
Upload `dist` as an artifact so reviewers can diff bundle size. Given the subject matter, also publish a
short **editorial policy** (what makes a citation acceptable, what the confidence levels mean, how
partisan balance is maintained) — it is the first question every contributor and every critic will ask.

**M35 — `scripts/fetch-avatars.mjs`: arbitrary file write from JSON, unencoded URL interpolation, no
rate-limit handling.**
- **Path traversal** `:88-89` — `path.join(outDir, \`${p.id}.webp\`)` with `p.id` read straight from
  contributor-editable `avatar-sources.json`. An `id` of `"../../src/App"` writes outside
  `public/avatars/`. Validate `/^[a-z0-9][a-z0-9-]{0,31}$/`.
- **Unencoded URL interpolation** `:69` — `` `…/original/${p.bioguide}.jpg` `` with `redirect: 'follow'`
  (`:29`). `encodeURIComponent` plus a `/^[A-Z]\d{6}$/` assertion.
- **User-Agent unvalidated** `:26` — `cfg.userAgent`; if the key is missing, Node's default UA is sent,
  which Wikimedia blocks. The current value (`avatar-sources.json:3`) is correct and policy-compliant.
  Assert it is non-empty and contains a URL.
- **No retry/backoff** `:29-31` — any non-2xx throws, so a `429` becomes a per-person failure while the
  loop keeps issuing requests. Honour `Retry-After`, add `maxlag`, add an inter-request delay.
  (Wikimedia etiquette is otherwise respected: serial downloads at `:65`, one batched metadata call.)
- **No response size cap** `:31` — `Buffer.from(await res.arrayBuffer())` on a Commons *original*
  (routinely > 50 MB) straight into `sharp`.
- **Broken root resolution** `:18` — `new URL('..', import.meta.url).pathname` is percent-encoded and
  yields `/C:/…` on Windows. Use `fileURLToPath`.
- **Markdown injection** `:48,121` — Commons `Artist` values are stripped of HTML then written verbatim
  into a Markdown table; a `|` in an artist name breaks `CREDITS.md`.
- **Credits written on failure** `:105-131` run before `:133`'s `process.exit(1)`, so a partial run
  rewrites `CREDITS.md`/`CREDITS.json` and then exits non-zero.
- The User-Agent hard-codes a personal Gmail address in a file about to be public; consider a role
  address or the repo's issues URL.

**M36 — Contributors cannot add a politician from the README.** `README.md:17-19` describes the *type*,
not the *procedure*. The real procedure is six steps, none documented: (1) add a `Platform` object in
`democrats.ts`/`republicans.ts` — split by party, so Sanders the independent lives in `democrats.ts`;
(2) **append it to the exported array at the bottom** (`democrats.ts:381` / `republicans.ts:281`) — easy
to miss and silently produces nothing; (3) pick an `inheritsFrom` from `parties.ts:188`; (4) optionally
add a `SPENDING[id]` block in `platforms/spending.ts:45` — keyed by untyped `string`, so a typo is
silently dropped; (5) add a matching id to `scripts/avatar-sources.json` and run the fetch script;
(6) know that `Avatar.tsx:37` derives the image path from `platform.id` by convention with a silent
initials fallback if the file is missing. Nothing enforces 4–6. Also undocumented: when to use `pos` vs
`note` vs `hold` (`helpers.ts:6-22`, a subtle and load-bearing distinction — and `note()` is a pure
alias for `pos()` with no type-level enforcement), what the confidence ladder means (documented only
inside `App.tsx:262-266`), and how to roll the baseline to a new tax year. **Fix:** `CONTRIBUTING.md`
with a worked example and a baseline-roll checklist; derive a `PlatformId` union so step 4 is
typo-checked; tests that make 4–6 fail loudly.

**M37 — Dead and unused artifacts shipped in git.**
- `public/avatars/*-64.webp` — 20 files, ~80 KB, generated at `fetch-avatars.mjs:89` and referenced
  **nowhere** (verified). Meanwhile `Avatar.tsx:37` always requests the 256 px image while
  `PlatformPicker` renders ~21 of them at `size={28}` and `BeyondPaycheck` at `size={24}` — roughly
  150 KB of avoidable image bytes on first paint. **Fix:** use them via `srcSet`.
- `src/assets/hero.png` (13 KB) and `src/assets/vite.svg` (8.7 KB) — scaffold leftovers, zero references
  (verified). Delete.
- `deductions.charitableNonItemizer` — defined at `types.ts:131` and `baseline2026.ts:107-108`, read
  **nowhere** in the engine (verified); the comment concedes "not applied in the engine yet", and it is
  absent from the Methodology exclusions list.
- `PolicyParams.caveats` — plumbed through (`calculate.ts:314`) but empty for every platform (verified);
  the Libertarian "what replaces the abolished programs" caveat is referenced in `App.tsx:255` and not
  present in the data.

**M38 — 43 % of shipped font bytes are alphabets this app cannot render.** `package.json:9-10` ·
`dist/assets/*.woff2`. 13 files, 390 kB; 169 kB is Cyrillic, Cyrillic-ext, Greek, Greek-ext and
Vietnamese subsets of Inter and Source Serif 4, because `@fontsource-variable/*` imports every subset by
default. `unicode-range`-gated so they don't block paint, but they are in the deploy and every clone.
**Fix:** import the latin subsets explicitly. While there: 128 kB gzip of JS for a calculator over 25
static platforms is heavy — `docs/research/06-ui-research.md:5` records the pre-redesign build at 96 kB
gzip, so tier 2/3 cost +32 kB. NumberFlow (44 kB installed, animating ~6 numbers) is a taste call I would
push back on for v1; `modern-screenshot` is correctly dynamic-imported into its own 9.35 kB gzip chunk
and is justified.

---

## Minor

### App / state
- `App.tsx:68-72` — five `useState` plus one in `useHashRoute`; `setPositionsFor` is drilled into
  `ResultsView` (`:190`), `WhyPanel` (`:195`), `LeverMatrix` (`:200`) and `BeyondPaycheck` (`:202`) —
  four paths for one modal. `positionsFor`/`explainFor` are UI routing state. Use `useReducer` for
  `{household, selected, assumptions}` (they change and serialize together) plus a panel context.
- `App.tsx:76-81` — localStorage is written on **every keystroke**; only the `replaceState` is debounced
  (`:83`). Move the write inside the same timeout.
- `App.tsx:227` — a local `Methodology` component shadows the imported `MethodologyPage` (`:15`); two
  surfaces with overlapping copy that will drift.
- `App.tsx:213` — `ShareCard` is mounted off-screen whenever results exist, so the whole card re-renders
  on every keystroke though it is only rasterized on demand.
- `App.tsx:114-116` — `householdLabel` sums `wages + (mfj ? spouseWages : 0) + selfEmploymentIncome`:
  drops spouse wages for MFS (B1), ignores gains, Social Security and tips. It is burned into the share
  image (`ShareCard.tsx:52`), so the picture claims an income the calculator didn't use.
- `App.tsx:220-224` — `usdShort` lives at the bottom of `App.tsx` while `usd`/`pct` are in `lib/format.ts`.
- No `popstate` listener: all URL writes use `replaceState`, so Back never undoes a comparison — it
  leaves the site; and `parse` runs only at mount, so pasting a new permalink into the same tab does
  nothing.
- No error boundary anywhere in `src/` (see M9).

### Components
- `ResultsView.tsx:30,33,34` — `expanded`, `guesses` and `revealed` are keyed by platform id and never
  pruned on deselect; deselect and reselect and a stale guess reappears.
- `Verdict.tsx:7` imports `PLATFORMS` directly while receiving `results` as a prop — a hidden dependency
  that makes the component untestable in isolation. Pass `all`, as `BeyondPaycheck` does.
- `PositionsPanel.tsx:95` — `positions.sort(…)` mutates during render. Safe today (fresh array), one
  memoization away from a bug. `[...positions].sort()`.
- `PositionsPanel.tsx:64` — the focus-trap selector omits `input`, `select`, `textarea`,
  `[contenteditable]` and doesn't filter hidden elements; `focusables()` re-queries the DOM on every Tab
  in a panel with ~200 links.
- `PositionsPanel.tsx:61` — naive scroll lock: no scrollbar-width compensation (the page jumps
  horizontally on desktop) and no iOS Safari background-scroll prevention.
- `PositionsPanel.tsx:99,103` — click handler on a non-interactive backdrop `div` with no keyboard
  equivalent; `stopPropagation` at `:103` means a text-selection drag ending outside the panel closes it.
- `WhyPanel` gets no focus management: opened from `ResultsView.tsx:168-178` (which correctly uses
  `aria-pressed`), never focused, never announced; its close button (`WhyPanel.tsx:40`) doesn't return
  focus to the trigger.
- `WhyPanel.tsx:51` — `key={i}` over a list **sorted by `Math.abs(delta)`**, while `hover` (`:24`) stores
  an index into that same array; the highlight desyncs on re-sort. Key by `s.position.area`.
- `HouseholdForm.tsx:117` — `key={i}` on child-age inputs; shrinking the count leaves the DOM node in
  place with a new value and strands focus.
- `PlatformPicker.tsx:62` — `ring-white/60` hard-codes white on a `oklch(0.2 …)` card in dark mode. Use
  `ring-card`.
- `PlatformPicker.tsx:49-50` — `aria-pressed` plus an `aria-label` ending in `, selected`: a screen
  reader says "…, selected, pressed".
- `AssumptionsPanel.tsx:115,129-131` — the `refs.current` array is never trimmed, and the ref callback is
  a fresh closure each render, so React detaches/reattaches every ref on every render.
- `Avatar.tsx:29-33` — the whole avatar is `aria-hidden` with `alt=""`; correct only if the name is
  always adjacent. Verify for `LeverMatrix` column heads and `MobileSummary`.
- `ShareBar.tsx:68-75` — `aria-live="polite"` on the button itself, whose accessible name mutates
  "Copy link" → "Copied ✓". Static label + a separate `role="status"` sr-only span.
- `ShareBar.tsx:53` — `window.prompt()` as the clipboard fallback; should be a selectable read-only input.
- `Methodology.tsx:66-71` — runtime `fetch('/avatars/CREDITS.json')` for data that is static at build
  time and already committed; no `AbortController` (so `setCredits` fires on an unmounted component), and
  a 500 maps to `{}`, rendering an empty credits table. For CC BY-SA images that is an attribution
  failure, not a cosmetic one. Import the JSON.
- `main.tsx` is the unmodified Vite template: no error boundary, no root-not-found guard.

### Engine / data / lib
- `attribution.ts:57` — `Math.abs(delta) < 0.5` is an unnamed magic threshold (dollars per year).
- `attribution.ts:65` — `final: prevResult` is the *baseline* result (`platformId: 'baseline'`) if a
  platform has no `apply` positions. No platform hits this today (verified), but the field is then a lie.
- `attribution.ts:92` — `after.incomeTax.surtaxes.find(s => !before.incomeTax.surtaxes.includes(s))`
  compares by object identity across a `structuredClone` boundary, so `includes` is always false and the
  first surtax is always reported as new. Compare by value.
- `calculate.ts:261` — `Math.max(0, Math.ceil(Math.max(0, x) / 1000))`: the outer `Math.max` is dead.
- `types.ts:209-220` — `SinglePayerParams` ends with an orphan doc comment for a member that doesn't
  exist; the closing brace is next.
- `types.ts:285` — `Confidence` includes `'default'`, a *presentation* state assigned at
  `calculate.ts:115`. UI state in the data vocabulary; `inherited` already exists at `types.ts:305`.
- `baseline2026.ts:150-154` — `applicablePct` encodes a step with a duplicate x-value
  (`[133, 0.021], [133, 0.0314]`); `interpolate` (`calculate.ts:25-36`) returns the first matching
  segment, so `x === 133` resolves to 0.021 and the `if (x1 === x0) return y1` guard at `:31` is dead for
  this input. Correct behaviour, accidental mechanism, no boundary test.
- `helpers.ts:63-81` — `ctcArpa`, `ctcAmericanFamilyAct` and `ctcHawley` are token-identical bodies
  differing in two numbers each. Collapse to `ctcFlat(amount, bonus?)`.
- `helpers.ts:87` — `childlessMaxAge = 200` as a sentinel for "no cap". Use `Infinity`.
- `democrats.ts:7-10` / `parties.ts:67-70` / `parties.ts:103-106` — the same medicaid change spelled
  three ways (a local helper in a data file, and two inline blocks in opposite order). They commute, so
  no bug — but move `reverseHealthCuts` into `helpers.ts` and use it in all three.
- `democrats.ts:7` — inline `import('../../engine/types').PolicyParams` in a file that already has a
  top-level `import type` block.
- `republicans.ts:63-66` — Rubio's `single`, `mfs` and `hoh` bracket tables are three byte-identical
  literals. HoH under Rubio–Lee does not share single's thresholds and MFS conventionally halves MFJ;
  either build from one array with a per-status factor, or say so in the summary (`:60`).
- `republicans.ts:181-187` — Paul's summary says "$15,000 per filer plus $5,000 per person" while the
  code sets `standardDeduction {single: 20000, mfj: 40000, …}` + `dependentExemption: 5000`. The
  arithmetic is right; nothing in the prose lets a reviewer check it. Add the `15000 + 5000` comment.
- `platforms/index.ts:15-18` — `spending: SPENDING[p.id] ?? p.spending` lets spending be declared in two
  places with the former silently winning; `Platform.spending` is never populated inline by any platform.
  `SPENDING` is also keyed by untyped `string` (`platforms/spending.ts:45`), so a typo'd key is silently
  dropped (14 keys, 0 orphans today — verified). Derive `PlatformId` and delete the fallback.
- `states.ts:344` — `NON_EXPANSION_STATE_CODES` is a bare `string[]` whose "as of August 2026" date lives
  only in a comment (`:340`); make the date machine-readable and type it to the state codes.
- `engine/spending.ts:4-13,20-28` — `SCORER_LABEL` and `SPENDING_CATEGORIES` are UI copy living inside
  `src/engine/`. Move to `src/data/`.
- `lib/format.ts:5` — `usd(-0.4)` renders `−$0`; round before signing. Also U+2212 for negatives but
  ASCII `+` for positives (`:6`) — mismatched glyph weights in a `tabular-nums` column. Use `Intl`'s
  `signDisplay`. `engine/spending.ts:53` hand-rolls the same minus sign.
- `urlState.ts:82-84` — `p` is not de-duplicated (`?p=aoc,aoc` → two identical columns, duplicate React
  keys) and is uncapped. `[...new Set(...)]`, cap at ~8.
- `urlState.ts:75-81` — `ka` is filtered element-wise, so `?ka=5,abc,7` yields `[5,7]` and `childAges()`
  silently pads the missing child to 8. Reject the parameter when its length ≠ `k`.

### Tooling / repo
- `.oxlintrc.json` enables two rules. For a public repo turn on the `correctness` and `suspicious`
  categories, add `jsx-a11y` and `react-hooks/exhaustive-deps`, and run `--max-warnings=0` in CI so the
  six current warnings can't grow.
- `.gitignore` has no `.env*`, `coverage/`, `*.tsbuildinfo` or `.claude/`. Nothing bad is tracked today,
  but the guard is free.
- `package.json:6-12` — no `typecheck` script (`tsc -b --noEmit`), no `avatars` script (so
  `fetch-avatars.mjs` is undiscoverable), no `test:watch`; `lint` doesn't fail on warnings. `private:
  true` and `version: 0.0.0` are defensible for an app rather than a package, but the dataset is dated
  content — `0.1.0` driven by `data/changelog.ts` would be more honest. `engines` is absent while the
  script uses top-level `await`; add `"node": ">=20"` and a `.nvmrc`.

---

## Nit

- `App.tsx:28,139,213,277` — four hand-maintained copies of one date: `MODEL_UPDATED = '2026-09-08'`, the
  visible `Sept 8, 2026` one line from `dateTime={MODEL_UPDATED}`, `date="Sept 2026"`, and "as of
  September 2026". Derive them all.
- `App.tsx:271` — `href="/avatars/CREDITS.md"` renders as raw Markdown or downloads; the methodology page
  already renders these credits as a table (`Methodology.tsx:271-314`).
- `App.tsx:171` `<section className="space-y-6">` and `ResultsView.tsx:50` have no accessible name, so
  they are `<div>`s to assistive tech.
- Pseudo-headings: `ResultsView.tsx:248` "Line-item detail", `BeyondPaycheck.tsx:112`,
  `PositionsPanel.tsx:159,199` are styled `<div>`s where an `<h3>` belongs — gaps in the outline.
- `calculate.ts:402` — a comment explaining the absence of code. Fold it into the block above.
- `index.css:64` — `@custom-variant dark` is dead (`dark:` appears nowhere in `src/`) and its comment
  ("Reserved for a later dark theme") is stale since the dark theme lives 76 lines below. Worse, the
  variant matches only `[data-theme="dark"]`, so any future `dark:` utility silently fails in
  system-dark mode, which keys off `.system-dark` (`:149`).
- `index.css:79` — `--viz-grid` is defined and never consumed; `.viz-root` (`WhyPanel.tsx:27`,
  `LeverMatrix.tsx:22`) exists only to declare it.
- `index.css:134` — `.card` is defined only inside `@media print` yet used as a class on ~10 elements
  where it does nothing on screen. Promote it or rename it `print-block`.
- Duplicated Tailwind strings: `card rounded-card border border-rule bg-card p-{4,5}` — **9 copies**
  (`App.tsx:166,172,177,228`, `WhyPanel.tsx:27`, `BeyondPaycheck.tsx:39`, `LeverMatrix.tsx:22`,
  `ResultsView.tsx:105,207`); `text-xs font-semibold uppercase tracking-wide text-ink-3` — **11 copies**;
  the segmented shell and item strings — 3 each (M20); the ghost-button string — 4.
- Magic numbers: `App.tsx:85` (300 ms), `ShareBar.tsx:32,43` (5000/2000 ms),
  `ResultsView.tsx:47,155,156` + `WhyPanel.tsx:130` + `ShareCard.tsx:59` (the `* 50` diverging-bar math,
  three copies — extract `divergingBar(delta, maxAbs)`), `ResultsView.tsx:332-334`,
  `HouseholdForm.tsx:106,107,122,125` (default child age `8`, three copies), `urlState.ts:72` (`1e9`),
  `Avatar.tsx:71` (the allowed-hue array), the `min-w-[560px]`/`min-w-[640px]` literals.
- `BeyondPaycheck.tsx:68,83` — a generated palette (`oklch(${0.8 - i*0.04} 0.04 ${200 + i*12})`) over 12
  `RECEIPT` rows: adjacent slices at C = 0.04 are barely distinguishable, several are under 1 % width so
  they render sub-pixel, each of the 12 divs adds a `border-r` on top of its percentage width
  (overflowing 100 %), and color is the sole encoding apart from a `title`.
- `title` as the only affordance at `BeyondPaycheck.tsx:86,123,134` (no `sr-only` companion, unlike
  `:152` and `LeverMatrix.tsx:63`, which do it correctly) — invisible on touch and to keyboard users.
- `data/spending.ts:46` — `npp(2.3 + 0.77 + 0.93 + 0.8)` inlines four unlabelled NPP subcategories into
  one arithmetic expression, with an empty `detail` unlike its neighbours.
- `platforms/spending.ts:43` — `VANCE_WALL` is the only spending citation with no `date` (1 of 46; all 46
  have ≥1 citation and every URL is http(s) — otherwise clean).
- `personas.ts:73` — labelled "High earners" while every sibling label is a singular noun phrase.
- External-link audit: all nine `target="_blank"` anchors carry `rel="noreferrer"` and are safe
  (`PositionsPanel.tsx:136,184`; `BeyondPaycheck.tsx:96,198`; `Methodology.tsx:140,185,222,295,304`).
  House style at most shops is `rel="noopener noreferrer"` for explicitness, and none carries an "opens
  in a new tab" affordance — a WCAG 3.2.5 concern across ~200 citation links.
- Copy buried in components, each needing a deploy to fix a typo: `App.tsx:226-283` (~1,400 words of
  policy prose inside `App.tsx`); `Methodology.tsx:22-62` (`PARAMS` as positional 4-tuples interleaving
  copy, computed values and URLs); `BeyondPaycheck.tsx:43-46,93-107,163-167`;
  `AssumptionsPanel.tsx:38,53,69`; `Verdict.tsx:20-24,41-44,57-60,67-88` (sentence templates assembled by
  concatenation, with English grammar rules in `list()` at `:26-30` — the only i18n-hostile code in the
  app); `WhyPanel.tsx:32-34,108-111`; `ResultsView.tsx:303`; `PositionsPanel.tsx:145,148,151`. Move to
  `src/content/`.
- The `only-export-components` warnings are a real coupling problem, not lint noise: `ShareCard.tsx:5`
  imports `AREA_PHRASE` from `PositionsPanel`, pulling the whole 211-line drawer module into that chunk;
  `Verdict`, `LeverMatrix`, `WhyPanel` and `Methodology` do the same. Move `PARTY_DOT`, `PARTY_NAME`,
  `AREA_LABEL`, `AREA_PHRASE` and `parseMoney` to `src/lib/labels.ts`.
- `README.md` has no screenshot, no demo link, no badges, and no "how to update the baseline" section.
  For a product whose pitch is visual, the README should open with the screenshot.
- `docs/research/*.md` headers advertise the tooling that produced them ("Opus subagent, ~16 searches")
  and their own coverage gaps. Useful internally; rewrite as neutral provenance notes before publishing.

---

## Punch list — top 15 before publishing

| # | Item | Where | Est. |
|---|---|---|---|
| 1 | `"strict": true`; fix the fallout | `tsconfig.app.json` | 3 h |
| 2 | Cite or delete the 15 uncited positions; resolve the 11 bare-homepage links; replace or tier-mark the 8 Wikipedia citations | `data/platforms/*.ts` (lists in B5) | 5 h |
| 3 | Data-lint test: citations, URL paths, dates, dup areas, avatar exists, `inheritsFrom` resolves, **no two platforms produce identical bundles**, `resolved ≡ effective`, no cross-area or assumption-owned writes | new `src/data/__tests__/dataset.test.ts` | 2 h |
| 4 | Fix or hide MFS spouse income/age; test per filing status | `HouseholdForm.tsx:38,97,139`; `calculate.ts:46,146,180,374` | 2 h |
| 5 | Differentiate or label the 7 duplicate platforms; decide what DeSantis/`party-gop` = current law should say in the UI | `data/platforms/*.ts`; `PlatformPicker`/`ResultsView` | 4 h |
| 6 | `LICENSE` (MIT) + `package.json` metadata + a separate data/photo license statement; resolve the CC BY-SA avatar | root; `README.md:23` | 1 h |
| 7 | Fail the avatar license gate closed (allowlist, missing-metadata throw, license-match assertion) | `scripts/fetch-avatars.mjs:57,75` | 1 h |
| 8 | Ignore unknown query params in `parse()` so `?fbclid` stops wiping saved state | `urlState.ts:57-59` | 20 m |
| 9 | Preserve the hash in `permalink()` so methodology links survive | `urlState.ts:99`; `App.tsx:83-85` | 30 m |
| 10 | Real GitHub URL with `target="_blank" rel="noreferrer"` | `App.tsx:150` | 5 m |
| 11 | Price coverage per adult for mixed-age households | `calculate.ts:373-400` | 3 h |
| 12 | Split the cross-area closures (Paul, Libertarian) so the bridge attributes correctly | `republicans.ts:168-180`; `parties.ts:128-138` | 1 h |
| 13 | Clamp `childrenUnder17`/`otherDependents`/`age` per field; de-dupe and cap `p` | `urlState.ts:71-84` | 45 m |
| 14 | Minimal CI: `tsc -b`, `oxlint --max-warnings=0`, `vitest run`, `vite build`, plus the data job | `.github/workflows/ci.yml` | 1 h |
| 15 | Close the 8 "verify before shipping" items, or demote and mark those positions unverified in the UI | `docs/research/04-positions.md:49-58` | 4 h |

Straight after the launch cut: `CONTRIBUTING.md` with the six-step "add a politician" recipe (M36);
render the 51 state-tax caveats and model HoH (M12); gate guess-mode on every surface or drop it (B12);
collapse `effectivePositions` into `resolvedPositions` (M4); make `applyAssumptions` pure and share one
`evaluate()` between the headline and the bridge (M3); validate localStorage and add an error boundary
(M9); inline theme boot script, OG meta and a working `.no-print` (M26, M33, M32); extract `Segmented`
and fix the three ARIA controls (M20); lazy attribution plus input debounce (M13); golden-output
snapshots (T2). Then take the schema decision in M2 deliberately, before the dataset grows past 25
platforms and the migration cost compounds — that one is the difference between a clever prototype and a
dataset other people can build on.
