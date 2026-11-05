# Missing team crest SVGs

Clubs whose name occurs in the data but has no `.svg` under `public/logos/`. 
Also see `missing_team_logos.csv` for the machine-readable version of the jackpot side.

## How the data splits

| dataset | deduped jackpot matches | rows missing a side | distinct clubs |
|---|---|---|---|
| betika | 7189 | 3918 (54%) | 1526 |
| mozzart | 30505 | 22703 (74%) | 3472 |
| sportpesa | 3434 | 3394 (98%) | 1408 |

Of the 4691 distinct unresolved jackpot names, the crests for 152 already sit in the repo under a different spelling — those need no download, they resolve once their alias is added. That leaves 4539 genuinely missing crest files.

## 1. Season clubs — the concrete shortlist

These names appear in the per-season league fixtures with no crest file. Add each file named exactly as the suggested key, then rerun `uv run python src/build_logos.py`.

*If a club appears in both a top flight and its second tier (Bordeaux, Ajaccio...), one file under any of the two folders is enough; the suggestion below picks the top flight.*


### `public/logos/bundesliga_2/` (9 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Erzgebirge Aue | `erzgebirge_aue.svg` |
| - [ ] | Fortuna Dusseldorf | `fortuna_dusseldorf.svg` |
| - [ ] | Hansa Rostock | `hansa_rostock.svg` |
| - [ ] | Ingolstadt | `ingolstadt.svg` |
| - [ ] | Preußen Münster | `preussen_munster.svg` |
| - [ ] | Regensburg | `regensburg.svg` |
| - [ ] | Sandhausen | `sandhausen.svg` |
| - [ ] | Ulm | `ulm.svg` |
| - [ ] | Wehen | `wehen_wiesbaden.svg` |

### `public/logos/championship/` (10 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Barnsley | `barnsley.svg` |
| - [ ] | Blackpool | `blackpool.svg` |
| - [ ] | Huddersfield | `huddersfield.svg` |
| - [ ] | Oxford | `oxford.svg` |
| - [ ] | Peterboro | `peterborough.svg` |
| - [ ] | Plymouth | `plymouth.svg` |
| - [ ] | Reading | `reading.svg` |
| - [ ] | Rotherham | `rotherham.svg` |
| - [ ] | Sheffield Weds | `sheffield_wed.svg` |
| - [ ] | Wigan | `wigan.svg` |

### `public/logos/eredivisie/` (7 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Almere City | `almere_city.svg` |
| - [ ] | FC Emmen | `fc_emmen.svg` |
| - [ ] | Heracles | `heracles.svg` |
| - [ ] | NAC Breda | `nac_breda.svg` |
| - [ ] | Vitesse | `vitesse.svg` |
| - [ ] | Volendam | `volendam.svg` |
| - [ ] | Waalwijk | `waalwijk.svg` |

### `public/logos/laliga_segunda/` (15 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Alcorcon | `alcorcon.svg` |
| - [ ] | Amorebieta | `amorebieta.svg` |
| - [ ] | Cartagena | `cartagena.svg` |
| - [ ] | Celta B | `celta_b.svg` |
| - [ ] | Cultural Leonesa | `cultural_leonesa.svg` |
| - [ ] | Ferrol | `ferrol.svg` |
| - [ ] | Fuenlabrada | `fuenlabrada.svg` |
| - [ ] | Huesca | `huesca.svg` |
| - [ ] | Ibiza | `ibiza.svg` |
| - [ ] | Lugo | `lugo.svg` |
| - [ ] | Mirandes | `mirandes.svg` |
| - [ ] | Ponferradina | `ponferradina.svg` |
| - [ ] | Sociedad B | `sociedad_b.svg` |
| - [ ] | Villarreal B | `villarreal_b.svg` |
| - [ ] | Zaragoza | `zaragoza.svg` |

### `public/logos/ligue_1/` (2 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Ajaccio | `ajaccio.svg` |
| - [ ] | Bordeaux | `bordeaux.svg` |

### `public/logos/ligue_2/` (9 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Amiens | `amiens.svg` |
| - [ ] | Bastia | `bastia.svg` |
| - [ ] | Caen | `caen.svg` |
| - [ ] | Concarneau | `concarneau.svg` |
| - [ ] | Martigues | `martigues.svg` |
| - [ ] | Nimes | `nimes.svg` |
| - [ ] | Niort | `niort.svg` |
| - [ ] | Quevilly Rouen | `quevilly_rouen.svg` |
| - [ ] | Valenciennes | `valenciennes.svg` |

### `public/logos/premier_league/` (2 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Leicester | `leicester.svg` |
| - [ ] | Luton | `luton.svg` |

### `public/logos/primeira_liga/` (9 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | AVS | `avs.svg` |
| - [ ] | Belenenses | `belenenses.svg` |
| - [ ] | Boavista | `boavista.svg` |
| - [ ] | Chaves | `chaves.svg` |
| - [ ] | Farense | `farense.svg` |
| - [ ] | Pacos Ferreira | `pacos_ferreira.svg` |
| - [ ] | Portimonense | `portimonense.svg` |
| - [ ] | Tondela | `tondela.svg` |
| - [ ] | Vizela | `vizela.svg` |

### `public/logos/pro_league/` (6 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Beerschot VA | `beerschot.svg` |
| - [ ] | Dender | `dender.svg` |
| - [ ] | Eupen | `eupen.svg` |
| - [ ] | Oostende | `oostende.svg` |
| - [ ] | RWD Molenbeek | `rwd_molenbeek.svg` |
| - [ ] | Seraing | `seraing.svg` |

### `public/logos/sco_championship/` (13 clubs — 9 delivered 2026-11; 4 remaining)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Airdrie Utd | `airdrie_utd.svg` |
| - [x] | Arbroath | `arbroath.svg` |
| - [x] | Ayr | `ayr_utd.svg` |
| - [ ] | Cove Rangers | `cove_rangers.svg` |
| - [x] | Dunfermline | `dunfermline.svg` |
| - [ ] | Hamilton | `hamilton.svg` |
| - [x] | Inverness C | `inverness_caledonian_thistle.svg` |
| - [x] | Morton | `morton.svg` |
| - [x] | Partick | `partick.svg` |
| - [ ] | Queen of Sth | `queen_of_the_south.svg` |
| - [x] | Queens Park | `queens_park.svg` |
| - [x] | Raith Rvs | `raith.svg` |
| - [x] | Stenhousemuir | `stenhousemuir.svg` |

### `public/logos/sco_premier_league/` (14 clubs — 13 delivered 2026-11 as `sco_premier_league/*.svg` plus `livingston.svg` under `sco_championship/`; only Ross County remains)

| | club as spelled in the data | save as |
|---|---|---|
| - [x] | Aberdeen | `aberdeen.svg` |
| - [x] | Celtic | `celtic_glasgow.svg` |
| - [x] | Dundee | `dundee.svg` |
| - [x] | Dundee United | `dundee_utd.svg` |
| - [x] | Falkirk | `falkirk.svg` |
| - [x] | Hearts | `hearts.svg` |
| - [x] | Hibernian | `hibernian.svg` |
| - [x] | Kilmarnock | `kilmarnock.svg` |
| - [x] | Livingston | `livingston.svg` (file lives in `sco_championship/`; one key serves both divisions) |
| - [x] | Motherwell | `motherwell.svg` |
| - [x] | Rangers | `glasgow_rangers.svg` |
| - [ ] | Ross County | `ross_county.svg` |
| - [x] | St Johnstone | `st_johnstone.svg` |
| - [x] | St Mirren | `st_mirren.svg` |

### `public/logos/serie_a/` (2 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Salernitana | `salernitana.svg` |
| - [ ] | Spezia | `spezia.svg` |

### `public/logos/serie_b/` (15 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Alessandria | `alessandria.svg` |
| - [ ] | Bari | `bari.svg` |
| - [ ] | Brescia | `brescia.svg` |
| - [ ] | Cittadella | `cittadella.svg` |
| - [ ] | Cosenza | `cosenza.svg` |
| - [ ] | Crotone | `crotone.svg` |
| - [ ] | FeralpiSalo | `feralpi_salo.svg` |
| - [ ] | Lecco | `lecco.svg` |
| - [ ] | Perugia | `perugia.svg` |
| - [ ] | Pescara | `pescara.svg` |
| - [ ] | Pordenone | `pordenone.svg` |
| - [ ] | Reggiana | `reggiana.svg` |
| - [ ] | Reggina | `reggina.svg` |
| - [ ] | Spal | `spal.svg` |
| - [ ] | Ternana | `ternana.svg` |

### `public/logos/super_league/` (7 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Apollon | `apollon.svg` |
| - [ ] | Athens Kallithea | `athens_kallithea.svg` |
| - [ ] | Giannina | `giannina.svg` |
| - [ ] | Ionikos | `ionikos.svg` |
| - [ ] | Lamia | `lamia.svg` |
| - [ ] | Larisa | `larisa.svg` |
| - [ ] | Panserraikos | `panserraikos.svg` |

### `public/logos/super_lig/` (14 clubs)

| | club as spelled in the data | save as |
|---|---|---|
| - [ ] | Ad. Demirspor | `ad_demirspor.svg` |
| - [ ] | Altay | `altay.svg` |
| - [ ] | Ankaragucu | `ankaragucu.svg` |
| - [ ] | Antalyaspor | `antalyaspor.svg` |
| - [ ] | Bodrumspor | `bodrumspor.svg` |
| - [ ] | Giresunspor | `giresunspor.svg` |
| - [ ] | Hatayspor | `hatayspor.svg` |
| - [ ] | Istanbulspor | `istanbulspor.svg` |
| - [ ] | Karagumruk | `karagumruk.svg` |
| - [ ] | Kayserispor | `kayserispor.svg` |
| - [ ] | Pendikspor | `pendikspor.svg` |
| - [ ] | Sivasspor | `sivasspor.svg` |
| - [ ] | Umraniyespor | `umraniyespor.svg` |
| - [ ] | Yeni Malatyaspor | `yeni_malatyaspor.svg` |

## 2. Jackpot clubs: alias-only wins — do not download

These spellings belong to clubs already in the repo. Adding each pair to `MANUAL_ALIASES` in `src/build_logos.py` makes them resolve.

| occurrences | jackpot spelling | resolves to |
|---|---|---|
| 197 | Manchester Utd | `man_united` |
| 175 | Atl. Madrid | `atletico_madrid` |
| 157 | AS Roma | `roma` |
| 126 | Olympique Marseille | `marseille` |
| 117 | Olympique Lyon | `lyon` |
| 113 | B. Monchengladbach | `gladbach` |
| 108 | WBA | `west_brom` |
| 105 | AC Milan | `milan` |
| 105 | Wolverhampton | `wolves` |
| 100 | Manchester City | `man_city` |
| 87 | Hellas Verona | `verona` |
| 79 | Granada CF | `granada` |
| 75 | Cadiz CF | `cadiz` |
| 68 | Burgos CF | `burgos` |
| 57 | SC Freiburg | `freiburg` |
| 45 | VfB Stuttgart | `stuttgart` |
| 43 | Estrela Amadora | `estrela` |
| 42 | FC Nantes | `nantes` |
| 41 | Atl. Nacional | `nacional` |
| 39 | FC Porto | `porto` |
| 39 | Stade Rennes | `rennes` |
| 39 | Valencia CF | `valencia` |
| 38 | Real Betis Seville | `betis` |
| 38 | Getafe CF | `getafe` |
| 37 | Stade Brest 29 | `brest` |
| 35 | OGC Nice | `nice` |
| 34 | Espanyol Barcelona | `espanyol` |
| 33 | Borussia Dortmund | `dortmund` |
| 33 | FC St. Pauli | `st_pauli` |
| 33 | Newcastle United | `newcastle` |
| 32 | Dynamo Dresden | `dresden` |
| 32 | Lazio Rome | `lazio` |
| 30 | Borussia Mönchengladbach | `gladbach` |
| 30 | US Lecce | `lecce` |
| 29 | FC Augsburg | `augsburg` |
| 29 | VfL Wolfsburg | `wolfsburg` |
| 29 | FC Andorra | `andorra` |
| 29 | ACF Fiorentina | `fiorentina` |
| 29 | AJ Auxerre | `auxerre` |
| 29 | Juventus Turin | `juventus` |
| 28 | Deportivo Alaves | `alaves` |
| 28 | SD Huesca | `huesca` |
| 27 | Olympiacos Piraeus | `olympiacos` |
| 27 | RCD Mallorca | `mallorca` |
| 27 | Elche CF | `elche` |
| 27 | Bologna FC | `bologna` |
| 26 | Montpellier HSC | `montpellier` |
| 26 | FC Lorient | `lorient` |
| 26 | Atalanta BC | `atalanta` |
| 25 | 1. FC Köln | `koln` |
| 25 | Stade Brestois 29 | `brest` |
| 25 | NEC Nijmegen | `nijmegen` |
| 24 | AFC Bournemouth | `bournemouth` |
| 24 | West Ham United | `west_ham` |
| 24 | CD Leganes | `leganes` |
| 24 | SSC Napoli | `napoli` |
| 23 | Royal Antwerp FC | `antwerp` |
| 23 | Club Brugge KV | `club_brugge` |
| 23 | AC Monza | `monza` |
| 23 | Genoa CFC | `genoa` |
| 22 | Cagliari Calcio | `cagliari` |
| 22 | Angers SCO | `angers` |
| 22 | RSC Anderlecht | `anderlecht` |
| 22 | CD Mirandes | `mirandes` |
| 21 | KVC Westerlo | `westerlo` |
| 21 | KAA Gent | `gent` |
| 21 | Estoril Praia | `estoril` |
| 21 | AS Monaco | `monaco` |
| 20 | SC Heerenveen | `heerenveen` |
| 20 | RC Lens | `lens` |
| 20 | Frosinone Calcio | `frosinone` |
| 18 | Union Saint-Gilloise | `union_sg` |
| 18 | FC Utrecht | `utrecht` |
| 18 | UD Almeria | `almeria` |
| 18 | Rio Ave FC | `rio_ave` |
| 18 | Empoli FC | `empoli` |
| 17 | Royal Charleroi SC | `charleroi` |
| 17 | 1. FC Cologne | `koln` |
| 17 | Leeds United | `leeds` |
| 17 | UD Las Palmas | `las_palmas` |

*A further 72 lower-frequency variants are covered by the same generator rules (`fc_utrecht` -> `utrecht` style stripping) and are listed in `missing_team_logos.csv`.*


## 3. Jackpot clubs to download

Clubs not covered by any crest file, ordered by how many jackpot fixtures reference them. Set up a folder once:

```
mkdir public/logos/world  # or one folder per country
```
Save each crest as `public/logos/world/<slug>.svg`, then add one line per file to the `MAPPING` dict in `src/build_logos.py` (`"world/<slug>": "<slug>"` — self-references are fine) and rerun the script; the TS registry regenerates automatically.

**Top 150 by occurrences; everything below 5 occurrences is in `missing_team_logos.csv`.**

| | appearances | club key | jackpot spellings seen |
|---|---|---|---|
| - [ ] | 186 | `leicester` | Leicester |
| - [ ] | 166 | `luton` | Luton |
| - [ ] | 163 | `huesca` | Huesca |
| - [ ] | 163 | `huddersfield` | Huddersfield |
| - [ ] | 159 | `zaragoza` | Zaragoza |
| - [ ] | 144 | `reading` | Reading |
| - [ ] | 143 | `mirandes` | Mirandes |
| - [ ] | 138 | `blackpool` | Blackpool |
| - [ ] | 137 | `sheffield_wed` | Sheffield Wed |
| - [ ] | 130 | `wigan` | Wigan |
| - [ ] | 114 | `barnsley` | Barnsley |
| - [ ] | 112 | `cartagena` | Cartagena |
| - [ ] | 111 | `corinthians` | Corinthians |
| - [ ] | 109 | `peterborough` | Peterborough |
| - [ ] | 109 | `rotherham` | Rotherham |
| - [ ] | 104 | `brondby` | Brondby |
| - [ ] | 102 | `fluminense` | Fluminense |
| - [ ] | 102 | `boavista` | Boavista |
| - [ ] | 101 | `plymouth` | Plymouth |
| - [ ] | 100 | `wycombe` | Wycombe |
| - [ ] | 100 | `midtjylland` | Midtjylland |
| - [ ] | 97 | `rosenborg` | Rosenborg |
| - [ ] | 97 | `port_vale` | Port Vale |
| - [ ] | 96 | `burton` | Burton |
| - [ ] | 95 | `lugano` | Lugano · #14 – Lugano |
| - [ ] | 94 | `sao_paulo` | Sao Paulo |
| - [ ] | 94 | `basel` | Basel |
| - [ ] | 94 | `bordeaux` | Bordeaux |
| - [ ] | 93 | `santos` | Santos |
| - [ ] | 93 | `tromso` | Tromso |
| - [ ] | 93 | `spezia` | Spezia |
| - [ ] | 90 | `shrewsbury` | Shrewsbury |
| - [ ] | 90 | `viking` | Viking |
| - [ ] | 90 | `bragantino` | Bragantino |
| - [ ] | 90 | `portimonense` | Portimonense |
| - [ ] | 89 | `molde` | Molde |
| - [ ] | 89 | `salernitana` | Salernitana |
| - [ ] | 86 | `palmeiras` | Palmeiras |
| - [ ] | 86 | `oxford_utd` | Oxford Utd |
| - [ ] | 85 | `bristol_rovers` | Bristol Rovers |
| - [ ] | 85 | `servette` | Servette |
| - [ ] | 84 | `lillestrom` | Lillestrom |
| - [ ] | 84 | `cheltenham` | Cheltenham |
| - [ ] | 83 | `aarhus` | Aarhus |
| - [ ] | 82 | `bayer_leverkusen` | Bayer Leverkusen |
| - [ ] | 82 | `motherwell` | Motherwell |
| - [ ] | 80 | `accrington` | Accrington |
| - [ ] | 79 | `internacional` | Internacional |
| - [ ] | 79 | `ponferradina` | Ponferradina |
| - [ ] | 78 | `hertha_berlin` | Hertha Berlin |
| - [ ] | 78 | `vitesse` | Vitesse |
| - [ ] | 77 | `racing_santander` | Racing Santander |
| - [ ] | 77 | `dundalk` | Dundalk |
| - [ ] | 77 | `haugesund` | Haugesund |
| - [ ] | 76 | `brann` | Brann |
| - [ ] | 76 | `athletico_pr` | Athletico-PR · Athletico PR |
| - [ ] | 75 | `gremio` | Gremio |
| - [ ] | 75 | `vizela` | Vizela |
| - [ ] | 74 | `newells_old_boys` | Newells Old Boys |
| - [ ] | 74 | `nac_breda` | NAC Breda |
| - [ ] | 74 | `valerenga` | Valerenga |
| - [ ] | 74 | `stromsgodset` | Stromsgodset |
| - [ ] | 73 | `goteborg` | Goteborg |
| - [ ] | 73 | `aberdeen` | Aberdeen |
| - [ ] | 73 | `helmond` | Helmond |
| - [ ] | 72 | `shelbourne` | Shelbourne |
| - [ ] | 72 | `atletico_mg` | Atletico-MG |
| - [ ] | 72 | `san_lorenzo` | San Lorenzo |
| - [ ] | 72 | `aalesund` | Aalesund |
| - [ ] | 72 | `cruzeiro` | Cruzeiro |
| - [ ] | 72 | `gillingham` | Gillingham |
| - [ ] | 71 | `derry_city` | Derry City |
| - [ ] | 71 | `st_mirren` | St. Mirren · ST Mirren |
| - [ ] | 71 | `hibernian` | Hibernian |
| - [ ] | 71 | `bahia` | Bahia |
| - [ ] | 71 | `alcorcon` | Alcorcon |
| - [ ] | 70 | `aik` | AIK |
| - [ ] | 70 | `odense` | Odense |
| - [ ] | 70 | `elfsborg` | Elfsborg |
| - [ ] | 69 | `bohemians` | Bohemians |
| - [ ] | 69 | `leyton_orient` | Leyton Orient |
| - [ ] | 69 | `finn_harps` | Finn Harps |
| - [ ] | 69 | `sivasspor` | Sivasspor |
| - [ ] | 69 | `de_graafschap` | De Graafschap |
| - [ ] | 69 | `union_de_santa_fe` | Union de Santa Fe |
| - [ ] | 69 | `zurich` | Zurich |
| - [ ] | 69 | `sarpsborg_08` | Sarpsborg 08 |
| - [ ] | 69 | `kalmar` | Kalmar |
| - [ ] | 69 | `fleetwood` | Fleetwood |
| - [ ] | 69 | `st_patricks` | St. Patricks |
| - [ ] | 68 | `fcsb` | FCSB |
| - [ ] | 68 | `cuiaba` | Cuiaba |
| - [ ] | 68 | `roda` | Roda |
| - [ ] | 68 | `drogheda` | Drogheda |
| - [ ] | 68 | `ado_den_haag` | ADO Den Haag · Ado Den Haag |
| - [ ] | 67 | `st_johnstone` | St Johnstone · ST Johnstone |
| - [ ] | 67 | `hearts` | Hearts |
| - [ ] | 66 | `luzern` | Luzern |
| - [ ] | 65 | `tondela` | Tondela |
| - [ ] | 65 | `den_bosch` | Den Bosch |
| - [ ] | 65 | `brescia` | Brescia |
| - [ ] | 65 | `stabaek` | Stabaek |
| - [ ] | 65 | `exeter` | Exeter |
| - [ ] | 64 | `livingston` | Livingston |
| - [ ] | 64 | `lugo` | Lugo |
| - [ ] | 64 | `oss` | Oss |
| - [ ] | 63 | `platense` | Platense |
| - [ ] | 63 | `fortaleza` | Fortaleza |
| - [ ] | 63 | `crewe` | Crewe |
| - [ ] | 63 | `rkc_waalwijk` | RKC Waalwijk · Rkc Waalwijk |
| - [ ] | 63 | `silkeborg` | Silkeborg |
| - [ ] | 63 | `cambridge_utd` | Cambridge Utd |
| - [ ] | 63 | `nimes` | Nimes |
| - [ ] | 62 | `norrkoping` | Norrkoping |
| - [ ] | 62 | `tranmere` | Tranmere |
| - [ ] | 62 | `stevenage` | Stevenage |
| - [ ] | 62 | `randers` | Randers |
| - [ ] | 62 | `ajaccio` | Ajaccio |
| - [ ] | 62 | `aalborg` | Aalborg |
| - [ ] | 62 | `newport` | Newport |
| - [ ] | 61 | `lanus` | Lanus |
| - [ ] | 61 | `kilmarnock` | Kilmarnock |
| - [ ] | 61 | `northampton` | Northampton |
| - [ ] | 61 | `juventude` | Juventude |
| - [ ] | 61 | `austria_vienna` | Austria Vienna |
| - [ ] | 61 | `walsall` | Walsall |
| - [ ] | 61 | `dordrecht` | Dordrecht |
| - [ ] | 60 | `boca_juniors` | Boca Juniors |
| - [ ] | 60 | `argentinos_jrs` | Argentinos Jrs · Argentinos JRS |
| - [ ] | 60 | `lausanne` | Lausanne |
| - [ ] | 60 | `defensa_y_justicia` | Defensa y Justicia · Defensa Y Justicia |
| - [ ] | 60 | `carlisle` | Carlisle |
| - [ ] | 60 | `sandefjord` | Sandefjord |
| - [ ] | 60 | `slavia_prague` | Slavia Prague · #7 – Slavia Prague |
| - [ ] | 59 | `heracles` | Heracles |
| - [ ] | 59 | `ross_county` | Ross County |
| - [ ] | 59 | `mjallby` | Mjallby |
| - [ ] | 59 | `sepsi` | Sepsi |
| - [ ] | 58 | `manchester_united` | Manchester United |
| - [ ] | 58 | `grasshoppers` | Grasshoppers |
| - [ ] | 58 | `fredrikstad` | Fredrikstad |
| - [ ] | 58 | `banfield` | Banfield |
| - [ ] | 58 | `atletico_go` | Atletico GO · Atletico Go |
| - [ ] | 58 | `mjondalen` | Mjondalen |
| - [ ] | 58 | `colchester` | Colchester |
| - [ ] | 58 | `djurgarden` | Djurgarden |
| - [ ] | 58 | `amiens` | Amiens |
| - [ ] | 58 | `hacken` | Hacken |
| - [ ] | 57 | `haka` | Haka |
| - [ ] | 57 | `st_gallen` | St. Gallen |

## 4. Numbers

- Season clubs without a crest: 134 unique (147 name-competition pairs, 15 competitions), 34 of them Scottish.
- Jackpot slugs already covered by an existing crest: 152 (3953 name occurrences).
- Jackpot slugs genuinely without a crest: 4539 (48888 name occurrences); those with ≥5 occurrences: 2103 — all listed above.
