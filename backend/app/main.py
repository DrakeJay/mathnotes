from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import ensure_admin_user
from .config import settings
from .database import Base, SessionLocal, engine
from .routers import auth, lessons, ml, topics
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_if_empty(db)
        ensure_admin_user(db)
    yield


app = FastAPI(title="MathNotes API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(topics.router)
app.include_router(lessons.router)
app.include_router(ml.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
