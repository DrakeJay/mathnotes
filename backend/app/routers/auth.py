from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import (
    SESSION_COOKIE,
    create_session,
    current_user,
    destroy_session,
    verify_password,
)
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    admin = db.scalar(select(User).where(User.is_admin))
    if admin is None or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Wrong password")
    create_session(db, admin, response)
    return {"ok": True}


@router.post("/logout")
def logout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
):
    destroy_session(db, session_token, response)
    return {"ok": True}


@router.get("/me")
def me(user: User | None = Depends(current_user)):
    return {"authenticated": user is not None and user.is_admin}
