"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, readTheme, THEME_EVENT, type Theme } from "@/lib/theme";

/* The switch between the modern site and the 1999 one. The theme lives in
   localStorage (an external store), so it's read with useSyncExternalStore:
   the server and the first client paint both render "modern", and the real
   label swaps in on hydration without a mismatch. */

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "modern");
  const hypno = theme === "hypno";

  return (
    <button
      type="button"
      onClick={() => applyTheme(hypno ? "modern" : "hypno")}
      aria-pressed={hypno}
      aria-label="Toggle 1999 theme"
      title={hypno ? "Back to the modern site" : "Enter MathNotes '99"}
      className="hypno-toggle rounded-md border border-hairline px-2 py-1 text-xs text-ink-2 transition-colors hover:border-accent hover:text-foreground"
    >
      {hypno ? "⬅ exit '99" : "✦ 1999 mode"}
    </button>
  );
}
