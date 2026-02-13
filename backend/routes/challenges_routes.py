"""
Daily Challenges & Login Rewards System
- Daily challenges with max 69 points/day
- 14-day login rewards with 150 total points/month
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
    points_earned: int

class LoginRewardDay(BaseModel):
    day: int
    points: int
    claimed: bool
    claim_date: Optional[str] = None

class ClaimChallengeRequest(BaseModel):
    challenge_id: str

class ClaimLoginRewardRequest(BaseModel):
    day: int


# ============ CHALLENGE DEFINITIONS ============

# Daily challenges - Total max 69 points/day
DAILY_CHALLENGES = [
    {
        "id": "watch_5_ads",
        "title": "مشاهد نشط",
        "description": "شاهد 5 إعلانات",
        "target": 5,
        "points": 15,
        "icon": "play-circle",
        "type": "watch_ads"
    },
    {
        "id": "watch_10_ads",
        "title": "مشاهد متفاني",
        "description": "شاهد 10 إعلانات",
        "target": 10,
        "points": 25,
        "icon": "film",
        "type": "watch_ads"
    },
    {
        "id": "daily_login",
        "title": "الحضور اليومي",
        "description": "سجل دخولك اليوم",
        "target": 1,
        "points": 10,
        "icon": "log-in",
        "type": "login"
    },
    {
        "id": "first_ad",
        "title": "البداية",
        "description": "شاهد إعلانك الأول اليوم",
        "target": 1,
        "points": 5,
        "icon": "rocket",
        "type": "watch_ads"
    },
    {
        "id": "stay_online_1hour",
        "title": "المثابر",
        "description": "ابقَ متصلاً لمدة ساعة واحدة",
        "target": 60,  # 60 minutes
        "points": 14,
        "icon": "timer",
        "type": "online_time"
    }
]
# Total: 15 + 25 + 10 + 5 + 14 = 69 points max

# 14-day login rewards - Total 150 points/month
# Distribution: Increasing rewards to keep users engaged
LOGIN_REWARDS = [
    {"day": 1, "points": 5},
    {"day": 2, "points": 5},
    {"day": 3, "points": 8},
    {"day": 4, "points": 8},
    {"day": 5, "points": 10},
    {"day": 6, "points": 10},
    {"day": 7, "points": 15},  # Week 1 bonus
    {"day": 8, "points": 10},
    {"day": 9, "points": 10},
    {"day": 10, "points": 12},
    {"day": 11, "points": 12},
    {"day": 12, "points": 15},
    {"day": 13, "points": 15},
    {"day": 14, "points": 15},  # Final bonus
]
# Total: 5+5+8+8+10+10+15+10+10+12+12+15+15+15 = 150 points


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
            total_earned_today += challenge['points']
        
        challenge_data = {
            'id': challenge['id'],
            'title': challenge['title'],
            'description': challenge['description'],
            'icon': challenge['icon'],
            'target': challenge['target'],
            'current': progress,
            'points': challenge['points'],
            'completed': is_completed,
            'claimed': is_claimed,
            'can_claim': is_completed and not is_claimed
        }
        
        # Add timer info for online_time challenge
        if challenge['type'] == 'online_time' and session_start:
            now = datetime.now(timezone.utc)
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
        'points': challenge['points'],
        'date': today_str,
        'timestamp': datetime.now(timezone.utc)
    })
    
    # Add points to user
    await db.users.update_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'$inc': {'points': challenge['points'], 'total_earned': challenge['points']}}
    )
    
    # Get updated user points
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'points': 1}
    )
    
    return {
        'success': True,
        'points_earned': challenge['points'],
        'total_points': user.get('points', 0),
        'message': f'حصلت على {challenge["points"]} نقطة!'
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
            'total_claimed': 0,
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
            'points': reward['points'],
            'claimed': is_claimed,
            'can_claim': can_claim,
            'unlocked': login_count >= day
        })
    
    return {
        'rewards': rewards,
        'total_points': 150,
        'claimed_points': user_rewards.get('total_claimed', 0),
        'login_days': login_count,
        'month': month_str
    }


@router.post('/login-rewards/claim')
async def claim_login_reward(
    request: ClaimLoginRewardRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Claim a specific day's login reward"""
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
            'total_claimed': 0,
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
    
    # Update rewards record
    await db.login_rewards.update_one(
        {'user_id': user_id, 'month': month_str},
        {
            '$push': {'claimed_days': request.day},
            '$inc': {'total_claimed': reward['points']},
            '$set': {'updated_at': datetime.now(timezone.utc)}
        }
    )
    
    # Add points to user
    await db.users.update_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'$inc': {'points': reward['points'], 'total_earned': reward['points']}}
    )
    
    # Get updated user points
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'points': 1}
    )
    
    return {
        'success': True,
        'day': request.day,
        'points_earned': reward['points'],
        'total_points': user.get('points', 0),
        'message': f'حصلت على {reward["points"]} نقطة!'
    }


@router.get('/stats')
async def get_challenges_stats(user_id: str = Depends(get_current_user_id)):
    """Get user's overall challenges and rewards stats"""
    db = get_db()
    today_start = get_today_start()
    month_start = get_current_month_start()
    
    # Today's challenge points
    today_claims = await db.challenge_claims.aggregate([
        {'$match': {'user_id': user_id, 'date': today_start.strftime('%Y-%m-%d')}},
        {'$group': {'_id': None, 'total': {'$sum': '$points'}}}
    ]).to_list(1)
    
    # This month's login reward points
    login_rewards = await db.login_rewards.find_one({
        'user_id': user_id,
        'month': month_start.strftime('%Y-%m')
    })
    
    # All time challenge points
    all_time = await db.challenge_claims.aggregate([
        {'$match': {'user_id': user_id}},
        {'$group': {'_id': None, 'total': {'$sum': '$points'}}}
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
            'login_reward_points': login_rewards.get('total_claimed', 0) if login_rewards else 0,
            'max_points': 150
        },
        'all_time': {
            'challenge_points': all_time[0]['total'] if all_time else 0
        },
        'streak_days': user.get('streak_days', 0) if user else 0,
        'current_points': user.get('points', 0) if user else 0
    }
