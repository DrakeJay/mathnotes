"""Seed and sync the starter curriculum.

`sync_seed_content` runs at every app startup (and via `python -m app.seed`):

- creates topics and lessons that exist in TOPICS but not in the database,
  so newly shipped seed lessons appear on deploy;
- refreshes lessons whose content has never been hand-edited in the admin UI
  (detected by updated_at == created_at);
- never touches hand-edited lessons.

Consequence worth knowing: deleting a seeded lesson in the admin UI without
also removing its entry below means it comes back on the next startup.
"""

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
            {
                "slug": "softmax-cross-entropy",
                "title": "Softmax and Cross-Entropy",
                "summary": "How networks turn scores into probabilities over many classes, why cross-entropy is the right loss, and the clean gradient that pairs them.",
            },
        ],
    },
    {
        "slug": "architectures",
        "title": "Modern Architectures",
        "description": "The building blocks of today's models — attention and the transformer.",
        "position": 3,
        "lessons": [
            {
                "slug": "attention",
                "title": "Attention: The Math Behind Transformers",
                "summary": "Queries, keys, and values; scaled dot-product attention; causal masking — the equation at the heart of every LLM, built from dot products and softmax.",
            },
        ],
    },
    {
        "slug": "geometry",
        "title": "Classical Geometry",
        "description": "Timeless results from Euclidean geometry, made draggable.",
        "position": 4,
        "lessons": [
            {
                "slug": "thales-theorem",
                "title": "Thales' Theorem",
                "summary": "Every point of a circle sees the diameter at a right angle — proved with two isosceles triangles, 2,600 years ago.",
            },
            {
                "slug": "inscribed-angle-theorem",
                "title": "The Inscribed Angle Theorem",
                "summary": "An inscribed angle is half the central angle on the same arc — so a whole arc of points sees a chord at the same angle.",
            },
            {
                "slug": "equal-tangent-theorem",
                "title": "The Equal Tangent Theorem",
                "summary": "The two tangent segments from an outside point are exactly equal — two right triangles sharing a hypotenuse, plus a construction from Thales.",
            },
        ],
    },
    {
        "slug": "computation",
        "title": "Theory of Computation",
        "description": "What machines can compute — automata, languages, and the limits of algorithms.",
        "position": 5,
        "lessons": [
            {
                "slug": "finite-automata",
                "title": "Finite Automata",
                "summary": "The simplest machines that compute: states and transitions, a three-state machine that does number theory, and the sharp limit of finite memory.",
            },
            {
                "slug": "stacks",
                "title": "Stacks",
                "summary": "Last-in-first-out memory: matching brackets, evaluating expressions without parentheses, powering recursion — and upgrading finite automata past the aⁿbⁿ wall.",
            },
        ],
    },
    {
        "slug": "systems",
        "title": "Data Structures & Memory",
        "description": "How data actually lives in a machine — bytes, pointers, and the structures built on them.",
        "position": 6,
        "lessons": [
            {
                "slug": "stack-in-memory",
                "title": "The Stack in Memory",
                "summary": "From LIFO abstraction to bytes: array-plus-pointer implementations, call frames and return addresses, stack vs. heap, and why the crash is called a stack overflow.",
            },
        ],
    },
    {
        "slug": "logic",
        "title": "Logic & Circuits",
        "description": "Boolean algebra and the gates that turn it into hardware.",
        "position": 7,
        "lessons": [
            {
                "slug": "logic-gates",
                "title": "Logic Gates",
                "summary": "Truth tables, the universality of NAND, De Morgan's laws, and the half adder — how true and false become arithmetic.",
            },
        ],
    },
    {
        "slug": "number-theory",
        "title": "Number Theory",
        "description": "Divisibility, remainders, and the ancient algorithms behind modern cryptography.",
        "position": 8,
        "lessons": [
            {
                "slug": "euclidean-algorithm",
                "title": "The Euclidean Algorithm",
                "summary": "The oldest algorithm still in use: gcd by repeated remainders, squares tiling a rectangle, Fibonacci worst cases, and Bézout's identity powering RSA.",
            },
        ],
    },
    {
        "slug": "algorithms",
        "title": "Algorithms",
        "description": "Recipes for computing — searching, sorting, and the analysis that separates fast from slow.",
        "position": 9,
        "lessons": [
            {
                "slug": "search-algorithms",
                "title": "Search Algorithms",
                "summary": "Linear vs. binary search: why sorted data turns O(n) into O(log n), the invariant that keeps binary search honest, and why the logarithm can't be beaten.",
            },
        ],
    },
]


def sync_seed_content(db: Session) -> None:
    for topic_spec in TOPICS:
        topic = db.scalar(select(Topic).where(Topic.slug == topic_spec["slug"]))
        if topic is None:
            topic = Topic(
                slug=topic_spec["slug"],
                title=topic_spec["title"],
                description=topic_spec["description"],
                position=topic_spec["position"],
            )
            db.add(topic)
            db.flush()
            print(f"seed: created topic {topic.slug}")
        for position, lesson_spec in enumerate(topic_spec["lessons"], start=1):
            content = (CONTENT_DIR / f"{lesson_spec['slug']}.md").read_text()
            lesson = db.scalar(select(Lesson).where(Lesson.slug == lesson_spec["slug"]))
            if lesson is None:
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
                print(f"seed: created lesson {lesson_spec['slug']}")
                continue
            if lesson.updated_at != lesson.created_at:
                continue  # hand-edited in the admin UI; leave it alone
            if lesson.content != content or lesson.summary != lesson_spec["summary"]:
                lesson.content = content
                lesson.summary = lesson_spec["summary"]
                print(f"seed: refreshed lesson {lesson_spec['slug']}")
    db.commit()


if __name__ == "__main__":
    from .database import SessionLocal

    with SessionLocal() as session:
        sync_seed_content(session)
