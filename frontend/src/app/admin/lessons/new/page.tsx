"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LessonEditor from "@/components/admin/LessonEditor";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Topic } from "@/lib/types";

export default function NewLessonPage() {
  const auth = useAuth();
  const [topics, setTopics] = useState<Topic[] | null>(null);

  useEffect(() => {
    api.topics().then(setTopics).catch(() => setTopics([]));
  }, []);

  if (auth.state === "loading" || topics === null) return null;
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

  return <LessonEditor topics={topics} onUnauthorized={() => void auth.refresh()} />;
}
