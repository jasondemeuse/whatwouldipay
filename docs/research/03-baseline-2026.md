# Current-law baseline parameters, tax year 2026 (post-OBBBA)

Compiled 2026-09-08 by an Opus research subagent. Values transcribed into `src/data/baseline2026.ts`. Master source for federal tax figures is IRS Rev. Proc. 2025-32 (https://www.irs.gov/pub/irs-drop/rp-25-32.pdf).

## Federal income tax
- Brackets (single / MFJ / MFS / HoH) per Rev. Proc. 2025-32 §4.01; rates 10–37% permanent under OBBBA §70101. HoH 24%/32% breakpoints are $201,750/$256,200 (differ by $25 from single; real, not a typo).
- Standard deduction: $16,100 single/MFS, $32,200 MFJ, $24,150 HoH (§4.14). Additional 65+/blind: $1,650 married, $2,050 unmarried.
- OBBBA senior deduction: $6,000 per 65+ filer, 2025–2028, 6% phaseout above $75k/$150k MAGI, not indexed (inferred from absence in Rev. Proc.). Available to itemizers and non-itemizers. https://www.irs.gov/newsroom/check-your-eligibility-for-the-new-enhanced-deduction-for-seniors
- CTC: $2,200/child, $1,700 refundable, 15% of earned income over $2,500, phaseout $200k/$400k at $50 per $1,000, ODC $500 (§4.05; OBBBA §70104).
- EITC (§4.06): max $664 / $4,427 / $7,316 / $8,231; phase-in 7.65/34/40/45%; phase-out 7.65/15.98/21.06/21.06%; phaseout starts $10,860 (0 kids) / $23,890 (single), $18,140 / $31,160 (MFJ). Investment income limit $12,200.
- Tips deduction (§224): $25,000 cap, phaseout $100 per $1,000 MAGI over $150k/$300k. Final occupation list TD 10044 (2026-04-13).
- Overtime deduction (§225): $12,500/$25,000 cap; only the FLSA premium half qualifies; same phaseout.
- Car loan interest: $10,000 cap, phaseout $200 per $1,000 over $100k/$200k (not modeled).
- SALT: $40,400 cap in 2026 ($20,200 MFS), phase-down 30% of MAGI over $505,000 ($252,500) to $10,000 floor. Statutory 1% escalator; not IRS-primary-sourced (flag).
- Charitable non-itemizer: $1,000/$2,000 from TY2026, permanent (not modeled). New 0.5% AGI floor and 35% value cap for itemizers (not modeled).
- LTCG breakpoints (§4.03): 0%→15% at $49,450 / $98,900 / $49,450 / $66,200; 15%→20% at $545,500 / $613,700 / $306,850 / $579,600. NIIT 3.8% above $200k/$250k/$125k (not indexed).
- AMT (§4.10): exemptions $90,100 / $140,200 / $70,100; phaseout $500k / $1M at 50%. Not modeled.

## Payroll
- SSA 2026: wage base $184,500; OASDI 6.2%+6.2%; Medicare 1.45%+1.45%; Additional Medicare 0.9% above $200k/$250k/$125k. https://www.ssa.gov/news/en/cola/factsheets/2026.html
- SE tax: 92.35% of net profit; half deductible above the line.

## ACA marketplace
- **Enhanced credits expired 2025-12-31 and were not restored** as of the most recent confirming source (Peterson-KFF, 2026-08-03). House passed a 3-year extension 230–196 on 2026-01-08; no Senate action enacted. 400% FPL cliff returned. Sources: https://www.healthsystemtracker.org/brief/how-much-and-why-aca-marketplace-premiums-are-going-up-in-2027/ ; https://www.astho.org/communications/blog/2026/aca-enhanced-premium-tax-credits-legislative-developments-2025-2026/
- 2026 applicable percentages (Rev. Proc. 2025-25): 2.10% below 133% FPL; 3.14→4.19% (133–150); 4.19→6.60% (150–200); 6.60→8.44% (200–250); 8.44→9.96% (250–300); 9.96% (300–400); none above 400%. Employer affordability 9.96%.
- Enhanced schedule (for restoration scenarios): 0% to 150% FPL; 0→2% (150–200); 2→4%; 4→6%; 6→8.5% (300–400); 8.5% above 400%, no cliff.
- **2026 subsidies use the 2025 FPL table** (45 CFR 155.305(f)); Medicaid uses the 2026 table.
- 2025 FPL (48 states): $15,650 + $5,500/person; 2026: $15,960 + $5,680/person (91 FR 1797). Alaska and Hawaii tables in the data file.
- Benchmark premium, age 40, national average: $625/mo in 2026 (+26% vs $497 in 2025). KFF. State range $401 (NH) to $1,299 (VT).
- CMS default age curve: age-21 = 1.0, age 40 = 1.278, age 64+ = 3.0; children 0–14 = 0.765; max three children under 21 counted.

## Employer coverage (KFF EHBS 2025; 2026 survey publishes Oct 2026)
- Total premium $9,325 single / $26,993 family; worker share $1,440 / $6,850; average deductible $1,886.

## Medicaid
- Expansion threshold 138% FPL effective. Non-expansion states (10, KFF 2026-08-21): AL, FL, GA, KS, MS, SC, TN, TX, WI, WY. Wisconsin covers childless adults to 100% FPL via waiver (no coverage gap).
- OBBBA work requirement: 80 hrs/month, expansion adults 19–64, effective 2027-01-01; CMS interim final rule CMS-2454-IFC (2026-06-01); exemptions include caretakers of children under 14 (verify). CBO: ~5.3M more uninsured by 2034. https://www.congress.gov/crs-product/R48755
- 6-month redeterminations from 2027-01-01. Cost sharing $1–$35/service for expansion adults >100% FPL from 2028-10-01, 5% income cap.
- OBBBA health provisions overall: ~10M more uninsured by 2034 (CBO via Georgetown CCF); enhanced PTC expiry adds ~4.2M.

## Medicare 2026 (CMS fact sheet 2025-11-14)
- Part B $202.90/mo, deductible $283. IRMAA tiers (2024 MAGI): >$109k/$218k → $284.10; >$137k/$274k → $405.80; >$171k/$342k → $527.50; >$205k/$410k → $649.20; ≥$500k/$750k → $689.90.
- Part D OOP cap $2,100; base premium $38.99; max deductible $615. Part A deductible $1,736.

## Medicare for All financing (proposals, never enacted)
- Sanders 2019 options paper: 7.5% employer payroll premium (first $2M exempt); 4% household income premium above ~$29,000 for a family of four; new brackets 40% ($250k–$500k), 45% ($500k–$2M), 50% ($2M–$10M), 52% (>$10M); 1% wealth tax above $21M. https://www.sanders.senate.gov/wp-content/uploads/options-to-finance-medicare-for-all.pdf
- S.1506 (119th) contains no financing provisions.

## Assumptions made in code (not sourced to a single figure)
- Marketplace out-of-pocket $1,500; employer-plan out-of-pocket $1,200; uninsured expected cost $2,500; Medicare out-of-pocket excluding Part B $4,000.
- Tariff cost: 1.5% of gross income capped at $5,000 (Yale Budget Lab reports ~$2,000–$2,500 per average household, regressive).

## Uncertainty register
1. Enhanced-subsidy status after 2026-08-03 unverified.
2. SALT $40,400 / $505,000 not IRS-primary-sourced.
3. Senior deduction non-indexation inferred.
4. Work-requirement caretaker exemption age (under 14) needs IFC verification.
5. Part D $2,100 cap secondary-sourced.
6. CBO coverage-loss headcounts relayed via advocacy orgs.
7. KFF 2026 EHBS not yet published.
