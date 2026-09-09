import { useEffect, useState } from 'react'
import { BASELINE_2026 } from '../data/baseline2026'
import { PLATFORMS } from '../data/platforms'
import { CHANGELOG } from '../data/changelog'
import { AREA_LABEL } from '../lib/labels'
import { SPENDING_CATEGORIES, fmtBillions, scorerLabel } from '../engine/spending'
import { usd, pct } from '../lib/format'

interface Credit {
  name: string
  file: string
  source: string
  license: string
  licenseUrl: string
  artist: string
  attributionRequired: boolean
}

const B = BASELINE_2026

/** Key baseline parameters with the primary source behind each, for the methodology page. */
const PARAMS: Array<{ group: string; rows: Array<[string, string, string, string]> }> = [
  {
    group: 'Federal income tax (IRS Rev. Proc. 2025-32)',
    rows: [
      ['Standard deduction', `${usd(B.incomeTax.standardDeduction.single)} single · ${usd(B.incomeTax.standardDeduction.mfj)} joint · ${usd(B.incomeTax.standardDeduction.hoh)} head of household`, 'IRS Rev. Proc. 2025-32 §4.14', 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf'],
      ['Brackets (joint)', B.incomeTax.brackets.mfj.map((b) => `${pct(b.rate, 0)} above ${usd(b.over)}`).join('; '), 'IRS Rev. Proc. 2025-32 §4.01', 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf'],
      ['Child tax credit', `${usd(B.ctc.amountPerChild)} per child, ${usd(B.ctc.refundableMax)} refundable at ${pct(B.ctc.refundPhaseInRate, 0)} of earnings over ${usd(B.ctc.refundEarnedIncomeFloor)}; phases out above ${usd(B.ctc.phaseoutStart.single)} / ${usd(B.ctc.phaseoutStart.mfj)}`, 'IRS Rev. Proc. 2025-32 §4.05; OBBBA §70104', 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf'],
      ['Earned income credit', B.eitc.tiers.map((t, i) => `${i === 3 ? '3+' : i} kids: max ${usd(t.maxCredit)}`).join('; '), 'IRS Rev. Proc. 2025-32 §4.06', 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf'],
      ['Senior deduction', `${usd(B.incomeTax.seniorDeduction.amount)} per filer 65+, phased out at ${pct(B.incomeTax.seniorDeduction.phaseoutRate, 0)} above ${usd(B.incomeTax.seniorDeduction.phaseoutStart.single)} / ${usd(B.incomeTax.seniorDeduction.phaseoutStart.mfj)} (2025–2028)`, 'IRS, enhanced deduction for seniors', 'https://www.irs.gov/newsroom/check-your-eligibility-for-the-new-enhanced-deduction-for-seniors'],
      ['Tips and overtime deductions', `Tips up to ${usd(B.deductions.tips.cap)}; overtime premium up to ${usd(B.deductions.overtime.cap.single)} / ${usd(B.deductions.overtime.cap.mfj)}; both phase out above ${usd(B.deductions.tips.phaseoutStart.single)} / ${usd(B.deductions.tips.phaseoutStart.mfj)} (2025–2028)`, 'IRS, no tax on tips and overtime', 'https://www.irs.gov/newsroom/one-big-beautiful-bill-how-to-take-advantage-of-no-tax-on-tips-and-overtime'],
      ['SALT cap', `${usd(B.deductions.salt.cap.mfj)}, phasing down 30% of income above ${usd(B.deductions.salt.phaseDownStart.mfj)} to a ${usd(B.deductions.salt.floor.mfj)} floor`, 'OBBBA §70120 (statutory 1%/yr escalator)', 'https://www.congress.gov/bill/119th-congress/house-bill/1'],
      ['Capital gains breakpoints (single)', B.capitalGains.brackets.single.map((b) => `${pct(b.rate, 0)} above ${usd(b.over)}`).join('; ') + `; NIIT ${pct(B.capitalGains.niitRate, 1)} above ${usd(B.capitalGains.niitThreshold.single)}`, 'IRS Rev. Proc. 2025-32 §4.03; IRC §1411', 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf'],
    ],
  },
  {
    group: 'Payroll taxes (SSA, IRS)',
    rows: [
      ['Social Security', `${pct(B.payroll.ssRateEmployee, 1)} employee share on wages up to ${usd(B.payroll.ssWageBase)}`, 'SSA 2026 COLA fact sheet', 'https://www.ssa.gov/news/en/cola/factsheets/2026.html'],
      ['Medicare', `${pct(B.payroll.medicareRateEmployee, 2)} plus ${pct(B.payroll.additionalMedicareRate, 1)} above ${usd(B.payroll.additionalMedicareThreshold.single)} / ${usd(B.payroll.additionalMedicareThreshold.mfj)}`, 'IRS Additional Medicare Tax', 'https://www.irs.gov/businesses/small-businesses-self-employed/questions-and-answers-for-the-additional-medicare-tax'],
    ],
  },
  {
    group: 'Healthcare (CMS, HHS, KFF)',
    rows: [
      ['ACA applicable percentages', `${pct(B.aca.applicablePct[0][1], 2)} of income at 100% of poverty rising to ${pct(B.aca.applicablePct[B.aca.applicablePct.length - 1][1], 2)} at 400%; no credit above 400% (enhanced credits expired 2025-12-31)`, 'IRS Rev. Proc. 2025-25; Peterson-KFF', 'https://www.irs.gov/pub/irs-drop/rp-25-25.pdf'],
      ['Benchmark premium', `${usd(B.aca.benchmarkPremiumAge40 / 12)}/month national average for a 40-year-old (2026), scaled by the CMS age curve`, 'KFF average marketplace premiums', 'https://www.kff.org/other/state-indicator/average-marketplace-premiums-by-metal-tier/'],
      ['Poverty guidelines', `2025 table for marketplace subsidies (${usd(B.fpl.aca.base[0])} + ${usd(B.fpl.aca.perAdditional.base)}/person); 2026 table for Medicaid (${usd(B.fpl.medicaid.base[0])} + ${usd(B.fpl.medicaid.perAdditional.base)}/person)`, 'HHS poverty guidelines; 45 CFR 155.305(f)', 'https://www.federalregister.gov/documents/2026/01/15/2026-00755/annual-update-of-the-hhs-poverty-guidelines'],
      ['Employer coverage', `Worker premium share ${usd(B.employerInsurance.avgWorkerContributionSingle)} single / ${usd(B.employerInsurance.avgWorkerContributionFamily)} family; total premium ${usd(B.employerInsurance.avgTotalPremiumSingle)} / ${usd(B.employerInsurance.avgTotalPremiumFamily)}`, 'KFF Employer Health Benefits Survey 2025', 'https://files.kff.org/attachment/Employer-Health-Benefits-Survey-2025-Annual-Survey-Summary-of-Findings.pdf'],
      ['Medicaid', `Expansion adults up to ${B.medicaid.expansionThresholdFpl}% of poverty; work requirements from 2027 with an assumed ${pct(B.medicaid.workRequirementCoverageLossShare, 0)} coverage-loss share (CBO)`, 'CRS R48755; CBPP on CBO estimate', 'https://www.congress.gov/crs-product/R48755'],
      ['Medicare', `Part B ${usd(B.medicare.partBPremiumMonthly, { decimals: 2 })}/month; deductible ${usd(B.medicare.partBDeductible)}; Part D out-of-pocket cap ${usd(B.medicare.partDOopCap)}`, 'CMS 2026 Medicare premiums and deductibles', 'https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles'],
    ],
  },
  {
    group: 'Our estimates (not statutory)',
    rows: [
      ['Tariff cost', `${pct(B.tariffs.pctOfIncome, 1)} of income, capped at ${usd(B.tariffs.maxAnnualCost)} (≈ $840 for a median household), scaled by each platform's stance`, 'Tax Foundation tariff tracker', 'https://taxfoundation.org/research/all/federal/trump-tariffs-trade-war/'],
      ['Typical out-of-pocket', `Employer plan ${usd(B.employerInsurance.avgOutOfPocket)}; marketplace ${usd(B.aca.avgOutOfPocket)}; Medicare ${usd(B.medicare.avgOutOfPocket)} (excl. Part B); uninsured ${usd(B.uninsured.avgOutOfPocket)}`, 'Assumption informed by KFF/MEPS averages', 'https://www.healthsystemtracker.org/'],
      ['Single-payer contribution', `${pct(B.singlePayer.householdPremiumRate, 0)} of income above ${usd(B.singlePayer.householdPremiumExemption)}; ${pct(B.singlePayer.employerPayrollRate, 1)} employer payroll premium (pass-through is a toggle)`, 'Sanders, Options to Finance Medicare for All (2019)', 'https://www.sanders.senate.gov/wp-content/uploads/options-to-finance-medicare-for-all.pdf'],
    ],
  },
]

export function MethodologyPage() {
  const [credits, setCredits] = useState<Credit[] | null>(null)
  useEffect(() => {
    fetch('/avatars/CREDITS.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((j: Record<string, Credit>) => setCredits(Object.values(j).sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setCredits([]))
  }, [])

  const platforms = [...PLATFORMS].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'party' ? -1 : 1))

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <a href="#/" className="text-sm text-ink-2 underline hover:text-ink">
        ← Back to the calculator
      </a>
      <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-ink">Methodology and sources</h1>
      <p className="mt-2 max-w-prose text-ink-2">
        This page lists what the calculator computes, every baseline number it uses and where it came from, every position attributed to a
        platform with its source and confidence, and what is deliberately not modeled. The source code is open, so all of this can be checked.
      </p>

      <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {[
          ['#how', 'How it works'],
          ['#params', 'Baseline parameters'],
          ['#platforms', 'Platform sources'],
          ['#not-modeled', 'Not modeled'],
          ['#changelog', 'Changelog'],
          ['#credits', 'Photo credits'],
        ].map(([href, label]) => (
          <a
            key={href}
            href={`#/methodology${href}`}
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById(href.slice(1))
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              el?.setAttribute('tabindex', '-1')
              el?.focus({ preventScroll: true })
            }}
            className="text-accent underline hover:text-ink"
          >
            {label}
          </a>
        ))}
      </nav>

      <Section id="how" title="How it works">
        <ol className="max-w-prose list-decimal space-y-2 pl-5 text-ink-2">
          <li>
            <strong className="text-ink">Baseline.</strong> We compute your household's federal income tax (brackets, standard or itemized
            deduction, the 2025 law's tips, overtime and senior deductions, child and earned-income credits, capital gains and the net
            investment income tax), payroll taxes, a rough state income tax, healthcare cost for your coverage type, and an estimated tariff
            cost, all for tax year 2026 under current law.
          </li>
          <li>
            <strong className="text-ink">Platforms.</strong> Each politician or party is a list of positions. A position has a one-line summary,
            citations, a confidence rating, and, where it changes a number, a parameter override applied on top of the baseline. Politicians
            inherit unstated positions from their party or lane baseline; those show as "Party default". A documented non-position (for example
            not cosponsoring a bill the party backs) keeps current law instead.
          </li>
          <li>
            <strong className="text-ink">Attribution.</strong> The "Why?" bridge applies positions one at a time in a fixed order and records the
            change after each, so the bars always sum to the total. When a position changes nothing for you, we say why, using your own numbers
            against the position's thresholds.
          </li>
          <li>
            <strong className="text-ink">Assumptions.</strong> Three judgment calls are exposed as switches rather than buried: whether an
            employer's premium share becomes wages under single payer, whether a single-payer employer payroll premium is passed to workers,
            and how much tariff cost reaches consumers.
          </li>
        </ol>
      </Section>

      <Section id="params" title="Baseline parameters (tax year 2026)">
        {PARAMS.map((g) => (
          <div key={g.group} className="mb-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-3">{g.group}</h3>
            <div className="overflow-x-auto rounded-lg border border-rule">
              <table className="w-full min-w-[640px] text-sm">
                <tbody className="divide-y divide-rule-2">
                  {g.rows.map(([name, value, src, url]) => (
                    <tr key={name} className="align-top">
                      <td className="w-48 px-3 py-2 font-medium text-ink">{name}</td>
                      <td className="money px-3 py-2 text-ink-2">{value}</td>
                      <td className="w-56 px-3 py-2 text-xs">
                        <a href={url} target="_blank" rel="noreferrer" className="text-accent underline hover:text-ink">
                          {src}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Section>

      <Section id="platforms" title="Platform positions and sources">
        <p className="mb-4 max-w-prose text-sm text-ink-2">
          Confidence: <strong className="text-ink">High</strong> is an explicit numeric proposal, sponsored bill or signed law;{' '}
          <strong className="text-ink">Medium</strong> a clear stated direction without numbers; <strong className="text-ink">Low</strong> an
          inference from votes or general statements. Positions without a parameter effect are recorded for context only. Party defaults are not
          repeated here; see each party baseline.
        </p>
        <div className="space-y-6">
          {platforms.map((p) => (
            <details key={p.id} className="rounded-lg border border-rule bg-card">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink">
                {p.name} <span className="font-normal text-ink-3">· {p.role}</span>
                {p.inheritsFrom && (
                  <span className="font-normal text-ink-3"> · inherits from {PLATFORMS.find((x) => x.id === p.inheritsFrom)?.name}</span>
                )}
              </summary>
              <div className="border-t border-rule-2 px-4 py-3">
                <p className="mb-3 text-sm text-ink-2">{p.description}</p>
                <ul className="divide-y divide-rule-2 text-sm">
                  {p.positions.map((pos, i) => (
                    <li key={i} className="grid gap-1 py-2 sm:grid-cols-[180px_1fr]">
                      <div className="font-medium text-ink">
                        {AREA_LABEL[pos.area]}
                        <span className="ml-1 text-xs font-normal capitalize text-ink-3">· {pos.confidence}</span>
                        {!pos.apply && !pos.holdsCurrentLaw && <span className="ml-1 text-xs font-normal text-ink-3">· context only</span>}
                      </div>
                      <div className="text-ink-2">
                        {pos.summary}
                        {pos.citations.length > 0 && (
                          <ul className="mt-1 space-y-0.5 text-xs">
                            {pos.citations.map((c, j) => (
                              <li key={j}>
                                <a href={c.url} target="_blank" rel="noreferrer" className="text-accent underline hover:text-ink">
                                  {c.label}
                                </a>
                                {c.date && <span className="ml-1 text-ink-3">({c.date})</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {p.spending && p.spending.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">Spending side</div>
                    <ul className="divide-y divide-rule-2 text-sm">
                      {p.spending.map((sp, i) => (
                        <li key={i} className="grid gap-1 py-2 sm:grid-cols-[180px_1fr]">
                          <div className="font-medium text-ink">
                            {SPENDING_CATEGORIES.find((c) => c.id === sp.category)?.label}
                            <span className="ml-1 text-xs font-normal capitalize text-ink-3">· {sp.direction} · {sp.confidence}</span>
                          </div>
                          <div className="text-ink-2">
                            {sp.summary}
                            {sp.openEnded && <span className="text-ink-3"> (open-ended authorization, no stated cost)</span>}
                            {sp.cost10yr !== undefined && !sp.openEnded && (
                              <span className="money text-ink-3">
                                {' '}
                                ({fmtBillions(sp.cost10yr)}
                                {sp.window ? ` over ${sp.window}` : ' / 10 yrs'}
                                {scorerLabel(sp) ? `, ${scorerLabel(sp)}` : ''})
                              </span>
                            )}
                            {sp.citations.length > 0 && (
                              <ul className="mt-1 space-y-0.5 text-xs">
                                {sp.citations.map((c, j) => (
                                  <li key={j}>
                                    <a href={c.url} target="_blank" rel="noreferrer" className="text-accent underline hover:text-ink">
                                      {c.label}
                                    </a>
                                    {c.date && <span className="ml-1 text-ink-3">({c.date})</span>}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.notes && p.notes.length > 0 && (
                  <ul className="mt-3 list-disc pl-5 text-xs text-ink-3">
                    {p.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          ))}
        </div>
      </Section>

      <Section id="not-modeled" title="What is not modeled">
        <ul className="max-w-prose list-disc space-y-1 pl-5 text-sm text-ink-2">
          <li>Alternative minimum tax; itemized deductions beyond SALT and a single "other" amount; most state credits and all local income taxes.</li>
          <li>Wealth taxes, corporate taxes and estate taxes, which rarely reach a household directly; they are listed as notes where a platform proposes them.</li>
          <li>Macroeconomic effects, employer-side payroll incidence (except the exposed toggle), and what replaces programs a platform would abolish.</li>
          <li>Anything about a candidate's character, record or electability. This tool prices published platforms only.</li>
        </ul>
      </Section>

      <Section id="changelog" title="Changelog">
        <ul className="space-y-2 text-sm">
          {CHANGELOG.map((c) => (
            <li key={c.date} className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <time dateTime={c.date} className="money font-medium text-ink">
                {c.date}
              </time>
              <span className="text-ink-2">{c.summary}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="credits" title="Photo credits">
        <p className="mb-3 max-w-prose text-sm text-ink-2">
          Portraits are official government photos in the public domain unless a license is shown. Each has been cropped to a square and
          resized. Nobody depicted endorses this tool.
        </p>
        {credits === null ? (
          <p className="text-sm text-ink-3">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-rule">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-paper-2 text-left text-xs uppercase tracking-wide text-ink-3">
                <tr>
                  <th className="px-3 py-2 font-semibold">Person</th>
                  <th className="px-3 py-2 font-semibold">License</th>
                  <th className="px-3 py-2 font-semibold">Author</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule-2">
                {credits.map((c) => (
                  <tr key={c.file}>
                    <td className="px-3 py-2 text-ink">{c.name}</td>
                    <td className="px-3 py-2 text-ink-2">
                      {c.licenseUrl ? (
                        <a href={c.licenseUrl} target="_blank" rel="noreferrer" className="text-accent underline hover:text-ink">
                          {c.license}
                        </a>
                      ) : (
                        c.license
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink-2">{c.artist || '—'}</td>
                    <td className="px-3 py-2 text-xs">
                      <a href={c.source} target="_blank" rel="noreferrer" className="text-accent underline hover:text-ink">
                        source
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </main>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-20">
      <h2 className="mb-3 font-serif text-2xl font-semibold text-ink">{title}</h2>
      {children}
    </section>
  )
}
