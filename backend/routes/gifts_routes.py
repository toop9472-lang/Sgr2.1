"""
Gifts system — premium animated gifts that users buy via Apple IAP / Google Play
and send to other users (chat, reels, profile). Recipients receive Saqr Gems
worth 20% of the gift's SAR price (gems convertible to cash via withdrawal).

Apple In-App Purchase receipt verification happens server-side (Phase 2).
Phase 1 records the transaction and credits gems immediately; the iap_receipt
field is used in Phase 2 to validate the purchase.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal
import os
import uuid

from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

router = APIRouter(prefix="/gifts", tags=["Gifts"])

VALID_CONTEXT_TYPES = ("chat", "private_chat", "reel", "reel_comment", "profile")

# Exchange: 500 gems = 3 SAR  →  1 SAR = 166.6666... gems
# Receiver earns 20% of gift price in gems.
GEMS_PER_SAR = 500.0 / 3.0
RECEIVER_SHARE = 0.20


# 3D rendered images from Microsoft Fluent Emoji (MIT-licensed, NOT emojis).
# Each gift maps Apple/Google IAP product IDs.
GIFT_CATALOG = [
    {
        "gift_id": "rose",
        "name_ar": "وردة",
        "name_en": "Rose",
        "price_sar": 3,
        "tier": 1,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rose/3D/rose_3d.png",
        "animation": "fall",          # rain falling from sky
        "particle_count": 14,
        "accent_color": "#ef4444",
        "ios_product_id": "com.saqr.gift.rose",
        "android_product_id": "saqr_gift_rose",
    },
    {
        "gift_id": "bouquet",
        "name_ar": "باقة ورد",
        "name_en": "Bouquet",
        "price_sar": 10,
        "tier": 2,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bouquet/3D/bouquet_3d.png",
        "animation": "fall",
        "particle_count": 18,
        "accent_color": "#f472b6",
        "ios_product_id": "com.saqr.gift.bouquet",
        "android_product_id": "saqr_gift_bouquet",
    },
    {
        "gift_id": "chocolate",
        "name_ar": "شوكولاتة",
        "name_en": "Chocolate",
        "price_sar": 25,
        "tier": 3,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Chocolate%20bar/3D/chocolate_bar_3d.png",
        "animation": "rise",          # rise from bottom to center
        "particle_count": 12,
        "accent_color": "#92400e",
        "ios_product_id": "com.saqr.gift.chocolate",
        "android_product_id": "saqr_gift_chocolate",
    },
    {
        "gift_id": "teddy",
        "name_ar": "دبدوب",
        "name_en": "Teddy Bear",
        "price_sar": 50,
        "tier": 4,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Teddy%20bear/3D/teddy_bear_3d.png",
        "animation": "bounce",
        "particle_count": 10,
        "accent_color": "#d97706",
        "ios_product_id": "com.saqr.gift.teddy",
        "android_product_id": "saqr_gift_teddy",
    },
    {
        "gift_id": "gem",
        "name_ar": "ألماسة صغيرة",
        "name_en": "Gem",
        "price_sar": 75,
        "tier": 5,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png",
        "animation": "sparkle",
        "particle_count": 22,
        "accent_color": "#22d3ee",
        "ios_product_id": "com.saqr.gift.gem",
        "android_product_id": "saqr_gift_gem",
    },
    {
        "gift_id": "crown",
        "name_ar": "تاج ملكي",
        "name_en": "Crown",
        "price_sar": 100,
        "tier": 6,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png",
        "animation": "sparkle",
        "particle_count": 24,
        "accent_color": "#fbbf24",
        "ios_product_id": "com.saqr.gift.crown",
        "android_product_id": "saqr_gift_crown",
    },
    {
        "gift_id": "cake",
        "name_ar": "كعكة احتفال",
        "name_en": "Birthday Cake",
        "price_sar": 130,
        "tier": 7,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Birthday%20cake/3D/birthday_cake_3d.png",
        "animation": "rise",
        "particle_count": 16,
        "accent_color": "#ec4899",
        "ios_product_id": "com.saqr.gift.cake",
        "android_product_id": "saqr_gift_cake",
    },
    {
        "gift_id": "car",
        "name_ar": "سيارة فاخرة",
        "name_en": "Luxury Car",
        "price_sar": 160,
        "tier": 8,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sport%20utility%20vehicle/3D/sport_utility_vehicle_3d.png",
        "animation": "drive",         # slides across screen
        "particle_count": 6,
        "accent_color": "#3b82f6",
        "ios_product_id": "com.saqr.gift.car",
        "android_product_id": "saqr_gift_car",
    },
    {
        "gift_id": "ring",
        "name_ar": "خاتم ألماس",
        "name_en": "Diamond Ring",
        "price_sar": 190,
        "tier": 9,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ring/3D/ring_3d.png",
        "animation": "sparkle",
        "particle_count": 28,
        "accent_color": "#a855f7",
        "ios_product_id": "com.saqr.gift.ring",
        "android_product_id": "saqr_gift_ring",
    },
    {
        "gift_id": "castle",
        "name_ar": "قلعة الأحلام",
        "name_en": "Castle",
        "price_sar": 220,
        "tier": 10,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Castle/3D/castle_3d.png",
        "animation": "rise",
        "particle_count": 20,
        "accent_color": "#8b5cf6",
        "ios_product_id": "com.saqr.gift.castle",
        "android_product_id": "saqr_gift_castle",
    },
    {
        "gift_id": "yacht",
        "name_ar": "يخت فاخر",
        "name_en": "Luxury Yacht",
        "price_sar": 260,
        "tier": 11,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sailboat/3D/sailboat_3d.png",
        "animation": "drive",
        "particle_count": 8,
        "accent_color": "#0ea5e9",
        "ios_product_id": "com.saqr.gift.yacht",
        "android_product_id": "saqr_gift_yacht",
    },
    {
        "gift_id": "trophy",
        "name_ar": "صقر الذهبي",
        "name_en": "Golden Eagle",
        "price_sar": 299,
        "tier": 12,
        "icon_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png",
        "animation": "epic",          # full screen burst
        "particle_count": 36,
        "accent_color": "#f59e0b",
        "ios_product_id": "com.saqr.gift.trophy",
        "android_product_id": "saqr_gift_trophy",
    },
]


def _gift_by_id(gift_id: str) -> Optional[dict]:
    for g in GIFT_CATALOG:
        if g["gift_id"] == gift_id:
            return g
    return None


def _compute_gems_reward(price_sar: int) -> int:
    """Receiver earns 20% of the gift's SAR price converted to Saqr Gems."""
    return int(round(price_sar * RECEIVER_SHARE * GEMS_PER_SAR))


class SendGiftRequest(BaseModel):
    sender_id: str
    receiver_id: str
    gift_id: str
    context_type: Literal["chat", "private_chat", "reel", "reel_comment", "profile"] = "profile"
    context_id: Optional[str] = None  # e.g., clip_id or chat_message_id
    message: Optional[str] = None
    # Phase 2 fields (filled when IAP succeeds on device):
    platform: Optional[str] = None  # "ios" | "android" | "sandbox"
    transaction_id: Optional[str] = None
    receipt: Optional[str] = None  # base64 Apple receipt OR Google purchase token


@router.get("/catalog")
async def get_catalog():
    """Return the gift catalog with pre-computed gems reward for each tier."""
    items = []
    for g in GIFT_CATALOG:
        items.append({
            **g,
            "gems_reward": _compute_gems_reward(g["price_sar"]),
        })
    return {
        "gifts": items,
        "exchange_rate": f"{int(round(GEMS_PER_SAR * 3))} جوهرة صقر = 3 ريال سعودي",
        "receiver_share_percent": int(RECEIVER_SHARE * 100),
    }


@router.post("/send")
async def send_gift(req: SendGiftRequest):
    sender_id = (req.sender_id or "").strip()
    receiver_id = (req.receiver_id or "").strip()
    if not sender_id or not receiver_id:
        raise HTTPException(status_code=400, detail="sender_id and receiver_id are required")
    if sender_id == receiver_id:
        raise HTTPException(status_code=400, detail="لا يمكن إرسال هدية لنفسك")

    gift = _gift_by_id(req.gift_id)
    if not gift:
        raise HTTPException(status_code=404, detail="الهدية غير موجودة في الكتالوج")

    # --- Apple IAP enforcement -------------------------------------------------
    # On iOS production, require a verified StoreKit 2 signed transaction.
    # Sandbox + Android are accepted with a softer check during development.
    iap_env = "local"
    iap_verified = False
    if (req.platform or "").lower() == "ios":
        if not req.receipt:
            raise HTTPException(status_code=400, detail="receipt مطلوب لمشتريات iOS")
        try:
            from services.apple_iap_service import verify_with_fallback
            payload, iap_env = verify_with_fallback(req.receipt)
            iap_verified = True
            # Cross-check product
            apple_product_id = (payload.get("productId") or "").strip()
            if apple_product_id and apple_product_id != gift["ios_product_id"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Apple productId mismatch: receipt={apple_product_id}, expected={gift['ios_product_id']}",
                )
            # Prevent receipt reuse
            apple_tx_id = str(payload.get("transactionId") or "")
            if apple_tx_id:
                already = await db.gift_transactions.find_one(
                    {"apple_transaction_id": apple_tx_id}, {"_id": 0, "tx_id": 1}
                )
                if already:
                    raise HTTPException(
                        status_code=409,
                        detail="هذه العملية تم استخدامها من قبل",
                    )
                req.transaction_id = apple_tx_id
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"فشل التحقق من إيصال Apple: {type(e).__name__}: {e}",
            ) from e
    # ---------------------------------------------------------------------------

    receiver = await db.users.find_one(
        {"$or": [{"id": receiver_id}, {"user_id": receiver_id}]},
        {"_id": 0, "id": 1, "user_id": 1, "saqr_gems": 1, "name": 1, "avatar": 1},
    )
    if not receiver:
        raise HTTPException(status_code=404, detail="المستلم غير موجود")

    sender = await db.users.find_one(
        {"$or": [{"id": sender_id}, {"user_id": sender_id}]},
        {"_id": 0, "id": 1, "user_id": 1, "name": 1, "avatar": 1},
    )
    if not sender:
        raise HTTPException(status_code=404, detail="المرسل غير موجود")

    gems_reward = _compute_gems_reward(gift["price_sar"])
    now_dt = datetime.now(timezone.utc)
    tx_id = str(uuid.uuid4())

    # Atomic credit + read so the returned balance reflects the post-update value
    # even under concurrent gifts.
    updated_receiver = await db.users.find_one_and_update(
        {"$or": [{"id": receiver_id}, {"user_id": receiver_id}]},
        {
            "$inc": {
                "saqr_gems": gems_reward,
                "total_gift_gems": gems_reward,
                "gifts_received_count": 1,
            },
            "$push": {
                "saqr_gems_transactions": {
                    "type": "gift_received",
                    "amount": gems_reward,
                    "gift_id": gift["gift_id"],
                    "from_user_id": sender_id,
                    "timestamp": now_dt.isoformat(),
                    "tx_id": tx_id,
                }
            },
        },
        return_document=True,
        projection={"_id": 0, "saqr_gems": 1},
    )
    new_balance = int((updated_receiver or {}).get("saqr_gems", 0) or 0)

    # Update sender's sent-stat
    await db.users.update_one(
        {"$or": [{"id": sender_id}, {"user_id": sender_id}]},
        {
            "$inc": {
                "gifts_sent_count": 1,
                "total_gift_spend_sar": gift["price_sar"],
            },
        },
    )

    # Persist the transaction
    sender_canonical = sender.get("id") or sender.get("user_id") or sender_id
    receiver_canonical = receiver.get("id") or receiver.get("user_id") or receiver_id
    tx_doc = {
        "tx_id": tx_id,
        "sender_id": sender_canonical,
        "sender_name": sender.get("name") or "مستخدم",
        "sender_avatar": sender.get("avatar") or "",
        "receiver_id": receiver_canonical,
        "receiver_name": receiver.get("name") or "مستخدم",
        "gift_id": gift["gift_id"],
        "gift_name_ar": gift["name_ar"],
        "gift_icon_url": gift["icon_url"],
        "gift_animation": gift["animation"],
        "gift_accent_color": gift["accent_color"],
        "gift_particle_count": gift["particle_count"],
        "price_sar": gift["price_sar"],
        "gems_awarded": gems_reward,
        "context_type": req.context_type,
        "context_id": req.context_id,
        "message": req.message,
        "platform": req.platform,
        "transaction_id": req.transaction_id,
        "apple_transaction_id": req.transaction_id if (req.platform or "").lower() == "ios" else None,
        "iap_receipt_present": bool(req.receipt),
        "iap_verified": iap_verified,
        "iap_env": iap_env,
        "delivered": False,         # set true once receiver fetches it
        "delivered_at": None,
        "created_at": now_dt.isoformat(),
    }
    await db.gift_transactions.insert_one(tx_doc)

    return {
        "success": True,
        "tx_id": tx_id,
        "gems_awarded": gems_reward,
        "receiver_new_balance": new_balance,
        "gift": {**gift, "gems_reward": gems_reward},
    }


@router.get("/pending/{user_id}")
async def list_pending(user_id: str, since_seconds: int = 60):
    """
    Return undelivered gifts for the receiver and mark them delivered atomically.
    Mobile clients poll this on focus + every ~10s on key screens to trigger
    the falling-rose animation in real time.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=max(10, int(since_seconds or 60)))).isoformat()
    pending = await db.gift_transactions.find(
        {
            "receiver_id": user_id,
            "delivered": False,
            "created_at": {"$gte": cutoff},
        },
        {"_id": 0},
    ).sort("created_at", 1).limit(20).to_list(20)

    if pending:
        tx_ids = [p["tx_id"] for p in pending]
        await db.gift_transactions.update_many(
            {"tx_id": {"$in": tx_ids}, "receiver_id": user_id},
            {"$set": {"delivered": True, "delivered_at": datetime.now(timezone.utc).isoformat()}},
        )

    return {"gifts": pending, "count": len(pending)}


@router.get("/inbox/{user_id}")
async def gift_inbox(user_id: str, limit: int = 50):
    """Full history of gifts the user has received (for a future inbox screen)."""
    capped = max(1, min(int(limit or 50), 200))
    items = await db.gift_transactions.find(
        {"receiver_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).limit(capped).to_list(capped)
    return {"gifts": items, "count": len(items)}


@router.get("/sent/{user_id}")
async def gift_sent(user_id: str, limit: int = 50):
    capped = max(1, min(int(limit or 50), 200))
    items = await db.gift_transactions.find(
        {"sender_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).limit(capped).to_list(capped)
    return {"gifts": items, "count": len(items)}


@router.get("/leaderboard")
async def gift_leaderboard(
    scope: Literal["received", "sent"] = "received",
    period: Literal["all", "month", "week", "day"] = "all",
    limit: int = 50,
):
    """Top users ranked by total gift value (SAR).
    - scope=received → who received the most (most popular creators)
    - scope=sent     → who sent the most (top supporters)
    - period filters by created_at on the gift_transactions collection.
    """
    capped = max(1, min(int(limit or 50), 100))
    user_key = "receiver_id" if scope == "received" else "sender_id"

    # Time window
    match = {}
    if period != "all":
        days = {"day": 1, "week": 7, "month": 30}[period]
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        match["created_at"] = {"$gte": cutoff}

    pipeline = [
        {"$match": match} if match else {"$match": {}},
        {
            "$group": {
                "_id": f"${user_key}",
                "total_sar": {"$sum": "$price_sar"},
                "total_gifts": {"$sum": 1},
                "total_gems": {"$sum": {"$ifNull": ["$gems_awarded", 0]}},
            }
        },
        {"$sort": {"total_sar": -1, "total_gifts": -1}},
        {"$limit": capped},
    ]
    rows = await db.gift_transactions.aggregate(pipeline).to_list(capped)

    # Hydrate user info (legacy users may have `id` instead of `user_id`)
    user_ids = [r["_id"] for r in rows if r.get("_id")]
    users = await db.users.find(
        {"$or": [
            {"user_id": {"$in": user_ids}},
            {"id": {"$in": user_ids}},
        ]},
        {"_id": 0, "id": 1, "user_id": 1, "name": 1, "avatar": 1, "is_verified": 1},
    ).to_list(len(user_ids) * 2) if user_ids else []
    user_map = {}
    for u in users:
        uid = u.get("user_id") or u.get("id")
        if uid:
            user_map[uid] = u

    leaderboard = []
    for idx, r in enumerate(rows):
        uid = r.get("_id")
        if not uid:
            continue
        u = user_map.get(uid, {})
        leaderboard.append({
            "rank": idx + 1,
            "user_id": uid,
            "name": u.get("name") or "مستخدم",
            "avatar": u.get("avatar"),
            "is_verified": bool(u.get("is_verified", False)),
            "total_sar": round(float(r.get("total_sar", 0)), 2),
            "total_gifts": int(r.get("total_gifts", 0)),
            "total_gems": int(r.get("total_gems", 0)),
        })

    return {
        "scope": scope,
        "period": period,
        "count": len(leaderboard),
        "leaderboard": leaderboard,
    }


# Phase 2 placeholder — Apple IAP receipt verification endpoint.
class VerifyReceiptRequest(BaseModel):
    user_id: str
    platform: str  # "ios" | "android"
    product_id: str
    transaction_id: str
    receipt: str


@router.post("/verify-receipt")
async def verify_receipt(req: VerifyReceiptRequest):
    """Validate Apple StoreKit 2 signed transaction (or Android purchase token).

    For iOS: `req.receipt` must be a StoreKit 2 JWS signed transaction string.
    The server verifies the signature locally using the embedded x5c chain,
    confirms the bundleId matches, then cross-checks with Apple's App Store
    Server API (prod first, sandbox fallback).
    """
    platform = (req.platform or "").lower()
    if platform == "ios":
        try:
            from services.apple_iap_service import verify_with_fallback, is_configured
            if not is_configured():
                raise RuntimeError("Apple IAP keys are not configured on the server")
            payload, env = verify_with_fallback(req.receipt)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Apple verification failed: {type(e).__name__}: {e}",
            ) from e

        # Persist for auditing
        await db.iap_receipts.insert_one({
            "user_id": req.user_id,
            "platform": "ios",
            "product_id": payload.get("productId") or req.product_id,
            "transaction_id": str(payload.get("transactionId") or req.transaction_id),
            "original_transaction_id": str(payload.get("originalTransactionId") or ""),
            "bundle_id": payload.get("bundleId"),
            "purchase_date_ms": payload.get("purchaseDate"),
            "verified": True,
            "env": env,  # "prod" | "sandbox" | "local"
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {
            "success": True,
            "verified": True,
            "env": env,
            "transaction_id": payload.get("transactionId"),
            "product_id": payload.get("productId"),
            "bundle_id": payload.get("bundleId"),
        }

    # Android / other platforms (Phase 2 follow-up)
    await db.iap_receipts.insert_one({
        "user_id": req.user_id,
        "platform": platform,
        "product_id": req.product_id,
        "transaction_id": req.transaction_id,
        "receipt_len": len(req.receipt or ""),
        "verified": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {
        "success": True,
        "verified": False,
        "message": "Receipt stored. Android/Google Play verification not yet implemented.",
    }
