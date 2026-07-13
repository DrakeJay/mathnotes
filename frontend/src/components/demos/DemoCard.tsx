"use client";

/** Shared chrome for interactive demos: a card with a title row, a controls
 *  row (per the dataviz interaction spec: filters in one row above the charts),
 *  and the chart area. */
export default function DemoCard({
  title,
  controls,
  children,
  footer,
}: {
  title: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="not-prose my-8 rounded-xl border border-hairline bg-card p-4 sm:p-5">
      <h4 className="text-sm font-semibold">{title}</h4>
      {controls && (
        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-hairline pb-4 text-xs">
          {controls}
        </div>
      )}
      <div className="mt-4">{children}</div>
      {footer && <div className="mt-3 text-xs text-ink-2">{footer}</div>}
    </section>
  );
}

export function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-ink-3">{label}</span>
      {children}
    </label>
  );
}

export const selectClass =
  "rounded-md border border-hairline bg-background px-2 py-1.5 text-xs text-foreground";
export const buttonClass =
  "rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50";
