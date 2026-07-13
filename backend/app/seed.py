"""Seed the database with the starter curriculum on first boot."""

from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Lesson, Topic

CONTENT_DIR = Path(__file__).parent / "seed_content"

TOPICS = [
    {
        "slug": "foundations",
        "title": "Foundations",
        "description": "The linear algebra and calculus every neural network is built on.",
        "position": 1,
        "lessons": [
            {
                "slug": "vectors-matrices-linear-layers",
                "title": "Vectors, Matrices, and Linear Layers",
                "summary": "Vectors as data, dot products as neurons, and matrices as whole layers that transform space.",
            },
            {
                "slug": "gradients-chain-rule",
                "title": "Derivatives, Gradients, and the Chain Rule",
                "summary": "Derivatives as sensitivities, the gradient as the uphill direction, and why sensitivities multiply through composed functions.",
            },
        ],
    },
    {
        "slug": "training",
        "title": "Training Neural Networks",
        "description": "How networks actually learn: following gradients downhill, computed by backpropagation.",
        "position": 2,
        "lessons": [
            {
                "slug": "gradient-descent",
                "title": "Gradient Descent",
                "summary": "The one-line algorithm behind all of deep learning, and how learning rate and curvature make or break it.",
            },
            {
                "slug": "backpropagation",
                "title": "Backpropagation",
                "summary": "The chain rule organized into one backward sweep — every gradient in the network for the cost of two forward passes.",
            },
        ],
    },
]


def refresh_seed_content(db: Session) -> None:
    """Re-apply seed-file content to seeded lessons that have never been
    edited in the admin UI (updated_at still equals created_at), so shipping
    new seed content doesn't clobber anyone's changes."""
    for topic_spec in TOPICS:
        for lesson_spec in topic_spec["lessons"]:
            lesson = db.scalar(select(Lesson).where(Lesson.slug == lesson_spec["slug"]))
            if lesson is None:
                print(f"skip {lesson_spec['slug']}: not in database")
                continue
            if lesson.updated_at != lesson.created_at:
                print(f"skip {lesson_spec['slug']}: edited since seeding")
                continue
            content = (CONTENT_DIR / f"{lesson_spec['slug']}.md").read_text()
            if lesson.content == content and lesson.summary == lesson_spec["summary"]:
                print(f"skip {lesson_spec['slug']}: already current")
                continue
            lesson.content = content
            lesson.summary = lesson_spec["summary"]
            print(f"refreshed {lesson_spec['slug']}")
    db.commit()


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(Topic).limit(1)) is not None:
        return
    for topic_spec in TOPICS:
        topic = Topic(
            slug=topic_spec["slug"],
            title=topic_spec["title"],
            description=topic_spec["description"],
            position=topic_spec["position"],
        )
        db.add(topic)
        db.flush()
        for position, lesson_spec in enumerate(topic_spec["lessons"], start=1):
            content = (CONTENT_DIR / f"{lesson_spec['slug']}.md").read_text()
            db.add(
                Lesson(
                    topic_id=topic.id,
                    slug=lesson_spec["slug"],
                    title=lesson_spec["title"],
                    summary=lesson_spec["summary"],
                    content=content,
                    position=position,
                )
            )
    db.commit()
    print(f"Seeded {len(TOPICS)} topics.")


if __name__ == "__main__":
    import sys

    from .database import SessionLocal

    with SessionLocal() as session:
        if "--refresh" in sys.argv:
            refresh_seed_content(session)
        else:
            seed_if_empty(session)
