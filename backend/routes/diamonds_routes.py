# Diamonds & Game Economy Routes
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

router = APIRouter(prefix="/diamonds", tags=["Diamonds"])

# Database connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'saqr_db')]

# Constants
DAILY_POINTS_LIMIT = 120  # Max points from games per day
LEADERBOARD_REWARDS = {
    1: 3000,  # First place
    2: 1900,  # Second place
    3: 1000,  # Third place
}

# Diamond Packages
DIAMOND_PACKAGES = [
    {"id": "pack_1", "name": "حزمة البداية", "diamonds": 50, "price": 3, "bonus": 0},
    {"id": "pack_2", "name": "حزمة الفضية", "diamonds": 120, "price": 7, "bonus": 20},
    {"id": "pack_3", "name": "حزمة الذهبية", "diamonds": 250, "price": 12, "bonus": 50},
    {"id": "pack_4", "name": "حزمة الماسية", "diamonds": 500, "price": 19, "bonus": 100},
]

# Game entry costs (in diamonds)
GAME_ENTRY_COSTS = {
    "tictactoe": {"offline": 0, "online": 10},
    "chess": {"offline": 0, "online": 20},
    "puzzle": {"offline": 0, "online": 15},
    "brickbreaker": {"offline": 0, "online": 15},
    "trivia": {"offline": 0, "online": 10},
    "riddles": {"offline": 0, "online": 15},
}

# Winner rewards (diamonds)
WINNER_REWARDS = {
    "tictactoe": {"base": 5, "bonus": 3},
    "chess": {"base": 10, "bonus": 5},
    "puzzle": {"base": 8, "bonus": 4},
    "brickbreaker": {"base": 8, "bonus": 4},
    "trivia": {"base": 5, "bonus": 3},
    "riddles": {"base": 8, "bonus": 4},
}

class PurchaseDiamondsRequest(BaseModel):
    user_id: str
    package_id: str

class SpendDiamondsRequest(BaseModel):
    user_id: str
    amount: int
    reason: str

class GameResultRequest(BaseModel):
    user_id: str
    game_id: str
    is_online: bool
    won: bool
    opponent_entry: int = 0  # Opponent's entry diamonds (for online games)

@router.get("/packages")
async def get_diamond_packages():
    """Get all available diamond packages"""
    return {
        "packages": DIAMOND_PACKAGES,
        "currency": "SAR"
    }

@router.get("/balance/{user_id}")
async def get_diamond_balance(user_id: str):
    """Get user's diamond balance"""
    user = await db.users.find_one({"user_id": user_id}, {"diamonds": 1, "total_diamonds_earned": 1})
    if not user:
        return {"diamonds": 0, "total_earned": 0}
    
    return {
        "diamonds": user.get("diamonds", 0),
        "total_earned": user.get("total_diamonds_earned", 0)
    }

@router.post("/purchase")
async def purchase_diamonds(request: PurchaseDiamondsRequest):
    """Purchase diamonds (called after successful payment)"""
    package = next((p for p in DIAMOND_PACKAGES if p["id"] == request.package_id), None)
    if not package:
        raise HTTPException(status_code=400, detail="الباقة غير موجودة")
    
    total_diamonds = package["diamonds"] + package["bonus"]
    
    # Update user's diamonds
    result = await db.users.update_one(
        {"user_id": request.user_id},
        {
            "$inc": {
                "diamonds": total_diamonds,
                "total_diamonds_earned": total_diamonds
            },
            "$push": {
                "diamond_transactions": {
                    "id": str(uuid.uuid4()),
                    "type": "purchase",
                    "package_id": request.package_id,
                    "amount": total_diamonds,
                    "price": package["price"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    return {
        "success": True,
        "diamonds_added": total_diamonds,
        "message": f"تم إضافة {total_diamonds} ألماسة"
    }

@router.post("/spend")
async def spend_diamonds(request: SpendDiamondsRequest):
    """Spend diamonds (for online game entry)"""
    user = await db.users.find_one({"user_id": request.user_id}, {"diamonds": 1})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    current_diamonds = user.get("diamonds", 0)
    if current_diamonds < request.amount:
        raise HTTPException(status_code=400, detail="رصيد الألماس غير كافٍ")
    
    # Deduct diamonds
    await db.users.update_one(
        {"user_id": request.user_id},
        {
            "$inc": {"diamonds": -request.amount},
            "$push": {
                "diamond_transactions": {
                    "id": str(uuid.uuid4()),
                    "type": "spend",
                    "amount": -request.amount,
                    "reason": request.reason,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    
    return {
        "success": True,
        "spent": request.amount,
        "remaining": current_diamonds - request.amount
    }

@router.get("/daily-points/{user_id}")
async def get_daily_points_status(user_id: str):
    """Get user's daily points earned from games"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    daily_record = await db.daily_game_points.find_one({
        "user_id": user_id,
        "date": today
    })
    
    earned_today = daily_record.get("points", 0) if daily_record else 0
    remaining = max(0, DAILY_POINTS_LIMIT - earned_today)
    
    return {
        "earned_today": earned_today,
        "remaining": remaining,
        "limit": DAILY_POINTS_LIMIT,
        "can_earn_more": remaining > 0
    }

@router.post("/game-result")
async def record_game_result(request: GameResultRequest):
    """Record game result and award points/diamonds"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Get daily points status
    daily_record = await db.daily_game_points.find_one({
        "user_id": request.user_id,
        "date": today
    })
    earned_today = daily_record.get("points", 0) if daily_record else 0
    
    points_to_award = 0
    diamonds_to_award = 0
    
    game_rewards = WINNER_REWARDS.get(request.game_id, {"base": 5, "bonus": 3})
    
    if request.won:
        # Points (only if under daily limit)
        if earned_today < DAILY_POINTS_LIMIT:
            base_points = 20 if request.is_online else 10
            points_to_award = min(base_points, DAILY_POINTS_LIMIT - earned_today)
        
        # Diamonds (for online games)
        if request.is_online:
            # Winner gets: base reward + bonus + opponent's entry
            diamonds_to_award = game_rewards["base"] + game_rewards["bonus"] + request.opponent_entry
    else:
        # Participation points (smaller amount)
        if earned_today < DAILY_POINTS_LIMIT:
            points_to_award = min(5, DAILY_POINTS_LIMIT - earned_today)
    
    # Update daily points record
    if points_to_award > 0:
        await db.daily_game_points.update_one(
            {"user_id": request.user_id, "date": today},
            {
                "$inc": {"points": points_to_award},
                "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        # Add points to user
        await db.users.update_one(
            {"user_id": request.user_id},
            {"$inc": {"points": points_to_award, "total_earned": points_to_award}}
        )
    
    # Award diamonds
    if diamonds_to_award > 0:
        await db.users.update_one(
            {"user_id": request.user_id},
            {
                "$inc": {
                    "diamonds": diamonds_to_award,
                    "total_diamonds_earned": diamonds_to_award
                }
            }
        )
    
    return {
        "success": True,
        "points_awarded": points_to_award,
        "diamonds_awarded": diamonds_to_award,
        "daily_points_earned": earned_today + points_to_award,
        "daily_limit": DAILY_POINTS_LIMIT,
        "can_earn_more_points": (earned_today + points_to_award) < DAILY_POINTS_LIMIT
    }

@router.get("/leaderboard-rewards")
async def get_leaderboard_rewards():
    """Get leaderboard reward amounts"""
    return {
        "rewards": LEADERBOARD_REWARDS,
        "description": {
            1: "المركز الأول - 3000 نقطة",
            2: "المركز الثاني - 1900 نقطة",
            3: "المركز الثالث - 1000 نقطة"
        }
    }

@router.post("/claim-leaderboard-reward")
async def claim_leaderboard_reward(user_id: str, rank: int):
    """Claim leaderboard reward (weekly reset)"""
    if rank not in LEADERBOARD_REWARDS:
        raise HTTPException(status_code=400, detail="المركز غير مؤهل للمكافأة")
    
    reward = LEADERBOARD_REWARDS[rank]
    
    # Check if already claimed this week
    week_start = (datetime.now(timezone.utc) - timedelta(days=datetime.now(timezone.utc).weekday())).date().isoformat()
    
    existing_claim = await db.leaderboard_claims.find_one({
        "user_id": user_id,
        "week_start": week_start
    })
    
    if existing_claim:
        raise HTTPException(status_code=400, detail="تم استلام المكافأة مسبقاً هذا الأسبوع")
    
    # Award points
    await db.users.update_one(
        {"user_id": user_id},
        {"$inc": {"points": reward, "total_earned": reward}}
    )
    
    # Record claim
    await db.leaderboard_claims.insert_one({
        "user_id": user_id,
        "week_start": week_start,
        "rank": rank,
        "reward": reward,
        "claimed_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "reward": reward,
        "message": f"تهانينا! حصلت على {reward} نقطة"
    }

@router.get("/game-costs")
async def get_game_costs():
    """Get entry costs for all games"""
    return {
        "costs": GAME_ENTRY_COSTS,
        "note": "اللعب بدون أونلاين مجاني، اللعب أونلاين يتطلب ألماس"
    }
