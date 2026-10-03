import React, { useState, useRef, useEffect } from "react";
import {
  Database,
  BarChart3,
  Table as TableIcon,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileCode,
  ChevronDown
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import type { AppStats, Match } from "../../lib/types";
import { exportToCsv, exportToJson } from "../../lib/export";

interface HeaderProps {
  stats: AppStats | null;
  filteredCount: number;
  totalCount: number;
  activeTab: "explorer" | "analytics";
  onTabChange: (tab: "explorer" | "analytics") => void;
  filteredMatches: Match[];
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  filteredCount,
  totalCount,
  activeTab,
  onTabChange,
  filteredMatches,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isFiltered = filteredCount !== totalCount;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">Jackpot Explorer</h1>
              <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">
                v1.0
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Betika · Mozzart · SportPesa historical jackpot archives
            </p>
          </div>
        </div>

        {/* Middle: Key Stats Bar */}
        {stats && (
          <div className="hidden xl:flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800/80 rounded-lg px-3 py-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-semibold text-slate-100">{stats.totalRecords.toLocaleString()}</span> Records
            </div>
            <span className="text-slate-700">|</span>
            <div className="text-slate-300">
              <span className="font-semibold text-slate-100">{stats.bookmakerCount}</span> Bookmakers
            </div>
            <span className="text-slate-700">|</span>
            <div className="text-slate-300">
              <span className="font-semibold text-slate-100">{stats.jackpotCount}</span> Jackpots
            </div>
            {stats.dateMin && stats.dateMax && (
              <>
                <span className="text-slate-700">|</span>
                <div className="flex items-center gap-1 text-slate-300">
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
          <div className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
            {isFiltered ? (
              <span>
                Filtered: <strong className="text-emerald-400">{filteredCount.toLocaleString()}</strong> of {totalCount.toLocaleString()}
              </span>
            ) : (
              <span>
                Total: <strong className="text-slate-200">{totalCount.toLocaleString()}</strong> matches
              </span>
            )}
          </div>

          {/* Navigation View Switch */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => onTabChange("explorer")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === "explorer"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Explorer
            </button>
            <button
              onClick={() => onTabChange("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === "analytics"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-slate-900 border-slate-800 hover:bg-slate-800"
              onClick={() => setExportOpen((prev) => !prev)}
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export</span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </Button>

            {exportOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded-md bg-slate-900 border border-slate-800 shadow-xl z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors"
                  onClick={() => {
                    exportToCsv(filteredMatches, `jackpot_matches_${filteredMatches.length}.csv`);
                    setExportOpen(false);
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  <span>Export to CSV ({filteredMatches.length.toLocaleString()})</span>
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors"
                  onClick={() => {
                    exportToJson(filteredMatches, `jackpot_matches_${filteredMatches.length}.json`);
                    setExportOpen(false);
                  }}
                >
                  <FileCode className="h-4 w-4 text-blue-400" />
                  <span>Export to JSON ({filteredMatches.length.toLocaleString()})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
