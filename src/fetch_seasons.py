"""Fetch the Football-Data.co.uk season CSVs into data/seasons/.

Walks data.php -> country pages -> mmz4281/<yy><yy>/<DIV>.csv links for the
division codes already in this repo, and writes only when the remote bytes
differ from the local copy, so re-runs stay cheap and the in-progress seasons
pick up new fixtures. The rolling fixtures.csv card — the next few days of
league fixtures, the only unplayed matches available — is fetched the same way
into data/seasons/fixtures.csv.

    uv run python src/fetch_seasons.py [--dry-run] [--from 2021] [--to 2026]

Processing is src/build_seasons.py's job; bun run sync:seasons chains both.
"""

import codecs
import csv
import io
import re
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "seasons"
SITE = "https://www.football-data.co.uk/"

# division code on the site -> folder name already used under data/seasons
DIVISIONS = {
    "E0": "premier_league",
    "E1": "efl_championship",
    "SC0": "sco_premier_league",
    "SC1": "sco_championship",
    "D1": "bundesliga_1",
    "D2": "bundesliga_2",
    "I1": "serie_a",
    "I2": "serie_b",
    "SP1": "laliga_primera",
    "SP2": "laliga_segunda",
    "F1": "le_championnat",
    "F2": "ligue_2",
    "N1": "eredivisie",
    "B1": "jupiter_league",
    "P1": "liga_1",
    "T1": "ligi_1",
    "G1": "ethniki_katigoria",
}

FIRST_SEASON = 2021

# Fixture identity, scores and match stats; everything else in a source row is a
# price column, and a price column is what a repair below blanks out.
CORE_COLUMNS = {
    "Div", "Date", "Time", "HomeTeam", "AwayTeam",
    "FTHG", "FTAG", "FTR", "HTHG", "HTAG", "HTR", "HxG", "AxG",
    "HS", "AS", "HST", "AST", "HW", "AW", "HC", "AC",
    "HF", "AF", "HO", "AO", "HY", "AY", "HR", "AR", "Referee",
}

# Rows the site still publishes with a corrupt odds block. The repo's convention
# is to blank their prices, so the blanking is re-applied to every download
# rather than guarding the whole file away from the sync. A repair with a
# `columns` list blanks only those price columns, so the sound ones survive.
REPAIRS = [
    {
        # negative Avg<2.5, all five Max* below their Avg*, AHh holding a price
        "competition": "eredivisie",
        "season": "2026-2027",
        "row": {"Date": "08/09/2026", "HomeTeam": "Utrecht", "AwayTeam": "Go Ahead Eagles"},
        "why": "corrupt odds block blanked",
    },
    {
        # AHCh holds -0.390625 rather than a quarter-ball line, AvgCAHH/AvgCAHA are
        # 0.6/0.56 (not decimal prices) and every closing average sits below the
        # firms that quoted it. The pre-match block is sound, so only the close goes.
        "competition": "laliga_segunda",
        "season": "2025-2026",
        "row": {"Date": "23/03/2026", "HomeTeam": "Castellon", "AwayTeam": "Cultural Leonesa"},
        "columns": ["AvgCH", "AvgCD", "AvgCA", "AvgC>2.5", "AvgC<2.5",
                    "AHCh", "AvgCAHH", "AvgCAHA"],
        "why": "corrupt closing-odds block blanked",
    },
]

REQUIRED_COLUMNS = {"Div", "Date", "Time", "HomeTeam", "AwayTeam", "FTHG", "FTAG", "FTR"}

# The rolling upcoming-fixtures card. It carries the next few days across the
# site's leagues and, by design, has no result columns at all, so it cannot go
# through the season validator.
FIXTURES_URL = SITE + "fixtures.csv"
FIXTURES_TARGET = RAW / "fixtures.csv"
FIXTURES_REQUIRED_COLUMNS = {"Div", "Date", "Time", "HomeTeam", "AwayTeam"}
FIXTURE_DATE = re.compile(r"\d{1,2}/\d{1,2}/\d{2,4}")

# SC2 and SC3 (Scotland's Leagues 1 and 2) are on the card but have no history
# folder in this repo, so their fixtures arrive with nothing to learn from.
FIXTURE_DIVISIONS = set(DIVISIONS) | {"SC2", "SC3"}

CSV_LINK = re.compile(r"mmz4281/(\d{4})/([A-Za-z0-9]+)\.csv")
ANCHOR_HREF = re.compile(r"""<a[^>]+href=['"]([^'"]+)['"]""", re.I)
COUNTRY_PAGE = re.compile(r"[a-z]+m\.php")


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def get_text(url):
    return get(url).decode("utf-8", "replace")


def current_season_start():
    today = date.today()
    return today.year if today.month >= 7 else today.year - 1


def season_label(code):
    year = int(code[:2])
    start = 2000 + year if year < 50 else 1900 + year
    return start, f"{start}-{start + 1}"


def country_pages():
    """The relative country links in the data.php league table, in page order."""
    seen = []
    for href in ANCHOR_HREF.findall(get_text(SITE + "data.php")):
        if "/" not in href and COUNTRY_PAGE.fullmatch(href) and href not in seen:
            seen.append(href)
    return seen


def published_links(page_url):
    """{(division code, season code): csv url} for one country page."""
    found = {}
    for href in ANCHOR_HREF.findall(get_text(page_url)):
        match = CSV_LINK.search(href)
        if match:
            found[(match.group(2), match.group(1))] = urljoin(page_url, href)
    return found


def problem_with(payload, division):
    """None if the body looks like the CSV we expect, else why it was rejected."""
    text = payload.decode("utf-8-sig")
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        return "empty response"
    header = [column.strip() for column in next(csv.reader([lines[0]]))]
    missing = REQUIRED_COLUMNS - set(header)
    if missing:
        return "missing columns " + ", ".join(sorted(missing))
    if len(lines) < 2:
        return "no data rows"
    divisions = {next(csv.reader([line]))[header.index("Div")].strip() for line in lines[1:]}
    if divisions != {division}:
        return "rows carry a division other than " + division
    return None


def problem_with_fixtures(payload):
    """None if the fixtures card is the CSV we expect, else why it was rejected."""
    text = payload.decode("utf-8-sig")
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        return "empty response"
    header = [column.strip() for column in next(csv.reader([lines[0]]))]
    missing = FIXTURES_REQUIRED_COLUMNS - set(header)
    if missing:
        return "missing columns " + ", ".join(sorted(missing))
    if len(lines) < 2:
        return "no data rows"

    columns = {name: header.index(name) for name in ("Div", "Date")}

    def read(row, name):
        index = columns[name]
        return row[index].strip() if index < len(row) else ""

    rows = [next(csv.reader([line])) for line in lines[1:]]
    unknown = {read(row, "Div") for row in rows} - FIXTURE_DIVISIONS
    if unknown:
        return "divisions this repo has no history for: " + ", ".join(sorted(unknown))
    bad = sorted({read(row, "Date") for row in rows if not FIXTURE_DATE.fullmatch(read(row, "Date"))})
    if bad:
        return "unparseable dates: " + ", ".join(bad[:5])
    return None


def apply_repairs(payload, competition, season):
    """Blank the price columns of the rows listed in REPAIRS.

    Only the matching lines are rewritten, so the BOM, line endings and every
    other row keep the exact bytes the site served.
    """
    repairs = [r for r in REPAIRS if r["competition"] == competition and r["season"] == season]
    if not repairs:
        return payload, []

    bom = payload.startswith(codecs.BOM_UTF8)
    text = payload[len(codecs.BOM_UTF8):].decode("utf-8") if bom else payload.decode("utf-8")
    out = []
    header = None
    tally = {}
    for raw_line in text.splitlines(keepends=True):
        body = raw_line.rstrip("\r\n")
        if header is None:
            header = [column.strip() for column in next(csv.reader([body]))]
            prices = [i for i, column in enumerate(header) if column not in CORE_COLUMNS]
            out.append(raw_line)
            continue
        if not body.strip():
            out.append(raw_line)
            continue
        cells = next(csv.reader([body]))
        for repair in repairs:
            row = repair["row"]
            if all(cells[header.index(name)] == value for name, value in row.items()):
                targets = [header.index(c) for c in repair.get("columns", []) if c in header] or prices
                for index in targets:
                    if index < len(cells):
                        cells[index] = ""
                buffer = io.StringIO(newline="")
                csv.writer(buffer, lineterminator="").writerow(cells)
                body = buffer.getvalue()
                tally[repair["why"]] = tally.get(repair["why"], 0) + 1
        terminator = raw_line[len(raw_line.rstrip("\r\n")):]
        out.append(body + terminator)
    repaired = "".join(out)
    if bom:
        repaired = codecs.BOM_UTF8.decode("utf-8") + repaired
    return repaired.encode("utf-8"), sorted(tally)


def row_count(payload):
    return max(len([line for line in payload.decode("utf-8-sig").splitlines() if line.strip()]) - 1, 0)


def resolve_targets(first_season, last_season):
    """{folder: [(season label, csv url)]} for the seasons in range."""
    targets = {}
    for page in country_pages():
        page_url = urljoin(SITE, page)
        for (division, season_code), url in published_links(page_url).items():
            if division in DIVISIONS:
                start, label = season_label(season_code)
                if first_season <= start <= last_season:
                    targets.setdefault(DIVISIONS[division], []).append((label, url))
    for entries in targets.values():
        entries.sort()
    return targets


def fetch_fixtures(dry_run, counts):
    """Refresh the rolling upcoming-fixtures card, with the same byte-compare write."""
    try:
        payload = get(FIXTURES_URL)
    except urllib.error.HTTPError as error:
        counts["failed"] += 1
        print("fixtures.csv  failed: HTTP " + str(error.code), file=sys.stderr)
        return
    except urllib.error.URLError as error:
        counts["failed"] += 1
        print("fixtures.csv  failed: " + str(error.reason), file=sys.stderr)
        return

    problem = problem_with_fixtures(payload)
    if problem:
        counts["failed"] += 1
        print("fixtures.csv  rejected: " + problem, file=sys.stderr)
        return

    existing = FIXTURES_TARGET.read_bytes() if FIXTURES_TARGET.exists() else None
    if existing == payload:
        counts["unchanged"] += 1
        return

    counts["new" if existing is None else "updated"] += 1
    detail = "{} rows".format(row_count(payload))
    if existing is not None:
        detail = "{} -> {} rows".format(row_count(existing), row_count(payload))
    print("fixtures.csv  " + ("new" if existing is None else "updated") + " (" + detail + ")")
    if not dry_run:
        temp = FIXTURES_TARGET.with_suffix(".csv.part")
        temp.write_bytes(payload)
        temp.replace(FIXTURES_TARGET)


def main(argv):
    dry_run = "--dry-run" in argv

    def bound(flag, default):
        return int(argv[argv.index(flag) + 1][:4]) if flag in argv else default

    first_season = bound("--from", FIRST_SEASON)
    last_season = bound("--to", current_season_start())

    targets = resolve_targets(first_season, last_season)
    if not targets:
        print("no season CSV links found on " + SITE + "data.php", file=sys.stderr)
        return 1

    total = sum(len(entries) for entries in targets.values())
    print("{} CSV links, {} competitions, seasons {}-{}".format(total, len(targets), first_season, last_season))

    counts = {"new": 0, "updated": 0, "unchanged": 0, "failed": 0}
    for folder in sorted(targets):
        for label, url in targets[folder]:
            name = folder + "/" + label + ".csv"
            destination = RAW / folder / (label + ".csv")
            try:
                payload = get(url)
            except urllib.error.HTTPError as error:
                counts["failed"] += 1
                print(name + "  failed: HTTP " + str(error.code), file=sys.stderr)
                continue
            except urllib.error.URLError as error:
                counts["failed"] += 1
                print(name + "  failed: " + str(error.reason), file=sys.stderr)
                continue

            problem = problem_with(payload, url.rsplit("/", 1)[1][:-4])
            if problem:
                counts["failed"] += 1
                print(name + "  rejected: " + problem, file=sys.stderr)
                continue

            payload, notes = apply_repairs(payload, folder, label)
            existing = destination.read_bytes() if destination.exists() else None
            if existing == payload:
                counts["unchanged"] += 1
                continue

            change = "new" if existing is None else "updated"
            counts[change] += 1
            detail = "{} rows".format(row_count(payload))
            if existing is not None:
                detail = "{} -> {} rows".format(row_count(existing), row_count(payload))
            if notes:
                detail += ", " + "; ".join(notes)
            print(name + "  " + change + " (" + detail + ")")
            if not dry_run:
                destination.parent.mkdir(parents=True, exist_ok=True)
                temp = destination.with_suffix(".csv.part")
                temp.write_bytes(payload)
                temp.replace(destination)

    fetch_fixtures(dry_run, counts)

    print(" ".join(key + "=" + str(counts[key]) for key in counts))
    if dry_run and counts["new"] + counts["updated"]:
        print("dry run: nothing written")
    elif counts["new"] + counts["updated"]:
        print("run bun run build:seasons to refresh data/processed/seasons")
    return 1 if counts["failed"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
