import React, { useEffect, useState } from "react";
import { getLogo } from "@/lib/logoRegistry";
import { cn } from "@/lib/utils";

export interface TeamLogoProps {
  /** Team name as displayed in the data (e.g. "Nott'm Forest", "Man City"). */
  team: string;
  /** Width and height in px. Kept square so table rows never shift. */
  size?: number;
  className?: string;
  /** What to render when no crest exists: an initials badge or nothing. */
  fallback?: "initials" | "none";
}

/**
 * 2-3 initial letters for the fallback badge, broadcast-style:
 * "Nott'm Forest" -> NFO, "Man United" -> MUN, "Liverpool" -> LIV.
 */
function initials(team: string): string {
  const words = team
    .replace(/[^A-Za-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  const first = words[0].charAt(0);
  const last = words[words.length - 1];
  return `${first}${last.slice(0, 2).toUpperCase()}`.slice(0, 3);
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  team,
  size = 24,
  className = "",
  fallback = "initials",
}) => {
  const src = getLogo(team);
  const [failed, setFailed] = useState(false);

  // a broken crest file falls back to initials instead of a broken-image icon
  useEffect(() => setFailed(false), [src]);

  const showFallback = src === undefined || failed;
  const badgeStyle: React.CSSProperties = { width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.42)) };

  if (showFallback && fallback === "none") return null;
  if (showFallback) {
    return (
      <span
        style={badgeStyle}
        title={team}
        aria-label={team}
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center rounded bg-muted font-semibold text-muted-foreground",
          className
        )}
      >
        {initials(team)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={team}
      title={team}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("inline-block shrink-0 rounded object-contain", className)}
    />
  );
};
