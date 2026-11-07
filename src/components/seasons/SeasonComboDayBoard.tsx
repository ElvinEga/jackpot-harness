import React from "react";
import { TeamLogo } from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { fixtureKey } from "../../lib/seasonsCombos";
import type { FixtureCombos } from "../../lib/seasonTypes";
import { cn } from "@/lib/utils";

interface SeasonComboDayBoardProps {
  /** One entry per fixture on the selected day, already priced. */
  board: FixtureCombos[];
  onSelect: (key: string) => void;
  selectedKey: string;
}

/**
 * The day board: one line per fixture, each carrying its own best combo, so
 * the card reads as a slips board rather than a list of names.
 */
export const SeasonComboDayBoard: React.FC<SeasonComboDayBoardProps> = ({
  board,
  onSelect,
  selectedKey,
}) => {
  return (
    <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold text-foreground">Day board</h3>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {board.length} {board.length === 1 ? "fixture" : "fixtures"}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {board.map((entry) => {
          const key = fixtureKey(entry.fixture);
          const best = entry.combos[0];
          return (
            <li key={key}>
              <Button
                variant="ghost"
                onClick={() => onSelect(key)}
                className={cn(
                  "w-full h-auto rounded-none justify-start gap-3 px-3 py-2 text-left",
                  selectedKey === key && "bg-primary/10 text-foreground"
                )}
              >
                <span className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <TeamLogo team={entry.fixture.home_team} size={20} />
                    <span className="text-xs font-medium truncate max-w-28">
                      {entry.fixture.home_team}
                    </span>
                    <span className="text-[11px] text-muted-foreground">v</span>
                    <TeamLogo team={entry.fixture.away_team} size={20} />
                    <span className="text-xs font-medium truncate max-w-28">
                      {entry.fixture.away_team}
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1">
                    {best ? best.label : "No combo above 8%"}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[10px] text-muted-foreground tabular-nums">
                    {entry.fixture.kickoff_time}
                  </span>
                  <span className="block text-xs font-semibold text-primary tabular-nums">
                    {best ? `${best.prob.toFixed(1)}%` : "—"}
                  </span>
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
