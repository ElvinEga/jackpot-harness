import type { Match } from "./types";
import type { SeasonMatch } from "./seasonTypes";

export function exportToJson(matches: Match[], filename = "jackpot_matches.json") {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(matches, null, 2)
  )}`;
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToCsv(matches: Match[], filename = "jackpot_matches.csv") {
  const headers = [
    "Date",
    "Home Team",
    "Away Team",
    "Score",
    "Result",
    "Odds",
    "Bookmaker",
    "Jackpot",
    "League",
    "Jackpot ID",
    "Source File",
  ];

  const rows = matches.map((m) => [
    m.date || "",
    escapeCsv(m.home_team),
    escapeCsv(m.away_team),
    m.score || "",
    m.result || "",
    m.odds !== null ? m.odds.toString() : "",
    m.bookmaker,
    escapeCsv(m.jackpot),
    escapeCsv(m.league || ""),
    m.jackpot_id ? m.jackpot_id.toString() : "",
    m.source_file,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportSeasonMatchesToCsv(
  matches: SeasonMatch[],
  filename = "season_matches.csv"
) {
  const headers = [
    "Season",
    "Date",
    "Kickoff Time",
    "Home Team",
    "Away Team",
    "Score",
    "Result",
    "HT Score",
    "Home Shots",
    "Away Shots",
    "Home Corners",
    "Away Corners",
    "Referee",
    "Home Odds",
    "Draw Odds",
    "Away Odds",
  ];

  const rows = matches.map((m) => [
    m.season,
    m.date,
    m.kickoff_time || "",
    escapeCsv(m.home_team),
    escapeCsv(m.away_team),
    m.score,
    m.result,
    m.half_time_score || "",
    m.stats.home_shots?.toString() || "",
    m.stats.away_shots?.toString() || "",
    m.stats.home_corners?.toString() || "",
    m.stats.away_corners?.toString() || "",
    escapeCsv(m.referee || ""),
    m.odds.home?.toString() || "",
    m.odds.draw?.toString() || "",
    m.odds.away?.toString() || "",
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

