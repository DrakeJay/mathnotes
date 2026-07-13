"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LessonEditor from "@/components/admin/LessonEditor";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Lesson, Topic } from "@/lib/types";

export default function EditLessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const auth = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.lesson(slug), api.topics()])
      .then(([l, t]) => {
        setLesson(l);
        setTopics(t);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError && err.status === 404
            ? "Lesson not found."
            : "Failed to load — is the backend running?",
        );
      });
  }, [slug]);

  if (auth.state === "loading") return null;
  if (auth.state === "anon") {
    return (
      <p className="mx-auto max-w-3xl px-6 py-24 text-sm text-ink-2">
        You need to{" "}
        <Link href="/admin" className="underline">
          log in
        </Link>{" "}
        first.
      </p>
    );
  }
  if (error) {
    return <p className="mx-auto max-w-3xl px-6 py-24 text-sm text-ink-2">{error}</p>;
  }
  if (!lesson || !topics) return null;

  return (
    <LessonEditor
      key={lesson.id}
      initial={lesson}
      topics={topics}
      onUnauthorized={() => void auth.refresh()}
    />
  );
}
