import type { StateTaxRule } from '../engine/stateTax'

/**
 * Simplified 2026 state individual income tax rules.
 * Source: Tax Foundation, "State Individual Income Tax Rates and Brackets, 2026"
 *   https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/
 * and "2026 State Tax Changes Taking Effect January 1, 2026"
 *   https://taxfoundation.org/research/all/state/2026-state-tax-changes/
 *
 * Conventions: brackets are for single filers; `mfjDouble` doubles thresholds for joint filers,
 * otherwise `bracketsMfj` is explicit. States whose starting point is federal taxable income carry
 * the 2026 federal standard deduction ($16,100 / $32,200) so that AGI − deduction ≈ their base.
 * Local income taxes are excluded everywhere (material in MD, OH, PA, NYC, KY, Portland OR).
 */

const TF = 'https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/'
const TF_CHANGES = 'https://taxfoundation.org/research/all/state/2026-state-tax-changes/'
const FED_STD = { single: 16100, mfj: 32200 }

const none = (code: string, name: string, notes = 'No individual income tax.'): StateTaxRule => ({
  code,
  name,
  type: 'none',
  notes,
  source: TF,
})

const rules: StateTaxRule[] = [
  {
    code: 'AL', name: 'Alabama', type: 'graduated',
    brackets: [{ rate: 0.02, over: 0 }, { rate: 0.04, over: 500 }, { rate: 0.05, over: 3000 }],
    mfjDouble: true,
    standardDeduction: { single: 3000, mfj: 8500 },
    personalExemption: 1500, dependentExemption: 1000,
    notes: 'Std deduction phases down with AGI; federal income tax deductible; local occupational taxes common.', source: TF,
  },
  none('AK', 'Alaska'),
  {
    code: 'AZ', name: 'Arizona', type: 'flat', rate: 0.025,
    standardDeduction: FED_STD,
    notes: 'Flat 2.5%; conforms to federal standard deduction; $100 dependent credit.', source: TF,
  },
  {
    code: 'AR', name: 'Arkansas', type: 'graduated',
    brackets: [{ rate: 0.02, over: 0 }, { rate: 0.039, over: 4600 }],
    bracketsMfj: [{ rate: 0.02, over: 0 }, { rate: 0.039, over: 4600 }],
    standardDeduction: { single: 2470, mfj: 4940 },
    notes: 'Rates shown apply above ~$92,300; separate low-income tables below that, so this overstates tax for most filers.', source: TF,
  },
  {
    code: 'CA', name: 'California', type: 'graduated',
    brackets: [
      { rate: 0.01, over: 0 }, { rate: 0.02, over: 11079 }, { rate: 0.04, over: 26264 }, { rate: 0.06, over: 41452 },
      { rate: 0.08, over: 57542 }, { rate: 0.093, over: 72724 }, { rate: 0.103, over: 371479 }, { rate: 0.113, over: 445771 },
      { rate: 0.123, over: 742953 }, { rate: 0.133, over: 1000000 },
    ],
    bracketsMfj: [
      { rate: 0.01, over: 0 }, { rate: 0.02, over: 22158 }, { rate: 0.04, over: 52528 }, { rate: 0.06, over: 82904 },
      { rate: 0.08, over: 115084 }, { rate: 0.093, over: 145448 }, { rate: 0.103, over: 742958 }, { rate: 0.113, over: 891542 },
      { rate: 0.123, over: 1000000 }, { rate: 0.133, over: 1485906 },
    ],
    standardDeduction: { single: 5540, mfj: 11080 },
    notes: '1% mental-health surtax above $1M folded into top rate (threshold not doubled for MFJ). Personal exemption is a $153 credit.', source: TF,
  },
  { code: 'CO', name: 'Colorado', type: 'flat', rate: 0.044, standardDeduction: FED_STD, notes: 'Starts from federal taxable income.', source: TF },
  {
    code: 'CT', name: 'Connecticut', type: 'graduated',
    brackets: [
      { rate: 0.02, over: 0 }, { rate: 0.045, over: 10000 }, { rate: 0.055, over: 50000 }, { rate: 0.06, over: 100000 },
      { rate: 0.065, over: 200000 }, { rate: 0.069, over: 250000 }, { rate: 0.0699, over: 500000 },
    ],
    mfjDouble: true,
    standardDeduction: { single: 15000, mfj: 24000 },
    notes: 'No standard deduction; the $15,000/$24,000 personal exemption (phases out) is modeled as a deduction. Benefit recapture for high earners not modeled.', source: TF,
  },
  {
    code: 'DE', name: 'Delaware', type: 'graduated',
    brackets: [
      { rate: 0, over: 0 }, { rate: 0.022, over: 2000 }, { rate: 0.039, over: 5000 }, { rate: 0.048, over: 10000 },
      { rate: 0.052, over: 20000 }, { rate: 0.0555, over: 25000 }, { rate: 0.066, over: 60000 },
    ],
    standardDeduction: { single: 3250, mfj: 6500 },
    notes: 'MFJ brackets identical to single (not doubled). $110 personal credit; Wilmington 1.25% wage tax.', source: TF,
  },
  none('FL', 'Florida'),
  {
    code: 'GA', name: 'Georgia', type: 'flat', rate: 0.0519,
    standardDeduction: { single: 12000, mfj: 24000 }, dependentExemption: 4000,
    notes: 'Flat 5.19%, unchanged from 2025 (trigger-based cuts did not fire).', source: TF,
  },
  {
    code: 'HI', name: 'Hawaii', type: 'graduated',
    brackets: [
      { rate: 0.014, over: 0 }, { rate: 0.032, over: 9600 }, { rate: 0.055, over: 14400 }, { rate: 0.064, over: 19200 },
      { rate: 0.068, over: 24000 }, { rate: 0.072, over: 36000 }, { rate: 0.076, over: 48000 }, { rate: 0.079, over: 125000 },
      { rate: 0.0825, over: 175000 }, { rate: 0.09, over: 225000 }, { rate: 0.1, over: 275000 }, { rate: 0.11, over: 325000 },
    ],
    mfjDouble: true,
    standardDeduction: { single: 4400, mfj: 8800 }, personalExemption: 1144,
    notes: 'Brackets and standard deduction on a multi-year expansion schedule through 2031.', source: TF,
  },
  {
    code: 'ID', name: 'Idaho', type: 'graduated', rate: 0.053,
    brackets: [{ rate: 0, over: 0 }, { rate: 0.053, over: 4811 }], mfjDouble: true,
    standardDeduction: FED_STD, notes: 'Effectively flat 5.3% above $4,811 / $9,622 of federal taxable income.', source: TF,
  },
  { code: 'IL', name: 'Illinois', type: 'flat', rate: 0.0495, personalExemption: 2925, notes: 'No standard deduction; retirement income exempt.', source: TF },
  {
    code: 'IN', name: 'Indiana', type: 'flat', rate: 0.0295, personalExemption: 1000,
    notes: 'Rate cut to 2.95% for 2026. County income taxes (avg ~0.35%, up to ~3%) excluded.', source: TF_CHANGES,
  },
  { code: 'IA', name: 'Iowa', type: 'flat', rate: 0.038, standardDeduction: FED_STD, notes: 'Flat 3.8%; $40 personal credit; retirement income exempt 55+.', source: TF },
  {
    code: 'KS', name: 'Kansas', type: 'graduated',
    brackets: [{ rate: 0.052, over: 0 }, { rate: 0.0558, over: 23000 }], mfjDouble: true,
    standardDeduction: { single: 3605, mfj: 8240 }, personalExemption: 9160, dependentExemption: 2320,
    notes: 'Large personal exemption ($9,160 per adult, $2,320 per dependent).', source: TF,
  },
  {
    code: 'KY', name: 'Kentucky', type: 'flat', rate: 0.035,
    standardDeduction: { single: 3360, mfj: 3360 },
    notes: 'Rate cut to 3.5% for 2026. Local occupational taxes widespread (avg 0.93%, Louisville ~2.2%) excluded.', source: TF_CHANGES,
  },
  { code: 'LA', name: 'Louisiana', type: 'flat', rate: 0.03, standardDeduction: { single: 12875, mfj: 25750 }, notes: 'Flat 3% since 2025 reform.', source: TF },
  {
    code: 'ME', name: 'Maine', type: 'graduated',
    brackets: [{ rate: 0.058, over: 0 }, { rate: 0.0675, over: 27399 }, { rate: 0.0715, over: 64849 }],
    bracketsMfj: [{ rate: 0.058, over: 0 }, { rate: 0.0675, over: 54849 }, { rate: 0.0715, over: 129749 }],
    standardDeduction: { single: 8350, mfj: 16700 }, personalExemption: 5300,
    notes: 'Standard deduction figure unverified against Maine Revenue Services; exemption phases out above ~$333k.', source: TF,
  },
  {
    code: 'MD', name: 'Maryland', type: 'graduated',
    brackets: [
      { rate: 0.02, over: 0 }, { rate: 0.03, over: 1000 }, { rate: 0.04, over: 2000 }, { rate: 0.0475, over: 3000 },
      { rate: 0.05, over: 100000 }, { rate: 0.0525, over: 125000 }, { rate: 0.055, over: 150000 }, { rate: 0.0575, over: 250000 },
      { rate: 0.0625, over: 500000 }, { rate: 0.065, over: 1000000 },
    ],
    bracketsMfj: [
      { rate: 0.02, over: 0 }, { rate: 0.03, over: 1000 }, { rate: 0.04, over: 2000 }, { rate: 0.0475, over: 3000 },
      { rate: 0.05, over: 150000 }, { rate: 0.0525, over: 175000 }, { rate: 0.055, over: 225000 }, { rate: 0.0575, over: 300000 },
      { rate: 0.0625, over: 600000 }, { rate: 0.065, over: 1200000 },
    ],
    standardDeduction: { single: 3350, mfj: 6700 }, personalExemption: 3200,
    notes: 'County income taxes of 2.25%–3.20% (avg ~2.4%) excluded — material.', source: TF,
  },
  {
    code: 'MA', name: 'Massachusetts', type: 'graduated',
    brackets: [{ rate: 0.05, over: 0 }, { rate: 0.09, over: 1083150 }],
    bracketsMfj: [{ rate: 0.05, over: 0 }, { rate: 0.09, over: 1083150 }],
    personalExemption: 4400,
    notes: 'Flat 5% plus 4% surtax above ~$1.08M (2025 threshold; 2026 indexed value ~ $1.11M). Short-term gains 8.5% not modeled.', source: TF,
  },
  { code: 'MI', name: 'Michigan', type: 'flat', rate: 0.0425, personalExemption: 5900, notes: '24 cities levy local income taxes (Detroit 2.4%) excluded.', source: TF },
  {
    code: 'MN', name: 'Minnesota', type: 'graduated',
    brackets: [{ rate: 0.0535, over: 0 }, { rate: 0.068, over: 33310 }, { rate: 0.0785, over: 109430 }, { rate: 0.0985, over: 203150 }],
    bracketsMfj: [{ rate: 0.0535, over: 0 }, { rate: 0.068, over: 48700 }, { rate: 0.0785, over: 193480 }, { rate: 0.0985, over: 337930 }],
    standardDeduction: { single: 15300, mfj: 30600 }, dependentExemption: 5300,
    notes: 'Standard deduction reduced for AGI over $244,400 (not modeled).', source: TF,
  },
  {
    code: 'MS', name: 'Mississippi', type: 'graduated', rate: 0.04,
    brackets: [{ rate: 0, over: 0 }, { rate: 0.04, over: 10000 }],
    bracketsMfj: [{ rate: 0, over: 0 }, { rate: 0.04, over: 10000 }],
    standardDeduction: { single: 2300, mfj: 4600 }, personalExemption: 6000, dependentExemption: 1500,
    notes: 'Rate cut to 4.0% for 2026; first $10,000 exempt (not doubled for MFJ). On a phase-out path to zero.', source: TF_CHANGES,
  },
  {
    code: 'MO', name: 'Missouri', type: 'graduated',
    brackets: [
      { rate: 0, over: 0 }, { rate: 0.02, over: 1348 }, { rate: 0.025, over: 2696 }, { rate: 0.03, over: 4044 },
      { rate: 0.035, over: 5392 }, { rate: 0.04, over: 6740 }, { rate: 0.045, over: 8088 }, { rate: 0.047, over: 9436 },
    ],
    standardDeduction: FED_STD,
    notes: 'Brackets identical for single and MFJ; effectively 4.7% flat. KC and St. Louis 1% earnings taxes excluded. Capital gains deductible (not modeled).', source: TF,
  },
  {
    code: 'MT', name: 'Montana', type: 'graduated',
    brackets: [{ rate: 0.047, over: 0 }, { rate: 0.0565, over: 47500 }], mfjDouble: true,
    standardDeduction: FED_STD, notes: 'Top rate cut to 5.65% for 2026 (5.4% scheduled for 2027).', source: TF_CHANGES,
  },
  {
    code: 'NE', name: 'Nebraska', type: 'graduated',
    brackets: [{ rate: 0.0246, over: 0 }, { rate: 0.0351, over: 4130 }, { rate: 0.0455, over: 24760 }],
    bracketsMfj: [{ rate: 0.0246, over: 0 }, { rate: 0.0351, over: 8250 }, { rate: 0.0455, over: 49530 }],
    standardDeduction: { single: 8850, mfj: 17700 },
    notes: 'Top rate cut to 4.55% for 2026 (3.99% in 2027). $176 personal credit not modeled.', source: TF_CHANGES,
  },
  none('NV', 'Nevada'),
  none('NH', 'New Hampshire', 'No wage income tax; interest & dividends tax repealed effective 2025.'),
  {
    code: 'NJ', name: 'New Jersey', type: 'graduated',
    brackets: [
      { rate: 0.014, over: 0 }, { rate: 0.0175, over: 20000 }, { rate: 0.035, over: 35000 }, { rate: 0.0553, over: 40000 },
      { rate: 0.0637, over: 75000 }, { rate: 0.0897, over: 500000 }, { rate: 0.1075, over: 1000000 },
    ],
    bracketsMfj: [
      { rate: 0.014, over: 0 }, { rate: 0.0175, over: 20000 }, { rate: 0.0245, over: 50000 }, { rate: 0.035, over: 70000 },
      { rate: 0.0553, over: 80000 }, { rate: 0.0637, over: 150000 }, { rate: 0.0897, over: 500000 }, { rate: 0.1075, over: 1000000 },
    ],
    personalExemption: 1000, dependentExemption: 1500,
    notes: 'No standard deduction.', source: TF,
  },
  {
    code: 'NM', name: 'New Mexico', type: 'graduated',
    brackets: [
      { rate: 0.015, over: 0 }, { rate: 0.032, over: 5500 }, { rate: 0.043, over: 16500 }, { rate: 0.047, over: 33500 },
      { rate: 0.049, over: 66500 }, { rate: 0.059, over: 210000 },
    ],
    bracketsMfj: [
      { rate: 0.015, over: 0 }, { rate: 0.032, over: 8000 }, { rate: 0.043, over: 25000 }, { rate: 0.047, over: 50000 },
      { rate: 0.049, over: 100000 }, { rate: 0.059, over: 315000 },
    ],
    standardDeduction: FED_STD, dependentExemption: 4000,
    notes: 'Starts from federal taxable income.', source: TF,
  },
  {
    code: 'NY', name: 'New York', type: 'graduated',
    brackets: [
      { rate: 0.039, over: 0 }, { rate: 0.044, over: 8500 }, { rate: 0.0515, over: 11700 }, { rate: 0.054, over: 13900 },
      { rate: 0.059, over: 80650 }, { rate: 0.0685, over: 215400 }, { rate: 0.0965, over: 1077550 }, { rate: 0.103, over: 5000000 },
      { rate: 0.109, over: 25000000 },
    ],
    bracketsMfj: [
      { rate: 0.039, over: 0 }, { rate: 0.044, over: 17150 }, { rate: 0.0515, over: 23600 }, { rate: 0.054, over: 27900 },
      { rate: 0.059, over: 161550 }, { rate: 0.0685, over: 323200 }, { rate: 0.0965, over: 2155350 }, { rate: 0.103, over: 5000000 },
      { rate: 0.109, over: 25000000 },
    ],
    standardDeduction: { single: 8000, mfj: 16050 }, dependentExemption: 1000,
    notes: 'Bottom five rates cut 0.1pt for 2026. NYC (3.078%–3.876%) and Yonkers taxes excluded — material for NYC residents.', source: TF,
  },
  { code: 'NC', name: 'North Carolina', type: 'flat', rate: 0.0399, standardDeduction: { single: 12750, mfj: 25500 }, notes: 'Rate cut to 3.99% for 2026.', source: TF_CHANGES },
  {
    code: 'ND', name: 'North Dakota', type: 'graduated',
    brackets: [{ rate: 0, over: 0 }, { rate: 0.0195, over: 48475 }, { rate: 0.025, over: 244825 }],
    bracketsMfj: [{ rate: 0, over: 0 }, { rate: 0.0195, over: 80975 }, { rate: 0.025, over: 298075 }],
    standardDeduction: FED_STD,
    notes: '0% on first ~$48k of taxable income. Thresholds are 2025 values (2026 indexation unpublished at source press time).', source: TF,
  },
  {
    code: 'OH', name: 'Ohio', type: 'graduated', rate: 0.0275,
    brackets: [{ rate: 0, over: 0 }, { rate: 0.0275, over: 26050 }],
    bracketsMfj: [{ rate: 0, over: 0 }, { rate: 0.0275, over: 26050 }],
    personalExemption: 2400,
    notes: 'Flat 2.75% above $26,050 starting 2026 (exemption not doubled for MFJ). Personal exemption steps down with income. Municipal + school district taxes (avg ~1.2%) excluded.', source: TF_CHANGES,
  },
  {
    code: 'OK', name: 'Oklahoma', type: 'graduated',
    brackets: [{ rate: 0, over: 0 }, { rate: 0.025, over: 3750 }, { rate: 0.035, over: 4900 }, { rate: 0.045, over: 7200 }],
    mfjDouble: true,
    standardDeduction: { single: 6350, mfj: 12700 }, personalExemption: 1000,
    notes: 'Six brackets consolidated to three for 2026; top rate 4.5%. 0% floor approximate.', source: TF_CHANGES,
  },
  {
    code: 'OR', name: 'Oregon', type: 'graduated',
    brackets: [{ rate: 0.0475, over: 0 }, { rate: 0.0675, over: 4550 }, { rate: 0.0875, over: 11400 }, { rate: 0.099, over: 125000 }],
    mfjDouble: true,
    standardDeduction: { single: 2910, mfj: 5820 },
    notes: '$256 personal credit not modeled. Portland-metro SHS/PFA taxes excluded — material.', source: TF,
  },
  { code: 'PA', name: 'Pennsylvania', type: 'flat', rate: 0.0307, notes: 'No deduction or exemption. Local EIT near-universal (avg 0.99%; Philadelphia ~3.75%) excluded.', source: TF },
  {
    code: 'RI', name: 'Rhode Island', type: 'graduated',
    brackets: [{ rate: 0.0375, over: 0 }, { rate: 0.0475, over: 82050 }, { rate: 0.0599, over: 186450 }],
    bracketsMfj: [{ rate: 0.0375, over: 0 }, { rate: 0.0475, over: 82050 }, { rate: 0.0599, over: 186450 }],
    standardDeduction: { single: 11200, mfj: 22400 }, personalExemption: 5250,
    notes: 'Brackets identical for single and MFJ. Deduction/exemption phase-outs not modeled.', source: TF,
  },
  {
    code: 'SC', name: 'South Carolina', type: 'graduated',
    brackets: [{ rate: 0, over: 0 }, { rate: 0.03, over: 3640 }, { rate: 0.06, over: 18230 }],
    bracketsMfj: [{ rate: 0, over: 0 }, { rate: 0.03, over: 3640 }, { rate: 0.06, over: 18230 }],
    standardDeduction: FED_STD, dependentExemption: 4930,
    notes: 'Starts from federal taxable income. Top rate 6.0% via revenue trigger. Brackets not doubled for MFJ.', source: TF,
  },
  none('SD', 'South Dakota'),
  none('TN', 'Tennessee'),
  none('TX', 'Texas'),
  {
    code: 'UT', name: 'Utah', type: 'flat', rate: 0.045,
    notes: 'Flat 4.5% on federal AGI; 6% taxpayer credit ($966/$1,932, phases out) not modeled, so this slightly overstates tax.', source: TF,
  },
  {
    code: 'VT', name: 'Vermont', type: 'graduated',
    brackets: [{ rate: 0.0335, over: 0 }, { rate: 0.066, over: 49400 }, { rate: 0.076, over: 119700 }, { rate: 0.0875, over: 249700 }],
    bracketsMfj: [{ rate: 0.0335, over: 0 }, { rate: 0.066, over: 82500 }, { rate: 0.076, over: 199450 }, { rate: 0.0875, over: 304000 }],
    standardDeduction: { single: 7650, mfj: 15300 }, personalExemption: 5300,
    notes: 'Deduction and exemption are 2025 amounts (2026 indexation unpublished at source press time).', source: TF,
  },
  {
    code: 'VA', name: 'Virginia', type: 'graduated',
    brackets: [{ rate: 0.02, over: 0 }, { rate: 0.03, over: 3000 }, { rate: 0.05, over: 5000 }, { rate: 0.0575, over: 17000 }],
    bracketsMfj: [{ rate: 0.02, over: 0 }, { rate: 0.03, over: 3000 }, { rate: 0.05, over: 5000 }, { rate: 0.0575, over: 17000 }],
    standardDeduction: { single: 8750, mfj: 17500 }, personalExemption: 930,
    notes: 'Brackets identical for single and MFJ and unindexed since 1990.', source: TF,
  },
  {
    code: 'WA', name: 'Washington', type: 'none', taxesCapitalGainsOnly: true,
    brackets: [{ rate: 0.07, over: 278000 }, { rate: 0.099, over: 1278000 }],
    notes: 'No wage tax. 7% on long-term gains above $278,000 exclusion, 9.9% above $1M more.', source: TF,
  },
  {
    code: 'WV', name: 'West Virginia', type: 'graduated',
    brackets: [{ rate: 0.0222, over: 0 }, { rate: 0.0296, over: 10000 }, { rate: 0.0333, over: 25000 }, { rate: 0.0444, over: 40000 }, { rate: 0.0482, over: 60000 }],
    bracketsMfj: [{ rate: 0.0222, over: 0 }, { rate: 0.0296, over: 10000 }, { rate: 0.0333, over: 25000 }, { rate: 0.0444, over: 40000 }, { rate: 0.0482, over: 60000 }],
    personalExemption: 2000,
    notes: 'Brackets identical for single and MFJ. Social Security fully exempt from 2026.', source: TF,
  },
  {
    code: 'WI', name: 'Wisconsin', type: 'graduated',
    brackets: [{ rate: 0.035, over: 0 }, { rate: 0.044, over: 15110 }, { rate: 0.053, over: 51950 }, { rate: 0.0765, over: 332720 }],
    bracketsMfj: [{ rate: 0.035, over: 0 }, { rate: 0.044, over: 20150 }, { rate: 0.053, over: 69260 }, { rate: 0.0765, over: 443630 }],
    standardDeduction: { single: 13960, mfj: 25840 }, personalExemption: 700,
    notes: 'Standard deduction phases out from ~$20k/$29k of income (not modeled) — overstates the deduction for most filers.', source: TF,
  },
  none('WY', 'Wyoming'),
  {
    code: 'DC', name: 'District of Columbia', type: 'graduated',
    brackets: [
      { rate: 0.04, over: 0 }, { rate: 0.06, over: 10000 }, { rate: 0.065, over: 40000 }, { rate: 0.085, over: 60000 },
      { rate: 0.0925, over: 250000 }, { rate: 0.0975, over: 500000 }, { rate: 0.1075, over: 1000000 },
    ],
    bracketsMfj: [
      { rate: 0.04, over: 0 }, { rate: 0.06, over: 10000 }, { rate: 0.065, over: 40000 }, { rate: 0.085, over: 60000 },
      { rate: 0.0925, over: 250000 }, { rate: 0.0975, over: 500000 }, { rate: 0.1075, over: 1000000 },
    ],
    standardDeduction: FED_STD,
    notes: 'Brackets identical for single and MFJ.', source: TF,
  },
]

export const STATE_TAX: Record<string, StateTaxRule> = Object.fromEntries(rules.map((r) => [r.code, r]))

export const STATE_LIST: Array<{ code: string; name: string }> = rules
  .map((r) => ({ code: r.code, name: r.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

/**
 * States that have not adopted ACA Medicaid expansion as of August 2026 (10 states).
 * Source: KFF, Status of State Action on the Medicaid Expansion Decision
 *   https://www.kff.org/affordable-care-act/state-indicator/state-activity-around-expanding-medicaid-under-the-affordable-care-act/
 */
export const NON_EXPANSION_STATE_CODES: string[] = ['AL', 'FL', 'GA', 'KS', 'MS', 'SC', 'TN', 'TX', 'WI', 'WY']

/**
 * Non-expansion states whose waiver covers childless adults up to the given % of poverty, so they have no coverage gap.
 * Wisconsin: BadgerCare §1115 waiver to 100% FPL (extended through 2029), without the 90% federal match.
 * https://www.kff.org/affordable-care-act/wisconsins-badgercare-program-and-the-aca/
 */
export const WAIVER_ADULT_FPL: Record<string, number> = { WI: 100 }
