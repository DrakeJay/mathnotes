import type {
  GradientDescentParams,
  GradientDescentResult,
  GradientFlowParams,
  GradientFlowResult,
  Lesson,
  LessonInput,
  LessonSummary,
  MomentumParams,
  MomentumResult,
  Topic,
  TrainNetworkParams,
  TrainNetworkResult,
} from "./types";

/* In the browser, requests go to the same origin and Next.js rewrites proxy
   them to the backend (keeping the session cookie first-party). On the
   server, fetch needs an absolute URL to the backend directly. */
const API_URL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const api = {
  topics: () => request<Topic[]>("/api/topics"),
  lessons: () => request<LessonSummary[]>("/api/lessons"),
  lesson: (slug: string) => request<Lesson>(`/api/lessons/${encodeURIComponent(slug)}`),

  login: (password: string) =>
    request<{ ok: boolean }>("/api/auth/login", jsonInit("POST", { password })),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ authenticated: boolean }>("/api/auth/me"),

  createLesson: (data: LessonInput) =>
    request<Lesson>("/api/lessons", jsonInit("POST", data)),
  updateLesson: (id: number, data: Partial<LessonInput>) =>
    request<Lesson>(`/api/lessons/${id}`, jsonInit("PUT", data)),
  deleteLesson: (id: number) =>
    request<void>(`/api/lessons/${id}`, { method: "DELETE" }),

  createTopic: (data: { title: string; description?: string; position?: number }) =>
    request<Topic>("/api/topics", jsonInit("POST", data)),

  gradientDescent: (params: GradientDescentParams) =>
    request<GradientDescentResult>("/api/ml/gradient-descent", jsonInit("POST", params)),
  trainNetwork: (params: TrainNetworkParams) =>
    request<TrainNetworkResult>("/api/ml/train-network", jsonInit("POST", params)),
  momentum: (params: MomentumParams) =>
    request<MomentumResult>("/api/ml/momentum", jsonInit("POST", params)),
  gradientFlow: (params: GradientFlowParams) =>
    request<GradientFlowResult>("/api/ml/gradient-flow", jsonInit("POST", params)),
};
