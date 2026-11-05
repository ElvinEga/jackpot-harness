"""Canonical team-identity registry.

The data sources name the same club differently: SportPesa writes "Arsenal FC",
"Liverpool FC", "Elche CF" while betika, mozzart and the season files write
"Arsenal", "Liverpool", "Elche". Every consumer matches on the raw string, so
H2H/form lookups (src/lib/teams.ts) find no matches for the long forms and
getLogo misses them. This script collapses every distinct data name onto one
canonical snake_case key and generates three artifacts:

    src/lib/teamRegistry.ts               -- canonicalTeam() for the browser bundle
    data/processed/teams/canonical.json   -- the same map for offline analysis
    data/processed/teams/review.csv       -- ids the data cannot name one club for

A key comes from snake() (src/build_logos.py), the merge edges (MANUAL_ALIASES,
EXTRA_MERGES) and outer-end token stripping, then from the fixture evidence: a short
spelling folds into the one fuller name that plays in its competitions, never met it,
and faces at least one of the same clubs (unique_superset_merges). Anything the
evidence cannot rank -- two plausible owners, no shared fixture, rows in two countries,
a pair KEEP_DISTINCT holds apart -- goes to the review CSV instead of a guess, because
a wrong merge invents matches between two real clubs and nothing downstream can undo
that. Both code artifacts are regenerated, never hand-edited. Run:

    uv run python src/build_teams.py            # write the three + report
    uv run python src/build_teams.py --dry-run  # report only
"""

import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_logos import MAPPING, MANUAL_ALIASES, snake  # noqa: E402

TS_OUT = ROOT / "src" / "lib" / "teamRegistry.ts"
JSON_OUT = ROOT / "data" / "processed" / "teams" / "canonical.json"
REVIEW_OUT = ROOT / "data" / "processed" / "teams" / "review.csv"

# -- canonical rules -----------------------------------------------------------

# Generic club-prefix tokens, stripped from the END if they start a name and
# from the END of the reverse... (stripped only at the outer ends, one at a
# time, never the last token): "cd_lugo" -> "lugo", "as_roma" -> "roma".
LEAD_TOKENS = {
    "fc", "cf", "cfc", "afc", "ac", "as", "cd", "sd", "ud", "us", "cs",
    "sc", "sk", "nk", "fk", "bk", "ik", "kv", "rc", "rcd", "ca",
    "sv", "vfb", "vfl", "ogc", "losc", "borussia", "olympique",
    "1",  # "1. FC Köln" / "1 FC Kaiserslautern" numbering prefixes
}
# Generic club-suffix tokens, deliberately narrower than the prefix list:
# suffixes that identify a DISTINCT club ("Dundee" vs "Dundee United",
# "Everton" vs "Everton CD"), stay — "utd"/"united", "cd"/"city"/"town"/
# "athletic" are handled by manual merge edges instead.
TAIL_TOKENS = {
    "fc", "cf", "cfc", "afc", "ud", "bsc", "calcio", "club", "futebol",
    "foot", "football", "04", "07", "09", "05", "96", "98",
}

# Irregular merge edges the pin rules cannot express: abbreviations,
# nickname spellings, long legal names. Target = canonical key. Values may be
# keys that exist as logo files (man_united, psv) or bare club slugs.
EXTRA_MERGES: dict[str, str] = {
    "manchester_utd": "man_united", "man_utd": "man_united",
    "manchester_city": "man_city", "manc_city": "man_city",
    "wolverhampton": "wolves", "wolverhampton_wanderers": "wolves",
    "wba": "west_brom",
    "monchengladbach": "gladbach", "b_monchengladbach": "gladbach",
    "b_munchengladbach": "gladbach", "b_m_gladbach": "gladbach",
    "b_munich": "bayern", "bayern_munchen": "bayern",
    "b_dortmund": "dortmund", "b_leverkusen": "leverkusen",
    "b_wolfsburg": "wolfsburg",
    "paris_saint_germain": "psg",
    "olympique_marseille": "marseille", "olympique_lyon": "lyon",
    "stade_rennais": "rennes", "stade_rennes": "rennes",
    "stade_brest": "brest", "stade_brestois": "brest",
    "angers_sco": "angers",
    "espanyol_barcelona": "espanyol", "rcd_espanol": "espanyol",
    "deportivo_alaves": "alaves",
    "real_valladolid": "valladolid", "real_betis_seville": "betis",
    "inter_milano": "inter", "internazionale": "inter",
    "juventus_turin": "juventus", "lazio_rome": "lazio",
    "galatasaray_istanbul": "galatasaray", "fenerbahce_istanbul": "fenerbahce",
    "besiktas_istanbul": "besiktas", "kasimpasa_istanbul": "kasimpasa",
    "istanbul_basaksehir": "basaksehir", "trabzonspor_kulubu": "trabzonspor",
    "paok_thessaloniki": "paok", "aris_thessaloniki": "aris",
    "panathinaikos_athens": "panathinaikos", "aek_athens": "aek",
    "olympiacos_piraeus": "olympiacos", "atromitos_athinon": "atromitos",
    "apo_levadiakos": "levadiakos",
    "volos_nps": "volos", "panetolikos_agrinio": "panetolikos",
    "ajax_amsterdam": "ajax", "feyenoord_rotterdam": "feyenoord",
    "pec_zwolle": "zwolle", "sbv_excelsior": "excelsior",
    "fc_twente_enschede": "twente", "willem_ii_tilburg": "willem_ii",
    "sporting_lisbon": "sporting", "sl_benfica": "benfica",
    "benfica_lisbon": "benfica", "boavista_porto": "boavista",
    "cd_santa_clara": "santa_clara", "as_rome": "roma",
    # English clubs: the season files and one bookmaker use the short form,
    # the other the full legal name (both not strippable generically).
    "west_ham_united": "west_ham", "newcastle_united": "newcastle",
    "leeds_united": "leeds",
    "leicester_city": "leicester", "norwich_city": "norwich",
    "stoke_city": "stoke", "swansea_city": "swansea",
    "cardiff_city": "cardiff", "hull_city": "hull",
    "huddersfield_town": "huddersfield", "luton_town": "luton",
    "wigan_athletic": "wigan", "rotherham_united": "rotherham",
    "oxford_united": "oxford", "peterborough_united": "peterborough",
    "preston_north_end": "preston",
    # Scotland: two clubs share a bare base name, so these stay suffix-stripped
    # and only the full legal spelling merges into the season-file spelling.
    "dundee_united": "dundee_utd",
    "hamilton_academical": "hamilton",
    "ayr_united": "ayr_utd",
    "partick_thistle": "partick",
    "dunfermline_athletic": "dunfermline",
    "greenock_morton": "morton",
    # where one source uses the bare name and the other the legal form, and
    # suffix stripping is not generic (city/town/wed/legal city suffix)
    "sheffield_wed": "sheffield_weds", "sheffield_wednesday": "sheffield_weds",
    "peterborough": "peterboro", "peterborough_united": "peterboro",
    "sporting_cp": "sporting",
    "vitoria_guimaraes": "guimaraes", "v_guimaraes": "guimaraes",
    "nec_nijmegen": "nijmegen", "heracles_almelo": "heracles",
    "rkc_waalwijk": "waalwijk", "racing_ferrol": "ferrol",
    "real_sociedad_b": "sociedad_b", "celta_vigo_b": "celta_b",
    "rcd_espanyol": "espanyol",
    "wehen_wiesbaden": "wehen", "tsg_1899_hoffenheim": "hoffenheim",
    "fortuna_dusseldorf": "dusseldorf", "1899_osnabruck": "osnabruck",
    "cologne": "koln",
    # "Atl." is an identity word (Atletico), not filler, so it never strips;
    # these edges reconnect the abbreviation with the club's own full spelling.
    # They must NOT point at a bare city name that another club owns:
    # "Atl. Nacional" is Medellin's club, not Portugal's Nacional.
    "atl_madrid": "atletico_madrid", "atl_nacional": "atletico_nacional",
    "atl_tucuman": "atletico_tucuman", "atl_ottawa": "atletico_ottawa",
    "atl_tembetary": "atletico_tembetary", "atl_guemes": "guemes",
    "atl_rafaela": "rafaela", "atletico_de_rafaela": "rafaela",
    "cpd_junior": "junior", "cd_junior_fc": "junior", "ca_junior": "junior",
    "huila": "atletico_huila",
    "paranaense": "atletico_paranaense", "paranaense_pr": "atletico_paranaense",
    "goianiense": "atletico_goianiense", "goianiense_go": "atletico_goianiense",
    "atletico_mg": "atletico_mineiro", "america_mg": "america_mineiro",
    "deportivo_tolima": "deportes_tolima", "tolima": "deportes_tolima",
    "san_martin_tucuman": "san_martin_de_tucuman",
    "fenix_montevideo": "atl_fenix",
    # Sweden: SportPesa writes "Hammarby IF" and betika/mozzart write the bare
    # "Hammarby" (and, from 2025, "Hammarby FF") for one Allsvenskan club -- the same
    # fixtures against GAIS, Mjallby, Djurgarden, Hacken and Kalmar appear under all
    # three spellings. Declared rather than folded because "Hammarby TFF", the feeder
    # side (38 rows), shares twelve opponents with them: mozzart books first-team
    # fixtures under the farm team's name, so no fixture test can rank the three.
    "hammarby_if": "hammarby", "hammarby_ff": "hammarby",
    "paris": "paris_fc",
    # Hand-ranked "2+ confirmed owners" pairs the fixtures cannot rank alone: one
    # side is the referent everywhere it is written (league evidence and row
    # count agree), the other is a distinct lower-tier club (promovable from
    # review.csv). Each was read in the rows, not guessed.
    "hellas_verona": "verona",        # Verona FC (87 rows) vs Virtus Verona (12)
    "r_oviedo": "oviedo", "real_oviedo": "oviedo",
    "r_santander": "santander", "racing_santander": "santander",
    "dep_la_coruna": "la_coruna",     # all four spellings of Deportivo La Coruna
    "deportivo_de_la_coruna": "la_coruna",
    "real_betis": "betis",
    "club_brugge_kv": "club_brugge", "royale_union_sg": "union_sg",
    "genclerbirligi_sk": "genclerbirligi", "sg_dynamo_dresden": "dresden",
    "independiente_avellaneda": "independiente",
    "fortaleza_ec": "fortaleza", "fortaleza_ce": "fortaleza",
    "fatih_karagumruk_istanbul": "karagumruk",
    "accrington_stanley": "accrington", "doncaster_rovers": "doncaster",
    "bsc_young_boys": "young_boys", "young_boys_bern": "young_boys",
    "oldham_athletic": "oldham", "talleres_cordoba": "talleres",
    "kristiansund_bk": "kristiansund", "sepsi_sf_gheorghe": "sepsi",
    "rb_bragantino": "bragantino", "red_bull_bragantino_sp": "bragantino",
    "ceara_ce": "ceara", "ceara_sc_ce": "ceara", "bryne_fk": "bryne",
    "sarpsborg_08_ff": "sarpsborg_08", "apollon_lim": "apollon",
    "raith_rvs": "raith", "inverness_c": "inverness",
    "raith_rovers": "raith",
    "celta": "celta_vigo",
    "deportivo_la_coruna": "la_coruna",
    "ssc_bari": "bari", "bari_1908": "bari",
    "excelsior_rotterdam": "excelsior",   # the Eredivisie club, not Excelsior Maassluis
    "san_lorenzo_almagro": "san_lorenzo", "san_lorenzo_de_almagro": "san_lorenzo",
    "dynamo_dresden": "dresden",
    "racing_club_de_ferrol": "ferrol", "racing_club_ferrol": "ferrol",
    # Leuven's only pro side: SportPesa writes "Oud-Heverlee Leuven", others shorten
    "leuven": "ohl", "oh_leuven": "ohl",
}


def data_paths() -> list[Path]:
    """Every processed match file: the jackpot mirror plus each season JSON."""
    paths = [p for p in (ROOT / "data" / "processed").glob("*/*.json")
             if p.name != "index.json" and p.parent.name != "teams"]
    paths += [p for p in (ROOT / "data" / "processed" / "seasons").glob("*/*.json")
              if p.name != "index.json"]
    return sorted(paths)


def collect_names() -> Counter:
    """Every distinct raw team name across the processed data, with frequency."""
    names: Counter = Counter()
    for path in data_paths():
        try:
            rows = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            for field in ("home_team", "away_team"):
                value = row.get(field)
                if isinstance(value, str) and value.strip():
                    names[value.strip()] += 1
    return names


def strip_tokens(s: str) -> str:
    toks = s.split("_")
    changed = True
    while changed and len(toks) > 1:
        changed = False
        if toks[0] in LEAD_TOKENS and len(toks) > 1:
            toks = toks[1:]
            changed = True
        if len(toks) > 1 and toks[-1] in TAIL_TOKENS:
            toks = toks[:-1]
            changed = True
    return "_".join(toks)


def ticket_prefix(value: str) -> str:
    """'#10 – Ferencvaros' -> 'Ferencvaros' (betika ticket numbering noise)."""
    return re.sub(r"^#\d+\s*[–—-]\s*", "", value)


def slug(value: str) -> str:
    """The one normalisation every lookup shares: ticket prefix off, then snake().

    Anything that resolves a data name to an id must use this, not snake() alone:
    betika writes "#15 – Malmo FF" on its tickets, and a reader that skips the
    prefix hands back "15_malmo_ff" as a club of its own -- one row, no crest, and
    a name long enough to look like a fuller spelling worth folding into.
    """
    return snake(ticket_prefix(value))


def build_canon(names: Counter) -> dict[str, str]:
    """snake_case(name) -> canonical snake key, for names that change."""
    canon: dict[str, str] = {}
    for raw in names:
        s = slug(raw)
        if not s:
            continue
        if s in MANUAL_ALIASES:
            target = MANUAL_ALIASES[s]
        elif s in EXTRA_MERGES:
            target = EXTRA_MERGES[s]
        else:
            target = strip_tokens(s)
        if target != s:
            canon[s] = target
    # A crest key is the id the artwork hangs from: never let a strip or edge
    # move the club off the spelling that owns its file. "paris_fc" otherwise
    # strips to "paris" and strands the crest on an id no row uses. Dropping
    # the fold (rather than redirecting) is the safe direction and matches the
    # CREST_KEYS reversal in unique_superset_merges.
    for key in list(canon):
        if key in CREST_KEYS:
            print(f"  crest-key fold dropped: {key} -> {canon[key]} (owns its file)")
            del canon[key]
    # resolve chains to a fixed point through EVERY edge, not only the edges this
    # data set happens to spell: "1_fc_cologne" strips to "cologne", whose
    # cologne -> koln edge is declared but never appears as a name of its own, so
    # walking `canon` alone would stop at "cologne" and split FC Köln in two.
    edges = {**MANUAL_ALIASES, **EXTRA_MERGES}
    for s in canon:
        target = canon[s]
        seen = {s}
        while (target in canon or target in edges) and target not in seen:
            seen.add(target)
            target = canon.get(target, edges.get(target, target))
        canon[s] = target
    return canon


def id_evidence(canon: dict[str, str]) -> dict[str, dict]:
    """Per canonical id: the competitions it plays in, its spellings, its opponents.

    Ids that never meet and play against the same clubs are candidate names for one
    club; ids that DO meet are two clubs whatever their letters say. Opponents are
    recorded as ids, not spellings, so "Sparta" v "Sparta Rotterdam" reads as a
    self-match rather than two different names.
    """
    key_of = lambda raw: canon.get(slug(raw), slug(raw))  # noqa: E731
    out: dict[str, dict] = defaultdict(
        lambda: {"leagues": Counter(), "spellings": Counter(), "opponents": set(),
                 "self_matches": Counter()}
    )
    for path in data_paths():
        try:
            rows = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            raws = [row.get(f) for f in ("home_team", "away_team")]
            if not all(isinstance(r, str) and r.strip() for r in raws):
                continue
            home, away = (r.strip() for r in raws)
            hk, ak = key_of(home), key_of(away)
            league = row.get("league")
            for k, raw, other in ((hk, home, ak), (ak, away, hk)):
                if isinstance(league, str) and league.strip():
                    out[k]["leagues"][league.strip()] += 1
                out[k]["spellings"][raw] += 1
                if other == k:
                    out[k]["self_matches"][f"{home} v {away}"] += 1
                else:
                    out[k]["opponents"].add(other)
    return out


# The ids the artwork hangs from: every key in public/logos/<competition>/, as
# src/lib/logoRegistry.ts knows them. A fold that moves a club off one of these costs
# it its crest, so the merge aims at whichever side owns one (see unique_superset_merges).
CREST_KEYS = set(MAPPING.values())


# Extra words that name a DIFFERENT team of the same club: the women's side, the
# reserve side. "Argentina" is not "Argentina W" and "B&H" is not "B&H U21", so a
# fuller name carrying one of these is never the owner of the shorter name.
# No bare "m": it arrives from apostrophe debris ("Nott'm Forest" -> nott_m_forest)
# and from masculine markers ("Nacional M.", the men's side, same club). Women's
# sides are marked "w"/"women", which stay.
OTHER_TEAM_TOKENS = {
    "w", "women", "ladies", "u17", "u18", "u19", "u20", "u21", "u23",
    "ii", "iii", "iv", "b", "amateur", "amateurs", "youth", "reserves",
    "futsal", "beach", "college", "school",
}


# Pairs the fixture evidence merges and a human must not: two real clubs whose names
# sit inside each other, in one competition, that simply never met inside this data
# window. Every entry was read in the rows, not guessed. Listed as (short, fuller);
# blocks the fold in both directions and lands on the review list.
KEEP_DISTINCT: set[tuple[str, str]] = {
    # Guinea and Equatorial Guinea: two national teams, both AFCON qualifiers, and
    # Cameroon and Senegal face them both.
    ("guinea", "equatorial_guinea"),
    # FC Minsk and Dinamo Minsk, two Belarusian clubs, and Bate Borisov plays both.
    ("minsk", "dinamo_minsk"),
    # Hapoel Kfar Saba and Hapoel Ironi Kiryat Shmona: both sign "Hapoel K.S."
    ("hapoel_k_s", "hapoel_i_k_s"),
    # Gaziantep FK and BB Gaziantep ("Gazisehir"): the city has two clubs, in the
    # top flight in different seasons, and nine opponents in common.
    ("gaziantep", "gazisehir_gaziantep"),
}


def unique_superset_merges(
    canon: dict[str, str],
) -> tuple[list[str], list[dict], list[dict]]:
    """Fold a short spelling into the ONE fuller name the fixtures confirm as its own.

    "Hamburger" is 34 jackpot rows of Hamburger SV, but no generic rule may strip a
    trailing word that also names a club, so the fixture evidence decides. A name alone
    is not evidence: "York City" is a subset of "New York City" and the two never meet,
    because York City plays in England. So a fold needs all of: the short token set a
    proper subset of some spelling of the fuller name, no women's/reserve word
    in the difference, no league contradiction
    (both sides naming leagues and them being disjoint; one side silent is not a
    contradiction), the two never each other's opponent, and -- the positive
    half -- at least one opponent they both face. Without that last test the data says
    only "nothing contradicts merging", which is how "Belgrano" (Córdoba, 40 rows) lands
    on "Defensores de Belgrano" (Buenos Aires) and "Mali" (the national team) on a
    Mogadishu club called "Mali OL".

    What the tests cannot decide goes to the review list instead of a guess: two fuller
    names both qualifying ("Sparta" is Rotterdam's and Prague's, "Cluj" is CFR's and
    Universitatea's, "Wisła" is Płock's and Kraków's), or one candidate with no shared
    fixture to confirm it. Inventing matches between two real clubs is the one error
    nothing downstream can undo.

    Returns (merges applied, review rows, rows for pairs KEEP_DISTINCT held apart).
    """
    ev = id_evidence(canon)
    # Spelling pairs are compared one against one, not as a union of every
    # spelling of the id: "Hertha" union "Hertha BSC" is {hertha, bsc}, which
    # is a subset of nothing, and one bad spelling would poison the whole id.
    spelling_tokens = {
        k: [set(slug(s).split("_")) for s in spellings]
        for k, spellings in ((k, ev[k]["spellings"]) for k in ev)
    }

    def rows_of(key: str) -> int:
        return sum(ev[key]["spellings"].values())

    def owners(keys: list[str]) -> str:
        return ", ".join(f"{c}({rows_of(c)})" for c in sorted(keys))

    folded: dict[str, str] = {}
    split: list[dict] = []
    kept_apart: list[dict] = []
    for short in sorted(ev):
        cands = [
            full for full in ev
            if full != short
            and any(st < ft and not (ft - st) & OTHER_TEAM_TOKENS
                    for st in spelling_tokens[short]
                    for ft in spelling_tokens[full])
            # No league evidence on one side is not contradiction: jackpot rows
            # are blank-league ~91% of the time, so a spelling can record none.
            # Disqualify only on positive evidence -- both sides name leagues
            # and they are disjoint.
            and (not ev[short]["leagues"] or not ev[full]["leagues"]
                 or bool(ev[short]["leagues"] & ev[full]["leagues"]))
            and full not in ev[short]["opponents"]
        ]
        blocked = [c for c in cands if (short, c) in KEEP_DISTINCT or (c, short) in KEEP_DISTINCT]
        if blocked:
            kept_apart.append({
                "key": short, "kind": "kept apart by hand", "fixable": "no",
                "countries": "", "variants": owners(blocked),
            })
        cands = [c for c in cands if c not in blocked]
        confirmed = [c for c in cands if ev[short]["opponents"] & ev[c]["opponents"]]
        if len(confirmed) == 1:
            folded[short] = confirmed[0]
        elif len(confirmed) > 1:
            split.append({
                "key": short, "kind": "short name, 2+ confirmed owners",
                "fixable": "by hand", "countries": "", "variants": owners(confirmed),
            })
        elif cands:
            split.append({
                "key": short, "kind": "short name, nothing faces the owner",
                "fixable": "by hand", "countries": "",
                "variants": owners(cands) + " (no shared fixture)",
            })

    targets: dict[str, str] = {}
    for short in folded:
        target, seen = folded[short], {short}
        while target in folded and target not in seen:
            seen.add(target)
            target = folded[target]
        targets[short] = target

    # A crest key is the id the artwork hangs from. "mainz" is a crest file and 313
    # rows; folding it into "fsv_mainz" would leave the club with the wrong key and no
    # crest. Where the short name owns the crest and the fuller name does not, the
    # fuller name folds into the short one instead.
    for short, target in list(targets.items()):
        if short in CREST_KEYS and target not in CREST_KEYS and target not in targets:
            del targets[short]
            targets[target] = short

    # The crest reversal creates hops the chain collapse above cannot see
    # ("sampdoria_genoa -> genoa" appears only now, so "sampdoria -> genoa"
    # still reads as ending on "sampdoria_genoa"). Collapse again or the
    # safety group below never compares those pairs.
    for short in list(targets):
        target, seen = targets[short], {short}
        while target in targets and target not in seen:
            seen.add(target)
            target = targets[target]
        targets[short] = target

    # A chain must not put two names that PLAYED each other on one id: "a -> t" and
    # "b -> t" with a and b as opponents would invent a club facing itself.
    by_target: dict[str, list[str]] = defaultdict(list)
    for short, target in targets.items():
        if target != short:
            by_target[target].append(short)
    unsafe = {
        target
        for target, shorts in by_target.items()
        for i, a in enumerate(shorts)
        for b in shorts[i + 1:]
        if b in ev[a]["opponents"] or a in ev[target]["opponents"] or b in ev[target]["opponents"]
    }

    applied = []
    for short, target in sorted(targets.items()):
        if target == short or target in unsafe:
            continue
        for s, k in canon.items():
            if k == short:
                canon[s] = target
        canon.setdefault(short, target)
        spellings = ", ".join(sorted(ev[short]["spellings"]))
        applied.append(f"{short} -> {target}: {rows_of(short)} rows ({spellings})")
    return applied, split, kept_apart


# Canonical keys that legitimately hold two season-file spellings of ONE club:
# football-data.co.uk itself writes "Mechelen" and "KV Mechelen", and
# efl_championship 2026-2027 writes both "Sheffield United" and "Sheffield Utd".
ALLOWED_SEASON_MERGES = {"mechelen", "sheffield_united"}


def season_names() -> set[str]:
    """Every club spelling the season files use, verbatim."""
    out: set[str] = set()
    for path in sorted((ROOT / "data" / "processed" / "seasons").glob("*/*.json")):
        if path.name == "index.json":
            continue
        for row in json.loads(path.read_text(encoding="utf-8")):
            out.add(row["home_team"])
            out.add(row["away_team"])
    return out


def guard_season_injectivity(canon: dict[str, str]) -> list[str]:
    """Refuse any merge that puts two different season clubs on one key.

    The season vocabulary is the one place where two spellings are two clubs
    unless ALLOWED_SEASON_MERGES says otherwise, so it is the cheapest hard
    stop for the failure that matters: a wrong merge invents fixtures between
    real clubs ("Dundee United" stripped to "dundee" would pair Dundee FC with
    itself). Refusing restores each spelling to its own key, which under-merges
    -- the safe direction. Evidence folds (see unique_superset_merges) run after
    this and carry their own, stronger test.
    """
    by_key: dict[str, set[str]] = defaultdict(set)
    for name in season_names():
        s = slug(name)
        by_key[canon.get(s, s)].add(name)

    refused: list[str] = []
    for key, spellings in by_key.items():
        if len(spellings) < 2 or key in ALLOWED_SEASON_MERGES:
            continue
        refused.append(f"{key} <- {', '.join(sorted(spellings))}")
        for name in spellings:
            s = slug(name)
            if canon.get(s, s) != s:
                canon.pop(s, None)
    return refused


def render_registry(canon: dict[str, str], n_names: int, n_groups: int) -> str:
    entries = "\n".join(f'  "{a}": "{b}",' for a, b in sorted(canon.items()))
    return f"""// AUTO-GENERATED by src/build_teams.py -- do not edit by hand.
// Canonical team ids: {n_names} distinct data names collapse to {n_groups}
// canonical keys ({len(canon)} of them via the map below; the rest are already
// their own key). Raw names from any source resolve to the same key only if
// they ARE the same club — "Arsenal FC", "Arsenal" and FC Arsenal all map to
// "arsenal".

/** snake variant -> canonical key, for names that differ from it. */
const CANON: Record<string, string> = {{
{entries}
}};

/** Same normalisation as snake() in src/build_logos.py.
 * Ticket prefixes ("#10 – Ferencvaros") are stripped first — they are
 * jackpot draw numbering, not part of the club name. */
function normalizeName(value: string): string {{
  return value
    .replace(/^#\\d+\\s*[–—-]\\s*/, "")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^\\x00-\\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}}

/**
 * Canonical team id for any team spelling from any source. Names that are the
 * same club share an id; unrelated clubs keep their full snake name. Do not
 * compare raw team strings — canonicalize both sides first.
 */
export function canonicalTeam(value: string): string {{
  const key = normalizeName(value);
  if (!key) return "";
  return CANON[key] ?? key;
}}
"""


# A club's own league is the evidence that two spellings are two clubs.
# Continental competitions ("Champions League", "Libertadores") say nothing
# about a club's country, so rows in them are skipped rather than counted.
LEAGUE_COUNTRIES = {
    "England", "Scotland", "Germany", "Italy", "Spain", "France",
    "Netherlands", "Portugal", "Belgium", "Turkey", "Greece", "Brazil",
    "Argentina", "Uruguay", "Paraguay", "Colombia", "Chile", "Peru",
    "Ecuador", "Venezuela", "Bolivia", "Belarus", "Ukraine", "Russia",
    "Croatia", "Serbia", "Switzerland", "Austria", "Denmark", "Norway",
    "Sweden", "Finland", "Iceland", "Poland", "Czech", "Romania",
    "Bulgaria", "Slovakia", "Slovenia", "Hungary", "Kazakhstan",
    "South Africa", "Kenya", "Nigeria", "Egypt", "Tunisia", "Morocco",
    "Algeria", "Ghana", "Cameroon", "Japan", "South Korea", "China",
    "Australia", "USA", "Canada", "Mexico", "Costa Rica", "Honduras",
    "Guatemala", "El Salvador", "Panama", "Cuba", "Jamaica", "Trinidad",
    "Dominican", "Nicaragua", "Puerto Rico", "Uruguay", "Ireland",
    "Israel", "Cyprus", "Latvia", "Lithuania", "Estonia", "Georgia",
    "Armenia", "Azerbaijan", "Albania", "Bosnia", "Macedonia", "Montenegro",
}


def league_country(league: str | None) -> str | None:
    """Country half of a "Country – League" string, or None for continental
    competitions and blanks."""
    if not league or "–" not in league:
        return None
    head = league.split("–")[0].strip()
    return head if head in LEAGUE_COUNTRIES else None


def country_evidence(canon: dict[str, str]) -> dict[str, dict[str, Counter]]:
    """canonical key -> spelling -> the league countries that spelling is played in.

    Continental competitions ("World – CONMEBOL Sudamericana") say nothing about a
    club's country, so rows in them are skipped rather than counted.
    """
    key_of = lambda raw: canon.get(slug(raw), slug(raw))  # noqa: E731
    out: dict[str, dict[str, Counter]] = defaultdict(lambda: defaultdict(Counter))
    for path in data_paths():
        try:
            rows = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            country = league_country(row.get("league"))
            if not country:
                continue
            for field in ("home_team", "away_team"):
                raw = row.get(field)
                if isinstance(raw, str) and raw.strip():
                    out[key_of(raw.strip())][raw.strip()][country] += 1
    return out


def ambiguous_keys(canon: dict[str, str]) -> list[dict]:
    """Keys whose rows span 2+ league countries -- the review list, since a
    merged id for two different clubs invents fixtures between them.

    Each entry names the variant spellings that land on the key. A variant that
    is *itself* multi-country ("Athletic Club" plays in Spain and Brazil) is a
    limit of the data: no spelling rule can split it, and the row-level join is
    the only way to tell the clubs apart. A key built only from single-country
    variants is a merge to fix -- drop the edge or add the spelling to
    KEEP_DISTINCT.
    """
    review = []
    for key, spellings in country_evidence(canon).items():
        by_country: Counter = Counter()
        for variants in spellings.values():
            by_country.update(variants)
        if len(by_country) < 2:
            continue

        # one row per distinct snake variant, so "Arsenal" and "Arsenal FC" that
        # both mean one club are not mistaken for two countries' clubs
        variants: dict[str, Counter] = defaultdict(Counter)
        for spelling, countries in spellings.items():
            variants[slug(spelling)].update(countries)

        multi = [v for v, c in variants.items() if len(c) >= 2]
        parts = ";".join(
            f"{v}({','.join(f'{c}:{n}' for c, n in sorted(cs.items()))})"
            + ("<-" if canon.get(v, v) != v else "")
            for v, cs in sorted(variants.items())
        )
        review.append({
            "key": key,
            "countries": ";".join(f"{c}={n}" for c, n in by_country.most_common()),
            "fixable": "no" if multi else "yes",
            "variants": parts,
        })
    return sorted(review, key=lambda r: r["key"])


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    names = collect_names()
    by_slug: dict[str, Counter] = defaultdict(Counter)
    for raw, n in names.items():
        s = slug(raw)
        if s:
            by_slug[s][raw] = n

    canon = build_canon(names)
    refused = guard_season_injectivity(canon)
    folded, split, kept_apart = unique_superset_merges(canon)
    canonical_of = lambda s: canon.get(s, s)  # noqa: E731
    groups: dict[str, Counter] = defaultdict(Counter)
    for s, variants in by_slug.items():
        canonical_of(s)
        groups[canonical_of(s)][s] = sum(variants.values())

    merged_occurrences = sum(
        c for cs in groups.values() for s, c in cs.items() if canonical_of(s) != s
    )
    print(f"{sum(names.values()):,d} name occurrences, {len(by_slug)} distinct "
          f"snake names -> {len(groups)} canonical keys")
    print(f"{len(canon)} names remapped; those variants cover "
          f"{merged_occurrences:,d} occurrences")

    print(f"\n{len(refused)} merges refused because they collided with two "
          "season clubs (add to ALLOWED_SEASON_MERGES if a pair is one club):")
    for line in refused:
        print(f"  refused  {line}")

    print(f"\n{len(folded)} short names folded into the one fuller name whose fixtures "
          "match theirs (shared competition, never each other's opponent, >=1 shared "
          "opponent):")
    for line in folded:
        print(f"  folded   {line}")

    print(f"\n{len(kept_apart)} pairs KEEP_DISTINCT holds apart despite the evidence:")
    for r in kept_apart:
        print(f"  apart    {r['key']} != {r['variants']}")

    # The one invariant every rule has to keep: no id may face itself. A row whose
    # two sides share an id is a merge that invented a fixture.
    self_rows = {
        k: v for k, v in id_evidence(canon).items() if v["self_matches"]
    }
    print(f"\n{len(self_rows)} ids appear against themselves (each one is a merge to undo):")
    for k, e in sorted(self_rows.items(), key=lambda x: -sum(x[1]["self_matches"].values())):
        fixtures = ", ".join(f"{f} x{n}" for f, n in e["self_matches"].most_common(3))
        print(f"  self-match {k}: {fixtures}")

    print("\nALL merged clubs (canonical <- data spellings, by occurrences) — "
          "review for clubs this wrongly merges:")
    merged = sorted(
        (c, k, cs) for k, cs in groups.items()
        if len(cs) > 1
        for c in (sum(cs.values()),)
    )
    merged.sort(key=lambda x: -x[0])
    for total, key, cs in merged:
        spellings = sorted(cs, key=lambda s: -cs[s])
        print(f"  {total:>6,}  {key:28} <- {', '.join(spellings[:6])}")

    review = ambiguous_keys(canon) + split + kept_apart
    for r in review:
        r.setdefault("kind", "rows in 2+ countries")
    print(f"\n{len(review)} REVIEW LIST rows -- ids that mix two countries' clubs, or "
          "short names the fixtures cannot give an owner ('<-' = that variant merged "
          "in; fixable=yes means a merge edge to drop):")
    for r in review:
        print(f"  {r['key']:22} [{r['fixable']:8}] {r['kind']:36} "
              f"{r['countries']:34} {r['variants']}")

    if dry_run:
        return

    TS_OUT.write_text(
        render_registry(canon, len(by_slug), len(groups)), encoding="utf-8"
    )
    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(
        json.dumps(canon, indent=1, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    with REVIEW_OUT.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["key", "kind", "fixable", "countries", "variants"])
        writer.writeheader()
        writer.writerows(review)
    print(f"\nwrote {TS_OUT.relative_to(ROOT)}, {JSON_OUT.relative_to(ROOT)} "
          f"and {REVIEW_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
