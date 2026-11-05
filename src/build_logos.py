#!/usr/bin/env python3
"""Rename public/logos/*.svg to short lower-snake-case keys and regenerate
src/lib/logoRegistry.ts from the same mapping.

Usage:
    uv run python src/build_logos.py             # rename files + regenerate registry
    uv run python src/build_logos.py --dry-run   # report only, write nothing

MAPPING below is the single source of truth: it is applied to the files under
public/logos/ and used to emit the TypeScript registry, so the two can never
drift. Renames are idempotent -- a stem already carrying its new key is
skipped, so the script can be re-run at any time.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOGOS_DIR = ROOT / "public" / "logos"
REGISTRY_TS = ROOT / "src" / "lib" / "logoRegistry.ts"

# Old path relative to public/logos (without .svg) -> new key.
MAPPING: dict[str, str] = {
    # --- bundesliga_1 -------------------------------------------------------
    "bundesliga_1/01-FC-Augsburg-v2002": "augsburg",
    "bundesliga_1/02-FC-Union-Berlin-v1966": "union_berlin",
    "bundesliga_1/03-SV-Werder-Bremen-v1981": "werder_bremen",
    "bundesliga_1/04-Borussia-Dortmund-v1993": "dortmund",
    "bundesliga_1/05-SV-Elversberg-v2021": "elversberg",
    "bundesliga_1/06-Eintracht-Frankfurt-v1998": "eintracht_frankfurt",
    "bundesliga_1/07-SC-Freiburg-v2008": "freiburg",
    "bundesliga_1/08-Hamburger-SV-v1978": "hamburger_sv",
    "bundesliga_1/09-TSG-Hoffenheim-v2014": "hoffenheim",
    "bundesliga_1/10-FC-Koln-v1993": "koln",
    "bundesliga_1/11-RB-Leipzig-v2020": "leipzig",
    "bundesliga_1/12-Bayer-04-Leverkusen-v2006": "leverkusen",
    "bundesliga_1/13-FSV-Mainz-v2018": "mainz",
    "bundesliga_1/14-Borussia-Monchengladbach-v1999": "gladbach",
    "bundesliga_1/15-FC-Bayern-Munchen-v2024": "bayern",
    "bundesliga_1/16-SC-Paderborn-07-v1997": "paderborn",
    "bundesliga_1/17-FC-Schalke-04-v1995": "schalke",
    "bundesliga_1/18-VfB-Stuttgart-v2014": "stuttgart",
    # --- bundesliga_2 -------------------------------------------------------
    "bundesliga_2/01-Hertha-BSC-v2012": "hertha",
    "bundesliga_2/02-Arminia-Bielefeld-v2021": "bielefeld",
    "bundesliga_2/03-Eintracht-Braunschweig-v2012": "braunschweig",
    "bundesliga_2/04-fuballclub-energie-cottbus-e-v-v2005": "cottbus",
    "bundesliga_2/05-Dynamo-Dresden-v2011": "dresden",
    "bundesliga_2/06-Hannover-96-v2007": "hannover",
    "bundesliga_2/07-1-FC-Kaiserslautern-v2012": "kaiserslautern",
    "bundesliga_2/08-Karlsruher-SC-v2005": "karlsruhe",
    "bundesliga_2/09-Holstein-Kiel-v0000": "holstein_kiel",
    "bundesliga_2/10-1-FC-Magdeburg-v0000": "magdeburg",
    "bundesliga_2/11-verein-fur-leibesubungen-von-1899-ev-osnabruck-v2021": "osnabruck",
    "bundesliga_2/12-FC-St-Pauli-v2001": "st_pauli",
    "bundesliga_2/13-vfl-wolfsburg-fuball-gmbh-v2026": "wolfsburg",
    "bundesliga_2/14-VfL-Bochum-v2000": "bochum",
    "bundesliga_2/15-SV-Darmstadt-98-v2015": "darmstadt",
    "bundesliga_2/16-SpVgg-Greuther-Furth-v2017": "greuther_furth",
    "bundesliga_2/17-FC-Heidenheim-v2007": "heidenheim",
    "bundesliga_2/18-1-FC-Nurnberg-v2011": "nurnberg",
    # --- championship -------------------------------------------------------
    "championship/01-birmingham-city-football-club-v1976": "birmingham",
    "championship/02-blackburn-rovers-football-club-v1989": "blackburn",
    "championship/03-bolton-wanderers-football-club-v2013": "bolton",
    "championship/04-bristol-city-football-club-v2019": "bristol_city",
    "championship/05-Burnley-FC-v2023": "burnley",
    "championship/06-cardiff-city-football-club-v2015": "cardiff",
    "championship/07-charlton-athletic-football-club-v1980": "charlton",
    "championship/08-derby-county-football-club-v2012": "derby",
    "championship/09-lincoln-city-football-club-v2024": "lincoln",
    "championship/10-middlesbrough-football-club-v2026": "middlesbrough",
    "championship/11-millwall-football-club-v2014": "millwall",
    "championship/12-norwich-city-football-club-v2022": "norwich",
    "championship/13-portsmouth-football-club-v2018": "portsmouth",
    "championship/14-preston-north-end-football-club-v2014": "preston",
    "championship/15-queens-park-rangers-football-club-v2016": "qpr",
    "championship/16-sheffield-united-football-club-v1999": "sheffield_united",
    "championship/17-Southampton-Football-Club-v1995": "southampton",
    "championship/18-stoke-city-football-club-v2026": "stoke",
    "championship/19-swansea-city-association-football-club-v2023": "swansea",
    "championship/20-watford-football-club-v2001": "watford",
    "championship/21-west-bromwich-albion-football-club-v2008": "west_brom",
    "championship/22-West-Ham-United-Football-Club-v2016": "west_ham",
    "championship/23-Wolverhampton-Wanderers-FC-v2002": "wolves",
    "championship/24-wrexham-association-football-club-v2015": "wrexham",
    # --- eredivisie ---------------------------------------------------------
    "eredivisie/01-alles-door-oefening-den-haag-v2004": "den_haag",
    "eredivisie/02-amsterdamsche-football-club-ajax-v2025": "ajax",
    "eredivisie/03-alkmaar-zaanstreek-v1986": "alkmaar",
    "eredivisie/04-sportclub-cambuur-v0000": "cambuur",
    "eredivisie/05-stichting-betaald-voetbal-excelsior-v2021": "excelsior",
    "eredivisie/06-feyenoord-rotterdam-v2024": "feyenoord",
    "eredivisie/07-fortuna-sittard-v1999": "fortuna_sittard",
    "eredivisie/08-go-ahead-eagles-v2007": "go_ahead_eagles",
    "eredivisie/09-football-club-groningen-v2022": "groningen",
    "eredivisie/10-sportclub-heerenveen-v2010": "heerenveen",
    "eredivisie/11-nijmegen-eendracht-combinatie-v2001": "nijmegen",
    "eredivisie/12-prins-hendrik-ende-desespereert-nimmer-combinatie-zwolle-v2012": "zwolle",
    "eredivisie/13-philips-sport-vereniging-v2016": "psv",
    "eredivisie/14-sparta-rotterdam-v2014": "sparta_rotterdam",
    "eredivisie/15-sportclub-telstar-v2008": "telstar",
    "eredivisie/16-football-club-twente-v2006": "twente",
    "eredivisie/17-football-club-utrecht-v2021": "utrecht",
    "eredivisie/18-willem-ii-tilburg-v2026": "willem_ii",
    # --- laliga_primera -----------------------------------------------------
    "laliga_primera/01-Deportivo-Alaves-v2020": "alaves",
    "laliga_primera/02-Athletic-Club-Bilbao-v2008": "athletic_bilbao",
    "laliga_primera/03-Atletico-Madrid-v2024": "atletico_madrid",
    "laliga_primera/04-FC-Barcelona-v2002": "barcelona",
    "laliga_primera/05-RC-Celta-de-Vigo-v2010": "celta_vigo",
    "laliga_primera/06-real-club-deportivo-de-la-corua-v2026": "la_coruna",
    "laliga_primera/07-Elche-CF-v2012": "elche",
    "laliga_primera/08-RCD-Espanyol-v2005": "espanyol",
    "laliga_primera/09-Getafe-Club-de-Futbol-v2011": "getafe",
    "laliga_primera/10-Levante-UD-v2010": "levante",
    "laliga_primera/11-Malaga-CF-v2011": "malaga",
    "laliga_primera/12-Club-Atletico-Osasuna-v2004": "osasuna",
    "laliga_primera/13-Racing-de-Santander-v2003": "santander",
    "laliga_primera/14-Rayo-Vallecano-de-Madrid-v2012": "rayo_vallecano",
    "laliga_primera/15-Real-Betis-v2022": "betis",
    "laliga_primera/16-Real-Madrid-CF-v2002": "real_madrid",
    "laliga_primera/17-Real-Sociedad-de-Futbol-v1997": "real_sociedad",
    "laliga_primera/18-Sevilla-Futbol-Club-v1995": "sevilla",
    "laliga_primera/19-Valencia-Club-de-Futbol-v2012": "valencia",
    "laliga_primera/20-Villarreal-Club-de-Futbol-v2009": "villarreal",
    # --- laliga_segunda -----------------------------------------------------
    "laliga_segunda/01-Albacete-Balompie-v2009": "albacete",
    "laliga_segunda/02-UD-Almeria-v2015": "almeria",
    "laliga_segunda/03-FC-Andorra-v2021": "andorra",
    "laliga_segunda/04-Burgos-CF-v1994": "burgos",
    "laliga_segunda/05-Cadiz-CF-v2009": "cadiz",
    "laliga_segunda/06-CD-Castellon-v2015": "castellon",
    "laliga_segunda/07-RC-Celta-de-Vigo-v2010": "celta_vigo",
    "laliga_segunda/08-AD-Ceuta-FC-v2013": "ceuta",
    "laliga_segunda/09-Cordoba-CF-v2012": "cordoba",
    "laliga_segunda/10-SD-Eibar-v2015": "eibar",
    "laliga_segunda/11-CD-Eldense-v2013": "eldense",
    "laliga_segunda/12-Girona-Futbol-Club-v2021": "girona",
    "laliga_segunda/13-Granada-CF-v2023": "granada",
    "laliga_segunda/14-UD-Las-Palmas-v2011": "las_palmas",
    "laliga_segunda/15-Club-Deportivo-Leganes-v2014": "leganes",
    "laliga_segunda/16-Real-Club-Deportivo-Mallorca-v1996": "mallorca",
    "laliga_segunda/17-Real-Oviedo-v2019": "oviedo",
    "laliga_segunda/18-Real-Sociedad-de-Futbol-v1997": "real_sociedad",
    "laliga_segunda/19-centre-desports-sabadell-futbol-club-v1980": "sabadell",
    "laliga_segunda/20-Real-Sporting-de-Gijon-v2000": "sporting_gijon",
    "laliga_segunda/21-CD-Tenerife-v1992": "tenerife",
    "laliga_segunda/22-Real-Valladolid-Club-de-Futbol-v2024": "valladolid",
    # --- ligue_1 ------------------------------------------------------------
    "ligue_1/01-Angers-SCO-v2021": "angers",
    "ligue_1/02-AJ-Auxerre-v2006": "auxerre",
    "ligue_1/03-Stade-Brestois-29-v2010": "brest",
    "ligue_1/04-Le-Havre-AC-v2012": "le_havre",
    "ligue_1/05-le-mans-football-club-v2010": "le_mans",
    "ligue_1/06-Racing-Club-de-Lens-v2014": "lens",
    "ligue_1/07-LOSC-Lille-v2018": "lille",
    "ligue_1/08-FC-Lorient-v2010": "lorient",
    "ligue_1/09-Olympique-lyonnais-v2022": "lyon",
    "ligue_1/10-olympique-de-marseille-v2026": "marseille",
    "ligue_1/11-AS-Monaco-v2021": "monaco",
    "ligue_1/12-OGC-Nice-v2013": "nice",
    "ligue_1/13-Paris-FC-v2011": "paris_fc",
    "ligue_1/14-Paris-Saint-Germain-v2013": "psg",
    "ligue_1/15-Stade-Rennais-v2003": "rennes",
    "ligue_1/16-RC-Strasbourg-v2012": "strasbourg",
    "ligue_1/17-Toulouse-FC-v2021": "toulouse",
    "ligue_1/18-esprance-sportive-troyes-aube-champagne-v2007": "troyes",
    # --- ligue_2 ------------------------------------------------------------
    "ligue_2/01-dijon-football-cote-dor-v2014": "dijon",
    "ligue_2/02-grenoble-foot-38-v2018": "grenoble",
    "ligue_2/03-en-avant-guingamp-v2019": "guingamp",
    "ligue_2/04-Montpellier-HSC-v2000": "montpellier",
    "ligue_2/05-Stade-de-Reims-v2020": "reims",
    "ligue_2/06-Football-Club-de-Nantes-v2019": "nantes",
    "ligue_2/07-football-club-sochaux-montbeliard-v2015": "sochaux",
    "ligue_2/08-football-club-dannecy-v2022": "annecy",
    "ligue_2/09-union-sportive-boulogne-cte-dopale-v2025": "boulogne",
    "ligue_2/10-clermont-foot-63-v2021": "clermont",
    "ligue_2/11-union-sportive-du-littoral-de-dunkerque-v2025": "dunkerque",
    "ligue_2/12-stade-lavallois-mayenne-football-club-v2022": "laval",
    "ligue_2/13-FC-Metz-v2021": "metz",
    "ligue_2/14-pau-football-club-v2022": "pau",
    "ligue_2/15-red-star-football-club-v2014": "red_star",
    "ligue_2/16-rodez-aveyron-football-v2017": "rodez",
    "ligue_2/17-AS-Saint-Etienne-v2022": "saint_etienne",
    "ligue_2/18-association-sportive-nancy-lorraine-v2018": "nancy",
    # --- premier_league -----------------------------------------------------
    "premier_league/01-Arsenal-FC-v2002": "arsenal",
    "premier_league/02-Aston-Villa-Football-Club-v2024": "aston_villa",
    "premier_league/03-AFC-Bournemouth-v2013": "bournemouth",
    "premier_league/04-Brentford-Football-Club-v2017": "brentford",
    "premier_league/05-Brighton-Hove-Albion-v2011": "brighton",
    "premier_league/06-chelsea-football-club-v2026": "chelsea",
    "premier_league/07-coventry-city-football-club-v2012": "coventry",
    "premier_league/08-Crystal-Palace-Football-Club-v2022": "crystal_palace",
    "premier_league/09-Everton-Football-Club-v2014": "everton",
    "premier_league/10-Fulham-Football-Club-v2001": "fulham",
    "premier_league/11-hull-city-association-football-club-v2014": "hull",
    "premier_league/12-Ipswich-Town-Football-Club-v1995": "ipswich",
    "premier_league/13-Leeds-United-v2002": "leeds",
    "premier_league/14-Liverpool-Football-Club-v2024-minor": "liverpool",
    "premier_league/15-Manchester-City-v2016": "man_city",
    "premier_league/16-Manchester-United-Football-Club-v1998": "man_united",
    "premier_league/17-Newcastle-United-Football-Club-v1988": "newcastle",
    "premier_league/18-Nottingham-Forest-Football-Club-v2010": "nottingham_forest",
    "premier_league/19-Sunderland-AFC-v1997": "sunderland",
    "premier_league/20-Tottenham-Hotspur-Football-Club-v2024": "tottenham",
    # --- primeira_liga ------------------------------------------------------
    "primeira_liga/01-academico-de-viseu-futebol-clube-v0000": "academico_viseu",
    "primeira_liga/02-futebol-clube-de-alverca-v2005": "alverca",
    "primeira_liga/03-futebol-clube-de-arouca-v2006": "arouca",
    "primeira_liga/04-Sport-Lisboa-e-Benfica-v1999": "benfica",
    "primeira_liga/05-sporting-clube-de-braga-v2018": "braga",
    "primeira_liga/06-casa-pia-atletico-clube-v2019": "casa_pia",
    "primeira_liga/07-grupo-desportivo-estoril-praia-v1981": "estoril",
    "primeira_liga/08-club-football-estrela-amadora-sad-v2020": "estrela",
    "primeira_liga/09-futebol-clube-de-famalicao-v2018": "famalicao",
    "primeira_liga/10-gil-vicente-futebol-clube-v2021": "gil_vicente",
    "primeira_liga/11-club-sport-maritimo-v2022": "maritimo",
    "primeira_liga/12-moreirense-futebol-clube-v2004": "moreirense",
    "primeira_liga/13-clube-desportivo-nacional-v1990": "nacional",
    "primeira_liga/14-Futebol-Clube-do-Porto-v2002": "porto",
    "primeira_liga/15-rio-ave-futebol-clube-v1989": "rio_ave",
    "primeira_liga/16-clube-desportivo-santa-clara-v2024": "santa_clara",
    "primeira_liga/17-sporting-clube-de-portugal-v2026": "sporting",
    "primeira_liga/18-vitoria-sport-clube-v1999": "guimaraes",
    # --- pro_league ---------------------------------------------------------
    "pro_league/01-koninklijke-racing-club-genk-v2026": "genk",
    "pro_league/02-royal-sporting-club-anderlecht-v2024": "anderlecht",
    "pro_league/03-royal-antwerp-football-club-v0000": "antwerp",
    "pro_league/04-sportkring-beveren-v0000": "beveren",
    "pro_league/05-cercle-brugge-koninklijke-sportvereniging-v2023": "cercle_brugge",
    "pro_league/06-royal-charleroi-sporting-club-v0000": "charleroi",
    "pro_league/07-club-brugge-koninklijke-voetbalvereniging-v2017": "club_brugge",
    "pro_league/08-koninklijke-atletiek-associatie-gent-v2013": "gent",
    "pro_league/09-koninklijke-voetbalclub-kortrijk-v0000": "kortrijk",
    "pro_league/10-royal-association-athletique-louvieroise-la-louviere-v2025": "la_louviere",
    "pro_league/11-lommel-sportkring-v2022": "lommel",
    "pro_league/12-yellow-red-koninklijke-voetbalclub-mechelen-v2024": "mechelen",
    "pro_league/13-koninklijke-sint-truidense-voetbalvereniging-v0000": "st_truiden",
    "pro_league/14-royal-standard-de-liege-v2024": "standard",
    "pro_league/15-royale-union-saint-gilloise-v2015": "union_sg",
    "pro_league/16-sportvereniging-zulte-waregem-v2021": "waregem",
    "pro_league/17-oud-heverlee-leuven-v2023": "ohl",
    "pro_league/18-koninklijke-voetbal-club-westerlo-v2019": "westerlo",
    # --- serie_a ------------------------------------------------------------
    "serie_a/01-atalanta-bergamasca-calcio-v2026": "atalanta",
    "serie_a/02-Bologna-FC-v2018": "bologna",
    "serie_a/03-Cagliari-Calcio-v2015": "cagliari",
    "serie_a/04-Como-1907-v2019": "como",
    "serie_a/05-ACF-Fiorentina-v2022": "fiorentina",
    "serie_a/06-frosinone-calcio-v2011": "frosinone",
    "serie_a/07-Genoa-CFC-v2022": "genoa",
    "serie_a/08-FC-Inter-Milan-v2021": "inter",
    "serie_a/09-Juventus-FC-v2017": "juventus",
    "serie_a/10-SS-Lazio-v1993": "lazio",
    "serie_a/11-US-Lecce-v2001": "lecce",
    "serie_a/12-AC-Milan-v2009": "milan",
    "serie_a/13-AC-Monza-v2021": "monza",
    "serie_a/14-societ-sportiva-calcio-napoli-v2024": "napoli",
    "serie_a/15-Parma-Calcio-1913-v2016": "parma",
    "serie_a/16-US-Sassuolo-Calcio-v2010": "sassuolo",
    "serie_a/17-associazione-sportiva-roma-v2026": "roma",
    "serie_a/18-venezia-football-club-v2026": "venezia",
    "serie_a/19-Torino-FC-v2005": "torino",
    "serie_a/20-Udinese-Calcio-v2010": "udinese",
    # --- serie_b ------------------------------------------------------------
    "serie_b/01-societa-sportiva-arezzo-v0000": "arezzo",
    "serie_b/02-ascoli-calcio-1898-fc-v2026": "ascoli",
    "serie_b/03-unione-sportiva-avellino-1912-v2015": "avellino",
    "serie_b/04-benevento-calcio-v0000": "benevento",
    "serie_b/05-carrarese-calcio-1908-v0000": "carrarese",
    "serie_b/06-unione-sportiva-catanzaro-1929-v2018": "catanzaro",
    "serie_b/07-cesena-football-club-v2018": "cesena",
    "serie_b/08-US-Cremonese-v1997": "cremonese",
    "serie_b/09-Empoli-FC-v2021": "empoli",
    "serie_b/10-Hellas-Verona-v2020": "verona",
    "serie_b/11-societ-sportiva-juve-stabia-v2022": "juve_stabia",
    "serie_b/12-mantova-1911-v2017": "mantova",
    "serie_b/13-modena-football-club-v2018": "modena",
    "serie_b/14-calcio-padova-v2018": "padova",
    "serie_b/15-palermo-football-club-v2019": "palermo",
    "serie_b/16-Pisa-SC-v2017": "pisa",
    "serie_b/17-unione-calcio-sampdoria-v1997": "sampdoria",
    "serie_b/18-fussball-club-sudtirol-v2016": "sudtirol",
    "serie_b/19-lanerossi-vicenza-v2018": "vicenza",
    "serie_b/20-virtus-entella-v2026": "virtus_entella",
    # --- super_league (Greece) ----------------------------------------------
    "super_league/01-aek-football-club-v2014": "aek",
    "super_league/02-aris-thessaloniki-football-club-v0000": "aris",
    "super_league/03-panathinaikos-football-club-v1995": "panathinaikos",
    "super_league/04-olympiacos-football-club-v2003": "olympiacos",
    "super_league/05-athlitiki-enosi-kifisia-football-club-v2024": "kifisia",
    "super_league/06-ofi-football-club-v2020": "ofi",
    "super_league/07-kalamata-football-club-v2022": "kalamata",
    "super_league/08-asteras-tripolis-football-club-v2020": "asteras_tripolis",
    "super_league/09-atromitos-football-club-v2018": "atromitos",
    "super_league/10-iraklis-football-club-v2024": "iraklis",
    "super_league/11-apo-levadiakos-football-club-v0000": "levadiakos",
    "super_league/12-panetolikos-football-club-v2018": "panetolikos",
    "super_league/13-paok-football-club-v2013": "paok",
    "super_league/14-volos-football-club-v0000": "volos",
    # --- super_lig (Turkey) -------------------------------------------------
    "super_lig/01-alanyaspor-kulubu-v0000": "alanyaspor",
    "super_lig/02-amed-sportif-faaliyetler-kulubu-v0000": "amedspor",
    "super_lig/03-istanbul-basaksehir-futbol-kulubu-v2016": "basaksehir",
    "super_lig/04-besiktas-jimnastik-kulubu-v2000": "besiktas",
    "super_lig/05-corum-futbol-kulubu-v0000": "corum",
    "super_lig/06-erzurumspor-futbol-kulubu-v2025": "erzurumspor",
    "super_lig/07-eyupspor-kulubu-v0000": "eyupspor",
    "super_lig/08-fenerbahce-spor-kulubu-v2026-comm": "fenerbahce",
    "super_lig/09-galatasaray-spor-kulb-v2007": "galatasaray",
    "super_lig/10-gaziantep-futbol-kulubu-v2017": "gaziantep",
    "super_lig/11-genclerbirligi-spor-kulubu-v0000": "genclerbirligi",
    "super_lig/12-goztepe-spor-kulubu-v2009": "goztepe",
    "super_lig/13-kasmpasa-spor-kulubu-v2012": "kasimpasa",
    "super_lig/14-kocaelispor-kulubu-v0000": "kocaelispor",
    "super_lig/15-konyaspor-kulubu-v1990": "konyaspor",
    "super_lig/16-caykur-rize-spor-kulubu-v1991": "rizespor",
    "super_lig/17-samsunspor-futbol-kulubu-v0000": "samsunspor",
    "super_lig/18-trabzonspor-kulubu-v2022": "trabzonspor",
    # --- sco_championship (Scotland) ----------------------------------------
    # Keys are the canonical ids in src/lib/teamRegistry.ts (see build_teams.py),
    # not the literal file stem: getLogo resolves through canonicalTeam.
    "sco_championship/scotland_arbroath.football-logos.cc": "arbroath",
    "sco_championship/scotland_ayr.football-logos.cc": "ayr_utd",
    "sco_championship/scotland_dunfermline.football-logos.cc": "dunfermline",
    "sco_championship/scotland_inverness.football-logos.cc": "inverness_caledonian_thistle",
    "sco_championship/scotland_livingston.football-logos.cc": "livingston",
    "sco_championship/scotland_morton.football-logos.cc": "morton",
    "sco_championship/scotland_partick.football-logos.cc": "partick",
    "sco_championship/scotland_queen-s-park.football-logos.cc": "queens_park",
    "sco_championship/scotland_raith.football-logos.cc": "raith",
    "sco_championship/scotland_stenhousemuir.football-logos.cc": "stenhousemuir",
    # --- sco_premier_league (Scotland) --------------------------------------
    "sco_premier_league/scotland_aberdeen.football-logos.cc": "aberdeen",
    "sco_premier_league/scotland_celtic.football-logos.cc": "celtic_glasgow",
    "sco_premier_league/scotland_dundee-united.football-logos.cc": "dundee_utd",
    "sco_premier_league/scotland_dundee.football-logos.cc": "dundee",
    "sco_premier_league/scotland_falkirk.football-logos.cc": "falkirk",
    "sco_premier_league/scotland_hearts.football-logos.cc": "hearts",
    "sco_premier_league/scotland_hibernian.football-logos.cc": "hibernian",
    "sco_premier_league/scotland_kilmarnock.football-logos.cc": "kilmarnock",
    "sco_premier_league/scotland_motherwell.football-logos.cc": "motherwell",
    "sco_premier_league/scotland_rangers.football-logos.cc": "glasgow_rangers",
    "sco_premier_league/scotland_st-johnstone.football-logos.cc": "st_johnstone",
    "sco_premier_league/scotland_st-mirren.football-logos.cc": "st_mirren",
    # --- ethniki_katigoria (Greece) -----------------------------------------
    # Same clubs as super_league/; the folder records provenance, and duplicate
    # keys are allowed (celta_vigo, real_sociedad live in two folders too).
    "ethniki_katigoria/greece_aek-athens.football-logos.cc": "aek",
    "ethniki_katigoria/greece_aris-thessaloniki.football-logos.cc": "aris",
    "ethniki_katigoria/greece_asteras.football-logos.cc": "asteras_tripolis",
    "ethniki_katigoria/greece_atromitos.football-logos.cc": "atromitos",
    "ethniki_katigoria/greece_iraklis-thessaloniki.football-logos.cc": "iraklis",
    "ethniki_katigoria/greece_kalamata.football-logos.cc": "kalamata",
    "ethniki_katigoria/greece_kifisia.football-logos.cc": "kifisia",
    "ethniki_katigoria/greece_levadiakos.football-logos.cc": "levadiakos",
    "ethniki_katigoria/greece_ofi.football-logos.cc": "ofi",
    "ethniki_katigoria/greece_olympiacos.football-logos.cc": "olympiacos",
    "ethniki_katigoria/greece_panathinaikos.football-logos.cc": "panathinaikos",
    "ethniki_katigoria/greece_panetolikos.football-logos.cc": "panetolikos",
    "ethniki_katigoria/greece_paok.football-logos.cc": "paok",
    "ethniki_katigoria/greece_volos.football-logos.cc": "volos",
}

# snake_case(data team name) -> MAPPING value, for names the automatic rules
# below cannot match (abbreviations, alternate spellings, nicknames).
MANUAL_ALIASES: dict[str, str] = {
    "nott_m_forest": "nottingham_forest",
    "sheffield_utd": "sheffield_united",
    "paris_sg": "psg",
    "st_etienne": "saint_etienne",
    "pau_fc": "pau",
    "ath_madrid": "atletico_madrid",
    "ath_bilbao": "athletic_bilbao",
    "sociedad": "real_sociedad",
    "vallecano": "rayo_vallecano",
    "sp_gijon": "sporting_gijon",
    "espanol": "espanyol",
    "for_sittard": "fortuna_sittard",
    "psv_eindhoven": "psv",
    "bayern_munich": "bayern",
    "ein_frankfurt": "eintracht_frankfurt",
    "fc_koln": "koln",
    "m_gladbach": "gladbach",
    "schalke_04": "schalke",
    "sp_lisbon": "sporting",
    "sp_braga": "braga",
    "kv_mechelen": "mechelen",
    "lommel_sk": "lommel",
    "st_gilloise": "union_sg",
    "oud_heverlee_leuven": "ohl",
    "raal_la_louviere": "la_louviere",
    "ofi_crete": "ofi",
    "volos_nfc": "volos",
    "levadeiakos": "levadiakos",
    "olympiakos": "olympiacos",
    "buyuksehyr": "basaksehir",
    "goztep": "goztepe",
    # season/jackpot spellings whose snake form is the historical MAPPING key
    "hamburg": "hamburger_sv",
    "rb_leipzig": "leipzig",
    "az_alkmaar": "alkmaar",
}


def snake(value: str) -> str:
    """Mirror of normalizeTeam() in the generated logoRegistry.ts."""
    value = value.replace("ß", "ss")
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.lower()
    return re.sub(r"[^a-z0-9]+", "_", value).strip("_")


def rename_files(dry_run: bool) -> list[str]:
    """Apply MAPPING to public/logos/. Returns a report of performed/skipped renames."""
    report: list[str] = []
    seen_targets: dict[str, str] = {}
    for rel, key in MAPPING.items():
        folder, old_stem = rel.split("/", 1)
        if key in seen_targets and seen_targets[key] != rel:
            # Same club in two folders (celta, real_sociedad) is fine; the
            # registry keeps the first occurrence.
            pass
        seen_targets.setdefault(key, rel)
        old_path = LOGOS_DIR / folder / f"{old_stem}.svg"
        new_path = LOGOS_DIR / folder / f"{key}.svg"
        if old_path == new_path:
            if not old_path.exists():
                raise SystemExit(f"missing: {old_path}")
            report.append(f"kept     {folder}/{key}.svg (keys file name)")
        elif old_path.exists():
            if new_path.exists():
                raise SystemExit(f"collision: {old_path} and {new_path} both exist")
            if not dry_run:
                old_path.rename(new_path)
            report.append(f"renamed  {rel}.svg -> {folder}/{key}.svg")
        elif new_path.exists():
            report.append(f"kept     {folder}/{key}.svg (already renamed)")
        else:
            raise SystemExit(f"missing: neither {old_path} nor {new_path} exists")
    return report


def verify_folders() -> dict[str, list[str]]:
    """Every file on disk must be a MAPPING target; keys unique within a folder."""
    folders: dict[str, list[str]] = {}
    mapped = set(MAPPING.values())
    for folder in sorted(p.name for p in LOGOS_DIR.iterdir() if p.is_dir()):
        keys = sorted(p.stem for p in (LOGOS_DIR / folder).glob("*.svg"))
        stray = [k for k in keys if k not in mapped]
        if stray:
            raise SystemExit(f"{folder}: files not covered by MAPPING: {stray}")
        if len(keys) != len(set(keys)):
            raise SystemExit(f"{folder}: duplicate keys")
        folders[folder] = keys
    return folders


def collect_data_teams() -> dict[str, set[str]]:
    """source name -> set of snake_case team names, from the processed JSON."""
    sources: dict[str, set[str]] = {}
    paths = list((ROOT / "data" / "processed").glob("*/*.json"))  # jackpot mirror
    paths += [
        p
        for p in (ROOT / "data" / "processed" / "seasons").glob("*/*.json")
        if p.name != "index.json"
    ]
    for path in sorted(paths):
        if path.name == "index.json":
            continue
        source = path.parent.name if path.parent.name == "seasons" else f"{path.parent.name}/{path.stem}"
        try:
            rows = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        if not isinstance(rows, list):
            continue
        names = sources.setdefault(source, set())
        for row in rows:
            if not isinstance(row, dict):
                continue
            for field in ("home_team", "away_team"):
                value = row.get(field)
                if isinstance(value, str) and value.strip():
                    names.add(snake(value))
    return sources


def resolve_alias(name: str, keys: set[str]) -> str | None:
    """Find the logo key for a snake_case data team name, if unambiguous."""
    if name in keys:
        return name
    if name in MANUAL_ALIASES:
        return MANUAL_ALIASES[name]
    # Boundary prefix: "coventry" -> "coventry_city".
    prefix = [k for k in keys if k.startswith(name + "_")]
    if len(prefix) == 1:
        return prefix[0]
    # Token subset: "waregem" -> "zulte_waregem".
    tokens = set(name.split("_"))
    subset = [k for k in keys if tokens <= set(k.split("_"))]
    if len(subset) == 1:
        return subset[0]
    return None


def build_registry(folders: dict[str, list[str]]) -> tuple[dict[str, str], dict[str, str], dict[str, list[str]]]:
    logos: dict[str, str] = {}
    duplicates: dict[str, str] = {}
    for folder, keys in folders.items():
        for key in keys:
            if key in logos:
                duplicates[key] = folder
            else:
                logos[key] = f"/logos/{folder}/{key}.svg"

    aliases: dict[str, str] = {}
    unresolved: dict[str, list[str]] = {}
    for source, names in sorted(collect_data_teams().items()):
        for name in sorted(names):
            target = resolve_alias(name, set(logos))
            if target is None:
                unresolved.setdefault(source, []).append(name)
            elif target != name:
                aliases[name] = target
    return logos, aliases, unresolved


def render_registry(logos: dict[str, str], aliases: dict[str, str]) -> str:
    logo_lines = "\n".join(f'  {key}: "{path}",' for key, path in sorted(logos.items()))
    alias_lines = "\n".join(f'  "{name}": "{target}",' for name, target in sorted(aliases.items()))
    return f"""// AUTO-GENERATED by src/build_logos.py -- do not edit by hand.
// {len(logos)} team logos under public/logos/, {len(aliases)} data-name aliases.
import {{ canonicalTeam }} from "./teamRegistry";

/** Logo key -> static path under public/. */
export const TEAM_LOGOS: Record<string, string> = {{
{logo_lines}
}};

/** snake_case(data team name) -> TEAM_LOGOS key, for names that differ from the file key. */
const TEAM_ALIASES: Record<string, string> = {{
{alias_lines}
}};

/** Same normalisation as snake() in src/build_logos.py.
 * Ticket prefixes ("#10 – Ferencvaros") are stripped first. */
function normalizeTeam(value: string): string {{
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

/** Resolve a team name (as it appears in the data) to its logo path, if one exists. */
export function getLogo(team: string): string | undefined {{
  const key = normalizeTeam(team);
  if (!key) return undefined;
  const viaKey = TEAM_ALIASES[key] ?? key;
  if (TEAM_LOGOS[viaKey]) return TEAM_LOGOS[viaKey];
  // Bookmaker long forms: "Arsenal FC", "Elche CF" canonicalise to the bare
  // club key that owns the file.
  const canon = canonicalTeam(team);
  if (canon && canon !== key) {{
    const viaCanon = TEAM_ALIASES[canon] ?? canon;
    if (TEAM_LOGOS[viaCanon]) return TEAM_LOGOS[viaCanon];
  }}
  return undefined;
}}
"""


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    if len(MAPPING) != 320:
        raise SystemExit(f"MAPPING has {len(MAPPING)} entries, expected 320")

    report = rename_files(dry_run)
    folders = verify_folders()
    logos, aliases, unresolved = build_registry(folders)

    renamed = sum(1 for line in report if line.startswith("renamed"))
    print(f"{renamed} renamed, {len(report) - renamed} already in place, "
          f"{sum(len(v) for v in folders.values())} files verified")

    if dry_run:
        print("\n".join(report))
        print(f"would generate registry: {len(logos)} logos, {len(aliases)} aliases")
        return

    REGISTRY_TS.write_text(render_registry(logos, aliases), encoding="utf-8")
    print(f"wrote {REGISTRY_TS.relative_to(ROOT)} ({len(logos)} logos, {len(aliases)} aliases)")

    total_unresolved = sum(len(v) for v in unresolved.values())
    print(f"\n{total_unresolved} data team names without a logo "
          f"(expected: historical/relegated clubs, Scotland):")
    for source, names in sorted(unresolved.items()):
        print(f"  {source}: {', '.join(names)}")


if __name__ == "__main__":
    main()
