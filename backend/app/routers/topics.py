from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import require_admin
from ..database import get_db
from ..models import Topic
from ..schemas import TopicCreate, TopicOut, TopicUpdate
from ..slugs import unique_slug

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.get("", response_model=list[TopicOut])
def list_topics(db: Session = Depends(get_db)):
    return db.scalars(
        select(Topic)
        .options(selectinload(Topic.lessons))
        .order_by(Topic.position, Topic.id)
    ).all()


@router.post("", response_model=TopicOut, status_code=201, dependencies=[Depends(require_admin)])
def create_topic(body: TopicCreate, db: Session = Depends(get_db)):
    topic = Topic(
        title=body.title,
        slug=unique_slug(db, Topic, body.slug or body.title),
        description=body.description,
        position=body.position,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.put("/{topic_id}", response_model=TopicOut, dependencies=[Depends(require_admin)])
def update_topic(topic_id: int, body: TopicUpdate, db: Session = Depends(get_db)):
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    updates = body.model_dump(exclude_unset=True)
    if "slug" in updates:
        updates["slug"] = unique_slug(db, Topic, updates["slug"], exclude_id=topic.id)
    for field, value in updates.items():
        setattr(topic, field, value)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    db.delete(topic)
    db.commit()
