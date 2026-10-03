import React, { useState, useEffect } from "react";
import {
  Zap,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
  Globe,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  type ParsedSportPesaJackpot,
  fetchActiveSportPesaJackpot,
  parseSportPesaJackpot,
  type SportPesaActiveJackpotResponse,
} from "../../lib/sportpesa";

interface SportPesaImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyJackpot: (jackpot: ParsedSportPesaJackpot) => void;
}

export const SportPesaImportModal: React.FC<SportPesaImportModalProps> = ({
  open,
  onOpenChange,
  onApplyJackpot,
}) => {
  const [activeTab, setActiveTab] = useState<string>("api");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewJackpot, setPreviewJackpot] = useState<ParsedSportPesaJackpot | null>(null);
  const [jsonInput, setJsonInput] = useState("");

  // Auto-fetch on opening if no preview data yet
  useEffect(() => {
    if (open && !previewJackpot && !loading) {
      handleFetchLive();
    }
  }, [open]);

  const handleFetchLive = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveSportPesaJackpot();
      setPreviewJackpot(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to fetch active jackpot: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleParseCustomJson = () => {
    setError(null);
    if (!jsonInput.trim()) {
      setError("Please paste the SportPesa JSON response first.");
      return;
    }

    try {
      const raw: SportPesaActiveJackpotResponse = JSON.parse(jsonInput.trim());
      const parsed = parseSportPesaJackpot(raw);
      setPreviewJackpot(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Invalid JSON payload: ${msg}`);
    }
  };

  const handleApply = () => {
    if (!previewJackpot) return;
    onApplyJackpot(previewJackpot);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                SportPesa Mega Jackpot Pro — API Prefill
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Import active 17-match jackpot fixtures directly into the Predictor.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={(val) => val && setActiveTab(val)} className="w-full flex-1 flex flex-col min-h-0 mt-3">
          <TabsList className="grid grid-cols-2 w-full max-w-xs mb-3">
            <TabsTrigger value="api" className="text-xs gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Live API Fetch
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs gap-1.5">
              <FileCode className="h-3.5 w-3.5" />
              Paste JSON
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Live API Fetch */}
          <TabsContent value="api" className="space-y-3 min-h-0 flex-1 flex flex-col">
            <div className="p-3 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  https://jackpot-offer-api.ke.sportpesa.com/api/jackpots/active
                </span>
                <p className="text-xs text-muted-foreground">
                  Queries active jackpot fixtures using mobile client headers.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchLive}
                disabled={loading}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {loading ? "Fetching..." : "Refresh from API"}
              </Button>
            </div>

          </TabsContent>

          {/* TAB 2: Paste JSON */}
          <TabsContent value="json" className="space-y-3 min-h-0 flex-1 flex flex-col">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Paste SportPesa Active Jackpot JSON</label>
              <Textarea
                placeholder='{"id":"a5406708-...","humanId":202,"events":[...]}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="font-mono text-xs h-32 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleParseCustomJson}
                className="text-xs gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Parse & Preview Fixtures
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Notice */}
        {error && (
          <div className="my-2 p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loaded Preview Section */}
        {previewJackpot && (
          <div className="mt-3 space-y-2 border-t border-border pt-3 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-xs">
                  Jackpot #{previewJackpot.humanId}
                </span>


              </div>

              <Badge
                variant="outline"
                className={`text-xs px-1.5 py-0 ${
                  previewJackpot.bettingStatus.toLowerCase() === "open"
                    ? "text-primary border-primary/30"
                    : "text-foreground border-border"
                }`}
              >
                Status: {previewJackpot.bettingStatus}
              </Badge>
            </div>

            {/* Scrollable Fixture Preview */}
            <div className="overflow-y-auto max-h-52 rounded-lg border border-border bg-muted/20 divide-y divide-border text-xs">
              {previewJackpot.matches.map((m) => (
                <div key={m.order} className="p-2 flex items-center justify-between hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-muted text-foreground flex items-center justify-center font-mono text-xs font-bold border border-border">
                      {m.order}
                    </span>
                    <div>
                      <span className="font-medium text-foreground">
                        {m.homeTeam} <span className="text-muted-foreground text-xs">vs</span> {m.awayTeam}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {m.tournament} {m.country ? `• ${m.country}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {m.homeOdds?.toFixed(2) || "-"} / {m.drawOdds?.toFixed(2) || "-"} / {m.awayOdds?.toFixed(2) || "-"}
                    </span>
                    <span className="text-xs text-muted-foreground block font-mono">
                      1X2 Odds
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground"
          >
            Cancel
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleApply}
            disabled={!previewJackpot}
            className="text-xs font-semibold gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
            Apply 17 Matches to Predictor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
