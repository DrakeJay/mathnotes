"use client";

import { useSyncExternalStore } from "react";

/* Decorations that only exist in the 1999 theme. They're always in the DOM and
   hidden by CSS in the modern theme, which keeps the server and client markup
   identical — no theme-dependent rendering, no hydration mismatch. */

const VISITS_KEY = "mathnotes_visits";
const BASE_VISITS = 13317; // every 90s homepage started its counter mid-flight

/* The hit counter reads (and bumps) localStorage, so it's an external store:
   the server renders the base number, and the visitor's own count arrives on
   subscribe — one bump per page load, like the CGI script it's imitating. */
let visits: number | null = null;

function bumpVisits() {
  if (visits !== null) return;
  try {
    visits = Number(localStorage.getItem(VISITS_KEY) ?? 0) + 1;
    localStorage.setItem(VISITS_KEY, String(visits));
  } catch {
    visits = 1; // private mode: you're visitor number one, forever
  }
}

function subscribeVisits(onChange: () => void) {
  bumpVisits();
  onChange();
  return () => {};
}

export function VisitorCounter() {
  const count = useSyncExternalStore(
    subscribeVisits,
    () => BASE_VISITS + (visits ?? 0),
    () => BASE_VISITS,
  );

  return (
    <span className="hypno-counter" aria-label="visitor counter">
      {String(count)
        .padStart(7, "0")
        .split("")
        .map((d, i) => (
          <span key={i} className="hypno-digit">
            {d}
          </span>
        ))}
    </span>
  );
}

const MARQUEE =
  "★ WELCOME 2 MATHNOTES ★ NOW WITH MOVING PICTURES ★ BEST VIEWED IN 800×600 ★ SIGN MY GUESTBOOK ★ THE GRADIENTS ARE REAL ★ NO MATH WAS HARMED ★";

export function HypnoMarquee() {
  return (
    <div className="hypno-marquee" aria-hidden="true">
      {/* two copies so the -50% scroll loops seamlessly */}
      <div className="hypno-marquee-track">
        <span>{MARQUEE}</span>
        <span>{MARQUEE}</span>
      </div>
    </div>
  );
}

export function HypnoFooter() {
  return (
    <div className="hypno-footer" aria-hidden="true">
      <span className="hypno-badge">🚧 UNDER CONSTRUCTION 🚧</span>
      <span className="hypno-badge hypno-blink">★ NEW! ★</span>
      <span>
        you are visitor <VisitorCounter />
      </span>
      <span className="hypno-badge">MADE ON A COMPUTER</span>
    </div>
  );
}
