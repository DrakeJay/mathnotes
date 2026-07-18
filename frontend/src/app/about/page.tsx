import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Drake Weller — U.S. Navy veteran, computer scientist, and the builder of MathNotes.",
};

const LINKS = [
  { label: "GitHub", href: "https://github.com/drakejay", note: "projects & code" },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/drakeweller222",
    note: "background & contact",
  },
  {
    label: "This site's source",
    href: "https://github.com/DrakeJay/mathnotes",
    note: "Next.js + FastAPI + PostgreSQL",
  },
];

const PROJECTS = [
  {
    name: "LameChat",
    detail:
      "A character-level GPT built from scratch in PyTorch — multi-head self-attention and a 24-layer decoder-only transformer — served through FastAPI with temperature and sampling controls. The attention lesson on this site is the math that model runs on.",
  },
  {
    name: "Edge AI vehicle classifier",
    detail:
      "An image classifier trained on 1,211 images and deployed to a Raspberry Pi 5: real-time on-device inference at 2 ms latency in a 117 KB footprint.",
  },
  {
    name: "Distributed compute cluster",
    detail:
      "A 5-node Raspberry Pi cluster on a private network (MPICH, OpenBLAS/LAPACK), benchmarked with High-Performance LINPACK.",
  },
  {
    name: "Kardia",
    detail:
      "An ECG digitization pipeline turning scanned 12-lead paper ECGs into time-series signals with U-Net segmentation on the 86 GB PhysioNet 2024 dataset.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>

      <div className="mt-6 space-y-4 leading-relaxed text-ink-2">
        <p>
          I&apos;m <span className="font-medium text-foreground">Drake Weller</span> — a U.S. Navy
          veteran and computer scientist (B.S., Oakland University). I build machine learning and
          systems projects end to end: training transformers in PyTorch from scratch, deploying
          models on edge hardware, and wiring up the infrastructure in between.
        </p>
        <p>
          In the Navy I served as a Hospital Corpsman and CAD/CAM dental lab technician, where I
          led a lab&apos;s transition from manual fabrication to a fully digital CNC workflow —
          and learned that the best way to understand a system deeply is to teach it to someone
          else. This site is that habit, applied to mathematics.
        </p>
        <p>
          <span className="font-medium text-foreground">MathNotes</span> is my public notebook:
          interactive lessons on whatever math I find worth understanding properly — the equations
          inside neural networks, classical geometry, the theory of computation, probability.
          Every lesson has something to drag, plot, or train, and the training demos run on real
          NumPy code, live on the server. I built the platform itself, too: Next.js, FastAPI, and
          PostgreSQL, tested and deployed end to end.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Selected projects</h2>
      <ul className="mt-4 space-y-3">
        {PROJECTS.map((p) => (
          <li key={p.name} className="rounded-lg border border-hairline bg-card p-4">
            <span className="font-medium">{p.name}</span>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{p.detail}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Elsewhere</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-hairline bg-card px-4 py-3 transition-colors hover:border-accent"
          >
            <span className="font-medium group-hover:text-accent">{l.label} ↗</span>
            <span className="ml-2 text-sm text-ink-3">{l.note}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
