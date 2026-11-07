import React, { useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamLogo } from "@/components/TeamLogo";
import { useUpcomingFixtures } from "../../hooks/useSeasonMatches";
import { fixtureKey, predictFixtureCombos } from "../../lib/seasonsCombos";
import {
  AVAILABLE_COMPETITIONS,
  competitionForDivision,
  getCompetitionFlag,
} from "../../lib/seasonsData";
import type { ComboFamily, ComboQuote, SeasonMatch } from "../../lib/seasonTypes";
import { SeasonComboDayBoard } from "./SeasonComboDayBoard";

interface SeasonComboPredictorProps {
  /** Full season history for the league, every season — the same input Predictor uses. */
  matches: SeasonMatch[];
  competition: string;
  onCompetitionChange: (comp: string) => void;
  onPredictMatchup?: (home: string, away: string) => void;
}

const FAMILY_LABEL: Record<ComboFamily, string> = {
  "btts-result": "BTTS × result",
  "result-total": "result × total",
  "win-to-nil": "to nil",
  "first-half": "first half",
  "both-halves": "both halves",
  "ht-ft": "HT/FT",
  single: "single leg",
};

const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const stamp = new Date(Date.UTC(y, m - 1, d));
  return stamp.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
};

const probabilityBar = (prob: number) => (
  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, prob)}%` }} />
  </div>
);

const ComboRows: React.FC<{ quotes: ComboQuote[] }> = ({ quotes }) => (
  <>
    {quotes.map((quote) => (
      <TableRow key={quote.id}>
        <TableCell className="text-xs max-w-56">
          <span className="font-medium text-foreground">{quote.label}</span>
          <Badge variant="outline" className="ml-2 text-[10px] font-normal">
            {FAMILY_LABEL[quote.family]}
          </Badge>
        </TableCell>
        <TableCell className="w-40">
          {probabilityBar(quote.prob)}
        </TableCell>
        <TableCell className="text-right text-xs font-semibold tabular-nums">
          {quote.prob.toFixed(1)}%
        </TableCell>
        <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
          {quote.fairOdds.toFixed(2)}
        </TableCell>
      </TableRow>
    ))}
  </>
);

export const SeasonComboPredictor: React.FC<SeasonComboPredictorProps> = ({
  matches,
  competition,
  onCompetitionChange,
  onPredictMatchup,
}) => {
  const { data: card = [], isLoading, error } = useUpcomingFixtures();
  const [selectedKey, setSelectedKey] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [pickedDate, setPickedDate] = useState("");

  const currentComp = useMemo(
    () => AVAILABLE_COMPETITIONS.find((c) => c.id === competition) ?? AVAILABLE_COMPETITIONS[0],
    [competition]
  );

  const leagueFixtures = useMemo(
    () => card.filter((f) => f.division === currentComp.division),
    [card, currentComp.division]
  );
  const dates = useMemo(
    () => [...new Set(leagueFixtures.map((f) => f.date))].sort(),
    [leagueFixtures]
  );

  // The card is a rolling window and can open on a day that has already gone
  // by, so the default is the first day still to come — but every date on the
  // card stays reachable from the picker.
  const today = new Date().toISOString().slice(0, 10);
  const activeDate =
    (dates.includes(pickedDate) && pickedDate) ||
    dates.find((d) => d >= today) ||
    dates[0] ||
    "";

  const dayFixtures = useMemo(
    () => leagueFixtures.filter((f) => f.date === activeDate),
    [leagueFixtures, activeDate]
  );

  const board = useMemo(
    () => dayFixtures.map((fixture) => predictFixtureCombos(matches, fixture)),
    [dayFixtures, matches]
  );

  const selected =
    board.find((entry) => fixtureKey(entry.fixture) === selectedKey) ?? board[0] ?? null;

  const topOfDay = useMemo(
    () =>
      board
        .map((entry) => ({ entry, best: entry.combos[0] }))
        .filter((row) => row.best)
        .sort((a, b) => (b.best?.prob ?? 0) - (a.best?.prob ?? 0))
        .slice(0, 3),
    [board]
  );

  const leaguesWithFixtures = useMemo(() => {
    const seen: string[] = [];
    for (const fixture of card) {
      const comp = competitionForDivision(fixture.division);
      if (comp && !seen.includes(comp.name)) seen.push(comp.name);
    }
    return seen;
  }, [card]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin mb-3" />
        <h3 className="text-sm font-bold text-foreground">Loading the upcoming fixtures card</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-6 w-6 text-destructive mb-3" />
        <h3 className="text-sm font-bold text-foreground">Couldn't load the fixtures card</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {error instanceof Error ? error.message : "Network error"}
        </p>
      </div>
    );
  }

  if (!dayFixtures.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <h3 className="text-sm font-bold text-foreground">
          No {currentComp.name} fixtures in the upcoming card
        </h3>
        <p className="text-xs text-muted-foreground max-w-md">
          {leaguesWithFixtures.length
            ? `Fixtures on the card: ${leaguesWithFixtures.join(", ")}.`
            : "The card is empty — it holds the next few days only, so an international break clears it."}
        </p>
        <SearchableSelect
          size="sm"
          value={competition}
          onValueChange={onCompetitionChange}
          options={AVAILABLE_COMPETITIONS.map((c) => ({
            value: c.id,
            label: c.name,
            icon: getCompetitionFlag(c.countryCode),
            sublabel: `${c.division} · ${c.country}`,
          }))}
          searchPlaceholder="Search leagues..."
          className="min-w-44 font-semibold"
          popoverWidth="w-56"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span>{getCompetitionFlag(currentComp.countryCode)}</span>
            <span>{currentComp.name} Combos</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {leagueFixtures.length} fixtures on the card, {dayLabel(dates[0])} to{" "}
            {dayLabel(dates[dates.length - 1])} · football-data.co.uk fixtures.csv
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect
            size="sm"
            value={competition}
            onValueChange={onCompetitionChange}
            options={AVAILABLE_COMPETITIONS.map((c) => ({
              value: c.id,
              label: c.name,
              icon: getCompetitionFlag(c.countryCode),
              sublabel: `${c.division} · ${c.country}`,
            }))}
            searchPlaceholder="Search leagues..."
            className="min-w-44 font-semibold"
            popoverWidth="w-56"
          />
          <NativeSelect
            size="sm"
            value={activeDate}
            onChange={(e) => setPickedDate(e.target.value)}
            className="text-xs font-semibold min-w-40"
          >
            {dates.map((d) => (
              <NativeSelectOption key={d} value={d}>
                {dayLabel(d)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {topOfDay.map(({ entry, best }) => (
          <button
            key={fixtureKey(entry.fixture)}
            onClick={() => setSelectedKey(fixtureKey(entry.fixture))}
            className="rounded-xl bg-card border border-border shadow-xs p-3 text-left hover:border-primary/60"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-bold text-primary tabular-nums">
                {best?.prob.toFixed(1)}%
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                @{best?.fairOdds.toFixed(2)}
              </span>
            </span>
            <span className="block text-xs font-medium text-foreground mt-1 line-clamp-2">
              {best?.label}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1 truncate">
              {entry.fixture.home_team} v {entry.fixture.away_team} ·{" "}
              {entry.fixture.kickoff_time}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        <SeasonComboDayBoard
          board={board}
          selectedKey={selected ? fixtureKey(selected.fixture) : ""}
          onSelect={setSelectedKey}
        />

        {selected ? (
          <div className="space-y-4 min-w-0">
            <div className="rounded-xl bg-card border border-border shadow-xs p-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamLogo team={selected.fixture.home_team} size={28} />
                  <span className="text-sm font-semibold truncate">
                    {selected.fixture.home_team}
                  </span>
                  <span className="text-xs text-muted-foreground">v</span>
                  <TeamLogo team={selected.fixture.away_team} size={28} />
                  <span className="text-sm font-semibold truncate">
                    {selected.fixture.away_team}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-[11px] text-muted-foreground tabular-nums">
                    {dayLabel(selected.fixture.date)} · {selected.fixture.kickoff_time}
                  </span>
                  {onPredictMatchup ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onPredictMatchup(selected.fixture.home_team, selected.fixture.away_team)
                      }
                      className="gap-1 mt-1"
                    >
                      <ExternalLink className="size-3" />
                      Open in Predictor
                    </Button>
                  ) : null}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-3 tabular-nums">
                {selected.lambdaHome} + {selected.lambdaAway} expected goals, split{" "}
                {Math.round(selected.firstHalfShare * 100)} / {100 - Math.round(selected.firstHalfShare * 100)}{" "}
                between the halves from this league's own history · prices{" "}
                {selected.fixture.odds.home ?? "—"} / {selected.fixture.odds.draw ?? "—"} /{" "}
                {selected.fixture.odds.away ?? "—"}
              </p>
            </div>

            <div className="rounded-xl bg-card border border-border shadow-xs p-4">
              <div className="flex items-center justify-between gap-2 pb-2">
                <h3 className="text-sm font-bold text-foreground">Ranked combos</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? "Slip list only" : "Show all markets"}
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Market</TableHead>
                    <TableHead className="text-xs w-40">Likelihood</TableHead>
                    <TableHead className="text-xs text-right">Prob</TableHead>
                    <TableHead className="text-xs text-right">Fair odds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showAll ? (
                    <ComboRows quotes={selected.expanded} />
                  ) : (
                    <ComboRows quotes={selected.combos} />
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-[11px] text-muted-foreground tabular-nums">
                      Σ 1X2 {selected.partition.oneX2.toFixed(1)}% · Over + Under 2.5{" "}
                      {selected.partition.overUnder25.toFixed(1)}% · {selected.outcomes} scorelines,
                      half by half
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <div className="rounded-xl bg-card border border-border shadow-xs p-4">
              <h3 className="text-sm font-bold text-foreground mb-1">Single legs</h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                Each combo is a part of one of these, so it can never be likelier than the leg
                under it.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {selected.references.map((quote) => (
                  <div key={quote.id} className="space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="truncate">{quote.label}</span>
                      <span className="font-bold tabular-nums shrink-0">{quote.prob.toFixed(1)}%</span>
                    </div>
                    {probabilityBar(quote.prob)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
