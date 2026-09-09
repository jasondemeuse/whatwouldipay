# Re-sourcing pass — restoring removed positions, replacing Wikipedia citations, field gaps

**Analyst:** political research analyst (citation-recovery pass)
**Date:** 2026-09-09
**Scope:** the four governors whose tariff / Medicaid / ACA positions were removed in `docs/reviews/analyst-review.md` §2a for bare-domain citations; the Wikipedia-only citations on Shapiro and Whitmer; field composition (Ossoff, Kelly, Emanuel, others); and the 2026 Social Security wage base.
**Citation rule applied:** every URL below is a real page with a path (satisfies `dataset.test.ts`: `u.pathname !== '/'`). Each URL is labelled **[fetched]** (I retrieved the page and read its content this session) or **[search-result only]** (the URL appeared in a search index and has not been opened — **verify before committing it to `democrats.ts`**).

## Method note — a constraint that shaped this pass

The session's WebSearch budget was exhausted (200/200) before this task started, so all discovery ran through `WebFetch`. Three routes worked and are worth recording for future passes:

1. **Bing News RSS** — `https://www.bing.com/news/search?q=<query>&format=RSS` returns real publisher URLs (inside the `apiclick.aspx?...url=` parameter). This is the single most useful discovery tool available when WebSearch is gone. Coverage skews to roughly the last 12 months.
2. **Google News RSS** — `https://news.google.com/rss/search?q=<query>` has much deeper archives and gives title + date + outlet, but its links are opaque `news.google.com/rss/articles/...` redirects that do **not** resolve under WebFetch. Use it to learn *that* a story exists, then find the URL another way.
3. **Site search on WordPress-style sites** — `https://<site>/?s=<query>` works on senate.gov offices (`kelly.senate.gov/?s=tariffs`) and on Scripps stations (`lex18.com/search?q=...`). This is how the Beshear ACA and Mark Kelly citations below were recovered.

Blocked to WebFetch this session: `michigan.gov`, `www.governor.ky.gov` (cert mismatch), `legislature.mi.gov` (cert chain), `congress.gov`, `govtrack.us`, `thehill.com`, `politico.com`, `usatoday.com`, `tennessean.com`, `kentuckylantern.com`, `penncapital-star.com`, `whas11.com`, `mojeek.com`, `duckduckgo.com` (CAPTCHA). Plain `bing.com/search` (non-RSS) responded but repeatedly served results for unrelated queries; nothing from it is relied on below.

---

## 1. Restoring the removed governor positions

### 1a. Andy Beshear — TARIFFS ✅ resolved, primary source recovered

**Position (one sentence):** Beshear formally demanded that President Trump rescind the tariff and trade program, on the ground that American consumers, not foreign exporters, pay it — roughly **$2,500 per family in 2026**.

> "It is the American consumer, not the foreign exporter, who pays the price for Trump's failed tariff and trade strategy, with estimates showing that hardworking Americans could pay more than $330 billion in tariff costs in 2026, which equates to more than $2,500 per family."
>
> "In addition to causing prices to skyrocket, these policies are also harming Kentucky's signature agriculture, bourbon and coal industries. It's time Trump prioritized our people and ended this disastrous trade war."

| Field | Value |
|---|---|
| Source title | WYMT: "Gov. Beshear sends letter to Trump asking him to rescind 'harmful' tariff and trade policies" |
| URL | `https://www.wymt.com/2026/09/02/gov-beshear-sends-letter-trump-asking-him-rescind-harmful-tariff-trade-policies/` **[fetched]** |
| Date | 2026-09-02 |
| Confidence | **High** — this is Beshear's own written statement, quoted from the letter, not a reporter's characterisation. |

**Better still — the primary document.** The WYMT story links the letter itself, hosted by the governor's office:

`https://governor.ky.gov/attachments/20260902_Ltr-to-Pres-Trump_Tariffs-and-Trade.pdf` **[fetched — resolves, 111 KB PDF]**

I confirmed this URL returns the PDF, but WebFetch could not extract its text (scanned/image-layer PDF), so the quotes above are taken from WYMT's rendering of it rather than read off the letter. Cite **both**: the PDF as the primary and WYMT as the readable secondary.

Corroborating URLs, same letter, same day, **[search-result only]**: `https://www.lex18.com/news/covering-kentucky/gov-beshear-letter-to-president-trump-tariffs-trade-sept-2-2026`; `https://www.wpsdlocal6.com/news/beshear-calls-for-trump-to-rescind-harmful-tariff-trade-policies/article_f78c4fd0-8ff8-4d6b-98ed-780a58864f80.html`; `https://www.kentucky.com/news/politics-government/article317111869.html` (Lexington Herald-Leader, 2026-09-03).

**Modeling note.** "Rescind the tariff and trade policies," full stop, with no carve-out for China or strategic goods, supports `TARIFF.repeal` rather than `TARIFF.targeted`. No exception is stated in the letter as quoted.

### 1b. Andy Beshear — ACA ENHANCED CREDITS ✅ resolved

**Position:** Beshear publicly urged Congress to extend the enhanced premium tax credits ahead of the Senate vote, framing the choice as tax cuts for the wealthy versus credits for working people.

> "The idea that this Congress would vote to extend tax cuts for the wealthy, but not tax credits for hard-working Americans so that they can see a doctor — that's just wrong."
>
> "Healthcare is a basic human right."

| Field | Value |
|---|---|
| Source title | LEX 18 (WLEX): "Beshear urges Congress to extend health insurance tax credits as Senate vote looms" (Karolina Buczek) |
| URL | `https://www.lex18.com/news/covering-kentucky/beshear-urges-congress-to-extend-health-insurance-tax-credits-as-senate-vote-looms` **[fetched]** |
| Date | **Not printed on the page as rendered.** Google News indexes the companion LEX18 story at 2025-10-28; this one is from the same reporter and the same Senate-vote news cycle. Treat the date as **unconfirmed** — either omit the `date` argument to `cite()` or verify it manually before adding one. |
| Confidence | **High** for the position; the quote is Beshear speaking. **Low** for the date. |

Companion piece, quantifying the Kentucky impact — **[search-result only]**, recovered from LEX18's own site search:
`https://www.lex18.com/news/covering-kentucky/beshear-kentuckians-will-face-health-insurance-premium-increases-of-up-to-37-without-federal-action` — headline: "Beshear: Kentuckians will face health insurance premium increases of up to 37% without federal action," Google News date 2025-10-28.

This replaces the `https://www.wkyt.com` bare domain the review flagged, and it is a materially stronger citation: a named reporter, a direct quote, and a specific state-level number.

### 1c. Andy Beshear — MEDICAID ⚠️ partially resolved; the strongest evidence is state-fiscal, not federal-position

This is the weakest of the four. Beshear's *record* on Medicaid work requirements is strong (he rescinded Kentucky's 1115 waiver in 2019), but every 2025–26 source I could open is either behind a fetch block or reports his position rather than quoting a policy statement.

**Best fetchable source:**

> "Today, I'm taking them at their word, and I'm applying these dollars to reverse cuts and prevent painful impacts to our Kentucky families."

| Field | Value |
|---|---|
| Source title | FOX 56 / WDKY Lexington (via Yahoo syndication): "Beshear reverses planned Medicaid cuts for Kentuckians following tax windfall" |
| URL | `https://www.yahoo.com/news/politics/articles/beshear-reverses-planned-medicaid-cuts-233516717.html` **[fetched]** |
| Date | 2026-07-22 |
| Confidence | **Medium.** The quote is Beshear's, and the action (using a revenue surplus to reverse a planned 4% Medicaid provider cut) is documented — but it is a *state budget* action, not a stated position on OBBBA's federal work requirements or cost-sharing. It does not by itself justify `reverseHealthCuts()`. |

**Weaker, quote-thin, but on the federal question — [fetched]:**
`https://www.lex18.com/news/covering-kentucky/gov-beshear-to-appear-on-meet-the-press-amid-medicaid-debate-and-presidential-speculation` — records Beshear calling the reconciliation law the "Big, Ugly Bill" and paraphrases (via moderator Kristen Welker) his argument that "millions will be tossed off the Medicaid rolls because of these new work requirements, because of the red tape." **Confidence: low-to-medium** — the substantive claim reaches the page as the moderator's summary of his position, which is exactly the "reporter's characterisation" failure mode the brief warns about.

**Not recoverable this session [search-result only, all fetch-blocked]:**
- `https://thehill.com/policy/healthcare/5946392-lawsuit-trump-medicaid-exemptions/` — "Dozens of states sue Trump administration over 'frail' Medicaid work requirement exemption," 2026-06-29. If Kentucky is a plaintiff this is the single best citation for the position; I could not open it to confirm Kentucky's participation. **Verify manually.**
- `https://www.usatoday.com/story/news/politics/andy-beshear/2026/09/01/beshear-barr-clash-medicaid-cuts-rural-health-care-funding/91566481007/` — "Beshear, Barr at odds over Kentucky's plans for rural health funds," 2026-09-01.

**Recommendation:** restore Beshear's `medicaid` position at `'medium'` on the FOX56 URL *plus* whichever of the two blocked URLs verifies, and describe it accurately as opposition to the federal cuts backed by a state-level reversal — not as an endorsement of the caucus reversal bill. If neither blocked URL verifies, keep the position as a `note()` without `reverseHealthCuts()`.

### 1d. JB Pritzker — TARIFFS ✅ resolved

**Position:** Tariffs are a consumer tax that no ordinary household can get refunded; Pritzker demanded Trump send **$1,700 direct payments** to Illinois families and back the Tariff Relief for Consumers Act.

> "There is no portal to request a refund for a mother in Rockford buying groceries for her children. There is no trade attorney representing a retiree in Carbondale paying off their mortgage. There is no check coming in for the farmer in Champaign who had to pay more for his equipment."
>
> "The invoice was past-due then. The invoice remains unpaid. Illinois families are still waiting."

| Field | Value |
|---|---|
| Source title | Capitol News Illinois: "Pritzker pens letter to Trump, seeking tariff refunds for Illinois families" (Maggie Dougherty) |
| URL | `https://capitolnewsillinois.com/news/pritzker-pens-letter-to-trump-seeking-tariff-refunds-for-illinois-families/` **[fetched]** |
| Date | 2026-08-06 |
| Confidence | **High** — quoted directly from Pritzker's own letter. |

Also fetched and usable: `https://www.kwqc.com/2026/08/06/pritzker-pens-letter-trump-seeking-tariff-refunds-illinois-families/` **[fetched]**, which adds the cost figures the article attributes to a July 2026 report (average $2,200 per Illinois household; ~$800 for the bottom decile) and records an earlier February 2026 letter invoicing the federal government $8.6 million after the Supreme Court ruling.

**[search-result only]:** `https://www.usatoday.com/story/news/politics/state/2026/08/06/pritzker-demands-tariff-refunds-for-illinois-residents/91203670007/`.

This replaces the `https://gov.illinois.gov/` bare domain. Note the review's placeholder described a "tariff executive order, 2025-07-14"; I found no such executive order. What I found is the September 2025 EO directing agencies to find 4% budget cuts in response to federal policy, and the 2026 refund letters. **The 2025-07-14 executive-order claim should be dropped, not re-cited.**

### 1e. JB Pritzker — MEDICAID ❌ not resolved

I could not find a citable Pritzker statement on OBBBA's Medicaid cuts or work requirements in a fetchable source. What exists is adjacent and does not carry his voice on the federal policy:

- `https://www.wqad.com/article/news/politics/illinois-politics/illinois-hospitals-lose-billions-medicaid-policy-change-study-finds-capitol-news/526-dad1f30c-cea5-43be-8ebb-c6d841feae33` **[search-result only]** — "Illinois hospitals to lose billions through Medicaid policy change, study finds," 2026-09-02. This is a study about Illinois hospitals, not a Pritzker position.
- Illinois' 2025 rollback of state-funded health coverage for some non-citizen adults cuts *against* a simple "reverse the health cuts" coding and is already noted in the file.

**Recommendation: leave Pritzker's `medicaid` position out.** The party default is the honest fallback here, and asserting a position on this evidence would repeat exactly the error the review caught. Flag it in `notes` as an open research item rather than inventing a citation.

### 1f. Wes Moore — TARIFFS ✅ resolved

**Position:** Moore (with the Comptroller) demanded federal reimbursement of Maryland's tariff costs after the Supreme Court ruling — about **$4 billion statewide, ~$1,744 per household**.

> "I have long said that while tariffs are a tool of international trade, the Trump-Vance Administration has waged war on our families and raised taxes on us all."

He also described the $4 billion as "real money taken away from Maryland families."

| Field | Value |
|---|---|
| Source title | FOX45 Baltimore: "Maryland leaders demand President Trump reimburse tariff costs after court ruling" |
| URL | `https://foxbaltimore.com/news/local/gov-moore-comptroller-demand-reimbursement-from-president-trump-for-illegal-tariffs` **[fetched]** |
| Date | 2026-02-26 (Bing News timestamp 2026-02-26T23:00Z; the page's own dateline reads 2026-02-27) |
| Confidence | **High** for the quote and the demand. **Medium** for the $1,744 per-household figure, which the article attributes to a Joint Economic Committee analysis rather than to Moore. |

**[search-result only]:** `https://www.baltimoresun.com/2026/02/27/moore-trump-feud-tariffs/` — "New in Moore v. Trump: the governor wants Maryland's $4 billion back," 2026-02-27.

**Modeling note — important.** Moore's own framing is *not* abolitionist: "tariffs are a tool of international trade" is an explicit concession, and his demand is for reimbursement of the tariffs the Court already struck down, not for repeal of the surviving §232/301/201 measures. That argues for `TARIFF.targeted`, not `TARIFF.repeal`. Coding him at `repeal` on this quote would overstate him.

### 1g. Gretchen Whitmer — TARIFFS ⚠️ resolved on substance, weak on provenance, and genuinely two-sided

**Position:** Whitmer attacked the Canada tariff escalation as a tax hike on Michigan households.

> "Michiganders are uniquely impacted by DC Republicans' ongoing, chaotic tariff wars with Canada."
>
> "These tariffs act as a tax hike on Michigan families and businesses by raising prices at the grocery store and the gas pump."
>
> "Michiganders literally cannot afford to keep paying these Republican tariff taxes."

| Field | Value |
|---|---|
| Source title | Benzinga: "Gretchen Whitmer Slams Trump After Failed Canada Talks…" (Badar Shaikh) |
| URL | `https://www.yahoo.com/news/politics/articles/gretchen-whitmer-slams-trump-failed-033023184.html` **[fetched]** |
| Date | Article dateline 2026-08-22; Bing/Google News timestamps 2026-08-24 and 2026-08-25 |
| Confidence | **High** that these are Whitmer's own words (they read as a released statement, three consecutive first-person policy sentences). **Medium** on the citation's quality — Benzinga syndicated via Yahoo is a thin outlet for a position that would drive a parameter change, and the original release almost certainly sits on `michigan.gov`, which 403s every automated fetch. |

**The countervailing evidence, and why I would not code her `repeal`.** An Associated Press story from April 2025 is headlined "Michigan Democratic Gov. Whitmer partly backs tariffs before again meeting with Trump" (`https://kdvr.com/news/politics/ap-politics/ap-michigan-democratic-gov-whitmer-strays-from-her-party-in-moving-closer-to-trump/` **[search-result only — the page 403'd on fetch]**). Whitmer has publicly positioned herself as willing to use tariffs as a targeted instrument while opposing broad ones; Axios covered the same posture as "Whitmer's big gamble for 2028: Working with Trump" (2025-08-18). Her August 2026 statement is aimed specifically at the *Canada* escalation.

**Recommendation:** restore Whitmer's tariff position at `TARIFF.targeted`, confidence `'medium'`, summarised as opposition to the broad 2025–26 tariffs while having publicly declined to rule tariffs out as a tool — and try once more, manually, to recover the michigan.gov press release before shipping. Do **not** code her at `repeal` on the Benzinga quote alone; the AP headline is a live contradiction that a hostile reader will find in one search.

---

## 2. The Wikipedia-cited positions on Shapiro and Whitmer

### 2a. Josh Shapiro — two positions, both Wikipedia-only

**(i) `note('incomeRates', …)`** — "No federal position; no proposal to change Pennsylvania's 3.07% flat income tax." Cited to `https://en.wikipedia.org/wiki/Josh_Shapiro`.

**Replacement found ✅** for the factual half:

`https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/personal-income-tax.html` **[fetched]** — Pennsylvania Department of Revenue, official:

> "Pennsylvania personal income tax is levied at the rate of 3.07 percent against taxable income of resident and nonresident individuals, estates, trusts, partnerships, S corporations, business trusts and limited liability companies not federally taxed as corporations."

**Caveat that matters.** This page proves the *rate*. It cannot prove the *negative* claims — "no federal position," "no proposal to change it." Those are unsourceable by construction, and Wikipedia never supported them either. Rewrite the summary so the sourced part and the absence-of-evidence part are visibly different, e.g. "Pennsylvania levies a 3.07% flat personal income tax (PA DOR); no federal rate proposal located." That is honest and it passes the lint.

**(ii) `note('other', …)`** — "Supports accelerating Pennsylvania's corporate net income tax phase-down toward 4.99% (cuts to his right)." Cited to `https://en.wikipedia.org/wiki/Josh_Shapiro`.

**Partially replaceable ⚠️.** The statutory schedule is now primary-sourced:

`https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/corporation-taxes/corporate-net-income-tax.html` **[fetched]** — PA DOR gives the full schedule: 9.99% through 2022, then **8.99% (2023) · 8.49% (2024) · 7.99% (2025) · 7.49% (2026) · 6.99% (2027) · 6.49% (2028) · 5.99% (2029) · 5.49% (2030) · 4.99% (2031 and after)**.

**But I could not source the acceleration proposal.** No fetchable document ties Shapiro to a proposal to reach 4.99% *faster* than 2031. `penncapital-star.com`, `politico.com` and `thehill.com` all 403'd; Bing News RSS surfaced only FY2027 budget coverage (`https://www.pennlive.com/opinion/2026/06/shapiros-56-billion-deficit-threatens-pennsylvania-families-with-massive-tax-hikes-opinion.html` **[search-result only]**, an opinion column; and `https://www.dailyitem.com/cnhi_network/pa-lawmakers-adopt-new-budget-shapiro-calls-compromise-necessary/article_b4d36b6d-10b6-5406-941a-8af37c26e88e.html` **[search-result only]**, 2026-07-13).

Note also that the current summary's premise is off: Wikipedia's own sentence is "lowering corporate income taxes from 8.99% to 4.99% by 2026" — i.e. an acceleration relative to a schedule that in fact runs to 2031. That number never became law; the statutory 2026 rate is 7.49%.

**Recommendation:** re-cite the position to the PA DOR CNIT page and restate it as the statutory phase-down (with 2026 at 7.49%), noting the acceleration proposal as unverified — or drop the "accelerating" claim until a budget-address citation is recovered. As it stands, the claim about what Shapiro *supports* is unsupported by anything I could open, and claims about people carry the higher bar.

### 2b. Gretchen Whitmer — two positions, both Wikipedia-only ❌ neither replaced

**(i) `note('eitc', …)`** — Michigan EITC raised from 6% to 30% of the federal credit in a $1B 2023 package.
**(ii) `note('socialSecurityBenefits', …)`** — repeal of Michigan's "retirement tax" on pension income (2023).

Both claims are true and both come from the same statute — the *Lowering MI Costs Plan*, **2023 Public Act 4**, signed 2023-03-07. I could not open a citable page for either:

- `https://www.michigan.gov/taxes/iit/eitc` — **HTTP 403** (michigan.gov blocks automated fetches wholesale; `michigan.gov/whitmer/news` also 403s).
- `https://www.legislature.mi.gov/documents/2023-2024/publicact/htm/2023-PA-0004.htm` — **TLS failure** ("unable to verify the first certificate") under WebFetch. This is the correct primary document and the URL pattern is the standard Michigan Legislature one; a browser will very likely open it.
- Bing News RSS and Google News RSS returned no usable 2023 coverage for these queries (Bing News' archive does not reach back that far).
- WebFetch's markdown conversion strips Wikipedia's reference URLs, so mining the article's own footnotes — normally the fastest route from a Wikipedia citation to its underlying source — did not work either. (`?action=raw` on the wikitext is the workaround to try next time.)

**Recommendation:** these two are a **manual, five-minute browser task**, not a research problem. Open the PA 4 of 2023 URL above and, if it renders, cite it for both positions; failing that, the Michigan Department of Treasury EITC page. Until then the Wikipedia citations are the honest placeholder — they do support the claims — but they should carry a `notes` line saying the primary source is identified (2023 PA 4) and pending.

### 2c. Related, outside the brief

The review lists four more Wikipedia-cited positions — `OSSOFF.singlePayer`, `BUTTIGIEG.singlePayer`, `GALLEGO.singlePayer`, and Vance in `platforms/spending.ts`. None were in scope here and none were re-sourced this pass.

---

## 3. Field framing

### 3a. Jon Ossoff — verified, and my recommendation is **keep him, with a two-part note**

**The statement, verified:**

> "I have zero interest in running for president in 2028."

| Field | Value |
|---|---|
| Source | USA TODAY (Irene Wright), syndicated via AOL: "Ossoff says he won't run in 2028. Poll shows he could win if he did" |
| URL | `https://www.aol.com/articles/ossoff-says-wont-run-2028-181819000.html` **[fetched]** |
| Date of the statement | **2026-07-23**, made on a press call |
| Date of the article | 2026-08-20 |
| Confidence | **High** — direct first-person quote, and he has repeated it. |

He said it again in August: "Ossoff: 'Zero interest' in running for president in 2028" (2026-08-18) and "Ossoff in 2028? Georgia senator isn't running, he says repeatedly" (2026-08-17) — both **[search-result only]**, MSN aggregator URLs I would not cite. A clean non-aggregator secondary is `https://www.nj.com/politics/2026/08/rising-dem-keeps-rejecting-this-1-job-amid-harris-newsom-speculation.html` **[search-result only]**, 2026-08-14.

**Why keep him anyway — this is the interesting part.** The denial has not moved the markets; it has coincided with him *rising* in them.

- `https://www.newsweek.com/how-voters-view-aoc-newsom-ossoff-compared-obama-before-2008-12371379` **[fetched]**, 2026-08-30. August 2026 YouGov: Ossoff is the only contender in the set with a **positive net favourability (+7: 25% fav / 18% unfav)** — against Harris −11, Newsom −10, AOC −6, Buttigieg +1. He polls 5–6% in conventional primary surveys but is **favoured on prediction markets at 17%**. The article notes explicitly that he has said he has "zero interest."
- `https://www.thedailybeast.com/jon-ossoff-emerges-as-new-2028-presidential-favorite/` **[search-result only]**, 2026-08-27.
- `https://federalnewsnetwork.com/prediction-markets/2026/08/ossoff-new-favorite-dem-nominee-prediction-markets-2028-election/` **[search-result only]**, 2026-08-26.

**Recommendation.** Removing Ossoff would make the field *less* accurate, not more: as of early September 2026 he is the prediction-market favourite for the Democratic nomination. The problem was never his inclusion — it is that the dataset resolves the tension silently. He is also, per the review, the entry with the best modeling discipline in the file (`hold()` used correctly twice).

Keep him, and make the tension explicit in two places: his `role` string already reads "(has said he is not running)" — good; add the countervailing half so it reads as a genuine tension rather than a disclaimer, and cite the denial in the platform `notes` with the AOL/USA TODAY URL and the 2026-07-23 date. This is a case where saying "markets and the candidate disagree, here is the evidence for both" is stronger than picking one.

### 3b. Mark Kelly — ✅ four citable positions, all from his own Senate office

Kelly is the best-documented of the missing names and could be added today. All four URLs below came from `kelly.senate.gov/?s=<query>`; the three marked [fetched] I opened and read.

| Area | Position | Source | URL | Date | Confidence |
|---|---|---|---|---|---|
| `tariffs` | Tariffs are a tax on working families that raise food prices — "These tomato tariffs are a **billion-dollar tax on Arizona working families**. They will raise food prices, threaten the jobs of thousands of warehouse workers and truck drivers in our state, and squeeze small businesses already struggling to keep up with rising costs." | Kelly: "Tomato Tariffs will Raise Food Prices, Kill Arizona Jobs" | `https://www.kelly.senate.gov/newsroom/press-releases/kelly-tomato-tariffs-will-raise-food-prices-kill-arizona-jobs/` **[fetched]** | 2025-07-14 | **High** — his own release, first person, on the record. |
| `aca` | Restore/extend the enhanced premium tax credits — "Today's vote came down to a simple choice: protect working families from skyrocketing health care costs or let premiums double or even triple," warning 300,000+ Arizonans faced increases from January 1. | Kelly: "Statement After Republicans Block Extension of Health Care Tax Credits" | `https://www.kelly.senate.gov/newsroom/press-releases/kelly-statement-after-republicans-block-extension-of-health-care-tax-credits/` **[fetched]** | 2025-12-11 | **High** |
| `ctc` | Cosponsor of the **American Family Act** — the release states the bill "increases the credit amount from $2,000 per child to: $6,360 for newborns, $4,320 for children ages 1–6, and $3,600 for children ages 6–17." Also cosponsors the **Tax Cut for Workers Act** (EITC expansion), which would additionally support an `eitc` position. | Kelly: "Kelly Backs Efforts to Cut Taxes for Parents, Working Americans" | `https://www.kelly.senate.gov/newsroom/press-releases/kelly-backs-efforts-to-cut-taxes-for-parents-working-americans/` **[fetched]** | 2025-04-10 | **High** — maps exactly onto the existing `ctcAmericanFamilyAct` helper, identical to Gallego's and Booker's coding. |
| `medicaid` | Opposes the OBBBA Medicaid cuts; Arizona faces "a 19 percent reduction to its Medicaid funding." | Kelly/Gillibrand: "Demand Answers on Impact of Trump Medicaid Cuts" | `https://www.kelly.senate.gov/newsroom/press-releases/kelly-gillibrand-colleagues-demand-answers-on-impact-of-trump-medicaid-cuts/` **[search-result only]** | 2026-07-01 | **Medium** pending fetch. A fetched alternative in the same vein: `https://www.kelly.senate.gov/newsroom/press-releases/watch-on-senate-floor-kelly-opposes-republican-budget-to-cut-medicaid-and-food-assistance-to-fund-billionaire-tax-breaks/` **[search-result only]**, 2025-06-30. |

Additional tariff support **[search-result only]**: `https://www.kelly.senate.gov/newsroom/press-releases/kelly-colleagues-introduce-legislation-to-protect-small-businesses-from-trump-tariffs/` (2025-09-11).

**Two negatives worth encoding, both of which argue for `hold()`:**

- **Social Security / payroll.** A full sweep of `kelly.senate.gov/?s=Social+Security` returned six releases, every one of them defensive (field-office closures, DOGE cuts, benefit-disruption oversight, the WEP/GPO repeal he and Gallego pushed). **Nothing on the wage base or the payroll-tax cap.** He is not visibly an SSEA cosponsor — though note I could not confirm the S.770 cosponsor list directly, as both `congress.gov` and `govtrack.us` 403'd. Treat like Gallego: `hold('payroll', …)`.
- **Top income-tax rate, capital gains, Medicare for All.** Nothing located in any of these three areas. If Kelly is added he should inherit `party-dem` for them, which — given the review's §3a warning about the Greenbook lane — means he will be shown proposing a 39.6% top rate and capital gains as ordinary income above $1M on no evidence of his own. **Add him only if the "Party default" labelling problem is addressed**, or he will become the fifth instance of the file's biggest fairness exposure.

**Field signal:** Kelly polls ~7% among Democrats (Newsweek, 2026-08-30, **[fetched]**), ahead of Shapiro at 6% — both of whom are already or would be in the set.

### 3c. Rahm Emanuel — ❌ real candidate, no modelable platform. **Recommend: do not add.**

Emanuel's *candidacy* signal is now stronger than several people already in the dataset:

- "Rahm Emanuel says he's leaning toward a 2028 presidential run," 2026-09-02 **[search-result only, MSN]**
- `https://thehill.com/homenews/campaign/5994428-rahm-emanuel-2028-election-prospects/` **[search-result only]**, 2026-07-28 — "Emanuel: Being 2028 front-runner now would be 'kiss of death'"
- `https://www.politico.com/news/magazine/2026/03/29/rahm-emanuel-2028-presidential-election-campaign-primary-00848895` **[search-result only]**, 2026-03-29 — "Democrats Have a Rahm Emanuel Problem"
- `https://thehill.com/homenews/campaign/5808028-rahm-emanuel-democrats-agenda-2026/` **[search-result only]**, 2026-03-30 — his "6 for '26" agenda, which is the most likely place a fiscal platform would be found. **Fetch-blocked; worth one manual look.**

But on the eight areas this calculator models, I found essentially nothing. I fetched two substantial interview pieces:

- `https://www.ms.now/news/news-analysis/2028-hopeful-rahm-emanuel-joins-morning-joe` **[fetched]**, 2026-08-31. The only concrete economic commitment: **"We haven't raised the minimum wage since 2007. I'm for $20 by 2030."** Plus general anti-corruption/affordability framing ("Raise incomes, raise wages, raise the minimum wage"). The minimum wage is not a parameter in this model.
- `https://www.yahoo.com/news/politics/articles/rahm-emanuel-case-reviving-clintonism-203051949.html` **[fetched]**, 2026-09-08. Covers welfare reform, the ACA, education, social-media age limits, policing — **no quotable position on tax rates, the CTC, tariffs, ACA credits, Medicaid, Social Security, capital gains, or Medicare for All.**

Adding Emanuel now would mean a platform with zero own-positions inheriting the entire Biden-Harris Greenbook package — the Shapiro problem in its purest form, for a figure whose whole public identity is opposition to the party's left. That would be actively misleading. **Recommend: name him in the methodology as a 2026 signal the field does not model, exactly as the review proposes for Tucker Carlson.**

### 3d. Other names missing from the current 20

Ordered by how much they'd change the field's defensibility.

| Missing | Signal found this session | Assessment |
|---|---|---|
| **Mark Kelly (D)** | ~7% in Democratic primary polling (Newsweek, 2026-08-30 **[fetched]**), above Shapiro | **Strongest case. Add** — four sourced positions above. |
| **James Talarico (D)** | Named as a contender in the same Newsweek piece **[fetched]**, 2026-08-30 | New name not in the review's list. Texas state legislator; no federal fiscal record researched. Note, don't add. |
| **Tucker Carlson (R)** | Carried forward from the review (§3c); nothing new this session | Confirmed gap on market share, but no modelable platform. Note in methodology. |
| **Rahm Emanuel (D)** | "Leaning toward" a run, 2026-09-02 | Real candidacy, **no modelable platform** — see 3c. |
| **Raphael Warnock (D)** | Carried forward from the review; nothing new this session | Note only. |
| **Donald Trump Jr. (R)** | Carried forward; nothing new | Polling signal, no platform. |

On the Republican side, the 2026 polling picture is worth one line in the methodology: `https://www.indianagazette.com/the_wire/poll-41-of-conservative-voters-favor-vp-vance-in-2028-presidential-primary/article_48ecb976-4225-5471-8daa-ad0d427fb6e2.html` **[search-result only]**, 2026-08-24 — Vance at 41% among conservative voters. This complicates the review's finding that Rubio had overtaken Vance in June 2026 and reinforces its core recommendation: **replace static horse-race `role` labels with office + platform vintage**, because the ordering is contested and moves month to month.

---

## 4. The 2026 Social Security wage base — ✅ verified, non-SSA source

**$184,500 is confirmed.**

> "Individual taxable earnings of up to **$184,500** annually will be subject to Social Security tax in 2026"

— alongside "a cost-of-living adjustment (COLA) of 2.8% for both Social Security and Supplemental Security Income (SSI) benefits beginning in January 2026."

| Field | Value |
|---|---|
| Source | *Journal of Accountancy* (AICPA): "Social Security wage base and COLA announced for 2026" |
| URL | `https://www.journalofaccountancy.com/news/2025/oct/social-security-wage-base-and-cola-announced-for-2026/` **[fetched]** |
| Date | 2025-10-24 |
| Confidence | **High.** AICPA's professional news service reporting SSA's annual announcement; a standard payroll-practitioner reference. |

Independent corroboration of the same figure, all **[search-result only]**: `https://www.cnbc.com/2025/10/30/social-security-payroll-tax-2026.html` (2025-10-30); `https://www.fool.com/retirement/2026/01/30/earning-less-than-184500-in-2026-this-social-secur/` (2026-01-30); `https://247wallst.com/personal-finance/2026/08/22/social-securitys-184500-wage-cap-is-under-fire-heres-exactly-who-would-pay-more/` (2026-08-22).

This closes the one item the accuracy review listed as COULD NOT VERIFY in `baseline2026.ts` (`payroll.ssWageBase`). Note that `https://taxfoundation.org/data/all/federal/2026-tax-brackets/` **[fetched]** does **not** carry the wage base — it covers income brackets and deductions only — so don't reach for it here.

---

## Recommended dataset changes

One line each: **politician · area · change · URL**.

1. **Beshear · tariffs · ADD** `pos('tariffs', …, 'high', …, tariffs(TARIFF.repeal))` — letter to Trump demanding rescission; "the American consumer, not the foreign exporter, pays" · `https://governor.ky.gov/attachments/20260902_Ltr-to-Pres-Trump_Tariffs-and-Trade.pdf` (+ `https://www.wymt.com/2026/09/02/gov-beshear-sends-letter-trump-asking-him-rescind-harmful-tariff-trade-policies/`, 2026-09-02)
2. **Beshear · aca · ADD** `pos('aca', …, 'high', …, restoreEnhancedAca)` — urged Congress to extend the enhanced credits; omit the `date` argument until the page date is confirmed · `https://www.lex18.com/news/covering-kentucky/beshear-urges-congress-to-extend-health-insurance-tax-credits-as-senate-vote-looms`
3. **Beshear · medicaid · ADD as `note()` at `'medium'`, without `reverseHealthCuts()`** unless the two blocked URLs verify — state-budget reversal of planned Medicaid cuts · `https://www.yahoo.com/news/politics/articles/beshear-reverses-planned-medicaid-cuts-233516717.html` (2026-07-22)
4. **Beshear · notes · EDIT** — delete the "specific citable releases have not yet been added" caveat for tariffs and ACA; keep it for Medicaid work requirements · (no URL)
5. **Pritzker · tariffs · ADD** `pos('tariffs', …, 'high', …, tariffs(TARIFF.repeal))` — demanded $1,700 per-family tariff refunds; "There is no portal to request a refund for a mother in Rockford" · `https://capitolnewsillinois.com/news/pritzker-pens-letter-to-trump-seeking-tariff-refunds-for-illinois-families/` (2026-08-06)
6. **Pritzker · notes · EDIT** — drop the unverified "tariff executive order, 2025-07-14" claim; no such order was found · (no URL)
7. **Pritzker · medicaid · DO NOT ADD** — no citable Pritzker position located; leave the party default and record it as an open item · (no URL)
8. **Moore · tariffs · ADD** `pos('tariffs', …, 'high', …, tariffs(TARIFF.targeted))` — **targeted, not repeal**: "while tariffs are a tool of international trade, the Trump-Vance Administration has waged war on our families" · `https://foxbaltimore.com/news/local/gov-moore-comptroller-demand-reimbursement-from-president-trump-for-illegal-tariffs` (2026-02-26)
9. **Whitmer · tariffs · ADD** `pos('tariffs', …, 'medium', …, tariffs(TARIFF.targeted))` — "These tariffs act as a tax hike on Michigan families and businesses"; note she has declined to rule tariffs out as a tool · `https://www.yahoo.com/news/politics/articles/gretchen-whitmer-slams-trump-failed-033023184.html` (2026-08-22)
10. **Whitmer · notes · EDIT** — replace the "stance could not be verified" note with the AP-headline caveat (partly backs targeted tariffs, April 2025), so the file no longer asserts a knowledge gap that has closed · (no URL)
11. **Whitmer · eitc · RE-CITE (manual)** — replace Wikipedia with 2023 PA 4; URL is fetch-blocked by TLS, verify in a browser · `https://www.legislature.mi.gov/documents/2023-2024/publicact/htm/2023-PA-0004.htm`
12. **Whitmer · socialSecurityBenefits · RE-CITE (manual)** — same statute, same caveat · `https://www.legislature.mi.gov/documents/2023-2024/publicact/htm/2023-PA-0004.htm`
13. **Shapiro · incomeRates · RE-CITE** — replace Wikipedia with PA DOR; and split the sourced rate from the unsourceable "no federal position" claim · `https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/personal-income-tax.html`
14. **Shapiro · other · RE-CITE and RESTATE** — replace Wikipedia with PA DOR's statutory schedule (2026 = 7.49%, 4.99% in 2031); drop or flag the unverified "accelerating" claim · `https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/corporation-taxes/corporate-net-income-tax.html`
15. **Ossoff · role/notes · EDIT — KEEP him** — cite the 2026-07-23 "zero interest" denial in `notes`, and state the countervailing fact (prediction-market favourite at ~17%, best net favourability in the field) rather than resolving the tension silently · `https://www.aol.com/articles/ossoff-says-wont-run-2028-181819000.html` + `https://www.newsweek.com/how-voters-view-aoc-newsom-ossoff-compared-obama-before-2008-12371379`
16. **Kelly · NEW PLATFORM · tariffs** — "a billion-dollar tax on Arizona working families," `TARIFF.repeal`, `'high'` · `https://www.kelly.senate.gov/newsroom/press-releases/kelly-tomato-tariffs-will-raise-food-prices-kill-arizona-jobs/` (2025-07-14)
17. **Kelly · NEW PLATFORM · aca** — `restoreEnhancedAca`, `'high'`; 300,000+ Arizonans facing increases · `https://www.kelly.senate.gov/newsroom/press-releases/kelly-statement-after-republicans-block-extension-of-health-care-tax-credits/` (2025-12-11)
18. **Kelly · NEW PLATFORM · ctc** — American Family Act cosponsor, `ctcAmericanFamilyAct`, `'high'` · `https://www.kelly.senate.gov/newsroom/press-releases/kelly-backs-efforts-to-cut-taxes-for-parents-working-americans/` (2025-04-10)
19. **Kelly · NEW PLATFORM · medicaid** — opposes OBBBA cuts (Arizona −19% Medicaid funding), `'medium'` pending fetch · `https://www.kelly.senate.gov/newsroom/press-releases/kelly-gillibrand-colleagues-demand-answers-on-impact-of-trump-medicaid-cuts/` (2026-07-01)
20. **Kelly · NEW PLATFORM · payroll** — `hold()`: six Social Security releases, all defensive, none on the wage base or cap · `https://www.kelly.senate.gov/?s=Social+Security`
21. **Emanuel · DO NOT ADD** — "leaning toward" a run but no position located in any modeled area; name him in the methodology instead · `https://www.ms.now/news/news-analysis/2028-hopeful-rahm-emanuel-joins-morning-joe` (2026-08-31)
22. **baseline2026 · payroll.ssWageBase · CONFIRM $184,500** — closes the review's one unverified headline parameter · `https://www.journalofaccountancy.com/news/2025/oct/social-security-wage-base-and-cola-announced-for-2026/` (2025-10-24)
23. **Methodology · field framing · EDIT** — record that the Republican ordering is contested (Vance 41% among conservative voters, 2026-08-24) and that Ossoff leads Democratic prediction markets while denying a run; state one inclusion criterion and apply it · `https://www.indianagazette.com/the_wire/poll-41-of-conservative-voters-favor-vp-vance-in-2028-presidential-primary/article_48ecb976-4225-5471-8daa-ad0d427fb6e2.html`

### Verify-before-committing list

Every URL marked **[search-result only]** above, and specifically these five, which carry real weight in the recommendations:

- `https://www.kelly.senate.gov/newsroom/press-releases/kelly-gillibrand-colleagues-demand-answers-on-impact-of-trump-medicaid-cuts/` (item 19)
- `https://www.lex18.com/news/covering-kentucky/beshear-kentuckians-will-face-health-insurance-premium-increases-of-up-to-37-without-federal-action` (supports item 2)
- `https://thehill.com/policy/healthcare/5946392-lawsuit-trump-medicaid-exemptions/` — would upgrade item 3 to a real federal position **if** Kentucky is a plaintiff
- `https://www.legislature.mi.gov/documents/2023-2024/publicact/htm/2023-PA-0004.htm` (items 11–12)
- `https://kdvr.com/news/politics/ap-politics/ap-michigan-democratic-gov-whitmer-strays-from-her-party-in-moving-closer-to-trump/` — the AP counter-evidence behind item 9's `targeted` coding

Two items are unresolved and should stay that way rather than be papered over: **Pritzker on Medicaid** and **Shapiro's corporate-tax acceleration proposal**. Both are claims about what a person supports, and neither has a source I could open.
