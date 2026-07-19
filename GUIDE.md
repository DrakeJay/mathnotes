# MathNotes Developer Guide

Reference documentation for this project: how it is put together, how to run
it, how to make changes, and how to deploy. The [README](README.md) is the
short version.

## Table of contents

1. [Architecture](#1-architecture)
2. [Repository map](#2-repository-map)
3. [How a request flows](#3-how-a-request-flows)
4. [The backend, file by file](#4-the-backend-file-by-file)
5. [The frontend, file by file](#5-the-frontend-file-by-file)
6. [Running everything locally](#6-running-everything-locally)
7. [Making changes step by step](#7-making-changes-step-by-step)
8. [Testing](#8-testing)
9. [Deployment](#9-deployment)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Architecture

MathNotes is three processes:

```
┌─────────────────────────┐
│  Browser                │
└───────────┬─────────────┘
            │ every request goes to ONE origin
┌───────────▼─────────────┐
│  Next.js  (port 3000)   │   frontend/ — React pages, charts, editor
│  ├─ renders pages (SSR) │
│  └─ proxies /api/* ─────┼──┐   (rewrite in next.config.ts)
└─────────────────────────┘  │
┌────────────────────────────▼──┐
│  FastAPI  (port 8000)         │   backend/ — content CRUD, auth,
│  ├─ lesson/topic endpoints    │   NumPy math for the live demos
│  ├─ session auth (cookies)    │
│  └─ /api/ml/* (NumPy demos)   │
└───────────┬───────────────────┘
┌───────────▼─────────────┐
│  PostgreSQL (port 5433) │   docker-compose.yml — lessons, topics,
└─────────────────────────┘   users, sessions, alembic_version
```

Design decisions and the reasons for them:

- **The browser only ever talks to the Next.js origin.** Client-side calls to
  `/api/...` are proxied to FastAPI by a rewrite rule. This keeps the session
  cookie *first-party* (no CORS, no third-party-cookie problems) and means
  production works the same way as local dev.
- **Lessons are Markdown stored in Postgres**, written with LaTeX math and
  special `<demo name="..."></demo>` tags that the frontend turns into live
  interactive components.
- **Four demos compute on the server in NumPy**
  (`backend/app/routers/ml.py`). Gradient descent and backpropagation are
  implemented longhand — the same equations the lessons derive — and the
  frontend only visualizes the JSON they return.
- **Auth is single-admin**: bcrypt-hashed password in a `users` table,
  revocable server-side sessions delivered as httpOnly cookies. Anyone can
  read; editing requires login.
- **Schema is managed by Alembic migrations** which run automatically at app
  startup; a test fails CI if models and migrations ever drift.

Production runs the same three processes on different hosts: Vercel runs
Next.js, Railway runs FastAPI and Postgres (see [§9 Deployment](#9-deployment)).

---

## 2. Repository map

```
math/
├── docker-compose.yml          Postgres 16 on HOST PORT 5433 (5432 is taken
│                               by a system Postgres on this machine)
├── README.md                   Quick overview + setup
├── GUIDE.md                    This file
├── .github/workflows/ci.yml    CI: backend pytest + frontend build on push
│
├── backend/
│   ├── requirements.txt        Runtime deps (FastAPI, SQLAlchemy, NumPy…)
│   ├── requirements-dev.txt    Test deps (pytest, httpx)
│   ├── .env.example            Copy to .env to override settings locally
│   ├── Dockerfile              Production image (Railway builds this)
│   ├── railway.json            Railway build/health-check config
│   ├── alembic.ini             Alembic entry point (URL comes from app config)
│   ├── alembic/
│   │   ├── env.py              Wires Alembic to app settings + models
│   │   └── versions/           One file per schema migration
│   ├── app/
│   │   ├── main.py             App assembly: lifespan (migrate→seed→admin),
│   │   │                       CORS, router registration, /api/health
│   │   ├── config.py           Settings from env vars (pydantic-settings)
│   │   ├── database.py         SQLAlchemy engine + session dependency
│   │   ├── models.py           Tables: Topic, Lesson, User, AuthSession
│   │   ├── schemas.py          Pydantic request/response shapes
│   │   ├── auth.py             bcrypt hashing, session create/verify/destroy
│   │   ├── slugs.py            slugify + uniqueness helper
│   │   ├── seed.py             First-boot curriculum + `--refresh` command
│   │   ├── seed_content/       The seeded lessons as .md files
│   │   ├── migrations.py       Runs `alembic upgrade head` programmatically
│   │   └── routers/
│   │       ├── auth.py         POST login/logout, GET me
│   │       ├── topics.py       Topic CRUD (writes require admin)
│   │       ├── lessons.py      Lesson CRUD (writes require admin)
│   │       └── ml.py           ★ The NumPy math: descent, momentum,
│   │                             MLP training w/ backprop, gradient flow
│   └── tests/                  pytest suite (self-contained, uses SQLite)
│
└── frontend/
    ├── next.config.ts          ★ /api/* rewrite → backend (the proxy)
    ├── playwright.config.ts    E2E config (expects the stack running)
    ├── tests/                  Playwright specs
    ├── .env.local              NEXT_PUBLIC_API_URL for local dev
    └── src/
        ├── app/
        │   ├── layout.tsx      Site shell: header/nav/footer, fonts, metadata
        │   ├── globals.css     Tailwind + design tokens (light AND dark)
        │   ├── page.tsx        Home: grouped curriculum + GitHub projects
        │   │                   (groups configured in lib/showcase.ts + page)
        │   ├── about/page.tsx  About Drake (bio, projects, GitHub/LinkedIn)
        │   ├── lessons/[slug]/page.tsx    Lesson page (server component)
        │   └── admin/
        │       ├── page.tsx                Login form or dashboard
        │       └── lessons/[slug]|new/     The lesson editor pages
        ├── components/
        │   ├── Markdown.tsx    ★ Markdown+KaTeX pipeline, <demo> mapping
        │   ├── admin/LessonEditor.tsx      Form + live preview editor
        │   ├── demos/
        │   │   ├── DemoBlock.tsx           ★ demo-name → component registry
        │   │   ├── DemoCard.tsx            Shared card chrome for demos
        │   │   └── *Demo.tsx               One file per interactive demo
        │   └── viz/
        │       ├── color.ts    Palette, color ramps, dark-mode hook
        │       ├── LineChart.tsx           Reusable SVG line chart
        │       └── HeatmapPlot.tsx         Canvas heatmap + SVG overlay
        └── lib/
            ├── api.ts          ★ Typed fetch helpers for every endpoint
            ├── auth.ts         useAuth() hook (session state via /me)
            └── types.ts        TypeScript mirrors of the API shapes
```

★ = the files you'll touch most often.

---

## 3. How a request flows

### Walkthrough A: viewing a lesson

1. Browser requests `GET /lessons/gradient-descent` from Next.js.
2. `src/app/lessons/[slug]/page.tsx` is a **server component**: it runs on
   the Next.js server, awaits `params` (Next 16: params is a Promise), and
   calls `api.lesson(slug)`.
3. `lib/api.ts` notices it's running server-side (`typeof window ===
   "undefined"`) and fetches the **absolute** backend URL
   (`NEXT_PUBLIC_API_URL`), server-to-server. No cookies involved — lesson
   reading is public.
4. FastAPI (`routers/lessons.py`) queries Postgres by slug, returns JSON.
5. The page renders `<Markdown content={lesson.content} />`:
   - `remark-math` finds `$...$` / `$$...$$` → `rehype-katex` typesets them
   - `remark-gfm` handles tables/lists
   - `rehype-raw` parses raw HTML including `<demo name="...">` tags
   - `rehype-highlight` colors ```python fences (token theme in globals.css)
   - The `components` map turns each `demo` element into `<DemoBlock>`
6. HTML streams to the browser; interactive demo components hydrate and run.

### Walkthrough B: running a live demo

1. The `GradientDescentDemo` component mounts (or a slider changes) and calls
   `api.gradientDescent({surface, learning_rate, steps})`.
2. In the browser, `api.ts` uses a **relative** URL (`/api/ml/...`), so the
   request hits the Next.js origin, and the rewrite in `next.config.ts`
   proxies it to FastAPI.
3. `routers/ml.py` runs actual gradient descent in NumPy — a loop applying
   `θ ← θ − η∇L` with a divergence guard — and returns the trajectory, the
   losses, and a 61×61 grid of surface values.
4. The component renders the grid as a canvas heatmap (`HeatmapPlot`), the
   path as SVG on top, and the losses via `LineChart`.

### Walkthrough C: logging in (how the cookie works)

1. Admin page posts `{password}` to `/api/auth/login` (through the proxy).
2. `routers/auth.py` finds the admin `User`, checks the password against the
   **bcrypt hash** (never plaintext).
3. `auth.create_session()` generates a random token, stores its **SHA-256**
   in the `sessions` table with an expiry, and sets the raw token as an
   **httpOnly, SameSite=Lax** cookie (`mathnotes_session`; plus `Secure` in
   production). httpOnly means JavaScript can never read it — XSS can't
   steal your session.
4. Every write endpoint depends on `require_admin`, which hashes the cookie
   token, looks up the session row, and checks expiry. **Logout deletes the
   row** — which is why revocation is real, unlike a stateless JWT.
5. The frontend never touches tokens. `useAuth()` just asks `GET
   /api/auth/me` "am I logged in?" and the cookie rides along automatically.

---

## 4. The backend, file by file

### config.py — settings

All configuration comes from environment variables (or `backend/.env`),
with dev-friendly defaults:

| Env var | Default | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://mathnotes:mathnotes@localhost:5433/mathnotes` | Any `postgres://`-style URL is auto-normalized to the psycopg3 dialect |
| `ADMIN_PASSWORD` | `letmein` | Source of truth for the admin account — the stored hash re-syncs to this on startup |
| `SESSION_TTL_HOURS` | `168` (7 days) | Session/cookie lifetime |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS (production) |
| `CORS_ORIGINS` | localhost:3000 | Mostly vestigial thanks to the proxy |

### main.py — application startup

The `lifespan` function runs before the first request, in this order:
`run_migrations()` (alembic upgrade head) → `sync_seed_content()` (creates
missing seed topics/lessons, refreshes never-edited ones) →
`ensure_admin_user()` (creates or re-syncs the admin from `ADMIN_PASSWORD`).

### models.py — four tables

- `topics 1─* lessons` (cascade delete), both with unique indexed `slug`
- `users 1─* sessions` (cascade delete); `sessions.token_hash` stores the
  SHA-256 of the cookie token, never the token itself
- `lessons.updated_at` auto-updates on edit — `seed.py --refresh` uses
  `updated_at == created_at` to detect "never hand-edited"

### routers/ml.py — ML demo endpoints

All demo computations live in this file.

| Endpoint | Math it implements | Used by demo |
| --- | --- | --- |
| `POST /api/ml/gradient-descent` | `run_descent()`: θ ← θ − η∇L on bowl / saddle / Rosenbrock, divergence guard | `gradient-descent` |
| `POST /api/ml/momentum` | Same loop with heavy-ball velocity `v ← βv + ∇L`, both runs returned for comparison | `momentum` |
| `POST /api/ml/train-network` | Full MLP: `mlp_init/forward/backward` + gradient updates, binary cross-entropy, decision-boundary grid | `neural-network` |
| `POST /api/ml/gradient-flow` | One backward pass per activation, recording mean \|∂L/∂W\| per layer (the vanishing-gradient measurement) | `vanishing-gradients` |

The shared helpers (`mlp_init`, `mlp_forward`, `mlp_backward`, `bce_loss`)
exist once and are unit-tested against finite differences — if you change
them and break the calculus, `pytest` fails.

Every request model uses pydantic `Field` bounds (e.g. `epochs ≤ 2000`) so
requests cannot trigger arbitrarily large computations.

### seed.py — seed data

`TOPICS` lists the seeded topics/lessons; each lesson's body lives in
`seed_content/<slug>.md`. `sync_seed_content()` runs at every startup and
can also be run manually:

```bash
.venv/bin/python -m app.seed    # create missing lessons, refresh un-edited ones
```

Rules: lessons edited in the admin UI are never overwritten (detected by
`updated_at == created_at`); lessons present in `TOPICS` but missing from the
database are created — which also means deleting a seeded lesson in the admin
UI without removing its `TOPICS` entry brings it back on the next startup.

---

## 5. The frontend, file by file

### The Markdown pipeline (components/Markdown.tsx)

Plugin order matters: `remark-gfm` + `remark-math` → `rehype-raw` →
`rehype-katex`. Two custom mappings:

- `demo` elements render `<DemoBlock name=... mode=...>`; in the editor
  preview `mode="placeholder"` so typing doesn't hammer the API.
- Paragraphs *containing* a demo tag are unwrapped (`containsDemo`).
  **Why:** CommonMark treats `<demo ...></demo>` as *inline* HTML, wrapping
  it in `<p>`. A `<section>` inside `<p>` is invalid HTML — browsers
  reparent it, React hydration fails. Don't remove this.

### The demo system (components/demos/)

`DemoBlock.tsx` holds the registry: `DEMO_NAMES` (for error messages) and
`DEMOS` (name → component). A lesson embeds a demo by name:

```markdown
Some paragraph before.

<demo name="gradient-descent"></demo>

Some paragraph after.
```

Keep a blank line above and below the tag. Unknown names render a helpful
"available demos" box rather than crashing.

Current demos — client-side (math runs in the browser):
`linear-transform`, `dot-product`, `activation-functions`, `tangent-line`,
`softmax`, `attention`, plus the diagrams `attention-pipeline` and
`transformer-architecture`, and the geometry constructions `thales`,
`inscribed-angle`, `equal-tangents` (shared helpers in
`demos/geometry.ts`), the steppable machine runners `finite-automata`,
`stack-machine`, and `call-stack`, the `logic-gates` circuit playground, the `euclidean` gcd tiling, the `binary-search` race, the `fibonacci` recursion tree, the probability simulators `coin-flips` and `galton-board`, the `descriptive-stats` dot plot, and the physics sims `projectile-sim` and `orbit-sim`.
Server-side (math runs in NumPy via `/api/ml/*`):
`gradient-descent`, `momentum`, `neural-network`, `vanishing-gradients`.
Static diagrams (same embed mechanism): `attention-pipeline`,
`transformer-architecture`.

### Charts and color (components/viz/)

- `LineChart.tsx` — multi-series SVG line chart: hairline grid, 2px lines,
  end markers with a surface ring, hover crosshair + tooltip, legend when
  ≥2 series, direct end labels, optional `<details>` table view.
- `HeatmapPlot.tsx` — scalar grid drawn to a canvas (embedded in SVG as an
  image), plus a render-prop overlay for paths/points in data space, and a
  hover tooltip.
- `color.ts` — the palette. **The same tokens exist twice on purpose**:
  as CSS custom properties in `globals.css` (for SVG/DOM, auto dark-mode)
  and as JS values in `color.ts` (canvas can't read CSS vars). If you change
  a color, change it in both places. Series colors are colorblind-validated;
  use the `var(--series-*)` tokens, don't invent new hex values ad hoc.

### Auth on the client (lib/auth.ts)

`useAuth()` returns `{state: "loading" | "authed" | "anon", login, logout,
refresh}`. State comes from `GET /api/auth/me` — there is no token in
localStorage, by design. Admin pages render `null` while `loading`, a login
form when `anon`.

### api.ts — how the API base URL is chosen

```ts
const API_URL = typeof window === "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")  // SSR: direct
  : "";                                                            // browser: proxy
```

Server-side rendering fetches the backend directly; the browser goes through
the same-origin proxy so cookies work. Add new API helpers here and mirror
their response shapes in `types.ts`.

---

## 6. Running everything locally

Prerequisites already on this machine: Docker (needs sudo), Node 22 via nvm,
Python 3.12.

```bash
# Terminal 1 — database (once per boot)
cd ~/Documents/math
sudo docker compose up -d          # Postgres on localhost:5433

# Terminal 2 — backend
cd ~/Documents/math/backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-dev.txt   # FIRST TIME ONLY
.venv/bin/uvicorn app.main:app --reload      # http://localhost:8000  (docs at /docs)

# Terminal 3 — frontend
cd ~/Documents/math/frontend
npm install                                   # FIRST TIME ONLY
npm run dev                                   # http://localhost:3000
```

First backend boot: migrations run, curriculum seeds, admin user is created.
Log in at http://localhost:3000/admin with `letmein` (or whatever
`ADMIN_PASSWORD` is in `backend/.env`).

Machine quirks to remember:

- Port **5433**, not 5432 — a system Postgres owns 5432.
- `docker` needs `sudo` until your docker-group membership takes effect in
  new login sessions.
- If `node`/`npm`/`railway`/`vercel` are "not found", the shell hasn't loaded
  nvm: `source ~/.nvm/nvm.sh` or open a fresh terminal.

---

## 7. Making changes step by step

### 7.1 Add or edit a lesson (content only — no code)

1. Go to `/admin`, log in.
2. "New lesson" (or click an existing one). Fill title (slug auto-generates
   if blank), topic, position (sort order), summary.
3. Write Markdown in the content box — live preview on the right:
   - Inline math: `$\nabla L$` · Display math: `$$ L = ... $$`
   - Tables/lists: normal GitHub Markdown
   - Interactive demo: `<demo name="neural-network"></demo>` on its own
     line, blank lines around it
4. Save. The lesson is live immediately at `/lessons/<slug>`.

### 7.2 Change the seeded curriculum (survives a fresh database)

The admin UI writes to *your* database only. To make content part of the
project itself:

1. Edit or add a file in `backend/app/seed_content/<slug>.md`.
2. If it's a **new** lesson, register it in the `TOPICS` list in
   `backend/app/seed.py` (slug, title, summary — position = list order).
3. Restart the backend (the sync runs at startup), or run
   `.venv/bin/python -m app.seed`. New lessons are created; lessons you've
   hand-edited in the admin UI are never overwritten.
4. Commit the seed files.

### 7.3 Create a client-side interactive demo

Example: a demo named `my-widget`.

1. Create `frontend/src/components/demos/MyWidgetDemo.tsx`:

   ```tsx
   "use client";
   import DemoCard from "./DemoCard";

   export default function MyWidgetDemo() {
     return (
       <DemoCard title="My widget" footer={<span>caption…</span>}>
         {/* SVG / controls here */}
       </DemoCard>
     );
   }
   ```

2. Register it in `DemoBlock.tsx`: import it, add `"my-widget"` to
   `DEMO_NAMES`, add `"my-widget": MyWidgetDemo` to `DEMOS`.
3. Use `<demo name="my-widget"></demo>` in any lesson.
4. Style rules that keep it consistent: wrap in `DemoCard`; use
   `var(--series-blue)` etc. for data marks and `var(--viz-*)` for chart
   chrome (both themes work automatically); reuse `LineChart` where a line
   chart fits; controls go in the `controls` prop (one row above charts).
5. Verify: `npm run dev`, view a lesson using it, check light AND dark mode
   (OS-level toggle), then `npm run build` to catch type errors.

### 7.4 Create a server-computed demo (full-stack)

Follow the `momentum` demo as a template end to end:

1. **Endpoint** — in `backend/app/routers/ml.py`, add a pydantic request
   model with `Field` bounds and a `@router.post("/my-endpoint")` function.
   Compute with NumPy; return plain lists/floats (`.tolist()`, `float()`).
2. **Test it with curl** before writing any frontend:
   `curl -s -X POST localhost:8000/api/ml/my-endpoint -H 'Content-Type: application/json' -d '{...}'`
3. **Backend test** — add a case to `backend/tests/test_ml_api.py`
   (shape, bounds, one behavioral assertion). `pytest` must pass.
4. **Types** — mirror the request/response in `frontend/src/lib/types.ts`;
   add a helper in `api.ts`.
5. **Component** — new `*Demo.tsx` that fetches in `useEffect` (debounce
   sliders ~250 ms like `GradientDescentDemo`) or on a button click for
   heavy computations (like `NeuralNetworkDemo`); handle the error state
   ("Is the backend running?").
6. **Register** in `DemoBlock.tsx`, embed in a lesson (7.1/7.2), verify in
   the browser, run `npm run build`.

### 7.5 Change the database schema

1. Edit `backend/app/models.py` (add a column, table, index…).
2. Generate a migration:
   ```bash
   cd backend && .venv/bin/alembic revision --autogenerate -m "add lessons.reading_time"
   ```
3. **Review the generated file** in `alembic/versions/` — autogenerate is a
   draft. Known issue: replace `server_default=sa.text('now()')` with
   `sa.func.now()` (portable to the SQLite test DB).
4. Apply: restart uvicorn (migrations run at startup) or
   `.venv/bin/alembic upgrade head`.
5. Run `pytest` — `test_migrations.py` fails if models and migrations
   disagree, or if your migration can't downgrade.
6. Update `schemas.py` (API shapes) and `types.ts` (frontend) if the change
   is user-visible. Commit the migration file with the model change.

### 7.6 Add a new API endpoint (non-ML)

1. Add the route to the right file in `backend/app/routers/` (or a new
   router file — then `app.include_router(...)` in `main.py`).
2. Public reads take `db: Session = Depends(get_db)`; writes add
   `dependencies=[Depends(require_admin)]` — copy the pattern in
   `lessons.py`.
3. Request/response models go in `schemas.py`.
4. Test in `backend/tests/` (use the `client` fixture for public routes,
   `admin` for authed ones), then wire up `api.ts`/`types.ts` if the
   frontend needs it.

### 7.7 Add a new page

Create `frontend/src/app/<route>/page.tsx`. Server component (default) if it
just fetches and renders — remember `params` is a Promise in Next 16:
`const { slug } = await params`. Add `"use client"` only if you need state,
effects, or event handlers. Link to it from `layout.tsx` (header) or
wherever makes sense.

### 7.8 Change colors / theme / typography

- Site tokens: `frontend/src/app/globals.css` `:root` block (light) and the
  `@media (prefers-color-scheme: dark)` block (dark). Tailwind classes like
  `text-ink-2`, `bg-card`, `border-hairline` come from the `@theme inline`
  mapping there.
- Chart colors: change **both** `globals.css` and `viz/color.ts` (canvas
  needs JS values). Series palettes were validated for colorblind safety —
  if you swap hues, keep high contrast between adjacent series.
- Prose styling comes from `@tailwindcss/typography` (`prose` classes on
  lesson pages).

### 7.9 Change the admin password

- **Local:** copy `backend/.env.example` to `backend/.env`, set
  `ADMIN_PASSWORD=...`, restart uvicorn. The stored hash re-syncs on boot.
- **Production:** Railway dashboard → backend service → Variables → edit
  `ADMIN_PASSWORD` → redeploy happens automatically. All existing sessions
  keep working until they expire; log in again with the new password.

---

## 8. Testing

### Backend (pytest — fast, no services needed)

```bash
cd backend && .venv/bin/python -m pytest          # whole suite (~5s)
.venv/bin/python -m pytest tests/test_ml_math.py -v    # one file, verbose
```

`tests/conftest.py` points the app at a throwaway SQLite file **before**
importing it, so the suite is fully self-contained. What lives where:

| File | Guards |
| --- | --- |
| `test_ml_math.py` | The calculus: backprop vs finite differences, descent stability threshold, momentum superiority, dataset sanity |
| `test_ml_api.py` | ML endpoints over HTTP: shapes, behavior, input bounds |
| `test_auth.py` | Cookie flags, revocation, expiry, bcrypt storage |
| `test_lessons.py` | CRUD, slug uniqueness, seeding, 404s |
| `test_migrations.py` | Migrations build a schema matching the models (drift = CI failure), and downgrade cleanly |

### Frontend E2E (Playwright — needs the full stack running)

```bash
cd frontend && npm run test:e2e
# against production:
E2E_BASE_URL=https://<site> ADMIN_PASSWORD=<prod pw> npm run test:e2e
```

The admin spec creates and then deletes its own throwaway lesson, so it
leaves the database clean — but it does log in, so run it against databases
you own.

### CI

`.github/workflows/ci.yml` runs pytest and the frontend production build on
every push to `main` and every PR. Check status: `gh run list --limit 3`.
E2E is local-only for now (CI has no running stack).

---

## 9. Deployment

**Live site:** https://nablanotes.vercel.app

| Piece | Where | How it's built |
| --- | --- | --- |
| Frontend | Vercel, project `mathnotes` (free) | `vercel --prod` uploads and builds |
| Backend | Railway, project `mathnotes`, service `backend` (~$5/mo) | `railway up` builds `backend/Dockerfile` |
| Postgres | Railway, service `Postgres` | managed |

### Redeploying after changes

```bash
source ~/.nvm/nvm.sh                      # if the CLIs aren't found

# backend changed:
cd ~/Documents/math/backend && railway up --service backend --ci

# frontend changed:
cd ~/Documents/math/frontend && vercel --prod
```

Deploys are **manual** — pushing to GitHub does *not* deploy (CI only runs
tests). Both dashboards can be connected to the GitHub repo for
push-to-deploy if you ever want that.

### Production environment variables

| Where | Variable | Value |
| --- | --- | --- |
| Railway → backend → Variables | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (a reference, resolves automatically) |
| | `ADMIN_PASSWORD` | the strong production password (view it here if you forget) |
| | `COOKIE_SECURE` | `true` |
| Vercel → mathnotes → Settings → Environment Variables | `NEXT_PUBLIC_API_URL` | `https://backend-production-1ffa.up.railway.app` |
| | `API_PROXY_URL` | same URL (used by the rewrite) |

Changing Vercel env vars requires a redeploy to take effect
(`vercel --prod`); Railway redeploys automatically on variable changes.

### Logs, verification, rollback

```bash
railway logs --service backend            # live backend logs
vercel ls --prod                          # deployment history
curl -s https://backend-production-1ffa.up.railway.app/api/health
E2E_BASE_URL=<site> ADMIN_PASSWORD=<pw> npm run test:e2e   # full check
```

Rollback: Vercel dashboard → Deployments → promote an older one. Railway
dashboard → backend → Deployments → redeploy a previous build.

### Known production issues (already handled)

- Vercel **deployment protection** was on by default (site redirected to
  Vercel SSO); it's disabled in project settings. New Vercel projects will
  do this again.
- Managed Postgres URLs (`postgresql://…`) are auto-normalized to the
  psycopg3 dialect in `config.py` — don't hand-edit `DATABASE_URL`.
- Startup-time migrations are fine at 1 instance. If you ever scale to
  multiple replicas, run `alembic upgrade head` as a release step instead.

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Home page says "The API isn't reachable" | Backend not running, or Postgres down | Start Postgres (`sudo docker compose up -d`), then uvicorn; check `curl localhost:8000/api/health` |
| Backend crashes on boot: `password authentication failed` | Talking to the *system* Postgres on 5432 instead of the container on 5433 | Check `DATABASE_URL` port is **5433**; is the container up? |
| `node`/`npm`/`vercel`/`railway`: command not found | Shell hasn't loaded nvm | `source ~/.nvm/nvm.sh` or open a new terminal |
| React error #418 / hydration mismatch on a lesson | A block component ended up inside a `<p>` (e.g. new markdown element), or SSR/client render differs | See the `p` unwrapping in `Markdown.tsx`; never branch render on `typeof window` outside `useEffect` |
| Demo shows "Unknown demo `x`" | Name not registered | Add it to `DEMOS`/`DEMO_NAMES` in `DemoBlock.tsx`; check spelling in the lesson |
| Demo stuck on "Running…" with API error | Backend down, or request outside pydantic bounds (422) | Check backend logs; try the endpoint with curl |
| Math not rendering (`$x$` shows literally) | Malformed delimiters, or KaTeX CSS missing | Check `$` pairing; `katex/dist/katex.min.css` is imported in `layout.tsx` |
| Login always fails locally | `ADMIN_PASSWORD` in `backend/.env` differs from what you're typing | The env var is the source of truth; hash re-syncs on restart |
| Logged out unexpectedly | Session expired (7 days) or sessions table cleared | Log in again — nothing is wrong |
| `pytest` fails in `test_migrations.py` | You changed models without a migration (drift), or wrote a non-portable migration | See §7.5; check `server_default` portability |
| `alembic` says "Target database is not up to date" | DB has unapplied migrations | `.venv/bin/alembic upgrade head` |
| Prod site broken right after deploy | Env var missing/stale, or backend still booting | `railway logs`; hit `/api/health`; remember Vercel env changes need a redeploy |
| Vercel URL redirects to an SSO page | Deployment protection re-enabled (new project or setting change) | Vercel dashboard → Settings → Deployment Protection → disable |

---

*When you change how something works, update the section of this file that
describes it.*
