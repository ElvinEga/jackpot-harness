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
  Layers,
  Sparkles,
  Goal,
  FileSpreadsheet,
  X,
  Check,
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

import type { Match } from "@/lib/types";
import { exportToCsv, exportToJson } from "@/lib/export";
import { ExplorerActionsModal, type ExplorerActionType } from "./ExplorerActionsModal";

interface DataTableProps {
  matches: Match[];
  allMatches?: Match[];
  onSelectMatch: (match: Match) => void;
  onNavigateToH2H?: (teamA: string, teamB: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  matches,
  allMatches = matches,
  onSelectMatch,
  onNavigateToH2H,
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageSize, setPageSize] = useState<number>(50);

  // Modal action state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<ExplorerActionType>("h2h");
  const [actionTargetMatches, setActionTargetMatches] = useState<Match[]>([]);

  const handleOpenAction = (type: ExplorerActionType, targetMatches: Match[]) => {
    setActionType(type);
    setActionTargetMatches(targetMatches);
    setActionModalOpen(true);
  };

  const columns = useMemo<ColumnDef<Match>[]>(
    () => [
      // Checkbox Selector Column
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center pl-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center pl-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(val) => row.toggleSelected(!!val)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
      },
      // Position #
      {
        accessorKey: "position",
        header: "Pos",
        cell: (info) => {
          const val = info.getValue() as number | undefined;
          return (
            <span className="font-mono text-xs font-bold text-muted-foreground">
              {val ? `#${val}` : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => {
          const val = info.getValue() as string | null;
          return (
            <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
              {val || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "bookmaker",
        header: "Bookmaker",
        cell: (info) => {
          const val = info.getValue() as Match["bookmaker"];
          if (val === "betika") return <Badge variant="betika">Betika</Badge>;
          if (val === "mozzart") return <Badge variant="mozzart">Mozzart</Badge>;
          return <Badge variant="sportpesa">SportPesa</Badge>;
        },
      },
      {
        accessorKey: "jackpot",
        header: "Jackpot",
        cell: (info) => (
          <span className="text-xs text-foreground truncate max-w-[140px] block" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "home_team",
        header: "Home Team",
        cell: (info) => (
          <span className="font-semibold text-xs text-foreground truncate max-w-[170px] block" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: (info) => {
          const score = info.getValue() as string | null;
          return (
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted border border-border text-foreground">
              {score || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "away_team",
        header: "Away Team",
        cell: (info) => (
          <span className="font-semibold text-xs text-foreground truncate max-w-[170px] block" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "result",
        header: "Result",
        cell: (info) => {
          const val = info.getValue() as Match["result"];
          if (val === "home") return <Badge variant="home">HOME</Badge>;
          if (val === "draw") return <Badge variant="draw">DRAW</Badge>;
          if (val === "away") return <Badge variant="away">AWAY</Badge>;
          if (val === "postponed") return <Badge variant="muted">POSTP</Badge>;
          if (val === "abandoned") return <Badge variant="muted">ABN</Badge>;
          return <Badge variant="secondary">{val ? val.toUpperCase() : "—"}</Badge>;
        },
      },
      {
        accessorKey: "odds",
        header: "Odds",
        cell: (info) => {
          const val = info.getValue() as number | null;
          return (
            <span className="font-mono text-xs font-semibold text-primary">
              {val !== null ? val.toFixed(2) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "league",
        header: "League",
        cell: (info) => {
          const val = info.getValue() as string | null;
          return (
            <span className="text-xs text-muted-foreground truncate max-w-[160px] block" title={val || ""}>
              {val || "—"}
            </span>
          );
        },
      },
      // Row Actions Menu
      {
        id: "actions",
        header: () => <div className="text-right pr-2">Actions</div>,
        cell: ({ row }) => {
          const match = row.original;
          return (
            <div className="flex justify-end pr-1" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-xs" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-[11px] font-mono text-muted-foreground">
                    Row #{match.position} · {match.home_team} vs {match.away_team}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => handleOpenAction("h2h", [match])}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Swords className="h-3.5 w-3.5 text-amber-400" />
                    <span>Team vs Team (H2H)</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleOpenAction("position", [match])}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Layers className="h-3.5 w-3.5 text-blue-400" />
                    <span>Position #{match.position} Analysis</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleOpenAction("likelihood", [match])}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Team Likelihood & Prediction</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleOpenAction("goals", [match])}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Goal className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Average Goals & Over/Under</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => onSelectMatch(match)}
                    className="cursor-pointer text-xs"
                  >
                    View Match Details Sheet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [onSelectMatch]
  );

  const table = useReactTable({
    data: matches,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalRows = matches.length;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  // Selected matches from the table
  const selectedMatches = useMemo(() => {
    return table.getSelectedRowModel().rows.map((r) => r.original);
  }, [table, rowSelection]);

  const selectedCount = selectedMatches.length;

  // Generate pagination window
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      pages.push(0);
      if (pageIndex > 2) pages.push("ellipsis");

      const start = Math.max(1, pageIndex - 1);
      const end = Math.min(pageCount - 2, pageIndex + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (pageIndex < pageCount - 3) pages.push("ellipsis");
      pages.push(pageCount - 1);
    }
    return pages;
  };

  if (matches.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-background">
        <Inbox className="h-12 w-12 text-muted-foreground/60 mb-3" />
        <h3 className="text-base font-semibold text-foreground">No matching matches found</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Try loosening your search keywords, clearing bookmaker selection, or resetting the odds and date filters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative">
      {/* Scrollable table container */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-card/95 backdrop-blur shadow-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={`px-3 py-3 text-xs font-semibold text-muted-foreground uppercase select-none transition-colors ${
                        canSort ? "cursor-pointer hover:text-foreground" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <>
                            {isSorted === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-primary" />
                            ) : isSorted === "desc" ? (
                              <ArrowDown className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100" />
                            )}
                          </>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onSelectMatch(row.original)}
                data-state={row.getIsSelected() && "selected"}
                className={`cursor-pointer hover:bg-muted/60 transition-colors ${
                  row.getIsSelected() ? "bg-primary/5 hover:bg-primary/10" : ""
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-3 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Floating Checkbox Action Toolbar (fixed in viewport so it stays visible while scrolling) */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card/95 border-2 border-primary/50 shadow-2xl rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 backdrop-blur-md ring-2 ring-primary/20 animate-in fade-in slide-in-from-bottom-4 flex-wrap max-w-[95vw] justify-center">
          <div className="flex items-center gap-2 border-r border-border pr-2.5">
            <Badge variant="default" className="font-mono text-xs">
              {selectedCount} selected
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleOpenAction("h2h", selectedMatches)}
              className="text-xs h-7 gap-1"
            >
              <Swords className="h-3.5 w-3.5 text-amber-400" />
              <span>Team vs Team</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => handleOpenAction("position", selectedMatches)}
              className="text-xs h-7 gap-1"
            >
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>Position Analysis</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => handleOpenAction("likelihood", selectedMatches)}
              className="text-xs h-7 gap-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Team Likelihood</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => handleOpenAction("goals", selectedMatches)}
              className="text-xs h-7 gap-1"
            >
              <Goal className="h-3.5 w-3.5 text-emerald-400" />
              <span>Average Goals</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => exportToCsv(selectedMatches, `selected_matches_${selectedMatches.length}.csv`)}
              className="text-xs h-7 gap-1"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
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
        {/* Left: Row range & Page size */}
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-foreground">{startRow.toLocaleString()}–{endRow.toLocaleString()}</strong> of{" "}
            <strong className="text-foreground">{totalRows.toLocaleString()}</strong> records
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

        {/* Right: Shadcn Pagination Controls */}
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

      {/* Explorer Actions Modal */}
      <ExplorerActionsModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        initialAction={actionType}
        selectedMatches={actionTargetMatches}
        allMatches={allMatches}
        onNavigateToH2H={onNavigateToH2H}
      />
    </div>
  );
};
