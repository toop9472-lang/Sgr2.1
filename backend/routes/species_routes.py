"""طير — Species catalog API (reference list)."""
import os
from typing import Optional

from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient

from models.species import SEED_SPECIES

router = APIRouter(prefix="/species", tags=["Tair-Species"])

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "saqr_db")]


async def seed_species_if_empty():
    count = await db.species_catalog.count_documents({})
    if count == 0:
        await db.species_catalog.insert_many(SEED_SPECIES)


@router.get("/list")
async def list_species(category: Optional[str] = None):
    # Ensure seed on first call.
    await seed_species_if_empty()
    query: dict = {}
    if category:
        query["category"] = category
    cursor = db.species_catalog.find(query, {"_id": 0})
    items = await cursor.to_list(500)
    return {"items": items, "total": len(items)}


@router.get("/{species_id}")
async def get_species(species_id: str):
    doc = await db.species_catalog.find_one({"species_id": species_id}, {"_id": 0})
    return doc or {}


@router.post("/reseed")
async def reseed_species():
    """Admin: wipe and reseed the catalog."""
    await db.species_catalog.delete_many({})
    await db.species_catalog.insert_many(SEED_SPECIES)
    return {"seeded": len(SEED_SPECIES)}
