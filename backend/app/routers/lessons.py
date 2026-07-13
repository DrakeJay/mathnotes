from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import Lesson, Topic
from ..schemas import LessonCreate, LessonOut, LessonSummary, LessonUpdate
from ..slugs import unique_slug

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.get("", response_model=list[LessonSummary])
def list_lessons(db: Session = Depends(get_db)):
    return db.scalars(select(Lesson).order_by(Lesson.position, Lesson.id)).all()


@router.get("/{slug}", response_model=LessonOut)
def get_lesson(slug: str, db: Session = Depends(get_db)):
    lesson = db.scalar(select(Lesson).where(Lesson.slug == slug))
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.post("", response_model=LessonOut, status_code=201, dependencies=[Depends(require_admin)])
def create_lesson(body: LessonCreate, db: Session = Depends(get_db)):
    if db.get(Topic, body.topic_id) is None:
        raise HTTPException(status_code=400, detail="topic_id does not exist")
    lesson = Lesson(
        title=body.title,
        slug=unique_slug(db, Lesson, body.slug or body.title),
        summary=body.summary,
        content=body.content,
        position=body.position,
        topic_id=body.topic_id,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.put("/{lesson_id}", response_model=LessonOut, dependencies=[Depends(require_admin)])
def update_lesson(lesson_id: int, body: LessonUpdate, db: Session = Depends(get_db)):
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    updates = body.model_dump(exclude_unset=True)
    if updates.get("topic_id") is not None and db.get(Topic, updates["topic_id"]) is None:
        raise HTTPException(status_code=400, detail="topic_id does not exist")
    if "slug" in updates:
        updates["slug"] = unique_slug(db, Lesson, updates["slug"], exclude_id=lesson.id)
    for field, value in updates.items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    db.delete(lesson)
    db.commit()
