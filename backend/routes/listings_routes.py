"""طير — Listings API routes."""
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient

from models.listing import Listing, ListingCreate, ListingUpdate

router = APIRouter(prefix="/listings", tags=["Tair-Listings"])

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "saqr_db")]


def _now():
    return datetime.now(timezone.utc)


def _serialize(doc: dict) -> dict:
    """Remove _id and coerce datetime for JSON."""
    if not doc:
        return doc
    doc.pop("_id", None)
    for key in ("posted_at", "expires_at", "sold_at", "updated_at"):
        val = doc.get(key)
        if isinstance(val, datetime):
            doc[key] = val.isoformat()
    return doc


@router.post("/create")
async def create_listing(payload: ListingCreate, user_id: str = Query(...)):
    listing_id = f"lst_{uuid.uuid4().hex[:12]}"
    payload_dict = payload.model_dump()
    if not payload_dict.get("cover_image"):
        imgs = payload_dict.get("images") or []
        payload_dict["cover_image"] = imgs[0] if imgs else None

    # Prohibited species check (auto-flag)
    is_flagged = False
    moderation_notes = None
    if payload.species:
        spec = await db.species_catalog.find_one({"species_id": payload.species})
        if spec and spec.get("is_prohibited"):
            is_flagged = True
            moderation_notes = "Auto-flag: prohibited species"

    listing = Listing(
        listing_id=listing_id,
        seller_id=user_id,
        is_flagged=is_flagged,
        moderation_notes=moderation_notes,
        **payload_dict,
    )
    doc = listing.model_dump()
    await db.listings.insert_one(doc)
    return _serialize(doc)


@router.get("/feed")
async def feed_listings(
    city: Optional[str] = None,
    category: Optional[str] = None,
    species: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    q: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
):
    query: dict = {"status": "active", "is_flagged": False}
    if city:
        query["city"] = city
    if category:
        query["category"] = category
    if species:
        query["species"] = species
    if min_price is not None or max_price is not None:
        query["price_sar"] = {}
        if min_price is not None:
            query["price_sar"]["$gte"] = min_price
        if max_price is not None:
            query["price_sar"]["$lte"] = max_price
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]

    cursor = (
        db.listings.find(query).sort("posted_at", -1).skip(skip).limit(min(limit, 100))
    )
    items = [_serialize(d) async for d in cursor]
    total = await db.listings.count_documents(query)
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/{listing_id}")
async def get_listing(listing_id: str, viewer_id: Optional[str] = None):
    doc = await db.listings.find_one({"listing_id": listing_id})
    if not doc:
        raise HTTPException(404, "Listing not found")
    # increment view (excluding owner)
    if viewer_id and viewer_id != doc.get("seller_id"):
        await db.listings.update_one(
            {"listing_id": listing_id}, {"$inc": {"view_count": 1}}
        )
        doc["view_count"] = (doc.get("view_count") or 0) + 1
    return _serialize(doc)


@router.patch("/{listing_id}")
async def update_listing(
    listing_id: str, payload: ListingUpdate, user_id: str = Query(...)
):
    doc = await db.listings.find_one({"listing_id": listing_id})
    if not doc:
        raise HTTPException(404, "Listing not found")
    if doc.get("seller_id") != user_id:
        raise HTTPException(403, "Not authorized")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    updates["updated_at"] = _now()
    if updates.get("status") == "sold":
        updates["sold_at"] = _now()

    await db.listings.update_one({"listing_id": listing_id}, {"$set": updates})
    fresh = await db.listings.find_one({"listing_id": listing_id})
    return _serialize(fresh)


@router.delete("/{listing_id}")
async def delete_listing(listing_id: str, user_id: str = Query(...)):
    doc = await db.listings.find_one({"listing_id": listing_id})
    if not doc:
        raise HTTPException(404, "Listing not found")
    is_owner = doc.get("seller_id") == user_id
    admin = await db.admins.find_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}, {"email": user_id}]},
        {"_id": 0, "id": 1},
    )
    if not is_owner and not admin:
        raise HTTPException(403, "Not authorized")
    await db.listings.update_one(
        {"listing_id": listing_id}, {"$set": {"status": "removed", "updated_at": _now()}}
    )
    return {"success": True, "listing_id": listing_id}


@router.get("/seller/{seller_id}")
async def listings_by_seller(seller_id: str, include_all: bool = False):
    query: dict = {"seller_id": seller_id}
    if not include_all:
        query["status"] = {"$in": ["active", "paused", "sold"]}
    cursor = db.listings.find(query).sort("posted_at", -1)
    items = [_serialize(d) async for d in cursor]
    return {"items": items, "total": len(items)}


# ==================== Favorites ====================
@router.post("/{listing_id}/favorite")
async def toggle_favorite(listing_id: str, user_id: str = Query(...)):
    existing = await db.tair_favorites.find_one(
        {"user_id": user_id, "listing_id": listing_id}
    )
    if existing:
        await db.tair_favorites.delete_one(
            {"user_id": user_id, "listing_id": listing_id}
        )
        await db.listings.update_one(
            {"listing_id": listing_id}, {"$inc": {"favorite_count": -1}}
        )
        return {"favorited": False}
    await db.tair_favorites.insert_one(
        {"user_id": user_id, "listing_id": listing_id, "added_at": _now()}
    )
    await db.listings.update_one(
        {"listing_id": listing_id}, {"$inc": {"favorite_count": 1}}
    )
    return {"favorited": True}


@router.get("/favorites/me")
async def my_favorites(user_id: str = Query(...)):
    favs = await db.tair_favorites.find({"user_id": user_id}).to_list(500)
    ids = [f["listing_id"] for f in favs]
    listings = await db.listings.find({"listing_id": {"$in": ids}}).to_list(500)
    return {"items": [_serialize(d) for d in listings]}
