# MathNotes — the math behind machine learning

A full-stack learning platform for the mathematics inside neural networks.
Lessons are written in Markdown with LaTeX and can embed **interactive demos
whose math runs live on the server in NumPy** — real gradient descent on real
loss surfaces, and a from-scratch multilayer perceptron trained with
backpropagation while you watch.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · KaTeX |
| Backend | FastAPI · SQLAlchemy 2 · NumPy · PyJWT |
| Database | PostgreSQL 16 (Docker) |

```
frontend/  Next.js app: lesson pages, admin editor, SVG/canvas visualizations
backend/   FastAPI app: content CRUD, admin auth, NumPy ML demo endpoints
docker-compose.yml  PostgreSQL (host port 5433 — 5432 is taken by system Postgres)
```

## Running it

Three processes: database, API, frontend.

```bash
# 1. Database
docker compose up -d

# 2. Backend  (http://localhost:8000 — interactive docs at /docs)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # first time
.venv/bin/uvicorn app.main:app --reload

# 3. Frontend  (http://localhost:3000)
cd frontend
npm install        # first time
npm run dev
```

On first boot the backend creates the tables and seeds the starter curriculum
(4 lessons across 2 topics).

**Admin:** go to `/admin`, password `letmein` (change via `ADMIN_PASSWORD` —
copy `backend/.env.example` to `backend/.env`). Anyone can read lessons;
editing requires login. Auth is session-based: bcrypt-hashed passwords in a
`users` table, and an httpOnly `SameSite=Lax` cookie holding an opaque token
whose SHA-256 lives in a `sessions` table — logout revokes server-side. The
browser talks only to the Next.js origin; `/api/*` is proxied to the backend
(`next.config.ts`), so the cookie stays first-party. Set `COOKIE_SECURE=true`
when serving over HTTPS.

## How content works

Lessons are Markdown stored in Postgres, edited in the browser at `/admin`
(side-by-side live preview). Three syntaxes:

- `$x^2$` inline math, `$$ ... $$` display math (KaTeX)
- GitHub-flavored Markdown (tables, lists, etc.)
- `<demo name="gradient-descent"></demo>` embeds an interactive demo

Available demos:

| Name | What it shows | Where the math runs |
| --- | --- | --- |
| `linear-transform` | A 2×2 matrix warping the plane, det as area scale | browser |
| `dot-product` | Draggable vectors: dot product, angle, projection | browser |
| `activation-functions` | sigmoid/tanh/ReLU and their derivatives | browser |
| `tangent-line` | Secant → tangent as h → 0 (the limit definition) | browser |
| `gradient-descent` | Descent paths on bowl/saddle/Rosenbrock surfaces | **server (NumPy)** |
| `momentum` | Plain descent vs. momentum, same start and η | **server (NumPy)** |
| `neural-network` | An MLP trained with backprop on toy 2D datasets | **server (NumPy)** |
| `vanishing-gradients` | Per-layer gradient magnitude vs. depth and activation | **server (NumPy)** |

The server-side demos are the point of the project: `backend/app/routers/ml.py`
implements gradient descent and backpropagation longhand in NumPy — the same
four equations the Backpropagation lesson derives — and the frontend just
visualizes the returned trajectories, loss curves, and decision boundaries.

## Testing

```bash
# Backend: unit + API tests (self-contained — spins up its own SQLite DB)
cd backend && .venv/bin/python -m pytest

# Frontend: end-to-end tests (needs the full stack running, see above)
cd frontend && npm run test:e2e
```

The backend suite covers the math as math: backprop gradients are checked
against central finite differences, gradient descent is verified to converge
below the analytic stability threshold (η < 2/λmax) and diverge above it, and
the gradient-flow endpoint must reproduce the vanishing-gradient effect. The
Playwright suite drives the real browser through login → create → render
(KaTeX included) → edit → delete → logout, and asserts the session cookie is
httpOnly. CI runs pytest and the frontend build on every push.

## API sketch

```
GET    /api/topics                  topics with nested lesson summaries
GET    /api/lessons/{slug}          full lesson content
POST   /api/auth/login              {password} → {token}
POST   /api/lessons                 create (Bearer token)   + PUT/DELETE /{id}
POST   /api/topics                  create (Bearer token)   + PUT/DELETE /{id}
POST   /api/ml/gradient-descent     {surface, learning_rate, steps} → path + grid
POST   /api/ml/train-network        {dataset, hidden_layers, …} → boundary + loss curve
```

## Notes & next steps

- Auth is production-shaped (hashed passwords, revocable httpOnly cookie
  sessions) but single-admin; multi-user means adding a registration flow and
  roles on top of the existing `users` table.
- Lesson HTML is rendered with `rehype-raw` (needed for `<demo>` tags), which
  trusts lesson content — acceptable while the only author is the admin.
- Schema changes currently rely on `create_all`; introduce Alembic migrations
  when the models next change.
- Content updates: `python -m app.seed --refresh` (from `backend/`, venv
  active) re-applies seed-file content to lessons you haven't edited in the
  admin UI.
- Ideas: lesson search, prev/next navigation, more demos (Adam and learning-rate
  schedules, softmax + cross-entropy, attention), MDX export.
