# Phone Verification Routes - مسارات التحقق عبر الجوال
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, field_validator
from motor.motor_asyncio import AsyncIOMotorClient
from services.sms_service import send_otp, verify_otp, format_phone_number, is_phone_verified
from auth.jwt_handler import create_token_pair
from auth.password_utils import validate_password_strength
from passlib.hash import bcrypt
from datetime import datetime, timedelta
import os
import uuid
import re

router = APIRouter(prefix='/phone', tags=['Phone Authentication'])

def get_db():
    """Get database connection"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ.get('DB_NAME', 'saqr_db')]

def validate_saudi_phone(phone: str) -> bool:
    """Validate Saudi phone number"""
    # Remove formatting
    phone = phone.replace(' ', '').replace('-', '')
    
    # Check various formats
    patterns = [
        r'^05\d{8}$',           # 05xxxxxxxx
        r'^\+9665\d{8}$',       # +9665xxxxxxxx
        r'^9665\d{8}$',         # 9665xxxxxxxx
        r'^5\d{8}$',            # 5xxxxxxxx
    ]
    
    return any(re.match(p, phone) for p in patterns)

class SendOTPRequest(BaseModel):
    phone: str
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if not validate_saudi_phone(v):
            raise ValueError('رقم الجوال غير صالح. يجب أن يكون رقم سعودي')
        return v

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    
    @field_validator('otp')
    @classmethod
    def validate_otp(cls, v):
        if not v.isdigit() or len(v) != 6:
            raise ValueError('رمز التحقق يجب أن يكون 6 أرقام')
        return v

class RegisterWithPhoneRequest(BaseModel):
    phone: str
    otp: str
    name: str
    password: str
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if not validate_saudi_phone(v):
            raise ValueError('رقم الجوال غير صالح')
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('الاسم يجب أن يكون حرفين على الأقل')
        return v.strip()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        is_valid, errors = validate_password_strength(v)
        if not is_valid:
            raise ValueError(errors[0])
        return v

class LoginWithPhoneRequest(BaseModel):
    phone: str
    password: str

class VerifyLoginOTPRequest(BaseModel):
    phone: str
    otp: str
    session_token: str

class ResetPasswordRequest(BaseModel):
    phone: str
    otp: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        is_valid, errors = validate_password_strength(v)
        if not is_valid:
            raise ValueError(errors[0])
        return v


# ==================== REGISTRATION ====================

@router.post('/send-otp')
async def send_verification_otp(data: SendOTPRequest):
    """
    إرسال رمز التحقق للتسجيل
    """
    db = get_db()
    formatted_phone = format_phone_number(data.phone)
    
    # Check if phone already registered
    existing = await db.users.find_one({'phone': formatted_phone})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='رقم الجوال مسجل بالفعل'
        )
    
    success, message, otp_debug = await send_otp(data.phone, 'verification')
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )
    
    response = {'success': True, 'message': message}
    
    # Include OTP in response for development mode
    if otp_debug:
        response['otp_debug'] = otp_debug
        response['note'] = 'وضع التطوير - الرمز مرفق للاختبار'
    
    return response

@router.post('/verify-otp')
async def verify_registration_otp(data: VerifyOTPRequest):
    """
    التحقق من رمز التسجيل
    """
    success, message = await verify_otp(data.phone, data.otp, 'verification')
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return {'success': True, 'message': message, 'verified': True}

@router.post('/register')
async def register_with_phone(data: RegisterWithPhoneRequest, request: Request):
    """
    التسجيل برقم الجوال بعد التحقق
    """
    db = get_db()
    formatted_phone = format_phone_number(data.phone)
    
    # Verify OTP was validated
    success, message = await verify_otp(data.phone, data.otp, 'verification')
    if not success:
        # Check if already verified recently
        if not await is_phone_verified(data.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='يرجى التحقق من رمز الجوال أولاً'
            )
    
    # Check if phone already exists
    existing = await db.users.find_one({'phone': formatted_phone})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='رقم الجوال مسجل بالفعل'
        )
    
    # Validate password
    is_valid, errors = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=errors[0]
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hash(data.password)
    client_ip = request.client.host if request.client else None
    
    user_doc = {
        'id': user_id,
        'phone': formatted_phone,
        'name': data.name,
        'password_hash': password_hash,
        'provider': 'phone',
        'provider_id': formatted_phone,
        'avatar': f"https://ui-avatars.com/api/?name={data.name}&background=6366f1&color=fff",
        'points': 0,
        'saqr_points': 0,
        'saqr_gems': 0,
        'diamonds': 300,
        'total_earned': 0,
        'watched_ads': [],
        'status': 'active',
        'phone_verified': True,
        'registration_ip': client_ip,
        'diamond_transactions': [{
            'type': 'welcome_bonus',
            'amount': 300,
            'timestamp': datetime.utcnow().isoformat(),
        }],
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create tokens
    access_token, refresh_token = create_token_pair(user_id)
    
    return {
        'success': True,
        'token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user_id,
            'phone': formatted_phone,
            'name': data.name,
            'avatar': user_doc['avatar'],
            'points': 0,
            'saqr_gems': 0,
            'diamonds': 300,
        }
    }


# ==================== LOGIN WITH 2FA ====================

@router.post('/login')
async def login_with_phone(data: LoginWithPhoneRequest):
    """
    تسجيل الدخول برقم الجوال - الخطوة الأولى
    """
    db = get_db()
    formatted_phone = format_phone_number(data.phone)
    
    # Find user by phone
    user = await db.users.find_one({'phone': formatted_phone}, {'_id': 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='رقم الجوال أو كلمة المرور غير صحيحة'
        )
    
    # Verify password
    if not bcrypt.verify(data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='رقم الجوال أو كلمة المرور غير صحيحة'
        )
    
    # Check if account is active
    if user.get('status') == 'suspended':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='الحساب معطل'
        )
    
    # Generate session token for 2FA
    session_token = str(uuid.uuid4())
    
    # Store pending login session
    await db.pending_logins.insert_one({
        'session_token': session_token,
        'user_id': user['id'],
        'phone': formatted_phone,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(minutes=10)
    })
    
    # Send OTP for login
    success, message, otp_debug = await send_otp(data.phone, 'login')
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )
    
    response = {
        'success': True,
        'requires_otp': True,
        'session_token': session_token,
        'message': 'تم إرسال رمز التحقق'
    }
    
    if otp_debug:
        response['otp_debug'] = otp_debug
    
    return response

@router.post('/verify-login')
async def verify_login_otp(data: VerifyLoginOTPRequest):
    """
    التحقق من رمز تسجيل الدخول - الخطوة الثانية
    """
    db = get_db()
    
    # Find pending login session
    session = await db.pending_logins.find_one({
        'session_token': data.session_token,
        'expires_at': {'$gte': datetime.utcnow()}
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='جلسة تسجيل الدخول منتهية. أعد المحاولة'
        )
    
    # Verify OTP
    success, message = await verify_otp(data.phone, data.otp, 'login')
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Delete pending session
    await db.pending_logins.delete_one({'session_token': data.session_token})
    
    # Get user
    user = await db.users.find_one({'id': session['user_id']}, {'_id': 0, 'password_hash': 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='المستخدم غير موجود'
        )
    
    # Update last login
    await db.users.update_one(
        {'id': session['user_id']},
        {'$set': {'last_login': datetime.utcnow()}}
    )
    
    # Create tokens
    access_token, refresh_token = create_token_pair(session['user_id'])
    
    return {
        'success': True,
        'token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user['id'],
            'phone': user.get('phone'),
            'email': user.get('email'),
            'name': user.get('name'),
            'avatar': user.get('avatar'),
            'points': user.get('saqr_points', user.get('points', 0)),
            'saqr_gems': user.get('saqr_gems', user.get('saqr_points', user.get('points', 0))),
            'diamonds': user.get('diamonds', 300),
        }
    }


# ==================== PASSWORD RESET ====================

@router.post('/forgot-password')
async def forgot_password(data: SendOTPRequest):
    """
    طلب استعادة كلمة المرور
    """
    db = get_db()
    formatted_phone = format_phone_number(data.phone)
    
    # Check if user exists
    user = await db.users.find_one({'phone': formatted_phone})
    
    if not user:
        # Don't reveal if phone exists or not
        return {'success': True, 'message': 'إذا كان الرقم مسجلاً، سيتم إرسال رمز التحقق'}
    
    # Send OTP
    success, message, otp_debug = await send_otp(data.phone, 'password_reset')
    
    response = {'success': True, 'message': 'تم إرسال رمز استعادة كلمة المرور'}
    
    if otp_debug:
        response['otp_debug'] = otp_debug
    
    return response

@router.post('/reset-password')
async def reset_password(data: ResetPasswordRequest):
    """
    إعادة تعيين كلمة المرور
    """
    db = get_db()
    formatted_phone = format_phone_number(data.phone)
    
    # Verify OTP
    success, message = await verify_otp(data.phone, data.otp, 'password_reset')
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Validate new password
    is_valid, errors = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=errors[0]
        )
    
    # Find user
    user = await db.users.find_one({'phone': formatted_phone})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='المستخدم غير موجود'
        )
    
    # Update password
    password_hash = bcrypt.hash(data.new_password)
    
    await db.users.update_one(
        {'phone': formatted_phone},
        {'$set': {
            'password_hash': password_hash,
            'updated_at': datetime.utcnow()
        }}
    )
    
    return {'success': True, 'message': 'تم تغيير كلمة المرور بنجاح'}


# ==================== UTILITY ====================

@router.get('/check/{phone}')
async def check_phone(phone: str):
    """
    التحقق من وجود رقم الجوال
    """
    db = get_db()
    formatted_phone = format_phone_number(phone)
    
    user = await db.users.find_one({'phone': formatted_phone})
    
    return {
        'exists': user is not None,
        'can_register': user is None
    }
