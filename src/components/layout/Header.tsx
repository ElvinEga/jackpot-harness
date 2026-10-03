import React from "react";
import {
  Database,
  BarChart3,
  Table as TableIcon,
  Download,
  Calendar,
  Layers,
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

interface HeaderProps {
  stats: AppStats | null;
  filteredCount: number;
  totalCount: number;
  activeTab: "explorer" | "analytics";
  onTabChange: (tab: "explorer" | "analytics") => void;
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
    <header className="border-b border-border bg-card/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground tracking-tight">Jackpot Explorer</h1>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                Base UI
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
               Betika · Mozzart · SportPesa historical jackpot archives
            </p>
          </div>
        </div>

        {/* Middle: Key Stats Bar */}
        {stats && (
          <div className="hidden xl:flex items-center gap-2 text-xs bg-muted/50 border border-border rounded-lg px-3 py-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 text-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold">{stats.totalRecords.toLocaleString()}</span> Records
            </div>
            <span className="text-muted-foreground/40">|</span>
            <div className="text-foreground">
              <span className="font-semibold">{stats.bookmakerCount}</span> Bookmakers
            </div>
            <span className="text-muted-foreground/40">|</span>
            <div className="text-foreground">
              <span className="font-semibold">{stats.jackpotCount}</span> Jackpots
            </div>
            {stats.dateMin && stats.dateMax && (
              <>
                <span className="text-muted-foreground/40">|</span>
                <div className="flex items-center gap-1 text-foreground">
                  <Calendar className="h-3 w-3 text-emerald-400" />
                  <span>{stats.dateMin.slice(0, 4)} – {stats.dateMax.slice(0, 4)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: Tab switch & Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Filter Match Count Pill */}
          <div className="text-xs px-2.5 py-1 rounded-md bg-muted/60 border border-border text-muted-foreground flex items-center gap-1.5">
            {isFiltering && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
            {isFiltered ? (
              <span>
                Filtered: <strong className="text-emerald-400">{filteredCount.toLocaleString()}</strong> of {totalCount.toLocaleString()}
              </span>
            ) : (
              <span>
                Total: <strong className="text-foreground">{totalCount.toLocaleString()}</strong> matches
              </span>
            )}
          </div>

          {/* Navigation View Switch */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => onTabChange(val as "explorer" | "analytics")}
          >
            <TabsList>
              <TabsTrigger value="explorer" className="flex items-center gap-1.5 text-xs">
                <TableIcon className="h-3.5 w-3.5" />
                Explorer
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5">
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
