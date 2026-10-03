import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Swords,
  Goal,
  Table as TableIcon,
  Download,
  FileSpreadsheet,
  FileCode,
  ChevronDown,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Check,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { AppStats, Match } from "../../lib/types";
import { exportToCsv, exportToJson } from "../../lib/export";
import { useTheme, type Theme } from "../../hooks/useTheme";

export type AppTab = "explorer" | "predictor" | "positions" | "teams" | "goals";

const NAV_ITEMS: { value: AppTab; label: string; icon: LucideIcon }[] = [
  { value: "explorer", label: "Explorer", icon: TableIcon },
  { value: "predictor", label: "Predictor", icon: Sparkles },
  { value: "positions", label: "Positions", icon: Layers },
  { value: "teams", label: "H2H & Teams", icon: Swords },
  { value: "goals", label: "Goals", icon: Goal },
];

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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const themeOptions: { value: Theme; label: string; icon: LucideIcon }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const closeAnd = (fn: () => void) => () => {
    fn();
    setMenuOpen(false);
  };

  return (
    <>
      <header className="border-b border-border bg-card/95 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="Football Jackpot Harness"
              className="h-9 w-9 shrink-0"
            />
            <h1 className="text-base font-bold text-foreground tracking-tight truncate">Jackpot Harness</h1>
          </div>

          {/* Center: Navigation Tabs — desktop only */}
          <div className="hidden lg:flex items-center justify-center py-0.5">
            <Tabs value={activeTab} onValueChange={(val) => onTabChange(val as AppTab)}>
              <TabsList className="h-8">
                {NAV_ITEMS.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="flex items-center gap-1.5 text-xs h-7"
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Right: Quick Stats, Theme & Export — desktop only */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Match Count Pill — filter counts only apply to the Explorer table */}
            <div className="text-xs px-2.5 py-1 rounded-md bg-muted border border-border text-muted-foreground flex items-center gap-1.5">
              {isFiltering && activeTab === "explorer" && (
                <Loader2 className="h-3 w-3 text-primary animate-spin" />
              )}
              {activeTab === "explorer" && isFiltered ? (
                <span>
                  Filtered: <strong className="text-primary">{filteredCount.toLocaleString()}</strong> of {totalCount.toLocaleString()}
                </span>
              ) : (
                <span>
                  <strong className="text-foreground">{totalCount.toLocaleString()}</strong> matches
                </span>
              )}
            </div>

            {/* Theme Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" aria-label="Toggle theme">
                    {resolvedTheme === "dark" ? (
                      <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="capitalize">{theme}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Theme
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {themeOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className="cursor-pointer"
                  >
                    <opt.icon className="h-4 w-4" />
                    <span className="flex-1">{opt.label}</span>
                    {theme === opt.value && <Check className="h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Exports the Explorer tab&apos;s current filter ({filteredMatches.length.toLocaleString()} of {totalCount.toLocaleString()} matches)
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    exportToCsv(filteredMatches, `jackpot_matches_${filteredMatches.length}.csv`);
                  }}
                  className="cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
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

          {/* md and below: open the navigation sidebar */}
          <Button
            variant="outline"
            size="icon-sm"
            className="lg:hidden shrink-0"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Closable sidebar: nav menus + theme + export below lg */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="gap-0 p-0 max-w-[20rem]!">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>Jackpot Harness</SheetTitle>
            <SheetDescription className="flex items-center gap-1.5">
              {isFiltering && activeTab === "explorer" && (
                <Loader2 className="h-3 w-3 text-primary animate-spin" />
              )}
              {activeTab === "explorer" && isFiltered ? (
                <span>
                  Filtered: <strong className="text-primary font-semibold">{filteredCount.toLocaleString()}</strong> of {totalCount.toLocaleString()} matches
                </span>
              ) : (
                <span>
                  <strong className="text-foreground font-semibold">{totalCount.toLocaleString()}</strong> matches
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto p-2" aria-label="Views">
            <p className="px-2 pt-1.5 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Views
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={closeAnd(() => onTabChange(item.value))}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <Check className="ml-auto h-3.5 w-3.5" />}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border px-2 pb-4 pt-1">
            <p className="px-2 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Theme
            </p>
            <div className="flex items-center gap-1.5 px-1">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  aria-pressed={theme === opt.value}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                    theme === opt.value
                      ? "border-primary/30 bg-primary/10 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <p className="px-2 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Export
            </p>
            <div className="flex flex-col gap-1.5 px-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={closeAnd(() =>
                  exportToCsv(filteredMatches, `jackpot_matches_${filteredMatches.length}.csv`)
                )}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                Export CSV ({filteredMatches.length.toLocaleString()})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={closeAnd(() =>
                  exportToJson(filteredMatches, `jackpot_matches_${filteredMatches.length}.json`)
                )}
              >
                <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                Export JSON ({filteredMatches.length.toLocaleString()})
              </Button>
            </div>
            <p className="px-2 pt-2 text-xs text-muted-foreground">
              Exports the Explorer tab&apos;s current filter ({filteredMatches.length.toLocaleString()} of {totalCount.toLocaleString()}).
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
