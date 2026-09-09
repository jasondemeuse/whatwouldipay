# Beyond Your Paycheck — spending-side research

Research date 2026-09-08. Compiled from primary sources for the "Beyond your paycheck" module:
(A) where a household's federal taxes go today, (B) what each platform changes on the spending
side, (C) household value of benefits that never appear in take-home pay.

**Fiscal year used: FY2025 (Oct 1, 2024 – Sep 30, 2025). Its figures are FINAL.**

## Source tiers

Every figure in this document carries a tier. Do not render them with equal authority in the UI.

| Tier | Meaning |
|---|---|
| `CBO` / `JCT` / `SSA-OACT` / `CMS-OACT` | Official government scorekeeper |
| `OMB` | Administration's own score (authoritative but self-scored, not independent) |
| `TT` | Think tank (CRFB, Urban, Penn Wharton, Tax Foundation, Mercatus, AAF, KFF, RAND) |
| `CLAIM` | Sponsor's or campaign's own assertion, unscored |
| `TEXT` | Read directly from statutory text (authorization totals, eligibility thresholds) |

## Access notes for reproducibility

- `cbo.gov`, `congress.gov`, `jct.gov`, `ssa.gov` return **HTTP 403** to all automated fetching.
  The workaround that works: resolve a snapshot with
  `curl "https://archive.org/wayback/available?url=cbo.gov/publication/NNNNN"`, then fetch the
  **exact** URL returned (the `id_` modifier 403s). Attached `.xlsx`/`.pdf` files download through
  the same `/web/<timestamp>/` prefix and parse with `python3` + `zipfile` + `xml.etree`.
- **Treasury's Fiscal Data API needs no workaround** and should be the standing source for Part A.
- `govinfo.gov` is reachable and authoritative for bill text.
- CBO/congress.gov URLs below are given as canonical links; they were read via Wayback mirrors.

---

# PART A — Where federal tax dollars go

## A0. Year and finality

FY2025 actuals are **final**. The Final Monthly Treasury Statement for September 2025 states:
*"This issue includes the final budget results and details a deficit of $1.775 trillion for Fiscal
Year 2025."*

- [Final Monthly Treasury Statement, September 2025 (PDF)](https://fiscaldata.treasury.gov/static-data/published-reports/mts/MonthlyTreasuryStatement_202509.pdf)
- [Bureau of the Fiscal Service — MTS reports](https://fiscal.treasury.gov/reports-statements/mts/)
- [MTS Table 9 API, FY2025](https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_9?filter=record_calendar_month:eq:09,record_fiscal_year:eq:2025) (`record_date = 2025-09-30`)
- OMB Historical Tables are **current, not stale** — the FY2027 Budget edition (April 2026) carries
  FY2025 as its last actual year: [whitehouse.gov/omb/budget/historical-tables](https://www.whitehouse.gov/omb/budget/historical-tables/)

## A1. Outlays by budget function, FY2025

**Total outlays $7,009,974M ($7.010T).** Shares sum to exactly 100.00%, verified against the
published total.

| Fn | Function | FY2025 ($B) | % of outlays | FY2024 ($B) |
|---|---|---:|---:|---:|
| 650 | Social Security | 1,580.7 | 22.55% | 1,460.9 |
| 570 | Medicare | 996.7 | 14.22% | 874.1 |
| 550 | Health (Medicaid + CHIP + ACA subsidies) | 978.9 | 13.96% | 911.7 |
| 900 | Net Interest | 970.4 | 13.84% | 881.0 |
| 050 | National Defense | 916.6 | 13.08% | 874.0 |
| 600 | Income Security (excl. Social Security) | 701.6 | 10.01% | 671.1 |
| 700 | Veterans Benefits and Services | 377.2 | 5.38% | 325.6 |
| 400 | Transportation | 145.8 | 2.08% | 137.1 |
| 300 | Natural Resources and Environment | 88.3 | 1.26% | 56.9 |
| 750 | Administration of Justice | 85.2 | 1.22% | 85.0 |
| 450 | Community and Regional Development | 84.5 | 1.21% | 87.8 |
| 500 | Education, Training, Employment, Social Services | 69.2 | 0.99% | 304.6 |
| 350 | Agriculture | 49.3 | 0.70% | 34.7 |
| 150 | International Affairs | 45.2 | 0.64% | 56.4 |
| 250 | General Science, Space, and Technology | 42.1 | 0.60% | 41.6 |
| 800 | General Government | 36.3 | 0.52% | 29.7 |
| 270 | Energy | 20.9 | 0.30% | 13.8 |
| 370 | Commerce and Housing Credit | −28.6 | −0.41% | 35.6 |
| 950 | Undistributed Offsetting Receipts | −150.2 | −2.14% | −146.7 |
| | **TOTAL** | **7,010.0** | **100.00%** | 6,734.9 |

Source: Final MTS September 2025, **Table 9 ("Summary of Receipts by Source, and Outlays by
Function"), p. 38**. Cross-check: [OMB Historical Table 3.2](https://www.whitehouse.gov/wp-content/uploads/2026/04/hist03z2_fy2027.xlsx)
gives total outlays $7,011,105M (difference 0.016%, from OMB budget-concept reclassifications).

### Three lines that must not be displayed naively

**1. Education (500) at 0.99% is an accounting artifact, not a policy fact.** It is driven by
student-loan credit-subsidy re-estimates under the Federal Credit Reform Act. OMB shows subfunction
502 (higher education) at **−$35,005M** in FY2025. Five-year history:

| Function | FY2021 | FY2022 | FY2023 | FY2024 | FY2025 | 5-yr avg |
|---|---:|---:|---:|---:|---:|---:|
| Education (500) | 296.6 | 676.6 | −3.1 | 305.0 | 69.2 | **268.9** |
| Commerce & Housing Credit (370) | 304.1 | −19.5 | 100.0 | 35.6 | −28.6 | **78.3** |

Ship FY2025 with an explicit footnote, or offer a 5-year-average toggle for these two functions.

**2. Undistributed Offsetting Receipts (−$150.2B)** must be included or the shares will not sum to
100%. It is mostly the employer share of federal employee retirement (−$120.1B on-budget).

**3. Payment-timing distortion.** Treasury flags on p. 1 of the Final MTS that outlays for military
active duty and retirement, veterans benefits, SSI, and Medicare payments to HMOs and drug plans
**accelerated into August 2025**, because September 1, 2025 fell on a non-business day. This inflates
the affected functions relative to a clean twelve-month year.

### Income Security (600) broken out, FY2025

| Item | $M | Source |
|---|---:|---|
| SNAP | 106,336 | OMB Public Budget Database, subfn 605 |
| Child nutrition (school meals etc.) | 33,375 | same |
| WIC | 7,960 | same |
| Supplemental Security Income (SSI) | 69,472 | MTS Table 5 line 664 |
| EITC — refundable portion | 66,007 | MTS Table 5 line 494 |
| Child Tax Credit — refundable portion | 26,567 | MTS Table 5 line 495 |
| Housing assistance (subfn 604) | 77,989 | OMB Table 3.2 |
| — Section 8 tenant-based vouchers | 38,320 | OMB PBD |
| — Project-based rental assistance | 17,151 | OMB PBD |
| — Public Housing Fund | 8,905 | OMB PBD |
| Unemployment compensation (subfn 603) | 41,771 | OMB Table 3.2 |
| TANF | 17,714 | OMB PBD |
| Child care (CCDF + entitlement) | 14,811 | OMB PBD |
| Foster care / adoption assistance | 9,987 | OMB PBD |
| LIHEAP | 4,377 | OMB PBD |
| Federal employee retirement & disability (subfn 602) | 190,234 | OMB Table 3.2 |
| **Total, function 600** | **701,609** | OMB Table 3.2 |

[OMB Public Budget Database — Outlays](https://www.whitehouse.gov/wp-content/uploads/2026/04/outlays_fy2027.xlsx) ·
[MTS Table 5 API](https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_5?filter=record_calendar_month:eq:09,record_fiscal_year:eq:2025)

> **Refundable credits straddle two functions.** EITC ($66.0B) and CTC ($26.6B) sit in Income
> Security (600); the **ACA refundable premium tax credit ($129.3B) sits in Health (550)**. A
> "tax credits to families" line must pull from both.

### Health (550) broken out, FY2025

| Item | $M |
|---|---:|
| Grants to States for Medicaid | 668,139 |
| ACA refundable premium tax credits + cost-sharing reductions | 129,260 |
| CHIP (Children's Health Insurance Fund) | 23,068 |
| Federal employee health benefits (annuitants) | 16,199 |
| DoD Medicare-Eligible Retiree Health Care Fund | 12,953 |
| HRSA (health centers etc.) | 12,726 |
| ACA risk adjustment payments | 11,225 |
| CDC | 10,149 |
| SAMHSA | 8,338 |
| Indian Health Service | 5,227 |
| Health research and training incl. NIH (subfn 552) | 50,204 |
| **Total, function 550** | **978,511** |

### Administration of Justice (750) — immigration enforcement share

Function 750 net total: **$83,146M** (OMB Table 3.2).

| Bureau | FY2025 ($M) | % of fn 750 |
|---|---:|---:|
| U.S. Customs and Border Protection (CBP) | 20,987 | 25.2% |
| U.S. Immigration and Customs Enforcement (ICE) | 10,701 | 12.9% |
| Citizenship and Immigration Services (USCIS) | 6,018 | 7.2% |
| DOJ Legal Activities & U.S. Marshals | 13,557 | 16.3% |
| Judiciary (Appeals, District Courts) | 9,836 | 11.8% |
| Federal Prison System | 9,133 | 11.0% |
| DOJ state/local/tribal justice assistance | 6,119 | 7.4% |
| FBI | 4,148 | 5.0% |
| U.S. Secret Service | 3,574 | 4.3% |
| DHS departmental offsetting receipts | −14,582 | −17.5% |

**ICE + CBP = 38.1% of the net function total**, or **~32.4%** measured against gross (the net is
depressed by the −$14,582M offsetting-receipts line). Pick one and disclose which. Agency totals in
MTS Table 5 run slightly larger than the function-750 amounts because CBP has outlays in
subfunctions 352, 376 and 806 as well. Total DHS FY2025 outlays: $115,306M.

### Trend check — FY2026 year-to-date (Oct 2025 – Jul 2026)

Useful as corroboration that OBBBA's enforcement buildup is landing:

| Function | FY2026 YTD ($B) | FY2025 YTD ($B) | Change |
|---|---:|---:|---:|
| Administration of Justice | 90.0 | 68.8 | **+21.2 (+31%)** |
| Medicare | 954.5 | 823.4 | +131.1 |
| Net Interest | 931.4 | 840.8 | +90.6 |
| National Defense | 803.7 | 758.0 | +45.7 |
| Education/Training/Employment | 82.0 | 163.7 | −81.6 |
| Customs duties (receipt) | 154.5 | 135.7 | +18.8 |

## A2. Receipts by source, FY2025

**Total receipts $5,234,616M ($5.235T).**

| Source | FY2025 ($B) | % of receipts | FY2024 ($B) | Change |
|---|---:|---:|---:|---:|
| Individual income taxes | 2,656.04 | 50.74% | 2,426.07 | +9.5% |
| Social insurance & retirement, total | 1,748.29 | 33.40% | 1,708.93 | +2.3% |
| — OASI trust fund | 1,097.38 | 20.96% | | |
| — DI trust fund | 186.35 | 3.56% | | |
| — **OASDI combined** | **1,283.74** | **24.52%** | 1,259.88 | +1.9% |
| — **HI trust fund (Medicare Part A)** | **395.35** | **7.55%** | | |
| — Unemployment insurance | 54.05 | 1.03% | 47.98 | +12.7% |
| — Other retirement | 8.61 | 0.16% | 7.95 | +8.3% |
| Corporate income taxes | 452.09 | 8.64% | 529.87 | −14.7% |
| **Customs duties (tariffs)** | **194.87** | **3.72%** | **77.04** | **+152.9%** |
| Excise taxes | 105.94 | 2.02% | 101.44 | +4.4% |
| Miscellaneous receipts | 47.92 | 0.92% | 43.16 | +11.0% |
| — Deposit of earnings, Federal Reserve | 5.49 | 0.10% | | |
| Estate and gift taxes | 29.46 | 0.56% | 31.62 | −6.8% |
| **TOTAL RECEIPTS** | **5,234.62** | **100.00%** | 4,918.11 | +6.4% |

Source: [MTS Table 4 API, FY2025](https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_4?filter=record_calendar_month:eq:09,record_fiscal_year:eq:2025)
(OASI/DI/HI split) and MTS Table 9. Cross-check: [OMB Historical Table 2.1](https://www.whitehouse.gov/wp-content/uploads/2026/04/hist02z1_fy2027.xlsx)
gives $5,236,421M total.

**Tariffs are the headline revenue story.** Customs duties rose **+$117.8B (+152.9%)**, from 1.57% to
3.72% of receipts, making them the **fourth-largest** federal revenue source — ahead of excise and
estate taxes.

## A3. Deficit, FY2025

| | Receipts | Outlays | Deficit |
|---|---:|---:|---:|
| **FY2025 (Final MTS)** | 5,234,616 | 7,009,974 | **1,775,357** |
| — On-budget | | 5,578,367 | 1,627,487 |
| — Off-budget | | 1,431,606 | 147,871 |
| FY2024 (as originally published) | 4,918,736 | 6,751,552 | 1,832,816 |
| **FY2024 (restated in the FY2025 statement)** | 4,918,106 | 6,734,896 | **1,816,790** |

> **Use the restated FY2024 figures** ($6,734.9B / $1,816.8B) for any year-over-year comparison —
> only those are on a consistent basis with FY2025. The FY2025 statement revised FY2024 outlays
> **down by $16.7B**. OMB's $6,735,261M corroborates the restated series.

Year over year: the deficit **narrowed** $41.4B (−2.3%) despite outlays rising $275B, because
receipts rose $316.5B — driven by individual income taxes (+$230.0B) and customs duties (+$117.8B),
partly offset by corporate income taxes (−$77.8B).

## A4. The National Priorities Project methodology

**NPP is alive**, still a project of the Institute for Policy Studies. There are two products a year
apart, and the difference matters:

| Product | Spending FY | Published | URL |
|---|---|---|---|
| Tax Day 2026 analysis (latest) | **FY2025** | 2026-04-09 | https://www.nationalpriorities.org/analysis/2026/tax-day-2026/ |
| Interactive receipt tool | **FY2024** | 2025-04-15 | https://www.nationalpriorities.org/interactive-data/taxday/ |

The site nav points "Your Tax Receipt" at the 2026 analysis, but the **interactive tool has not been
refreshed** — its year dropdown still ends at 2024.

### CONFIRMED: NPP allocates across FEDERAL FUNDS only

Verbatim from [their methodology page](https://www.nationalpriorities.org/works-on/about-our-numbers/):

> "When reporting how your income tax dollar was spent, NPP uses the above categories but
> **excludes money spent out of trust funds and reports only spending out of federal funds**."

Confirmed empirically two ways:

1. **There is no Social Security line on the receipt at all.** The category is renamed
   "Labor & Income Assistance" and Social Security is gone.
2. **Medicare *is* shown** — because that is the general-revenue-financed SMI (Parts B/D) share, not
   payroll-financed HI. Treasury confirms the scale: FY2025 general-fund transfer to the SMI trust
   fund was **$549,652M**, versus only **$42,381M** to the HI trust fund (MTS Table 5, lines 250 and
   252). Roughly **55%** of the $996.7B Medicare function is general-revenue financed, and it is
   that ~55% that belongs in an income-tax receipt.

### NPP's latest receipt — FY2025 spending, tax year 2025

Base: average taxpayer's 2025 federal income tax **$20,259.57**.

| NPP category | $ per avg. taxpayer | % of income tax |
|---|---:|---:|
| Health total | 5,852.77 | 28.89% |
| — Medicaid | 2,491.64 | 12.30% |
| — Medicare (general-fund share) | 2,207.79 | 10.90% |
| Interest on Debt | 4,330.29 | 21.37% |
| War and Weapons total | 4,049.35 | 19.99% |
| — Pentagon contractors | 1,869.58 | 9.23% |
| — Military personnel | 770.18 | 3.80% |
| Veterans | 1,404.93 | 6.93% |
| Labor & Income Assistance | 1,104.78 | 5.45% |
| Food & Agriculture | 735.00 | 3.63% |
| — SNAP | 396.55 | 1.96% |
| Education | 637.41 | 3.15% |
| Housing & Community | 541.80 | 2.67% |
| Government | 466.12 | 2.30% |
| Energy & Environment | 394.22 | 1.95% |
| Law Enforcement | 235.66 | 1.16% |
| — CBP | 79.19 | 0.39% |
| — ICE | 39.91 | 0.20% |
| Transportation | 188.63 | 0.93% |
| International Affairs | 162.06 | 0.80% |
| Science | 156.54 | 0.77% |
| **TOTAL** | **20,259.57** | **100.00%** |

### Two NPP editorial choices to know if you replicate the crosswalk

NPP maps budget subfunctions to categories at
[about-our-numbers](https://www.nationalpriorities.org/works-on/about-our-numbers/). Two choices are
defensible but are choices:

- **International security assistance (152) is placed under "Military,"** not International Affairs.
  This is why NPP's military number runs higher than budget function 050.
- **Food and nutrition (605) is placed with Agriculture,** not Income Security.

### The deficit wedge — authoritative numbers

Use [OMB Historical Table 1.4](https://www.whitehouse.gov/wp-content/uploads/2026/04/hist01z4_fy2027.xlsx),
"Receipts, Outlays, and Surpluses or Deficits by Fund Group" — the only official table that splits
federal funds from trust funds. FY2025 ($M):

| | Receipts | Outlays | Surplus/Deficit | Coverage | Borrowed wedge |
|---|---:|---:|---:|---:|---:|
| **Total (unified)** | 5,236,421 | 7,011,105 | −1,774,684 | 74.69% | **25.31%** |
| **Federal funds** | 3,413,497 | 5,284,502 | −1,871,005 | 64.59% | **35.41%** |
| **Trust funds** | 3,009,025 | 2,912,704 | **+96,321** | 103.3% | — |
| *Interfund transactions* | −1,186,101 | −1,186,101 | — | | |

The government spent **$1.34 for every $1 collected** overall, and **$1.55 per $1 of federal-funds
receipts**. Trust funds ran a **surplus** in FY2025, which is exactly why the wedge is *bigger*, not
smaller, once they are stripped out.

> Do not hand-build the federal-funds base by subtracting Social Security and an estimated HI share.
> Table 1.4 already does it correctly, including interfund eliminations.

### Trust-fund self-financing footnote

[SSA OACT Table 4.A3](https://www.ssa.gov/OACT/STATS/table4a3.html), OASDI trust funds, **CY2024**
(latest published; SSA has not yet posted CY2025):

| Component | $M | % of cost |
|---|---:|---:|
| Net payroll tax contributions | 1,293,331 | 87.1% |
| Income from taxation of benefits | 55,052 | 3.7% |
| Net interest | 69,129 | 4.7% |
| General Fund transfers | 244 | 0.0% |
| **Total income** | **1,417,757** | 95.5% |
| **Total cost** | **1,484,753** | 100% |
| Net change in asset reserves | −66,997 | −4.5% (drawdown) |

So the gap between dedicated payroll taxes and benefits is closed by taxation of benefits, interest
on reserves, and reserve drawdown — **not** by general revenue. Medicare Trustees Report:
[2025 Medicare Trustees Report](https://www.cms.gov/files/document/2025-medicare-trustees-report.pdf).

## A5. RECOMMENDED RECEIPT SHARES

**Run two receipts on two different bases. Do not use a single unified pie.**

### Receipt 1 — income tax, allocated across FEDERAL FUNDS, with an explicit borrowed wedge

Rationale: the counterfactual is real. If a household paid no income tax, Social Security benefits
would still be paid out of OASDI payroll receipts. An income-tax receipt that assigns 22.55% to
Social Security tells the user something false about where their April 15 dollar went.

Take NPP's published FY2025 federal-funds shares (above), scale them by `coverage = 0.6459`, and
show the remainder as a borrowed slice. **These are the recommended shares:**

| Slice | Share of income tax |
|---|---:|
| **Borrowed — charged to future taxpayers** | **35.41%** |
| Health (Medicaid 7.94%, Medicare general-fund 7.04%) | 18.66% |
| Interest on debt | 13.80% |
| Military and weapons | 12.91% |
| Veterans | 4.48% |
| Labor and income assistance | 3.52% |
| Food and agriculture (SNAP 1.27%) | 2.34% |
| Education | 2.03% |
| Housing and community | 1.72% |
| Government | 1.49% |
| Energy and environment | 1.26% |
| Law enforcement (CBP 0.25%, ICE 0.13%) | 0.75% |
| Transportation | 0.60% |
| International affairs | 0.52% |
| Science | 0.50% |
| **TOTAL** | **~100%** |

```
FF_outlays  = 5_284_502     # OMB Historical Table 1.4, FY2025, $M
FF_receipts = 3_413_497
coverage    = 0.6459
wedge       = 0.3541

slice_i  = T_inc * coverage * npp_share_i
borrowed = T_inc * wedge
# slices + borrowed == T_inc
```

If you prefer a gross-up framing instead of a wedge inside a fixed pie, the equivalent is
`spending_shown = T_inc / coverage = T_inc * 1.5481` — a household paying $10,000 in income tax sees
$15,481 of federal-funds spending attributed to it, of which $5,481 was borrowed.

**Optional unified-budget toggle:** use `coverage = 0.7469`, `wedge = 0.2531`, gross-up factor
`1.3389`, and the A1 percentage column. Label it as a *different question* ("all federal taxes across
all federal spending"), not a refinement of the same number.

### Receipt 2 — payroll tax, straight to the dedicated trust funds

No pro-rating and no wedge. These are legally earmarked:

```
OASDI_line = wages * 0.062    ->  "Social Security (OASI + DI trust funds)"
HI_line    = wages * 0.0145   ->  "Medicare Part A (HI trust fund)"
```

### Required reconciliation sentence

Medicare will legitimately appear in **both** receipts. Say so, or users will report it as a bug:

> Medicare appears twice because it is financed twice: Part A comes out of the 1.45% Medicare payroll
> tax, while Parts B and D are about 55% funded from general revenue — the same pot your income tax
> goes into.

### Drop-in deficit disclosure

> In FY2025 the federal government spent $1.34 for every $1 it collected, so 25.3% of all spending —
> and 35.4% of spending outside the Social Security and Medicare trust funds — was paid for by
> borrowing rather than by this year's taxes. That share is shown here as a separate slice.
> *(Sources: OMB Historical Table 1.4, FY2027 Budget; Treasury Final Monthly Treasury Statement,
> September 2025.)*

### Why "net interest already represents past borrowing" is wrong

Reject this option if it comes up. Net interest ($970.4B, 13.84% of outlays) is the **carrying cost
of debt already issued**. It is not FY2025's **new** borrowing ($1,775.4B). They are different
quantities in different years. Treating interest as the deficit slice understates the FY2025 gap by
roughly half.

---

# PART B — Spending-side commitments by platform

## Platform key

| Code | Platform |
|---|---|
| **(a)** | Republican baseline — OBBBA / P.L. 119-21 as enacted July 4, 2025 |
| **(b)** | Democratic mainstream — FY2025 Biden-Harris budget + 2024 Democratic platform |
| **(c)** | Progressive / DSA — Sanders, AOC, Squad-aligned |
| **(d)** | Libertarian — LP platform, Rand Paul |
| **(e)** | Populist right — Hawley, Vance |

Individuals appear as rows only where they **differ** from their lane.

## B0. The OBBBA anchor, from CBO directly

[CBO publication 61570](https://www.cbo.gov/publication/61570), *Estimated Budgetary Effects of
Public Law 119-21*, July 21, 2025, workbook `61570-pl119-21-2025Recon-CLB.xlsx`. All 2025–2034,
millions of dollars.

| Title | Outlays | Revenues | Net deficit effect |
|---|---:|---:|---:|
| I. Agriculture, Nutrition and Forestry | −120,960 | 0 | −120,960 |
| — *Subtitle A (Nutrition/SNAP) alone* | *−186,650* | | |
| II. Armed Services | +149,542 | 0 | +149,542 |
| III. Banking, Housing, Urban Affairs | −1,668 | 0 | −1,668 |
| IV. Commerce, Science, Transportation | −42,384 | +1,653 | −44,037 |
| V. Energy and Natural Resources | −21,339 | 0 | −21,339 |
| VI. Environment and Public Works | −4,959 | −1,500 | −3,459 |
| VII. Finance | −941,720 | −4,521,327 | +3,579,607 |
| VIII. Health, Education, Labor, Pensions | −284,022 | 0 | −284,022 |
| IX. Homeland Security | +128,911 | 0 | +128,911 |
| X. Judiciary | +46,056 | +37,162 | +8,894 |
| Interactions among titles | +1,198 | −1,777 | +2,975 |
| **TOTAL** | **−1,091,345** | **−4,485,789** | **+3,394,444** |

Title VII Subtitle B (Health) decomposition, 2025–2034 outlays:

| Component | $M |
|---|---:|
| Chapter 1, Medicaid (section sum, gross of interactions) | −989,667 |
| Chapter 2, Medicare | +1,683 |
| Chapter 3, "Health Tax" (ACA premium tax credit restrictions) | −212,968 |
| Interactions of health policies in Subtitle B | +95,448 |
| Chapter 4, Rural Health Transformation Program | +47,152 |
| **Subtotal, Subtitle B** | **−1,058,352** |

> **Use CBO's *published* Medicaid figure, not the section sum.** CBO's standalone supplemental
> estimate — [publication 61837](https://www.cbo.gov/publication/61837), Oct 28, 2025 — gives
> **−$914,634M outlays / −$886,754M deficit effect** and **+7.5 million uninsured in 2034** for the
> Medicaid chapter. The workbook has no published "Subtotal, Chapter 1" row, so −$989.7B is derived.
> Cite −$914.6B.

Deficit totals — [CBO publication 61466](https://www.cbo.gov/publication/61466), *Effects on Deficits
and the Debt of Public Law 119-21 and of Making Certain Tax Policies in the Act Permanent*,
August 4, 2025 (prepared at Sen. Merkley's request):

| Measure | Figure |
|---|---|
| Primary deficit increase as enacted, 2025–2034 (excl. macro and debt service) | **$3.4T** |
| Debt-service cost | **+$718B** |
| **Cumulative deficit effect including interest** | **$4.1T** |
| Debt held by public, end of 2034 | **+9.5 pp of GDP** |
| JCT: making the 10 temporary tax provisions permanent adds (primary) | +$0.8T |
| Debt service if made permanent | $789B |
| **Cumulative deficit effect if made permanent** | **$5.0T** |
| Debt held by public if made permanent | +11.5 pp of GDP |

---

## Category 1 — Defense / military

| Platform | Direction | Summary | 10-yr ($B) | Scorer | Source | Conf. |
|---|---|---|---:|---|---|---|
| (a) GOP / OBBBA | More | Reconciliation plus-up: shipbuilding $29B, Golden Dome missile defense $25B, munitions $25B, Coast Guard $25B, Indo-Pacific $12B | **+149.5** | CBO | [pub 61570](https://www.cbo.gov/publication/61570) Title II | High |
| (b) Dem mainstream | **Less (real terms)** | $895B FY25 request growing ~1%/yr, below inflation | FY25 **895.2**; 10-yr allocation **9,730** | OMB | FY2025 Budget Tables S-7/S-8 | High |
| (b) same, CBO's read | Less | CBO scored only discretionary proposals; **no full re-estimate of the budget exists** | **−59** vs 2024 (−6%); base defense +9 (+1%); discretionary outlays **−878** vs baseline over 10 yrs | CBO | [pub 60041](https://www.cbo.gov/publication/60041) | High |
| (b) 2024 Dem platform | **No stated position** | Contains **no defense topline, no dollar figure, no growth path** | — | — | [Platform PDF](https://democrats.org/wp-content/uploads/2025/07/2024-Democratic-Party-Platform.pdf) | High |
| (c) Progressive | Less | Sanders amendment to cut Pentagon 10%, redirect to communities ≥25% poverty; personnel pay/health exempt | **~−740** (−$74B/yr). **REJECTED 23–77**, Roll Call #135, 2020-07-22 | CLAIM + Senate vote record | [sanders.senate.gov](https://www.sanders.senate.gov/press-releases/sanders-cut-the-pentagon-by-10-to-hire-more-teachers-build-more-homes-and-create-more-jobs/) | High (2020 vintage) |
| (c) AOC, current | No dollar position | 11 NDAA amendments (2026-06-29) are oversight/human-rights, **no budget cuts** | — | — | [ocasio-cortez.house.gov](https://ocasio-cortez.house.gov/media/press-releases/ocasio-cortez-submits-11-amendments-national-defense-authorization-act) | High |
| (d) Libertarian | Less | "sufficient military to defend the United States"; opposes global policing. **No numbers in platform** | none | — | [lp.org/platform](https://www.lp.org/platform/) | High |
| (d) Rand Paul | Less | 2011 plan cut defense 6.5% within a $500B/yr package | Not scored, **stale** | CLAIM | Wikipedia | Low |
| (e) Vance | No number | — | — | — | — | — |
| Whitmer | More (unquantified) | "Build, America, Build" national shipbuilding/aviation strategy; cites SHIPS for America Act | **No dollar attached to any of her asks** | CLAIM | [michigan.gov](https://www.michigan.gov/whitmer/news/press-releases/2025/04/09/whitmers-build-america-build-address-as-prepared-for-delivery) | High |
| Ossoff | More (Georgia-specific) | MilCon-VA earmarks, **annual not 10-yr**: $127.4M Fort Benning school, $166M Fort Gillem, $119M Kings Bay | annual only | CLAIM | [ossoff.senate.gov](https://www.ossoff.senate.gov/five-year-report/) | Medium |
| Rubio, Cruz, Haley, DeSantis | **No stated federal position found** | — | — | — | — | Medium |

Context: FY2026 enacted **defense discretionary $838.7B** within $1.622T base discretionary —
[CRFB](https://www.crfb.org/blogs/appropriations-watch-fy-2027).

---

## Category 2 — Healthcare programs

| Platform | Direction | Summary | 10-yr ($B) | Scorer | Source | Conf. |
|---|---|---|---:|---|---|---|
| (a) GOP / OBBBA — Medicaid | **Less** | Work requirements 80 hr/mo ages 19–64, 6-month redeterminations, provider tax 6%→3.5% by 2031, 5-yr wait for green-card holders | **−914.6 outlays / −886.8 deficit**; **+7.5M uninsured 2034** | CBO | [pub 61837](https://www.cbo.gov/publication/61837) | High |
| (a) — Health subtitle total | Less | See B0 decomposition | **−1,058.4** | CBO | [pub 61570](https://www.cbo.gov/publication/61570) | High |
| (a) — ACA restrictions inside OBBBA | Less | §§71301–71305: PTC eligibility limits, verification, SEP limits, recapture | **−213.0** | CBO/JCT | [pub 61570](https://www.cbo.gov/publication/61570) | High |
| (a) — Rural Health Transformation | More | §71401, $10B/yr FY2026–2030 | **BA +50.0 / outlays +47.2** | CBO | [pub 61570](https://www.cbo.gov/publication/61570) | High |
| (b) Dem — restore enhanced ACA credits | More | Permanent extension | **+272.7** (2025–34) | OMB | FY2025 Budget Table S-6 | High |
| (b) — same, current official score | More | Permanent extension, **+3.8M insured in 2035** | **+349.8** (2026–35) | CBO | [pub 61734](https://www.cbo.gov/publication/61734), 2025-09-18 | High |
| (b) — partial extensions | More | 3-year (S.3385, Dec 2025) / 2-year | **+85** / **+60** | CBO | via [CRFB](https://www.crfb.org/blogs/senate-aca-plan-could-add-350-635-billion-debt) | Medium |
| (b) — close the coverage gap | More | Medicaid-like coverage in non-expansion states | **+200.0** | OMB | Table S-6 | High |
| (b) — Medicaid HCBS | More | Home and community-based services | **+150.0** | OMB | Table S-6 | High |
| (b) — Indian Health Service to mandatory | More | | **+277.3 gross / ~+202 net** | OMB | Table S-6 | High |
| (b) — total health increases | More | | **+968** | TT (CRFB from OMB) | [CRFB](https://www.crfb.org/blogs/health-care-proposals-presidents-fiscal-year-2025-budget) | High |
| (b) — Medicare/drug savings | **Savings** | Expand negotiation; extend inflation rebates, $2,000 OOP cap and $35 insulin to the **commercial** market | **−200.0** (all drug proposals −204.8) | OMB | Table S-6 | High |
| (b) — all health reductions | Savings | | **−309** | TT (CRFB) | [CRFB](https://www.crfb.org/blogs/spending-cuts-presidents-fy-2025-budget) | High |
| (b) — Medicare HI solvency | Revenue | 5% Medicare tax >$400k + NIIT on passthroughs | **+1,537 to HI**; "HI sufficiently funded indefinitely" | CMS-OACT | [CMS Chief Actuary](https://www.cms.gov/files/document/medicare-hospital-insurance-trust-fund-depletion-fiscal-year-2025-presidents-budget.pdf) | High |
| (c) Medicare for All | **Much more federal** | S.1506/H.R.3069 (2025-04-29). Dental, vision, hearing, long-term care; **no deductibles or copays** except optional Rx capped $200/yr; 4-year phase-in | **NEW FEDERAL +32,000 to +34,000** | TT | Urban 2016 $32.0T; Urban 2019 $34.0T; Mercatus $32.6T | High |
| (c) — Urban 2016 (center-left) | | Sanders plan | +32,000 federal; **total national +6,600** | TT | [urban.org](https://www.urban.org/research/publication/sanders-single-payer-health-care-plan-effect-national-health-expenditures-and-federal-and-private-spending) | High |
| (c) — Urban 2019 (center-left) | | "single-payer enhanced" | +34,000 federal; total national **+720 in 2020** | TT | [urban.org](https://www.urban.org/research/publication/incremental-comprehensive-health-reform-how-various-reform-options-compare-coverage-and-costs) | High |
| (c) — Mercatus (libertarian) | | Blahous 2018 | +32,600 federal budget commitments | TT | [mercatus.org](https://www.mercatus.org/research/working-papers/costs-national-single-payer-healthcare-system) | High |
| (c) — RAND (nonpartisan) | | 2019 | Federal **+221%**; **total national +1.8%** | TT | [rand.org RR-3106](https://www.rand.org/pubs/research_reports/RR3106.html) | High |
| (c) — Yale / *Lancet* | | Galvani et al. 2020 | **Total national −13%, >$450B/yr saved** | TT | [PubMed 32061298](https://pubmed.ncbi.nlm.nih.gov/32061298/) | High |
| (c) — CBO's own analysis | | 5 illustrative options, **single-year 2030, not a bill score** | Federal subsidies **+1,500 to +3,000**; NHE **−700 to +300** | CBO | [pub 56811](https://www.cbo.gov/publication/56811) | High |
| (c) — Sanders' financing menu | | | **~16,200** — roughly **half** the federal cost | CLAIM | [Options to Finance M4A](https://www.sanders.senate.gov/download/options-to-finance-medicare-for-all) | High |
| (c) — Medicare dental/vision/hearing | More | Sanders/Doggett bills 2025-03-11 | **No estimate published** | — | [sanders.senate.gov](https://www.sanders.senate.gov/press-releases/news-sanders-doggett-introduce-bills-to-expand-medicare-to-cover-dental-vision-and-hearing/) | — |
| (e) Hawley | **More** | Protect Medicaid and Rural Hospitals Act (2025-07-15): repeal provider-tax moratorium and state-directed-payment provisions, **double Rural Health Fund to $100B**, extend 5→10 yrs | **No CBO score exists** | CLAIM | [hawley.senate.gov](https://www.hawley.senate.gov/hawley-introduces-legislation-to-prevent-future-medicaid-cuts-invest-in-rural-hospitals/) | High (position) |
| (e) Vance | No cuts | Opposes Social Security/Medicare cuts and privatization | — | CLAIM | Wikipedia | Medium |
| (d) Libertarian | Less | "free market health care system"; phase out Social Security. No numbers | none | — | [lp.org](https://www.lp.org/platform/) | High |
| (d) Rand Paul | Less | Bill to end Medicaid payments for illegal aliens (2025-07-15) | Not scored | CLAIM | [paul.senate.gov](https://www.paul.senate.gov/dr-rand-paul-introduces-bill-to-end-medicaid-payments-for-illegal-aliens-immediately/) | Medium |
| Harris 2024 | More | **"Medicare at Home"** long-term care + hearing + vision — biggest departure from the FY25 baseline | **400 / 500 / 600** (bundled; no home-care-only figure exists) | TT (CRFB) | [CRFB](https://www.crfb.org/papers/fiscal-impact-harris-and-trump-campaign-plans) | High (bundle) |
| Buttigieg **2020 vintage** | More | "Medicare for All Who Want It" public option | Component **+1,500** claim / CRFB **+1,600**; **full plan scored as a NET −450 SAVING** | CLAIM + TT | [CRFB](https://www.crfb.org/papers/primary-care-estimating-democratic-candidates-health-plans) | High |
| Ossoff | More | Extend enhanced ACA PTCs — the only individual item tied to an official CBO score | uses CBO figures above | CBO + CLAIM | [ossoff.senate.gov](https://www.ossoff.senate.gov/press-releases/watch-in-floor-speech-sen-ossoff-urges-senate-to-extend-affordable-care-act-tax-credits/) | High |
| Shapiro, Pritzker, Beshear, Moore, Newsom | Oppose cuts | State-specific coverage-loss counts only | **No federal proposal exists to score** | CLAIM | state press offices | High |

### Mandatory framing box — Medicare for All

Every serious estimate shows **federal** spending rising enormously **because the federal government
absorbs premiums and out-of-pocket costs that households and employers pay today**. Whether **total
national** health spending rises or falls is a separate and genuinely contested question.

**RAND is the cleanest illustration: total national health spending +1.8%, federal spending +221%.**

Never present $32–34T without the denominator. Present the high estimates (Mercatus, Urban) and the
savings estimates (Yale/*Lancet*, CBO's low options) together, with affiliations stated neutrally.

On financing: Sanders' own menu totals ~$16.2–17.5T against a $32–34T federal cost. Urban's
counterpoint is that his proposed taxes raise $15.3T against $32.0T — a ~$16.7T gap on health care
alone. Sanders' rebuttal is that ~$30T of projected government health spending already exists, so
$30T + $17.5T covers a projected $47T post-M4A national bill. Present both.

---

## Category 3 — Education and child care

| Platform | Direction | Summary | 10-yr ($B) | Scorer | Source | Conf. |
|---|---|---|---:|---|---|---|
| (a) GOP / OBBBA | **Less** | Grad loans capped $20,500/yr, $100k lifetime; professional $50k/yr, $200k lifetime; Grad PLUS eliminated; repayment overhaul; Pell extended to workforce training; 529s cover K-12 | **−284.0** | CBO | [pub 61570](https://www.cbo.gov/publication/61570) Title VIII | High |
| (a) — components | | loan limits −44.2; loan repayment −270.5; Pell shortfall +10.5; servicing +1.0 | | CBO | same | High |
| (b) Dem — child care | More | **$10/day for families up to $200,000**, lowest-income pay nothing | **+424.3** | OMB | Table S-6 | High |
| (b) — universal preschool | More | All ~4M four-year-olds | **+200.0** | OMB | Table S-6 | High |
| (b) — interaction adjustment | | | **−24.3** | OMB | Table S-6 | High |
| (b) — **early learning subtotal** | More | | **+600.0** | OMB | Table S-6 | High |
| (b) — permanent version | More | Only official score of policies of this design | **+752** (2022–31) | CBO | [permanent-BBB letter](https://www.cbo.gov/system/files/2021-12/57673-BBBA-GrahamSmith-Letter.pdf) | High |
| (b) — double Pell | More | Public and non-profit institutions | **+122.9** | OMB | Table S-6 | High |
| (b) — free community college | More | Federal-state partnership | **+90.0** | OMB | Table S-6 | High |
| (b) — HBCU/TCCU/MSI subsidies | More | Families under $125k | **+30.0** | OMB | Table S-6 | High |
| (b) — loan origination fees, cost fund | More | | **+19.4 / +12.0** | OMB | Table S-6 | High |
| (b) — **postsecondary subtotal** | More | | **+290.3** | OMB | Table S-6 | High |
| (c) College for All Act of 2025 | More | S.1832/H.R.3543. **Community college free for ALL, no income test.** Public 4-year free under **$150,000** (single parent/single independent) or **$300,000** (married). Grants $11,610 (4-yr) / $5,110 (CC). Federal share declines 100%→80% by 2030-31 | **No CBO score; no total in bill.** 2019 vintage claim was 2,200 incl. 1,600 debt cancellation; **the 2025 bill has NO debt cancellation** | TEXT | [govinfo BILLS-119s1832is](https://www.govinfo.gov/content/pkg/BILLS-119s1832is/html/BILLS-119s1832is.htm) | High (design) / Low (cost) |
| (c) GND for Public Schools | More | S.5195/H.R.9959. **NOT an AOC bill** — leads Bowman (117th/118th), Jayapal (119th House), Markey (Senate) | **~+2,000** authorizations: $446B capital + $250B block + $740B ESEA + $550B resiliency; IDEA ramps $6.4B→$69.6B | TEXT | [govinfo](https://www.govinfo.gov/content/pkg/BILLS-119s5195is/html/BILLS-119s5195is.htm) | High (text) |
| (c) child care | More | Child Care for Every Community Act S.2939 (Warren lead, 2025-09-30). Free ≤200% FPL; copay capped 1–7% | **"Such sums as may be necessary"** + $500M/yr admin — **no total, open-ended** | TEXT | [govinfo](https://www.govinfo.gov/content/pkg/BILLS-119s2939is/html/BILLS-119s2939is.htm) | High |
| (c) Sanders 2020 campaign | More | Universal childcare/pre-K | **+1,500** | CLAIM | [Wayback](https://web.archive.org/web/20200301/https://berniesanders.com/issues/how-does-bernie-pay-his-major-plans/) | Medium |
| (d) Libertarian | Less | Repeal "all federal programs not required under the Constitution" | none | — | [lp.org](https://www.lp.org/platform/) | High |
| (d) Rand Paul | Less | 2011: cut Dept. of Education 83% | Not scored, stale | CLAIM | Wikipedia | Low |
| Harris 2024 | More | Child care capped at **7% of income**; expand pre-K | **400 / 700 / 950** (bundled) | TT (CRFB) | [CRFB](https://www.crfb.org/papers/fiscal-impact-harris-and-trump-campaign-plans) | High |
| Harris 2024 | More | "Support quality education" | **150 / 350 / 700** | TT (CRFB) | same | High |
| Buttigieg **2020 vintage** | More | Universal child care/pre-K, **≤7% of income** | **+700** | CLAIM | [Wayback](https://web.archive.org/web/20200201193954/https://peteforamerica.com/policies/education/) | High |
| Buttigieg **2020 vintage** | More | Free public tuition <$100k; Douglass Plan | **NO TOTAL EVER PUBLISHED.** Components: +120 Pell, +50 HBCU/MSI | CLAIM | [Wayback](https://web.archive.org/web/20200201171440/https://peteforamerica.com/policies/higher-education/) | High (components) |
| Beshear | **State only** | Kentucky "Pre-K for All" is a **state** budget item, not federal | — | — | — | High |

---

## Category 4 — Safety net (SNAP, housing, cash aid, child credit as spending)

| Platform | Direction | Summary | 10-yr ($B) | Scorer | Source | Conf. |
|---|---|---|---:|---|---|---|
| (a) GOP / OBBBA — SNAP | **Less** | Work requirements to age 64; states with >6% error rates pay 15% of benefits; state admin share 50%→75%; Thrifty Food Plan limits | **−186.7** (Subtitle A) | CBO | [pub 61570](https://www.cbo.gov/publication/61570) Title I | High |
| (a) — SNAP section detail | | work reqs −68.6; state matching −40.8; Thrifty Food Plan −37.3; admin cost sharing −24.7; internet expenses −11.0; utility allowances −5.9; SNAP-Ed −5.5; alien eligibility −1.9; interactions +9.0 | | CBO | same | High |
| (a) — agriculture title NET | Less | Commodity supports **rise** (+50.5 Price Loss Coverage / ARC alone) | **−121.0** | CBO | same | High |
| (b) Dem — paid family and medical leave | More | 12 weeks, SSA-administered, "progressive partial wage replacement" | **+325.0** | OMB | Table S-6 | High |
| (b) — Child Tax Credit | More | Restore $3,000/$3,600 **through 2025 only**; permanent full refundability and advanceability | **+310.0** ($209.9 lands in 2025 alone) | OMB | Table S-6 | High |
| (b) — permanent ARPA CTC | More | The figure to use for a genuinely permanent version | **+1,600** (2022–31) | CBO | [permanent-BBB letter](https://www.cbo.gov/system/files/2021-12/57673-BBBA-GrahamSmith-Letter.pdf) |High |
| (b) — same, CRFB | More | | **>+1,700** through 2033, or +1,200 paired with TCJA dependent-exemption repeal | TT | [CRFB](https://www.crfb.org/blogs/build-your-own-child-tax-credit-web-based-version) | High |
| (b) — EITC childless expansion | More | Permanent | **+162.6** (OMB) / **+135** permanent (CBO) | OMB / CBO | Table S-6 | High |
| (b) — housing total | More | | **+182.9** | OMB | Table S-6 | High |
| (b) — housing components | | Mortgage Relief Credit +47.3; LIHTC expansion +36.6; Housing Innovation Fund +18.9; Neighborhood Homes Credit +18.8; ELI-veteran vouchers +13.1; **first-generation down-payment assistance +10.0**; foster-youth vouchers +9.2; ELI units +7.5; public housing modernization +7.5; homelessness +7.0; eviction prevention +3.0; older-adult rental assistance +3.0 | | OMB | Table S-6 | High |
| (b) — WH framing | More | "more than $258 billion… build or preserve over 2 million units" (combines mandatory + tax + discretionary) | 258 | CLAIM/OMB | [WH fact sheet](https://bidenwhitehouse.archives.gov/omb/briefing-room/2024/03/11/fact-sheet-the-presidents-budget-lowers-costs-for-the-american-people/) | Medium |
| (c) **Social Security Expansion Act** | More | S.393 (2023-02-13), reintroduced 2025-02-27. Raise first PIA bend point 22%, CPI-E COLA, special minimum at 125% of poverty, child benefits to 22; payroll tax above $250,000; 12.4% NII tax | **Solvent through 2096** (full 75-yr period); actuarial balance **+3.30% of payroll** vs current-law −3.42%; 75th-year balance +3.71%. Benefit **+$2,400/yr** | **SSA-OACT** + CLAIM | [SSA Chief Actuary letter](https://www.sanders.senate.gov/wp-content/uploads/SandersLetter-2023-0213.pdf) | High |
| (c) Housing for All | More | ~10M permanently affordable units; $70B public housing repair; Section 8 as an entitlement | **+2,500** | CLAIM (2020) | [Wayback](https://web.archive.org/web/20200301091520/https://berniesanders.com/issues/housing-all/) | Medium |
| (c) GND for Public Housing | More | S.5284/H.R.10063 (2026-08-06). ~1–1.5M units | **Sponsor figure moved: 180 (2019) → 172 (2021) → 234 (2024) → none (2026).** Bill text has **no cap** — only $1B admin, rest "such sums" | CLAIM / TEXT | [govinfo](https://www.govinfo.gov/content/pkg/BILLS-119hr10063ih/html/BILLS-119hr10063ih.htm) | High |
| (c) Universal School Meals | More | S.4518/H.R.8798 (2026-05-13): breakfast, lunch, dinner, snack for every student | **No cost estimate published** | — | [sanders.senate.gov](https://www.sanders.senate.gov/press-releases/news-sanders-omar-more-than-100-colleagues-introduce-legislation-to-end-child-hunger-through-universal-school-meals/) | — |
| (c) Medical debt cancellation | More | 2020 campaign | **+81** | CLAIM | Wayback pay-for page | Medium |
| (d) Libertarian | Less | "voluntary efforts of private groups"; phase out Social Security | none | — | [lp.org](https://www.lp.org/platform/) | High |
| (e) Hawley $5,000 CTC | More | Raises max CTC $2,000→$5,000; **creditable against payroll tax**; accrues from first dollar earned; available in the pregnancy tax year; optional installments | **No official score found** | CLAIM | [hawley.senate.gov](https://www.hawley.senate.gov/hawley-unveils-new-child-tax-credit-proposal-to-support-working-families/) | High (design) |
| (e) Tariff rebate — Hawley | More | American Worker Rebate Act (2025-07-28): **≥$600 per adult and per dependent child** ($2,400 for a family of four), scaling with tariff revenue | **No cost estimate found** | CLAIM | [hawley.senate.gov](https://www.hawley.senate.gov/hawley-introduces-legislation-to-send-rebate-checks-to-working-americans/) | High (design) |
| (e) Tariff dividend — Trump | More | Truth Social, 2025-11-09: **$2,000 per person** "not from high income." Bessent cast doubt 2025-11-16 | **No cost estimate found** | CLAIM | Wikipedia timeline | Medium |
| (e) Vance | More | CTC $2,000 → $5,000 (Aug 2024) | No score | CLAIM | Wikipedia | Medium |
| Harris 2024 | More | **$25,000 down-payment assistance for ALL first-time buyers** (the platform version was $25k for first-*generation* only) | CRFB **+100** / PWBM **+138** / Tax Foundation ~100 over 4 yrs — **unreconciled** | TT ×3 | [CRFB](https://www.crfb.org/blogs/kamala-harris-agenda-lower-costs-american-families) · [Tax Foundation](https://taxfoundation.org/research/all/federal/kamala-harris-tax-plan-2024/) | Medium |
| Harris 2024 | More | 3 million new units; $40B housing innovation fund | **200 / 250 / 500** | TT (CRFB) | [CRFB](https://www.crfb.org/papers/fiscal-impact-harris-and-trump-campaign-plans) | High ($) / Medium (3M pledge) |
| Harris 2024 | More | $6,000 newborn CTC + restore $3,000/$3,600 | CRFB **1,100 + 100**; PWBM **1,662 + 132**; CRFB headline bundles CTC+EITC at **1,400** flat | TT ×3 | same | High |
| Harris 2024 | More | Expanded EITC | CRFB **150** / PWBM **126** / TF ~160 | TT ×3 | same | High |
| Harris 2024 | More | Paid family and medical leave | **200 / 350 / 700** | TT (CRFB) | same | High |
| Booker — Baby Bonds | More | American Opportunity Accounts Act: $1,000 at birth, annual supplements up to $2,000 (<100% FPL) to $0 (500% FPL), ~3% interest, accessible at 18. Value at 18: **$46,215** (poorest) to $1,681 | **NO COST FIGURE EXISTS** — no CBO score in 5 Congresses, sponsor releases state none. **NOT reintroduced in the 119th** | CLAIM (design only) | [booker.senate.gov](https://www.booker.senate.gov/news/press/booker-pressley-reintroduce-bicameral-baby-bonds-legislation-to-tackle-wealth-inequality) | High (design) |
| Booker — current | More | Live 2025–26 position is bipartisan support (with Cruz) for the enacted **$1,000 Trump Accounts**, urging Fortune 1000 matching | No aggregate cost stated | CLAIM | [booker.senate.gov](https://www.booker.senate.gov/news/press/booker-cruz-urge-fortune-1000-ceos-to-back-trump-accounts) | High |
| Booker — jobs guarantee | More | Federal Jobs Guarantee Development Act of 2026, S.3864 (2026-02-12), pilot | Bill text: **"such sums as may be necessary."** Show as **open-ended, never $0** | TEXT | [govinfo](https://www.govinfo.gov/content/pkg/BILLS-119s3864is/html/BILLS-119s3864is.htm) | High |
| Booker — HOME Act renter's credit | More | Last introduced S.5223, 2022-12-08. **Lapsed — not reintroduced in the 118th or 119th** | **No score, no sponsor figure** | — | [govtrack](https://www.govtrack.us/congress/bills/117/s5223) | High (history) |
| Gallego — housing | More | **"The Path Home"** (2026-01-14) — a framework paper, **not a bill, and not the "HOMES Act"** | **No total, no pay-fors, no CBO score.** Only headline is an output target: **8.5M units over a decade**. Costed items: first-time homebuyer credit 10% of price capped **$15,000**; IRA early-withdrawal exception $10,000→$50,000 | CLAIM | [Housing-Plan.pdf](https://www.gallego.senate.gov/wp-content/uploads/2026/01/Housing-Plan.pdf) · [NLIHC](https://nlihc.org/resource/senator-ruben-gallego-announces-housing-plan-path-home) | High |
| Gallego — bills | More | S.1527, S.1203, S.3309, S.2867, S.5366 | **`cboCostEstimates: None` on every one** | — | congress.gov API | High |
| Shapiro, Pritzker, Beshear, Moore, Newsom, Whitmer | **No stated federal position** | SNAP/safety-net commentary only, all state-specific impact counts | **No proposal exists to score** | CLAIM | state press offices | High |

---

## Category 5 — Infrastructure, climate, energy

| Platform | Direction | Summary | 10-yr ($B) | Scorer | Source | Conf. |
|---|---|---|---:|---|---|---|
| (a) GOP / OBBBA | **Less** | Titles IV/V/VI. OBBBA's energy action is mostly **revenue-side credit repeal**, which falls outside a spending taxonomy | **−68.7** combined outlays (IV −42.4, V −21.3, VI −5.0) | CBO | [pub 61570](https://www.cbo.gov/publication/61570) | Medium |
| (b) Dem mainstream | More (defensive) | **No large new mandatory climate program.** The only sizeable new mandatory line is the American Climate Corps | **+8.0** mandatory; rest discretionary ($10.6B DOE clean energy, $23B adaptation/resilience, $8.5B innovation, $3B Green Climate Fund) | OMB | Table S-6 | High |
| (b) 2024 platform | More (defensive) | Explicitly an IRA-defence document. **No new costed climate program**; cites $400B+ private commitments, $21B BIL environmental justice, $27B GGRF | descriptive only | CLAIM | Platform PDF | High |
| (b) IRA baseline being defended | — | Current-law anchor for the calculator | Energy & climate **−386** (2022–31); enacted IRA net **−238 deficit** | CBO | [pub 58455](https://www.cbo.gov/publication/58455) | High |
| (c) **Green New Deal, H.Res.109** | Aspirational | **NON-BINDING RESOLUTION.** Appropriates nothing, authorizes nothing, creates no program. Introduced 2019-02-07, referred to 11 committees, **never received a floor vote**. Its only dollar figures are cited climate-*damage* projections | **NO CBO SCORE, AND CBO COULD NOT MEANINGFULLY PRODUCE ONE.** congress.gov's own field reads `CBO Cost Estimates [0]` | — | [govinfo](https://www.govinfo.gov/app/details/BILLS-116hres109ih) | High |
| (c) The "$93 trillion" claim | — | See box below | **51,600 – 94,400** (2020–29) | TT (AAF) | [americanactionforum.org](https://www.americanactionforum.org/research/the-green-new-deal-scope-scale-and-implications/) | Medium |
| (c) Sanders' own GND | More | 2020 campaign | **+16,300**, with claimed offsets incl. $1,215 defense reduction | CLAIM | [Wayback](https://web.archive.org/web/20200301/https://berniesanders.com/issues/how-does-bernie-pay-his-major-plans/) | Medium |
| (c) GND for Health Act | More | S.5134/H.R.9962 (2026-07-27), Markey lead | **~+254**: $100B "Green Hill-Burton"; $130B environmental-justice health centers; $9B training; $5B planning | TEXT | [govinfo](https://www.govinfo.gov/content/pkg/BILLS-119s5134is/html/BILLS-119s5134is.htm) | High |
| Buttigieg **2020 vintage** | More | Climate plan | **+1,500** — campaign claim, **independently corroborated by CRFB** | CLAIM + TT | [CRFB](https://www.crfb.org/blogs/pete-buttigiegs-climate-change-plan) | High |
| Whitmer | More (unquantified) | National industrial strategy | **No cost stated** | CLAIM | michigan.gov | Medium |
| (d) Libertarian | Less | No climate spending; repeal federal programs | none | — | [lp.org](https://www.lp.org/platform/) | High |

### Mandatory framing box — the "$93 trillion" figure

Source: **American Action Forum** (center-right, founded by a former CBO Director), "The Green New
Deal: Scope, Scale, and Implications," 2019-02-25. Components, 2020–2029:

| Component | Low | High |
|---|---:|---:|
| Low-carbon electricity grid | 5.4T | 5.4T |
| Net-zero transportation | 1.3T | 2.7T |
| **Guaranteed jobs** | **6.8T** | **44.6T** |
| **Universal health care** | **36T** | **36T** |
| Guaranteed green housing | 1.6T | 4.2T |
| Food security | 1.5B | 1.5B |

Three caveats that must travel with the number:

1. **AAF published no total.** The $51T–$93T range is arithmetic others performed on AAF's six
   components. [PolitiFact rated the $93T claim **False**](https://politifact.com/factchecks/2019/mar/12/joni-ernst/joni-ernst-says-green-new-deal-would-cost-93-trill/)
   on exactly this ground.
2. **~$80T of the $93T is not climate spending** — universal health care ($36T) and a job guarantee
   (up to $44.6T), neither of which appears in H.Res.109's text. **The three actual climate items
   total ~$8.3–12.3T.**
3. **AAF's own lead author, Douglas Holtz-Eakin, called the estimates "very rough"** for "a plan
   that's only partially developed." Other named disputants: Politico ("bogus"), Howard Gleckman
   (Urban-Brookings Tax Policy Center) on failure to adjust for inflation and population.

Recommended UI wording:

> $51–93 trillion / 10 years. Source: American Action Forum (Feb 2019), a center-right think tank —
> a total arrived at by summing AAF's six component estimates. AAF published no total, and its lead
> author called the estimates "very rough" for "a plan that's only partially developed." PolitiFact
> rated the $93T claim False. Roughly $36T of it is universal health care and up to $44.6T a jobs
> guarantee — neither appears in H.Res.109's text, which has no CBO score because it is a
> non-binding resolution with no spending provisions.

---

## Category 6 — Immigration and border enforcement

| Platform | Direction | Summary | 10-yr ($B) | Scorer | Source | Conf. |
|---|---|---|---:|---|---|---|
| (a) GOP / OBBBA | **More** | Titles IX + X combined | **+175.0 outlays**, but **net deficit only +137.8** because Title X raises **+37.2 in immigration fees** | CBO | [pub 61570](https://www.cbo.gov/publication/61570) | High |
| (a) — Title IX Homeland Security | More | | **+128.9** | CBO | same | High |
| (a) — Title X Judiciary | More | Fees: asylum, employment authorization, parole, TPS, visa integrity, Form I-94 | **+46.1 outlays / +37.2 revenues** | CBO | same | High |
| (a) — component breakdown | | border wall ~$46.5B; detention 100k beds ~$45B (+365%); ICE agents/transport/deportation ~$29.9B (10,000 officers); state/local law enforcement $17.3B; DHS reimbursement $10B; Border Patrol $7.8B (3,000 agents); border technology $6.2B; immigration judges $3.3B | | not individually CBO-labeled | Wikipedia breakdown of the bill | Medium |
| (a) — corroborating trend | | Function 750 outlays FY2026 Oct–Jul **+$21.2B (+31%)** YoY | | Treasury | MTS Table 9 | High |
| (b) Dem mainstream | **More enforcement** | DHS discretionary $62.2B FY25 (+2.0%); CBP+ICE **$25.9B** (+$1.9B vs 2023); **34,000 ICE detention beds**; +350 Border Patrol agents; 375 new immigration judge teams ($1.7B DOJ incl. $1.3B EOIR); ORR $9.3B for up to 125,000 refugees | annual, not 10-yr | OMB | FY2025 Budget Table S-8, p. 41 | High |
| (b) bipartisan Senate border bill | More | Lankford–Murphy–Sinema, Feb 2024; Democrats endorsed. Inside a $118.3B supplemental: $6.8B CBP, $7.6B ICE | **+20.2**. **CBO never scored its policy provisions** | TT (CRFB from Senate Approps) | [CRFB](https://www.crfb.org/blogs/senate-set-consider-118-billion-national-security-border-package) | High |
| (b) 2024 platform | More enforcement | Endorses the bipartisan bill; no independent dollar figure | — | CLAIM | Platform PDF | High |
| (c) Progressive | **Less** | Sanders amendment to cut ICE funding and redirect to Medicaid (~700,000 would keep coverage) | **−75**. **Vote outcome not stated in the release and unverified** | CLAIM | [sanders.senate.gov](https://www.sanders.senate.gov/press-releases/news-sanders-secures-vote-on-his-amendment-to-cut-75-billion-in-ice-funding-and-redirect-those-funds-to-medicaid/) | Medium |
| (d) Libertarian | Less | Open-immigration principles; no enforcement spending figure | none | — | [lp.org](https://www.lp.org/platform/) | High |
| (e) Vance | More | Finish the border wall | **+3** | CLAIM | Wikipedia | Medium |
| Harris 2024 | More | "Improve border security" | **0 / 100 / 200** | TT (CRFB) | [CRFB](https://www.crfb.org/papers/fiscal-impact-harris-and-trump-campaign-plans) | High |
| Buttigieg, Booker, AOC, Ossoff, Gallego, all governors | **No stated federal position** | No costed federal immigration-spending proposal found | — | — | — | High |

Post-OBBBA update: FY2026 appropriations **excluded** ICE and Border Security Operations funding;
Congress moved it to reconciliation. The **Secure America Act (2026-06-10)** appropriated **~$70B**
through 2029, including $5B to the DHS Secretary —
[2026 United States federal budget](https://en.wikipedia.org/wiki/2026_United_States_federal_budget).
Confidence: Medium.

---

## Category 7 — Deficit and debt impact of the whole platform

| Platform | Figure | Window | Scorer | Source | Conf. |
|---|---|---|---|---|---|
| **(a) GOP / OBBBA** | **+$3.4T primary · +$718B debt service · +$4.1T with interest · +$5.0T if the 10 temporary tax provisions are made permanent.** Debt held by public +9.5 pp of GDP (+11.5 pp if permanent) | 2025–2034 | **CBO + JCT** | [pub 61466](https://www.cbo.gov/publication/61466) | High |
| (a) cross-check | +$3.0T dynamic before interest; +$3.8T with interest. A second Tax Foundation page gives +$5.2T conventional incl. interest | 2025–2034 | TT | [Tax Foundation](https://taxfoundation.org/research/all/federal/one-big-beautiful-bill-act-tax-changes/) | Medium — **TF pages conflict; prefer CBO** |
| **(b) Dem mainstream** | **−$3,227B** (Table S-2 total, incl. −$388B debt service). White House claim: "roughly $3 trillion." Gross: +$3.2T new spending/tax breaks, +$5.2T revenue, −$900B spending cuts, −$400B interest | 2025–2034 | **OMB** + TT (CRFB reads $3.3T) | [WH fact sheet](https://bidenwhitehouse.archives.gov/omb/briefing-room/2024/03/11/fact-sheet-the-presidents-budget-cuts-the-deficit-by-3-trillion-over-10-years/) · [CRFB](https://www.crfb.org/papers/analysis-presidents-fy2025budget) | High |
| (b) debt path | 106.0% of GDP in 2034, vs 113% under OMB's baseline and **116% under CBO's** | | OMB + CBO | Table S-1 | High |
| (b) **CRFB's caveat** | *"Adding the cost of the tax cut extensions into the budget without further offsets could **wipe away most or all of the budget's deficit reduction**."* The budget promises to extend TCJA cuts below $400k "with offsets" but **specifies neither the policies nor the cost** | | TT | [CRFB](https://www.crfb.org/papers/analysis-presidents-fy2025budget) | High |
| (b) **no CBO re-estimate exists** | CBO published only a discretionary-only analysis. **There is no official CBO deficit figure to set against the $3.3T claim** | | CBO | [pub 60041](https://www.cbo.gov/publication/60041) | High |
| **Harris 2024 — CRFB** | **Low $300B · CENTRAL $3.95T · High $8.30T** debt increase | through FY2035 | TT | [CRFB](https://www.crfb.org/papers/fiscal-impact-harris-and-trump-campaign-plans) | High |
| **Trump 2024 — CRFB** (same paper, same method, same window) | **Low $1.65T · CENTRAL $7.75T · High $15.55T** | through FY2035 | TT | same | High |
| Harris 2024 — Penn Wharton | **+$1.2T conventional / +$2.0T dynamic** primary deficits; spending +$2.3T, revenue +$1.1T; GDP −1.3% by 2034 | 2025–2034 | TT | [PWBM](https://budgetmodel.wharton.upenn.edu/p/2024-08-26-the-2024-harris-campaign-policy-proposals/) | High |
| **(c) Progressive** | **No aggregate score exists.** Sponsors claim each plan is fully paid for. Urban's counterpoint: proposed taxes raise **$15.3T against a $32.0T** federal health cost | | TT | [Urban](https://www.urban.org/research/publication/sanders-single-payer-health-care-plan-effect-national-health-expenditures-and-federal-and-private-spending) | High (that no score exists) |
| (c) wealth tax revenue | Sanders **$4.35T** (1%→8%, ~180,000 households); Warren **$2.75T** (~75,000 households) | 2019–2028 | TT (Saez & Zucman, UC Berkeley) | [Sanders letter](https://gabriel-zucman.eu/files/saez-zucman-wealthtax-sanders.pdf) · [Warren letter](https://gabriel-zucman.eu/files/saez-zucman-wealthtax-warren.pdf) | High |
| **(d) Libertarian** | Balanced Budget Amendment "balanced exclusively by cutting expenditures, and not by raising taxes"; repeal the income tax, abolish the IRS. **No dollar figures anywhere in the platform** | | — | [lp.org](https://www.lp.org/platform/) | High |
| (d) Rand Paul | **Six Penny Plan**: cut 6% off every projected dollar annually, balance on-budget in five years. Forced floor vote **failed 39–56**, 2024-09-25. On OBBBA: *"adds $270 billion to the national debt in 2026 and over $500 billion in five years"*; wanted "a 90% reduction in the debt ceiling" increase | | CLAIM + Senate vote record | [paul.senate.gov](https://www.paul.senate.gov/why-i-said-no-to-the-one-big-beautiful-bill/) · [Six Penny Plan](https://www.paul.senate.gov/dr-rand-paul-introduces-six-penny-plan-to-balance-the-federal-budget-in-five-years-2/) | High |

> **Do not present CRFB's $3.95T and PWBM's $1.2T as competing scores of the same plan.** PWBM
> (Aug 26, 2024) covered only proposals announced by late August; CRFB (Oct 7/28) covered the full
> platform, over a different window. Use CRFB's Harris **and** Trump numbers together for a
> like-for-like comparison.

## B8. Other Republican-baseline fiscal actions, 2025–2026

- **Rescissions Act of 2025**, signed 2025-07-24: **$9.0B** = **$7.9B foreign aid/USAID** + **$1.1B
  CPB**. (House version was $9.4B; the Senate removed $400M in PEPFAR cuts.) Confidence: Medium-High.
- **FY2026 appropriations** concluded 2026-04-30, ending a DHS shutdown that began 2026-02-14.
  **$1.622T base discretionary; $838.7B defense.** A CR through 2026-12-11 was enacted 2026-09-02 —
  [CRFB](https://www.crfb.org/blogs/appropriations-watch-fy-2027). Confidence: Medium-High.
- **DOGE** ceased operation 2026-07-04. Claims fell from $2T to $1T to $150B. Independent analysis
  put its **cost** at $135B; a government estimate at $21.7B; IRS projected >$500B revenue loss.
  Confidence: Medium.
- **Enhanced ACA premium tax credits lapsed 2025-12-31.** 2026 marketplace enrollment fell in every
  state except New Mexico; KFF finds premiums up ~58% (~$780) on average, 1 in 10 dropped coverage —
  [KFF](https://www.kff.org/affordable-care-act/how-has-aca-marketplace-enrollment-changed-across-states-in-2026/).

---

# THE ELEVEN PREMISE CORRECTIONS

Each of these was in the research brief or in wide circulation, and each is wrong. Several would have
produced materially incorrect calculator output, and they cut in both partisan directions.

**1. "OBBBA total deficit effect ~$3.4T over 10 years with interest."**
$3.4T is the **primary** (non-interest) effect. **With interest it is $4.1T**; $5.0T if the ten
temporary tax provisions are made permanent. Treating $3.4T as the with-interest figure understates
the Republican baseline by ~20%. [CBO pub 61466](https://www.cbo.gov/publication/61466)

**2. "Medicaid −$911B."**
The enacted-law figure is **−$914,634M outlays / −$886,754M deficit effect** for Title VII Subtitle B
Chapter 1. −$911B is an earlier vintage. Also: a section-level hand-sum of the workbook gives
−$989,667M (gross of the separately-listed +$95,448M interactions line) — **do not cite the hand-sum
where CBO published a subtotal.** [CBO pub 61837](https://www.cbo.gov/publication/61837)

**3. "SNAP −$186B" — correct, but at the wrong level.**
−$186,650M is the **Subtitle A (Nutrition)** total. The **Title I total is −$120,960M**, because
Subtitle C (Commodities) *increases* farm spending by $50,464M for Price Loss Coverage/ARC alone.
Report SNAP at subtitle level and never interchange the two.

**4. "Rural Health Transformation fund doubled to $100B."**
The **enacted** amount is **$50,000M budget authority / $47,152M outlays** ($10B/yr FY2026–2030).
$100B is Hawley's July 2025 *proposal* (Protect Medicaid and Rural Hospitals Act), which has no CBO
score. Do not present a proposal as law.

**5. "Restore enhanced ACA credits ~$273B" and "~$335B."**
**$272.7B is correct** — but it is OMB's own score in the FY2025 budget over **2025–2034**. The
**current official CBO figure is $349.8B over 2026–2035** (+3.8M insured in 2035),
[pub 61734](https://www.cbo.gov/publication/61734). **The "~$335B" could not be sourced by two
independent researchers** — treat it as unverified and ship $350B.

**6. "College for All: families under $125k."**
Superseded. The **College for All Act of 2025 (S.1832, 119th Congress)** uses **$150,000**
(single parent / single independent AGI) and **$300,000** (married). Verified directly against the
text: four occurrences of each, **zero occurrences of $125,000 or $250,000**. The $125k/$250k pair
is the 2023 version (S.1963). Community college is free for **all**, with no income test.

**7. "College for All federal/state cost share 67/33."**
Wrong. The federal share **declines**: 100% (2026-27) → 95% → 90% → 85% → **80% from 2030-31**.
Per-student grants 2026-27: $11,610 (four-year), $5,110 (community college).

**8. "Green New Deal for Public Housing ~$172B."**
$172B is the **2021** sponsor figure only. The number moved **$180B (2019) → $172B (2021) → $234B
(2024) → no figure (2026)** for substantially the same bill, and **no version of the bill text
contains a cap** — the only hard number is $1B for administration, with everything else "such sums
as necessary."

**9. "Biden FY2025 budget caps child care at 7% of income."**
It does not. Verbatim: *"working families with incomes up to $200,000 per year would be guaranteed
affordable, high-quality child care from birth until kindergarten, with most families paying no more
than **$10 a day**, and the lowest income families paying nothing."* The 7% figure is (i) an existing
CCDF administrative rule (45 CFR 98.45) covering ~100,000 families and (ii) Harris's 2024 campaign
framing.

**10. "Medicare dental/vision/hearing was scored by CBO in Build Back Better."**
**The House-passed Build Back Better Act contained only the HEARING benefit.** Dental and vision were
dropped and never scored in H.R. 5376. CBO scored §30901 hearing at **$36,720M (2022–2031)**,
[pub 57627](https://www.cbo.gov/publication/57627). The $238B dental figure is from **H.R. 3 (116th
Congress)** and reaches us only via KFF's citation.

**11. "CBO: 10.9 million lose health insurance under OBBBA."**
That figure is from [CBO pub 61463](https://www.cbo.gov/publication/61463), explicitly *"H.R. 1, as
passed by the House of Representatives"* (June 4, 2025) — **House-passed vintage, not enacted law**.
The enacted-law figure available is **+7.5 million uninsured in 2034 from the Medicaid chapter
alone**. A whole-law enacted coverage figure was not located.

**Bonus corrections of the same kind:**
- **Gallego's plan is "The Path Home" (2026-01-14), not the "HOMES Act"** — a framework paper with no
  costs, not a bill.
- **The Green New Deal for Public Schools Act has never been an AOC bill** — leads are Bowman
  (117th/118th), Jayapal (119th House), Markey (Senate).
- **Buttigieg's "$1.5T health plan" inverts the sign if misused** — that is the gross cost of one
  component; CRFB scored his **full** health plan as a **net $450B saving**.
- **The Democratic mainstream defense position is a real-terms cut, not an increase** — CBO scores
  the $895B request at $59B (6%) **below** 2024.

---

# PART C — Household value of benefits outside take-home pay

## C1. Child care

Source: [Child Care Aware of America, "Child Care in America: 2025 Price & Supply"](https://info.childcareaware.org/price-and-supply-2025)
(published May 2026, **data year 2025**).

**National average annual price, all ages and settings: $13,184.**

| Age / setting | Method 1 (avg of averages) | Method 2 (space-weighted) | Method 3 (program-weighted) |
|---|---:|---:|---:|
| Infant — center | **15,636** | 15,015 | 15,728 |
| Infant — family child care home | 11,673 | 13,834 | 12,336 |
| 4-year-old — center | **12,555** | 12,165 | 12,470 |
| 4-year-old — family child care home | 10,572 | 12,178 | 14,045 |

- Price change 2021→2025: **+23%** (general inflation +24%).
- **Toddler national average: NOT PUBLISHED** in the retrievable report. Do not invent one; toddler
  prices sit between infant and 4-year-old.
- Share of income (2024 data): **10% for married couples, 35% for single parents** —
  [CCAoA 2024](https://www.childcareaware.org/price-landscape24/). 2024 national average $13,128.
- **Geographic variation is large** and CCAoA explicitly warns against relying on the national
  number. State-level dollar figures live in per-state fact sheets that did not render to a fetcher.

### The 7% affordability benchmark — actual citation

**Origin (2016):** preamble to the CCDF final rule, **81 FR 67438** at **81 FR 67515**:

> "We establish a new Federal benchmark for affordable family co-payments of **seven percent of
> family income**…"

[federalregister.gov/documents/2016/09/30/2016-22986](https://www.federalregister.gov/documents/2016/09/30/2016-22986/child-care-and-development-fund-ccdf-program)

**Made binding (2024):** **89 FR 15366**, amending **45 CFR 98.45(b)(5)** and **98.45(l)(3)** —
co-payments "are affordable and **do not exceed 7 percent of income for all families**."
[federalregister.gov/documents/2024/03/01/2024-04139](https://www.federalregister.gov/documents/2024/03/01/2024-04139/improving-child-care-access-affordability-and-stability-in-the-child-care-and-development-fund-ccdf)

> **Framing caveat:** 7% caps **subsidized families' CCDF co-payments**. It is not a general market
> affordability standard, although it is very widely quoted as one. Context from the same rule: only
> **15 Lead Agencies** had all co-payments at ≤7%; elsewhere they ran **as high as 27% of income**.
> White House CEA: households under $25,000 pay **9–31%** of income for child care; households above
> $150,000 pay **6–8%**.

**DOL National Database of Childcare Prices** is county-level but covers only **2008–2022** — four
years staler than CCAoA, and its medians render in a Tableau embed while the .xlsx returns 403.
Prefer CCAoA. [dol.gov/agencies/wb/topics/childcare/price-by-age-care-setting](https://www.dol.gov/agencies/wb/topics/childcare/price-by-age-care-setting)

## C2. College costs, 2025-26

Source: [College Board, Trends in College Pricing and Student Aid 2025](https://research.collegeboard.org/trends/college-pricing) —
parsed from the [underlying data workbook](https://research.collegeboard.org/media/xlsx/Trends-in_College-Pricing-2025-excel-data.xlsx).
Table CP-1 prepared October 2025; published prices are **nominal**, net prices in **2025 dollars**.

### Published (sticker) prices

| Sector | Tuition & fees | Housing & food | T&F + housing/food | Full published COA |
|---|---:|---:|---:|---:|
| Public two-year, in-district | **4,150** | 10,850 | **15,000** | 21,320 |
| Public four-year, in-state | **11,950** | 13,900 | **25,850** | 30,990 |
| Public four-year, out-of-state | 31,880 | 13,900 | 45,780 | — |
| Private nonprofit four-year | 45,000 | 15,920 | 60,920 | 65,470 |

Year over year: public four-year in-state +$340 (+2.9%); public two-year +$110 (+2.7%); private
nonprofit +$1,750 (+4.0%).

### NET prices after grant aid — the most important honesty point in Part C

| Sector | Grant aid | **Net T&F** | Net T&F + housing/food | Net COA |
|---|---:|---:|---:|---:|
| Public two-year, in-district | 5,340 | **−1,190** | 9,660 | 15,980 |
| Public four-year, in-state | 9,650 | **2,300** | **16,200** | 21,340 |
| Private nonprofit four-year | 28,090 | 16,910 | 32,830 | 37,380 |

> **Average net tuition and fees at a public four-year is $2,300, not $11,950**, and at community
> college the average student receives **more grant aid than tuition costs**. But net **total** cost
> is still $16,200 and $15,980, because housing and food dominate. A calculator showing "free college
> saves you $11,950/yr" **overstates the average gain by roughly 5x**; one showing only the −$1,190
> community-college net understates the real burden. **Show both.**

Caveat: the latest IPEDS grant-aid year is 2022-23, so grant aid for 2023-24 through 2025-26 is
estimated. Net T&F at public four-years **peaked at $4,450 in 2012-13** (2025 dollars) and has fallen
since.

### Geographic variation

- **State averages, public four-year in-state:** $6,360 (Florida) to $18,090 (Vermont) — ~2.8x.
- **State averages, public two-year:** $1,440 (California) to $8,900 (Vermont) — ~6x.
- **Flagships (Table CP-6, constant 2025 dollars):** University of Florida **$6,380** to UConn
  **$21,334** — a **3.3x spread**. (List truncated at "MI" alphabetically; true national min/max may
  lie outside this range.) Flagships price above their state's sector average.
- **Real in-state tuition has been falling** at most flagships over five years. A framing of
  uniformly exploding college costs misstates the recent trend, even though levels remain high.

NCES cross-check (2022-23, constant 2022-23 dollars, broader COA definition): public 4-year
**$27,100**; private nonprofit **$58,600** — [nces.ed.gov/fastfacts/display.asp?id=76](https://nces.ed.gov/fastfacts/display.asp?id=76).

## C3. Universal pre-K

- **Family saving:** ~**$12,400/yr** for a center-based 4-year-old (2025), from C1.
- **Who would actually gain** — [NIEER, *The State of Preschool 2025*](https://nieer.org/yearbook/2025)
  (school year 2024-25): only **37% of 4-year-olds** and **9% of 3-year-olds** are enrolled in
  state-funded preschool. Total enrollment ~1.8 million. **So roughly 63% of 4-year-olds are not in
  state-funded pre-K — those are the households that would see a new dollar gain.**
- **State spending: $8,124 per child enrolled** in state funds ($9,988 all-reported). That is *below*
  the $12,555 market price of center-based care, so a universal program at current per-child funding
  levels **would not fully displace private cost** unless funding rose.

## C4. Paid family leave

**Biden FY2025 proposal:** national comprehensive paid family and medical leave administered by SSA,
**up to 12 weeks** plus up to three days of bereavement. **10-year cost $325.0B** (Table S-6).

> The Budget specifies only *"progressive, partial wage replacement."* It gives **no percentage and
> no cap**. Do not attribute a specific replacement rate to it.

**The design it tracks — FAMILY Act, S.1714 (118th Congress)**, `BILLS-118s1714is`. Monthly benefit:

| Earnings band (2024 dollars, wage-indexed) | Replacement |
|---|---:|
| Up to $1,257 | 85% |
| $1,257 – $3,500 | 69% |
| $3,500 – $6,200 | 50% |

**Maximum $4,000/month; minimum $580/month.** Duration 60 caregiving days per benefit period
(max 20/month) = 12 weeks.

**Real state programs, for a grounded model:**

| Program | Weeks | Replacement | Cap |
|---|---:|---|---|
| [New York PFL 2026](https://paidfamilyleave.ny.gov/2026) | 12 | **67%** of AWW | **$1,228.53/wk** (67% of NYSAWW $1,833.63) |
| [California PFL 2026](https://edd.ca.gov/en/disability/Calculating_PFL_Benefit_Payment_Amounts/) | 8 | **70–90%** by income tier | **$1,765/wk**; min $50/wk |

**Worked example, $60,000 salary** ($1,153.85/wk) — *calculated from the sourced parameters, not
published figures*:

| Model | Weekly | Total leave benefit |
|---|---:|---:|
| Generic "12 weeks at 2/3" | 769.23 | **9,231** |
| NY PFL 2026 (12 wks, 67%) | 773.08 | **9,277** |
| FAMILY Act S.1714 (12 wks) | ~776.80 | **10,098** |
| CA PFL 2026 (8 wks, 70% tier) | 807.69 | **6,462** |

The FAMILY Act's progressive formula lands near two-thirds at $60,000 but replaces ~85% near the
bottom and is capped at $4,000/month (so a $150,000 earner gets ~32%). **Apply the bracket formula,
not a flat rate.**

## C5. Medicare dental, vision, hearing

[KFF, Sept 21, 2021](https://www.kff.org/medicare/issue-brief/dental-hearing-and-vision-costs-and-coverage-among-medicare-beneficiaries-in-traditional-medicare-and-medicare-advantage/)
(**data year 2018**, Medicare Current Beneficiary Survey):

| Service | Share using it | **Average annual OOP among users** |
|---|---:|---:|
| Dental | 53% (31.3M) | **$874** |
| Vision | 35% (20.3M) | **$230** |
| Hearing | 8% (4.6M) | **$914** |

[KFF, July 28, 2021](https://www.kff.org/medicare/issue-brief/medicare-and-dental-coverage-a-closer-look/)
(2018–2019): **47% of beneficiaries (24 million) had no dental coverage**; 47% had no dental visit in
the past year (73% of those earning under $10,000); **20% of dental users spent >$1,000**, 10% spent
>$2,000. An older KFF brief (2016 data, different definition) put no-coverage at 65% — **cite the
year explicitly.**

**CBO scores:** the House-passed Build Back Better Act contained **only hearing** — §30901,
**$36,720M over 2022–2031** ([CBO pub 57627](https://www.cbo.gov/publication/57627)), ~**$57/beneficiary/yr**
averaged, ~$78/yr at steady state (~64M beneficiaries). **Dental: ~$238B over 2020–2029** from
**H.R. 3 (116th Congress)**, as cited by KFF — ≈$370/beneficiary/yr.

All KFF DVH out-of-pocket data is **2016–2019 vintage**. Inflate for a 2026 calculator and say so.

## C6. Medicare for All — what a household pays today

[KFF Employer Health Benefits Survey **2025**](https://www.kff.org/health-costs/report/2025-employer-health-benefits-survey/)
(the 2026 survey normally releases in October and is not out):

| | Total premium | Worker contribution | Employer share |
|---|---:|---:|---:|
| **Family coverage** | **26,993** | **6,850** | 20,143 (~74%) |
| **Single coverage** | 9,325 | 1,440 | 7,885 (~84%) |

- Family premiums +6% vs 2024; single +5%. 2020→2025: family +26%, wages +28.6%, inflation +23.5%.
- **Average general annual deductible, single coverage: $1,886.** Small firms $2,631; large firms
  $1,670. **34% of covered workers face a single deductible of $2,000 or more.**
- **Average family deductible: not reported in KFF's 2025 summary — UNVERIFIED.**

[BLS Consumer Expenditure Survey **2024**](https://www.bls.gov/news.release/cesan.nr0.htm)
(published Sept 2025), average per consumer unit: **healthcare $6,197** = health insurance $4,055 +
medical services $1,252 + drugs $658 + supplies $233.

### The double-count trap

> **Do not add BLS's $6,197 to KFF's $6,850.** The BLS figure already contains a $4,055 health
> insurance line, so summing them double-counts premiums.

**Recommended household-visible figure:**
`$6,850 (KFF premium contributions) + ~$2,143 (BLS non-premium OOP) ≈ $8,993/yr`, with **$26,993**
quoted separately as the total premium including the employer share that M4A advocates argue is
really forgone wages. Note BLS consumer units average ~2.4 people, so $2,143 is not
family-of-four-specific.

## C7. Free public college — who qualifies

**College for All Act of 2025, S.1832 (119th Congress) / H.R.3543.** Verified directly against the
statutory text: [govinfo BILLS-119s1832is](https://www.govinfo.gov/content/pkg/BILLS-119s1832is/html/BILLS-119s1832is.htm).

**(a) Community college: FREE FOR EVERYONE, no income test.** §787(a)(2) requires participating
states to "ensure that the total amount of tuition and required fees charged to an eligible student…
at community colleges in the State are fully eliminated." The definition of "eligible student" for
the community-college branch contains **no income criterion** — only that the individual, "regardless
of age or immigration status," has no bachelor's degree, is enrolled or plans to enroll as an
undergraduate, qualifies for in-state resident tuition (or would but for immigration status), is not
in a dual-enrollment program, and has filed a FAFSA if eligible.

**(b) Public four-year: free under $150,000 / $300,000 AGI.** Verbatim from the text:

> "(i) who are dependent students— (I) in a **single parent household**, whose parent's adjusted
> gross income… is equal to or less than **$150,000**; or (II) with **married parents**, whose
> parents' adjusted gross income… is equal to or less than **$300,000**; and (ii) who are—
> (I) **single independent students**… **$150,000**… or (II) **married independent students**…
> **$300,000**."

Four occurrences of each figure; **zero occurrences of $125,000 or $250,000**. Thresholds are
inflation-indexed after award year 2026-27. AGI is taken from the **prior-prior tax year**, matching
FAFSA convention.

> Reporting "$125,000" alone — or reporting the single threshold without the married one — will
> misclassify most married two-earner households.

**(c) Federal/state cost share — NOT 67/33.** The federal share declines: **100%** (2026-27) → 95% →
90% → 85% → **80% from 2030-31** (state share 20%). Tribal Colleges receive 100% throughout.
Per-student base amounts 2026-27: **$11,610** (public four-year or 4-year TCU), **$5,110** (community
college or 2-year TCU), indexed by the lesser of CPI growth or 3%. States must meet maintenance-of-
effort requirements, and other financial aid may **not** be applied to tuition/fees, so grant aid
flows to living costs instead.

**(d) No student debt cancellation in the 2025 bill** (the 2019 version, S.1947, carried $1.6T of
cancellation within a $2.2T package).

## C8. SNAP and ACA premium tax credits

**SNAP** — [USDA Food and Nutrition Administration](https://www.fns.usda.gov/pd/supplemental-nutrition-assistance-program-snap)
(data as of 2026-08-14):

| | FY2025 | FY2026 (Oct–May, preliminary) |
|---|---:|---:|
| Average monthly participation, persons | 42,386,282 | 38,496,948 |
| Average monthly participation, households | 22,581,406 | 20,830,661 |
| **Average benefit per person/month** | **$188.28** (~$2,259/yr) | $189.35 |
| **Average benefit per household/month** | **$353.41** (~$4,241/yr) | $349.93 |
| Total benefits | $95.77B (all costs $102.58B) | — |

Participation is falling sharply — May 2026 households were **−11.5%** vs May 2025. Historical peak
per person was $229.01/month in FY2022 (emergency allotments).

**ACA premium tax credits** —
[KFF State Health Facts](https://www.kff.org/affordable-care-act/state-indicator/average-monthly-advance-premium-tax-credit-aptc/):

| Year | Average APTC per enrollee/month | Annualized |
|---|---:|---:|
| 2025 | **$549.69** | **~$6,596** |
| 2024 | $535.91 | ~$6,431 |

Median proposed 2026 rate increase: **18%**, "more than double last year's 7% median," with insurers
citing rising utilization **and the expiration of enhanced premium tax credits** —
[KFF](https://www.kff.org/affordable-care-act/issue-brief/how-much-and-why-aca-marketplace-premiums-are-going-up-in-2026/).
Enhanced credits **lapsed 2025-12-31**; 2026 enrollment fell in every state except New Mexico.

> KFF's IRA analysis returned figures of $888/yr average out-of-pocket premium with enhanced
> subsidies vs $1,593/yr without, but the extraction was internally inconsistent. **Treat that pair
> as provisional and build on the $549.69/month APTC figure, which is solid.**

---

# RECOMMENDED PRESENTATION

## 1. Two receipts, two bases

See **A5** for the full specification and the recommended share table. In summary:

- **Receipt 1 — income tax across the federal-funds base**, with an explicit **35.41% borrowed
  wedge**. This is NPP's methodology and it is the methodologically correct one: if a household paid
  no income tax, Social Security benefits would still be paid out of OASDI payroll receipts.
- **Receipt 2 — payroll tax straight to the trust funds**: `wages × 0.062` → Social Security,
  `wages × 0.0145` → Medicare Part A. No pro-rating, no wedge.
- **Reconcile Medicare explicitly**, since it appears in both.
- **Reject** the "net interest already represents past borrowing" shortcut — it understates the
  FY2025 gap by roughly half.

## 2. Data-shape recommendations for `src/`

The existing `PolicyPosition` shape (`area`, `summary`, `confidence`, `citations[]`) extends cleanly.
Four changes this research proves are necessary:

**New file `src/data/federalOutlays2025.ts`** — the A1 function table plus the A5 wedge constants,
with a single `Citation`. Use **Treasury MTS for headline totals** and **OMB Table 3.2 / the Public
Budget Database for anything below function level** (OMB is the only source publishing subfunction
and account detail). The two differ by 0.016% — pick one per layer and stay on it.

**Extend `PolicyArea`**, or add a parallel `SpendingCategory` union, for the seven spending
categories. The existing areas are tax/health-parameter oriented and have nowhere to put "defense" or
"immigration enforcement."

**Add three fields to spending positions:**

```ts
/** Who produced the estimate. Drives the UI's authority label. */
scorer: 'CBO' | 'JCT' | 'SSA-OACT' | 'CMS-OACT' | 'OMB' | 'thinkTank' | 'sponsor' | 'billText'
/** Scoring window, e.g. '2025-2034'. Never omit. */
window: string
/** True for "such sums as may be necessary" authorizations. MUST render as
 *  "no stated cost", never as $0. */
openEnded: boolean
```

`window` is not optional polish: SNAP (−$186B vs −$121B), Medicaid (−$911B vs −$914.6B), ACA
($273B vs $350B) and College for All ($125k vs $150k) **all turn on window or version**. Four of the
eleven corrections above are vintage errors.

`openEnded` covers at least four real items: Booker's Federal Jobs Guarantee, AOC's Green New Deal
for Public Housing, the College for All Act of 2025, and the Child Care for Every Community Act.

## 3. Even-handedness rules the data forces on you

**Scorekeeper asymmetry is the single biggest fairness risk in this dataset.** The GOP baseline and
the Democratic mainstream are densely scored by CBO and OMB. **Not one bill in the Booker / AOC /
Gallego / Hawley set carries an official CBO estimate** — they died in committee, and CBO scores
reported bills. Ossoff's ACA position is the only individual item tied to an official score.
Rendering a CBO number and a press-release number identically implies a precision that does not
exist. **Surface `scorer` in the UI, not just in the data.**

**Never show Medicare for All's $32–34T without the denominator.** Pair it with RAND's finding:
total national health spending +1.8%, federal spending +221%.

**Use the AAF wording in Category 5** verbatim for any Green New Deal cost figure.

**"No stated federal position" is the honest default for sitting governors**, not a research gap. Six
of eight non-senator Democrats have no federal platform at all; their federal activity is opposition
to enacted cuts plus state budgets and litigation. The same applies to Rubio, Cruz, Haley and
DeSantis on the right — though see the caveat in the unverified list.

**Date-stamp every sponsor claim.** The GND for Public Housing figure moved $180B → $172B → $234B →
none for substantially the same bill.

**Two of the seven buckets have no home for real items:** business and economic-development
provisions (Harris's $50k startup deduction, her $250B manufacturing line) and employment programs
(Booker's jobs guarantee). Consider an eighth category rather than forcing them.

**Use CRFB's Harris and Trump numbers together** ($3.95T vs $7.75T central, same paper, same window)
for a like-for-like 2024 comparison. Never pair CRFB's Harris figure with PWBM's.

---

# UNVERIFIED / COULD NOT CONFIRM

## A. Figures that could not be sourced — do not publish

1. **The "~$335B" CBO figure for extending enhanced ACA credits.** Two independent researchers failed
   to source it. Use **$349.8B** (CBO pub 61734, 2026–2035).
2. **Booker Baby Bonds cost — no figure of any kind exists.** The widely repeated **"~$60 billion per
   year" is unverified. Do not publish it.**
3. **Booker's HOME Act / renter's credit cost** — no CBO score, no sponsor figure, no think-tank
   estimate.
4. **Green New Deal for Health Act cost** — no figure for any Congress.
5. **Cost of Sanders' Medicare dental/vision/hearing expansion** (Mar 2025 bills) — none published.
6. **Cost of the Universal School Meals Program Act of 2026** — none published.
7. **Official scores for Hawley's three proposals** ($5,000 CTC, Protect Medicaid and Rural
   Hospitals Act, American Worker Rebate Act) — none exist.
8. **Tariff dividend cost estimates** for either the $600 (Hawley) or $2,000 (Trump) version — none
   found from CRFB, Tax Foundation or Penn Wharton.
9. **Buttigieg's Douglass Plan total and free-college total** — the campaign never published
   aggregates, only components.
10. **Buttigieg's ~$1T infrastructure figure** — Wikipedia only, not traced to a campaign page.
11. **Harris's "3 million housing units"** — PolitiFact secondary only; CRFB never mentions the goal.
12. **A home-care-only cost for "Medicare at Home"** — does not exist; CRFB bundles it with hearing
    and vision.
13. **Mercatus's estimate of the change in *total national* health spending** — the working-paper PDF
    is behind a 403; only the $32.6T federal figure was retrievable.
14. **Pritzker's "330,000 Illinoisans could lose Medicaid"** (headline only) and **Moore's "Service
    United $10M"** (NGA page 404s) — both unverified.
15. **The "$1.43T" Green New Deal for Public Schools figure** — reconciles exactly to $446B + $330B +
    $660B read from the 2021 statutory text, but **no sponsor document printing that number was
    found**. Label as derived. The current 119th version is larger (~$2.0T+).
16. **AAF's exact $51T–$93T endpoints** — AAF published no total; components sum to $51.1T/$92.9T,
    but repeated extractions produced slightly different derived totals.

## B. Genuine research gaps

17. **Toddler national child-care price**; **child-care state high/low dollar examples**; **DOL NDCP
    medians by age and setting**, and whether NDCP prices are nominal or inflation-adjusted.
18. **KFF 2025 average family deductible** — not reported in the summary of findings.
19. **Newer than 2018–2019 KFF Medicare dental/vision/hearing out-of-pocket data** — none found.
20. **CBO's vision and hearing components of H.R. 3 (116th Congress)** — the estimate was not
    retrievable.
21. **Whole-law enacted coverage-loss figure for OBBBA.** Only the Medicaid chapter's +7.5M is
    citable; the circulating 10.9M is House-passed vintage.
22. **Whether Congress enacted any ACA subsidy extension during 2026.** CRFB's tracker was last
    updated 2026-01-30 and shows none, but that is absence of evidence. **This directly changes a
    household's premium line and should be checked before shipping.**
23. **Vote outcome on Sanders' January 2026 $75B ICE-cut amendment** — the release confirms a vote was
    secured but not the result.
24. **Rubio, Cruz, Haley and DeSantis federal spending positions.** Searched, none found — but with
    degraded tooling. Asserting that a candidate has no position is itself a claim about them;
    **verify manually before publishing these as findings rather than gaps.**
25. **Politico profiles of Wes Moore and Andy Beshear** — 403 to every fetch path. Recommend a manual
    read before finalizing those two.
26. **Whether AOC cosponsors H.R.9959 or H.R.9962** — congress.gov 403s and GovTrack renders
    cosponsors in JavaScript.
27. **SHIPS for America Act CBO score** — none found in Wayback's index of CBO 2025 files.
28. **jct.gov was entirely unreachable**, including via Wayback. No JCT documents were obtained
    directly; JCT figures here come through CBO products that incorporate them.
29. **SSA OASDI trust-fund income decomposition for CY2025** — not yet posted; the table runs through
    CY2024.
30. **Medicare Part A (HI) outlays as a standalone FY2025 figure** — not published in the MTS or OMB
    Historical Tables. Only the function-570 total and the general-fund transfers are directly
    citable.
31. **CBO's Monthly Budget Review for FY2025** was not retrieved (cbo.gov 403; no useful archive
    snapshot). The FY2025 totals are nonetheless triple-sourced and agree within 0.02%, so this is a
    nice-to-have rather than a gap.

## C. Methodological cautions

32. **Small reconciliation deltas between Treasury and OMB are normal**: outlays $7,009,974M vs
    $7,011,105M (0.016%); receipts $5,234,616M vs $5,236,421M (0.034%). OMB applies budget-concept
    reclassifications. Pick one source per layer.
33. **Any figure derived by summing workbook rows should be treated as provisional** until checked
    against a published subtotal. This is exactly where the Medicaid discrepancy arose — a ~$75B
    swing on the largest spending line in OBBBA.
34. **Search tooling was degraded throughout.** The session's 200 WebSearch calls were exhausted
    before research began, and every major scorekeeper domain blocks automated fetching. Findings
    rest on direct fetches, the Treasury API, govinfo, and Wayback mirrors. Absence of evidence in
    this document is weaker than it would be with working search.
