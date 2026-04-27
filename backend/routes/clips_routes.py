from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import uuid

router = APIRouter(prefix="/clips", tags=["Clips"])

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "saqr_db")]


class CreateClipRequest(BaseModel):
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    video_url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = ""
    duration_seconds: int = 15


class ToggleLikeRequest(BaseModel):
    user_id: str


class AddCommentRequest(BaseModel):
    user_id: str
    user_name: str
    comment: str


@router.get("/feed")
async def get_clips_feed(limit: int = 30):
    normalized_limit = max(1, min(80, int(limit or 30)))
    clips = await db.clips_posts.find(
        {},
        {"_id": 0},
    ).sort("created_at", -1).limit(normalized_limit).to_list(normalized_limit)

    return {
        "clips": clips,
        "count": len(clips),
    }


@router.post("/create")
async def create_clip_post(request: CreateClipRequest):
    duration = int(request.duration_seconds or 0)
    if duration <= 0 or duration > 15:
        raise HTTPException(status_code=400, detail="مدة المقطع يجب أن تكون بين 1 و 15 ثانية")

    video_url = (request.video_url or "").strip()
    if not video_url.startswith("http"):
        raise HTTPException(status_code=400, detail="رابط المقطع غير صالح")

    thumb = (request.thumbnail_url or "").strip() or "https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e14c91a9e40e8d29b6f8d3bf567a4fcb7020c985b1a9d3e96e2035b06f9921e6.png"
    caption = (request.caption or "").strip()[:180]
    created_at = datetime.now(timezone.utc).isoformat()
    clip_id = str(uuid.uuid4())

    clip_doc = {
        "clip_id": clip_id,
        "user_id": request.user_id,
        "user_name": request.user_name or "مستخدم",
        "user_avatar": request.user_avatar,
        "video_url": video_url,
        "thumbnail_url": thumb,
        "caption": caption,
        "duration_seconds": duration,
        "likes_count": 0,
        "liked_by": [],
        "comments_count": 0,
        "comments": [],
        "created_at": created_at,
    }

    await db.clips_posts.insert_one(clip_doc)
    return {
        "success": True,
        "clip": clip_doc,
    }


@router.post("/{clip_id}/toggle-like")
async def toggle_clip_like(clip_id: str, request: ToggleLikeRequest):
    clip = await db.clips_posts.find_one({"clip_id": clip_id}, {"_id": 0, "liked_by": 1, "likes_count": 1})
    if not clip:
        raise HTTPException(status_code=404, detail="المقطع غير موجود")

    liked_by = clip.get("liked_by", []) or []
    user_id = request.user_id
    is_liked = user_id in liked_by

    if is_liked:
        likes_count = max(0, int(clip.get("likes_count", len(liked_by))) - 1)
        await db.clips_posts.update_one(
            {"clip_id": clip_id},
            {
                "$pull": {"liked_by": user_id},
                "$set": {"likes_count": likes_count},
            },
        )
        return {"success": True, "liked": False, "likes_count": likes_count}

    likes_count = int(clip.get("likes_count", len(liked_by))) + 1
    await db.clips_posts.update_one(
        {"clip_id": clip_id},
        {
            "$addToSet": {"liked_by": user_id},
            "$set": {"likes_count": likes_count},
        },
    )
    return {"success": True, "liked": True, "likes_count": likes_count}


@router.post("/{clip_id}/comment")
async def add_clip_comment(clip_id: str, request: AddCommentRequest):
    text = (request.comment or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="التعليق مطلوب")
    if len(text) > 220:
        raise HTTPException(status_code=400, detail="التعليق طويل جداً")

    comment_doc = {
        "comment_id": str(uuid.uuid4()),
        "user_id": request.user_id,
        "user_name": request.user_name or "مستخدم",
        "comment": text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    updated = await db.clips_posts.find_one_and_update(
        {"clip_id": clip_id},
        {
            "$inc": {"comments_count": 1},
            "$push": {
                "comments": {
                    "$each": [comment_doc],
                    "$slice": -40,
                }
            },
        },
        projection={"_id": 0, "comments_count": 1},
    )

    if not updated:
        raise HTTPException(status_code=404, detail="المقطع غير موجود")

    return {
        "success": True,
        "comment": comment_doc,
        "comments_count": int((updated.get("comments_count", 0) or 0) + 1),
    }
