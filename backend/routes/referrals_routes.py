"""
Referral System Routes
نظام الإحالات والدعوات
"""
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os
import uuid

router = APIRouter(prefix='/referrals', tags=['Referrals'])

def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

# Constants
REFERRER_POINTS = 100
REFEREE_POINTS = 50
REFERRER_DIAMONDS = 10
REFEREE_DIAMONDS = 5

class ApplyReferralRequest(BaseModel):
    code: str
    new_user_id: str

class TrackShareRequest(BaseModel):
    user_id: str


@router.post('/apply')
async def apply_referral_code(request: ApplyReferralRequest):
    """Apply a referral code for new user"""
    db = get_db()
    
    # Find referrer by code
    referrer = await db.users.find_one({
        'referral_code': request.code.upper()
    })
    
    if not referrer:
        raise HTTPException(status_code=404, detail='كود الإحالة غير صالح')
    
    referrer_id = referrer.get('id') or referrer.get('user_id')
    
    # Check if already used
    existing = await db.referrals.find_one({
        'referee_id': request.new_user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail='تم استخدام كود إحالة مسبقاً')
    
    # Record referral
    referral_doc = {
        'id': str(uuid.uuid4()),
        'referrer_id': referrer_id,
        'referee_id': request.new_user_id,
        'code': request.code.upper(),
        'status': 'completed',
        'created_at': datetime.now(timezone.utc)
    }
    await db.referrals.insert_one(referral_doc)
    
    # Reward referrer
    await db.users.update_one(
        {'$or': [{'id': referrer_id}, {'user_id': referrer_id}]},
        {
            '$inc': {
                'points': REFERRER_POINTS,
                'diamonds': REFERRER_DIAMONDS,
                'total_referrals': 1
            }
        }
    )
    
    # Reward referee
    await db.users.update_one(
        {'$or': [{'id': request.new_user_id}, {'user_id': request.new_user_id}]},
        {
            '$inc': {
                'points': REFEREE_POINTS,
                'diamonds': REFEREE_DIAMONDS
            },
            '$set': {
                'referred_by': referrer_id
            }
        }
    )
    
    return {
        'success': True,
        'rewards': {
            'points': REFEREE_POINTS,
            'diamonds': REFEREE_DIAMONDS
        },
        'message': f'تم تطبيق كود الإحالة! حصلت على {REFEREE_POINTS} نقطة و {REFEREE_DIAMONDS} ماسات'
    }


@router.get('/stats')
async def get_referral_stats(user_id: str):
    """Get referral statistics for user"""
    db = get_db()
    
    # Count referrals
    total = await db.referrals.count_documents({'referrer_id': user_id})
    pending = await db.referrals.count_documents({
        'referrer_id': user_id,
        'status': 'pending'
    })
    
    # Calculate earnings
    completed = await db.referrals.count_documents({
        'referrer_id': user_id,
        'status': 'completed'
    })
    
    earned_points = completed * REFERRER_POINTS
    earned_diamonds = completed * REFERRER_DIAMONDS
    
    # Get referral code
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'referral_code': 1}
    )
    
    # Generate code if not exists
    if not user or not user.get('referral_code'):
        code = f"{user_id[-4:].upper()}{str(uuid.uuid4())[:4].upper()}"
        await db.users.update_one(
            {'$or': [{'id': user_id}, {'user_id': user_id}]},
            {'$set': {'referral_code': code}}
        )
    else:
        code = user.get('referral_code')
    
    return {
        'totalReferrals': total,
        'pendingReferrals': pending,
        'completedReferrals': completed,
        'earnedPoints': earned_points,
        'earnedDiamonds': earned_diamonds,
        'referralCode': code,
        'referralLink': f'https://saqr.app/invite/{code}'
    }


@router.get('/list')
async def get_referrals_list(user_id: str):
    """Get list of user's referrals"""
    db = get_db()
    
    referrals = await db.referrals.find(
        {'referrer_id': user_id},
        {'_id': 0}
    ).sort('created_at', -1).limit(50).to_list(50)
    
    # Get referee names
    for ref in referrals:
        referee = await db.users.find_one(
            {'$or': [{'id': ref['referee_id']}, {'user_id': ref['referee_id']}]},
            {'_id': 0, 'name': 1}
        )
        ref['referee_name'] = referee.get('name', 'مستخدم') if referee else 'مستخدم'
        if ref.get('created_at'):
            ref['created_at'] = ref['created_at'].isoformat() if hasattr(ref['created_at'], 'isoformat') else str(ref['created_at'])
    
    return {'referrals': referrals}


@router.post('/track-share')
async def track_share(request: TrackShareRequest):
    """Track when user shares referral link"""
    db = get_db()
    
    await db.referral_shares.insert_one({
        'user_id': request.user_id,
        'timestamp': datetime.now(timezone.utc)
    })
    
    return {'tracked': True}


# ============ LEADERBOARD ROUTES ============

@router.get('/leaderboard')
async def get_leaderboard(period: str = 'daily', user_id: Optional[str] = None):
    """Get leaderboard for specified period"""
    db = get_db()
    
    # Define time filter
    now = datetime.now(timezone.utc)
    if period == 'daily':
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'weekly':
        from datetime import timedelta
        start_time = now - timedelta(days=7)
    else:
        start_time = None
    
    # Build query
    match_stage = {}
    if start_time:
        match_stage['last_active'] = {'$gte': start_time}
    
    # Get top 100 users
    pipeline = [
        {'$match': match_stage} if match_stage else {'$match': {}},
        {'$sort': {'points': -1}},
        {'$limit': 100},
        {'$project': {
            '_id': 0,
            'user_id': {'$ifNull': ['$id', '$user_id']},
            'name': 1,
            'points': 1,
            'avatar': '$profile_image'
        }}
    ]
    
    results = await db.users.aggregate(pipeline).to_list(100)
    
    # Add ranks
    leaderboard = []
    for i, user in enumerate(results):
        leaderboard.append({
            'rank': i + 1,
            'name': user.get('name', 'مستخدم'),
            'points': user.get('points', 0),
            'avatar': user.get('avatar', '👤')
        })
    
    # Get user rank if provided
    user_rank = None
    if user_id:
        user = await db.users.find_one(
            {'$or': [{'id': user_id}, {'user_id': user_id}]},
            {'_id': 0, 'points': 1}
        )
        if user:
            user_points = user.get('points', 0)
            rank = await db.users.count_documents({
                'points': {'$gt': user_points}
            }) + 1
            user_rank = {
                'rank': rank,
                'points': user_points
            }
    
    return {
        'leaderboard': leaderboard,
        'user_rank': user_rank,
        'period': period
    }
