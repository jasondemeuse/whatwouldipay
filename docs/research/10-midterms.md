# 2026 midterms — what can be automated, with citations

**Analyst:** research analyst (feasibility pass for a midterms release)
**Date:** 2026-09-10 · election day 2026-11-03 (54 days out)
**Scope:** race/candidate data, address→district, deriving incumbent positions from the record, challengers, governors, product shape, phased effort.
**Method:** WebSearch budget exhausted; all discovery via direct HTTP (`curl`), `WebFetch`, the Wikipedia Action API, and the Bing News RSS trick (`https://www.bing.com/news/search?q=<q>&format=RSS`) documented in `09-resourcing.md`. Every URL below is labelled **[fetched]** (retrieved and read this session) or **[not fetched]**.

**Blocked to every tool this session:** `congress.gov` HTML (Cloudflare JS challenge, HTTP 403), `ballotpedia.org` article pages (CloudFront 403), `votesmart.org/share/api-terms-of-service` (403), `cbo.gov` (JS required), `govtrack.us` search (JS-only). Workarounds found and used: **govinfo BILLSTATUS bulk data** for bills/cosponsors (keyless), **clerk.house.gov / senate.gov XML** for roll calls (keyless), **developer.ballotpedia.org** GitBook `.md` mirrors, and **api.paas.votesmart.io/api/swagger-ui-init.js** for the Vote Smart OpenAPI document.

---

# Recommendation (read this page only)

**Ship Phase 1 — "How your representative voted" — and nothing else before November.** It is the only version of a midterms feature that is fully automatable, fully citable, legally clean, and honest. Everything else degrades into "we guessed from the party label."

**What works, verified today:**

- **Incumbent positions from the record are real and cheap.** A build-time script over `govinfo` BILLSTATUS bulk XML + House Clerk roll-call XML + Senate roll-call XML produces, for **all 539 sitting members**, a cited position on a **median of 9 of the app's 14 policy areas** (House mean 9.2, Senate mean 9.4; §3). No API key, no rate limit, ~45 MB of downloads, runs in about a minute.
- **But the record mostly restates the party baseline.** Across 14 tracked vote/cosponsorship signals, the average House member deviates from their own party's modal profile **1.14 times**; the average senator **0.73 times**; **45% of representatives and 56% of senators deviate zero times** (§3.4). The honest product claim is "here is your member's actual roll call, with the citation," not "here is a distinct platform per member."
- **The 2026 district maps are available free.** TIGERweb layer 0, **"120th Congressional Districts" (BAS 2026 vintage)**, reflects the Texas, Missouri, Ohio, California, Utah, Florida, Tennessee, Louisiana, Alabama and North Carolina redraws. Verified: Austin TX returns **CD 10** on the 120th layer vs **CD 37** on the 119th; Kansas City MO **4 vs 5**; Nashville **6 vs 7**; Baton Rouge **2 vs 6** (§2.1). The Census **geocoder** does *not* expose this layer — it returns the 119th only. Nothing else free reflects the new maps: TIGER/Line 2025 ships `cd119` shapefiles only, there is no 120th block-equivalency file, and the `us-zipcodes-congress` crosswalk is built on the 119th.

**What does not work:**

- **There is no free, redistributable, complete list of November 2026 major-party nominees.** FEC gives *filers* (2,346 D/R House+Senate candidates with money and active status for 2026 — roughly 2.6× the ~900 actual nominees), not nominees, and has no nominee flag. Ballotpedia has exactly the right endpoint (`/elections_by_point`) but its Terms of Use say the data is "proprietary and confidential" and licensees must prevent "bulk downloads of the data set by third parties" — which is precisely what a static JSON file on an open-source site is (§1.3). Wikipedia's per-state pages carry parseable `nominee1/nominee2` infobox fields (CC BY-SA) but break for California (top-two, 52 district sections, **0** nominee fields), Washington, Louisiana (jungle primary moved *onto* November 3) and Alaska (RCV, four candidates). **This is the single riskiest dependency in the whole project.**
- **Challengers have no structured position data.** Vote Smart's PCT is behind a "book a demo" JWT wall (401 unauthorized, no published price, no noncommercial tier on the current site); Ballotpedia's survey and campaign-theme tables are free text under the same restrictive licence; FEC Form 2 carries no issue content. A challenger page can honestly show only the party baseline plus a "no voting record" label.
- **Governors need engine changes the app does not have.** `computeStateTax(h, agi, gains)` in `src/engine/stateTax.ts:30` reads only the *household's* state, and `NON_EXPANSION_STATE_CODES` in `src/data/states.ts:344` is a static list — no platform can override either. Governors are a Phase 3 item at best.

**The one thing that would make governors worth doing anyway:** **9 of the app's 10 non-expansion states elect a governor on 2026-11-03** (AL, FL, GA, KS, SC, TN, TX, WI, WY — only MS is off-cycle). The coverage gap the engine already models is decided by exactly those races. If governors ever ship, ship them as a *Medicaid-expansion* feature, not a tax feature.

**Recommended shape:** a "Your representative's record" entry point taking **state + district from a picker** (not an address, not a ZIP), showing the incumbent's House vote record and both senators', each position labelled *Derived from a roll call* with a `clerk.house.gov` / `senate.gov` / `govinfo.gov` citation, against the two party baselines. Ship the ~900-nominee roster only if the owner accepts a Wikipedia CC BY-SA dependency with per-state hand-verification for CA/WA/LA/AK. Estimated effort: **Phase 1 ≈ 5–8 days**, Phase 2 ≈ +8–12 days and an ongoing weekly verification burden, Phase 3 ≈ +10 days plus engine work.

---

# 1. Race and candidate data

## 1.1 FEC OpenFEC API — alive, free, and the best identity spine

| | |
|---|---|
| Base | `https://api.open.fec.gov/v1/` **[fetched]** — live query returned 2026 data |
| Docs | https://api.open.fec.gov/developers/ **[fetched]** · OpenAPI at https://api.open.fec.gov/swagger/ **[fetched]** |
| Auth | api.data.gov key, free signup. `DEMO_KEY` works for exploration |
| Cost | Free |
| Licence | US Government work, public domain |

**Rate limits (measured, not assumed).** A live request returned `x-ratelimit-limit: 10` for `DEMO_KEY` against openFEC. The umbrella defaults, quoted verbatim from https://api.data.gov/docs/developer-manual/ **[fetched]**: *"Hourly Limit: 1,000 requests per hour"* for a registered key, and for DEMO_KEY *"Hourly Limit: 30 requests per IP address per hour / Daily Limit: 50 requests per IP address per day."* FEC applies a stricter DEMO_KEY ceiling (10/hr observed). 1,000/hr is ample: the whole 2026 roster is 24 pages at `per_page=100`.

**Filters confirmed against the live API and the OpenAPI schema:** `state`, `district` ("Two-digit US House district"), `office` ("Federal office candidate runs for: H, S or P"), `election_year`, `cycle`, `party` (three-letter code, repeatable), `incumbent_challenge` ("One-letter code explaining if the candidate is an incumbent, challenger, or if seat is open"), `candidate_status` (C/F/N/P), `has_raised_funds`, `candidate_inactive`.

**Fields returned** (verified on a live 2026 Georgia Senate query): `candidate_id`, `name`, `party`, `party_full`, `office`, `office_full`, `state`, `district`, `district_number`, `election_districts`, `election_years`, `cycles`, `active_through`, `candidate_status`, `candidate_inactive`, `incumbent_challenge`, `incumbent_challenge_full`, `has_raised_funds`, `federal_funds_flag`, `first_file_date`, `last_f2_date`, `last_file_date`, `load_date`, plus address fields. **698 bytes per row** as returned; **152 bytes** for the seven fields the app needs.

**Live 2026 counts (measured today):**

| Query | Count |
|---|---|
| All House candidates, `election_year=2026` | **3,648** |
| House, `has_raised_funds=true` | **2,486** |
| House, D+R, `candidate_status=C`, raised funds | **2,091** |
| All Senate candidates, 2026 | **670** |
| House + Senate, D+R, status C, raised funds | **2,346** |

**The fatal gap: FEC has no nominee flag.** `candidate_status` C = "statutory candidate", not "won the primary". 2,346 filers vs ~905 actual general-election contestants (435 House × ~2 + 35 Senate races × ~2). Filtering by money and status still leaves ~2.5× too many people, including primary losers who never terminated. FEC is the right source for *identity, party, office, district, incumbency* — and the wrong source for *who is on the November ballot*.

**Bulk alternative:** `https://www.fec.gov/files/bulk-downloads/2026/cn26.zip` (candidate master) returns HTTP 302 to a cloud.gov S3 bucket **[fetched: headers only]** — same content, no key, if you prefer a single file.

## 1.2 Google Civic Information API — Representatives is gone; Elections survives

Reference index at https://developers.google.com/civic-information/docs/v2 **[fetched]** (page footer: *"Last updated 2025-04-30 UTC"*). The reference now lists **only two resource types**:

- **Elections** — `electionQuery` (`GET /elections`) and `voterInfoQuery` (`GET /voterinfo`)
- **Divisions** — `search` (`GET /divisions`) and `divisionsByAddress` (`GET /divisionsByAddress`)

There is **no `representatives` resource in the reference at all** — `representativeInfoByAddress` and `representativeInfoByDivision` have been removed, consistent with the April 2025 shutdown. No deprecation banner survives on the docs; the endpoints are simply absent.

**Does voterInfoQuery still return 2026 general-election ballot contests by address? The documentation says yes.** From https://developers.google.com/civic-information/docs/v2/elections/voterInfoQuery **[fetched]**, verbatim: *"Looks up information relevant to a voter based on the voter's registered address… The returned information may include Polling places (including early polling sites) for a given residential street address; **Contest and candidate information**; Election official information."* The response schema includes a `contests[]` array with candidate names, parties and contact information. `electionQuery`'s resource doc notes an election's `ocdDivisionId` is *"typically a state… or for the midterms or general election the entire US (i.e. ocd-division/country:us)"* **[fetched]**.

**Caveats.** (a) I could not exercise the live endpoint — it requires a Google Cloud API key (https://developers.google.com/civic-information/docs/using_api **[fetched]**: *"A request that does not provide an OAuth 2.0 token must send an API key"*). (b) Coverage is supplied by the Voting Information Project (https://votinginfoproject.org/ **[fetched]**) via Democracy Works, whose blog post *"Continuing Our Partnership with Google for the 2026 Midterm Elections"* (https://www.democracy.works/ **[fetched]**) confirms the partnership is live for 2026. (c) Historically VIP contest data appears only in a window around each election and is patchy for down-ballot races. (d) **It is a per-address server call**, which is incompatible with the app's "nothing leaves the device" promise unless the user explicitly opts in.

**`divisionsByAddress`** (https://developers.google.com/civic-information/docs/v2/divisions/divisionsByAddress **[fetched]**) returns OCD division IDs containing an address — including `ocd-division/country:us/state:tx/cd:10`. It is the closest surviving substitute for the Representatives API for *district lookup*, but it is still a server call with a key, and it does not say whose map vintage it uses.

## 1.3 Ballotpedia — technically perfect, legally disqualifying

Docs mirror at https://developer.ballotpedia.org/ **[fetched]**, with a machine index at https://developer.ballotpedia.org/llms.txt **[fetched]**. Release notes dated 2026-05-31 and 2026-09-25 — actively maintained.

**The endpoint you would want** is `/elections_by_point` (https://developer.ballotpedia.org/geographic-apis/elections_by_point.md **[fetched]**): *"Given a latitude and longitude point and an election date, a list of candidates, ballot measures and races will be returned along with district, office, and person information… If the election date is in the future, a list of candidates and ballot measures are returned who are on the ballot in the upcoming election."* Live host is `https://api4.ballotpedia.org/data/elections_by_point?long=…&lat=…&election_date=…`. There is also a `candidate_lists_complete` boolean per election — exactly the completeness signal a pipeline needs.

**Rate limits** (https://developer.ballotpedia.org/rate-limiting.md **[fetched]**): 5 requests/second, burst 100, **200k requests/day**. Generous.

**Pricing:** not published. The docs repeatedly say *"reach out to your Ballotpedia sales contact"*; the API is sold, not granted.

**Terms of Use, quoted in full from https://developer.ballotpedia.org/dictionaries-and-terms/terms-of-use.md [fetched]:**

> "Ballotpedia content is copyrighted by Ballotpedia's editors and contributors. Licensed data sets are the proprietary and confidential property of Ballotpedia. Licensee shall take all reasonable precautions to preserve the confidentiality of Licensor's Software and Data… **No right or license is being conveyed to Licensee to use or share the full data sets provided by Ballotpedia with any other company or individual. Data may be used in Licensee's internal or external products as long as precautions are taken to protect Ballotpedia's assets by preventing bulk downloads of the data set by third parties.**"

**This rules Ballotpedia out for this app.** WhatWouldIPay is an open-source static site: the dataset *is* a file on a CDN, and the repository *is* a bulk download. A licence that requires preventing third-party bulk download cannot be satisfied by a public JSON asset in a public Git repo. Scraping `ballotpedia.org` article pages is worse: the content is copyrighted, and CloudFront returns 403 to non-browser clients anyway (confirmed on https://ballotpedia.org/Redistricting_in_2026 **[fetched: 403]**).

## 1.4 Vote Smart — alive, re-platformed, entirely behind a sales wall

- Marketing page https://votesmart.org/share/api **[fetched]**: *"Vote Smart provides detailed candidate biographies, voting records, ballot measures, **zip to district match**, interest group ratings, interest group endorsement data (add-on) and public statements (add-on)."* The only call to action is **"BOOK DEMO"**. No price, no free tier, no noncommercial key advertised.
- Live Swagger UI at https://api.paas.votesmart.io/api **[fetched]**; I recovered the full OpenAPI document from https://api.paas.votesmart.io/api/swagger-ui-init.js **[fetched]** — **115 endpoints**, `openapi: 3.0.0`, security scheme `bearer` / JWT.
- **Endpoints relevant here:** `GET /v1/candidates/by-district`, `/v1/candidates/by-election`, `/v1/candidates/by-office-state`, `/v1/candidates/by-zip`; `GET /v1/districts/by-zip`; `GET /v1/elections/{id}/stage-candidates`; **`GET /v1/npats/{id}` — "This method returns the candidates most recently filled out NPAT/PCT"**; plus `/v2/viz/pct/by-district` and `/v2/viz/pct/forms` for PCT rows across multiple years.
- **Auth confirmed required:** `GET https://api.paas.votesmart.io/v1/candidates/by-office-state?officeId=5&stateId=GA` returns `{"message":"Unauthorized","statusCode":401}` **[fetched]**.
- The old public terms-of-service pages are gone: `votesmart.org/about/terms-of-service` → 404, `votesmart.org/share/api-terms-of-service` → 403, `static.votesmart.org/static/api_tos.html` → S3 AccessDenied **[all fetched]**. Treat all Vote Smart content as all-rights-reserved unless a signed agreement says otherwise. This matches the `07-politician-photos.md` finding on their photos.

**Verdict:** the *only* structured, per-candidate, issue-position dataset that covers challengers is Vote Smart's PCT, and it is unpriced, unlicensed for redistribution, and (per `02-data-sources.md`) historically sparse for high-profile candidates. Not usable for this release.

## 1.5 unitedstates/congress-legislators and unitedstates/images — use both

| Repo | Status | Licence |
|---|---|---|
| https://github.com/unitedstates/congress-legislators **[fetched via GitHub API]** | last push **2026-09-03**, 2,434 stars | **CC0 1.0** |
| https://github.com/unitedstates/images **[fetched via GitHub API]** | last push **2026-05-27** | **CC0 1.0** |
| https://github.com/unitedstates/congress (scrapers) **[fetched via GitHub API]** | last push **2025-10-05**, not archived | **CC0 1.0** |

`legislators-current.json` (https://unitedstates.github.io/congress-legislators/legislators-current.json **[fetched]**, 1.47 MB, **539 records**) is the identity spine. Each record's `id` block carries the crosswalk the pipeline needs — verified on the first record: `bioguide`, `thomas`, **`lis`** (needed to read Senate roll-call XML), `govtrack`, `opensecrets`, **`votesmart`**, **`fec`** (array of FEC candidate IDs), `cspan`, `wikipedia`, `house_history`, **`ballotpedia`**, `maplight`, `icpsr`, `wikidata`, `google_entity_id`, `pictorial`. `terms[]` gives `type` (rep/sen), `state`, `district`, `party`, `class`, start/end dates.

**Trap:** `terms[-1].district` is the district the member was *elected from* under the 119th map. In the ten redrawn states it is **not** the district they are running in on 2026-11-03. Never join a 2026 ballot to `congress-legislators.district` without re-mapping (§2).

Photos: `https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg` returned HTTP 200, 50,343 bytes for A000370 **[fetched]**. Covers current and former members only — **no challengers**.

## 1.6 Any open dataset of 2026 nominees by district

| Source | Nominee list? | Licence | Verdict |
|---|---|---|---|
| **FEC** (§1.1) | Filers, not nominees | Public domain | Identity spine only |
| **Ballotpedia** `/elections_by_point` (§1.3) | Yes, with `candidate_lists_complete` | Proprietary/confidential | **Legally unusable here** |
| **Google Civic `voterInfoQuery`** (§1.2) | Yes, per address, in-window | Google ToS; per-request | Runtime lookup only, breaks privacy promise |
| **Democracy Works Elections API** (https://www.democracy.works/ **[fetched]**) | Yes (the VIP feed behind Google) | Commercial, unpriced | Same wall as Ballotpedia |
| **OpenElections** (https://github.com/openelections **[not fetched]**) | **No** — certified *results*, published after the election | Public domain | Wrong artefact |
| **State SOS certified candidate lists** | Yes, authoritative | Public records | 50 formats, 50 schedules, no API — a scraping project, not a dependency |
| **Wikipedia per-state House pages** | Partly (see below) | **CC BY-SA 4.0** | The only free, redistributable option |

**Wikipedia, measured.** Via the Action API (`action=parse&prop=wikitext`) on `2026 United States House of Representatives elections in <State>` **[fetched for 7 states before HTTP 429 throttling]**, district sections carry an `{{Infobox election}}` with `nominee1`/`party1`/`nominee2`/`party2`. Results:

| State | District sections | Non-empty `nomineeN` fields |
|---|---|---|
| Alabama | 7 | 14 |
| Arizona | 9 | 17 |
| Arkansas | 4 | 8 |
| Colorado | 8 | 16 |
| Connecticut | 5 | 10 |
| Florida | 28 | 55 |
| **California** | **52** | **0** |

Alaska and Delaware have no per-state page (single at-large district, covered on the national article). California returns zero because top-two produces no "nominees" — the same is true of Washington, and Louisiana's 2026 congressional elections reverted to a **jungle primary held on November 3 itself** (https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections_in_Louisiana **[fetched]**: *"It was then decided that they will be held using the jungle primary system, in which all candidates regardless of party compete on the same ballot on the date of the general election, November 3. 50% of the vote is required to win the election outright; otherwise, a runoff is scheduled for December 12."*). Alaska is RCV with four advancing candidates (https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_Alaska **[fetched]**).

**Least-effort complete-ish combination:**

```
FEC /v1/candidates (identity, party, office, state, district, incumbency, FEC ID)
  ⋈ congress-legislators (bioguide ↔ FEC ID, for incumbents)
  ⋈ Wikipedia per-state wikitext nominee1/nominee2 (who actually advanced)
  ⋈ TIGERweb layer 0 (which district number is on the 2026 ballot)
  + hand-curation for CA, WA, LA, AK (≈70 districts, ~16% of the House)
```

Nothing better exists at zero cost and a redistributable licence. Budget the hand-curation; it is not optional.

**National scale for sizing:** 435 districts plus five non-voting delegates; **33 regular Senate seats plus special elections in Ohio and Florida = 35 Senate races** (https://en.wikipedia.org/wiki/2026_United_States_Senate_elections **[fetched]**).

---

# 2. Address → district

## 2.1 The one source that has the 2026 maps: TIGERweb layer 0

`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer?f=json` **[fetched]** lists, verbatim:

```
0  120th Congressional Districts        (vintage group: BAS 2026)
4  119th Congressional Districts        (ACS 2025)
8  119th Congressional Districts        (Census 2020)
12 116th Congressional Districts
```

Layer 0 returns **444 features** with `CDSESSN = "120"` (435 districts + DC + PR + territories), Texas has 38, and GeoJSON export works (`f=geojson`; one Texas district's raw polygon is ~900 KB, so simplification is mandatory) **[all fetched]**.

**Verified point-in-polygon differences, layer 0 vs layer 4:**

| Point | 120th (2026 ballot) | 119th (current member) |
|---|---|---|
| Austin, TX | **CD 10** | CD 37 |
| Kansas City, MO | **CD 4** | CD 5 |
| Nashville, TN | **CD 6** | CD 7 |
| Baton Rouge, LA | **CD 2** | CD 6 |
| Salt Lake City, UT | CD 1 | CD 1 |
| Charlotte NC · Columbus OH · Los Angeles CA · Orlando FL · Birmingham AL · Richmond VA · Boston MA | unchanged at these points | — |

(Same-number results do not mean the map is unchanged — the *boundaries* moved in UT, NC, OH, CA, FL and AL even where the centre-city number did not.)

Endpoint form:
`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/0/query?geometry=<lon>,<lat>&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=NAME,GEOID,CDSESSN,STATE&returnGeometry=false&f=json` — free, keyless, no documented quota.

## 2.2 The US Census Geocoder does *not* return the 2026 map

- Benchmarks (https://geocoding.geo.census.gov/geocoder/benchmarks **[fetched]**): `Public_AR_Current`, `Public_AR_ACS2025`, `Public_AR_LUCA`, `Public_AR_Census2020`.
- Vintages for `Public_AR_Current` (**[fetched]**): `Current_Current`, `Census2010_Current`, `ACS2017`…`ACS2025_Current`. `Public_AR_LUCA` offers only `LUCA_Current`.
- A `geographies/onelineaddress` call with `layers=all` returns a layer literally named **`"119th Congressional Districts"`** with `CDSESSN: "119"` and a `CD119` field **[fetched, 1600 Pennsylvania Ave and a Houston coordinate]**. The full layer list contains no 120th-CD layer.
- `benchmark=Public_AR_LUCA&vintage=LUCA_Current` returned an empty geographies object **[fetched]** — not a route to the 2026 map.

**So:** the geocoder is still the right tool for **address → lat/lon** (and for address normalisation), but the district must come from **TIGERweb layer 0**. Two free calls, or one if you geocode client-side by other means.

**TIGER/Line files confirm the gap.** `https://www2.census.gov/geo/tiger/TIGER2025/CD/` **[fetched]** contains only `tl_2025_NN_cd119.zip`; there is no `TIGER2026/` directory (the URL resolves to a generic Census page, not a listing) **[fetched]**; and `https://www.census.gov/geographies/mapping-files/2026/dec/rdo/120-congressional-district-bef.html` returns **404** while the 119th equivalent returns 200 **[both fetched]**. There is no published 120th-CD block-equivalency file. **TIGERweb is the only free source of the 2026 maps.**

## 2.3 ZIP-to-district crosswalks — free, offline, and 22% wrong

`OpenSourceActivismTech/us-zipcodes-congress` (README **[fetched]**, `zccd.csv` **[fetched]**, repo listing **[fetched]**):

- `zccd.csv`: **42,033 rows**, columns `state_fips,state_abbr,zcta,cd`, 642 KB. **33,774 unique ZCTAs**; **7,299 (21.6%) map to more than one congressional district**; 109 ZCTAs span state lines.
- Built from *"the most recent 2020 Census tabulation blocks, which includes updates for the **119th Congress**"* — i.e. **it does not reflect the 2026 redraws.** Its Texas district set is 1–38 under the old lines.
- The repo also ships `zccd_hud.csv` (703 KB), derived from the HUD USPS crosswalk, *"last updated in January 2026"*. The README flags the licence: HUD's crosswalk *"is available only for government entities and non-profit organizations related to the 'stated purpose' of the HUD Sublicensing Agreement (measuring and forecasting neighborhood changes, assessing neighborhood needs, and measuring/assessing various HUD programs)."* **[fetched]** A public policy calculator is not that. **Do not ship `zccd_hud.csv`; the plain `zccd.csv` (Census-derived, public domain) is fine.**
- The README's own advice, quoted: *"If you have the ability to look up districts from a full address or zip+4, you should… 'Nearly 15 percent of all ZIP codes cross congressional district boundaries.'"*

**Building a correct 2026 ZIP crosswalk is possible but is a real GIS job:** pull all 444 CD120 polygons from TIGERweb as GeoJSON, spatially join against the 2020 ZCTA layer, and emit `zcta → [cd120…]`. Budget a day, plus a simplification step; expect the same ~22% ambiguity, because that is a property of ZIP codes, not of the data.

## 2.4 Which states redrew for 2026

From https://en.wikipedia.org/wiki/2025%E2%80%932026_United_States_redistricting **[fetched, prose + the "Overview of passed redistricting" wikitext table]**:

| Enacted | State | Advantage | Status for Nov 2026 |
|---|---|---|---|
| 2025-08-29 | **Texas** | R +5 | **In effect** — SCOTUS stayed the El Paso district-court injunction 6–3 on 2025-12-04 |
| 2025-09-28 | **Missouri** | R +1 | **Contested and unresolved** (see below) |
| 2025-10-22 | **North Carolina** | R +1 | In effect |
| 2025-10-31 | **Ohio** | R +2 | In effect (constitutionally required redraw) |
| 2025-11-04 | **California** | D +5 | In effect — Prop 50, 64.42–35.58; SCOTUS denied the CAGOP appeal 2026-02-04 |
| 2025-11-10 | **Utah** | D +1 | In effect — court-enacted |
| 2026-04-21 | ~~Virginia~~ | ~~D +4~~ | **Struck down** — Virginia Supreme Court invalidated the referendum 2026-05-08; **2026 uses the old map** |
| 2026-05-04 | **Florida** | R +4 | In effect |
| 2026-05-07 | **Tennessee** | R +1 | In effect |
| 2026-05-29 | **Louisiana** | R +1 | In effect (post-*Callais*; primary moved to Nov 3) |
| 2026-06-02 | **Alabama** | R +1 | In effect |
| | **Net** | **R +10** | |

**Missouri is live litigation as of today.** Per the same article **[fetched]**: on 2026-09-03 the Missouri Supreme Court ordered the Secretary of State to use the **old** map for November 2026; the U.S. Supreme Court declined to restore the GOP map; then *"hours later… Chief U.S. District Judge Stephen Clark of the Eastern District of Missouri issued a temporary restraining order in a separate lawsuit ordering the state to use the new GOP-drawn Congressional map."* A Bing News RSS sweep on 2026-09-10 **[fetched]** returned same-week headlines on both sides ("Supreme Court blocks GOP-preferred congressional map in Missouri"; "Missouri secretary of state avoids being held in contempt…"). **TIGERweb layer 0 currently returns the *new* GOP map for Kansas City (CD 4).** Whatever the app ships must carry a Missouri caveat and a manual override switch.

## 2.5 Privacy

The app promises nothing leaves the device. Three options, in order of preference:

1. **State + district picker.** Zero network calls, zero PII, zero wrong-district risk from ZIP ambiguity. Costs the user two taps and requires them to know their district — mitigate with a small static map image per state. **Recommended.**
2. **Offline ZIP crosswalk shipped as a static asset.** ~640 KB raw for the whole country (~150 KB gzipped), or ~10 KB per state if split. No network call, promise intact — but 21.6% of ZIPs are ambiguous, so the UI must show a disambiguation list ("your ZIP covers CD 3 and CD 14 — which is yours?"), and the crosswalk must be rebuilt against CD120.
3. **Address → Census Geocoder → TIGERweb.** Most accurate, but sends a street address to two `census.gov` endpoints. Only acceptable behind an explicit, unchecked-by-default opt-in with a plain-language notice. Do not make it the default path.

---

# 3. Positions for incumbents, from the record

## 3.1 The pipeline that works — and it needs no API key

Three keyless, public-domain sources, all verified live today:

| Source | What it gives | Verified |
|---|---|---|
| **govinfo BILLSTATUS bulk** `https://www.govinfo.gov/bulkdata/BILLSTATUS/119/{hr,s,sjres,hjres}/BILLSTATUS-119-{type}.zip` | Every bill's sponsor, **full cosponsor list with bioguide IDs and sponsorship dates**, titles, summaries, actions, and `recordedVotes` blocks with direct roll-call XML URLs | **[fetched]** — 31 MB (hr), 13 MB (s), 0.6 MB (hjres), 0.5 MB (sjres); unzipped to **16,112 bills**; parsed and indexed in under a minute |
| **House Clerk roll calls** `https://clerk.house.gov/evs/{year}/roll{NNN}.xml`, index at `.../evs/{year}/ROLL_{000,100,200,300}.asp` | Per-member votes keyed by **`<legislator name-id="A000370">` = bioguide ID**, plus party/state and full tallies | **[fetched]** — 362 votes in 2025, 295 so far in 2026 |
| **Senate roll calls** `https://www.senate.gov/legislative/LIS/roll_call_votes/vote119{session}/vote_119_{session}_{NNNNN}.xml`, menu at `.../roll_call_lists/vote_menu_119_{1,2}.xml` | Per-member votes keyed by **`<lis_member_id>`** (join via `congress-legislators` `id.lis`), question text, document title, result | **[fetched]** — 890 votes across both sessions |

**api.congress.gov v3** is the documented alternative. From https://github.com/LibraryOfCongress/api.congress.gov (README **[fetched]**): *"An API key is required for access"*; *"**The rate limit is set to 5,000 requests per hour**"*; default 20 results per page, max 250. Its OpenAPI document **[fetched]** confirms the relevant paths:

```
/bill/{congress}/{billType}/{billNumber}/cosponsors
/house-vote/{congress}/{session}/{voteNumber}/members
/member/{bioguideId}/cosponsored-legislation
/member/{bioguideId}/sponsored-legislation
/member/congress/{congress}/{stateCode}/{district}
```

**There is no `/senate-vote` path.** Senate member votes are simply not in the Congress.gov API — they must come from `senate.gov` XML. Note also the Member endpoint's own warning **[fetched]**: *"There are instances where a member has been redistricted but previously represented the district you are generating an API request for and, thus, appears in the returned data."*

`DEMO_KEY` works against api.congress.gov but at 10 requests/hour (measured `x-ratelimit-limit: 10`). **Prefer govinfo bulk + Clerk/Senate XML: no key, no quota, one download per congress, and the same underlying data.** Keep `api.congress.gov` for incremental refresh only. `unitedstates/congress` scrapers (CC0, last push 2025-10-05) do essentially this and are a fine reference implementation.

## 3.2 The evidence table — every item confirmed this session

All bill records verified from `govinfo` BILLSTATUS XML; all roll calls from Clerk/Senate XML. Cosponsor counts are as of today.

### Omnibus: OBBBA / H.R.1 (P.L. 119-21)

| Chamber | Date | Roll | Question | Tally | URL |
|---|---|---|---|---|---|
| House | **2025-05-22** | **145** | On Passage | **215–214** (1 present) | `https://clerk.house.gov/evs/2025/roll145.xml` **[fetched]** |
| House | **2025-07-03** | **190** | On Motion to Concur in the Senate Amendment | **218–214** | `https://clerk.house.gov/evs/2025/roll190.xml` **[fetched]** |
| Senate | **2025-07-01** | **372** | On Passage of the Bill | **50–50** (VP tiebreak) | `https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00372.xml` **[fetched]** |

Latest action on H.R.1: *"2025-07-04 Became Public Law No: 119-21."* **[fetched]** Roll 190 / Senate 372 are the canonical final-passage votes; use those.

**One vote, seven areas.** A Yea on H.R.1 is affirmative evidence for `incomeRates`, `standardDeduction`, `ctc`, `salt`, `tipsOvertime`, `socialSecurityBenefits` (the $6,000 senior deduction) and `medicaid` — all at the values already encoded in the `party-gop` baseline. A Nay is evidence of *opposition* and specifies no parameters; it maps to the party baseline, not to a distinct `apply()`.

### ACA enhanced premium tax credits

| Item | Detail |
|---|---|
| **Senate, 2025-12-11, Record Vote 644** | *"Motion to Invoke Cloture: Motion to Proceed to S. 3385"*, `<vote_document_text>` = *"A bill to amend the Internal Revenue Code of 1986 to extend the enhancement of the health care premium tax credit."* Result: **Cloture Motion Rejected (51-48, 3/5 majority required)**. `https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00644.xml` **[fetched]** |
| Republicans voting Yea on 644 | **Collins (ME), Hawley (MO), Murkowski (AK), Sullivan (AK)** — parsed from the XML; **confirms the existing `SRC.hawleyAcaVote` claim in `helpers.ts`** |
| Democrats voting Nay on 644 | **none** |
| **House, 2026-01-08, Roll 11** | **H.R. 1834 "Breaking the Gridlock Act", On Passage, Passed 230–196** (R 17–196, D 213–0, 5 not voting). `https://clerk.house.gov/evs/2026/roll011.xml` **[fetched]** |
| **What H.R.1834 actually does** | The engrossed text (`https://www.govinfo.gov/content/pkg/BILLS-119hr1834eh/xml/BILLS-119hr1834eh.xml` **[fetched]**) is a single section: *"Extension of enhanced premium tax credit"* — amends §36B(b)(3)(A)(iii) and §36B(c)(1)(E) IRC, striking "through 2025"/"before January 1, 2026" and inserting "through 2028"/"before January 1, 2029", effective for tax years after 2025. **A clean 3-year extension of the enhanced schedule and removal of the 400% FPL cliff.** Reached the Senate calendar (Calendar No. 319) on 2026-02-10 and has had no Senate vote **[fetched]** |
| Reached the floor via | H.Res.780 discharge petition; H.AMDT.144 substitute *"printed in the Congressional Record of November 12, 2025 is considered adopted"* **[fetched]** |
| **GOP alternative** | **H.R.6703 "Lower Health Care Premiums for All Americans Act"** (Miller-Meeks, R-IA-1), House **2025-12-17 roll 349, On Passage, Passed 216–211**; motion to recommit roll 348 failed 210–218 **[both fetched]** |
| Cosponsorship (permanent extension) | **H.R.247** Health Care Affordability Act (Underwood, D-IL-14) — **165 cosponsors**; **S.46** (Shaheen, D-NH) — **44 cosponsors** **[fetched]** |
| Cosponsorship (bipartisan extension) | **H.R.5145 Bipartisan Premium Tax Credit Extension Act** (Kiggans, **R**-VA-2) — **30 cosponsors** **[fetched]** — the best single marker of a Republican who breaks with the party on `aca` |

**Correction to the task premise:** there was no House "ACA enhanced-credit extension" bill by that name on 2026-01-08. The 230–196 vote is **H.R.1834**, whose substitute text is the credit extension. Cite it by roll number and by the engrossed bill text, not by a colloquial name.

### Child tax credit

| Bill | Sponsor | Cosponsors | Note |
|---|---|---|---|
| **H.R.2763 American Family Act** | DeLauro (D-CT-3), 2025-04-09 | **214** | House companion to S.1393; the app's `ctcAmericanFamilyAct` |
| **S.1393 American Family Act** | Bennet (D-CO), 2025-04-09 | **44** | matches `SRC.afa` |
| **H.R.353 Family First Act** | Blake Moore (R-UT-1) | 1 | per `04-positions.md` premise correction |
| **S.1382 Family First Act** | Banks (R-IN) | 0 | |

**Hawley's $5,000 CTC bill does not exist as a bill.** A full sponsor-index scan of all 5,367 Senate bills in the 119th **[fetched, local]** returns no Hawley child-credit bill of any kind. His CTC framework remains a press release only (`SRC.hawleyCtc`, 2024-12-17) — which is exactly why the app already treats it as a curated position rather than a derived one. Do not promise a congress.gov citation for it.

### Payroll / Social Security

| Bill | Sponsor | Cosponsors |
|---|---|---|
| **S.770 Social Security Expansion Act** | Sanders (I-VT), 2025-02-27 | **10** |
| **H.R.1700 Social Security Expansion Act** | Hoyle (D-OR-4), 2025-02-27 | **40** |
| **H.R.9519 Social Security 2100 Act** | Larson (D-CT-1), **2026-06-29** | **2** |
| **S.5042 Social Security 2100 Act** | Blumenthal (D-CT), **2026-07-21** | **4** |

The govinfo summary of S.770 **[fetched]** confirms the app's modelling verbatim: *"the bill extends payroll taxes on wages, salaries, and self-employment earnings to income above $250,000… The bill also increases the net investment income tax and subjects active trade or business income…"* — supporting `socialSecurityExpansionAct()` in `helpers.ts`, though the summary does not state the 16.2% figure (still on the verify list from `04-positions.md`). **Social Security 2100 was reintroduced only in mid-2026 and has almost no cosponsors** — it is a weak signal this cycle, unlike prior congresses.

### Medicare for All / single payer

| Bill | Sponsor | Cosponsors |
|---|---|---|
| **H.R.3069** | Jayapal (D-WA-7), 2025-04-29 | **114** |
| **S.1506** | Sanders (I-VT), 2025-04-29 | **17** |

### Medicaid

- **H.R.4849 "Protecting Health Care and Lowering Costs Act of 2025"** — Gray (D-CA-13), 2025-08-01, **141 cosponsors**; Senate companion **S.2556**, Schumer, 2025-07-30, **46 cosponsors** **[both fetched]**. (Note: the app's `SRC.gallegoAca` cites Gallego's press release; the bill numbers above are the citable artefacts. The exact title is "Protecting **Health Care** and Lowering Costs Act", not "Protecting Healthcare…".)
- **H.R.498 "Do No Harm in Medicaid Act"** (Crenshaw, R-TX-2) — House **2025-12-18 roll 362, On Passage, Passed**; motion to recommit roll 361 failed **[fetched]**.

### Tariffs

| Chamber | Vehicle | Date | Roll | Tally | Result |
|---|---|---|---|---|---|
| Senate | **S.J.Res.37** — terminate the Canada duties emergency (Kaine) | 2025-04-02 | **160** | **51–48** | Passed |
| Senate | **S.J.Res.49** — terminate the global tariffs emergency (Wyden) | 2025-04-30 | **225** | **49–49** | Rejected |
| Senate | **S.J.Res.81** — Brazil (Kaine) | 2025-10-28 | **594** | **52–48** | Passed |
| Senate | **S.J.Res.77** — Canada (Kaine) | 2025-10-29 | **598** | **50–46** | Passed |
| Senate | **S.J.Res.88** — global tariffs (Wyden) | 2025-10-30 | **600** | **51–47** | Passed |
| **House** | **H.J.Res.72** — *"Relating to a national emergency by the President on February 1, 2025"* (Meeks) | **2026-02-11** | **65** | Passed | Received in Senate 2026-02-12 |

All Senate rows from `vote_menu_119_1.xml` **[fetched]**; House row from the 2026 Clerk index and `BILLSTATUS-119hjres72.xml` **[fetched]**. **H.J.Res.72 is the key discovery for the House side** — before it, the House had no floor vote on the tariff emergencies and every representative's `tariffs` position would have fallen to the party default.

### SALT

- **H.R.430 SALT Deductibility Act** (Garbarino, R-NY-2) — **25 cosponsors**; **H.R.232 SALT Fairness and Marriage Penalty Elimination Act** (Lawler, R-NY-17) — 4; **H.R.246 SALT Fairness for Working Families Act** (Underwood, D-IL-14) — 1 **[all fetched]**.
- **No standalone SALT roll call in the 119th.** A regex sweep of all 657 House roll calls and all 890 Senate roll calls found none **[fetched]**. SALT evidence is cosponsorship-only, plus the H.R.1 vote.

### Tips and overtime

**H.R.5475 No Tax on Overtime for All Workers Act** (Malliotakis, R-NY-11) — 57 cosponsors; **H.R.482 No Tax on Tips Act** (Buchanan, R-FL-16) — 27; **S.129** (Cruz, R-TX) — 8; **S.1046 No Tax On Overtime Act of 2025** (Hawley) — 0; **S.4310** (Justice, R-WV) — 1; **H.R.4740** (Sykes, D-OH-13) — 1 **[all fetched]**.

### Capital gains

**H.R.5427 Billionaires Income Tax Act** (Cohen, D-TN-9) — 33; **S.2845** (Wyden, D-OR) — 22; **H.R.7767 Make Billionaires Pay Their Fair Share Act** (Khanna) — 7 **[all fetched]**.

### The two areas with nothing

- **`eitc` — zero.** A title/short-title search across all 16,112 bills in the 119th for "earned income" returns **no matches at all**, and no roll call touches the EITC. The EITC cannot be derived for any member.
- **`medicare` — effectively zero.** No eligibility-age bill, no Medicare-specific roll call in the app's sense. The nearest artefacts are drug-pricing bills (S.1818 Sanders, 7 cosponsors; H.R.1492 Murphy R-NC-3, 68) which the engine does not model. `medicare` must stay a party default.

## 3.3 Measured coverage: 9 of 14 areas for a typical incumbent

Computed over all **539** records in `legislators-current.json`, joining eight roll calls (House 2025/190, 2025/362, 2026/011, 2026/065; Senate 119-1 #372, #598, #600, #644) and 24 cosponsor lists.

| | n | mean areas | median | min | max |
|---|---|---|---|---|---|
| **House** | 439 | **9.2** | 9 | 0 | 12 |
| **Senate** | 100 | **9.4** | 9 | 0 | 12 |
| House Democrats | | 9.6 | | | |
| House Republicans | | 8.7 | | | |
| Senate Democrats | | 10.2 | | | |
| Senate Republicans | | 8.6 | | | |

Per-area coverage across all 539 members:

| Area | Members with a citable signal | % |
|---|---|---|
| `ctc` | 529 | 98.1% |
| `medicaid` | 527 | 97.8% |
| `tipsOvertime` | 524 | 97.2% |
| `salt` | 523 | 97.0% |
| `tariffs` | 523 | 97.0% |
| `incomeRates` | 522 | 96.8% |
| `standardDeduction` | 522 | 96.8% |
| `socialSecurityBenefits` | 522 | 96.8% |
| `aca` | 522 | 96.8% |
| `singlePayer` | 131 | 24.3% |
| `payroll` | 58 | 10.8% |
| `capitalGains` | 57 | 10.6% |
| **`eitc`** | **0** | **0.0%** |
| **`medicare`** | **0** | **0.0%** |

The ~97% figures are the H.R.1 / H.J.Res.72 / roll-11 / roll-362 vote rosters; the residual ~3% are members who missed the vote or joined after it (special-election winners), for whom the area falls back to the party default.

## 3.4 The honest caveat: the record rarely distinguishes a member from their party

Coverage is not the same as information. Tracking 14 distinct signals — `obbba`, `acaExt` (H.R.1834 / S.3385 cloture), `tariffTerm`, `medicaidHR498`, and cosponsorship of AFA, M4A, H.R.247/S.46, H.R.5145, H.R.430, SSEA, Billionaires Income Tax, No Tax on Tips, No Tax on Overtime, and H.R.4849/S.2556 — and comparing each member to their own party's modal profile:

| | mean deviations from own-party modal profile | median | share with **zero** deviations |
|---|---|---|---|
| **House** (n=438) | **1.14** | 1 | **45%** |
| **Senate** (n=98) | **0.73** | 0 | **56%** |

Modal profiles: a Democrat is `obbba:N, acaExt:Y, tariffTerm:Y, medicaidHR498:N`, cosponsors AFA, H.R.247/S.46 and H.R.4849/S.2556, and does *not* cosponsor M4A, SSEA, BIT, SALT repeal, tips or overtime. A Republican is `obbba:Y, acaExt:N, tariffTerm:N, medicaidHR498:Y` and cosponsors none of the above.

**The most-deviant members are exactly the frontliners** — which is where the product value actually is:

| Member | Party | Seat | Deviations | Which |
|---|---|---|---|---|
| Donald G. Davis | D | NC-1 | 6 | medicaidHR498, acaPerm, acaBipart, tips, overtime, PHCLC |
| Marie Gluesenkamp Perez | D | WA-3 | 6 | medicaidHR498, AFA, acaPerm, acaBipart, tips, PHCLC |
| Brian K. Fitzpatrick | R | PA-1 | 5 | **obbba, acaExt, tariffTerm**, acaBipart, overtime |
| Jared F. Golden | D | ME-2 | 5 | tariffTerm, AFA, acaPerm, acaBipart, PHCLC |
| Thomas H. Kean, Jr. | R | NJ-7 | 5 | acaExt, acaBipart, SALT repeal, tips, overtime |
| Josh Harder | D | CA-9 | 5 | M4A, acaPerm, acaBipart, tips, PHCLC |

**Product implication:** the derived dataset is best framed as *"how your member actually voted, with the roll call"* — a factual record with a link — and not as *"your member's platform."* For ~half of members, the derived platform is identical to the party baseline; showing it as a distinct platform would over-claim. The genuinely differentiated members are a list of roughly 60–100 people, and those are worth a hand-curated pass.

---

# 4. Challengers

Bluntly: **there is no automatable, redistributable source of policy positions for non-incumbent nominees.** Everything below was checked.

| Source | What exists | Why it fails |
|---|---|---|
| **Vote Smart Political Courage Test** | `GET /v1/npats/{id}` — *"returns the candidates most recently filled out NPAT/PCT"*; also `/v2/viz/pct/by-district` and `/v2/viz/pct/forms` **[fetched, OpenAPI]** | JWT-gated (`401 Unauthorized` on an unauthenticated call **[fetched]**); no published price; no noncommercial tier on the current site; ToS pages 403/404. `02-data-sources.md` already records that PCT coverage of high-profile figures is *"historically sparse"* — the well-documented dynamic is that competitive-race candidates are advised by consultants not to answer |
| **Ballotpedia Candidate Connection survey** | Real table with `candidate_id, election_year, state, candidate_name, office_name, question, response, response_date`; the three required questions are *"Who are you? Tell us about yourself"*, *"list below 3 key messages of your campaign"*, *"What areas of public policy are you personally passionate about"* **[fetched]** | Free-text narrative, not stances; and the licence forbids redistribution (§1.3). The required questions do not ask about any of the app's 14 areas |
| **Ballotpedia campaign themes** | `candidate_id, quote, source_url, quote_source_type (Website/Interview/Forum), source_date` — *"quotes from the candidate, often gathered from campaign websites… returned as HTML as found in the original source"* **[fetched]** | Structurally the closest thing to what the app needs, and legally unusable |
| **DCCC / NRCC issue pages** | Party-committee messaging | Committee positions, not candidate positions; no per-candidate structure; and citing a party committee for a candidate's stance is exactly the inference the app's citation lint exists to prevent |
| **Candidate websites** | ~900 sites | **No standard sitemap pattern.** No schema.org vocabulary for policy positions, no common URL convention (`/issues`, `/priorities`, `/plan`, `/on-the-issues`, or nothing at all). Extracting a numeric CTC amount from prose is an LLM job with no ground truth and no cheap verification — precisely the failure mode `02-data-sources.md` flags (a search snippet wrongly listing a Republican senator as a Medicare for All cosponsor) |
| **FEC Form 2 (Statement of Candidacy)** | Name, address, office, district, party, committee | **Nothing on issues.** Confirmed by the field list in §1.1 |

**Realistic answer: party baseline plus a small curated set for competitive races.** Concretely:

- Every challenger inherits `party-dem` or `party-gop` via the existing `inheritsFrom` mechanism, and the card carries a visible **"No voting record yet — showing the party baseline"** label plus the count of party-default positions.
- Hand-curate the ~30–40 races that decide the majority (Cook/Sabato toss-ups). That is 60–80 people at roughly the per-person cost recorded in `04-positions.md` for the 2028 field — call it 2–3 people per hour once the template exists.
- Offer a contribution path: a `docs/CONTRIBUTING-positions.md` and an issue template that requires a URL with a path (matching `dataset.test.ts`'s bare-domain check), so a volunteer's submission either passes the lint or is rejected mechanically.

**Avatars.** `unitedstates/images` covers current and former *members* only (CC0). There is no public-domain photo source for challengers, Wikipedia coverage of non-incumbent House candidates is thin, and Ballotpedia/Vote Smart photos are all-rights-reserved (already established in `07-politician-photos.md`). **Use the initials avatar** — `scripts/fetch-avatars.mjs` already implements a deterministic neutral-hue initials fallback, and the `dataset.test.ts` assertion that every `kind: 'politician'` has a `public/avatars/{id}.webp` must be relaxed or scoped to the curated 2028 set before any midterms platform lands.

---

# 5. Governors

## 5.1 Who is up

**36 states and three territories elect a governor on 2026-11-03** (https://en.wikipedia.org/wiki/2026_United_States_gubernatorial_elections **[fetched]**). The class is 18 Republicans and 18 Democrats. **22 incumbents are retiring (11 D, 10 R, 1 I); 17 are term-limited.** Republicans defend NH and VT (Harris 2024 states); Democrats defend AZ, KS, MI, PA and WI (Trump 2024 states). Dan McKee (RI) lost renomination — the first elected governor to do so since 2014.

Term-limited/retiring, from the same article **[fetched]**: **D** — CA (Newsom), CO (Polis), DC (Bowser), KS (Kelly), ME (Mills), MI (Whitmer), MN (Walz), NM (Lujan Grisham), WI (Evers), plus Guam and USVI. **R** — AL (Ivey), AK (Dunleavy), FL (DeSantis), GA (Kemp), IA (Reynolds), OH (DeWine), OK (Stitt), SC (McMaster), TN (Lee), WY (Gordon).

Note the overlap with the app's existing 2028 dataset: **five of the app's 21 curated politicians hold governorships in this class** — Newsom (CA), Whitmer (MI) and DeSantis (FL) are term-limited out, while **Shapiro (PA) and Moore (MD) are themselves on the 2026 ballot** (both elected in 2022; PA is one of the five Trump-2024 states Democrats defend). A midterms feature would sit awkwardly beside the 2028 comparison unless the two are cleanly separated in the UI — three of the app's 2028 hopefuls are running for re-election, or leaving office, on the same day.

## 5.2 What a governor changes that the engine actually models

| Lever | Modelled? | Where | Can a platform change it today? |
|---|---|---|---|
| **State income tax** | Yes — 50-state rules in `src/data/states.ts`, Tax Foundation-sourced | `computeStateTax(h, agi, gains)` at `src/engine/stateTax.ts:30` | **No.** The function reads `STATE_TAX[h.state]` only. It takes no `PolicyParams`. A governor's tax plan cannot be applied without an engine change |
| **Medicaid expansion / coverage gap** | Yes | `NON_EXPANSION_STATE_CODES` at `src/data/states.ts:344` = `['AL','FL','GA','KS','MS','SC','TN','TX','WI','WY']`; consumed at `src/engine/calculate.ts:459` | **Only globally.** `p.medicaid.nationalExpansion` flips *every* state. There is no per-state override |
| **§1115 work-requirement waivers** | Partly | `p.medicaid.workRequirements` is a federal boolean (OBBBA) | Governors administer but do not set the OBBBA requirement |
| **State EITC / CTC** | **No** | — | Not in `PolicyParams` at all |
| **State ACA subsidy wrap** | **No** | — | Not in `AcaParams`. `04-positions.md` records that only New Mexico fully replaced the enhanced credits with state funds |

**The one strong argument for governors: 9 of the app's 10 non-expansion states elect a governor in 2026.** AL, FL, GA, KS, SC, TN, TX, WI and WY are all on the ballot; only Mississippi is off-cycle (MS/LA/KY elect governors in odd years). The coverage gap the engine already models — a real, several-thousand-dollar swing for a household below 100% FPL in those states — is decided by exactly these races and by no one else on the ballot. That is a genuinely honest, genuinely household-level story the app is uniquely placed to tell.

Note also Wisconsin's asterisk, already encoded: `WAIVER_ADULT_FPL = { WI: 100 }` (`src/data/states.ts:351`) means WI has no coverage gap today, so a WI expansion promise changes the federal match, not the household's coverage.

## 5.3 Structured sources for gubernatorial positions

**None.** Vote Smart's PCT nominally covers gubernatorial candidates (`/v1/candidates/by-office-state`, `officeId` for Governor) but is sales-gated; Ballotpedia covers them under the same restrictive licence; `04-positions.md` already records that for the seven governors in the current dataset *"no federal tax positions; state records recorded as notes"* — i.e. this was hand-curated from press releases and signed legislation, one governor at a time, and it took a full research pass. There is no shortcut for 36 races.

## 5.4 Recommendation

**Do not include governors in a first midterm release.** They require (a) two engine changes — a platform-level state-tax override and a per-state expansion override — (b) a fully hand-curated dataset with no structured source, and (c) a UI that explains why a governor changes some numbers and not others. The Medicaid-expansion angle is strong enough to justify a **later, narrow** feature: "these nine governor's races decide whether your state closes the coverage gap," covering only `medicaid`, only in the nine non-expansion states, with hand-curated positions and a per-state override in the engine. That is a well-scoped Phase 3.

---

# 6. Product shape

## 6.1 Build-time pipeline (`scripts/`)

```
scripts/build-midterms.mjs
  1. Download once per run, all keyless:
       govinfo BILLSTATUS zips        119/{hr,s,sjres,hjres}     ~45 MB
       clerk.house.gov roll XML       only the rolls in WATCHLIST  ~8 files
       senate.gov roll XML            only the rolls in WATCHLIST  ~4 files
       legislators-current.json       1.5 MB                       CC0
       TIGERweb layer 0 attributes    444 rows, no geometry
  2. FEC /v1/candidates  (registered key, 24 requests at per_page=100)
  3. Wikipedia per-state wikitext (50 requests, serial, informative UA — I hit
     HTTP 429 at ~7 rapid requests, so throttle to ~1/sec)
  4. Join:  bioguide ⟷ FEC ID (congress-legislators id.fec)
            member ⟶ CD120 (TIGERweb, NOT congress-legislators.district)
  5. Emit:  public/data/midterms/{ST}.json   +  public/data/midterms/bills.json
  6. Lint:  every derived position carries a roll-call or bill URL with a path
            (same rule as dataset.test.ts); fail the build otherwise.
```

The pipeline is **deterministic and replayable** — govinfo bulk and the roll-call XML are immutable public-domain artefacts. Commit the generated JSON so the site builds without network access, exactly as `public/avatars/` is committed today.

## 6.2 Data shape — keep positions out of the per-state file

Do **not** serialise 14 position objects with prose summaries per candidate. Serialise vote codes and render from a shared table:

```jsonc
// public/data/midterms/bills.json  (shared, ~30 entries, ~10 KB)
{ "obbba": { "label": "H.R.1 (P.L. 119-21) final passage",
             "house": { "url": "https://clerk.house.gov/evs/2025/roll190.xml", "date": "2025-07-03" },
             "senate": { "url": "https://www.senate.gov/.../vote_119_1_00372.xml", "date": "2025-07-01" },
             "areas": ["incomeRates","standardDeduction","ctc","salt",
                       "tipsOvertime","socialSecurityBenefits","medicaid"],
             "yea": "Keeps the OBBBA rate structure, $2,200 CTC, $40,400 SALT cap …",
             "nay": "Voted against the 2025 tax law." } }

// public/data/midterms/GA.json
{ "state": "GA", "map": "cd120", "generated": "2026-09-10",
  "races": [
    { "office": "H", "district": 1,
      "candidates": [
        { "n": "Jim Kingston",      "p": "R", "fec": "H6GA01…", "inc": false },
        { "n": "Amanda Hollowell",  "p": "D", "fec": "H6GA01…", "inc": false } ] },
    { "office": "S", "class": 2,
      "candidates": [
        { "n": "Jon Ossoff", "p": "D", "b": "O000174", "inc": true,
          "v": { "obbba":"N", "acaExt":"Y", "tariffTerm":"Y", "afa":"-", "m4a":"-" } } ] } ]
}
```

**Sizes, from measured row widths:**

| | |
|---|---|
| Slim candidate row (identity only) | **152 bytes** measured on real FEC output |
| Candidate row + vote codes | ~200–260 bytes |
| Average state (≈9 districts × 2 + 2 Senate ≈ 20 candidates) | **~5 KB raw, ~1.5 KB gzipped** |
| California (52 × 2 + 2 = 106 candidates) | **~25 KB raw, ~6 KB gzipped** |
| **All 50 states + DC, ~905 nominees** | **~200 KB raw, ~50 KB gzipped** |
| Shared `bills.json` | ~10 KB |
| Optional ZIP→CD120 crosswalk (national) | ~640 KB raw / ~150 KB gzipped |

**The whole national dataset is smaller than one avatar sprite.** Lazy-load by state anyway (it keeps the initial bundle honest and makes staleness per-state visible), but do not architect around a size problem that does not exist.

## 6.3 Entry point

`/ballot` — **state + district picker**, defaulting the state from the household form's existing `state` field (which the user has already given the calculator, on-device). Shows:

1. **Your House race** — the incumbent (if running) with derived positions, each labelled *"Derived from a roll call — H.R.1, 2025-07-03, roll 190"* and linked; the challenger(s) with the party baseline and a "no voting record yet" label.
2. **Your Senate race** — same treatment. 35 states have one on the ballot (33 regular class-2 seats plus specials in Ohio and Florida); **no state has two**, so the UI never needs a two-Senate-race layout this cycle. The other 15 states show "no Senate race in 2026" and their two sitting senators' records as context.
3. **The two party baselines**, always, as the honest floor.
4. A per-race **"what this would do to your take-home"** number reusing the existing engine and the household already entered.

Add an "Enter my address instead" affordance behind an explicit opt-in that names the two `census.gov` endpoints it will call.

## 6.4 Labelling

Extend `Confidence` usage rather than the type: derived positions are `confidence: 'high'` with a citation whose `label` begins **"Roll call:"** or **"Cosponsor:"**, so `PositionsPanel` can badge them differently from curated ones. Party-inherited positions already render as "Party default" via `inherited` — reuse it unchanged. Never render a derived "Nay" as a policy proposal; render it as *"Voted against H.R.1"* plus the party default, which is what the existing `note()` helper already does (informational note, party default still applies).

## 6.5 Failure modes, ranked

| # | Failure | Likelihood | Mitigation |
|---|---|---|---|
| 1 | **Wrong district from ZIP** | Certain — 21.6% of ZCTAs span districts | Use a state+district picker; if ZIP is offered, always show the disambiguation list |
| 2 | **Stale map** — a crosswalk or shapefile built on the 119th | Certain if you use any published crosswalk | TIGERweb layer 0 only; assert `CDSESSN === "120"` in the build and fail otherwise |
| 3 | **Missouri** — two courts, two maps, unresolved on 2026-09-10 | Live | Per-state `mapStatus: "contested"` flag; show a banner naming both maps; manual override |
| 4 | **Jungle primary on election day (LA)** | Certain — 6 districts | Do not model LA as D-vs-R. Show all candidates, note the Dec 12 runoff |
| 5 | **Top-two (CA, WA)** — same-party general elections | Certain — up to 62 districts | The "party baseline" frame breaks entirely when both candidates are Democrats. Either hand-curate or show only the incumbent's record |
| 6 | **Alaska RCV** — four candidates advance | Certain — 1 House, 1 Senate race | Show all four; do not imply a two-way race |
| 7 | **Uncontested races** | ~30–60 House seats | Say "unopposed"; do not fabricate an opponent |
| 8 | **Independents** (e.g. King-ME) | A handful | No `inheritsFrom` target. Curate individually or omit the baseline comparison |
| 9 | **Write-ins, late withdrawals, replaced nominees** | Real — two 2026 Senate nominees were replaced (https://en.wikipedia.org/wiki/2026_United_States_Senate_elections **[fetched]**) | Weekly rebuild; date-stamp every state file; show "as of" in the UI |
| 10 | **A member's district number changes** | Certain in 10 states | Never join on `congress-legislators.district`; join on bioguide, then map by geography |

## 6.6 Legal and fairness

- **FEC data is a US Government work — public domain.** `congress-legislators`, `unitedstates/images` and `unitedstates/congress` are **CC0**. Roll-call XML from clerk.house.gov and senate.gov, and bill text from govinfo, are public domain (the govinfo bill XML carries the notice verbatim: *"Pursuant to Title 17 Section 105 of the United States Code, this file is not subject to copyright protection and is in the public domain"* **[fetched]**). TIGERweb is a Census product, public domain. **The entire recommended pipeline is public domain.**
- **Wikipedia is CC BY-SA 4.0** — attribution and share-alike. If nominee names are extracted from Wikipedia wikitext, the derived dataset arguably inherits share-alike. Get this decided before Phase 2, not after. (A defensible position: bare names of candidates are facts, not creative expression; but the *selection and arrangement* is Wikipedia's. Attribute prominently regardless.)
- **Do not use Ballotpedia or Vote Smart data** (§1.3, §1.4) — both licences are incompatible with an open-source static site.
- **Equal treatment.** Apply identical rules to both parties: same bill watchlist, same derivation code path, same "no record yet" label for every challenger, same avatar treatment. Any asymmetry — richer positions for one party because its bills have more cosponsors — must be disclosed in the methodology, as the tariff multipliers already are in `helpers.ts`.
- **No endorsement.** Carry forward the existing line from `07-politician-photos.md` ("no one depicted endorses the app") onto every candidate card, and do not use campaign photos or logos.
- **Model, not prediction.** The page shows what a candidate's *stated or voted* position would do to *this* household under the app's assumptions. Never rank, score or recommend.

---

# 7. Effort

## Phase 1 — "How your representative voted" (incumbents only) · **5–8 days**

| Task | Days |
|---|---|
| `scripts/build-midterms.mjs`: govinfo bulk download + parse, Clerk/Senate roll XML, bioguide/lis crosswalk | 1.5 |
| Watchlist definition: ~15 votes + ~24 bills → 14 areas, with `apply()` for the affirmative cases | 1.5 |
| TIGERweb CD120 join + `mapStatus` flags | 0.5 |
| `/ballot` route: state+district picker, incumbent card, Senate cards, party baselines | 2 |
| Citation lint extension + tests; relax the avatar assertion for derived platforms | 0.5 |
| Methodology copy: what "derived from a roll call" means and does not mean | 0.5 |

Ships something true and defensible with **zero** dependency on nominee data, no API keys, and no privacy compromise.

## Phase 2 — Full nominee list per district · **+8–12 days, plus a weekly burden**

| Task | Days |
|---|---|
| FEC roster ingest, dedupe, party normalisation | 1 |
| Wikipedia per-state wikitext parser (throttled; 429s at >1/sec) | 2 |
| Hand-curation and verification for CA, WA, LA, AK (~70 districts) | 3 |
| Uncontested / independent / RCV / runoff UI states | 2 |
| Curated positions for the ~30–40 toss-up races (~60–80 people) | 3 |
| Contribution path (`CONTRIBUTING-positions.md`, issue template, lint) | 1 |

Plus a **recurring weekly rebuild and eyeball** from now to 2026-11-03 — nominee replacements, withdrawals and the Missouri map are all live.

## Phase 3 — Governors · **+10 days, and engine work**

| Task | Days |
|---|---|
| Engine: platform-level state-tax override (`PolicyParams.stateTax?`), plus a per-state expansion override to replace the global `nationalExpansion` boolean | 3 |
| Hand-curated Medicaid-expansion positions for the 9 non-expansion states with 2026 governor's races (~18–25 candidates) | 3 |
| UI: explain why a governor moves some lines and not others | 2 |
| Tests, methodology, caveats | 2 |

Scope it to **Medicaid expansion in nine states**, not to 36 gubernatorial tax platforms.

## The single riskiest dependency

**The November 2026 nominee roster.** It is the only input with no free, complete, redistributable, citable source:

- FEC has 2,346 D/R filers where ~905 nominees exist, and no flag distinguishes them.
- Ballotpedia has the exact right endpoint and a licence that forbids putting the result in a public repo.
- Google Civic/VIP has it per-address, behind a key, only in-window, and only by sending the user's address to a third party.
- Wikipedia is free and CC BY-SA but yields **zero** nominees for California's 52 districts, and the nominee model does not exist at all in Louisiana (jungle primary on election day) or Alaska (RCV).

Everything else in this report — the vote derivation, the 2026 maps, the identity spine, the sizing — is solved and verified. **Phase 1 is deliberately designed to have no dependency on this roster at all**, because Phase 2 may turn out to be a hand-maintained list of ~905 names refreshed weekly by a person. If the owner is not willing to fund that, ship Phase 1 and stop.

---

## Appendix — verify before shipping

1. **Missouri map status on the day of the build.** Two courts, opposite orders, 2026-09-03. TIGERweb layer 0 currently returns the new GOP map.
2. **`H.R.1834` framing.** It is the "Breaking the Gridlock Act", a McGovern discharge vehicle; the *substance* is the §36B extension through 2028. Cite roll 11 **and** the engrossed text; do not call it by a name it does not have.
3. **The exact title is "Protecting Health Care and Lowering Costs Act"** (H.R.4849 / S.2556) — the app's `SRC.gallegoAca` label says "Healthcare".
4. **Hawley's $5,000 CTC has no bill number** in the 119th. Confirmed by a full sponsor-index scan.
5. **S.770's NIIT figure** (3.8% → 16.2%) is still unverified — the official govinfo summary says only "increases the net investment income tax". Item 2 on `04-positions.md`'s existing verify list stands.
6. **`dataset.test.ts:52`** asserts every `kind: 'politician'` has `public/avatars/{id}.webp`. Any midterms platform will break this. Scope the assertion before Phase 1 lands.
7. **Wikipedia CC BY-SA inheritance** for a nominee roster — get a decision before Phase 2.
8. **Google Civic `voterInfoQuery` live behaviour for the 2026 general** — I could not exercise it without a key. Confirm contest coverage before relying on it for anything.

---

## URL index

**[fetched]** — retrieved and read this session:
`api.open.fec.gov/developers/` · `api.open.fec.gov/swagger/` · `api.open.fec.gov/v1/candidates/` (several live queries) · `www.fec.gov/files/bulk-downloads/2026/cn26.zip` (headers) · `api.data.gov/docs/developer-manual/` · `developers.google.com/civic-information` · `.../docs/v2` · `.../docs/v2/elections` · `.../docs/v2/elections/electionQuery` · `.../docs/v2/elections/voterInfoQuery` · `.../docs/v2/divisions/divisionsByAddress` · `.../docs/using_api` · `developer.ballotpedia.org/` · `/llms.txt` · `/geographic-apis/elections_by_point.md` · `/geographic-apis/about-redistricting.md` · `/dictionaries-and-terms/terms-of-use.md` · `/dictionaries-and-terms/data-dictionary-candidate-survey-responses.md` · `/dictionaries-and-terms/data-dictionary-campaign-themes.md` · `/rate-limiting.md` · `votesmart.org/share/api` · `api.paas.votesmart.io/api` · `api.paas.votesmart.io/api/swagger-ui-init.js` · `api.paas.votesmart.io/v1/candidates/by-office-state` (401) · `api.github.com/repos/unitedstates/{congress-legislators,images,congress}` · `unitedstates.github.io/congress-legislators/legislators-current.json` · `unitedstates.github.io/images/congress/450x550/A000370.jpg` · `raw.githubusercontent.com/OpenSourceActivismTech/us-zipcodes-congress/master/{README.md,zccd.csv}` · `api.github.com/repos/OpenSourceActivismTech/us-zipcodes-congress/contents/` · `geocoding.geo.census.gov/geocoder/{benchmarks,vintages,geographies/onelineaddress,geographies/coordinates}` · `tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer` (+ layers 0 and 4 queries) · `www2.census.gov/geo/tiger/TIGER2025/{,CD/}` · `www.census.gov/geographies/mapping-files/{2025/dec/rdo/119-congressional-district-bef.html (200), 2026/dec/rdo/120-congressional-district-bef.html (404)}` · `www.govinfo.gov/bulkdata/BILLSTATUS/119/{hr,s,sjres,hjres}/*` · `www.govinfo.gov/content/pkg/BILLS-119hr1834eh/xml/BILLS-119hr1834eh.xml` · `clerk.house.gov/evs/{2025,2026}/{index.asp,ROLL_*.asp,roll011.xml,roll145.xml,roll190.xml,roll348.xml,roll349.xml,roll362.xml,roll065.xml}` · `www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_{1,2}.xml` · `www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_{00372,00598,00600,00644}.xml` · `raw.githubusercontent.com/LibraryOfCongress/api.congress.gov/main/{README.md,Documentation/*}` · `api.congress.gov/v3/bill/119/hr/1834` · `en.wikipedia.org/w/api.php` (redistricting, gubernatorial, Senate, House, per-state House, Louisiana, Alaska) · `votinginfoproject.org/` · `www.democracy.works/` · `www.bing.com/news/search?q=…&format=RSS` (redistricting sweep)

**[fetched, blocked]** — reached but unusable: `www.congress.gov/bill/119th-congress/house-bill/1834` (403 Cloudflare) · `ballotpedia.org/Redistricting_in_2026` (403 CloudFront) · `www.cbo.gov/publication/61999` (JS required) · `votesmart.org/about/terms-of-service` (404) · `votesmart.org/share/api-terms-of-service` (403) · `static.votesmart.org/static/api_tos.html` (403) · `www.govtrack.us/congress/bills/browse` (JS-only) · `justfacts.votesmart.org/candidate/political-courage-test` (blocked)

**[not fetched]** — named but not opened: `github.com/openelections` · `www.huduser.gov/portal/datasets/usps_crosswalk.html` · `www.brennancenter.org/our-work/research-reports/redistricting-litigation-roundup-0` (fetched via WebFetch but returned a partial, undated summary; not relied on — the redistricting table in §2.4 comes from the Wikipedia wikitext instead) · state secretary-of-state candidate-filing pages · DCCC/NRCC issue pages
