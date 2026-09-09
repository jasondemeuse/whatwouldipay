# Politician headshot sources (2026-09-08)

Opus research pass, ~40 direct fetches. Bottom line: 18 of 20 people have public-domain portraits with no attribution needed; Josh Shapiro (CC BY 4.0) and Wes Moore (CC BY-SA 4.0, or a CC BY 4.0 event photo) require credit lines. Commit cropped WebP files to the repo; do not hotlink.

## Key findings
- `theunitedstates.io` no longer resolves (ECONNREFUSED; no CNAME on gh-pages). Use `https://unitedstates.github.io/images/congress/{original|450x550|225x275}/{bioguide}.jpg` or raw.githubusercontent.com. Repo https://github.com/unitedstates/images is CC0, actively maintained (pushed 2026-05-27), covers current AND former members.
- Federal works are public domain (17 U.S.C. § 105). State works are not, except California and Florida (and Georgia) which put most state works in the public domain. https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_territory/United_States
- White House portraits are PD but the WH asks that photos not be manipulated or used to suggest endorsement (policy, not copyright). Crop conservatively; state that no one depicted endorses the app.
- Wikidata P18 is a discovery tool, not a license filter (it pointed at CC BY photos for Sanders and Pritzker when PD ones exist). Always resolve the license via the Commons imageinfo API (`extmetadata.AttributionRequired`).
- Wikimedia requires an informative User-Agent with contact info; requests in series; hotlinking discouraged and thumbnails snap to size buckets.
- Ballotpedia and Vote Smart photos: terms unreachable/blocked; treat as all-rights-reserved. Open States has no governor photos.

## Per-person sources
| Person | Source | License | Credit? |
|---|---|---|---|
| JD Vance | Commons: March 2026 Official Vice Presidential Portrait of JD Vance.jpg (alt bioguide V000137) | PD-USGov | No |
| Marco Rubio | Commons: Official portrait of Secretary Marco Rubio.jpg (alt R000595) | PD-US-DOS | No |
| Ron DeSantis | Commons: Ron DeSantis 3x4 portrait.jpg (avoid 2013 House photo D000621) | PD-FLGov | No |
| Ted Cruz | unitedstates/images C001098 | PD-USGov | No |
| Rand Paul | unitedstates/images P000603 | PD-USGov | No |
| Josh Hawley | unitedstates/images H001089 | PD-USGov | No |
| Nikki Haley | Commons: Nikki Haley official photo.jpg (UN ambassador era) | PD-USGov | No |
| Alexandria Ocasio-Cortez | unitedstates/images O000172 | PD-USGov | No |
| Jon Ossoff | unitedstates/images O000174 | PD-USGov | No |
| Gavin Newsom | Commons: Governor of California Gavin Newsom (cropped 3x4).jpg | PD-CAGov | No |
| Kamala Harris | Commons: Kamala Harris Vice Presidential Portrait.jpg (alt H001075) | PD-USGov | No |
| Josh Shapiro | Commons: Josh Shapiro December 2025 (cropped).jpg | CC BY 4.0 | Yes |
| Pete Buttigieg | Commons: Pete Buttigieg, Secretary of Transportation.jpg | PD-USGov (USDOT) | No |
| Gretchen Whitmer | Commons: 2025 Gretchen Whitmer (cropped).jpg (federal photographer) | PD | No |
| JB Pritzker | Commons: Governor JB Pritzker official portrait 2019 (crop).jpg (IL National Guard) | PD-USGov | No |
| Andy Beshear | Commons: Kentucky Air Guard supports governor's inauguration (1) (cropped).jpg (DVIDS) | PD-USGov | No |
| Wes Moore | Commons: Wes Moore Official Governor Portrait.jpg (CC BY-SA 4.0) or Wes Moore at the Education Policy and Investments Press Conference 2026 12.jpg (CC BY 4.0) | CC BY-SA / CC BY | Yes |
| Cory Booker | unitedstates/images B001288 | PD-USGov | No |
| Ruben Gallego | unitedstates/images G000574 (use original/450x550) | PD-USGov | No |
| Bernie Sanders | unitedstates/images S000033 | PD-USGov | No |

## Credit lines required
- Josh Shapiro: Photo by Maryland GovPics, cropped. CC BY 4.0. Source: Commons file page.
- Wes Moore: Official Governor Portrait by Maryland State Government, cropped. CC BY-SA 4.0; the cropped derivative is likewise CC BY-SA 4.0. Source: Commons file page.
A square crop is an adaptation: CC BY requires noting changes; CC BY-SA requires the cropped file itself be CC BY-SA. README must note the mixed-license avatars.

## Implementation plan
1. Initials avatar first (deterministic neutral hue, not party colors) as the load/404 fallback.
2. `scripts/fetch-avatars.mjs`: sources.json → fetch originals (congress CDN or Commons FilePath) with a proper User-Agent, serially; batch Commons imageinfo call for license metadata; hard-fail if AttributionRequired and not in CREDITS.json; crop from the top third (y ≈ 0.06 × H), resize 256×256 WebP q≈82 (plus 64×64 for chips); write CREDITS.json from fetched metadata.
3. Commit `public/avatars/*.webp` (~300 KB total) and `CREDITS.md`; render credits on a /credits page and as a small info popover on cards.
