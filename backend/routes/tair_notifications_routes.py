"""طير — Simple in-app notifications for chat, listings, trips."""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict

from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

router = APIRouter(prefix="/tair-notifications", tags=["Tair-Notifications"])

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "saqr_db")]


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    for key in ("created_at",):
        val = doc.get(key)
        if isinstance(val, datetime):
            doc[key] = val.isoformat()
    return doc


def _now():
    return datetime.now(timezone.utc)


async def create_tair_notification(
    user_id: str,
    title: str,
    body: str,
    notif_type: str,
    data: Optional[Dict[str, Any]] = None,
) -> dict:
    """Utility called from other routes (chat, listings) to create a notif."""
    notif = {
        "notif_id": f"n_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "title": title,
        "body": body,
        "type": notif_type,
        "data": data or {},
        "is_read": False,
        "created_at": _now(),
    }
    await db.tair_notifications.insert_one(notif.copy())
    return notif


@router.get("/list")
async def list_notifications(user_id: str = Query(...), limit: int = 50):
    cursor = (
        db.tair_notifications.find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(min(limit, 200))
    )
    items = [_serialize(d) async for d in cursor]
    unread_count = await db.tair_notifications.count_documents({"user_id": user_id, "is_read": False})
    return {"items": items, "unread_count": unread_count}


@router.post("/{notif_id}/read")
async def mark_read(notif_id: str, user_id: str = Query(...)):
    await db.tair_notifications.update_one(
        {"notif_id": notif_id, "user_id": user_id},
        {"$set": {"is_read": True}},
    )
    return {"success": True}


@router.post("/read-all")
async def mark_all_read(user_id: str = Query(...)):
    r = await db.tair_notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}},
    )
    return {"success": True, "updated": r.modified_count}
