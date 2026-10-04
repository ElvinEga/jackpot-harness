"""Build frontend-ready JSON for the Football-Data.co.uk season CSVs.

Reads data/seasons/<competition>/<season>.csv and writes
data/processed/seasons/<competition>/<season>.json plus an index.json listing
the seasons. Kept separate from the jackpot output under data/processed/.
"""

import csv
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "seasons"
OUT = ROOT / "data" / "processed" / "seasons"

LEAGUES = {
    "E0": "England – Premier League",
    "SP1": "Spain – La Liga",
    "D1": "Germany – Bundesliga",
}

RESULT = {"H": "home", "D": "draw", "A": "away"}

# csv column -> key used inside the `stats` object
STATS = {
    "HxG": "home_xg",
    "AxG": "away_xg",
    "HS": "home_shots",
    "AS": "away_shots",
    "HST": "home_shots_on_target",
    "AST": "away_shots_on_target",
    "HHW": "home_hit_woodwork",
    "AHW": "away_hit_woodwork",
    "HC": "home_corners",
    "AC": "away_corners",
    "HF": "home_fouls",
    "AF": "away_fouls",
    "HO": "home_offsides",
    "AO": "away_offsides",
    "HY": "home_yellow",
    "AY": "away_yellow",
    "HR": "home_red",
    "AR": "away_red",
}

# csv column -> key used inside the `odds` object; market average prices are the
# canonical ones, the per-bookmaker columns are dropped
ODDS = {
    "AvgH": "home",
    "AvgD": "draw",
    "AvgA": "away",
    "MaxH": "home_max",
    "MaxD": "draw_max",
    "MaxA": "away_max",
    "AvgCH": "home_close",
    "AvgCD": "draw_close",
    "AvgCA": "away_close",
    "Avg>2.5": "over_2_5",
    "Avg<2.5": "under_2_5",
    "Max>2.5": "over_2_5_max",
    "Max<2.5": "under_2_5_max",
    "AvgC>2.5": "over_2_5_close",
    "AvgC<2.5": "under_2_5_close",
    "AHh": "handicap",
    "AvgAHH": "handicap_home",
    "AvgAHA": "handicap_away",
    "AHCh": "handicap_close",
    "AvgCAHH": "handicap_home_close",
    "AvgCAHA": "handicap_away_close",
}

FLOAT_FIELDS = {"HxG", "AxG"} | set(ODDS)


def text(value):
    value = value.strip()
    return value or None


def number(field, value):
    value = text(value)
    if value is None:
        return None
    try:
        return float(value) if field in FLOAT_FIELDS else int(value)
    except ValueError:
        return None


def match_date(value):
    for fmt in ("%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def season_of(day):
    start = day.year if day.month >= 7 else day.year - 1
    return f"{start}-{start + 1}"


def build_match(row, source, header):
    day = match_date(text(row.get("Date")) or "")
    if day is None:
        raise ValueError(f"{source}: unparseable date {row.get('Date')!r}")

    home_goals = number("FTHG", row.get("FTHG", ""))
    away_goals = number("FTAG", row.get("FTAG", ""))
    ht_home = number("HTHG", row.get("HTHG", ""))
    ht_away = number("HTAG", row.get("HTAG", ""))
    division = text(row.get("Div"))

    record = {
        "season": season_of(day),
        "date": day.isoformat(),
        "kickoff_time": text(row.get("Time")),
        "home_team": text(row.get("HomeTeam")),
        "away_team": text(row.get("AwayTeam")),
        "division": division,
        "league": LEAGUES.get(division),
        "score": None,
        "home_goals": home_goals,
        "away_goals": away_goals,
        "total_goals": None,
        "result": RESULT.get(text(row.get("FTR")), None),
        "half_time_score": None,
        "half_time_home_goals": ht_home,
        "half_time_away_goals": ht_away,
        "half_time_result": RESULT.get(text(row.get("HTR")), None),
        **({"referee": text(row.get("Referee"))} if "Referee" in header else {}),
        "stats": {key: number(f, row.get(f, "")) for f, key in STATS.items() if f in header},
        "odds": {key: number(f, row.get(f, "")) for f, key in ODDS.items() if f in header},
    }

    if home_goals is not None and away_goals is not None:
        record["score"] = f"{home_goals}-{away_goals}"
        record["total_goals"] = home_goals + away_goals
    if ht_home is not None and ht_away is not None:
        record["half_time_score"] = f"{ht_home}-{ht_away}"

    return record


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("[\n")
        for i, record in enumerate(payload):
            fh.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")))
            fh.write(",\n" if i < len(payload) - 1 else "\n")
        fh.write("]\n")


def build_competition(folder):
    header = set()
    loaded = []
    for csv_path in sorted(folder.glob("*.csv")):
        with open(csv_path, newline="", encoding="utf-8-sig") as fh:
            reader = csv.DictReader(fh)
            header.update(reader.fieldnames or [])
            loaded.append((csv_path, [row for row in reader if text(row.get("Date") or "")]))

    index = []
    total = 0
    for csv_path, rows in loaded:
        records = [build_match(row, csv_path.name, header) for row in rows]
        records.sort(key=lambda r: (r["date"], r["home_team"]))
        out = OUT / folder.name / (csv_path.stem + ".json")
        write_json(out, records)
        teams = {t for r in records for t in (r["home_team"], r["away_team"]) if t}
        index.append({
            "season": records[0]["season"] if records else csv_path.stem,
            "file": out.name,
            "matches": len(records),
            "date_min": records[0]["date"] if records else None,
            "date_max": records[-1]["date"] if records else None,
            "teams": len(teams),
        })
        print(out.relative_to(ROOT), len(records), "matches")
        total += len(records)

    index.sort(key=lambda entry: entry["season"])
    index_path = OUT / folder.name / "index.json"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    with open(index_path, "w", encoding="utf-8") as fh:
        json.dump({
            "competition": folder.name,
            "source": f"data/seasons/{folder.name}",
            "seasons": index,
        }, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(index_path.relative_to(ROOT), len(index), "seasons,", total, "matches")


def main():
    folders = sorted(p for p in RAW.iterdir() if p.is_dir())
    if not folders:
        print("no season folders under", RAW, file=sys.stderr)
        return 1
    for folder in folders:
        build_competition(folder)
    return 0


if __name__ == "__main__":
    sys.exit(main())
