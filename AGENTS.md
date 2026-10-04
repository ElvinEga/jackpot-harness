# AGENTS.md

Betting jackpot dataset: historical football (soccer) jackpot events scraped from three
Kenyan/European bookmakers — Betika, Mozzart and SportPesa, plus per-season league fixtures from
Football-Data.co.uk under `data/seasons/`. The repo is data first: raw CSVs, a normalised JSON
mirror under `data/processed/`, and two generator scripts in `src/`. A React + Vite dashboard SPA
in `src/` consumes the processed JSON.

## Repository layout

```
AGENTS.md
.gitignore
data/raw/betika/     4 CSVs   — grand, mega, midweek, must-be-won jackpots
data/raw/mozzart/    6 CSVs   — super-jackpot (1 file + numbered variants), super-grand-jackpot
data/raw/sportpesa/  2 files  — mega-jackpot-pro as CSV and as the original nested JSON
data/seasons/premier_league/  6 CSVs (2021-2022 … 2026-2027) + notes.txt (source's own column key)
data/seasons/laliga_primera/  6 CSVs (same seasons) — same column vocabulary, division code SP1
data/seasons/bundesliga_1/    6 CSVs (same seasons) — division code D1, 306 matches per season
data/seasons/serie_a/         6 CSVs (same seasons) — division code I1, 380 matches per season
data/seasons/le_championnat/  6 CSVs (same seasons) — division code F1, 380 then 306 per season
data/seasons/eredivisie/      6 CSVs (same seasons) — division code N1, 306 matches per season
data/seasons/liga_1/          6 CSVs (same seasons) — division code P1, 306 matches per season
data/seasons/jupiter_league/  6 CSVs (same seasons) — division code B1, 306/312 per season
data/processed/      JSON mirror of the raw CSVs, same bookmaker folders and filenames
data/processed/seasons/<competition>/  one JSON per season + index.json
src/build_json.py    regenerates data/processed from data/raw
src/build_seasons.py regenerates data/processed/seasons from data/seasons
```

`data/raw/` holds the scrape output as collected and is **read-only**: never edit these files in
place. `data/seasons/` is likewise collected input (untouched CSVs) — its JSON output lives under
`data/processed/seasons/`. Derived tables go under `data/processed/`, code under `src/`.

Within `data/raw/`, each subdirectory is one bookmaker and each file inside is one jackpot product.
Filenames use lowercase bookmaker + hyphenated jackpot name (`betika-midweek-jackpot.csv`).

## Schemas

**`data/raw/betika/*` and most of `data/raw/mozzart/*`** — 7 columns, one match per row:
`date,home_team,away_team,league,score,odds,result`

| field | notes |
|---|---|
| `date` | `DD-MM-YYYY` |
| `score` | `H-A` (e.g. `0-3`); `Postp` / `Abn` when postponed or abandoned |
| `odds` | decimal odds as text, 2dp |
| `result` | `home`, `draw`, `away`, `postponed`, `abandoned`, occasionally `unknown` |
| `league` | `Country – League name` with an **en dash**, frequently blank |

The market type (`bet_type`: FT 1X2 vs DC double chance) and the tipster selection (`pick`: `1`,
`X`, `2`, `12`, `1X`, `X2`) are **not present**. Consequently `odds` cannot be interpreted on its
own — a 1.35 may be a full-time away win or the equivalent double-chance price, and rows from the
two markets are interleaved. Do not treat `odds` as a single homogeneous market or compute
calibration/implied-probability statistics across it without splitting by price band.

**`data/raw/sportpesa/*`** — 6 columns, PascalCase headers, ISO timestamps, `H:A` scores,
`Home/Draw/Away` results, plus `JackpotId` grouping rows into individual jackpots. The JSON is the
same data nested as `{Date, JackpotId, Events: [{Home, Away, Score, Result}]}` — prefer CSV for
analysis.

## Derived JSON

`uv run python src/build_json.py` regenerates `data/processed/<bookmaker>/<same-stem>.json` from
`data/raw/`. Each file is a flat JSON array of one object per match row, 42898 records in total:

```json
{
  "date": "2023-02-19",
  "home_team": "Sandhausen",
  "away_team": "Karlsruher",
  "league": null,
  "score": "0-3",
  "odds": 1.35,
  "result": "away"
}
```

Conversions the generator applies, all lossless apart from the last:
- SportPesa headers are renamed to the shared snake_case vocabulary (`JackpotId` to `jackpot_id`,
  `Home` to `home_team`), so every file has one key set; `result` is lowercased throughout.
- `date` becomes ISO `YYYY-MM-DD` (raw betika/mozzart is `DD-MM-YYYY`, SportPesa an ISO timestamp).
- `odds` and `jackpot_id` become numbers; `score` uses `-` (`0:1` becomes `0-1`).
- Empty strings, unparseable dates and non-numeric odds become `null`. 865 rows of
  `mozzart-super-jackpot2.csv` have a score duplicated into `odds` and therefore null odds, three
  other rows carry typo prices (`1..35`, `.1.35`), and the 32 `No date found` rows of
  `mozzart-super-jackpot4.csv` get a null date. Values are never guessed or repaired.

## Season data (Football-Data.co.uk)

`data/seasons/<competition>/<season>.csv` holds per-match league fixtures with 105–131 wide,
PascalCase/abbreviated columns. The source's own column key is `data/seasons/notes.txt` — read it
rather than guessing an abbreviation. Every raw column header and cell is preserved verbatim in the
CSVs; nothing is renamed or repaired there.

`uv run python src/build_seasons.py` (also `bun run build:seasons`) regenerates
`data/processed/seasons/<competition>/` from those CSVs: one JSON array per season file plus an
`index.json`. These files are **separate from the jackpot data** — served by the Vite middleware at
`/data/seasons/premier_league/<season>.json` exactly like the jackpot mirror is at
`/data/<bookmaker>/`.

13953 matches in total across the eight competitions (380 per completed season for EPL, La Liga and
Serie A, 306 for Bundesliga, Eredivisie and `liga_1`; Ligue 1 has 380 for 2021-2022 and 2022-2023
then 306 from 2023-2024, when it dropped to 18 clubs; `jupiter_league` has 306 for 2021-2022 and
2022-2023, 312, 312 and 311 for the three seasons it ran 16 clubs plus playoffs, then 18 clubs
again). The in-progress 2026-2027 files hold 50 EPL, 69 La Liga, 36 Bundesliga, 50 Serie A, 45 Ligue
1, 63 Eredivisie, 62 Portugal and 63 Belgium matches. One object per match, sorted by
`(date, home_team)`; the ~100 source columns are reduced to 19 fields with the variable parts
grouped:

```json
{
  "season": "2021-2022", "date": "2021-08-13", "kickoff_time": "20:00",
  "home_team": "Brentford", "away_team": "Arsenal",
  "division": "E0", "league": "England – Premier League",
  "score": "2-0", "home_goals": 2, "away_goals": 0, "total_goals": 2, "result": "home",
  "half_time_score": "1-0", "half_time_home_goals": 1, "half_time_away_goals": 0,
  "half_time_result": "home", "referee": "M Oliver",
  "stats": { "home_xg": null, "home_shots": 8, "away_corners": 5, "home_yellow": 0 },
  "odds":  { "home": 4.02, "draw": 3.43, "away": 2.02, "home_close": 3.89,
             "over_2_5": 2.16, "handicap": 0.5, "handicap_home": 1.87 }
}
```

What the generator does:
- Core field names are flattened to the jackpot vocabulary (`FTHG`/`FTAG`/`FTR` →
  `home_goals`/`away_goals`/`result`, `H`/`D`/`A` → `home`/`draw`/`away`), so season rows are
  drop-in comparable with `Match` rows. `league` is filled from `division` with the exact string the
  jackpot CSVs use (en dash included): `E0` → `England – Premier League`, `SP1` → `Spain – La Liga`,
  `D1` → `Germany – Bundesliga`, `I1` → `Italy – Serie A`, `F1` → `France – Ligue 1`, `N1` →
  `Netherlands – Eredivisie`, `P1` → `Portugal – Primeira Liga`, `B1` → `Belgium – Jupiler Pro
  League`. Folder names are not those strings and are easy to cross-match: `liga_1` is **Portugal**,
  `le_championnat` is France, and `jupiter_league` misspells Jupiler.
- Dates `dd/mm/yyyy` → ISO. `season` is derived from the kickoff month (July onwards belongs to the
  season starting that year), and `index.json` labels each file with the season its rows actually
  carry — so a file whose name disagrees with its contents shows up there rather than being hidden.
- **Only market-average and market-maximum prices are kept.** The individual bookmaker columns
  (`B365*`, `PS*`, `WH*`, `BW*`, `IW*`, `BFE*`, …) are dropped: which firms appear changes between
  seasons, so they cannot be compared across files. `odds.home/draw/away` is `AvgH/AvgD/AvgA`
  (pre-closing market average), `*_max` is `Max*`, `*_close` is `AvgC*`; `over_2_5`/`under_2_5` and
  `handicap*` likewise come from the `Avg*`/`Max*`/`AvgC*` columns, with `handicap` the `AHh` line.
- Keys are emitted per competition from the columns actually present, and are then the same for
  every season file within that competition (`home_xg`/`away_xg` exist only from 2026-2027, so the
  earlier seasons carry them as `null`). `referee` is omitted entirely for competitions that have no
  `Referee` column — only the Premier League has one, so the other seven competitions' rows have 18
  fields instead of 19. Missing cells become `null`, never guessed.
- The source data is near-complete: every row has a full-time result, and half-time is missing on
  six rows only — one Bundesliga fixture (Union Berlin v Bochum, 2024-12-14) and five in
  `jupiter_league`, every one of them a 5-0 or 0-5 scoreline, the shape an awarded fixture takes
  here. On all six, every stat is `null` too. Scattered odds cells are blank (0–7% per file, and not
  one in `le_championnat`, `liga_1`, La Liga or the Eredivisie bar the one blanked row below).

## Data quirks (verify before computing anything)

- Line endings differ by file (mostly CRLF; `mozzart-super-grand-jackpot.csv` and both sportpesa
  files are LF) and `result` values can carry a trailing `\r`. Use `csv.DictReader` with
  `newline=''`, never naive `split(',')`.
- The season CSVs are all CRLF and most carry a UTF-8 **BOM** before `Div` (EPL: 2021-2022,
  2024-2025, 2025-2026, 2026-2027; every other competition: its last three seasons). Open them with
  `encoding='utf-8-sig'` or the first column becomes `'\ufeffDiv'`.
- One scrape defect was blanked at source: the Utrecht v Go Ahead Eagles row (08/09/2026) of
  `data/seasons/eredivisie/2026-2027.csv` carried a corrupted odds block — a negative under-2.5
  price, all five `Max*` below their `Avg*`, and `AHh` holding a price. Its 85 populated odds cells
  are now empty, so that match has null odds in the JSON; its score, half-time and stats are intact.
  Every other odds row in the season set satisfies Max >= Avg with all prices above 1.
- Encodings are mixed UTF-8 / plain ASCII across files; always open with `encoding='utf-8'`.
- `mozzart-super-jackpot4.csv` contains ~32 literal `No date found` values in `date`.
- Coverage overlaps between files within a bookmaker (e.g. `mozzart-super-jackpot*.csv` are
  consecutive extracts, not distinct products). Dedupe on `(date, home_team, away_team)` before
  aggregating.
- **`mozzart-super-jackpot.json` through `mozzart-super-jackpot5.json` are ONE mozzart
  super jackpot product** (`mozzart-super-grand-jackpot.json` is a separate product). Treat
  them as a single dataset: concatenate and dedupe on `(date, home_team, away_team)`, never
  analyse them as separate jackpots.
- Normalise the two schemes into one canonical shape (lowercase snake_case columns, ISO dates,
  consistent `score` separator, consistent result casing) before cross-bookmaker analysis.

## Conventions

- Python 3.14 is available at `/opt/homebrew/bin/python3`; **`uv` is the entry point** for any
  script or one-off analysis: `uv run python <script>.py`, ad-hoc via `uv run python - <<'EOF'`.
  Add dependencies with `uv add` rather than hand-writing a `requirements.txt`.
- The project path contains a space (`betting data`). Quote paths in every shell command.
- Probe HTTP/API endpoints with `uv run python` + `requests`, never `curl`.
- Read from `data/raw/` and `data/seasons/`, write to `data/processed/`. The input CSVs are inputs
  only; `data/processed/seasons/` is kept apart from the jackpot mirror so the two never mix.
- Analysis scripts should be reproducible from files alone — no network calls for data already in
  the repo.

## Git

Repository is initialised locally with `main` as the default branch. Commit or push only when
explicitly asked. The betika/mozzart CSVs originally carried `bet_type` and `pick`; those versions
are in the initial commit if the columns are ever needed again.
