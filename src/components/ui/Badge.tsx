import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "home" | "draw" | "away" | "muted" | "betika" | "mozzart" | "sportpesa";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    secondary: "bg-slate-800 text-slate-300 border-slate-700",
    outline: "border-slate-700 text-slate-300",
    home: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60 font-semibold",
    draw: "bg-amber-950/60 text-amber-400 border-amber-800/60 font-semibold",
    away: "bg-sky-950/60 text-sky-400 border-sky-800/60 font-semibold",
    muted: "bg-slate-800/60 text-slate-400 border-slate-700",
    betika: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    mozzart: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    sportpesa: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors",
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
