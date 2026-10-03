import React, { useState, useEffect } from "react";
import {
  Zap,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
  Globe,
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
  type ParsedMozzartJackpot,
  type MozzartPredefinedTicket,
  fetchActiveMozzartJackpot,
  parseMozzartJackpot,
} from "../../lib/mozzart";

interface MozzartImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyJackpot: (jackpot: ParsedMozzartJackpot) => void;
}

export const MozzartImportModal: React.FC<MozzartImportModalProps> = ({
  open,
  onOpenChange,
  onApplyJackpot,
}) => {
  const [activeTab, setActiveTab] = useState<string>("api");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewJackpot, setPreviewJackpot] = useState<ParsedMozzartJackpot | null>(null);
  const [jsonInput, setJsonInput] = useState("");

  // Auto-fetch on opening if no preview data yet
  useEffect(() => {
    if (open && !previewJackpot && !loading) {
      handleFetchLive();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFetchLive = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveMozzartJackpot();
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
      setError("Please paste the Mozzart JSON response first.");
      return;
    }

    try {
      const raw: MozzartPredefinedTicket[] = JSON.parse(jsonInput.trim());
      const parsed = parseMozzartJackpot(raw);
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

  const formatJackpotAmount = (amount: number | null) => {
    if (amount === null) return null;
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Mozzart Super Jackpot — API Prefill
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Import active 16-match jackpot fixtures directly into the Predictor.
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
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  https://www.mozzartbet.co.ke/predefined-tickets
                </span>
                <p className="text-[11px] text-muted-foreground">
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

            {/* Info Note */}
            <div className="p-2.5 rounded-lg border border-green-500/20 bg-green-500/5 text-green-300 text-[11px] flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-green-400" />
              <div className="leading-relaxed">
                <span className="font-semibold text-green-200">okhttp/4.9.0 User-Agent: </span>
                Mozzart's public API returns JSON directly when requests carry an Android mobile client
                user-agent. This app proxies requests server-side so the browser never touches the
                external endpoint.
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Paste JSON */}
          <TabsContent value="json" className="space-y-3 min-h-0 flex-1 flex flex-col">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Paste Mozzart Predefined Tickets JSON</label>
              <Textarea
                placeholder='[{"id":1000029772,"roundId":2481,"totalRows":16,"matches":[...]}]'
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
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Parse &amp; Preview Fixtures
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
                  Round #{previewJackpot.roundId}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                  {previewJackpot.totalRows} Fixtures
                </Badge>
                {previewJackpot.jackpotAmount !== null && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-400 border-green-500/30 font-mono">
                    {formatJackpotAmount(previewJackpot.jackpotAmount)}
                  </Badge>
                )}
              </div>

              <span className="text-[11px] text-muted-foreground font-mono">
                ID: {previewJackpot.id}
              </span>
            </div>

            {/* Scrollable Fixture Preview */}
            <div className="overflow-y-auto max-h-52 rounded-lg border border-border bg-muted/20 divide-y divide-border text-xs">
              {previewJackpot.matches.map((m) => (
                <div key={m.rowNumber} className="p-2 flex items-center justify-between hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-muted text-foreground flex items-center justify-center font-mono text-[10px] font-bold border border-border">
                      {m.rowNumber}
                    </span>
                    <div>
                      <span className="font-medium text-foreground">
                        {m.homeTeam} <span className="text-muted-foreground text-[10px]">vs</span> {m.awayTeam}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {m.competition} {m.country ? `• ${m.country}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-[11px] font-semibold text-foreground">
                      {m.homeOdds?.toFixed(2) || "-"} / {m.drawOdds?.toFixed(2) || "-"} / {m.awayOdds?.toFixed(2) || "-"}
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
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
            className="text-xs font-semibold gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 text-white" />
            Apply {previewJackpot?.totalRows ?? 16} Matches to Predictor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
