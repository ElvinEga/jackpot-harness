import React, { useRef, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox
} from "lucide-react";
import { Badge } from "../ui/Badge";
import type { Match } from "../../lib/types";

interface MatchTableProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

export const MatchTable: React.FC<MatchTableProps> = ({ matches, onSelectMatch }) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);

  const columns = useMemo<ColumnDef<Match>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        size: 110,
        cell: (info) => {
          const val = info.getValue() as string | null;
          return (
            <span className="font-mono text-xs text-slate-300">
              {val || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "bookmaker",
        header: "Bookmaker",
        size: 100,
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
        size: 160,
        cell: (info) => (
          <span className="text-xs text-slate-300 truncate max-w-[150px] block" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "home_team",
        header: "Home Team",
        size: 200,
        cell: (info) => (
          <span className="font-semibold text-xs text-slate-100 truncate max-w-[190px] block" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "score",
        header: "Score",
        size: 75,
        cell: (info) => {
          const score = info.getValue() as string | null;
          return (
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
              {score || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "away_team",
        header: "Away Team",
        size: 200,
        cell: (info) => (
          <span className="font-semibold text-xs text-slate-100 truncate max-w-[190px] block" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "result",
        header: "Result",
        size: 95,
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
        size: 80,
        cell: (info) => {
          const val = info.getValue() as number | null;
          return (
            <span className="font-mono text-xs font-semibold text-emerald-400">
              {val !== null ? val.toFixed(2) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "league",
        header: "League",
        size: 180,
        cell: (info) => {
          const val = info.getValue() as string | null;
          return (
            <span className="text-xs text-slate-400 truncate max-w-[170px] block" title={val || ""}>
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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 42,
    overscan: 25,
  });

  if (matches.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-950">
        <Inbox className="h-12 w-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No matching matches found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Try loosening your search keywords, clearing bookmaker selection, or resetting the odds and date filters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse table-fixed">
          {/* Table Header */}
          <thead className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                      className="px-3 py-2.5 text-xs font-semibold text-slate-300 tracking-wider uppercase cursor-pointer select-none hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSorted === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-blue-400" />
                        ) : isSorted === "desc" ? (
                          <ArrowDown className="h-3 w-3 text-blue-400" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Virtualized Table Body */}
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectMatch(row.original)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center border-b border-slate-900/80 hover:bg-slate-900/70 transition-colors cursor-pointer group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="px-3 py-2 shrink-0 flex items-center"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with quick stats */}
      <div className="border-t border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-400 flex items-center justify-between">
        <div>
          Showing <span className="font-semibold text-slate-200">{rows.length.toLocaleString()}</span> virtualized records
        </div>
        <div className="text-[11px] text-slate-500">
          Click any row to open the detailed match inspector
        </div>
      </div>
    </div>
  );
};
