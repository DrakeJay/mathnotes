"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Markdown from "@/components/Markdown";
import { api, ApiError } from "@/lib/api";
import type { Lesson, Topic } from "@/lib/types";

const inputClass =
  "rounded-md border border-hairline bg-background px-3 py-2 text-sm text-foreground w-full";
const buttonClass =
  "rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50";

export default function LessonEditor({
  initial,
  topics,
  onUnauthorized,
}: {
  initial?: Lesson;
  topics: Topic[];
  onUnauthorized: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [topicId, setTopicId] = useState(initial?.topic_id ?? topics[0]?.id ?? 0);
  const [position, setPosition] = useState(initial?.position ?? 0);
  const [content, setContent] = useState(initial?.content ?? "");
  const [preview, setPreview] = useState(content);
  const [showPreview, setShowPreview] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Debounce the preview so KaTeX doesn't re-render on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setPreview(content), 300);
    return () => clearTimeout(t);
  }, [content]);

  async function saveLesson() {
    setBusy(true);
    setStatus(null);
    setError(null);
    const data = { title, slug, summary, content, position, topic_id: topicId };
    try {
      if (initial) {
        const saved = await api.updateLesson(initial.id, data);
        setStatus("Saved.");
        if (saved.slug !== initial.slug) {
          router.replace(`/admin/lessons/${saved.slug}`);
        }
      } else {
        const saved = await api.createLesson(data);
        router.push(`/admin/lessons/${saved.slug}`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
      else setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteLesson() {
    if (!initial) return;
    if (!confirm(`Delete "${initial.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteLesson(initial.id);
      router.push("/admin");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
      else setError(err instanceof Error ? err.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          {initial ? `Editing: ${initial.title}` : "New lesson"}
        </h1>
        <div className="flex items-center gap-3 text-sm">
          {initial && (
            <a
              href={`/lessons/${initial.slug}`}
              className="text-ink-3 hover:text-foreground"
            >
              View lesson
            </a>
          )}
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="text-ink-3 hover:text-foreground"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          {initial && (
            <button
              onClick={deleteLesson}
              disabled={busy}
              className="hover:opacity-80"
              style={{ color: "var(--status-critical)" }}
            >
              Delete
            </button>
          )}
          <button onClick={saveLesson} disabled={busy || !title.trim()} className={buttonClass}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {(status || error) && (
        <p
          className="mt-3 text-sm"
          style={{ color: error ? "var(--status-critical)" : "var(--ink-secondary)" }}
        >
          {error ?? status}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          Title
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          Slug (blank = from title)
          <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          Topic
          <select
            className={inputClass}
            value={topicId}
            onChange={(e) => setTopicId(Number(e.target.value))}
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          Position (sort order)
          <input
            type="number"
            className={inputClass}
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-3 sm:col-span-2 lg:col-span-4">
          Summary
          <input className={inputClass} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </label>
      </div>

      <div className={`mt-4 grid gap-4 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          Content — Markdown with $inline$ and $$block$$ math, plus{" "}
          <code>&lt;demo name=&quot;…&quot;&gt;&lt;/demo&gt;</code> for interactive demos
          <textarea
            className={`${inputClass} min-h-[60vh] font-mono text-[13px] leading-relaxed`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
          />
        </label>
        {showPreview && (
          <div className="min-h-[60vh] overflow-y-auto rounded-md border border-hairline bg-card p-6">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <Markdown content={preview} demoMode="placeholder" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
