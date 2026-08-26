"""طير — Forum / Community API routes."""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient

from models.forum import ForumPost, ForumReply, ForumPostCreate, ForumReplyCreate, FORUM_CATEGORIES

router = APIRouter(prefix="/forum", tags=["Tair-Forum"])

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "saqr_db")]


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    for key in ("created_at", "updated_at"):
        val = doc.get(key)
        if isinstance(val, datetime):
            doc[key] = val.isoformat()
    return doc


@router.get("/categories")
async def list_categories():
    return {"items": FORUM_CATEGORIES, "total": len(FORUM_CATEGORIES)}


@router.post("/create")
async def create_post(payload: ForumPostCreate, user_id: str = Query(...)):
    post_id = f"fp_{uuid.uuid4().hex[:12]}"
    post = ForumPost(post_id=post_id, author_id=user_id, **payload.model_dump())
    doc = post.model_dump()
    await db.forum_posts.insert_one(doc)
    return _serialize(doc)


@router.get("/feed")
async def feed_posts(
    category: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 30,
    skip: int = 0,
):
    query: dict = {"is_flagged": False}
    if category:
        query["category"] = category
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"body": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.forum_posts.find(query).sort([("is_pinned", -1), ("created_at", -1)]).skip(skip).limit(min(limit, 100))
    items = [_serialize(d) async for d in cursor]
    total = await db.forum_posts.count_documents(query)
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/post/{post_id}")
async def get_post(post_id: str, viewer_id: Optional[str] = None):
    doc = await db.forum_posts.find_one({"post_id": post_id})
    if not doc:
        raise HTTPException(404, "Post not found")
    if viewer_id and viewer_id != doc.get("author_id"):
        await db.forum_posts.update_one(
            {"post_id": post_id}, {"$inc": {"views_count": 1}}
        )
    return _serialize(doc)


@router.get("/post/{post_id}/replies")
async def list_replies(post_id: str, limit: int = 100, skip: int = 0):
    cursor = db.forum_replies.find({"post_id": post_id}).sort("created_at", 1).skip(skip).limit(min(limit, 200))
    items = [_serialize(d) async for d in cursor]
    total = await db.forum_replies.count_documents({"post_id": post_id})
    return {"items": items, "total": total}


@router.post("/post/{post_id}/reply")
async def reply_to_post(post_id: str, payload: ForumReplyCreate, user_id: str = Query(...)):
    post = await db.forum_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    if post.get("is_locked"):
        raise HTTPException(403, "Post is locked")
    reply_id = f"fr_{uuid.uuid4().hex[:12]}"
    reply = ForumReply(reply_id=reply_id, post_id=post_id, author_id=user_id, **payload.model_dump())
    doc = reply.model_dump()
    await db.forum_replies.insert_one(doc)
    await db.forum_posts.update_one(
        {"post_id": post_id},
        {"$inc": {"replies_count": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return _serialize(doc)


@router.post("/post/{post_id}/like")
async def toggle_like(post_id: str, user_id: str = Query(...)):
    post = await db.forum_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    liked_by = post.get("liked_by", [])
    if user_id in liked_by:
        await db.forum_posts.update_one(
            {"post_id": post_id},
            {"$pull": {"liked_by": user_id}, "$inc": {"likes_count": -1}},
        )
        return {"liked": False}
    else:
        await db.forum_posts.update_one(
            {"post_id": post_id},
            {"$addToSet": {"liked_by": user_id}, "$inc": {"likes_count": 1}},
        )
        return {"liked": True}


@router.delete("/post/{post_id}")
async def delete_post(post_id: str, user_id: str = Query(...)):
    post = await db.forum_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    if post.get("author_id") != user_id:
        raise HTTPException(403, "Not the author")
    await db.forum_posts.delete_one({"post_id": post_id})
    await db.forum_replies.delete_many({"post_id": post_id})
    return {"success": True}
