"""Build normalised JSON versions of the raw bookmaker CSVs."""

import csv
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"

KEY_MAP = {
    "Date": "date",
    "JackpotId": "jackpot_id",
    "Home": "home_team",
    "Away": "away_team",
    "Score": "score",
    "Result": "result",
}

NUMERIC = {"odds", "jackpot_id"}


def normalise_date(value):
    for fmt in ("%d-%m-%Y", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def normalise_score(value):
    return value.replace(":", "-") if value else value


def clean(field, value):
    value = value.strip()
    if field == "result":
        value = value.lower()
    if not value:
        return None
    if field == "date":
        return normalise_date(value)
    if field == "score":
        return normalise_score(value)
    if field in NUMERIC:
        try:
            return int(value) if field == "jackpot_id" else float(value)
        except ValueError:
            return None
    return value


def build_file(csv_path):
    bookmaker = csv_path.parent.name
    with open(csv_path, newline="", encoding="utf-8") as fh:
        rows = csv.DictReader(fh)
        fields = [KEY_MAP.get(f, f) for f in rows.fieldnames]
        records = [
            {f: clean(f, raw.get(orig, "")) for f, orig in zip(fields, rows.fieldnames)}
            for raw in rows
        ]

    target = OUT / bookmaker / (csv_path.stem + ".json")
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, "w", encoding="utf-8") as fh:
        json.dump(records, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    return target, len(records)


def main():
    paths = sorted(RAW.glob("*/*.csv"))
    total = 0
    for path in paths:
        target, count = build_file(path)
        total += count
        print(target.relative_to(ROOT), count, "records")
    print("wrote", len(paths), "files,", total, "records")


if __name__ == "__main__":
    sys.exit(main())
