/* Theme switching. The default ("modern") follows the OS light/dark setting;
   "hypno" is an opt-in 1999-web takeover, applied as data-theme on <html> so
   the whole cascade — including the demo color tokens — swaps at once.

   The <html> attribute is set by an inline script in layout.tsx before paint,
   so a hypno visitor never sees a flash of the modern theme. */

export type Theme = "modern" | "hypno";

export const THEME_KEY = "mathnotes_theme";
export const THEME_EVENT = "mathnotes:themechange";

/** Runs in <head> before first paint. Kept tiny and dependency-free — it is
 *  inlined as a string, so it cannot reference anything else in this module. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="hypno")document.documentElement.dataset.theme="hypno"}catch(e){}`;

export function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "hypno" ? "hypno" : "modern";
  } catch {
    return "modern";
  }
}

export function applyTheme(theme: Theme) {
  if (theme === "hypno") document.documentElement.dataset.theme = "hypno";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode: the theme just won't persist */
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}
