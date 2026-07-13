"""Session auth lifecycle through the HTTP API."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import update

from app.auth import SESSION_COOKIE


def test_me_starts_anonymous(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json() == {"authenticated": False}


def test_wrong_password_rejected(client):
    res = client.post("/api/auth/login", json={"password": "wrong"})
    assert res.status_code == 401
    assert SESSION_COOKIE not in client.cookies


def test_login_sets_httponly_cookie(client):
    res = client.post("/api/auth/login", json={"password": "test-password"})
    assert res.status_code == 200
    set_cookie = res.headers["set-cookie"]
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie
    assert client.get("/api/auth/me").json() == {"authenticated": True}


def test_mutations_require_session(client):
    res = client.post("/api/lessons", json={"title": "X", "topic_id": 1})
    assert res.status_code == 401


def test_logout_revokes_server_side(admin):
    token = admin.cookies[SESSION_COOKIE]
    assert admin.post("/api/auth/logout").status_code == 200

    # Replay the *old* token: the session row is gone, so it must fail.
    res = admin.post(
        "/api/lessons",
        json={"title": "X", "topic_id": 1},
        headers={"Cookie": f"{SESSION_COOKIE}={token}"},
    )
    assert res.status_code == 401


def test_expired_session_rejected(admin):
    from app.database import SessionLocal
    from app.models import AuthSession

    with SessionLocal() as db:
        db.execute(
            update(AuthSession).values(
                expires_at=datetime.now(timezone.utc) - timedelta(hours=1)
            )
        )
        db.commit()

    assert admin.get("/api/auth/me").json() == {"authenticated": False}
    res = admin.post("/api/lessons", json={"title": "X", "topic_id": 1})
    assert res.status_code == 401


def test_password_not_stored_in_plaintext():
    from app.database import SessionLocal
    from app.models import User
    from sqlalchemy import select

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.is_admin))
        assert user is not None
        assert "test-password" not in user.password_hash
        assert user.password_hash.startswith("$2")  # bcrypt marker
