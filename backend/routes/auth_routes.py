from fastapi import APIRouter, HTTPException, status, Depends, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, field_validator
from models.user import User, UserCreate, UserResponse
from auth.jwt_handler import create_access_token, create_token_pair, refresh_access_token
from auth.dependencies import get_current_user_id
from auth.password_utils import validate_password_strength, get_password_strength_score
from auth.rate_limiter import check_login_allowed, record_login_attempt
from passlib.hash import bcrypt
from datetime import datetime
import os
import uuid
import asyncio

router = APIRouter(prefix='/auth', tags=['Authentication'])

def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

class EmailLogin(BaseModel):
    email: EmailStr
    password: str

class EmailRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        is_valid, errors = validate_password_strength(v)
        if not is_valid:
            raise ValueError(errors[0])
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('الاسم يجب أن يكون حرفين على الأقل')
        if len(v) > 50:
            raise ValueError('الاسم طويل جداً')
        return v.strip()

class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post('/signin', response_model=dict)
async def signin(credentials: EmailLogin, request: Request):
    """
    Unified sign in - checks both admins and users
    مع حماية من هجمات Brute Force
    """
    db = get_db()
    
    # الحصول على معلومات الطلب
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent', '')
    
    # التحقق من حد المحاولات
    allowed, error_msg, remaining = await check_login_allowed(credentials.email, client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=error_msg
        )
    
    # First, check if this is an admin
    admin = await db.admins.find_one({'email': credentials.email}, {'_id': 0})
    
    if admin:
        # Verify admin password
        try:
            password_valid = bcrypt.verify(credentials.password, admin['password_hash'])
        except Exception:
            password_valid = False
        
        if password_valid:
            admin_id = admin.get('id', admin['email'])
            
            # تسجيل محاولة ناجحة
            await record_login_attempt(credentials.email, True, client_ip, user_agent)
            
            # Update last login
            await db.admins.update_one(
                {'email': credentials.email},
                {'$set': {'last_login': datetime.utcnow()}}
            )
            
            # Create tokens
            access_token, refresh_token = create_token_pair(admin_id, is_admin=True)
            
            return {
                'token': access_token,
                'refresh_token': refresh_token,
                'role': 'admin',
                'user': {
                    'id': admin_id,
                    'email': admin['email'],
                    'name': admin.get('name', 'Admin'),
                    'role': admin.get('role', 'admin')
                }
            }
    
    # Not admin, check regular users
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    
    if user:
        # Check password
        try:
            password_valid = user.get('password_hash') and bcrypt.verify(credentials.password, user['password_hash'])
        except Exception:
            password_valid = False
        
        if password_valid:
            # التحقق من حالة الحساب
            user_status = user.get('status', 'active')
            if user_status == 'banned':
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail='تم إيقاف حسابك. تواصل مع الدعم الفني'
                )
            
            # تسجيل محاولة ناجحة
            await record_login_attempt(credentials.email, True, client_ip, user_agent)
            
            # Handle both 'id' and 'user_id' fields for backward compatibility
            user_id = user.get('id') or user.get('user_id')
            access_token, refresh_token = create_token_pair(user_id)
            
            created_at = user.get('created_at')
            if isinstance(created_at, datetime):
                joined_date = created_at.isoformat()
            else:
                joined_date = str(created_at) if created_at else datetime.utcnow().isoformat()
            
            return {
                'token': access_token,
                'refresh_token': refresh_token,
                'role': 'user',
                'user': {
                    'id': user_id,
                    'email': user['email'],
                    'name': user['name'],
                    'avatar': user.get('avatar'),
                    'points': user.get('points', 0),
                    'total_earned': user.get('total_earned', 0),
                    'joined_date': joined_date
                }
            }
    
    # تسجيل محاولة فاشلة
    await record_login_attempt(credentials.email, False, client_ip, user_agent)
    
    # No user found or wrong password
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='البريد الإلكتروني أو كلمة المرور غير صحيحة'
    )


@router.post('/register', response_model=dict)
async def register_email(data: EmailRegister, request: Request):
    """
    Register new user with email/password
    مع التحقق من قوة كلمة المرور
    """
    db = get_db()
    
    # التحقق من قوة كلمة المرور
    is_valid, errors = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=errors[0]
        )
    
    # Check if email already exists
    existing = await db.users.find_one({'email': data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='البريد الإلكتروني مسجل بالفعل'
        )
    
    # Check if admin with this email exists
    admin_exists = await db.admins.find_one({'email': data.email})
    if admin_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='البريد الإلكتروني مسجل بالفعل'
        )
    
    # Hash password
    password_hash = bcrypt.hash(data.password)
    
    # Create user
    user_id = str(uuid.uuid4())
    
    # الحصول على معلومات الطلب
    client_ip = request.client.host if request.client else None
    
    user_doc = {
        'id': user_id,
        'email': data.email,
        'name': data.name,
        'password_hash': password_hash,
        'provider': 'email',
        'provider_id': data.email,
        'avatar': f"https://ui-avatars.com/api/?name={data.name}&background=6366f1&color=fff",
        'points': 0,
        'saqr_points': 0,
        'diamonds': 300,  # 300 ألماسة ترحيبية
        'total_earned': 0,
        'watched_ads': [],
        'status': 'active',
        'economy_initialized': True,
        'diamond_transactions': [{
            'id': str(uuid.uuid4()),
            'type': 'welcome_bonus',
            'amount': 300,
            'created_at': datetime.utcnow().isoformat()
        }],
        'registration_ip': client_ip,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Send welcome email (fire and forget - don't block registration)
    async def send_welcome():
        try:
            from services.email_service import send_welcome_email, get_email_settings
            settings = await get_email_settings()
            if settings and settings.get('email_enabled') and settings.get('send_welcome_email'):
                await send_welcome_email(data.email, data.name, 'ar')
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
    
    asyncio.create_task(send_welcome())
    
    # Create tokens
    access_token, refresh_token = create_token_pair(user_id)
    
    return {
        'token': access_token,
        'refresh_token': refresh_token,
        'role': 'user',
        'user': {
            'id': user_id,
            'email': data.email,
            'name': data.name,
            'avatar': user_doc['avatar'],
            'points': 0,
            'saqr_points': 0,
            'diamonds': 300,
            'total_earned': 0,
            'joined_date': user_doc['created_at'].isoformat()
        }
    }


@router.post('/refresh-token', response_model=dict)
async def refresh_token_endpoint(data: RefreshTokenRequest):
    """
    تجديد Access Token باستخدام Refresh Token
    """
    new_access_token = refresh_access_token(data.refresh_token)
    
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Refresh token غير صالح أو منتهي الصلاحية'
        )
    
    return {
        'token': new_access_token,
        'message': 'تم تجديد التوكن بنجاح'
    }


@router.post('/check-password-strength', response_model=dict)
async def check_password_strength(password: str):
    """
    التحقق من قوة كلمة المرور
    """
    is_valid, errors = validate_password_strength(password)
    score = get_password_strength_score(password)
    
    strength = 'ضعيفة'
    if score >= 80:
        strength = 'قوية جداً'
    elif score >= 60:
        strength = 'قوية'
    elif score >= 40:
        strength = 'متوسطة'
    
    return {
        'valid': is_valid,
        'score': score,
        'strength': strength,
        'errors': errors
    }


@router.post('/login', response_model=dict)
async def login(user_data: UserCreate):
    """
    Login or register user (Google/Apple OAuth)
    """
    try:
        db = get_db()
        
        # Check if user exists
        existing_user = await db.users.find_one({
            'provider': user_data.provider,
            'provider_id': user_data.provider_id
        })
        
        if existing_user:
            # Update user data
            await db.users.update_one(
                {'_id': existing_user['_id']},
                {'$set': {
                    'name': user_data.name,
                    'avatar': user_data.avatar,
                    'updated_at': datetime.utcnow()
                }}
            )
            user_id = existing_user['id']
        else:
            # Create new user
            new_user = User(**user_data.dict())
            user_dict = new_user.dict()
            await db.users.insert_one(user_dict)
            user_id = new_user.id
        
        # Create JWT token
        token = create_access_token(user_id)
        
        # Get user data
        user = await db.users.find_one({'id': user_id})
        
        return {
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'avatar': user.get('avatar'),
                'points': user['points'],
                'total_earned': user['total_earned'],
                'joined_date': user['created_at'].isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Login failed: {str(e)}'
        )


@router.get('/me', response_model=dict)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """
    Get current user profile
    """
    db = get_db()
    user = await db.users.find_one({'id': user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )
    
    return {
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'avatar': user.get('avatar'),
            'points': user['points'],
            'total_earned': user['total_earned'],
            'watched_ads': user.get('watched_ads', []),
            'joined_date': user['created_at'].isoformat()
        }
    }


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post('/change-password', response_model=dict)
async def change_password(data: ChangePasswordRequest, user_id: str = Depends(get_current_user_id)):
    """
    تغيير كلمة المرور للمستخدم المسجل
    """
    db = get_db()
    
    # البحث عن المستخدم - دعم كلا الحقلين id و user_id
    user = await db.users.find_one({
        '$or': [
            {'id': user_id},
            {'user_id': user_id}
        ]
    })
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='المستخدم غير موجود'
        )
    
    # التحقق من كلمة المرور الحالية
    if not user.get('password_hash'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='لا يمكن تغيير كلمة المرور لهذا الحساب'
        )
    
    try:
        password_valid = bcrypt.verify(data.current_password, user['password_hash'])
    except Exception:
        password_valid = False
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='كلمة المرور الحالية غير صحيحة'
        )
    
    # التحقق من قوة كلمة المرور الجديدة
    is_valid, errors = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=errors[0]
        )
    
    # التأكد من أن كلمة المرور الجديدة مختلفة عن الحالية
    try:
        same_password = bcrypt.verify(data.new_password, user['password_hash'])
    except Exception:
        same_password = False
    
    if same_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية'
        )
    
    # تحديث كلمة المرور
    new_password_hash = bcrypt.hash(data.new_password)
    # استخدام الحقل المناسب للتحديث
    update_filter = {'user_id': user_id} if user.get('user_id') else {'id': user_id}
    await db.users.update_one(
        update_filter,
        {
            '$set': {
                'password_hash': new_password_hash,
                'updated_at': datetime.utcnow()
            }
        }
    )
    
    return {'message': 'تم تغيير كلمة المرور بنجاح'}


@router.post('/logout')
async def logout():
    """
    Logout user (client should clear token)
    """
    return {'message': 'تم تسجيل الخروج بنجاح'}



# ==================== Password Reset APIs ====================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str

@router.post('/forgot-password', response_model=dict)
async def forgot_password(data: ForgotPasswordRequest):
    """
    Send password reset link to user's email (No OTP)
    """
    import secrets
    
    db = get_db()
    
    # Find user by email
    user = await db.users.find_one({'email': data.email})
    
    if not user:
        # Don't reveal if email exists or not for security
        return {'message': 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين'}
    
    # Generate secure reset token
    reset_token = secrets.token_urlsafe(32)
    
    # Store token with expiration (1 hour)
    await db.password_resets.update_one(
        {'email': data.email},
        {
            '$set': {
                'email': data.email,
                'reset_token': reset_token,
                'created_at': datetime.utcnow(),
                'expires_at': datetime.utcnow().replace(second=0, microsecond=0) + __import__('datetime').timedelta(hours=1),
                'used': False
            }
        },
        upsert=True
    )
    
    # Build reset URL
    frontend_url = "https://saqr-ui-sync.preview.emergentagent.com"
    reset_url = f"{frontend_url}/forgot-password?token={reset_token}"
    
    # Send email with reset link
    try:
        from services.email_service import send_email
        await send_email(
            to_email=data.email,
            subject='إعادة تعيين كلمة المرور - صقر',
            html_content=f'''
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
                <h2 style="color: #3b82f6;">إعادة تعيين كلمة المرور</h2>
                <p>مرحباً،</p>
                <p>لإعادة تعيين كلمة المرور، اضغط على الزر أدناه:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                        إعادة تعيين كلمة المرور
                    </a>
                </div>
                <p>أو انسخ هذا الرابط:</p>
                <p style="background: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all;">{reset_url}</p>
                <p style="color: #ef4444;">هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
                <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.</p>
                <p style="color: #6b7280; margin-top: 30px;">فريق صقر</p>
            </div>
            '''
        )
    except Exception as e:
        print(f"Failed to send reset email: {e}")
        # Continue anyway - token is stored
    
    return {'message': 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني'}

@router.post('/verify-reset-otp', response_model=dict)
async def verify_reset_otp(data: VerifyResetOTPRequest):
    """
    Verify the OTP and return a reset token
    """
    db = get_db()
    
    # Find valid OTP
    reset_record = await db.password_resets.find_one({
        'email': data.email,
        'otp': data.otp,
        'used': False
    })
    
    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='رمز التحقق غير صحيح'
        )
    
    # Check if expired
    if reset_record.get('expires_at') and reset_record['expires_at'] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='انتهت صلاحية رمز التحقق'
        )
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    
    # Update record with reset token
    await db.password_resets.update_one(
        {'email': data.email, 'otp': data.otp},
        {
            '$set': {
                'reset_token': reset_token,
                'token_expires_at': datetime.utcnow().replace(second=0, microsecond=0) + __import__('datetime').timedelta(minutes=30)
            }
        }
    )
    
    return {'reset_token': reset_token, 'message': 'تم التحقق بنجاح'}

@router.post('/reset-password', response_model=dict)
async def reset_password(data: ResetPasswordRequest):
    """
    Reset user's password using the reset token (No OTP)
    """
    db = get_db()
    
    # Verify reset token
    reset_record = await db.password_resets.find_one({
        'reset_token': data.reset_token,
        'used': False
    })
    
    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='رابط إعادة التعيين غير صالح'
        )
    
    # Check if token expired
    if reset_record.get('expires_at') and reset_record['expires_at'] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='انتهت صلاحية رابط إعادة التعيين'
        )
    
    email = reset_record['email']
    
    # Validate new password
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        )
    
    # Hash new password
    new_password_hash = bcrypt.hash(data.new_password)
    
    # Update user's password
    result = await db.users.update_one(
        {'email': email},
        {
            '$set': {
                'password_hash': new_password_hash,
                'updated_at': datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='المستخدم غير موجود'
        )
    
    # Mark reset record as used
    await db.password_resets.update_one(
        {'reset_token': data.reset_token},
        {'$set': {'used': True}}
    )
    
    return {'message': 'تم تغيير كلمة المرور بنجاح'}
