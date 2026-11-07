# AGENTS.md

Betting jackpot dataset: historical football (soccer) jackpot events scraped from three
Kenyan/European bookmakers — Betika, Mozzart and SportPesa, plus per-season league fixtures from
Football-Data.co.uk under `data/seasons/`. The repo is data first: raw CSVs, a normalised JSON
mirror under `data/processed/`, and five generator scripts in `src/`. A React + Vite dashboard SPA
in `src/` consumes the processed JSON.

## Repository layout

```
AGENTS.md
.gitignore
data/raw/betika/     4 CSVs   — grand, mega, midweek, must-be-won jackpots
data/raw/mozzart/    6 CSVs   — super-jackpot (1 file + numbered variants), super-grand-jackpot
data/raw/sportpesa/  2 files  — mega-jackpot-pro as CSV and as the original nested JSON
data/seasons/premier_league/  6 CSVs (2021-2022 … 2026-2027) + notes.txt (source's own column key)
data/seasons/efl_championship/ 6 CSVs (same seasons) — division code E1, 552 matches per season
data/seasons/laliga_primera/  6 CSVs (same seasons) — same column vocabulary, division code SP1
data/seasons/laliga_segunda/  6 CSVs (same seasons) — division code SP2, 462 matches per season
data/seasons/bundesliga_1/    6 CSVs (same seasons) — division code D1, 306 matches per season
data/seasons/bundesliga_2/    6 CSVs (same seasons) — division code D2, 306 matches per season
data/seasons/serie_a/         6 CSVs (same seasons) — division code I1, 380 matches per season
data/seasons/serie_b/         6 CSVs (same seasons) — division code I2, 380 matches per season
data/seasons/le_championnat/  6 CSVs (same seasons) — division code F1, 380 then 306 per season
data/seasons/ligue_2/         6 CSVs (same seasons) — division code F2, 380/379 then 306 per season
data/seasons/eredivisie/      6 CSVs (same seasons) — division code N1, 306 matches per season
data/seasons/liga_1/          6 CSVs (same seasons) — division code P1, 306 matches per season
data/seasons/jupiter_league/  6 CSVs (same seasons) — division code B1, 306/312 per season
data/seasons/sco_premier_league/ 6 CSVs (same seasons) — division code SC0, 228 per season
data/seasons/sco_championship/ 6 CSVs (same seasons) — division code SC1, 180 per season
data/seasons/ligi_1/          6 CSVs (same seasons) — division code T1 (Turkey), 380/342/306
data/seasons/ethniki_katigoria/ 6 CSVs (same seasons) — division code G1 (Greece), 240/233/236
data/seasons/fixtures.csv   the site's rolling card of unplayed fixtures, ~4 days, 19 divisions
data/processed/      JSON mirror of the raw CSVs, same bookmaker folders and filenames
data/processed/seasons/<competition>/  one JSON per season + index.json
data/processed/seasons/fixtures.json   the same card, one object per upcoming fixture
data/processed/teams/  canonical.json (name -> club id) + review.csv (ambiguous ids)
public/logos/<folder>/  320 club crest SVGs in 18 folders; the folder says where the crest came from, not the league
src/build_json.py    regenerates data/processed from data/raw
src/build_seasons.py regenerates data/processed/seasons from data/seasons
src/fetch_seasons.py refreshes data/seasons from football-data.co.uk
src/build_logos.py   renames public/logos/*.svg to club keys and emits src/lib/logoRegistry.ts
src/build_teams.py   collapses every team spelling onto one club id: src/lib/teamRegistry.ts + data/processed/teams/
```

`data/raw/` holds the scrape output as collected and is **read-only**: never edit these files in
place. `data/seasons/` is likewise collected input, refreshed from the site by
`src/fetch_seasons.py` — its JSON output lives under `data/processed/seasons/`. Derived tables go
under `data/processed/`, code under `src/`.

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
`data/raw/`. Each file is a flat JSON array of one object per match row, 43083 records in total:

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

`data/seasons/<competition>/<season>.csv` holds per-match league fixtures with 105–132 wide,
PascalCase/abbreviated columns. The source's own column key is `data/seasons/notes.txt` — read it
rather than guessing an abbreviation. Every raw column header and cell is preserved verbatim from
the site; nothing is renamed, and only the two rows in `REPAIRS` below have prices blanked.

`uv run python src/fetch_seasons.py` (also `bun run fetch:seasons`) crawls
`https://www.football-data.co.uk/data.php` → the country pages → their
`mmz4281/<yy><yy>/<DIV>.csv` links and refreshes these CSVs for the 17 division codes already in
the repo — the eleven top flights plus the second tiers of England, Scotland, Germany, Italy, Spain
and France — 2021-2022 onwards. It is byte-exact: a file is rewritten only when the served bytes
differ (so the in-progress season accumulates fixtures and a source correction still lands), a
response is validated before it replaces a good CSV, and writes go through `.csv.part` + rename.
`--dry-run` reports without writing; `--from`/`--to` widen the season window. `bun run
sync:seasons` chains the fetch and the build below.

`uv run python src/build_seasons.py` (also `bun run build:seasons`) regenerates
`data/processed/seasons/<competition>/` from those CSVs: one JSON array per season file plus an
`index.json`. These files are **separate from the jackpot data** — served by the Vite middleware at
`/data/seasons/premier_league/<season>.json` exactly like the jackpot mirror is at
`/data/<bookmaker>/`.

**The season set holds no unplayed fixtures** — 30349 rows, exactly one null result (the Bastia v Red
Star gap below), and every other row has been played. The only future matches available are
`https://www.football-data.co.uk/fixtures.csv`, the site's rolling card, which `src/fetch_seasons.py`
also downloads into `data/seasons/fixtures.csv` and `src/build_seasons.py` converts to
`data/processed/seasons/fixtures.json` (it is a top-level file, not a competition folder, so
`build_fixtures()` is its own step). Same column vocabulary as the season CSVs minus every result
column, so each record carries `score`, `goals`, `result`, `half_time_*` and `stats` as null or empty
and only the market-average prices. Measured on the 2026-11-07 sync: 160 fixtures over four dates
(2026-11-06 → 2026-11-09) across 19 divisions — the repo's seventeen plus `SC2` and `SC3`, Scotland's
Leagues 1 and 2, which have no history folder, so their rows have `league: null` and no data to learn
from. Every `Date`, `Time` and `Div` is filled and every row has a full `Avg*`/`Max*` price set. The
card overlaps no season file: each row sits after its division's latest decided fixture, so nothing on
it has been played.

30349 matches in total across the seventeen competitions (380 per completed season for EPL, La Liga and
Serie A, 306 for Bundesliga, Eredivisie and `liga_1`; Ligue 1 has 380 for 2021-2022 and 2022-2023
then 306 from 2023-2024, when it dropped to 18 clubs; `jupiter_league` has 306 for 2021-2022 and
2022-2023, 312, 312 and 311 for the three seasons it ran 16 clubs plus playoffs, then 18 clubs
again; `sco_premier_league` has 228 every season — 12 clubs, 198 regular fixtures plus 30 in the
split playoff rounds; Turkey's `ligi_1` runs 380, 342, 380, 342, 306 as it went from 20 to 19 to
20, 19 and 18 clubs, a clean double round-robin each time; Greece's `ethniki_katigoria` has 240 for
its 14-club seasons, then 233 and 236 as the playoff block shrank). Each second tier holds the
double round-robin its club count implies: `efl_championship` 552 (24 clubs), `laliga_segunda` 462
(22), `serie_b` 380 (20), `bundesliga_2` 306 (18), `sco_championship` 180 (10 clubs, four meetings
per pair); `ligue_2` runs 380, 380, 379 then 306 — 2023-2024 is one fixture short at source, the
second Troyes v Valenciennes meeting. The in-progress 2026-2027 files
hold 90 EPL, 168 Championship, 109 La Liga, 131 Segunda, 72 Bundesliga, 90 2. Bundesliga, 100 Serie
A, 100 Serie B, 81 Ligue 1, 99 Ligue 2, 99 Eredivisie, 90 Portugal, 90 Belgium, 69 Premiership, 64
Scottish Championship, 90 Turkey and 62 Greece matches as of the 2026-11-05 sync. One object per
match, sorted by `(date, home_team)`; the ~100 source columns are reduced to 19 fields, variable
parts grouped:

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
  jackpot CSVs use (en dash included): `E0` → `England – Premier League`, `E1` → `England –
  Championship`, `SP1` → `Spain – La Liga`, `SP2` → `Spain – Segunda División`, `D1` → `Germany –
  Bundesliga`, `D2` → `Germany – 2. Bundesliga`, `I1` → `Italy – Serie A`, `I2` → `Italy – Serie B`,
  `F1` → `France – Ligue 1`, `F2` → `France – Ligue 2`, `N1` →
  `Netherlands – Eredivisie`, `P1` → `Portugal – Primeira Liga`, `B1` → `Belgium – Jupiler Pro
  League`, `SC0` → `Scotland – Premiership`, `SC1` → `Scotland – Championship`, `T1` → `Turkey –
  Süper Lig`, `G1` → `Greece – Super League 1`. The `ü` of `Süper Lig` and the `ó` of `Segunda
  División` are the only non-ASCII letters in those strings, the en dashes aside; club names add
  exactly one more, `Preußen Münster` in `bundesliga_2`. Folder names are not those strings and are
  easy to cross-match: `liga_1` is **Portugal** and `ligi_1` — one
  letter apart — is **Turkey**, `ligue_2` sits between them as **France's second tier**,
  `le_championnat` is France, `ethniki_katigoria` is Greece, and
  `jupiter_league` misspells Jupiler. `efl_championship` and `sco_championship` are both a
  "Championship" — England's second tier and Scotland's.
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
  `Referee` column — the Premier League, `sco_premier_league`, `efl_championship` and
  `sco_championship` have one, all four filled on every row, so the other thirteen of seventeen
  competitions' rows have 18 fields instead of 19. `sco_championship` is also the only folder with no
  xG column in any season, so its `stats` has 12 keys where the others have 14. Missing cells
  become `null`, never guessed.
- The source data is near-complete: every row but one has a full-time result — `ligue_2` 2025-2026
  carries Bastia v Red Star (2025-12-05) with `FTHG`/`FTAG`/`FTR` empty at source, so its `score`,
  `home_goals`, `away_goals`, `total_goals` and `result` are all `null` while its half-time (0-3) and
  odds block are complete. It is kept, not dropped: standings, overview and backtest treat it as
  unplayed. Half-time is missing on 40
  rows and their stats are `null` too: 31 in `ligi_1`, 5 in `jupiter_league`, 2 in `ligue_2` (Nancy v
  Quevilly Rouen, 2022-04-22 and Bordeaux v Rodez, 2023-06-02), one Bundesliga fixture
  (Union Berlin v Bochum, 2024-12-14) and one in `ethniki_katigoria` (Olympiakos v Panathinaikos,
  2023-10-22). The scorelines say why — Belgium's five are 5-0 or 0-5 and Turkey's 31 are 3-0 or
  0-3, the shape of an awarded fixture. Gaziantep and Hatayspor withdrew after the February 2023
  earthquake and every remaining 2022-2023 fixture of theirs was credited, so those 29 rows carry an
  empty odds block as well; the other eleven keep their prices. Beyond that the odds are complete: 12
  of the 102 season files hold a blank cell, 46 rows in all — those 29, the two deliberately blanked
  rows below, one Serie A and one Serie B fixture each missing the same 13 of its 21 prices
  (pre-match `Avg*`/`Max*`/`Avg>2.5`/`AHh*` gone, every closing price present: Torino v Fiorentina,
  2022-01-10 and Lecco v Catanzaro, 2023-09-03), and thirteen rows missing a single `handicap` or
  `handicap_close`. `bundesliga_1`, `bundesliga_2`, `le_championnat`, `liga_1`, `ligue_2`,
  `efl_championship`, `sco_premier_league` and `sco_championship` have no blank odds cell at all.

## Team identity (canonical ids and crests)

The four sources name one club differently: SportPesa writes `Arsenal FC`, `Liverpool FC`,
`Elche CF`; betika and mozzart mostly write the short form and sometimes prefix a ticket number
(`#10 – Ferencvaros`); the season files always write it short. Comparing raw strings therefore splits
a club in two: of the 37 jackpot rows for Arsenal v Liverpool, 31 spell both sides short and 6 spell
both `… FC`, and 2023-04-09, 2024-02-04 and 2024-10-27 appear in both schemes — 27 fixtures read as
strings, 24 read as clubs, and the two most recent meetings (2025-05-11, 2026-11-02) exist only in
the long form, so an all-string H2H page for `Arsenal` never sees them. Form, H2H and predictions
analyse half a club, and `getLogo` returns nothing for the long form. One generated id per real-world
club sits under every comparison.

`uv run python src/build_teams.py` (also `--dry-run`, report only) reads the processed data — the
three jackpot mirrors, all 102 season JSONs and `seasons/fixtures.json`, `index.json` and
`data/processed/teams/` skipped — and writes three artifacts:

```
src/lib/teamRegistry.ts              -- canonicalTeam(), for the browser bundle
data/processed/teams/canonical.json  -- the same variant -> id map, for offline analysis
data/processed/teams/review.csv      -- ids the data cannot name one club for
```

Measured on the current data: 147,184 name occurrences and 5,022 distinct normalised spellings
collapse to 3,819 ids; 1,395 spellings are remapped and those carry 31,507 occurrences. Jackpot,
season and fixtures-card vocabulary is 5,227, 416 and 320 raw names (86,166, 60,698 and 320
occurrences), and every season name — the card included — already stands for exactly one id, so the
map mostly serves the bookmakers. The artifacts are generated, never hand-edited — change a rule in
the script and re-run.

How an id is derived, in order:
- `slug()` — the ticket-prefix strip and `snake()` from `src/build_logos.py` (lowercase, accents
  folded, non-ASCII dropped, non-alphanumerics to `_`). Every name-to-id lookup in the script and in
  `canonicalTeam` goes through this one function, never `snake()` alone: `#15 – Malmo FF` otherwise
  minted `15_malmo_ff` as a club of its own, and a phantom single-row id looks exactly like a short
  name worth folding into a fuller spelling.
- A merge edge: `MANUAL_ALIASES` (the logo rename table, imported so crest keys and club ids speak one
  vocabulary), then `EXTRA_MERGES` in `src/build_teams.py` for the irregular pairs — abbreviations,
  nicknames, legal names (`paris_saint_germain` → `psg`, `manchester_utd` → `man_united`,
  `olympiacos_piraeus` → `olympiacos`).
- Otherwise `strip_tokens()` removes generic club words at the **outer ends only, never the last
  token**: `cd_lugo` → `lugo`, `as_roma` → `roma`. `LEAD_TOKENS` is broad; `TAIL_TOKENS` is
  deliberately narrow because a trailing word often names a *different* club. So `everton_cd` keeps
  its own id (Chile's Everton, not England's `everton`) and Scotland's two Dundees stay apart because
  the edge says `dundee_united` → `dundee_utd` rather than stripping to `dundee`. `atl` is in neither
  list — "Atl." is the identity word — so `atl_nacional` merges to `atletico_nacional` (Medellín) and
  never to Portugal's `nacional`.
- Chains resolve to a fixed point (`1_fc_cologne` → `cologne` → `koln`).
- **`unique_superset_merges()`** then folds the short spellings the tables above cannot express —
  `aachen` into `alemannia_aachen`, `hammarby` into the Allsvenskan club's fuller name — using the
  fixtures themselves instead of letters. A short name moves only into a fuller one that (a) plays in
  at least one of its leagues, (b) never appears as its opponent, (c) shares at least one opponent
  with it, and (d) differs by tokens that are not in `OTHER_TEAM_TOKENS` (women's, reserve, U21 and
  B-team words, which mark a *different* squad). Exactly one candidate can satisfy all four; two or
  more, or candidates that share no fixture with anything, go to `review.csv` with the owners named,
  because a guess here invents a meeting between two real clubs. 496 names fold on the current data.
  The fold direction is fixed by `CREST_KEYS` (the 304 logo keys): a fold never moves a club off the
  spelling that owns its file, so `fsv_mainz` → `mainz` and `bayer_leverkusen` → `leverkusen`, never
  the reverse. That reversal rewrites edges after the chain has already been walked, so the targets
  collapse a second time and the group landing on each target is then checked against itself: two
  names that played each other (`genoa` and `sampdoria`, both arriving on `sampdoria_genoa`) make the
  whole target unsafe and drop every edge into it. `KEEP_DISTINCT` is the hand-adjudicated veto for
  pairs the evidence wrongly unites — `guinea` / `equatorial_guinea` (both national teams), `minsk` /
  `dinamo_minsk`, the two Hapoel K.S. squads, and `gaziantep` / `gazisehir_gaziantep` — and each of
  those four is now unreachable from the fold rules anyway, so the list costs nothing but keeps the
  answer written down.

Three guards keep a merge from inventing fixtures between real clubs:

- **`guard_season_injectivity()`** refuses any id that ends up holding two different season-file
  spellings; the season vocabulary is the one place where two spellings are two clubs unless proven
  otherwise, so it is the cheapest hard stop. Refusing restores each spelling to its own id, which
  under-merges — the safe direction. `ALLOWED_SEASON_MERGES = {"mechelen", "sheffield_united"}` is the
  exception list for the two pairs the source used to split across the rows of one season
  (`KV Mechelen`/`Mechelen` in `jupiter_league` 2026-2027, `Sheffield United`/`Sheffield Utd` in
  `efl_championship` 2026-2027); both were corrected at source in the 2026-11-07 sync, so the set is
  currently inert — with it emptied the report still prints zero refusals. It stays as the written
  answer for the next time the site changes a club's mind mid-season.
- **The self-match invariant** is the acceptance gate: `id_evidence()` records, per id, the fixtures it
  appears in, and any id that ends up on both sides of one row is a merge that invented a meeting. The
  report must print `0 ids appear against themselves` — every rule above is re-run until it does, and a
  non-zero count means undo the newest edge rather than widening a strip list.
- **`review.csv`** (514 rows) lists what the data cannot name one club for, in four kinds:
  `rows in 2+ countries` (5), `short name, 2+ confirmed owners` (45), `short name, nothing faces the
  owner` (460) and `kept apart by hand` (4). `fixable` is `no` for a spelling shared across countries
  or a pair decided by hand (9 rows) and `by hand` for the fold candidates the evidence can rank but
  not prove — those name their suggested owners in `variants`, so promoting one is a one-line
  `EXTRA_MERGES` edge; there is no `yes` row, because every droppable edge is now caught by the
  guards above. The five country rows are `arsenal` (England 215 / Belarus 3),
  `athletic` (`Athletic Club`: Spain 37 / Brazil 9), `river_plate_uru` (Argentina 2 / Uruguay 2 /
  Paraguay 1), `defensor_sporting` (Uruguay 4 / Colombia 1), `liverpool_montevideo` (Uruguay 3 /
  Colombia 1). They stay merged and carry the cost: no crest for `athletic` (Bilbao's file is
  `athletic_bilbao`, and claiming it would claim Mineiro's rows too), and no cross-country aggregate
  keyed on them.

What reads the id: `src/lib/teams.ts` (appearances, H2H, form, the team lists), the mozzart extract
dedupe in `src/lib/data.ts` and the analysis dedupe in `src/lib/analytics.ts` (30,537 distinct mozzart
fixtures become 30,523 once "Arsenal" and "Arsenal FC" are one club), `src/lib/seasonsAnalytics.ts`
and `src/lib/seasonsPredictor.ts`, the team filters in the seasons dashboard and the versus/actions
modals, and `getLogo`. Display strings stay raw: lists and standings show each id's most frequent
spelling in the current selection. **Never compare raw team strings — canonicalise both sides.**

Crests live in `public/logos/<folder>/<key>.svg`, 320 files in 18 folders; the folder records where a
crest was sourced, not who plays there (`celta_vigo` and `real_sociedad` each appear in both
`laliga_primera/` and `laliga_segunda/`, so the registry holds 304 keys).
`uv run python src/build_logos.py` renames the files from its `MAPPING` and emits
`src/lib/logoRegistry.ts` from the same table, so files and registry cannot drift; `MAPPING` also
exports `snake` and `MANUAL_ALIASES`, which `build_teams.py` imports. `getLogo()` order: `normalizeTeam`
→ `TEAM_ALIASES` → `TEAM_LOGOS`, then `canonicalTeam` and that again — coverage 45.4% of jackpot name
occurrences, up from 36.9% on name alone: 315 spellings (6,188 rows — `Manchester Utd` 212,
`Atl. Madrid` 186, `AS Roma` 158) resolve only through the canonical step. Season coverage is 82.7%
before and after it, because that vocabulary was always the short form; 304 of the 416 season clubs
have a file and all 304 keys are used, while the jackpot data reaches 299 of them across 3,819 ids.
`src/components/TeamLogo.tsx` sits each crest on a light chip (`bg-muted dark:bg-white/30`) so dark
crests stay readable on the dark card, and falls back to broadcast initials (`Nott'm Forest` → NFO)
when there is no file *or the file fails to decode*. A crest that is valid XML but uses an undeclared
namespace prefix fails silently in `<img>`: `laliga_primera/elche.svg` carried `<sodipodi:namedview>`
without its `xmlns:sodipodi` declaration — if `getLogo()` returns a path but the row shows initials,
load the SVG as an image and read the parser error.

## Data quirks (verify before computing anything)

- Line endings differ by file (every betika and mozzart CSV is CRLF; the two sportpesa files are the
  only LF ones) and `result` values can carry a trailing `\r`. Use `csv.DictReader` with
  `newline=''`, never naive `split(',')`.
- 33 SportPesa rows (2023-01-23 → 2026-08-17) hold `PD:1` / `PD:X` / `PD:2` in `Score` instead of a
  scoreline — `PD-1`/`PD-X`/`PD-2` after the separator flip — and `Result` always agrees with the
  suffix (`home`/`draw`/`away`). They are not goal counts; exclude them from any aggregate over
  `score`.
- The season CSVs are all CRLF and 53 of the 102 carry a UTF-8 **BOM** before `Div` (every
  competition's last three seasons, plus EPL 2021-2022 and `ligue_2` 2022-2023). Open them with
  `encoding='utf-8-sig'` or the first column becomes `'\ufeffDiv'`.
- Two scrape defects are blanked at source by the `REPAIRS` list in `src/fetch_seasons.py`, which is
  re-applied on every download so a hand fix never freezes a file. The Utrecht v Go Ahead Eagles row
  (08/09/2026) of `data/seasons/eredivisie/2026-2027.csv` still arrives with a corrupted odds block —
  a negative under-2.5 price, all five `Max*` below their `Avg*`, and `AHh` holding a price — so its
  85 populated odds cells are re-blanked and that match has null odds in the JSON while its score,
  half-time and stats stay intact. The Castellon v Cultural Leonesa row (23/03/2026) of
  `data/seasons/laliga_segunda/2025-2026.csv` corrupts only its **closing** block (`AHCh` holding
  -0.390625 rather than a quarter-ball line, `AvgCAHH`/`AvgCAHA` at 0.6/0.56, every `AvgC*` below the
  firms that quoted it), so that repair names the 8 closing columns and the 13 sound pre-match
  prices survive — the first repair with a `columns` list.
  Every other odds row in the season set satisfies Max >= Avg with all prices above 1.
- One raw cell holds a bare `#`: `B365CH` of Utrecht v Feyenoord (08/01/2023) in
  `data/seasons/eredivisie/2022-2023.csv`. It is a per-bookmaker column, which the converter drops,
  so the JSON never sees it — but anything reading the CSVs directly must not `float()` that cell.
- The site has twice split one club across two spellings inside a single season file —
  `efl_championship` 2026-2027 wrote `Sheffield United` on 13 rows and `Sheffield Utd` on one, and
  `jupiter_league` 2026-2027 wrote `KV Mechelen` on one row of a `Mechelen` club. Both were corrected
  at source by the 2026-11-07 sync, so the season vocabulary is now one name per club and those
  `index.json` counts read 24 and 18 teams rather than 25 and 19. Dedupe club names before counting
  fixtures per side anyway: the defect is the source's, and it can come back with the next row.
- The six second tiers appear in the jackpot CSVs under exactly the strings the season set now uses,
  so they join (`England – Championship` 176 rows, `Spain – Segunda División` 135, `Germany – 2.
  Bundesliga` 32, `France – Ligue 2` 17, `Italy – Serie B` 12, `Scotland – Championship` 2), with one
  exception: 3 mozzart rows say `Spain – Segunda Division` without the accent and will not match.
  `Brazil – Serie B` (69 jackpot rows) has no football-data.co.uk coverage at all.
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
