"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Topic } from "@/lib/types";

const inputClass =
  "rounded-md border border-hairline bg-background px-3 py-2 text-sm text-foreground";
const buttonClass =
  "rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50";

export default function AdminPage() {
  const auth = useAuth();

  if (auth.state === "loading") return null;
  if (auth.state === "anon") return <LoginForm onLogin={auth.login} />;
  return <Dashboard onLogout={auth.logout} onUnauthorized={auth.refresh} />;
}

function LoginForm({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onLogin(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Admin login</h1>
      <p className="mt-2 text-sm text-ink-2">
        Enter the admin password to edit lessons.
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={inputClass}
          autoFocus
        />
        {error && (
          <p className="text-sm" style={{ color: "var(--status-critical)" }}>
            {error}
          </p>
        )}
        <button type="submit" className={buttonClass} disabled={busy || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({
  onLogout,
  onUnauthorized,
}: {
  onLogout: () => Promise<void>;
  onUnauthorized: () => Promise<void>;
}) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTopics(await api.topics());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createTopic({ title: newTopic, position: topics.length + 1 });
      setNewTopic("");
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) await onUnauthorized();
      else setError(err instanceof Error ? err.message : "Failed to create topic");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/lessons/new" className={buttonClass}>
            New lesson
          </Link>
          <button
            onClick={() => void onLogout()}
            className="text-sm text-ink-3 hover:text-foreground"
          >
            Log out
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}

      {topics.map((topic) => (
        <section key={topic.id} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">
            {topic.title}
          </h2>
          <ul className="mt-2 divide-y divide-hairline rounded-lg border border-hairline bg-card">
            {topic.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/admin/lessons/${lesson.slug}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-background"
                >
                  <span className="font-medium">{lesson.title}</span>
                  <span className="font-mono text-xs text-ink-3">
                    /{lesson.slug}
                  </span>
                </Link>
              </li>
            ))}
            {topic.lessons.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-3">No lessons yet.</li>
            )}
          </ul>
        </section>
      ))}

      <form onSubmit={addTopic} className="mt-10 flex gap-2">
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="New topic title…"
          className={`${inputClass} flex-1`}
        />
        <button type="submit" className={buttonClass} disabled={busy || !newTopic.trim()}>
          Add topic
        </button>
      </form>
    </div>
  );
}
