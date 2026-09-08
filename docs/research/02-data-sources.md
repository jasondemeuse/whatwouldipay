# Data-source research: politicians' tax & healthcare policy positions

Research date 2026-09-08 (Opus subagent, ~25 searches + ~25 page fetches).

## Verdict

**Is there a single database with per-politician numeric policy parameters? No, and nothing close.** The landscape splits into two halves nobody has joined:

- **Per-politician, structured, non-numeric:** Vote Smart's Political Courage Test API (checkbox stances), Ballotpedia paid bulk data (free-text quotes and survey responses), OnTheIssues and iSideWith (stance grids, no data access).
- **Numeric, per-plan, locked in prose:** Penn Wharton, Tax Foundation, Tax Policy Center, CRFB, Yale Budget Lab, ITEP, PolicyEngine all publish exact rates and thresholds as HTML/PDF articles about one plan at a time. PolicyEngine built a Harris-vs-Trump household calculator in 2024 but did not publish the reform bundles.

For 2028 specifically, no think tank has a tracker yet. Tax Foundation's is still 2024; TPC's candidate matrix is 2016; KFF's candidate comparison is 2024. The only 2026-dated scorings of 2028 hopefuls found were Penn Wharton briefs on Booker's Keep Your Pay Act and Van Hollen's Working Americans' Tax Cut Act.

**Hand-curated JSON per politician is the only correct architecture**, layered over machine-verifiable evidence (cosponsorship, votes) where possible.

## Per-politician stance databases

| Source | Structured | Numeric | Access | 2026 status |
|---|---|---|---|---|
| Vote Smart PCT/NPAT — https://api.paas.votesmart.io/api (`GET /v1/npats/{id}`) | Yes (JSON, sections/rows/answers) | No | Pricing unpublished, "book demo" | Alive, re-platformed. PCT coverage of high-profile figures is historically sparse. |
| OnTheIssues — https://ontheissues.org/ | No (HTML prose + stance codes) | No | No API, license unverified | Alive, volunteer-run |
| iSideWith — https://www.isidewith.com/ | No | No | None | Alive |
| Ballotpedia — https://developer.ballotpedia.org/ | Roster yes; positions are free-text `quote`/`response` fields | No | Paid, confidential dataset terms | Alive (release notes dated 2026-09-25) |

## Legislative-behavior proxies (cosponsorship / votes)

| Source | Status | Notes |
|---|---|---|
| Congress.gov API v3 — https://api.congress.gov | Alive, free, 5,000 req/hr | Bill `cosponsors` with bioguide IDs. Use this, never scraped summaries (a search snippet wrongly listed a Republican senator as a Medicare for All cosponsor). |
| ProPublica Congress API | **Dead (2024)** | |
| GovTrack API/bulk | **Dead (2017)** | Site still runs |
| unitedstates/congress, congress-legislators — GitHub | Alive, public domain | Legislator crosswalk IDs (bioguide, FEC, Vote Smart, OpenSecrets, Wikidata) |
| Voteview — https://voteview.com/data | Alive, free | Roll calls + DW-NOMINATE CSV/JSON |
| Open States v3, LegiScan | Alive, free tiers | State legislators |
| OpenSecrets API | **Dead (April 15, 2025)** | Bulk data educational-only |
| openFEC — https://api.open.fec.gov | Alive, free | Candidate rosters by cycle |

Watchlist bills for boolean flags: Medicare for All (S.1506 Sanders / H.R.3069 Jayapal, 119th), Choose Medicare Act (H.R.3911), Health Care Affordability Act (S.46), enhanced PTC bills (S.3385 permanent extension; S.3386, S.3362 alternatives), Keep Your Pay Act (Booker), Working Americans' Tax Cut Act (Van Hollen), Fair Tax Act, Billionaire Minimum Income Tax, No Tax on Tips.

## Think tanks (the only numeric sources)

- **PolicyEngine** — https://www.policyengine.org/us — compute engine with reform parameter paths (e.g. `gov.irs.credits.ctc.amount.*`); API `POST https://household.api.policyengine.org/us/calculate`, OAuth2; self-hostable Docker image. Candidate reform bundles from 2024 are not published as data.
- **Penn Wharton Budget Model** — Keep Your Pay Act brief (2026-03-11): https://budgetmodel.wharton.upenn.edu/p/2026-03-11-the-keep-your-pay-act-budgetary-and-distributional-effects/ — Booker: exempt first $75,000 (MFJ) / $37,500 (single) from federal income tax, paired top-rate increase; −$6.4T gross, ~−$5T net over 10 years. Van Hollen: exempt first $46,000 of individual income, phasing out to $80,500; millionaire surtax; +$264B over a decade.
- **Tax Foundation 2024 tracker** — https://taxfoundation.org/research/federal-tax/2024-tax-plans/ — 8 tax types × topic tags; structure worth copying. No 2028 tracker.
- **TPC 2016 candidate matrix** — https://apps.urban.org/features/tpccandidate/ — stale but the exact template.
- **CRFB** — https://www.crfb.org/papers/fiscal-impact-harris-and-trump-campaign-plans — 2024 line-by-line scoring.
- **Yale Budget Lab** — https://budgetlab.yale.edu/ — OBBBA + tariff distributional analyses; publishes scripts.
- **ITEP** — https://itep.org/one-big-beautiful-bill-act/

## Healthcare

- **KFF 2024 candidate comparison** — https://www.kff.org/elections/compare-2024-candidates-health-care-policy/ — prose; no 2026/2028 equivalent.
- **KFF Enhanced PTC calculator** — https://www.kff.org/interactive/calculator-aca-enhanced-premium-tax-credit/ — methodology: CMS benchmark silver premiums; "with enhanced" uses ARPA/IRA caps, "without" uses IRS 2026 applicable-percentage table. Updated 2025-10-29.
- **Enhanced ACA premium tax credits expired 2025-12-31.** Senate votes in December 2025 on competing approaches; none advanced. ~22M enrollees, average premium payment increase ~114% (≈$1,016/yr). Sources: https://www.astho.org/communications/blog/2026/aca-enhanced-premium-tax-credits-legislative-developments-2025-2026/ , https://www.congress.gov/crs-product/R48290
- **OBBBA (P.L. 119-21, signed 2025-07-04)** made TCJA individual provisions permanent and added temporary deductions for tips, overtime, and seniors. Baseline = OBBBA law.

## Academic / encyclopedic

- Manifesto Project (party-level emphasis coding, no parameters), Comparative Agendas (topic coding), Wikidata (P39/P102/P1142 identity crosswalk only, CC0), Wikipedia "Political positions of X" (prose).

## GitHub

Nothing usable. election-lab (https://github.com/Liftof/election-lab) is a Next.js template whose candidate data is a hand-written JSON file, which is instructive.

## Recommended pipeline (adopted for this prototype, simplified)

1. Identity spine: slug per politician (bioguide/FEC crosswalk deferred).
2. Automated evidence (future): Congress.gov cosponsorship for a watchlist of bills.
3. Hand-curated numeric bundles: one TypeScript file per politician; every position carries `citations[]` and `confidence`.
4. Compute: in-app TypeScript engine (PolicyEngine is the upgrade path).
5. Design rules kept: politicians inherit unstated positions from party baselines and the UI labels them "Party default"; every source URL is surfaced in the UI; the baseline is OBBBA law for tax year 2026.

## Other 2026 signals surfaced

- American Prospect on Democratic contenders' tax-cut pivot (Van Hollen, Booker): https://prospect.org/2026/03/16/democratic-presidential-contenders-new-idea-tax-cuts-van-hollen-booker/
- Axios on left-wing Democrats and a wealth tax for 2028: https://www.axios.com/2026/03/29/left-wing-democrats-wealth-tax-2028
