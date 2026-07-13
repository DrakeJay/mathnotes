import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { api, ApiError } from "@/lib/api";
import type { Lesson } from "@/lib/types";

async function fetchLesson(slug: string): Promise<Lesson | null> {
  try {
    return await api.lesson(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = await fetchLesson(slug);
  return lesson ? { title: lesson.title, description: lesson.summary } : {};
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = await fetchLesson(slug);
  if (!lesson) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="mb-10">
        <div className="flex items-center justify-between text-sm">
          <Link href="/" className="text-ink-3 hover:text-foreground">
            ← All lessons
          </Link>
          <Link
            href={`/admin/lessons/${lesson.slug}`}
            className="text-ink-3 hover:text-foreground"
          >
            Edit
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {lesson.title}
        </h1>
        <p className="mt-3 text-ink-2">{lesson.summary}</p>
        <p className="mt-2 text-xs text-ink-3">
          Updated{" "}
          {new Date(lesson.updated_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <Markdown content={lesson.content} />
      </div>
    </article>
  );
}
