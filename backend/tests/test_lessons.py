"""Content CRUD and the seeded curriculum."""


def test_seeded_curriculum(client):
    topics = client.get("/api/topics").json()
    slugs = {t["slug"]: [l["slug"] for l in t["lessons"]] for t in topics}
    assert "foundations" in slugs and "training" in slugs
    assert "gradient-descent" in slugs["training"]
    assert "backpropagation" in slugs["training"]


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
