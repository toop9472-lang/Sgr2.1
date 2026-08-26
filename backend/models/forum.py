"""طير — Forum / Community discussions model."""
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


def _now():
    return datetime.now(timezone.utc)


ForumCategory = Literal[
    "general",         # عام
    "tips",            # نصائح وخبرات
    "experience",      # تجربتي
    "health",          # صحة الطيور
    "food",            # التغذية
    "breeding",        # التزاوج والتفريخ
    "questions",       # أسئلة
    "market",          # سوق ونقاشات
]


class ForumPost(BaseModel):
    post_id: str
    author_id: str
    author_name: Optional[str] = None
    title: str
    body: str
    category: ForumCategory = "general"
    tags: List[str] = []
    images: List[str] = []

    likes_count: int = 0
    liked_by: List[str] = []
    replies_count: int = 0
    views_count: int = 0

    is_pinned: bool = False
    is_locked: bool = False
    is_flagged: bool = False

    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class ForumReply(BaseModel):
    reply_id: str
    post_id: str
    author_id: str
    author_name: Optional[str] = None
    body: str
    likes_count: int = 0
    liked_by: List[str] = []
    created_at: datetime = Field(default_factory=_now)


class ForumPostCreate(BaseModel):
    title: str
    body: str
    category: ForumCategory = "general"
    tags: List[str] = []
    images: List[str] = []
    author_name: Optional[str] = None


class ForumReplyCreate(BaseModel):
    body: str
    author_name: Optional[str] = None


FORUM_CATEGORIES: List[dict] = [
    {"id": "general",    "name_ar": "عام",                 "icon": "message-square"},
    {"id": "tips",       "name_ar": "نصائح وخبرات",         "icon": "lightbulb"},
    {"id": "experience", "name_ar": "تجربتي",              "icon": "star"},
    {"id": "health",     "name_ar": "صحة الطيور",           "icon": "heart-pulse"},
    {"id": "food",       "name_ar": "التغذية",             "icon": "wheat"},
    {"id": "breeding",   "name_ar": "التزاوج والتفريخ",     "icon": "egg"},
    {"id": "questions",  "name_ar": "أسئلة",               "icon": "help-circle"},
    {"id": "market",     "name_ar": "سوق ونقاشات",         "icon": "bird"},
]
