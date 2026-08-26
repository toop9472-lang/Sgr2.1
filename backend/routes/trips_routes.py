"""طير — Trips API routes (carrier delivery network)."""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient

from models.trip import Trip, TripCreate, TripStatusEvent, TripStatusUpdate

router = APIRouter(prefix="/trips", tags=["Tair-Trips"])

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "saqr_db")]


def _now():
    return datetime.now(timezone.utc)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    for key in ("depart_at", "eta_at", "created_at", "updated_at"):
        val = doc.get(key)
        if isinstance(val, datetime):
            doc[key] = val.isoformat()
    for evt in doc.get("status_updates", []) or []:
        if isinstance(evt.get("at"), datetime):
            evt["at"] = evt["at"].isoformat()
    return doc


@router.post("/create")
async def create_trip(payload: TripCreate, user_id: str = Query(...)):
    trip_id = f"trip_{uuid.uuid4().hex[:12]}"
    trip = Trip(
        trip_id=trip_id,
        carrier_id=user_id,
        available_cages=payload.total_cages,
        **payload.model_dump(),
    )
    doc = trip.model_dump()
    await db.trips.insert_one(doc)
    return _serialize(doc)


@router.get("/list")
async def list_trips(
    from_city: Optional[str] = None,
    to_city: Optional[str] = None,
    status: Optional[str] = "scheduled",
    limit: int = 20,
    skip: int = 0,
):
    query: dict = {}
    if status and status != "all":
        query["status"] = {"$in": ["scheduled", "departed", "in_transit"]} if status == "active" else status
    if from_city:
        query["from_city"] = from_city
    if to_city:
        query["to_city"] = to_city

    cursor = (
        db.trips.find(query).sort("depart_at", 1).skip(skip).limit(min(limit, 100))
    )
    items = [_serialize(d) async for d in cursor]
    total = await db.trips.count_documents(query)
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/{trip_id}")
async def get_trip(trip_id: str):
    doc = await db.trips.find_one({"trip_id": trip_id})
    if not doc:
        raise HTTPException(404, "Trip not found")
    return _serialize(doc)


@router.get("/carrier/{carrier_id}")
async def trips_by_carrier(carrier_id: str, include_completed: bool = False):
    query: dict = {"carrier_id": carrier_id}
    if not include_completed:
        query["status"] = {
            "$in": ["scheduled", "departed", "in_transit", "arrived"]
        }
    cursor = db.trips.find(query).sort("depart_at", -1)
    items = [_serialize(d) async for d in cursor]
    return {"items": items, "total": len(items)}


@router.patch("/{trip_id}/status")
async def update_trip_status(
    trip_id: str, payload: TripStatusUpdate, user_id: str = Query(...)
):
    doc = await db.trips.find_one({"trip_id": trip_id})
    if not doc:
        raise HTTPException(404, "Trip not found")
    if doc.get("carrier_id") != user_id:
        raise HTTPException(403, "Not the carrier")

    event = TripStatusEvent(status=payload.status, note=payload.note).model_dump()
    await db.trips.update_one(
        {"trip_id": trip_id},
        {
            "$set": {"status": payload.status, "updated_at": _now()},
            "$push": {"status_updates": event},
        },
    )
    fresh = await db.trips.find_one({"trip_id": trip_id})
    return _serialize(fresh)


@router.delete("/{trip_id}")
async def cancel_trip(trip_id: str, user_id: str = Query(...)):
    doc = await db.trips.find_one({"trip_id": trip_id})
    if not doc:
        raise HTTPException(404, "Trip not found")
    if doc.get("carrier_id") != user_id:
        raise HTTPException(403, "Not the carrier")
    await db.trips.update_one(
        {"trip_id": trip_id},
        {"$set": {"status": "cancelled", "updated_at": _now()}},
    )
    return {"success": True, "trip_id": trip_id}
