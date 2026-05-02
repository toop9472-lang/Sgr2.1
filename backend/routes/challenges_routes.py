"""
Daily Challenges & Login Rewards System
- Daily challenges with max 69 gems/day
- 14-day login rewards with gems + diamonds
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from auth.dependencies import get_current_user_id
import os
import uuid

router = APIRouter(prefix='/challenges', tags=['Challenges & Rewards'])

def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


# ============ MODELS ============

class ChallengeProgress(BaseModel):
    challenge_id: str
    current_progress: int
    target: int
    completed: bool
    gems_earned: int

class LoginRewardDay(BaseModel):
    day: int
    gems: int
    claimed: bool
    claim_date: Optional[str] = None

class ClaimChallengeRequest(BaseModel):
    challenge_id: str

class ClaimLoginRewardRequest(BaseModel):
    day: int


# ============ CHALLENGE DEFINITIONS ============

# Daily challenges - Total max 69 gems/day
DAILY_CHALLENGES = [
    {
        "id": "watch_5_ads",
        "title": "مشاهد نشط",
        "description": "شاهد 5 إعلانات",
        "target": 5,
        "gems": 15,
        "icon": "play-circle",
        "type": "watch_ads"
    },
    {
        "id": "watch_10_ads",
        "title": "مشاهد متفاني",
        "description": "شاهد 10 إعلانات",
        "target": 10,
        "gems": 25,
        "icon": "film",
        "type": "watch_ads"
    },
    {
        "id": "daily_login",
        "title": "الحضور اليومي",
        "description": "سجل دخولك اليوم",
        "target": 1,
        "gems": 10,
        "icon": "log-in",
        "type": "login"
    },
    {
        "id": "first_ad",
        "title": "البداية",
        "description": "شاهد إعلانك الأول اليوم",
        "target": 1,
        "gems": 5,
        "icon": "rocket",
        "type": "watch_ads"
    },
    {
        "id": "stay_online_1hour",
        "title": "المثابر",
        "description": "ابقَ متصلاً لمدة ساعة واحدة",
        "target": 60,  # 60 minutes
        "gems": 14,
        "icon": "timer",
        "type": "online_time"
    }
]
# Total: 15 + 25 + 10 + 5 + 14 = 69 gems max

# 14-day login rewards - Total: 160 gems + 200 diamonds
# Distribution: Gems and diamonds mixed to keep users engaged
LOGIN_REWARDS = [
    {"day": 1, "gems": 30, "diamonds": 20},   # يوم 1: 30 جوهرة + 20 ألماسة
    {"day": 2, "gems": 10, "diamonds": 10},   # يوم 2: 10 جوهرة + 10 ألماسة
    {"day": 3, "gems": 15, "diamonds": 0},    # يوم 3: 15 جوهرة
    {"day": 4, "gems": 0, "diamonds": 25},    # يوم 4: 25 ألماسة
    {"day": 5, "gems": 10, "diamonds": 10},   # يوم 5: 10 جوهرة + 10 ألماسة
    {"day": 6, "gems": 15, "diamonds": 0},    # يوم 6: 15 جوهرة
    {"day": 7, "gems": 20, "diamonds": 35},   # يوم 7: 20 جوهرة + 35 ألماسة (مكافأة الأسبوع)
    {"day": 8, "gems": 10, "diamonds": 10},   # يوم 8: 10 جوهرة + 10 ألماسة
    {"day": 9, "gems": 10, "diamonds": 0},    # يوم 9: 10 جوهرة
    {"day": 10, "gems": 0, "diamonds": 20},   # يوم 10: 20 ألماسة
    {"day": 11, "gems": 10, "diamonds": 10},  # يوم 11: 10 جوهرة + 10 ألماسة
    {"day": 12, "gems": 10, "diamonds": 0},   # يوم 12: 10 جوهرة
    {"day": 13, "gems": 10, "diamonds": 10},  # يوم 13: 10 جوهرة + 10 ألماسة
    {"day": 14, "gems": 10, "diamonds": 50},  # يوم 14: 10 جوهرة + 50 ألماسة (مكافأة النهاية)
]
# Total Gems: 30+10+15+0+10+15+20+10+10+0+10+10+10+10 = 160 gems
# Total Diamonds: 20+10+0+25+10+0+35+10+0+20+10+0+10+50 = 200 diamonds


# ============ HELPER FUNCTIONS ============

def get_current_month_start():
    """Get the start of the current month for login rewards reset"""
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

def get_today_start():
    """Get start of today"""
    return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)


async def get_user_challenge_progress(db, user_id: str, challenge_id: str, challenge_type: str, target: int):
    """Calculate user's progress for a specific challenge"""
    today_start = get_today_start()
    
    if challenge_type == "watch_ads":
        # Count ads watched today
        count = await db.rewarded_ad_views.count_documents({
            'user_id': user_id,
            'completed': True,
            'timestamp': {'$gte': today_start}
        })
        return min(count, target)
    
    elif challenge_type == "login":
        # Check if user logged in today
        login_record = await db.user_daily_logins.find_one({
            'user_id': user_id,
            'date': today_start.strftime('%Y-%m-%d')
        })
        return 1 if login_record else 0
    
    elif challenge_type == "online_time":
        # Get user's online time today in minutes
        session = await db.user_online_sessions.find_one({
            'user_id': user_id,
            'date': today_start.strftime('%Y-%m-%d')
        })
        if session:
            # Calculate minutes from start time to now
            start_time = session.get('start_time')
            if start_time:
                now = datetime.now(timezone.utc)
                # Ensure start_time is timezone-aware
                if start_time.tzinfo is None:
                    start_time = start_time.replace(tzinfo=timezone.utc)
                elapsed = (now - start_time).total_seconds() / 60
                return min(int(elapsed), target)
        return 0
    
    return 0


async def record_daily_login(db, user_id: str):
    """Record user's daily login and update streak"""
    today = get_today_start()
    today_str = today.strftime('%Y-%m-%d')
    yesterday = today - timedelta(days=1)
    yesterday_str = yesterday.strftime('%Y-%m-%d')
    
    # Check if already logged in today
    existing = await db.user_daily_logins.find_one({
        'user_id': user_id,
        'date': today_str
    })
    
    if existing:
        return existing.get('streak', 1)
    
    # Check yesterday's login for streak
    yesterday_login = await db.user_daily_logins.find_one({
        'user_id': user_id,
        'date': yesterday_str
    })
    
    new_streak = (yesterday_login.get('streak', 0) + 1) if yesterday_login else 1
    
    # Record today's login
    await db.user_daily_logins.insert_one({
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'date': today_str,
        'streak': new_streak,
        'timestamp': datetime.now(timezone.utc)
    })
    
    # Update user's streak
    await db.users.update_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'$set': {'streak_days': new_streak}}
    )
    
    return new_streak


async def start_online_session(db, user_id: str):
    """Start or get existing online session for today"""
    today = get_today_start()
    today_str = today.strftime('%Y-%m-%d')
    
    # Check if session exists for today
    existing = await db.user_online_sessions.find_one({
        'user_id': user_id,
        'date': today_str
    })
    
    if existing:
        return existing.get('start_time')
    
    # Create new session
    start_time = datetime.now(timezone.utc)
    await db.user_online_sessions.insert_one({
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'date': today_str,
        'start_time': start_time,
        'created_at': start_time
    })
    
    return start_time


# ============ ROUTES ============

@router.get('/daily')
async def get_daily_challenges(user_id: str = Depends(get_current_user_id)):
    """Get all daily challenges with user's progress"""
    db = get_db()
    today_start = get_today_start()
    today_str = today_start.strftime('%Y-%m-%d')
    
    # Record daily login
    await record_daily_login(db, user_id)
    
    # Start online session for timer challenge
    session_start = await start_online_session(db, user_id)
    
    # Get claimed challenges today
    claimed_today = await db.challenge_claims.find({
        'user_id': user_id,
        'date': today_str
    }).to_list(100)
    claimed_ids = {c['challenge_id'] for c in claimed_today}
    
    challenges = []
    total_earned_today = 0
    
    for challenge in DAILY_CHALLENGES:
        progress = await get_user_challenge_progress(
            db, user_id, 
            challenge['id'], 
            challenge['type'], 
            challenge['target']
        )
        
        is_completed = progress >= challenge['target']
        is_claimed = challenge['id'] in claimed_ids
        
        if is_claimed:
            total_earned_today += challenge['gems']
        
        challenge_data = {
            'id': challenge['id'],
            'title': challenge['title'],
            'description': challenge['description'],
            'icon': challenge['icon'],
            'target': challenge['target'],
            'current': progress,
            'gems': challenge['gems'],
            # توافق خلفي
            'points': challenge['gems'],
            'completed': is_completed,
            'claimed': is_claimed,
            'can_claim': is_completed and not is_claimed
        }
        
        # Add timer info for online_time challenge
        if challenge['type'] == 'online_time' and session_start:
            now = datetime.now(timezone.utc)
            # Ensure session_start is timezone-aware
            if session_start.tzinfo is None:
                session_start = session_start.replace(tzinfo=timezone.utc)
            elapsed_seconds = int((now - session_start).total_seconds())
            remaining_seconds = max(0, (challenge['target'] * 60) - elapsed_seconds)
            challenge_data['timer'] = {
                'elapsed_seconds': elapsed_seconds,
                'remaining_seconds': remaining_seconds,
                'target_seconds': challenge['target'] * 60,
                'start_time': session_start.isoformat()
            }
        
        challenges.append(challenge_data)
    
    return {
        'challenges': challenges,
        'max_daily_gems': 69,
        'max_daily_points': 69,
        'earned_today': total_earned_today,
        'date': today_str
    }


@router.post('/daily/claim')
async def claim_daily_challenge(
    request: ClaimChallengeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Claim reward for completed challenge"""
    db = get_db()
    today_start = get_today_start()
    today_str = today_start.strftime('%Y-%m-%d')
    
    # Find the challenge
    challenge = next((c for c in DAILY_CHALLENGES if c['id'] == request.challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail='التحدي غير موجود')
    
    # Check if already claimed
    existing_claim = await db.challenge_claims.find_one({
        'user_id': user_id,
        'challenge_id': request.challenge_id,
        'date': today_str
    })
    if existing_claim:
        raise HTTPException(status_code=400, detail='تم استلام هذه المكافأة بالفعل')
    
    # Check progress
    progress = await get_user_challenge_progress(
        db, user_id,
        challenge['id'],
        challenge['type'],
        challenge['target']
    )
    
    if progress < challenge['target']:
        raise HTTPException(status_code=400, detail='لم تكمل التحدي بعد')
    
    # Record claim
    await db.challenge_claims.insert_one({
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'challenge_id': request.challenge_id,
        'gems': challenge['gems'],
        'points': challenge['gems'],
        'date': today_str,
        'timestamp': datetime.now(timezone.utc)
    })
    
    # Add gems to user (with backward compatibility fields)
    await db.users.update_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'$inc': {
            'saqr_gems': challenge['gems'],
            'points': challenge['gems'],
            'saqr_points': challenge['gems'],
            'total_earned': challenge['gems'],
        }}
    )
    
    # Get updated user points
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'saqr_gems': 1, 'points': 1}
    )
    
    return {
        'success': True,
        'gems_earned': challenge['gems'],
        'points_earned': challenge['gems'],
        'total_gems': user.get('saqr_gems', user.get('points', 0)),
        'total_points': user.get('saqr_gems', user.get('points', 0)),
        'message': f'حصلت على {challenge["gems"]} جوهرة صقر!'
    }


@router.get('/login-rewards')
async def get_login_rewards(user_id: str = Depends(get_current_user_id)):
    """Get 14-day login rewards status"""
    db = get_db()
    month_start = get_current_month_start()
    month_str = month_start.strftime('%Y-%m')
    
    # Record daily login
    await record_daily_login(db, user_id)
    
    # Get user's login rewards for this month
    user_rewards = await db.login_rewards.find_one({
        'user_id': user_id,
        'month': month_str
    })
    
    if not user_rewards:
        # Initialize rewards for new month
        user_rewards = {
            'user_id': user_id,
            'month': month_str,
            'claimed_days': [],
            'total_claimed_gems': 0,
            'total_claimed_points': 0,  # توافق خلفي
            'total_claimed_diamonds': 0,
            'created_at': datetime.now(timezone.utc)
        }
        await db.login_rewards.insert_one(user_rewards)
    
    claimed_days = set(user_rewards.get('claimed_days', []))
    
    # Get consecutive login days this month
    login_count = await db.user_daily_logins.count_documents({
        'user_id': user_id,
        'timestamp': {'$gte': month_start}
    })
    
    rewards = []
    for reward in LOGIN_REWARDS:
        day = reward['day']
        is_claimed = day in claimed_days
        can_claim = login_count >= day and not is_claimed
        
        rewards.append({
            'day': day,
            'gems': reward.get('gems', reward.get('points', 0)),
            'points': reward.get('gems', reward.get('points', 0)),  # توافق خلفي
            'diamonds': reward.get('diamonds', 0),
            'claimed': is_claimed,
            'can_claim': can_claim,
            'unlocked': login_count >= day
        })
    
    return {
        'rewards': rewards,
        'total_gems': 160,
        'total_points': 160,
        'total_diamonds': 200,
        'claimed_gems': user_rewards.get('total_claimed_gems', user_rewards.get('total_claimed_points', user_rewards.get('total_claimed', 0))),
        'claimed_points': user_rewards.get('total_claimed_gems', user_rewards.get('total_claimed_points', user_rewards.get('total_claimed', 0))),
        'claimed_diamonds': user_rewards.get('total_claimed_diamonds', 0),
        'login_days': login_count,
        'month': month_str
    }


@router.post('/login-rewards/claim')
async def claim_login_reward(
    request: ClaimLoginRewardRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Claim a specific day's login reward (points and/or diamonds)"""
    db = get_db()
    month_start = get_current_month_start()
    month_str = month_start.strftime('%Y-%m')
    
    # Find the reward
    reward = next((r for r in LOGIN_REWARDS if r['day'] == request.day), None)
    if not reward:
        raise HTTPException(status_code=404, detail='المكافأة غير موجودة')
    
    # Get user's login rewards
    user_rewards = await db.login_rewards.find_one({
        'user_id': user_id,
        'month': month_str
    })
    
    if not user_rewards:
        user_rewards = {
            'user_id': user_id,
            'month': month_str,
            'claimed_days': [],
            'total_claimed_gems': 0,
            'total_claimed_points': 0,  # توافق خلفي
            'total_claimed_diamonds': 0,
            'created_at': datetime.now(timezone.utc)
        }
        await db.login_rewards.insert_one(user_rewards)
    
    # Check if already claimed
    if request.day in user_rewards.get('claimed_days', []):
        raise HTTPException(status_code=400, detail='تم استلام هذه المكافأة بالفعل')
    
    # Check login days
    login_count = await db.user_daily_logins.count_documents({
        'user_id': user_id,
        'timestamp': {'$gte': month_start}
    })
    
    if login_count < request.day:
        raise HTTPException(status_code=400, detail=f'تحتاج {request.day} أيام تسجيل دخول')
    
    gems_to_add = reward.get('gems', reward.get('points', 0))
    diamonds_to_add = reward.get('diamonds', 0)
    
    # Update rewards record
    await db.login_rewards.update_one(
        {'user_id': user_id, 'month': month_str},
        {
            '$push': {'claimed_days': request.day},
            '$inc': {
                'total_claimed_gems': gems_to_add,
                'total_claimed_points': gems_to_add,
                'total_claimed_diamonds': diamonds_to_add
            },
            '$set': {'updated_at': datetime.now(timezone.utc)}
        }
    )
    
    # Add gems and diamonds to user
    update_query = {}
    if gems_to_add > 0:
        update_query['saqr_gems'] = gems_to_add
        update_query['points'] = gems_to_add
        update_query['saqr_points'] = gems_to_add
        update_query['total_earned'] = gems_to_add
    if diamonds_to_add > 0:
        update_query['diamonds'] = diamonds_to_add
    
    if update_query:
        await db.users.update_one(
            {'$or': [{'id': user_id}, {'user_id': user_id}]},
            {'$inc': update_query}
        )
    
    # Get updated user data
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'saqr_gems': 1, 'points': 1, 'diamonds': 1}
    )
    
    message_parts = []
    if gems_to_add > 0:
        message_parts.append(f'{gems_to_add} جوهرة صقر')
    if diamonds_to_add > 0:
        message_parts.append(f'{diamonds_to_add} ألماسة')
    
    return {
        'success': True,
        'day': request.day,
        'gems_earned': gems_to_add,
        'points_earned': gems_to_add,
        'diamonds_earned': diamonds_to_add,
        'total_gems': user.get('saqr_gems', user.get('points', 0)),
        'total_points': user.get('saqr_gems', user.get('points', 0)),
        'total_diamonds': user.get('diamonds', 0),
        'message': f'حصلت على {" و ".join(message_parts)}!'
    }


@router.get('/stats')
async def get_challenges_stats(user_id: str = Depends(get_current_user_id)):
    """Get user's overall challenges and rewards stats"""
    db = get_db()
    today_start = get_today_start()
    month_start = get_current_month_start()
    
    # Today's challenge gems
    today_claims = await db.challenge_claims.aggregate([
        {'$match': {'user_id': user_id, 'date': today_start.strftime('%Y-%m-%d')}},
        {'$group': {'_id': None, 'total': {'$sum': {'$ifNull': ['$gems', '$points']}}}}
    ]).to_list(1)
    
    # This month's login reward gems
    login_rewards = await db.login_rewards.find_one({
        'user_id': user_id,
        'month': month_start.strftime('%Y-%m')
    })
    
    # All time challenge gems
    all_time = await db.challenge_claims.aggregate([
        {'$match': {'user_id': user_id}},
        {'$group': {'_id': None, 'total': {'$sum': {'$ifNull': ['$gems', '$points']}}}}
    ]).to_list(1)
    
    # User streak
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'streak_days': 1, 'points': 1}
    )
    
    return {
        'today': {
            'challenge_points': today_claims[0]['total'] if today_claims else 0,
            'max_points': 69
        },
        'this_month': {
            'login_reward_gems': login_rewards.get('total_claimed_gems', login_rewards.get('total_claimed_points', login_rewards.get('total_claimed', 0))) if login_rewards else 0,
            'login_reward_points': login_rewards.get('total_claimed_gems', login_rewards.get('total_claimed_points', login_rewards.get('total_claimed', 0))) if login_rewards else 0,
            'login_reward_diamonds': login_rewards.get('total_claimed_diamonds', 0) if login_rewards else 0,
            'max_gems': 160,
            'max_points': 160,
            'max_diamonds': 200
        },
        'all_time': {
            'challenge_gems': all_time[0]['total'] if all_time else 0,
            'challenge_points': all_time[0]['total'] if all_time else 0
        },
        'streak_days': user.get('streak_days', 0) if user else 0,
        'current_gems': user.get('saqr_gems', user.get('points', 0)) if user else 0,
        'current_points': user.get('saqr_gems', user.get('points', 0)) if user else 0
    }
