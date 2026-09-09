# Monetization research (2026-09-08)

Full findings from an Opus research pass on open-sourcing the app plus a paid PolicyEngine-backed tier. Not legal advice; mainstream readings with primary sources. Items marked UNVERIFIED could not be confirmed from a primary source.

## 1. AGPL §13 and a paid web app
- §13 triggers only "if you modify the Program." Running the unmodified `policyengine-household-api` container and talking to it over HTTP is, under the FSF's own separate-programs test (sockets/pipes = separate programs; in-process function calls sharing data structures = one program), the safe configuration. https://www.gnu.org/licenses/agpl-3.0.en.html · https://www.gnu.org/licenses/gpl-faq.html#MereAggregation · https://www.gnu.org/licenses/gpl-faq.html#GPLPlugins
- Risky configuration: `import policyengine_us` in-process in your own Python service.
- No case law resolves AGPL scope (Neo4j v. PureThink decided nothing on the license). https://sfconservancy.org/blog/2022/mar/30/neo4j-v-purethink-open-source-affero-gpl/
- PolicyEngine's own reading: hosted API use "does not itself trigger AGPL source-code disclosure"; Docker/Python paths are self-hosted AGPL software. https://github.com/PolicyEngine/household-api-docs/pull/12
- Open-sourcing the app makes the question moot.

## 2. Charging for a service built on AGPL software
- Allowed outright (GPL FAQ #DoesTheGPLAllowMoney; OSD §6). One limit: the AGPL binary itself may not stop working on non-payment (GPL FAQ #SubscriptionFee). Gate your hosted service and saved data, never the engine.
- Respected model = all code open, hosted convenience paid: Plausible (AGPL, cloud-only revenue), Ghost (MIT, $11.1M ARR from paid hosting, nonprofit foundation), Nextcloud, Mastodon. Open core (Grafana Enterprise, Cal.com EE) is common but contested (see the `calcom/cal.diy` fork).

## 3. PolicyEngine terms and pricing
- No published pricing anywhere; a pricing page was planned in Dec 2024 and never shipped (policyengine-app issue #2267). Access is by email with OAuth credentials; terms reference Order Forms, fees, 10% SLA credits, implying negotiated contracts.
- Terms (https://policyengine.org/us/api/terms): license is non-exclusive, non-transferable, revocable, "solely to build or operate software or services that compute or analyze public-policy outcomes." §3.1: do not submit names, street addresses, SSNs or other direct identifiers. §5.1: API use does not trigger AGPL; self-hosting does. No attribution clause; no explicit resale clause.
- Contracting entity is PolicyEngine, Inc.; nonprofit project is fiscally sponsored by PSL Foundation. Revenue is grants and commissioned work (MyFriendBen $300k, Arnold Ventures $273k, NSF $300k, Imagine LA $97k, CRFB $35k). https://policyengine.org/us/supporters
- A partner program exists (partner contract tests for amplifi, impactica, my_friend_ben in policyengine-us).
- Legacy `https://api.policyengine.org/us/calculate` answers unauthenticated but is per-IP throttled; do not build a paid product on it.

## 4. How self-hosted data updates
- `policyengine-us` on PyPI: 60–120 releases/month (Jul 2026: 124), fully automated semver from towncrier fragments, real CHANGELOG.md. Parameters are hand-curated dated YAML (e.g. `gov/hhs/fpg.yaml`: 2026-01-01: 15_960) merged by staff PRs.
- Docker image `ghcr.io/policyengine/policyengine-household-api`: tags `current`, `frontier`, `us-<version>`. Bumped by a weekly Tuesday bot PR with human review and a production gate, so it lags PyPI by up to a week. ~4 GB RAM. Nothing auto-updates; you `docker pull`.
- Reforms are exportable by ID: `GET https://api.policyengine.org/us/policy/<id>` returns `policy_json` that drops into the household API's `policy` field. Candidate platforms can be stored as PolicyEngine reform objects in git.
- `GET /us/metadata` is 71.5 MB; cache it.

## 5. Community norms on paid civic tools
- Peers that charge: Ballotpedia (paid data/API, unpublished pricing), Vote Smart (paid API), GovTrack (LLC; ads + $5–$100/yr voluntary ad-free tier framed as "keep it free for everyone"), OpenSecrets (OS Pro paid tier with a public sustainability justification), Silver Bulletin (election model paywalled, methodology free).
- Documented backlash attaches to deception (TurboTax hiding Free File; FTC suit; $141M settlement), killing free services (538 shutdown), or perceived bias, not to cheap paid tiers. The one articulated norm: don't paywall output built primarily on public records (Freedom of the Press Foundation; Wired 2025).
- Civic tech's own literature (Knight/Rita Allen, Scaling Civic Tech) frames the problem as sustainability, not purity.

## 6. Alternative revenue
- Donations: GitHub Sponsors 0% platform fee (personal); Ko-fi 5%; Liberapay 0% + Stripe; Open Collective $0 for collectives.
- Fiscal sponsors after OCF's 2024 dissolution: Open Source Collective 10% (501(c)(6), needs org-owned repo), Hack Club HCB 7% (501(c)(3)), SFC 10%, SPI 5%, Code for Science & Society 15%. 501(c)(3) hosts will scrutinize a tool that names presidential candidates.
- Grants: Knight, Democracy Fund, Sloan, Ford, Omidyar do not take unsolicited proposals or fund individuals. NSF PESOSE (NSF 26-506) Track 1 up to $300k, deadlines 2027-03-02 and 2027-09-07, organizations only.
- Newsroom licensing of calculators is not a market; newsrooms cite free models. Commissioned institutional work is where the money is.
- Tax-software affiliate revenue: legal (FTC 16 CFR 255 disclosure) but trades neutrality for four figures. Skip.

## 7. Unit economics
- Stripe US: 2.9% + $0.30, plus 0.7% Stripe Billing. $3/mo nets $2.59 (13.6% fees); $5/mo nets $4.52 (9.6%). Paddle/Lemon Squeezy 5% + $0.50; Paddle won't quote sub-$10 products on standard terms.
- Hosting always-on 2 vCPU/4 GB: DigitalOcean $24, Fly.io ~$22, Fargate ~$58–72, Cloud Run ~$110. PolicyEngine's own prod: 1 vCPU/4 GiB workers, scale to zero.
- Measured latency (public v1): cold ~5.9s, cached identical ~0.25s, distinct households ~1.0–1.1s each.
- Break-even on a $24 droplet: 6 subscribers at $5. 100 subscribers ≈ $450/mo net; 1,000 ≈ $54k/yr gross at $5.

## Options
A. Open-source everything, free, GitHub Sponsors + GovTrack-style voluntary support. Zero legal/reputational risk; tiny revenue; best odds of commissioned work later.
B. Open-source everything, hosted Pro at $5/mo (not $3) for convenience only: unlimited PolicyEngine runs, saved households, state detail, exports. Free tier must fully answer the core question. Never gate the engine binary; never send identifiers to PolicyEngine.
C. Free forever; pursue partnerships/commissioned work via a fiscal sponsor; NSF PESOSE 2027 if an org exists.

Regardless: email hello@policyengine.org; pin an exact `us-<version>` Docker tag.
