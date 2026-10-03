import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "jackpot-theme";

function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "system";
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

const listeners = new Set<() => void>();
let current: Theme = typeof window === "undefined" ? "system" : getStoredTheme();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Theme {
  return current;
}

if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (current === "system") applyTheme("system");
    listeners.forEach((cb) => cb());
  });
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "system" as Theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    current = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
    listeners.forEach((cb) => cb());
  }, []);

  return { theme, setTheme, resolvedTheme: resolveTheme(theme) };
}
