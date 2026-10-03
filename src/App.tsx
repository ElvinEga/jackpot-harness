import React, { useEffect, useState, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "./components/layout/Header";
import { FilterBar } from "./components/explorer/FilterBar";
import { MatchTable } from "./components/explorer/MatchTable";
import { MatchDetailSheet } from "./components/explorer/MatchDetailSheet";
import { AnalyticsView } from "./components/analytics/AnalyticsView";
import { Button } from "./components/ui/Button";

import type { Match, AppStats, MatchFilters } from "./lib/types";
import { loadAllMatches, computeDatasetStats } from "./lib/data";
import { filterMatches } from "./lib/filters";
import { useUrlFilters } from "./hooks/useUrlFilters";

export function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<{ loaded: number; total: number }>({
    loaded: 0,
    total: 11,
  });
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"explorer" | "analytics">("explorer");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const { filters, setFilters, resetFilters } = useUrlFilters();

  // Load datasets on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    loadAllMatches((loaded, total) => {
      if (isMounted) {
        setLoadProgress({ loaded, total });
      }
    })
      .then((data) => {
        if (isMounted) {
          setMatches(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load jackpot datasets:", err);
          setError(err.message || "Failed to load jackpot records");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute overall dataset stats
  const datasetStats: AppStats | null = useMemo(() => {
    if (matches.length === 0) return null;
    return computeDatasetStats(matches);
  }, [matches]);

  // Extract unique sorted leagues for dropdown
  const uniqueLeagues = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) {
      if (m.league) set.add(m.league);
    }
    return Array.from(set).sort();
  }, [matches]);

  // Filter matches based on current active filters
  const filteredMatches = useMemo(() => {
    return filterMatches(matches, filters);
  }, [matches, filters]);

  const handleApplyPartialFilter = (partial: Partial<MatchFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border shadow-2xl flex flex-col items-center space-y-4 text-card-foreground">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">Loading Jackpot Archives</h2>
            <p className="text-xs text-muted-foreground">
              Loading {loadProgress.loaded} of {loadProgress.total} datasets (42,898 records)...
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-200"
              style={{ width: `${(loadProgress.loaded / loadProgress.total) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Betika · Mozzart · SportPesa
          </span>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md p-6 rounded-xl bg-card border border-destructive/50 flex flex-col items-center space-y-4 text-card-foreground">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">Failed to load datasets</h2>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header */}
      <Header
        stats={datasetStats}
        filteredCount={filteredMatches.length}
        totalCount={matches.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filteredMatches={filteredMatches}
      />

      {/* Main Content Area */}
      {activeTab === "explorer" ? (
        <div className="flex-1 flex flex-col min-h-0">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            onReset={resetFilters}
            uniqueLeagues={uniqueLeagues}
          />
          <MatchTable
            matches={filteredMatches}
            onSelectMatch={setSelectedMatch}
          />
        </div>
      ) : (
        <AnalyticsView matches={filteredMatches} />
      )}

      {/* Match Detail Drawer / Sheet (Base UI Dialog) */}
      <MatchDetailSheet
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onApplyFilter={handleApplyPartialFilter}
      />
    </div>
  );
}

export default App;
