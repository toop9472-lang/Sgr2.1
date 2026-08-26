"""طير — Reports API (safety & compliance)."""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient

from models.tair_report import TairReport, TairReportCreate

router = APIRouter(prefix="/tair-reports", tags=["Tair-Reports"])

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "saqr_db")]


def _now():
    return datetime.now(timezone.utc)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    for k in ("created_at", "resolved_at"):
        v = doc.get(k)
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


@router.post("/create")
async def create_report(payload: TairReportCreate, user_id: str = Query(...)):
    report_id = f"rep_{uuid.uuid4().hex[:12]}"
    rep = TairReport(
        report_id=report_id,
        reporter_id=user_id,
        **payload.model_dump(),
    )
    doc = rep.model_dump()
    await db.tair_reports.insert_one(doc)

    # Auto-increment target counts.
    if payload.target_type == "listing":
        await db.listings.update_one(
            {"listing_id": payload.target_id},
            {"$inc": {"report_count": 1}},
        )
        # auto-flag if 3+ reports
        target = await db.listings.find_one({"listing_id": payload.target_id})
        if target and target.get("report_count", 0) >= 3:
            await db.listings.update_one(
                {"listing_id": payload.target_id},
                {"$set": {"is_flagged": True, "moderation_notes": "Auto-flag: 3+ reports"}},
            )

    return _serialize(doc)


@router.get("/list")
async def list_reports(status: Optional[str] = "open", user_id: str = Query(...)):
    # admin-only
    admin = await db.admins.find_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}, {"email": user_id}]},
        {"_id": 0, "id": 1},
    )
    if not admin:
        raise HTTPException(403, "Admin only")

    query: dict = {}
    if status and status != "all":
        query["status"] = status
    cursor = db.tair_reports.find(query).sort("created_at", -1)
    items = [_serialize(d) async for d in cursor.to_list(500)]
    return {"items": items, "total": len(items)}


@router.patch("/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    resolution: str,
    user_id: str = Query(...),
    notes: Optional[str] = None,
):
    admin = await db.admins.find_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}, {"email": user_id}]},
        {"_id": 0, "id": 1},
    )
    if not admin:
        raise HTTPException(403, "Admin only")

    if resolution not in {"resolved", "dismissed"}:
        raise HTTPException(400, "Invalid resolution")

    await db.tair_reports.update_one(
        {"report_id": report_id},
        {
            "$set": {
                "status": resolution,
                "admin_notes": notes,
                "resolved_at": _now(),
                "resolved_by": user_id,
            }
        },
    )
    return {"success": True, "report_id": report_id, "status": resolution}
