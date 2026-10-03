import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
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
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/Badge";
import type { Match } from "@/lib/types";

interface DataTableProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ matches, onSelectMatch }) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [pageSize, setPageSize] = useState<number>(50);

  const columns = useMemo<ColumnDef<Match>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => {
          const val = info.getValue() as string | null;
          return (
            <span className="font-mono text-xs text-muted-foreground">
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
          <span className="text-xs text-foreground truncate max-w-[150px] block" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "home_team",
        header: "Home Team",
        cell: (info) => (
          <span className="font-semibold text-xs text-foreground truncate max-w-[180px] block" title={info.getValue() as string}>
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
          <span className="font-semibold text-xs text-foreground truncate max-w-[180px] block" title={info.getValue() as string}>
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
            <span className="text-xs text-muted-foreground truncate max-w-[170px] block" title={val || ""}>
              {val || "—"}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: matches,
    columns,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalRows = matches.length;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

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
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Scrollable table container */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-card/95 backdrop-blur shadow-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase cursor-pointer select-none hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSorted === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-primary" />
                        ) : isSorted === "desc" ? (
                          <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100" />
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
                className="cursor-pointer hover:bg-muted/60 transition-colors"
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
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                table.setPageSize(newSize);
              }}
              className="bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {[25, 50, 100, 250].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Shadcn Pagination Controls */}
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
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
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
