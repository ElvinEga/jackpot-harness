import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnDef,
  type RowSelectionState,
  flexRender,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  MoreHorizontal,
  Swords,
  Sparkles,
  Goal,
  Shield,
  FileSpreadsheet,
  X,
  Eye,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationFirst,
  PaginationPrevious,
  PaginationNext,
  PaginationLast,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import type { SeasonMatch } from "../../lib/seasonTypes";
import { exportSeasonMatchesToCsv } from "../../lib/export";
import { SeasonActionsModal, type SeasonActionType } from "./SeasonActionsModal";

interface SeasonDataTableProps {
  matches: SeasonMatch[];
  allMatches?: SeasonMatch[];
  onSelectMatch: (match: SeasonMatch) => void;
  onNavigateToPredictor?: (home: string, away: string) => void;
  onNavigateToTeam?: (team: string) => void;
}

export const SeasonDataTable: React.FC<SeasonDataTableProps> = ({
  matches,
  allMatches = matches,
  onSelectMatch,
  onNavigateToPredictor,
  onNavigateToTeam,
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageSize, setPageSize] = useState<number>(50);

  // Modal action state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<SeasonActionType>("h2h");
  const [actionTargetMatches, setActionTargetMatches] = useState<SeasonMatch[]>([]);

  const handleOpenAction = (type: SeasonActionType, targets: SeasonMatch[]) => {
    setActionType(type);
    setActionTargetMatches(targets);
    setActionModalOpen(true);
  };

  const columns = useMemo<ColumnDef<SeasonMatch>[]>(
    () => [
      // Checkbox Selector Column
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center pl-1 pr-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center pl-1 pr-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(val) => row.toggleSelected(!!val)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
      },
      // Season
      {
        accessorKey: "season",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
          >
            <span>Season</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-mono">
            {row.original.season}
          </Badge>
        ),
      },
      // Date
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
          >
            <span>Date</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground font-mono text-xs whitespace-nowrap">
            {row.original.date}
            {row.original.kickoff_time && (
              <span className="text-[10px] ml-1 text-muted-foreground/75">
                {row.original.kickoff_time}
              </span>
            )}
          </div>
        ),
      },
      // Fixture: Home Team vs Away Team
      {
        id: "fixture",
        header: () => <span className="font-semibold text-xs">Match Fixture</span>,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center gap-1.5 font-medium text-xs">
              <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); onNavigateToTeam?.(m.home_team); }}>
                {m.home_team}
              </span>
              <span className="text-muted-foreground font-normal text-[10px]">vs</span>
              <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); onNavigateToTeam?.(m.away_team); }}>
                {m.away_team}
              </span>
            </div>
          );
        },
      },
      // Full Time Score
      {
        accessorKey: "score",
        header: () => <div className="text-center font-semibold text-xs">FT Score</div>,
        cell: ({ row }) => (
          <div className="text-center font-bold font-mono text-xs">
            <span className="px-2 py-0.5 rounded-md bg-muted border border-border text-foreground">
              {row.original.score}
            </span>
          </div>
        ),
      },
      // Result Badge
      {
        accessorKey: "result",
        header: () => <div className="text-center font-semibold text-xs">Result</div>,
        cell: ({ row }) => {
          const res = row.original.result;
          const badgeClass =
            res === "home"
              ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
              : res === "draw"
              ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
              : "bg-blue-500/15 text-blue-500 border-blue-500/30";
          return (
            <div className="text-center">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeClass}`}>
                {res}
              </span>
            </div>
          );
        },
      },
      // Half-Time Score
      {
        accessorKey: "half_time_score",
        header: () => <div className="text-center font-semibold text-xs">HT</div>,
        cell: ({ row }) => (
          <div className="text-center font-mono text-muted-foreground text-xs">
            {row.original.half_time_score || "—"}
          </div>
        ),
      },
      // Shots (Target)
      {
        id: "shots",
        header: () => <div className="text-center font-semibold text-xs">Shots (Target)</div>,
        cell: ({ row }) => {
          const m = row.original;
          const hs = m.stats.home_shots ?? "—";
          const as = m.stats.away_shots ?? "—";
          const hst = m.stats.home_shots_on_target ?? "—";
          const ast = m.stats.away_shots_on_target ?? "—";
          return (
            <div className="text-center font-mono text-xs text-muted-foreground">
              {hs}:{as} <span className="text-[10px]">({hst}:{ast})</span>
            </div>
          );
        },
      },
      // Corners
      {
        id: "corners",
        header: () => <div className="text-center font-semibold text-xs">Corners</div>,
        cell: ({ row }) => {
          const m = row.original;
          const hc = m.stats.home_corners ?? "—";
          const ac = m.stats.away_corners ?? "—";
          return (
            <div className="text-center font-mono text-xs text-muted-foreground">
              {hc}:{ac}
            </div>
          );
        },
      },
      // Referee
      {
        accessorKey: "referee",
        header: () => <span className="font-semibold text-xs">Referee</span>,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate max-w-28 block">
            {row.original.referee || "—"}
          </span>
        ),
      },
      // Market Average Pre-Match Odds
      {
        id: "odds",
        header: () => <div className="text-right font-semibold text-xs">Avg Odds (H / D / A)</div>,
        cell: ({ row }) => {
          const o = row.original.odds;
          return (
            <div className="text-right font-mono text-xs text-muted-foreground">
              <span className="text-foreground font-semibold">{o.home?.toFixed(2) || "—"}</span> /{" "}
              <span>{o.draw?.toFixed(2) || "—"}</span> /{" "}
              <span>{o.away?.toFixed(2) || "—"}</span>
            </div>
          );
        },
      },
      // Row Actions Menu
      {
        id: "actions",
        header: () => <div className="text-right font-semibold text-xs">Actions</div>,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-xs" className="h-6 w-6">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Match Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onSelectMatch(m)}>
                    <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                    <span>View Match Details</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenAction("h2h", [m])}>
                    <Swords className="h-3.5 w-3.5 mr-2 text-primary" />
                    <span>Head-to-Head History</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenAction("prediction", [m])}>
                    <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                    <span>Match Intelligence &amp; xG</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigateToTeam?.(m.home_team)}>
                    <Shield className="h-3.5 w-3.5 mr-2" />
                    <span>Analyze {m.home_team}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigateToTeam?.(m.away_team)}>
                    <Shield className="h-3.5 w-3.5 mr-2" />
                    <span>Analyze {m.away_team}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [onSelectMatch, onNavigateToTeam]
  );

  const table = useReactTable({
    data: matches,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedMatches = useMemo(
    () => selectedRows.map((r) => r.original),
    [selectedRows]
  );

  // Pagination bounds
  const totalRows = matches.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      pages.push(0);
      if (pageIndex > 2) pages.push("ellipsis");
      const start = Math.max(1, pageIndex - 1);
      const end = Math.min(pageCount - 2, pageIndex + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (pageIndex < pageCount - 3) pages.push("ellipsis");
      pages.push(pageCount - 1);
    }
    return pages;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Table Container */}
      <div className="flex-1 overflow-auto bg-card">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-2.5 px-3 h-9">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => onSelectMatch(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-2 py-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No matches found matching criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Floating Checkbox Action Toolbar (sticky bottom) */}
      {selectedMatches.length > 0 && (
        <div className="sticky bottom-14 z-20 mx-auto mb-2 flex items-center gap-2 p-2 rounded-xl bg-card border border-border shadow-2xl backdrop-blur max-w-2xl animate-in fade-in slide-in-from-bottom-2">
          <Badge variant="default" className="text-xs font-mono font-bold px-2 py-1 bg-primary text-primary-foreground">
            {selectedMatches.length} Selected
          </Badge>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleOpenAction("h2h", selectedMatches)}
              className="text-xs h-7 gap-1"
            >
              <Swords className="h-3.5 w-3.5 text-primary" />
              <span>Head to Head</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => handleOpenAction("prediction", selectedMatches)}
              className="text-xs h-7 gap-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Match Intelligence</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => handleOpenAction("goals", selectedMatches)}
              className="text-xs h-7 gap-1"
            >
              <Goal className="h-3.5 w-3.5 text-primary" />
              <span>Goal Averages</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => handleOpenAction("discipline", selectedMatches)}
              className="text-xs h-7 gap-1"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Discipline</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                exportSeasonMatchesToCsv(
                  selectedMatches,
                  `season_matches_${selectedMatches.length}.csv`
                )
              }
              className="text-xs h-7 gap-1"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>

            <Button
              size="xs"
              variant="ghost"
              onClick={() => table.resetRowSelection()}
              className="text-xs h-7 text-muted-foreground hover:text-foreground px-2"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Pagination & Status Footer */}
      <div className="border-t border-border bg-card/70 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-foreground">{startRow.toLocaleString()}–{endRow.toLocaleString()}</strong> of{" "}
            <strong className="text-foreground">{totalRows.toLocaleString()}</strong> fixtures
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span>Rows:</span>
            <NativeSelect
              size="sm"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                table.setPageSize(newSize);
              }}
              className="w-20"
            >
              {[25, 50, 100, 250].map((size) => (
                <NativeSelectOption key={size} value={size}>
                  {size}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        {/* Shadcn Pagination Controls */}
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationFirst
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              />
            </PaginationItem>

            {getPageNumbers().map((p, idx) => (
              <PaginationItem key={idx}>
                {p === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    isActive={pageIndex === p}
                    onClick={() => table.setPageIndex(p)}
                  >
                    {p + 1}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationLast
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Actions Modal */}
      <SeasonActionsModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        initialAction={actionType}
        selectedMatches={actionTargetMatches}
        allMatches={allMatches}
        onNavigateToPredictor={onNavigateToPredictor}
        onNavigateToTeam={onNavigateToTeam}
      />
    </div>
  );
};
