"""Content CRUD and the seeded curriculum."""


def test_seeded_curriculum(client):
    topics = client.get("/api/topics").json()
    slugs = {t["slug"]: [l["slug"] for l in t["lessons"]] for t in topics}
    assert "foundations" in slugs and "training" in slugs and "architectures" in slugs
    assert "gradient-descent" in slugs["training"]
    assert "backpropagation" in slugs["training"]
    assert "attention" in slugs["architectures"]


def test_lesson_content_renders_math_and_demos(client):
    lesson = client.get("/api/lessons/backpropagation").json()
    assert "$$" in lesson["content"]
    assert '<demo name="neural-network">' in lesson["content"]


def test_unknown_lesson_404(client):
    assert client.get("/api/lessons/does-not-exist").status_code == 404


def test_lesson_crud_and_slug_uniqueness(admin):
    topic_id = admin.get("/api/topics").json()[0]["id"]

    first = admin.post(
        "/api/lessons", json={"title": "Slug Test Lesson", "topic_id": topic_id}
    )
    assert first.status_code == 201
    assert first.json()["slug"] == "slug-test-lesson"

    second = admin.post(
        "/api/lessons", json={"title": "Slug Test Lesson", "topic_id": topic_id}
    )
    assert second.status_code == 201
    assert second.json()["slug"] == "slug-test-lesson-2"

    updated = admin.put(
        f"/api/lessons/{second.json()['id']}", json={"summary": "updated"}
    )
    assert updated.status_code == 200
    assert updated.json()["summary"] == "updated"

    for lesson in (first.json(), second.json()):
        assert admin.delete(f"/api/lessons/{lesson['id']}").status_code == 204
    assert admin.get("/api/lessons/slug-test-lesson").status_code == 404


def test_create_lesson_rejects_unknown_topic(admin):
    res = admin.post("/api/lessons", json={"title": "X", "topic_id": 99999})
    assert res.status_code == 400


def test_seed_sync_recreates_missing_lessons(admin):
    from app.database import SessionLocal
    from app.seed import sync_seed_content

    lesson = admin.get("/api/lessons/softmax-cross-entropy").json()
    assert admin.delete(f"/api/lessons/{lesson['id']}").status_code == 204

    with SessionLocal() as db:
        sync_seed_content(db)

    restored = admin.get("/api/lessons/softmax-cross-entropy")
    assert restored.status_code == 200
    assert "Temperature" in restored.json()["content"]


def test_seed_sync_preserves_hand_edited_lessons(admin):
    from sqlalchemy import text

    from app.database import SessionLocal
    from app.seed import sync_seed_content

    lesson = admin.get("/api/lessons/gradient-descent").json()
    admin.put(f"/api/lessons/{lesson['id']}", json={"content": "my custom edit"})

    with SessionLocal() as db:
        sync_seed_content(db)
    assert admin.get("/api/lessons/gradient-descent").json()["content"] == "my custom edit"

    # Un-mark the lesson as edited; sync then restores the seed content.
    with SessionLocal() as db:
        db.execute(
            text("UPDATE lessons SET updated_at = created_at WHERE slug = 'gradient-descent'")
        )
        db.commit()
        sync_seed_content(db)
    assert "update rule" in admin.get("/api/lessons/gradient-descent").json()["content"]
