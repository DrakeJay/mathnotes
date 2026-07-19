import Link from "next/link";
import { api } from "@/lib/api";
import { PROJECTS } from "@/lib/showcase";
import type { Topic } from "@/lib/types";

/* The curriculum is grouped into broad areas on the home page. Topics not
   listed here still render, in a trailing group — new topics never vanish. */
const GROUPS: { id: string; title: string; blurb: string; slugs: string[] }[] = [
  {
    id: "machine-learning",
    title: "Machine Learning",
    blurb: "From dot products and gradients to backpropagation and the transformer.",
    slugs: ["foundations", "training", "architectures"],
  },
  {
    id: "computing",
    title: "Computing",
    blurb: "Machines, memory, logic gates, and the algorithms they run.",
    slugs: ["computation", "systems", "logic", "algorithms"],
  },
  {
    id: "mathematics",
    title: "Mathematics",
    blurb: "Geometry, numbers, chance, and data.",
    slugs: ["geometry", "number-theory", "probability", "statistics"],
  },
  {
    id: "physics",
    title: "Physics",
    blurb: "Nature's laws, simulated — and the numerics that keep them honest.",
    slugs: ["physics"],
  },
];

export default async function Home() {
  let topics: Topic[] = [];
  let backendDown = false;
  try {
    topics = await api.topics();
  } catch {
    backendDown = true;
  }

  const bySlug = new Map(topics.map((t) => [t.slug, t]));
  const grouped = GROUPS.map((g) => ({
    ...g,
    topics: g.slugs.map((s) => bySlug.get(s)).filter((t): t is Topic => t !== undefined),
  }));
  const claimed = new Set(GROUPS.flatMap((g) => g.slugs));
  const leftovers = topics.filter((t) => !claimed.has(t.slug));
  if (leftovers.length > 0) {
    grouped.push({
      id: "more",
      title: "More",
      blurb: "Newer additions, not yet sorted.",
      slugs: [],
      topics: leftovers,
    });
  }

  const lessonCount = topics.reduce((a, t) => a + t.lessons.length, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <section className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          Math, made interactive
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Short lessons on mathematics worth knowing — from Euclid&apos;s
          circle theorems to the equations inside neural networks — each with
          something to drag, plot, or train.
        </p>
        {!backendDown && (
          <p className="mt-3 text-sm text-ink-3" style={{ fontVariantNumeric: "tabular-nums" }}>
            {lessonCount} lessons across {topics.length} topics, and counting.
          </p>
        )}
        <nav className="mt-5 flex flex-wrap gap-2 text-sm">
          {[...grouped.map((g) => ({ id: g.id, title: g.title })), { id: "projects", title: "Projects" }].map(
            (g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="rounded-full border border-hairline bg-card px-3.5 py-1 text-ink-2 transition-colors hover:border-accent hover:text-foreground"
              >
                {g.title}
              </a>
            ),
          )}
        </nav>
      </section>

      {backendDown && (
        <div className="rounded-lg border border-hairline bg-card p-5 text-sm">
          <p className="font-medium">The API isn&apos;t reachable.</p>
          <p className="mt-1 text-ink-2">
            Start it with{" "}
            <code className="font-mono text-[13px]">
              cd backend && .venv/bin/uvicorn app.main:app --reload
            </code>{" "}
            (and make sure Postgres is running:{" "}
            <code className="font-mono text-[13px]">docker compose up -d</code>
            ), then refresh.
          </p>
        </div>
      )}

      {grouped.map((group) => (
        <section key={group.id} id={group.id} className="mb-14 scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">{group.title}</h2>
          <p className="mt-1 text-sm text-ink-2">{group.blurb}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.topics.flatMap((topic) =>
              topic.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.slug}`}
                  className="group rounded-lg border border-hairline bg-card p-5 transition-colors hover:border-accent"
                >
                  <div className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
                    {topic.title}
                  </div>
                  <h3 className="mt-1 font-semibold group-hover:text-accent">
                    {lesson.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {lesson.summary}
                  </p>
                </Link>
              )),
            )}
          </div>
        </section>
      ))}

      <section id="projects" className="mb-6 scroll-mt-20">
        <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
        <p className="mt-1 text-sm text-ink-2">
          A few things I&apos;ve built —{" "}
          <a
            href="https://github.com/drakejay"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-hairline underline-offset-2 hover:text-foreground"
          >
            more on GitHub
          </a>
          .
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-hairline bg-card p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold group-hover:text-accent">{p.name} ↗</h3>
                <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-ink-3">
                  {p.tech}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{p.blurb}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
