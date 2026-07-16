import Link from "next/link";
import { api } from "@/lib/api";
import type { Topic } from "@/lib/types";

export default async function Home() {
  let topics: Topic[] = [];
  let backendDown = false;
  try {
    topics = await api.topics();
  } catch {
    backendDown = true;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <section className="mb-14 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          Math, made interactive
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Short lessons on mathematics worth knowing — from Euclid&apos;s
          circle theorems to the equations inside neural networks — each with
          something to drag, plot, or train.
        </p>
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

      {topics.map((topic) => (
        <section key={topic.id} className="mb-12">
          <h2 className="text-xl font-semibold tracking-tight">
            {topic.title}
          </h2>
          <p className="mt-1 text-sm text-ink-2">{topic.description}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {topic.lessons.map((lesson, i) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.slug}`}
                className="group rounded-lg border border-hairline bg-card p-5 transition-colors hover:border-accent"
              >
                <div className="text-xs font-medium uppercase tracking-wide text-ink-3">
                  Lesson {i + 1}
                </div>
                <h3 className="mt-1 font-semibold group-hover:text-accent">
                  {lesson.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  {lesson.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
