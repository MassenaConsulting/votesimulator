<!--
  Vote Simulator - README (English)
  Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.

  Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
  responsible for errors, inaccuracies or any consequence of using it.
  Election data: public data from the Brazilian Superior Electoral Court (TSE).
-->
# Vote Counting Simulator

> **Languages:** this README is available in English (this file) and Portuguese: [README.pt-BR.md](README.pt-BR.md). The app itself has two language flags (Brazil = pt-BR, US = en-US) in the header and in the welcome dialog.
>
> **Study project.** It was built for study purposes, although it uses real, public data obtained from the website of the Brazilian Superior Electoral Court (TSE).

Plain HTML + CSS + JS, no dependencies and no server: open `index.html` in a browser.

## Usage
1. Choose the scenario and the arrival order of the ballot boxes.
2. Enter voters, ballot boxes and turnout (or click "Use TSE totals").
3. **Shuffle** draws another random order. Click **Start**. The chart receives a batch of ballot boxes every 2 s.
4. Set the speed from 1x to 10x (slider) or use **Speed up (10x)**.
5. **Count without animation** plots all the data at once.
6. Pick the language with the flags (header or welcome dialog). The choice is remembered in the browser.
7. A welcome dialog opens every time the page loads, with the warnings and a plain-language ("explained like you are 8") description of the app and of the Senators Theory. The **About & warnings** button (header and footer) reopens it. The page behind it does not scroll while it is open.

## Scenarios
| Scenario | What it shows |
|---|---|
| Mirrored (A = B) | Parties with identical share in every box. Overlapping lines, symmetric mirrored chart. |
| Late comeback | A leads early (favorable boxes arrive first) and B overtakes at the end. |
| Statistical tie | Final gap of 0.5 p.p.; the lead alternates. |
| Real TSE data (2026 1st round, 2022 1st and 2nd rounds) | Official ballot-box bulletins, box by box. |

Arrival orders
- Synthetic: random, by region (growing bias), boxes favorable to A/B first.
- Real data (box by box; the votes never change, only the order): real arrival (`DT_BU_RECEBIDO`), random by box, by municipality, by state, by region of the country, largest/smallest municipalities first.
- Granularity: ~100, ~30 or ~10 updates. Few large updates give stepped curves.

## Project layout
```
js/analytics.js            Google Analytics 4 event tracking (clicks, settings, scroll, time on page)
index.html                 main page (header disclaimer, language selector, footer)
css/style.css              styles (light/dark theme)
assets/favicon.svg         site icon
assets/og-image.png        preview image for social networks (1200x630)
js/i18n.js                 pt-BR / en-US translations and number formatting
js/engine.js               simulation engine (synthetic scenarios, real data, Senators Theory)
js/charts.js               canvas charts (mirror, lines, tooltip)
js/app.js                  interface and simulation loop
data/ballot_boxes_president_2026_round1.js   real data, one row per ballot box (499,206 boxes)
data/ballot_boxes_president_2022_round1.js   real data (472,028 boxes)
data/ballot_boxes_president_2022_round2.js   real data (472,028 boxes)
data/aggregated_president_2026_round1.js     state x minute aggregate (used only by statistical_analysis.py)
scripts/build_ballot_boxes.py                downloads TSE zips and builds the per-box data files
scripts/build_aggregated_data.py             builds the state x minute aggregate
scripts/statistical_analysis.py              permutation tests on the arrival order
scripts/senate_analysis.py                   Senators Theory: bounds, correlations, Goodman regression, scenarios
```

## TSE data
Source: https://dadosabertos.tse.jus.br/dataset/resultados-2026-boletim-de-urna
- `scripts/build_ballot_boxes.py` downloads the zips per state (UF) and writes one file per election, one row per ballot box (used by the app):
  ```
  python scripts/build_ballot_boxes.py 2022-2 uf <temp_dir> <UF>          # one state at a time (.npz cache)
  python scripts/build_ballot_boxes.py 2022-2 merge <temp_dir> data/ballot_boxes_president_2022_round2.js
  ```
  Accepted elections: `2026-1`, `2022-1`, `2022-2` (year-round). The files are loaded on demand when a scenario is chosen.
- Data format: each file defines `window.TSE_DS["<year>-<round>"]` with metadata and a base64 + zlib binary block (state as `u8`, then `u16` columns). The metadata keys keep their original Portuguese names (`fonte`, `candidatos`, `municipios`, `colunas`, ...), because they are part of the data format.
- Senate columns per box: `s_pl`, `s_pt`, `s_out`, `s_bn` (votes for PL, PT, other parties, blank + null).
- `scripts/build_aggregated_data.py` builds the state x minute aggregate (370 KB), used only by `statistical_analysis.py`.

## Model
- Synthetic box: size varies by +-15%, 2.5% blank, 3% null, valid votes from the distribution of the box group + normal noise (largest-remainder method so that the sum is exact).
- Real box: with 499,206 boxes the result is exact; with fewer, each simulated box groups consecutive boxes of the chosen order, scaled to the voters entered. The shuffle seed is fixed (reproducible).
- Charts: cumulative % of valid votes versus % of ballot boxes counted.

## Limitations
- The arrival time comes from the `DT_BU_RECEBIDO` field (minute resolution). Ties inside the same minute are drawn at random.
- The synthetic A/B scenarios are illustrative, not predictions.
- This is a study project: results, texts and explanations may contain mistakes.

## Statistical analysis
`python scripts/statistical_analysis.py [n_perm_blocks] [n_perm_boxes]` tests whether the real trajectory ("one goes up, the other goes down") is compatible with a random arrival order (permutation by state x minute block and by ballot box), measures how much is explained by the mix of states and lists state, median arrival minute and share of each candidate.

## SEO and sharing
- `index.html` has title, description, keywords, author, robots, theme color, Open Graph / Twitter tags and JSON-LD (`WebApplication`).
- Title, description and social tags follow the selected language (pt-BR / en-US). A language can be linked directly with `?lang=pt-BR` or `?lang=en-US`.
- `<noscript>` shows a short description in both languages.
- Published at https://votesimulator.org/. `index.html` has the canonical link, `hreflang` alternates (en-US, pt-BR, x-default), `og:url` and absolute `og:image` / `twitter:image` URLs. `robots.txt` and `sitemap.xml` are at the site root.
- After publishing: verify the domain in Google Search Console and submit `https://votesimulator.org/sitemap.xml`.

## Interactive charts
Hover (or touch) any chart: a vertical line shows the ballot boxes counted, the cumulative votes and the % of each series, and the gap between the 1st and the 2nd.

## Senators Theory
Hypothesis: whoever voted for a PL senator does not vote for Lula; whoever voted for a PT senator does not vote for Bolsonaro.
- App (real scenarios 2026 and 2022, 1st round): selector "Senators Theory" with **Veto only (1st senator)**, **Team loyalty (1st senator)** and **Two-senator team (1st or 2nd)** (2026 only), plus a comparison panel and the compatibility test. The chart legend explains the selected option.
- `python scripts/senate_analysis.py`: bounds, correlations between boxes, Goodman regression and the three scenarios.
- Groups follow the party of the senate candidate (PL, PT); other parties = "Others".
- 2026: each voter casts 2 votes for Senator and the bulletin sums both. The 1st vote is approximated by half of the party's votes. 2022: single vote (exact).
- Central limit: the bulletin is aggregated per ballot box. The pair (senator vote, president vote) of each voter does not exist, so the theory can only be tested through bounds and ecological inference.
- **Two-senator team (1st or 2nd)** (2026, 2 votes per voter): any PL (without PT) = Bolsonaro; any PT (without PL) = Lula; one PL and one PT = Undecided (own series); neither = Other. Inside each box the 2 votes are treated as independent: P(PL only) = 1-(1-pl)^2-2*pl*pt; P(PT only) = 1-(1-pt)^2-2*pl*pt; P(both) = 2*pl*pt.
- 2026 result: PL 34.8% - PT 14.3% - Undecided 4.7% - Other 46.2%.

## Notice and rights
Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.

This is a study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not responsible for errors, inaccuracies or any consequence of using it. The election data are public and come from the Brazilian Superior Electoral Court (TSE); this project is not affiliated with or endorsed by the TSE.
