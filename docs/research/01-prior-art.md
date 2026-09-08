# Prior-art research: household-level politician policy comparison tools

Research date 2026-09-08 (Opus subagent, ~16 searches + ~20 page fetches).

## Verdict

**Does an identical tool exist? No.** The proposed app needs four things at once: (a) multiple named politicians, (b) full platforms, (c) taxes AND healthcare, (d) applied to the user's own household. Nothing found does all four.

- Closest on (a)+(d), fails (c): **PolicyEngine 2024 Election Calculator** — 2 presets (Harris, Trump), real household inputs, tax-only, frozen at 2024 and demoted to `legacy.policyengine.org`. The live 2026 PolicyEngine site has no politician or party presets.
- Closest on (a), fails (d): **Tax Foundation 2024 Election Tax Plan Tracker** — 12+ named politicians in a filterable comparison table, zero personalization, no healthcare.
- Closest on (c)+(d), fails (a): **Washington Post × Penn Wharton OBBBA calculator** — household inputs including Medicaid/SNAP participation, but one bill, no candidates.
- Zero evidence of any party-platform presets, any 2028-cycle calculator, or any 2026-midterm household calculator.

Secondary gap: nobody keeps a machine-readable per-politician platform database. Tax Foundation curates it editorially; PolicyEngine encodes reforms as parameter deltas. The bridge between them is what this app builds.

## Category A: per-politician presets + household calculator (all 2024, all two-candidate, all tax-only)

| Tool | URL | Inputs | Presets | Healthcare | Live 2026 | API |
|---|---|---|---|---|---|---|
| PolicyEngine 2024 Election Calculator | https://www.policyengine.org/us/2024-election-calculator | marital status, age, state, dependents, wages, SS income, tips, overtime, business income, itemized deductions | Harris, Trump | No | Serves but frozen; on legacy subdomain | Yes (see E) |
| whowilltaxmemore.com | https://whowilltaxmemore.com/ | filing status, income, age, dependents, zip | Harris, Trump | No | Resolves, unmaintained | No |
| taxcalculator2024.org | https://taxcalculator2024.org/tax-calculator | income, children, filing status | Harris, Trump | No | Resolves | No |
| TPC Election Tax Calculator (2016) | election2016.taxpolicycenter.org | full household | Clinton, Trump | No | **Dead (DNS fails)** | No |

## Category B: single-bill household calculators

- **Tax Foundation 2026 OBBBA Tax Calculator** — https://taxfoundation.org/data/all/federal/tax-calculator-obbba/ — actively current; TCJA-expiry vs OBBBA; income tax only.
- **WaPo × Penn Wharton OBBBA calculator** — https://www.washingtonpost.com/business/interactive/2025/trump-big-beautiful-bill-your-taxes-cuts/ — paywalled (403); reported inputs include Medicaid/SNAP participation. Best precedent for "taxes + healthcare in one household number".
- **obbba.org** — income slider only; surfaces CBO coverage-loss figures narratively.
- **bigbeautifulbilltaxcalculator.com**, CalcXML, TIME 2017, taxplancalculator.com, NYT 2017 — older/single-bill.

## Category C: healthcare-only calculators (live, no politician presets)

- **KFF Marketplace Calculator** — https://www.kff.org/interactive/subsidy-calculator/ — updated 2026-03-16 with 2026 premiums; income, age, family size, zip; includes Medicaid eligibility estimate.
- **KFF Enhanced PTC Calculator** — https://www.kff.org/interactive/calculator-aca-enhanced-premium-tax-credit/
- **PolicyEngine ACA-Calc** — https://www.policyengine.org/us/aca-calc — live; scenarios are named bills (ARPA schedule, original schedule, IRA extension, Bipartisan Health Insurance Affordability Act), not politicians.

## Category D: per-politician content without a calculator

- **Tax Foundation 2024 tracker** — https://taxfoundation.org/research/federal-tax/2024-tax-plans/ — the best structured per-politician policy inventory; editorial HTML, no API.
- **Penn Wharton Budget Model** — per-candidate reports with decile tables, never personal.
- **TPC Tax Proposal Calculator** — https://tpc-tax-calculator.urban.org/ — 4 abstract reform designs.
- **CRFB interactive tools** — national-budget-level only.
- **iSideWith** — stance matching, no cost calculation.

## Category E: what to build on

### PolicyEngine (strongest foundation, AGPL-3.0)
- `policyengine-us` — https://github.com/PolicyEngine/policyengine-us — models IRS, SSA, ACA, Medicaid, Medicare, CHIP, SNAP, 50-state taxes in one engine. Actively maintained 2026.
- Household API: `POST https://household.api.policyengine.org/us/calculate`, OAuth2 client credentials issued via hello@policyengine.org. Docker image on GHCR for self-hosting.
- Reform payloads via `policy` field (worked example not extracted; verify with PolicyEngine).
- **License warning:** AGPL-3.0 on both engine and API. A hosted service using it must open-source or negotiate terms.

### PSL Tax-Calculator (CC0, public domain)
- https://github.com/PSLmodels/Tax-Calculator — federal income + payroll only, no healthcare. Reforms as JSON parameter files.

### JS/TS libraries (shallow, bracket arithmetic only)
- tax-logic-core (MIT), us-taxes, kddnewton/taxes, taxee.io data. Not viable as a full engine.

## Decision for this prototype

Build a self-contained TypeScript engine (federal income tax, payroll, credits, ACA subsidy schedule, Medicaid eligibility, Medicare premiums, rough state tax) with a hand-curated, cited platform dataset. This avoids the AGPL question and the OAuth dependency for a prototype. PolicyEngine remains the obvious upgrade path if the app needs full microsimulation fidelity.

## Unverified

- WaPo × PWBM exact inputs (paywall).
- PolicyEngine API reform payload format.
- Fox Business candidate calculator; Vox/CEPR 2016 calculators live status.
- Kiplinger / Americans for Tax Fairness calculators: searches found nothing, but the search budget ran out before direct probing.
