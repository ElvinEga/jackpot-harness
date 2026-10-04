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
  Compass,
  Trophy,
  Shield,
  TrendingUp,
  FlaskConical,
  Calendar,
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
export type AppMode = "jackpot" | "seasons";

export type SeasonsTab =
  | "explorer"
  | "standings"
  | "deepdive"
  | "predictor"
  | "trends"
  | "backtest"
  | "fixtures"
  | "overview"
  | "teams";

const NAV_ITEMS: { value: AppTab; label: string; icon: LucideIcon }[] = [
  { value: "explorer", label: "Explorer", icon: TableIcon },
  { value: "predictor", label: "Predictor", icon: Sparkles },
  { value: "positions", label: "Positions", icon: Layers },
  { value: "teams", label: "H2H & Teams", icon: Swords },
  { value: "goals", label: "Goals", icon: Goal },
];

export const SEASONS_NAV_ITEMS: { value: SeasonsTab; label: string; icon: LucideIcon }[] = [
  { value: "explorer", label: "Explorer", icon: Compass },
  { value: "standings", label: "Standings", icon: Trophy },
  { value: "deepdive", label: "Deep Dive", icon: Shield },
  { value: "predictor", label: "Predictor", icon: Sparkles },
  { value: "trends", label: "Trends", icon: TrendingUp },
  { value: "backtest", label: "Backtest", icon: FlaskConical },
  { value: "fixtures", label: "Fixtures", icon: TableIcon },
];

interface HeaderProps {
  stats: AppStats | null;
  filteredCount: number;
  totalCount: number;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  seasonsTab?: SeasonsTab;
  onSeasonsTabChange?: (tab: SeasonsTab) => void;
  filteredMatches: Match[];
  isFiltering?: boolean;
  appMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  filteredCount,
  totalCount,
  activeTab,
  onTabChange,
  filteredMatches,
  isFiltering = false,
  appMode,
  onModeChange,
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
          {/* Left: Branding & Mode Switcher */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <img
                src="/logo.png"
                alt="Football Analyzer"
                className="h-8 w-8 rounded-lg"
              />
              <span className="text-base font-bold text-foreground tracking-tight hidden sm:inline">
                Jackpot Harness
              </span>
            </div>

            {/* Mode Switcher Segmented Control */}
            <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border shrink-0">
              <button
                type="button"
                onClick={() => onModeChange("jackpot")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                  appMode === "jackpot"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>🎰</span>
                <span>Jackpot Mode</span>
              </button>
              <button
                type="button"
                onClick={() => onModeChange("seasons")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                  appMode === "seasons"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>🏆</span>
                <span>Seasons Mode (EPL)</span>
              </button>
            </div>
          </div>

          {/* Center: Navigation Tabs — desktop only */}
          {appMode === "jackpot" ? (
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
          ) : (
            <div className="hidden lg:flex items-center justify-center py-0.5 max-w-[calc(100vw-420px)] overflow-x-auto no-scrollbar">
              <Tabs
                value={
                  seasonsTab === "overview"
                    ? "standings"
                    : seasonsTab === "teams"
                    ? "deepdive"
                    : (seasonsTab ?? "explorer")
                }
                onValueChange={(val) => onSeasonsTabChange?.(val as SeasonsTab)}
              >
                <TabsList className="h-8 p-1">
                  {SEASONS_NAV_ITEMS.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="flex items-center gap-1.5 px-2.5 text-xs h-7 whitespace-nowrap"
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Right: Quick Stats, Theme & Export — desktop only */}
          <div className="hidden lg:flex items-center gap-2">

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

            {/* Export Dropdown — shown in Jackpot mode */}
            {appMode === "jackpot" && (
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
            )}
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

          </SheetHeader>

          <div className="p-3 border-b border-border bg-muted/20">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Select Mode
            </p>
            <div className="grid grid-cols-2 gap-1.5 bg-muted/60 p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => onModeChange("jackpot")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                  appMode === "jackpot"
                    ? "bg-card text-foreground shadow-xs font-bold border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>🎰</span>
                <span>Jackpots</span>
              </button>
              <button
                type="button"
                onClick={() => onModeChange("seasons")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                  appMode === "seasons"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>🏆</span>
                <span>Seasons</span>
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-2" aria-label="Views">
            <p className="px-2 pt-1.5 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {appMode === "jackpot" ? "Jackpot Views" : "Seasons Views"}
            </p>
            {appMode === "jackpot" ? (
              NAV_ITEMS.map((item) => {
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
              })
            ) : (
              SEASONS_NAV_ITEMS.map((item) => {
                const normalizedTab =
                  seasonsTab === "overview"
                    ? "standings"
                    : seasonsTab === "teams"
                    ? "deepdive"
                    : (seasonsTab ?? "explorer");
                const isActive = normalizedTab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={closeAnd(() => onSeasonsTabChange?.(item.value))}
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
              })
            )}
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

            {appMode === "jackpot" && (
              <>
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
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
