import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Cookie, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import AuthSession, User

SESSION_COOKIE = "mathnotes_session"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def ensure_admin_user(db: Session) -> None:
    """Bootstrap (or re-sync) the admin account from ADMIN_PASSWORD, so the
    env var stays the source of truth for the single-admin setup."""
    admin = db.scalar(select(User).where(User.is_admin))
    if admin is None:
        db.add(
            User(
                username="admin",
                password_hash=hash_password(settings.admin_password),
                is_admin=True,
            )
        )
        db.commit()
    elif not verify_password(settings.admin_password, admin.password_hash):
        admin.password_hash = hash_password(settings.admin_password)
        db.commit()


def create_session(db: Session, user: User, response: Response) -> None:
    # Opportunistic cleanup of expired sessions.
    db.execute(delete(AuthSession).where(AuthSession.expires_at < datetime.now(timezone.utc)))
    token = secrets.token_urlsafe(32)
    max_age = settings.session_ttl_hours * 3600
    db.add(
        AuthSession(
            token_hash=_hash_token(token),
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=max_age),
        )
    )
    db.commit()
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=max_age,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )


def destroy_session(db: Session, token: str | None, response: Response) -> None:
    if token:
        db.execute(delete(AuthSession).where(AuthSession.token_hash == _hash_token(token)))
        db.commit()
    response.delete_cookie(SESSION_COOKIE, path="/")


def current_user(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
) -> User | None:
    if not session_token:
        return None
    session = db.scalar(
        select(AuthSession).where(AuthSession.token_hash == _hash_token(session_token))
    )
    if session is None:
        return None
    expires = session.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        return None
    return session.user


def require_admin(user: User | None = Depends(current_user)) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Not signed in")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
