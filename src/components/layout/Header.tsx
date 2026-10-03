import React from "react";
import {
  Sparkles,
  Layers,
  Swords,
  Goal,
  Table as TableIcon,
  Download,
  Calendar,
  FileSpreadsheet,
  FileCode,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { AppStats, Match } from "../../lib/types";
import { exportToCsv, exportToJson } from "../../lib/export";

export type AppTab = "predictor" | "positions" | "teams" | "goals" | "explorer";

interface HeaderProps {
  stats: AppStats | null;
  filteredCount: number;
  totalCount: number;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  filteredMatches: Match[];
  isFiltering?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  filteredCount,
  totalCount,
  activeTab,
  onTabChange,
  filteredMatches,
  isFiltering = false,
}) => {
  const isFiltered = filteredCount !== totalCount;

  return (
    <header className="border-b border-border bg-card/95 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground tracking-tight">Jackpot Predictor & Analyzer</h1>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-mono">
                1–17 Engine
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Betika · Mozzart · SportPesa historical prediction intelligence
            </p>
          </div>
        </div>

        {/* Center: Navigation View Switch Tabs */}
        <div className="flex items-center justify-center overflow-x-auto py-0.5">
          <Tabs
            value={activeTab}
            onValueChange={(val) => onTabChange(val as AppTab)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="predictor" className="flex items-center gap-1.5 text-xs h-7">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Predictor</span>
              </TabsTrigger>
              <TabsTrigger value="positions" className="flex items-center gap-1.5 text-xs h-7">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                <span>Positions 1–17</span>
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-1.5 text-xs h-7">
                <Swords className="h-3.5 w-3.5 text-amber-400" />
                <span>H2H & Teams</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-1.5 text-xs h-7">
                <Goal className="h-3.5 w-3.5 text-emerald-400" />
                <span>Goals</span>
              </TabsTrigger>
              <TabsTrigger value="explorer" className="flex items-center gap-1.5 text-xs h-7">
                <TableIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Explorer</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Right: Quick Stats & Export Dropdown */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Filter Match Count Pill */}
          <div className="text-xs px-2.5 py-1 rounded-md bg-muted/60 border border-border text-muted-foreground flex items-center gap-1.5">
            {isFiltering && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
            {isFiltered ? (
              <span>
                Filtered: <strong className="text-emerald-400">{filteredCount.toLocaleString()}</strong> of {totalCount.toLocaleString()}
              </span>
            ) : (
              <span>
                <strong className="text-foreground">{totalCount.toLocaleString()}</strong> matches
              </span>
            )}
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Export</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() => {
                  exportToCsv(filteredMatches, `jackpot_matches_${filteredMatches.length}.csv`);
                }}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span>Export to CSV ({filteredMatches.length.toLocaleString()})</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  exportToJson(filteredMatches, `jackpot_matches_${filteredMatches.length}.json`);
                }}
                className="cursor-pointer"
              >
                <FileCode className="h-4 w-4 text-primary" />
                <span>Export to JSON ({filteredMatches.length.toLocaleString()})</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
