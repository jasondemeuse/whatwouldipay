# UI/UX research and redesign plan (2026-09-08)

Opus research pass. WebSearch was capped, so findings come from direct fetches of design-system docs, NN/g, W3C, npm/bundlephobia. Items the agent could not reach (NYT, WaPo, Reuters, AllSides, TPC, Ballotpedia) are marked UNVERIFIED in the agent's notes and omitted here.

Baseline: current build is 96.0 kB gzip JS + 5.4 kB CSS with zero runtime deps beyond React. Every recommendation is weighed against that.

## What the best calculators do
- Presets before parameters (Tax Foundation "sample taxpayers"): a real answer with zero keystrokes. https://taxfoundation.org/data/all/federal/tax-calculator-obbba/
- The result is a sentence with a number inside it, not a number.
- Live recalculation with the answer pinned in view.
- Signed-line waterfall of contributions (PolicyEngine decomposition; Stripe pricing's stacked modifiers). https://stripe.com/pricing
- Dual-unit entry where users think in two units (KFF: dollars or % of FPL). https://www.kff.org/interactive/subsidy-calculator/
- One level of disclosure with a question-shaped label (SmartAsset "Are you exempt from any taxes?").
- Full URL state so every configuration is a permalink (Our World in Data explorers). https://ourworldindata.org/explorers/co2
- Scope limits stated next to the result in the tool's own voice.

## Inputs
- No sliders for money: NN/g says sliders suit approximate values only. https://www.nngroup.com/articles/gui-slider-controls/ GOV.UK ships no slider component.
- Keep text inputs with `$` prefix (aria-hidden) and `inputmode="numeric"`; do not use `type="number"`. https://design-system.service.gov.uk/components/text-input/
- Match input width to expected content.
- One page, grouped, not a wizard: NN/g wizards research; GOV.UK removed a 12-step indicator with no effect on completion. https://www.nngroup.com/articles/wizards/ · https://design-system.service.gov.uk/patterns/question-pages/
- One level of progressive disclosure via native `<details>`; never hide load-bearing fields. https://www.nngroup.com/articles/progressive-disclosure/ · https://design-system.service.gov.uk/components/details/
- Persona presets; anchor one to Census 2024 median household income $83,730 (P60-286). https://www.census.gov/library/publications/2025/demo/p60-286.html
- Inline validation with icon + text, not color alone. https://www.nngroup.com/articles/errors-forms-design-guidelines/

## Results
- Animated numbers: `@number-flow/react` 0.6.2, 6.1 kB gzip, MIT, respects reduced motion by default; `<NumberFlowGroup>` syncs a row. https://number-flow.barvian.me/ (react-countup is stale since 2024.)
- URL state: `nuqs` 2.10.1 with `nuqs/adapters/react`, 6.1 kB, or hand-roll with URLSearchParams. Web Share API on mobile with feature detection.
- Copy-as-image: render a purpose-built 1200×630 share-card node with `modern-screenshot` 4.7.0 (~5 kB).
- Print: `@media print` that unsticks the sidebar, forces `details[open]`, `break-inside: avoid`.
- Sort cards by delta; sticky mobile summary bar with `scroll-padding-top` (WCAG 2.4.11).
- Skip chart libraries: Recharts 144 kB gzip vs the whole app at 96 kB. Hand-rolled bars are correct; move to inline SVG if crisper rendering is wanted.
- Motion durations 100–500 ms (NN/g). Defer `motion` (44.5 kB); `@starting-style` + View Transition API cover enter/exit/reorder.

## Styling for Tailwind v4
- Build a real `@theme` token layer in OKLCH: warm off-white paper, near-black ink, one accent, semantic gain/loss, radii, easings. `@custom-variant dark`; change `color-scheme: light` to `light dark`. https://tailwindcss.com/docs/theme · https://tailwindcss.com/docs/dark-mode
- Adopt shadcn's `--x` / `--x-foreground` token convention by hand; skip the CLI. https://ui.shadcn.com/docs/theming
- Type: Inter Variable (OFL; `tnum`, `zero`) for UI and numbers; Source Serif 4 for headings/prose. Two families only. One `.money { font-variant-numeric: tabular-nums slashed-zero }` class. GOV.UK 5px-multiple line heights. https://rsms.me/inter/
- Component libraries: don't install one yet. If needed, `radix-ui` 1.6.7 unified package, import only Dialog (drawer focus trap) and ToggleGroup (~8–12 kB). Skip `@radix-ui/themes` (competing global stylesheet), Ark UI (283 kB), USWDS/govuk-frontend packages (Sass toolchain; GDS Transport font is not licensed off gov.uk).
- Design direction: editorial / data-journalism civic. Skip bento grids, glass/blur (costs contrast), Linear-style dark gradients (reads venture-backed), raw GOV.UK/USWDS costume (implies government authorship).
- Color: keep red/blue out of judgment encodings (Datawrapper on party colors; GOV.UK reserves red for error). Desaturate party chips to neutral fill + identity dot, saturated only when selected. Retune gain/loss in OKLCH and add ▲/▼ glyphs (green/orange is the worst colorblind axis). https://www.datawrapper.de/blog/partycolors/

## Accessibility defects found in the current code
1. PlatformPicker chips lack `aria-pressed`; role lives only in `title`.
2. PositionsPanel: `role="dialog"` without `aria-modal`, focus trap, or focus restoration.
3. LeverMatrix carries meaning in `title` tooltips.
4. AssumptionsPanel radiogroup lacks roving tabindex / arrow keys.
5. Form focus ring is `focus:ring-1` (1px, on mouse click); should be `focus-visible:` ≥2px at 3:1 (WCAG 2.4.13).
6. Sticky sidebar risks WCAG 2.4.11; add `scroll-padding-top`.
7. `viz-root` class used but never defined.
8. No skip link; `color-scheme: light` blocks dark mode.

## Trust UI
- Inline source links on every claim; methodology as a destination, not a footer h2 (PolicyEngine puts Rules/Parameters/Validation in top nav).
- Two-tier provenance mark: statutory parameter vs our estimate (Our World in Data pattern). https://ourworldindata.org/faqs
- Dated "model updated" stamp and a changelog keyed to law changes; corrections in place (PolitiFact pattern).
- Surface the confidence legend in the main view, not only in the drawer. Don't collapse independent axes into one score (Ground News).
- "Read the model" link to GitHub source and parameter files.

## Plan
Tier 1 (≈1 day, zero deps): @theme tokens + dark variant; focus-visible + skip link + scroll-padding; aria-pressed on chips; desaturated party chips; persona presets; Inter + Source Serif 4 + `.money`; GOV.UK money input details; ▲/▼ glyphs.
Tier 2: NumberFlow; permalink + share; `<details>` disclosure for optional groups; sort by impact; sticky mobile bar; radix Dialog for the drawer; roving tabindex; print CSS; trust bar with confidence legend.
Tier 3: result-as-a-sentence; USWDS-style summary box with container queries; View Transition reorder; copy-as-image; routed methodology page; dark mode; guess-first mode.
