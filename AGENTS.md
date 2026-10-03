# AGENTS.md

Betting jackpot dataset: historical football (soccer) jackpot events scraped from three
Kenyan/European bookmakers — Betika, Mozzart and SportPesa. The repo is data first: raw CSVs, a
normalised JSON mirror under `data/processed/`, and one generator script. There is no build system
or dependency manifest yet.

## Repository layout

```
AGENTS.md
.gitignore
data/raw/betika/     4 CSVs   — grand, mega, midweek, must-be-won jackpots
data/raw/mozzart/    6 CSVs   — super-jackpot (1 file + numbered variants), super-grand-jackpot
data/raw/sportpesa/  2 files  — mega-jackpot-pro as CSV and as the original nested JSON
data/processed/      JSON mirror of the raw CSVs, same bookmaker folders and filenames
src/build_json.py    regenerates data/processed from data/raw
```

`data/raw/` holds the scrape output as collected and is **read-only**: never edit these files in
place. Derived tables go under `data/processed/`, code under `src/`.

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

## Data quirks (verify before computing anything)

- Line endings differ by file (mostly CRLF; `mozzart-super-grand-jackpot.csv` and both sportpesa
  files are LF) and `result` values can carry a trailing `\r`. Use `csv.DictReader` with
  `newline=''`, never naive `split(',')`.
- Encodings are mixed UTF-8 / plain ASCII across files; always open with `encoding='utf-8'`.
- `mozzart-super-jackpot4.csv` contains ~32 literal `No date found` values in `date`.
- Coverage overlaps between files within a bookmaker (e.g. `mozzart-super-jackpot*.csv` are
  consecutive extracts, not distinct products). Dedupe on `(date, home_team, away_team)` before
  aggregating.
- Normalise the two schemes into one canonical shape (lowercase snake_case columns, ISO dates,
  consistent `score` separator, consistent result casing) before cross-bookmaker analysis.

## Conventions

- Python 3.14 is available at `/opt/homebrew/bin/python3`; **`uv` is the entry point** for any
  script or one-off analysis: `uv run python <script>.py`, ad-hoc via `uv run python - <<'EOF'`.
  Add dependencies with `uv add` rather than hand-writing a `requirements.txt`.
- The project path contains a space (`betting data`). Quote paths in every shell command.
- Probe HTTP/API endpoints with `uv run python` + `requests`, never `curl`.
- Read from `data/raw/`, write to `data/processed/`. The raw CSVs are inputs only.
- Analysis scripts should be reproducible from files alone — no network calls for data already in
  the repo.

## Git

Repository is initialised locally with `main` as the default branch. Commit or push only when
explicitly asked. The betika/mozzart CSVs originally carried `bet_type` and `pick`; those versions
are in the initial commit if the columns are ever needed again.
