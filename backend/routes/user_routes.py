from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorClient
from auth.dependencies import get_current_user_id
from datetime import datetime
from pathlib import Path
import os
import uuid

router = APIRouter(prefix='/users', tags=['Users'])

MEDIA_AVATARS_DIR = (Path(__file__).resolve().parent.parent / "static" / "media" / "avatars")
MEDIA_AVATARS_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_AVATAR_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
MAX_AVATAR_MB = 8

def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

@router.get('/profile', response_model=dict)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """
    Get user profile with full details
    """
    db = get_db()
    # Support both 'id' and 'user_id' fields for backward compatibility
    user = await db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )
    
    # Get user id - support both 'id' and 'user_id' fields
    uid = user.get('id') or user.get('user_id')
    
    return {
        'user': {
            'id': uid,
            'email': user['email'],
            'name': user['name'],
            'avatar': user.get('avatar') or user.get('picture'),
            'points': user.get('points', 0),
            'total_earned': user.get('total_earned', 0),
            'watched_ads': user.get('watched_ads', []),
            'joined_date': user['created_at'].isoformat() if user.get('created_at') else None
        }
    }

@router.put('/profile', response_model=dict)
async def update_profile(
    data: dict,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update user profile
    تقييد: تغيير الصورة الشخصية مرة واحدة أسبوعياً فقط
    """
    db = get_db()
    # Support both 'id' and 'user_id' fields for backward compatibility
    user = await db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='المستخدم غير موجود'
        )
    
    update_data = {}
    
    if 'name' in data:
        update_data['name'] = data['name']
    
    if 'avatar' in data:
        # التحقق من تقييد تغيير الصورة (مرة أسبوعياً)
        last_avatar_change = user.get('last_avatar_change')
        if last_avatar_change:
            from datetime import timedelta
            if isinstance(last_avatar_change, str):
                last_avatar_change = datetime.fromisoformat(last_avatar_change)
            
            days_since_change = (datetime.utcnow() - last_avatar_change).days
            if days_since_change < 7:
                remaining_days = 7 - days_since_change
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f'يمكنك تغيير الصورة الشخصية مرة واحدة أسبوعياً. تبقى {remaining_days} يوم.'
                )
        
        update_data['avatar'] = data['avatar']
        update_data['last_avatar_change'] = datetime.utcnow()
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='No data to update'
        )
    
    update_data['updated_at'] = datetime.utcnow()
    
    # Update using the correct field (id or user_id)
    query = {'id': user_id} if user.get('id') else {'user_id': user_id}
    await db.users.update_one(query, {'$set': update_data})
    
    user = await db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
    
    # Get user id - support both 'id' and 'user_id' fields
    uid = user.get('id') or user.get('user_id')
    
    return {
        'success': True,
        'user': {
            'id': uid,
            'email': user['email'],
            'name': user['name'],
            'avatar': user.get('avatar') or user.get('picture'),
            'points': user.get('points', 0),
            'total_earned': user.get('total_earned', 0)
        }
    }


@router.get('/analytics', response_model=dict)
async def get_user_analytics(user_id: str = Depends(get_current_user_id)):
    """
    Get user analytics for homepage
    """
    db = get_db()
    user = await db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
    
    if not user:
        return {
            'today_watches': 0,
            'total_watches': 0,
            'total_points': 0,
            'streak_days': 0
        }
    
    # Count today's watches
    from datetime import timedelta
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    watched_ads = user.get('watched_ads', [])
    
    today_watches = 0
    for wa in watched_ads:
        watched_at = wa.get('watched_at')
        if watched_at and watched_at >= today_start:
            today_watches += 1
    
    return {
        'today_watches': today_watches,
        'total_watches': len(watched_ads),
        'total_points': user.get('total_earned', 0),
        'current_points': user.get('points', 0),
        'streak_days': user.get('streak_days', 0)
    }


@router.post('/upload-avatar')
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    """Upload a profile picture from device gallery and persist its public URL on the user document."""
    if not user_id:
        raise HTTPException(status_code=400, detail='user_id required')
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail='Empty file')
    size_mb = len(raw) / (1024 * 1024)
    if size_mb > MAX_AVATAR_MB:
        raise HTTPException(status_code=413, detail=f'Avatar too large (>{MAX_AVATAR_MB}MB)')
    suffix = Path(file.filename or '').suffix.lower() or '.jpg'
    if suffix not in ALLOWED_AVATAR_EXTS:
        suffix = '.jpg'
    filename = f"{uuid.uuid4()}{suffix}"
    target = MEDIA_AVATARS_DIR / filename
    target.write_bytes(raw)
    avatar_url = f"/media/avatars/{filename}"

    db = get_db()
    await db.users.update_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'$set': {'avatar': avatar_url, 'avatar_updated_at': datetime.utcnow().isoformat()}},
    )
    return {'success': True, 'avatar_url': avatar_url, 'url': avatar_url}
