"""
Invitations & Achievements System - نظام الدعوات والإنجازات
- Invite friends to games and chat
- Double rewards challenge system  
- Comprehensive achievements
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from auth.dependencies import get_current_user_id
import os
import uuid
import random
import string

router = APIRouter(prefix='/invitations', tags=['Invitations & Achievements'])

def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


# ============ MODELS ============

class CreateInvitationRequest(BaseModel):
    type: str  # 'game', 'chat', 'challenge'
    game_id: Optional[str] = None
    server_id: Optional[str] = None
    message: Optional[str] = None

class AcceptInvitationRequest(BaseModel):
    invitation_code: str

class CreateChallengeRequest(BaseModel):
    opponent_id: str
    game_id: str
    bet_amount: int  # Amount of diamonds to bet
    
class AcceptChallengeRequest(BaseModel):
    challenge_id: str
    accept: bool

class ReportChallengeResultRequest(BaseModel):
    challenge_id: str
    winner_id: str


# ============ INVITATION DEFINITIONS ============

INVITATION_TYPES = {
    'game': {
        'reward_sender': 10,      # Points for sender when accepted
        'reward_accepter': 15,    # Points for accepter
        'expires_hours': 24
    },
    'chat': {
        'reward_sender': 5,
        'reward_accepter': 10,
        'expires_hours': 48
    },
    'challenge': {
        'reward_sender': 0,       # No reward, winner gets bet
        'reward_accepter': 0,
        'expires_hours': 1
    }
}


# ============ ACHIEVEMENTS DEFINITIONS ============

ACHIEVEMENTS = [
    # === مستوى المبتدئ ===
    {
        "id": "first_game",
        "title": "البداية",
        "description": "العب لعبتك الأولى",
        "icon": "game-controller",
        "category": "games",
        "target": 1,
        "reward_points": 20,
        "reward_diamonds": 10,
        "tier": "bronze"
    },
    {
        "id": "first_win",
        "title": "أول فوز",
        "description": "اربح لعبتك الأولى",
        "icon": "trophy",
        "category": "games",
        "target": 1,
        "reward_points": 30,
        "reward_diamonds": 15,
        "tier": "bronze"
    },
    {
        "id": "first_friend",
        "title": "الصداقة",
        "description": "أضف أول صديق",
        "icon": "people",
        "category": "social",
        "target": 1,
        "reward_points": 25,
        "reward_diamonds": 10,
        "tier": "bronze"
    },
    {
        "id": "first_chat",
        "title": "المتحدث",
        "description": "أرسل رسالتك الأولى في الدردشة العامة",
        "icon": "chatbubble",
        "category": "social",
        "target": 1,
        "reward_points": 15,
        "reward_diamonds": 5,
        "tier": "bronze"
    },
    
    # === مستوى المتوسط ===
    {
        "id": "games_10",
        "title": "اللاعب",
        "description": "العب 10 ألعاب",
        "icon": "game-controller-outline",
        "category": "games",
        "target": 10,
        "reward_points": 50,
        "reward_diamonds": 25,
        "tier": "silver"
    },
    {
        "id": "wins_5",
        "title": "الفائز",
        "description": "اربح 5 ألعاب",
        "icon": "medal",
        "category": "games",
        "target": 5,
        "reward_points": 75,
        "reward_diamonds": 30,
        "tier": "silver"
    },
    {
        "id": "friends_5",
        "title": "الاجتماعي",
        "description": "أضف 5 أصدقاء",
        "icon": "people-circle",
        "category": "social",
        "target": 5,
        "reward_points": 50,
        "reward_diamonds": 20,
        "tier": "silver"
    },
    {
        "id": "invites_3",
        "title": "الداعي",
        "description": "أرسل 3 دعوات مقبولة",
        "icon": "mail",
        "category": "social",
        "target": 3,
        "reward_points": 60,
        "reward_diamonds": 25,
        "tier": "silver"
    },
    {
        "id": "streak_7",
        "title": "المثابر",
        "description": "سجل دخول لمدة 7 أيام متتالية",
        "icon": "flame",
        "category": "loyalty",
        "target": 7,
        "reward_points": 100,
        "reward_diamonds": 50,
        "tier": "silver"
    },
    {
        "id": "chat_50",
        "title": "الثرثار",
        "description": "أرسل 50 رسالة",
        "icon": "chatbubbles",
        "category": "social",
        "target": 50,
        "reward_points": 40,
        "reward_diamonds": 20,
        "tier": "silver"
    },
    
    # === مستوى المتقدم ===
    {
        "id": "games_50",
        "title": "اللاعب المحترف",
        "description": "العب 50 لعبة",
        "icon": "game-controller",
        "category": "games",
        "target": 50,
        "reward_points": 150,
        "reward_diamonds": 75,
        "tier": "gold"
    },
    {
        "id": "wins_25",
        "title": "البطل",
        "description": "اربح 25 لعبة",
        "icon": "trophy",
        "category": "games",
        "target": 25,
        "reward_points": 200,
        "reward_diamonds": 100,
        "tier": "gold"
    },
    {
        "id": "friends_20",
        "title": "المشهور",
        "description": "أضف 20 صديق",
        "icon": "star",
        "category": "social",
        "target": 20,
        "reward_points": 150,
        "reward_diamonds": 75,
        "tier": "gold"
    },
    {
        "id": "streak_30",
        "title": "الوفي",
        "description": "سجل دخول لمدة 30 يوم متتالي",
        "icon": "calendar",
        "category": "loyalty",
        "target": 30,
        "reward_points": 300,
        "reward_diamonds": 150,
        "tier": "gold"
    },
    {
        "id": "challenges_win_10",
        "title": "المتحدي",
        "description": "اربح 10 تحديات",
        "icon": "flash",
        "category": "games",
        "target": 10,
        "reward_points": 200,
        "reward_diamonds": 100,
        "tier": "gold"
    },
    
    # === مستوى الأسطورة ===
    {
        "id": "games_200",
        "title": "أسطورة الألعاب",
        "description": "العب 200 لعبة",
        "icon": "rocket",
        "category": "games",
        "target": 200,
        "reward_points": 500,
        "reward_diamonds": 250,
        "tier": "legend"
    },
    {
        "id": "wins_100",
        "title": "الأسطورة",
        "description": "اربح 100 لعبة",
        "icon": "diamond",
        "category": "games",
        "target": 100,
        "reward_points": 1000,
        "reward_diamonds": 500,
        "tier": "legend"
    },
    {
        "id": "streak_100",
        "title": "الملك",
        "description": "سجل دخول لمدة 100 يوم متتالي",
        "icon": "crown",
        "category": "loyalty",
        "target": 100,
        "reward_points": 1000,
        "reward_diamonds": 500,
        "tier": "legend"
    }
]


# ============ HELPER FUNCTIONS ============

def generate_invitation_code():
    """Generate unique 6-character invitation code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def get_user_achievement_progress(db, user_id: str, achievement_id: str):
    """Calculate user's progress for a specific achievement"""
    
    if achievement_id == "first_game" or achievement_id == "games_10" or achievement_id == "games_50" or achievement_id == "games_200":
        # Count total games played
        count = await db.game_results.count_documents({'user_id': user_id})
        return count
    
    elif achievement_id == "first_win" or achievement_id == "wins_5" or achievement_id == "wins_25" or achievement_id == "wins_100":
        # Count wins
        count = await db.game_results.count_documents({
            'user_id': user_id,
            'result': 'win'
        })
        return count
    
    elif achievement_id == "first_friend" or achievement_id == "friends_5" or achievement_id == "friends_20":
        # Count friends
        count = await db.friends.count_documents({
            '$or': [{'user_id': user_id}, {'friend_id': user_id}],
            'status': 'accepted'
        })
        return count
    
    elif achievement_id == "first_chat" or achievement_id == "chat_50":
        # Count chat messages
        count = await db.chat_messages.count_documents({'user_id': user_id})
        return count
    
    elif achievement_id == "invites_3":
        # Count accepted invitations sent
        count = await db.invitations.count_documents({
            'sender_id': user_id,
            'status': 'accepted'
        })
        return count
    
    elif achievement_id == "streak_7" or achievement_id == "streak_30" or achievement_id == "streak_100":
        # Get user's current streak
        user = await db.users.find_one(
            {'$or': [{'id': user_id}, {'user_id': user_id}]},
            {'_id': 0, 'streak_days': 1, 'max_streak': 1}
        )
        return max(user.get('streak_days', 0), user.get('max_streak', 0)) if user else 0
    
    elif achievement_id == "challenges_win_10":
        # Count challenge wins
        count = await db.challenges.count_documents({
            'winner_id': user_id,
            'status': 'completed'
        })
        return count
    
    return 0


# ============ INVITATION ROUTES ============

@router.post('/create')
async def create_invitation(
    request: CreateInvitationRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new invitation"""
    db = get_db()
    
    if request.type not in INVITATION_TYPES:
        raise HTTPException(status_code=400, detail='نوع الدعوة غير صالح')
    
    inv_config = INVITATION_TYPES[request.type]
    
    # Generate unique code
    code = generate_invitation_code()
    
    # Check if code already exists (very unlikely)
    while await db.invitations.find_one({'code': code}):
        code = generate_invitation_code()
    
    # Get sender info
    sender = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'name': 1, 'avatar': 1}
    )
    
    invitation = {
        'id': str(uuid.uuid4()),
        'code': code,
        'type': request.type,
        'sender_id': user_id,
        'sender_name': sender.get('name', 'مستخدم') if sender else 'مستخدم',
        'sender_avatar': sender.get('avatar') if sender else None,
        'game_id': request.game_id,
        'server_id': request.server_id,
        'message': request.message,
        'status': 'pending',
        'expires_at': datetime.now(timezone.utc) + timedelta(hours=inv_config['expires_hours']),
        'created_at': datetime.now(timezone.utc)
    }
    
    await db.invitations.insert_one(invitation)
    
    # Create shareable link
    share_link = f"saqr://invite/{code}"
    
    return {
        'success': True,
        'invitation': {
            'id': invitation['id'],
            'code': code,
            'type': request.type,
            'share_link': share_link,
            'expires_in_hours': inv_config['expires_hours']
        },
        'message': f'تم إنشاء الدعوة! الكود: {code}'
    }


@router.post('/accept')
async def accept_invitation(
    request: AcceptInvitationRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Accept an invitation"""
    db = get_db()
    
    # Find invitation
    invitation = await db.invitations.find_one({
        'code': request.invitation_code.upper(),
        'status': 'pending'
    })
    
    if not invitation:
        raise HTTPException(status_code=404, detail='الدعوة غير موجودة أو منتهية الصلاحية')
    
    # Check if expired
    if invitation['expires_at'] < datetime.now(timezone.utc):
        await db.invitations.update_one(
            {'id': invitation['id']},
            {'$set': {'status': 'expired'}}
        )
        raise HTTPException(status_code=400, detail='انتهت صلاحية الدعوة')
    
    # Can't accept own invitation
    if invitation['sender_id'] == user_id:
        raise HTTPException(status_code=400, detail='لا يمكنك قبول دعوتك الخاصة')
    
    inv_config = INVITATION_TYPES[invitation['type']]
    
    # Update invitation status
    await db.invitations.update_one(
        {'id': invitation['id']},
        {
            '$set': {
                'status': 'accepted',
                'accepted_by': user_id,
                'accepted_at': datetime.now(timezone.utc)
            }
        }
    )
    
    # Give rewards to both users
    sender_reward = inv_config['reward_sender']
    accepter_reward = inv_config['reward_accepter']
    
    if sender_reward > 0:
        await db.users.update_one(
            {'$or': [{'id': invitation['sender_id']}, {'user_id': invitation['sender_id']}]},
            {'$inc': {'points': sender_reward, 'total_earned': sender_reward}}
        )
    
    if accepter_reward > 0:
        await db.users.update_one(
            {'$or': [{'id': user_id}, {'user_id': user_id}]},
            {'$inc': {'points': accepter_reward, 'total_earned': accepter_reward}}
        )
    
    # Get updated user points
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'points': 1}
    )
    
    return {
        'success': True,
        'invitation': {
            'type': invitation['type'],
            'game_id': invitation.get('game_id'),
            'server_id': invitation.get('server_id'),
            'sender_name': invitation.get('sender_name')
        },
        'reward': accepter_reward,
        'total_points': user.get('points', 0) if user else 0,
        'message': f'تم قبول الدعوة! حصلت على {accepter_reward} نقطة'
    }


@router.get('/my-invitations')
async def get_my_invitations(user_id: str = Depends(get_current_user_id)):
    """Get user's sent invitations"""
    db = get_db()
    
    invitations = await db.invitations.find(
        {'sender_id': user_id},
        {'_id': 0}
    ).sort('created_at', -1).limit(50).to_list(50)
    
    return {
        'invitations': invitations,
        'total': len(invitations)
    }


# ============ CHALLENGE ROUTES ============

@router.post('/challenges/create')
async def create_challenge(
    request: CreateChallengeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a 1v1 challenge with diamond bet"""
    db = get_db()
    
    # Check user has enough diamonds
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'diamonds': 1, 'name': 1, 'avatar': 1}
    )
    
    if not user or user.get('diamonds', 0) < request.bet_amount:
        raise HTTPException(status_code=400, detail='لا يوجد لديك ألماس كافي')
    
    # Check opponent exists
    opponent = await db.users.find_one(
        {'$or': [{'id': request.opponent_id}, {'user_id': request.opponent_id}]},
        {'_id': 0, 'diamonds': 1, 'name': 1}
    )
    
    if not opponent:
        raise HTTPException(status_code=404, detail='الخصم غير موجود')
    
    if opponent.get('diamonds', 0) < request.bet_amount:
        raise HTTPException(status_code=400, detail='الخصم لا يملك ألماس كافي')
    
    # Create challenge
    challenge = {
        'id': str(uuid.uuid4()),
        'challenger_id': user_id,
        'challenger_name': user.get('name', 'مستخدم'),
        'opponent_id': request.opponent_id,
        'opponent_name': opponent.get('name', 'مستخدم'),
        'game_id': request.game_id,
        'bet_amount': request.bet_amount,
        'total_prize': request.bet_amount * 2,  # Winner takes all
        'status': 'pending',
        'expires_at': datetime.now(timezone.utc) + timedelta(hours=1),
        'created_at': datetime.now(timezone.utc)
    }
    
    await db.challenges.insert_one(challenge)
    
    # Send notification to opponent
    notification = {
        'id': str(uuid.uuid4()),
        'user_id': request.opponent_id,
        'type': 'challenge_invite',
        'title': 'تحدي جديد!',
        'message': f'{user.get("name", "مستخدم")} يتحداك في لعبة! الرهان: {request.bet_amount} ألماسة',
        'data': {'challenge_id': challenge['id']},
        'read': False,
        'created_at': datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notification)
    
    return {
        'success': True,
        'challenge': {
            'id': challenge['id'],
            'game_id': request.game_id,
            'bet_amount': request.bet_amount,
            'total_prize': challenge['total_prize'],
            'opponent_name': opponent.get('name')
        },
        'message': f'تم إرسال التحدي! الجائزة: {challenge["total_prize"]} ألماسة'
    }


@router.post('/challenges/respond')
async def respond_to_challenge(
    request: AcceptChallengeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Accept or decline a challenge"""
    db = get_db()
    
    # Find challenge
    challenge = await db.challenges.find_one({
        'id': request.challenge_id,
        'opponent_id': user_id,
        'status': 'pending'
    })
    
    if not challenge:
        raise HTTPException(status_code=404, detail='التحدي غير موجود')
    
    if challenge['expires_at'] < datetime.now(timezone.utc):
        await db.challenges.update_one(
            {'id': challenge['id']},
            {'$set': {'status': 'expired'}}
        )
        raise HTTPException(status_code=400, detail='انتهت صلاحية التحدي')
    
    if not request.accept:
        # Decline challenge
        await db.challenges.update_one(
            {'id': challenge['id']},
            {'$set': {'status': 'declined', 'declined_at': datetime.now(timezone.utc)}}
        )
        return {'success': True, 'message': 'تم رفض التحدي'}
    
    # Accept challenge - lock diamonds from both players
    bet = challenge['bet_amount']
    
    # Verify both have enough diamonds
    challenger = await db.users.find_one(
        {'$or': [{'id': challenge['challenger_id']}, {'user_id': challenge['challenger_id']}]},
        {'_id': 0, 'diamonds': 1}
    )
    opponent = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'diamonds': 1}
    )
    
    if challenger.get('diamonds', 0) < bet or opponent.get('diamonds', 0) < bet:
        raise HTTPException(status_code=400, detail='أحد اللاعبين لا يملك ألماس كافي')
    
    # Deduct diamonds from both
    await db.users.update_one(
        {'$or': [{'id': challenge['challenger_id']}, {'user_id': challenge['challenger_id']}]},
        {'$inc': {'diamonds': -bet}}
    )
    await db.users.update_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'$inc': {'diamonds': -bet}}
    )
    
    # Update challenge status
    await db.challenges.update_one(
        {'id': challenge['id']},
        {
            '$set': {
                'status': 'active',
                'accepted_at': datetime.now(timezone.utc),
                'game_expires_at': datetime.now(timezone.utc) + timedelta(minutes=30)
            }
        }
    )
    
    return {
        'success': True,
        'challenge': {
            'id': challenge['id'],
            'game_id': challenge['game_id'],
            'total_prize': challenge['total_prize']
        },
        'message': f'تم قبول التحدي! ابدأ اللعبة الآن'
    }


@router.post('/challenges/complete')
async def complete_challenge(
    request: ReportChallengeResultRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Report challenge result and give prize to winner"""
    db = get_db()
    
    # Find active challenge
    challenge = await db.challenges.find_one({
        'id': request.challenge_id,
        'status': 'active'
    })
    
    if not challenge:
        raise HTTPException(status_code=404, detail='التحدي غير موجود أو غير نشط')
    
    # Verify user is part of challenge
    if user_id not in [challenge['challenger_id'], challenge['opponent_id']]:
        raise HTTPException(status_code=403, detail='أنت لست جزءاً من هذا التحدي')
    
    # Verify winner is part of challenge
    if request.winner_id not in [challenge['challenger_id'], challenge['opponent_id']]:
        raise HTTPException(status_code=400, detail='الفائز يجب أن يكون أحد اللاعبين')
    
    # Give prize to winner
    prize = challenge['total_prize']
    await db.users.update_one(
        {'$or': [{'id': request.winner_id}, {'user_id': request.winner_id}]},
        {'$inc': {'diamonds': prize}}
    )
    
    # Update challenge
    loser_id = challenge['challenger_id'] if request.winner_id == challenge['opponent_id'] else challenge['opponent_id']
    
    await db.challenges.update_one(
        {'id': challenge['id']},
        {
            '$set': {
                'status': 'completed',
                'winner_id': request.winner_id,
                'loser_id': loser_id,
                'completed_at': datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        'success': True,
        'winner_id': request.winner_id,
        'prize': prize,
        'message': f'انتهى التحدي! الفائز حصل على {prize} ألماسة'
    }


@router.get('/challenges/my-challenges')
async def get_my_challenges(user_id: str = Depends(get_current_user_id)):
    """Get user's challenges (both sent and received)"""
    db = get_db()
    
    challenges = await db.challenges.find(
        {
            '$or': [
                {'challenger_id': user_id},
                {'opponent_id': user_id}
            ]
        },
        {'_id': 0}
    ).sort('created_at', -1).limit(50).to_list(50)
    
    return {
        'challenges': challenges,
        'total': len(challenges)
    }


# ============ ACHIEVEMENT ROUTES ============

@router.get('/achievements')
async def get_achievements(user_id: str = Depends(get_current_user_id)):
    """Get all achievements with user's progress"""
    db = get_db()
    
    # Get user's claimed achievements
    claimed = await db.achievement_claims.find(
        {'user_id': user_id},
        {'_id': 0, 'achievement_id': 1}
    ).to_list(100)
    claimed_ids = {c['achievement_id'] for c in claimed}
    
    achievements = []
    total_unlocked = 0
    
    for achievement in ACHIEVEMENTS:
        progress = await get_user_achievement_progress(db, user_id, achievement['id'])
        is_completed = progress >= achievement['target']
        is_claimed = achievement['id'] in claimed_ids
        
        if is_completed:
            total_unlocked += 1
        
        achievements.append({
            'id': achievement['id'],
            'title': achievement['title'],
            'description': achievement['description'],
            'icon': achievement['icon'],
            'category': achievement['category'],
            'tier': achievement['tier'],
            'target': achievement['target'],
            'current': min(progress, achievement['target']),
            'reward_points': achievement['reward_points'],
            'reward_diamonds': achievement['reward_diamonds'],
            'completed': is_completed,
            'claimed': is_claimed,
            'can_claim': is_completed and not is_claimed
        })
    
    # Sort by tier and completion status
    tier_order = {'bronze': 0, 'silver': 1, 'gold': 2, 'legend': 3}
    achievements.sort(key=lambda x: (
        x['claimed'],  # Unclaimed first
        not x['can_claim'],  # Claimable first
        tier_order.get(x['tier'], 99)
    ))
    
    return {
        'achievements': achievements,
        'total': len(ACHIEVEMENTS),
        'unlocked': total_unlocked,
        'categories': ['games', 'social', 'loyalty']
    }


@router.post('/achievements/claim/{achievement_id}')
async def claim_achievement(
    achievement_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Claim reward for completed achievement"""
    db = get_db()
    
    # Find achievement
    achievement = next((a for a in ACHIEVEMENTS if a['id'] == achievement_id), None)
    if not achievement:
        raise HTTPException(status_code=404, detail='الإنجاز غير موجود')
    
    # Check if already claimed
    existing = await db.achievement_claims.find_one({
        'user_id': user_id,
        'achievement_id': achievement_id
    })
    if existing:
        raise HTTPException(status_code=400, detail='تم استلام هذا الإنجاز بالفعل')
    
    # Check progress
    progress = await get_user_achievement_progress(db, user_id, achievement_id)
    if progress < achievement['target']:
        raise HTTPException(status_code=400, detail='لم تكمل هذا الإنجاز بعد')
    
    # Record claim
    await db.achievement_claims.insert_one({
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'achievement_id': achievement_id,
        'points': achievement['reward_points'],
        'diamonds': achievement['reward_diamonds'],
        'timestamp': datetime.now(timezone.utc)
    })
    
    # Give rewards
    await db.users.update_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'$inc': {
            'points': achievement['reward_points'],
            'diamonds': achievement['reward_diamonds'],
            'total_earned': achievement['reward_points']
        }}
    )
    
    # Get updated user
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0, 'points': 1, 'diamonds': 1}
    )
    
    return {
        'success': True,
        'achievement': {
            'id': achievement_id,
            'title': achievement['title'],
            'tier': achievement['tier']
        },
        'rewards': {
            'points': achievement['reward_points'],
            'diamonds': achievement['reward_diamonds']
        },
        'total_points': user.get('points', 0),
        'total_diamonds': user.get('diamonds', 0),
        'message': f'أحسنت! حصلت على {achievement["reward_points"]} نقطة و {achievement["reward_diamonds"]} ألماسة'
    }


@router.get('/achievements/stats')
async def get_achievements_stats(user_id: str = Depends(get_current_user_id)):
    """Get user's achievements statistics"""
    db = get_db()
    
    # Get claimed achievements
    claimed = await db.achievement_claims.find(
        {'user_id': user_id},
        {'_id': 0}
    ).to_list(100)
    
    total_points = sum(c.get('points', 0) for c in claimed)
    total_diamonds = sum(c.get('diamonds', 0) for c in claimed)
    
    # Count by tier
    claimed_ids = {c['achievement_id'] for c in claimed}
    tier_counts = {'bronze': 0, 'silver': 0, 'gold': 0, 'legend': 0}
    
    for achievement in ACHIEVEMENTS:
        if achievement['id'] in claimed_ids:
            tier_counts[achievement['tier']] += 1
    
    return {
        'total_achievements': len(ACHIEVEMENTS),
        'claimed_achievements': len(claimed),
        'total_points_earned': total_points,
        'total_diamonds_earned': total_diamonds,
        'by_tier': tier_counts,
        'completion_percentage': round((len(claimed) / len(ACHIEVEMENTS)) * 100, 1)
    }
