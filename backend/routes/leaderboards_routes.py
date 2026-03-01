"""
Game Leaderboards System - نظام لوحات المتصدرين للألعاب
- لوحة متصدرين منفصلة لكل لعبة
- تصنيف يومي/أسبوعي/شهري/كل الأوقات
- جوائز للمتصدرين
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from auth.dependencies import get_current_user_id
import os

router = APIRouter(prefix='/leaderboards', tags=['Game Leaderboards'])

def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


# ============ MODELS ============

class GameScoreSubmit(BaseModel):
    game_id: str  # chess, snake, memory, etc.
    score: int
    time_seconds: Optional[int] = None
    difficulty: Optional[str] = "normal"

class LeaderboardFilter(BaseModel):
    game_id: str
    period: str = "all"  # daily, weekly, monthly, all
    limit: int = 50


# ============ GAME DEFINITIONS ============

GAMES = {
    "chess": {"name": "الشطرنج", "icon": "crown", "color": "#7c3aed"},
    "tictactoe": {"name": "اكس او", "icon": "grid", "color": "#f97316"},
    "memory": {"name": "الذاكرة", "icon": "brain", "color": "#14b8a6"},
    "snake": {"name": "الثعبان", "icon": "zap", "color": "#22c55e"},
    "trivia": {"name": "أسئلة ثقافية", "icon": "help-circle", "color": "#10b981"},
    "speedmath": {"name": "سباق الحساب", "icon": "calculator", "color": "#8b5cf6"},
    "wordchain": {"name": "سباق الكلمات", "icon": "type", "color": "#06b6d4"},
    "puzzle": {"name": "تركيب الصور", "icon": "puzzle", "color": "#3b82f6"},
    "brickbreaker": {"name": "تكسير الطوب", "icon": "diamond", "color": "#ec4899"},
    "colorswitch": {"name": "تبديل الألوان", "icon": "palette", "color": "#f43f5e"},
    "aiquest": {"name": "AI Quest", "icon": "sparkles", "color": "#9333ea"},
    "riddles": {"name": "الألغاز", "icon": "lightbulb", "color": "#eab308"},
}

# جوائز المتصدرين (نقاط صقر)
LEADERBOARD_REWARDS = {
    1: {"points": 500, "diamonds": 100, "title": "🥇 البطل"},
    2: {"points": 300, "diamonds": 50, "title": "🥈 الوصيف"},
    3: {"points": 200, "diamonds": 30, "title": "🥉 المركز الثالث"},
    4: {"points": 100, "diamonds": 20, "title": "المركز الرابع"},
    5: {"points": 80, "diamonds": 15, "title": "المركز الخامس"},
    6: {"points": 60, "diamonds": 10, "title": "المركز السادس"},
    7: {"points": 50, "diamonds": 8, "title": "المركز السابع"},
    8: {"points": 40, "diamonds": 5, "title": "المركز الثامن"},
    9: {"points": 30, "diamonds": 3, "title": "المركز التاسع"},
    10: {"points": 20, "diamonds": 2, "title": "المركز العاشر"},
}


# ============ ENDPOINTS ============

@router.post('/submit-score')
async def submit_game_score(
    data: GameScoreSubmit,
    user_id: str = Depends(get_current_user_id)
):
    """إرسال نتيجة لعبة"""
    db = get_db()
    
    if data.game_id not in GAMES:
        raise HTTPException(status_code=400, detail="لعبة غير معروفة")
    
    # Get user info
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="مستخدم غير موجود")
    
    # Save score
    score_record = {
        "user_id": user_id,
        "user_name": user.get("name", "لاعب"),
        "game_id": data.game_id,
        "score": data.score,
        "time_seconds": data.time_seconds,
        "difficulty": data.difficulty,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.game_scores.insert_one(score_record)
    
    # Update user's best score for this game
    best_score = await db.game_best_scores.find_one({
        "user_id": user_id,
        "game_id": data.game_id
    })
    
    if not best_score or data.score > best_score.get("score", 0):
        await db.game_best_scores.update_one(
            {"user_id": user_id, "game_id": data.game_id},
            {"$set": {
                "user_id": user_id,
                "user_name": user.get("name", "لاعب"),
                "game_id": data.game_id,
                "score": data.score,
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
    
    # Get current rank
    rank = await _get_user_rank(db, user_id, data.game_id, "all")
    
    return {
        "success": True,
        "score": data.score,
        "rank": rank,
        "is_new_best": not best_score or data.score > best_score.get("score", 0),
        "game": GAMES[data.game_id]
    }


@router.get('/game/{game_id}')
async def get_game_leaderboard(
    game_id: str,
    period: str = "all",
    limit: int = 50,
    user_id: Optional[str] = None
):
    """الحصول على لوحة المتصدرين للعبة"""
    db = get_db()
    
    if game_id not in GAMES:
        raise HTTPException(status_code=400, detail="لعبة غير معروفة")
    
    # Build date filter
    date_filter = {}
    now = datetime.now(timezone.utc)
    
    if period == "daily":
        date_filter = {"updated_at": {"$gte": now - timedelta(days=1)}}
    elif period == "weekly":
        date_filter = {"updated_at": {"$gte": now - timedelta(weeks=1)}}
    elif period == "monthly":
        date_filter = {"updated_at": {"$gte": now - timedelta(days=30)}}
    
    # Get leaderboard from best scores
    query = {"game_id": game_id, **date_filter}
    
    leaderboard = await db.game_best_scores.find(
        query,
        {"_id": 0, "user_id": 1, "user_name": 1, "score": 1, "updated_at": 1}
    ).sort("score", -1).limit(limit).to_list(limit)
    
    # Add ranks and rewards
    for idx, entry in enumerate(leaderboard):
        entry["rank"] = idx + 1
        if idx + 1 <= 10:
            entry["reward"] = LEADERBOARD_REWARDS.get(idx + 1, {})
    
    # Get user's rank if provided
    user_rank = None
    user_score = None
    if user_id:
        user_rank = await _get_user_rank(db, user_id, game_id, period)
        user_best = await db.game_best_scores.find_one({
            "user_id": user_id,
            "game_id": game_id
        })
        if user_best:
            user_score = user_best.get("score", 0)
    
    return {
        "game": GAMES[game_id],
        "period": period,
        "leaderboard": leaderboard,
        "total_players": await db.game_best_scores.count_documents({"game_id": game_id}),
        "user_rank": user_rank,
        "user_score": user_score
    }


@router.get('/all-games')
async def get_all_games_leaderboards(
    period: str = "all",
    limit: int = 10,
    user_id: Optional[str] = None
):
    """الحصول على لوحات المتصدرين لجميع الألعاب"""
    db = get_db()
    
    result = {}
    
    for game_id, game_info in GAMES.items():
        # Build date filter
        date_filter = {}
        now = datetime.now(timezone.utc)
        
        if period == "daily":
            date_filter = {"updated_at": {"$gte": now - timedelta(days=1)}}
        elif period == "weekly":
            date_filter = {"updated_at": {"$gte": now - timedelta(weeks=1)}}
        elif period == "monthly":
            date_filter = {"updated_at": {"$gte": now - timedelta(days=30)}}
        
        query = {"game_id": game_id, **date_filter}
        
        leaderboard = await db.game_best_scores.find(
            query,
            {"_id": 0, "user_id": 1, "user_name": 1, "score": 1}
        ).sort("score", -1).limit(limit).to_list(limit)
        
        for idx, entry in enumerate(leaderboard):
            entry["rank"] = idx + 1
        
        # Get user's rank
        user_rank = None
        if user_id:
            user_rank = await _get_user_rank(db, user_id, game_id, period)
        
        result[game_id] = {
            "game": game_info,
            "leaderboard": leaderboard,
            "user_rank": user_rank
        }
    
    return {
        "period": period,
        "games": result
    }


@router.get('/my-stats')
async def get_my_game_stats(user_id: str = Depends(get_current_user_id)):
    """الحصول على إحصائياتي في جميع الألعاب"""
    db = get_db()
    
    stats = {}
    total_games = 0
    total_score = 0
    
    for game_id, game_info in GAMES.items():
        # Get best score
        best = await db.game_best_scores.find_one({
            "user_id": user_id,
            "game_id": game_id
        })
        
        # Get games count
        count = await db.game_scores.count_documents({
            "user_id": user_id,
            "game_id": game_id
        })
        
        # Get rank
        rank = await _get_user_rank(db, user_id, game_id, "all")
        
        stats[game_id] = {
            "game": game_info,
            "best_score": best.get("score", 0) if best else 0,
            "games_played": count,
            "rank": rank
        }
        
        total_games += count
        total_score += best.get("score", 0) if best else 0
    
    return {
        "games": stats,
        "total_games_played": total_games,
        "total_best_score": total_score
    }


@router.post('/claim-reward')
async def claim_leaderboard_reward(
    game_id: str,
    period: str = "weekly",
    user_id: str = Depends(get_current_user_id)
):
    """استلام مكافأة المتصدرين"""
    db = get_db()
    
    if game_id not in GAMES:
        raise HTTPException(status_code=400, detail="لعبة غير معروفة")
    
    # Check user's rank
    rank = await _get_user_rank(db, user_id, game_id, period)
    
    if not rank or rank > 10:
        raise HTTPException(status_code=400, detail="لست ضمن أفضل 10 لاعبين")
    
    # Check if already claimed
    claim_key = f"{game_id}_{period}_{datetime.now(timezone.utc).strftime('%Y-%W')}"
    existing_claim = await db.leaderboard_claims.find_one({
        "user_id": user_id,
        "claim_key": claim_key
    })
    
    if existing_claim:
        raise HTTPException(status_code=400, detail="تم استلام المكافأة مسبقاً")
    
    # Get reward
    reward = LEADERBOARD_REWARDS.get(rank, {})
    points = reward.get("points", 0)
    diamonds = reward.get("diamonds", 0)
    
    # Award user
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"points": points, "diamonds": diamonds}}
    )
    
    # Record claim
    await db.leaderboard_claims.insert_one({
        "user_id": user_id,
        "game_id": game_id,
        "period": period,
        "claim_key": claim_key,
        "rank": rank,
        "points_awarded": points,
        "diamonds_awarded": diamonds,
        "claimed_at": datetime.now(timezone.utc)
    })
    
    return {
        "success": True,
        "rank": rank,
        "points_awarded": points,
        "diamonds_awarded": diamonds,
        "title": reward.get("title", "")
    }


# ============ HELPER FUNCTIONS ============

async def _get_user_rank(db, user_id: str, game_id: str, period: str) -> Optional[int]:
    """الحصول على ترتيب المستخدم"""
    # Build date filter
    date_filter = {}
    now = datetime.now(timezone.utc)
    
    if period == "daily":
        date_filter = {"updated_at": {"$gte": now - timedelta(days=1)}}
    elif period == "weekly":
        date_filter = {"updated_at": {"$gte": now - timedelta(weeks=1)}}
    elif period == "monthly":
        date_filter = {"updated_at": {"$gte": now - timedelta(days=30)}}
    
    # Get user's score
    user_score = await db.game_best_scores.find_one({
        "user_id": user_id,
        "game_id": game_id,
        **date_filter
    })
    
    if not user_score:
        return None
    
    # Count players with higher score
    higher_count = await db.game_best_scores.count_documents({
        "game_id": game_id,
        "score": {"$gt": user_score.get("score", 0)},
        **date_filter
    })
    
    return higher_count + 1
