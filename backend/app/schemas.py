from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LessonSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    summary: str
    position: int
    topic_id: int


class LessonOut(LessonSummary):
    content: str
    created_at: datetime
    updated_at: datetime


class LessonCreate(BaseModel):
    title: str
    topic_id: int
    slug: str = ""
    summary: str = ""
    content: str = ""
    position: int = 0


class LessonUpdate(BaseModel):
    title: str | None = None
    topic_id: int | None = None
    slug: str | None = None
    summary: str | None = None
    content: str | None = None
    position: int | None = None


class TopicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    description: str
    position: int
    lessons: list[LessonSummary] = []


class TopicCreate(BaseModel):
    title: str
    slug: str = ""
    description: str = ""
    position: int = 0


class TopicUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    position: int | None = None


class LoginRequest(BaseModel):
    password: str
