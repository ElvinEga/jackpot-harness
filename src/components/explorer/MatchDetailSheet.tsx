import React, { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  X,
  Calendar,
  Shield,
  Layers,
  Copy,
  Check,
  Search,
  AlertCircle,
  FileText
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import type { Match, MatchFilters } from "../../lib/types";

interface MatchDetailSheetProps {
  match: Match | null;
  onClose: () => void;
  onApplyFilter: (filters: Partial<MatchFilters>) => void;
}

export const MatchDetailSheet: React.FC<MatchDetailSheetProps> = ({
  match,
  onClose,
  onApplyFilter,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  if (!match) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(match, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getResultBadge = () => {
    if (match.result === "home") return <Badge variant="home">Home Win</Badge>;
    if (match.result === "draw") return <Badge variant="draw">Draw</Badge>;
    if (match.result === "away") return <Badge variant="away">Away Win</Badge>;
    if (match.result === "postponed") return <Badge variant="muted">Postponed</Badge>;
    if (match.result === "abandoned") return <Badge variant="muted">Abandoned</Badge>;
    return <Badge variant="secondary">{match.result || "Unknown"}</Badge>;
  };

  const getBookmakerBadge = () => {
    if (match.bookmaker === "betika") return <Badge variant="betika">Betika</Badge>;
    if (match.bookmaker === "mozzart") return <Badge variant="mozzart">Mozzart</Badge>;
    return <Badge variant="sportpesa">SportPesa</Badge>;
  };

  return (
    <DialogPrimitive.Root open={!!match} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200" />
        <DialogPrimitive.Popup
          className="fixed top-0 right-0 z-50 w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200 text-card-foreground"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Match Details
              </span>
              {getBookmakerBadge()}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6 flex-1">
            {/* Match Scoreboard Card */}
            <div className="p-4 rounded-xl bg-background border border-border shadow-inner">
              <div className="text-center text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{match.date || "Date Not Recorded"}</span>
              </div>

              <div className="grid grid-cols-5 items-center gap-2 text-center my-2">
                <div className="col-span-2">
                  <p className="font-bold text-foreground text-sm md:text-base leading-tight">
                    {match.home_team}
                  </p>
                  <span className="text-[11px] text-muted-foreground">Home</span>
                </div>

                <div className="col-span-1 flex flex-col items-center">
                  <span className="text-xl font-mono font-extrabold tracking-wider text-foreground px-2 py-0.5 rounded bg-muted border border-border">
                    {match.score || "-"}
                  </span>
                  <div className="mt-1">{getResultBadge()}</div>
                </div>

                <div className="col-span-2">
                  <p className="font-bold text-foreground text-sm md:text-base leading-tight">
                    {match.away_team}
                  </p>
                  <span className="text-[11px] text-muted-foreground">Away</span>
                </div>
              </div>

              {match.league && (
                <div className="mt-4 pt-3 border-t border-border text-center">
                  <span className="text-xs text-muted-foreground font-medium">{match.league}</span>
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Jackpot & Market Data
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-background border border-border">
                  <span className="text-muted-foreground block mb-1">Jackpot Product</span>
                  <span className="font-semibold text-foreground">{match.jackpot}</span>
                </div>

                <div className="p-3 rounded-lg bg-background border border-border">
                  <span className="text-muted-foreground block mb-1">Decimal Odds</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-base text-primary">
                      {match.odds !== null ? match.odds.toFixed(2) : "N/A"}
                    </span>
                    {match.odds !== null && (
                      <span className="text-[10px] text-muted-foreground">(1X2 / DC)</span>
                    )}
                  </div>
                </div>

                {match.jackpot_id && (
                  <div className="p-3 rounded-lg bg-background border border-border col-span-2">
                    <span className="text-muted-foreground block mb-1">SportPesa Jackpot ID</span>
                    <span className="font-mono text-foreground">{match.jackpot_id}</span>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-background border border-border col-span-2">
                  <span className="text-muted-foreground block mb-1">Source File</span>
                  <span className="font-mono text-[11px] text-muted-foreground truncate block">
                    data/processed/{match.source_file}
                  </span>
                </div>
              </div>

              {/* Odds Caveat Reminder */}
              {match.odds !== null && (
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    Odds may represent full-time 1X2 or double chance (DC). Tipster pick is omitted in raw records.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Filter Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Explorations
              </h4>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs"
                  onClick={() => {
                    onApplyFilter({ search: `${match.home_team} ${match.away_team}` });
                    onClose();
                  }}
                >
                  <Search className="h-3.5 w-3.5 text-primary" />
                  <span>Find head-to-head matches</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs"
                  onClick={() => {
                    onApplyFilter({ search: match.home_team });
                    onClose();
                  }}
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Show all matches with {match.home_team}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs"
                  onClick={() => {
                    onApplyFilter({ search: match.away_team });
                    onClose();
                  }}
                >
                  <Shield className="h-3.5 w-3.5 text-sky-400" />
                  <span>Show all matches with {match.away_team}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs"
                  onClick={() => {
                    onApplyFilter({ jackpots: [match.jackpot] });
                    onClose();
                  }}
                >
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Filter to {match.jackpot}</span>
                </Button>
              </div>
            </div>

            {/* Raw JSON Record Inspector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowJson((prev) => !prev)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{showJson ? "Hide Raw JSON" : "View Raw JSON Record"}</span>
                </button>

                <button
                  onClick={handleCopyJson}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {showJson && (
                <pre className="p-3 rounded-lg bg-background border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-56">
                  {JSON.stringify(match, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
