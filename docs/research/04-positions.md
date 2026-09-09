# 2028 field: cited tax and healthcare positions (research summary)

Compiled 2026-09-08 by an Opus research subagent; ~60 primary-source fetches (WebSearch quota exhausted early, so congress.gov bill numbers are often confirmed via press releases rather than the bill page). The full per-position detail lives in `src/data/platforms/*.ts`, each with summary, confidence, citations, and the parameter change applied. This file records the framing findings, the field, and the verify-before-shipping list.

## Three premise corrections

1. **Tariffs cost ~$840 per household in 2026, not $1,200–2,400.** On 2026-02-20 the Supreme Court ruled in *Learning Resources, Inc. v. Trump* that IEEPA does not authorize the president's across-the-board tariffs. Section 232/301/201/338 tariffs survive. Tax Foundation: $1,000/household (2025) → $840 (2026); average effective rate 7.2%. https://taxfoundation.org/research/all/federal/trump-tariffs-trade-war/ (updated 2026-09-02).
2. **Enhanced ACA premium tax credits are gone.** Lapsed 2025-12-31. A 3-year extension failed cloture 2025-12-11 (4 Republicans yes: Hawley, Collins, Murkowski, Sullivan). Enrollment fell 21.8M → 19.2M; net premium payments up 58%. Only New Mexico fully replaced them with state funds. https://www.kff.org/affordable-care-act/how-has-aca-marketplace-enrollment-changed-across-states-in-2026/ (2026-07-28).
3. **"Family First Act" is Rep. Blake Moore's H.R.353** ($4,200 under 6 / $3,000 ages 6–17, refundable, plus $2,800 pregnancy credit), not Hawley's. Hawley's is a separate $5,000/child framework.

## The field (September 2026)

Nobody of consequence has formally declared. Polymarket, early September 2026:

- **Republicans:** Vance (frontrunner, 36–52%), Rubio (#2, 18–21%), Haley (~5%), DeSantis (~3–4%), Cruz, Rand Paul, Hawley, Ramaswamy (running for Ohio governor), Youngkin (near zero).
- **Democrats (2026-08-27):** Ocasio-Cortez 20.7%, Ossoff 15.9%, Newsom 14.7%, Harris 7.7%, Shapiro 5.1%, Buttigieg 4.9%; also Whitmer, Pritzker, Beshear, Moore, Gallego, Booker, Sanders (policy pole).
- **Libertarian:** Jo Jorgensen exploratory committee, 2026-05-28.

Included in the app: 7 Republicans (Vance, Rubio, DeSantis, Cruz, Paul, Hawley, Haley) and 13 Democrats/independents (AOC, Ossoff, Newsom, Harris, Shapiro, Buttigieg, Whitmer, Pritzker, Beshear, Moore, Booker, Gallego, Sanders). Ramaswamy and Youngkin were researched but omitted (state-office records only). Harris's bundle is her 2024 platform per Tax Foundation and needs a 2026 pass.

## Key sourced numbers used in the dataset

- **Democratic mainstream** (FY2025 Greenbook): 39.6% above $400k/$450k; ARPA CTC $3,000/$3,600 fully refundable monthly; childless EITC max $1,749 at 15.3%, ages 19+; gains ordinary above $1M; NIIT 3.8→5%; enhanced ACA credits permanent; coverage-gap fix; targeted China tariffs. Silent on SALT.
- **American Family Act** (Bennet/Booker, 2025-04-09): $6,360 newborns / $4,320 ages 1–5 / $3,600 ages 6–17, monthly, fully refundable; ~45 Senate cosponsors incl. Gallego, Sanders; **not Ossoff**.
- **Social Security Expansion Act** (S.770/H.R.1700): 12.4% payroll tax above $250,000 including investment income; +$2,400/yr benefits; CPI-E. A reported "NIIT 3.8→16.2%" figure is likely a misreading; verify.
- **Medicare for All** S.1506 (Sanders, 2025-04-29) / H.R.3069 (Jayapal): no premiums, deductibles, copays; replaces private and employer insurance; no age gate. Cosponsors confirmed: AOC (House original), Booker (Senate). Not: Ossoff, Gallego (walked back). Financing per Sanders' 2019 options paper (4% income premium above ~$29k; 7.5% employer payroll premium above $2M payroll).
- **Sanders/Khanna wealth tax** (2026-03-02): 5% annually above $1B net worth. **For the 99.5% Act**: $3.5M exemption, 45–65% (not 77%).
- **Hawley:** $5,000 CTC, no earnings floor, payroll-refundable, monthly; American Worker Rebate Act ($600/person floor); voted yes on ACA extension; "Don't Cut Medicaid"; international reference pricing for drugs.
- **Vance:** floated $5,000 CTC (2024), now touts $2,200; tie-breaking OBBBA vote; expand tariffs; opposed enhanced credits; "no intention of repealing" ACA.
- **Rubio:** all numeric positions 2014–2017 (Rubio–Lee 15/25/35, CTC $2,500, zero capital gains tax); tariff advocate now.
- **Cruz:** No Tax on Tips Act author; tariffs "a tax on consumers"; 10% flat tax (2015).
- **Rand Paul:** 14.5% flat tax, $15k per filer + $5k per person exemption, eliminate payroll taxes (business transfer tax replaces), strongest anti-tariff record, HSAs for all ($24,500), Medicare age 65→70 (dated).
- **Haley:** eliminate SALT deduction; retirement age 70–71 for today's 20-somethings; repeal broad tariffs; declined Medicaid expansion in SC.
- **AOC:** 70% above $10M (2019, never legislated); opposes SALT cap repeal; scrap the cap $250k; tips/overtime deduction "a scam"; M4A; NO GOUGE Act.
- **Booker:** Keep Your Pay Act (exempt first $75k joint / $37.5k single; PWBM −$5T net/10yr); AFA lead; SSEA cosponsor; M4A cosponsor.
- **Governors** (Newsom, Shapiro, Whitmer, Pritzker, Beshear, Moore, DeSantis): no federal tax positions; state records recorded as notes. Moore signed MD 6.25%/6.5% brackets and a 2% capital gains surtax (2025). Beshear signed KY cuts 5%→3.5% while fighting Medicaid work requirements. Pritzker's graduated tax failed 53–47 in 2020. Whitmer raised MI EITC 6%→30%.

## Modeling conventions adopted

- Tariff stance → multiplier on the ~$840 baseline cost: repeal 0.25 (only pre-2025 Section 301 China tariffs remain), targeted 0.5, keep 1.0, expand 1.25, free trade 0. These multipliers are the app's judgment, not sourced figures.
- Politicians inherit unstated positions from a lane baseline (MAGA for Vance/Hawley, Progressive for AOC/Sanders, Democratic mainstream for other Democrats, GOP for other Republicans). A documented "not a cosponsor" is encoded as `hold()` so the party default does not apply (Ossoff CTC/payroll, Gallego payroll). Informational notes let the party default apply and the UI shows both.
- Two positions must never be overridden by lane defaults: AOC on SALT (opposes repeal) and Hawley on Medicaid (opposes cuts).
- Child ages are not collected, so age-tiered credits are modeled at the base (6–17) amount.

## Commonly missing fields

Standard deduction (~2 of 21 have a position), Medicare drug negotiation (~4), HSAs (3), estate tax (~6, mostly historical), EITC (~7, several dated). Nobody in the field proposes lowering the Medicare age; the only age proposals raise it (Paul, Haley). Nobody has said what happens to the tips/overtime deductions after 2028.

## Verify before shipping

1. Whitmer on tariffs: the "auto tariffs can be useful" claim is unverified. No quote is attributed in the app.
2. Sanders SSEA NIIT figure (reported 16.2%).
3. Rand Paul and Vance on Medicare drug negotiation (Vance: single secondary source).
4. Shapiro's PA CTC/EITC parameters; Whitmer's MI CTC (do not assert).
5. AOC's current top-rate number (no 2025–26 restatement of 70%).
6. Harris: full 2026 pass.
7. Bill numbers for Hawley's Protect Medicaid and Rural Hospitals Act, Hawley/Welch drug pricing bill, 119th SSEA reintroduction.
8. Enhanced-subsidy status after 2026-08-03.
