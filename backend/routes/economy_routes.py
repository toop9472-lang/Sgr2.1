# Economy Routes - Complete Saqr Points & Diamonds System
# نظام نقاط صقر والألماسات وجواهر صقر
# الألماسات = للاستهلاك داخل التطبيق (دردشة، ألعاب)
# جواهر صقر = للاستبدال بالمال (500 جوهرة = 1 دولار)
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

router = APIRouter(prefix="/economy", tags=["Economy"])

# Database connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'saqr_db')]

# ==================== CONSTANTS ====================
# الثوابت

# الألماسات المجانية عند التسجيل (للاستهلاك داخل التطبيق)
INITIAL_DIAMONDS = 300

# جواهر صقر المجانية عند التسجيل (للاستبدال بالمال)
INITIAL_SAQR_GEMS = 0

# الحد اليومي للنقاط من الألعاب
DAILY_POINTS_LIMIT = 70  # الحد اليومي من الألعاب فقط

# قيمة جواهر صقر بالدولار (500 جوهرة = 1 دولار)
GEMS_PER_DOLLAR = 500

# تكلفة الرسالة في الدردشة (بالألماسات)
CHAT_MESSAGE_COST = 5

# باقات شحن الألماسات (SAR)
DIAMOND_PACKAGES = [
    {"id": "starter", "name": "حزمة البداية", "diamonds": 100, "price": 3, "bonus": 0, "icon": "diamond-outline"},
    {"id": "silver", "name": "الحزمة الفضية", "diamonds": 250, "price": 7, "bonus": 25, "icon": "diamond"},
    {"id": "gold", "name": "الحزمة الذهبية", "diamonds": 500, "price": 12, "bonus": 75, "icon": "trophy"},
    {"id": "platinum", "name": "الحزمة البلاتينية", "diamonds": 1000, "price": 19, "bonus": 200, "icon": "rocket"},
]

# تكلفة اللعب أونلاين (بالألماسات)
ONLINE_GAME_COSTS = {
    "chess": 30,
    "tictactoe": 20,
    "puzzle": 25,
    "brickbreaker": 25,
    "trivia": 20,
    "riddles": 25,
}

# مكافآت الفائز (ألماسات)
WINNER_DIAMOND_BONUS = {
    "chess": 15,
    "tictactoe": 10,
    "puzzle": 12,
    "brickbreaker": 12,
    "trivia": 10,
    "riddles": 12,
}

# مكافآت المتصدرين (نقاط صقر)
LEADERBOARD_REWARDS = {
    1: 3000,  # المركز الأول
    2: 1900,  # المركز الثاني
    3: 1000,  # المركز الثالث
}

# مكافآت الدخول اليومي
DAILY_LOGIN_REWARDS = [
    {"day": 1, "type": "points", "amount": 10, "label": "اليوم 1"},
    {"day": 2, "type": "points", "amount": 15, "label": "اليوم 2"},
    {"day": 3, "type": "diamonds", "amount": 5, "label": "اليوم 3"},
    {"day": 4, "type": "points", "amount": 20, "label": "اليوم 4"},
    {"day": 5, "type": "points", "amount": 25, "label": "اليوم 5"},
    {"day": 6, "type": "diamonds", "amount": 10, "label": "اليوم 6"},
    {"day": 7, "type": "diamonds", "amount": 25, "label": "اليوم 7"},
]

# ==================== MODELS ====================

class UserBalanceResponse(BaseModel):
    saqr_points: int
    diamonds: int
    saqr_gems: int  # جواهر صقر للاستبدال بالمال
    saqr_gems_value_usd: float
    daily_points_earned: int
    daily_points_remaining: int
    daily_limit: int

class PurchasePackageRequest(BaseModel):
    user_id: str
    package_id: str

class SpendDiamondsRequest(BaseModel):
    user_id: str
    game_id: str
    is_online: bool

class GameResultRequest(BaseModel):
    user_id: str
    game_id: str
    is_online: bool
    won: bool
    opponent_diamonds: int = 0  # الماسات المراهن عليها من الخصم

class ClaimDailyRewardRequest(BaseModel):
    user_id: str

# ==================== ENDPOINTS ====================

@router.get("/balance/{user_id}")
async def get_user_balance(user_id: str):
    """الحصول على رصيد المستخدم من النقاط والألماسات وجواهر صقر"""
    user = await db.users.find_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]},
        {"_id": 0, "saqr_points": 1, "diamonds": 1, "saqr_gems": 1, "points": 1}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    # الحصول على النقاط المكتسبة اليوم
    today = datetime.now(timezone.utc).date().isoformat()
    daily_record = await db.daily_game_points.find_one({
        "user_id": user_id,
        "date": today
    })
    
    daily_earned = daily_record.get("points", 0) if daily_record else 0
    saqr_points = user.get("saqr_points", user.get("points", 0))
    diamonds = user.get("diamonds", INITIAL_DIAMONDS)
    saqr_gems = user.get("saqr_gems", INITIAL_SAQR_GEMS)
    
    return {
        "saqr_points": saqr_points,
        "diamonds": diamonds,
        "saqr_gems": saqr_gems,
        "saqr_gems_value_usd": saqr_gems / GEMS_PER_DOLLAR,
        "daily_points_earned": daily_earned,
        "daily_points_remaining": max(0, DAILY_POINTS_LIMIT - daily_earned),
        "daily_limit": DAILY_POINTS_LIMIT,
        "gems_per_dollar": GEMS_PER_DOLLAR,
        "chat_message_cost": CHAT_MESSAGE_COST
    }

@router.get("/packages")
async def get_diamond_packages():
    """الحصول على باقات شحن الألماسات"""
    return {
        "packages": DIAMOND_PACKAGES,
        "currency": "SAR",
        "currency_symbol": "ر.س"
    }

@router.post("/purchase-diamonds")
async def purchase_diamonds(request: PurchasePackageRequest):
    """شراء باقة ألماسات (بعد نجاح الدفع)"""
    package = next((p for p in DIAMOND_PACKAGES if p["id"] == request.package_id), None)
    if not package:
        raise HTTPException(status_code=400, detail="الباقة غير موجودة")
    
    total_diamonds = package["diamonds"] + package["bonus"]
    
    # تحديث رصيد الألماسات
    result = await db.users.update_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {
            "$inc": {"diamonds": total_diamonds},
            "$push": {
                "diamond_transactions": {
                    "id": str(uuid.uuid4()),
                    "type": "purchase",
                    "package_id": request.package_id,
                    "package_name": package["name"],
                    "amount": total_diamonds,
                    "price": package["price"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    # الحصول على الرصيد الجديد
    user = await db.users.find_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {"_id": 0, "diamonds": 1}
    )
    
    return {
        "success": True,
        "diamonds_added": total_diamonds,
        "new_balance": user.get("diamonds", 0),
        "message": f"تم إضافة {total_diamonds} ألماسة بنجاح!"
    }

@router.post("/enter-game")
async def enter_online_game(request: SpendDiamondsRequest):
    """دخول لعبة أونلاين (خصم الألماسات)"""
    if not request.is_online:
        # اللعب أوفلاين مجاني
        return {"success": True, "cost": 0, "message": "اللعب أوفلاين مجاني!"}
    
    cost = ONLINE_GAME_COSTS.get(request.game_id, 20)
    
    # التحقق من الرصيد
    user = await db.users.find_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {"_id": 0, "diamonds": 1}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    current_diamonds = user.get("diamonds", 0)
    if current_diamonds < cost:
        raise HTTPException(
            status_code=400, 
            detail=f"رصيد الألماس غير كافٍ. المطلوب: {cost}, المتاح: {current_diamonds}"
        )
    
    # خصم الألماسات
    await db.users.update_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {
            "$inc": {"diamonds": -cost},
            "$push": {
                "diamond_transactions": {
                    "id": str(uuid.uuid4()),
                    "type": "game_entry",
                    "game_id": request.game_id,
                    "amount": -cost,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    
    return {
        "success": True,
        "cost": cost,
        "remaining": current_diamonds - cost,
        "message": f"تم خصم {cost} ألماسة. حظاً موفقاً!"
    }

@router.post("/game-result")
async def record_game_result(request: GameResultRequest):
    """تسجيل نتيجة اللعبة ومنح المكافآت"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    # الحصول على النقاط المكتسبة اليوم
    daily_record = await db.daily_game_points.find_one({
        "user_id": request.user_id,
        "date": today
    })
    daily_earned = daily_record.get("points", 0) if daily_record else 0
    
    points_to_award = 0
    diamonds_to_award = 0
    
    if request.won:
        # نقاط الفوز (مع مراعاة الحد اليومي)
        if daily_earned < DAILY_POINTS_LIMIT:
            base_points = 25 if request.is_online else 15
            points_to_award = min(base_points, DAILY_POINTS_LIMIT - daily_earned)
        
        # ألماسات الفوز (للألعاب أونلاين فقط)
        if request.is_online:
            bonus = WINNER_DIAMOND_BONUS.get(request.game_id, 10)
            diamonds_to_award = request.opponent_diamonds + bonus
    else:
        # نقاط المشاركة
        if daily_earned < DAILY_POINTS_LIMIT:
            points_to_award = min(5, DAILY_POINTS_LIMIT - daily_earned)
    
    # تحديث سجل النقاط اليومية
    if points_to_award > 0:
        await db.daily_game_points.update_one(
            {"user_id": request.user_id, "date": today},
            {
                "$inc": {"points": points_to_award},
                "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        # إضافة النقاط للمستخدم
        await db.users.update_one(
            {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
            {"$inc": {"saqr_points": points_to_award, "points": points_to_award}}
        )
    
    # إضافة الألماسات
    if diamonds_to_award > 0:
        await db.users.update_one(
            {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
            {
                "$inc": {"diamonds": diamonds_to_award},
                "$push": {
                    "diamond_transactions": {
                        "id": str(uuid.uuid4()),
                        "type": "game_win",
                        "game_id": request.game_id,
                        "amount": diamonds_to_award,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            }
        )
    
    return {
        "success": True,
        "points_awarded": points_to_award,
        "diamonds_awarded": diamonds_to_award,
        "daily_points_earned": daily_earned + points_to_award,
        "daily_limit": DAILY_POINTS_LIMIT,
        "can_earn_more": (daily_earned + points_to_award) < DAILY_POINTS_LIMIT,
        "message": f"حصلت على {points_to_award} نقطة" + (f" و {diamonds_to_award} ألماسة" if diamonds_to_award > 0 else "")
    }

@router.get("/daily-login-status/{user_id}")
async def get_daily_login_status(user_id: str):
    """الحصول على حالة مكافآت الدخول اليومي"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    # البحث عن سجل الدخول اليومي
    login_record = await db.daily_logins.find_one({"user_id": user_id})
    
    if not login_record:
        # أول دخول
        return {
            "should_show_reward": True,
            "current_streak": 0,
            "today_claimed": False,
            "rewards": DAILY_LOGIN_REWARDS,
            "next_reward": DAILY_LOGIN_REWARDS[0]
        }
    
    last_login = login_record.get("last_login_date", "")
    streak = login_record.get("streak", 0)
    today_claimed = login_record.get("claimed_today", False) and last_login == today
    
    # تحديد المكافأة التالية
    reward_index = streak % len(DAILY_LOGIN_REWARDS)
    next_reward = DAILY_LOGIN_REWARDS[reward_index]
    
    return {
        "should_show_reward": not today_claimed,
        "current_streak": streak,
        "today_claimed": today_claimed,
        "rewards": DAILY_LOGIN_REWARDS,
        "next_reward": next_reward,
        "last_login": last_login
    }

@router.post("/claim-daily-reward")
async def claim_daily_reward(request: ClaimDailyRewardRequest):
    """استلام مكافأة الدخول اليومي"""
    today = datetime.now(timezone.utc).date().isoformat()
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    
    # البحث عن سجل الدخول
    login_record = await db.daily_logins.find_one({"user_id": request.user_id})
    
    if login_record:
        last_login = login_record.get("last_login_date", "")
        
        # التحقق من أنه لم يستلم اليوم
        if last_login == today and login_record.get("claimed_today", False):
            raise HTTPException(status_code=400, detail="تم استلام المكافأة اليوم بالفعل")
        
        # حساب الـ streak
        if last_login == yesterday:
            streak = login_record.get("streak", 0) + 1
        elif last_login == today:
            streak = login_record.get("streak", 0)
        else:
            streak = 1  # إعادة الـ streak
    else:
        streak = 1
    
    # تحديد المكافأة
    reward_index = (streak - 1) % len(DAILY_LOGIN_REWARDS)
    reward = DAILY_LOGIN_REWARDS[reward_index]
    
    # تحديث سجل الدخول
    await db.daily_logins.update_one(
        {"user_id": request.user_id},
        {
            "$set": {
                "user_id": request.user_id,
                "last_login_date": today,
                "streak": streak,
                "claimed_today": True
            },
            "$push": {
                "history": {
                    "date": today,
                    "day": reward["day"],
                    "reward_type": reward["type"],
                    "amount": reward["amount"]
                }
            }
        },
        upsert=True
    )
    
    # منح المكافأة
    update_field = "diamonds" if reward["type"] == "diamonds" else "saqr_points"
    await db.users.update_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {
            "$inc": {
                update_field: reward["amount"],
                "points": reward["amount"] if reward["type"] == "points" else 0
            }
        }
    )
    
    return {
        "success": True,
        "reward_type": reward["type"],
        "amount": reward["amount"],
        "streak": streak,
        "message": f"حصلت على {reward['amount']} " + ("ألماسة" if reward["type"] == "diamonds" else "نقطة صقر"),
        "next_reward": DAILY_LOGIN_REWARDS[streak % len(DAILY_LOGIN_REWARDS)]
    }

@router.get("/leaderboard")
async def get_leaderboard():
    """الحصول على المتصدرين"""
    # جلب أفضل 20 لاعب
    pipeline = [
        {
            "$project": {
                "_id": 0,
                "user_id": {"$ifNull": ["$id", "$user_id"]},
                "name": 1,
                "saqr_points": {"$ifNull": ["$saqr_points", "$points"]},
                "avatar": 1
            }
        },
        {"$sort": {"saqr_points": -1}},
        {"$limit": 20}
    ]
    
    leaders = await db.users.aggregate(pipeline).to_list(20)
    
    # إضافة الترتيب
    for idx, leader in enumerate(leaders):
        leader["rank"] = idx + 1
        leader["reward"] = LEADERBOARD_REWARDS.get(idx + 1, 0)
    
    return {
        "leaderboard": leaders,
        "rewards": LEADERBOARD_REWARDS,
        "description": "أفضل 3 لاعبين يحصلون على مكافآت أسبوعية يمكن تحويلها لأموال"
    }

@router.get("/game-costs")
async def get_game_costs():
    """الحصول على تكاليف الألعاب"""
    return {
        "online_costs": ONLINE_GAME_COSTS,
        "winner_bonuses": WINNER_DIAMOND_BONUS,
        "note": "اللعب أوفلاين مجاني دائماً!"
    }

@router.post("/initialize-user/{user_id}")
async def initialize_user_economy(user_id: str):
    """تهيئة نظام الاقتصاد للمستخدم الجديد"""
    # التحقق من وجود المستخدم
    user = await db.users.find_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    # التحقق من أن المستخدم لم يتم تهيئته من قبل
    if user.get("economy_initialized"):
        return {"success": True, "message": "المستخدم مهيأ بالفعل"}
    
    # تهيئة الحقول
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]},
        {
            "$set": {
                "diamonds": INITIAL_DIAMONDS,
                "saqr_points": user.get("points", 0),
                "economy_initialized": True,
                "diamond_transactions": []
            }
        }
    )
    
    return {
        "success": True,
        "initial_diamonds": INITIAL_DIAMONDS,
        "message": f"تم منحك {INITIAL_DIAMONDS} ألماسة ترحيبية!"
    }


# ==================== ADD DIAMONDS (Ad Rewards) ====================

class AddDiamondsRequest(BaseModel):
    user_id: str
    amount: int
    source: str = "ad_reward"  # مصدر الألماسات: ad_reward, challenge_reward, etc.

@router.post("/add-diamonds")
async def add_diamonds_reward(request: AddDiamondsRequest):
    """إضافة ألماسات كمكافأة (من الإعلانات أو التحديات)"""
    
    # التحقق من صحة القيمة
    if request.amount <= 0 or request.amount > 500:
        raise HTTPException(status_code=400, detail="قيمة الألماسات غير صالحة")
    
    # الحصول على بيانات المستخدم
    user = await db.users.find_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    current_diamonds = user.get("diamonds", 0)
    new_diamonds = current_diamonds + request.amount
    
    # تحديث رصيد الألماسات
    await db.users.update_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {
            "$set": {"diamonds": new_diamonds},
            "$push": {
                "diamond_transactions": {
                    "type": "reward",
                    "amount": request.amount,
                    "source": request.source,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "balance_after": new_diamonds
                }
            }
        }
    )
    
    # تسجيل المكافأة
    await db.ad_rewards.insert_one({
        "user_id": request.user_id,
        "amount": request.amount,
        "source": request.source,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "diamonds_added": request.amount,
        "new_balance": new_diamonds,
        "message": f"تم إضافة {request.amount} ألماسة بنجاح!"
    }



# ==================== AD WATCHING REWARDS - جواهر صقر من الإعلانات ====================

class AdWatchRewardRequest(BaseModel):
    user_id: str
    watch_duration_seconds: int  # مدة المشاهدة بالثواني
    ad_type: str = "video"  # نوع الإعلان
    gems_earned: int = 1  # جواهر صقر المكتسبة

@router.post("/ad-watch-reward")
async def claim_ad_watch_reward(request: AdWatchRewardRequest):
    """مكافأة مشاهدة الإعلان - جواهر صقر للاستبدال بالمال + ألماسات للاستخدام"""
    
    # حساب جواهر صقر (للاستبدال بالمال)
    gems_earned = request.gems_earned if request.gems_earned > 0 else 1
    
    # حساب الألماسات (للاستخدام داخل التطبيق)
    diamonds_earned = max(1, request.watch_duration_seconds // 60)
    
    # التحقق من وجود المستخدم
    user = await db.users.find_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    current_gems = user.get("saqr_gems", 0)
    new_gems = current_gems + gems_earned
    
    current_diamonds = user.get("diamonds", 0)
    new_diamonds = current_diamonds + diamonds_earned
    
    # تحديث رصيد جواهر صقر والألماسات
    await db.users.update_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {
            "$set": {
                "saqr_gems": new_gems,
                "diamonds": new_diamonds
            },
            "$inc": {"total_ads_watched": 1, "total_ad_gems": gems_earned},
            "$push": {
                "saqr_gems_transactions": {
                    "type": "ad_watch",
                    "amount": gems_earned,
                    "duration_seconds": request.watch_duration_seconds,
                    "ad_type": request.ad_type,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "balance_after": new_gems
                },
                "diamond_transactions": {
                    "type": "ad_watch_bonus",
                    "amount": diamonds_earned,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "balance_after": new_diamonds
                }
            }
        }
    )
    
    # تسجيل في سجل الإعلانات
    await db.ad_watch_history.insert_one({
        "user_id": request.user_id,
        "gems_earned": gems_earned,
        "diamonds_earned": diamonds_earned,
        "duration_seconds": request.watch_duration_seconds,
        "ad_type": request.ad_type,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "saqr_gems_earned": gems_earned,
        "diamonds_earned": diamonds_earned,
        "new_gems_balance": new_gems,
        "new_diamonds_balance": new_diamonds,
        "gems_value_usd": new_gems / GEMS_PER_DOLLAR,
        "message": f"حصلت على {gems_earned} جوهرة صقر و {diamonds_earned} ألماسة!"
    }


# ==================== AD STATS ====================

@router.get("/ad-stats/{user_id}")
async def get_ad_stats(user_id: str):
    """إحصائيات مشاهدة الإعلانات للمستخدم"""
    
    user = await db.users.find_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]},
        {"_id": 0, "total_ads_watched": 1, "total_ad_diamonds": 1, "diamonds": 1}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    # إحصائيات اليوم
    today = datetime.now(timezone.utc).date().isoformat()
    today_stats = await db.ad_watch_history.aggregate([
        {
            "$match": {
                "user_id": user_id,
                "timestamp": {"$regex": f"^{today}"}
            }
        },
        {
            "$group": {
                "_id": None,
                "count": {"$sum": 1},
                "diamonds": {"$sum": "$diamonds_earned"}
            }
        }
    ]).to_list(1)
    
    today_count = today_stats[0]["count"] if today_stats else 0
    today_diamonds = today_stats[0]["diamonds"] if today_stats else 0
    
    return {
        "total_ads_watched": user.get("total_ads_watched", 0),
        "total_ad_diamonds": user.get("total_ad_diamonds", 0),
        "today_ads_watched": today_count,
        "today_diamonds_earned": today_diamonds,
        "current_diamonds": user.get("diamonds", 0),
        "exchange_rate": "500 diamonds = $1"
    }


# ==================== TREASURE CHEST REWARDS ====================

class ClaimChestRequest(BaseModel):
    user_id: str
    chest_type: str  # bronze, silver, gold, platinum, legendary
    reward_amount: int

@router.post("/claim-chest-reward")
async def claim_chest_reward(request: ClaimChestRequest):
    """استلام مكافأة صندوق الكنز"""
    
    # التحقق من صحة نوع الصندوق
    valid_chests = ["bronze", "silver", "gold", "platinum", "legendary"]
    if request.chest_type not in valid_chests:
        raise HTTPException(status_code=400, detail="نوع صندوق غير صالح")
    
    # حدود المكافآت لكل نوع
    chest_limits = {
        "bronze": (5, 15),
        "silver": (20, 50),
        "gold": (60, 150),
        "platinum": (150, 300),
        "legendary": (350, 750),
    }
    
    min_reward, max_reward = chest_limits[request.chest_type]
    if not (min_reward <= request.reward_amount <= max_reward):
        raise HTTPException(status_code=400, detail="قيمة المكافأة غير صالحة")
    
    # التحقق من المستخدم
    user = await db.users.find_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    current_diamonds = user.get("diamonds", 0)
    new_diamonds = current_diamonds + request.reward_amount
    
    # تحديث الرصيد
    await db.users.update_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {
            "$set": {"diamonds": new_diamonds},
            "$push": {
                "diamond_transactions": {
                    "type": "treasure_chest",
                    "chest_type": request.chest_type,
                    "amount": request.reward_amount,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "balance_after": new_diamonds
                }
            }
        }
    )
    
    # تسجيل في سجل الصناديق
    await db.chest_rewards.insert_one({
        "user_id": request.user_id,
        "chest_type": request.chest_type,
        "reward_amount": request.reward_amount,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "chest_type": request.chest_type,
        "diamonds_earned": request.reward_amount,
        "new_balance": new_diamonds,
        "message": f"حصلت على {request.reward_amount} ألماسة من {request.chest_type}!"
    }



# ==================== SAQR GEMS - جواهر صقر للاستبدال بالمال ====================

class AddSaqrGemsRequest(BaseModel):
    user_id: str
    amount: int
    source: str  # ad_watch, wheel_spin, chest_reward, etc.

@router.post("/add-saqr-gems")
async def add_saqr_gems(request: AddSaqrGemsRequest):
    """إضافة جواهر صقر (للاستبدال بالمال) من مشاهدة الإعلانات"""
    
    user = await db.users.find_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    current_gems = user.get("saqr_gems", 0)
    new_gems = current_gems + request.amount
    
    await db.users.update_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {
            "$set": {"saqr_gems": new_gems},
            "$push": {
                "saqr_gems_transactions": {
                    "type": request.source,
                    "amount": request.amount,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "balance_after": new_gems
                }
            }
        }
    )
    
    return {
        "success": True,
        "gems_earned": request.amount,
        "new_balance": new_gems,
        "value_usd": new_gems / GEMS_PER_DOLLAR,
        "message": f"حصلت على {request.amount} جوهرة صقر!"
    }


@router.get("/saqr-gems/{user_id}")
async def get_saqr_gems(user_id: str):
    """الحصول على رصيد جواهر صقر"""
    
    user = await db.users.find_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]},
        {"_id": 0, "saqr_gems": 1}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    gems = user.get("saqr_gems", 0)
    
    return {
        "saqr_gems": gems,
        "value_usd": gems / GEMS_PER_DOLLAR,
        "gems_per_dollar": GEMS_PER_DOLLAR
    }


# ==================== CHAT SYSTEM - نظام الدردشة ====================

class SendChatMessageRequest(BaseModel):
    user_id: str
    server_id: str  # arabic, english, global
    message: str
    user_name: str
    user_avatar: Optional[str] = None

class ChatMessage(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str]
    message: str
    server_id: str
    timestamp: str
    translated: Optional[dict] = None


@router.post("/chat/send")
async def send_chat_message(request: SendChatMessageRequest):
    """إرسال رسالة في الدردشة (تكلفة 5 ألماسات)"""
    
    # التحقق من المستخدم ورصيده
    user = await db.users.find_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    current_diamonds = user.get("diamonds", 0)
    
    # التحقق من الرصيد
    if current_diamonds < CHAT_MESSAGE_COST:
        raise HTTPException(
            status_code=400, 
            detail={
                "error": "insufficient_diamonds",
                "message": "انتهت ألماساتك! تابع الإعلانات واحصل على الألماس",
                "required": CHAT_MESSAGE_COST,
                "current": current_diamonds
            }
        )
    
    # خصم الألماسات
    new_diamonds = current_diamonds - CHAT_MESSAGE_COST
    
    await db.users.update_one(
        {"$or": [{"id": request.user_id}, {"user_id": request.user_id}]},
        {
            "$set": {"diamonds": new_diamonds},
            "$push": {
                "diamond_transactions": {
                    "type": "chat_message",
                    "amount": -CHAT_MESSAGE_COST,
                    "server_id": request.server_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "balance_after": new_diamonds
                }
            }
        }
    )
    
    # إنشاء الرسالة
    message_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    
    chat_message = {
        "id": message_id,
        "user_id": request.user_id,
        "user_name": request.user_name,
        "user_avatar": request.user_avatar,
        "message": request.message,
        "server_id": request.server_id,
        "timestamp": timestamp,
    }
    
    # حفظ الرسالة
    await db.chat_messages.insert_one(chat_message)
    
    return {
        "success": True,
        "message_id": message_id,
        "diamonds_spent": CHAT_MESSAGE_COST,
        "new_balance": new_diamonds,
        "chat_message": {
            "id": message_id,
            "user_id": request.user_id,
            "user_name": request.user_name,
            "user_avatar": request.user_avatar,
            "message": request.message,
            "server_id": request.server_id,
            "timestamp": timestamp,
        }
    }


@router.get("/chat/messages/{server_id}")
async def get_chat_messages(server_id: str, limit: int = 50, before: Optional[str] = None):
    """الحصول على رسائل السيرفر"""
    
    query = {"server_id": server_id}
    
    if before:
        query["timestamp"] = {"$lt": before}
    
    messages = await db.chat_messages.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Reverse to get chronological order
    messages.reverse()
    
    return {
        "server_id": server_id,
        "messages": messages,
        "count": len(messages)
    }


@router.get("/chat/servers")
async def get_chat_servers():
    """الحصول على قائمة السيرفرات"""
    
    servers = [
        {
            "id": "arabic",
            "name": "السيرفر العربي",
            "icon": "flag",
            "language": "ar",
            "description": "دردشة باللغة العربية"
        },
        {
            "id": "english",
            "name": "English Server",
            "icon": "globe",
            "language": "en",
            "description": "Chat in English"
        },
        {
            "id": "global",
            "name": "السيرفر العالمي",
            "icon": "earth",
            "language": "multi",
            "description": "دردشة متعددة اللغات مع ترجمة تلقائية"
        }
    ]
    
    # Get online count per server
    for server in servers:
        count = await db.chat_messages.count_documents({
            "server_id": server["id"],
            "timestamp": {"$gte": (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()}
        })
        server["recent_messages"] = count
    
    return {
        "servers": servers,
        "message_cost": CHAT_MESSAGE_COST
    }


@router.get("/chat/check-balance/{user_id}")
async def check_chat_balance(user_id: str):
    """التحقق من رصيد الألماسات للدردشة"""
    
    user = await db.users.find_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]},
        {"_id": 0, "diamonds": 1}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    diamonds = user.get("diamonds", 0)
    can_send = diamonds >= CHAT_MESSAGE_COST
    messages_available = diamonds // CHAT_MESSAGE_COST
    
    return {
        "diamonds": diamonds,
        "can_send": can_send,
        "messages_available": messages_available,
        "message_cost": CHAT_MESSAGE_COST,
        "message": "يمكنك الإرسال" if can_send else "انتهت ألماساتك! تابع الإعلانات واحصل على الألماس"
    }
