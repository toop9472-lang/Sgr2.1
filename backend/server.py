from fastapi import FastAPI, APIRouter, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import PlainTextResponse, HTMLResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone

# Load .env BEFORE importing route modules so they pick up env vars
# (e.g. R2 storage credentials read at import time).
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Import routes
from routes.oauth_routes import router as oauth_router
from routes.auth_routes import router as auth_router
from routes.ad_routes import router as ad_router
from routes.withdrawal_routes import router as withdrawal_router
from routes.user_routes import router as user_router
from routes.advertiser_routes import router as advertiser_router
from routes.admin_auth_routes import router as admin_auth_router
from routes.admin_dashboard_routes import router as admin_dashboard_router
from routes.payment_routes import router as payment_router
from routes.tap_routes import router as tap_router
from routes.tabby_routes import router as tabby_router
from routes.tamara_routes import router as tamara_router
from routes.notification_routes import router as notification_router
from routes.invoice_routes import router as invoice_router
from routes.analytics_routes import router as analytics_router
from routes.withdrawal_methods_routes import router as withdrawal_methods_router
from routes.activity_routes import router as activity_router
from routes.payment_gateways_routes import router as payment_gateways_router
from routes.settings_routes import router as settings_router
from routes.wallet_routes import router as wallet_router
from routes.admin_users_routes import router as admin_users_router
from routes.email_routes import router as email_router
from routes.rewarded_ads_routes import router as rewarded_ads_router
from routes.points_settings_routes import router as points_settings_router
from routes.reports_routes import router as reports_router
from routes.claude_ai_routes import router as claude_ai_router
from routes.dev_requests_routes import router as dev_requests_router
from routes.security_routes import router as security_router
from routes.unity_ads_routes import router as unity_ads_router
from routes.support_routes import router as support_router
from routes.two_factor_routes import router as two_factor_router
from routes.comments_routes import router as comments_router
from routes.moderation_routes import router as moderation_router
from routes.premium_features_routes import (
    stories_router,
    hashtags_router,
    creator_fund_router,
    push_router,
    share_router,
)
from routes.challenges_routes import router as challenges_router
from routes.phone_auth_routes import router as phone_auth_router
from routes.games_routes import router as games_router
from routes.websocket_routes import router as websocket_router
from routes.support_form_routes import router as support_form_router
from routes.diamonds_routes import router as diamonds_router
from routes.economy_routes import router as economy_router
from routes.stripe_routes import router as stripe_router
from routes.social_routes import router as social_router
from routes.invitations_routes import router as invitations_router
from routes.leaderboards_routes import router as leaderboards_router
from routes.iap_routes import router as iap_router
from routes.gifts_routes import router as gifts_router
from routes.admin_iap_upload_routes import router as admin_iap_upload_router
from routes.cache_routes import router as cache_router
from routes.referrals_routes import router as referrals_router
from routes.clips_routes import router as clips_router
from routes import games_routes

# طير — bird marketplace routes
from routes.listings_routes import router as tair_listings_router
from routes.trips_routes import router as tair_trips_router
from routes.orders_routes import router as tair_orders_router
from routes.ratings_routes import router as tair_ratings_router
from routes.tair_reports_routes import router as tair_reports_router
from routes.species_routes import router as tair_species_router
from routes.forum_routes import router as tair_forum_router
from routes.chat_routes import router as tair_chat_router
from routes.tair_notifications_routes import router as tair_notifs_router
from routes.kyc_routes import router as tair_kyc_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()
MEDIA_DIR = ROOT_DIR / "static" / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
(MEDIA_DIR / "clips").mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

# App-ads.txt for Google AdMob verification (must be at root, not under /api)
@app.get("/app-ads.txt", response_class=PlainTextResponse)
async def app_ads_txt():
    """Google AdMob app-ads.txt verification file"""
    return "google.com, pub-5132559433385403, DIRECT, f08c47fec0942fa0"

@app.get("/volcano-fizer.svg")
async def volcano_fizer_svg():
    """Static key art for the Volcano Fizer game."""
    return FileResponse(
        ROOT_DIR / "static" / "volcano-fizer.svg",
        media_type="image/svg+xml",
        filename="volcano-fizer.svg",
    )

@app.get("/support", response_class=HTMLResponse)
async def support_page():
    """Public support page for App Store metadata."""
    return """
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>دعم صقر | Saqr Support</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif; background: #0b1020; color: #e2e8f0; }
    .wrap { max-width: 760px; margin: 0 auto; padding: 24px 16px 42px; }
    .card { background: #121a31; border: 1px solid #223055; border-radius: 16px; padding: 18px; margin-bottom: 14px; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    p { margin: 6px 0; line-height: 1.65; }
    .muted { color: #94a3b8; font-size: 13px; }
    .row { display: grid; gap: 10px; margin-top: 12px; }
    label { font-size: 13px; color: #cbd5e1; }
    input, textarea {
      width: 100%; border-radius: 10px; border: 1px solid #334a7d; background: #0f172a;
      color: #f8fafc; padding: 12px; font-size: 14px; outline: none;
    }
    textarea { min-height: 120px; resize: vertical; }
    button {
      border: 0; border-radius: 10px; padding: 11px 16px; cursor: pointer;
      background: linear-gradient(90deg, #3b82f6, #2563eb); color: #fff; font-weight: 700;
    }
    .ok { color: #22c55e; font-size: 13px; margin-top: 8px; }
    .err { color: #ef4444; font-size: 13px; margin-top: 8px; }
    a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>الدعم الفني - تطبيق صقر</h1>
      <p>إذا واجهت أي مشكلة في الحساب، الألعاب، أو المدفوعات، يمكنك التواصل معنا مباشرة عبر النموذج التالي.</p>
      <p class="muted">If you need support, please submit the form below and our team will review your request.</p>
      <p>البريد: <a href="mailto:sky-321@hotmail.com">sky-321@hotmail.com</a></p>
    </div>

    <div class="card">
      <form id="support-form">
        <div class="row">
          <label for="name">الاسم</label>
          <input id="name" name="name" required maxlength="80" />
        </div>
        <div class="row">
          <label for="email">البريد الإلكتروني</label>
          <input id="email" name="email" type="email" required maxlength="150" />
        </div>
        <div class="row">
          <label for="subject">الموضوع</label>
          <input id="subject" name="subject" required maxlength="180" />
        </div>
        <div class="row">
          <label for="message">الرسالة</label>
          <textarea id="message" name="message" required maxlength="3000"></textarea>
        </div>
        <div class="row" style="margin-top:14px;">
          <button type="submit">إرسال طلب الدعم</button>
        </div>
        <div id="status"></div>
      </form>
    </div>
  </div>

  <script>
    const form = document.getElementById('support-form');
    const statusEl = document.getElementById('status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      statusEl.className = 'muted';
      statusEl.textContent = 'جارٍ الإرسال...';

      const payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        subject: form.subject.value.trim(),
        message: form.message.value.trim(),
      };

      try {
        const res = await fetch('/api/support/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          statusEl.className = 'ok';
          statusEl.textContent = data.message || 'تم إرسال طلب الدعم بنجاح.';
          form.reset();
        } else {
          statusEl.className = 'err';
          statusEl.textContent = data.detail || data.message || 'تعذر إرسال الطلب حالياً.';
        }
      } catch (_) {
        statusEl.className = 'err';
        statusEl.textContent = 'خطأ اتصال. حاول مرة أخرى.';
      }
    });
  </script>
</body>
</html>
"""


@app.get("/privacy", response_class=HTMLResponse)
async def privacy_page():
    """Public privacy page for in-app links and App Store metadata."""
    return """
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>سياسة الخصوصية | صقر</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif; background: #0b1020; color: #e2e8f0; line-height: 1.75; }
    .wrap { max-width: 860px; margin: 0 auto; padding: 24px 16px 40px; }
    .card { background: #121a31; border: 1px solid #223055; border-radius: 16px; padding: 18px; margin-bottom: 14px; }
    h1,h2 { margin: 0 0 8px; }
    .muted { color: #94a3b8; font-size: 13px; }
    a { color: #60a5fa; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>سياسة الخصوصية - تطبيق صقر</h1>
      <p class="muted">آخر تحديث: 2026-03-09</p>
      <p>نحترم خصوصيتك. يوضح هذا المستند ما نجمعه من بيانات وكيف نستخدمها داخل التطبيق.</p>
    </div>
    <div class="card">
      <h2>1) البيانات التي نجمعها</h2>
      <p>بيانات الحساب (الاسم، البريد)، بيانات الاستخدام داخل التطبيق (التقدم، الرصيد، النتائج)، وسجلات الدعم الفني عند إرسال طلب دعم.</p>
    </div>
    <div class="card">
      <h2>2) الغرض من استخدام البيانات</h2>
      <p>تشغيل الحساب، مزامنة الرصيد، تشغيل الألعاب واللوحات، منع الغش، وتحسين جودة الخدمة.</p>
    </div>
    <div class="card">
      <h2>3) الإعلانات وATT</h2>
      <p>في iOS نستخدم إذن App Tracking Transparency قبل أي استخدام قد يتعلق بالتتبع الإعلاني. يمكنك إدارة الإذن من داخل التطبيق عبر: حسابي ← إذن تتبع الإعلانات (ATT).</p>
    </div>
    <div class="card">
      <h2>4) حذف الحساب</h2>
      <p>يمكنك حذف الحساب نهائياً من داخل التطبيق عبر: حسابي ← حذف الحساب نهائياً.</p>
    </div>
    <div class="card">
      <h2>5) التواصل</h2>
      <p>للاستفسارات: <a href="mailto:sky-321@hotmail.com">sky-321@hotmail.com</a></p>
    </div>
    <div class="card">
      <h2>6) مصادر الألعاب الخارجية</h2>
      <p>تم حذف أي مصدر ألعاب خارجي كان يعرض جدار موافقة طرف ثالث (مثل رسالة الموافقة على معالجة البيانات). النسخة الحالية لا تتضمن هذا النوع من مصادر الألعاب.</p>
    </div>
  </div>
</body>
</html>
"""


@app.get("/terms", response_class=HTMLResponse)
async def terms_page():
    """Public terms page for in-app links and App Store metadata."""
    return """
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>شروط الاستخدام | صقر</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif; background: #0b1020; color: #e2e8f0; line-height: 1.75; }
    .wrap { max-width: 860px; margin: 0 auto; padding: 24px 16px 40px; }
    .card { background: #121a31; border: 1px solid #223055; border-radius: 16px; padding: 18px; margin-bottom: 14px; }
    h1,h2 { margin: 0 0 8px; }
    .muted { color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>شروط الاستخدام - تطبيق صقر</h1>
      <p class="muted">آخر تحديث: 2026-03-09</p>
      <p>باستخدامك للتطبيق فأنت توافق على هذه الشروط.</p>
    </div>
    <div class="card">
      <h2>1) الاستخدام المقبول</h2>
      <p>يمنع إساءة الاستخدام، الغش، أو أي سلوك يضر بالمجتمع أو الخوادم.</p>
    </div>
    <div class="card">
      <h2>2) الحسابات</h2>
      <p>المستخدم مسؤول عن بيانات تسجيل الدخول الخاصة به. يحق لنا تقييد الحسابات المخالفة.</p>
    </div>
    <div class="card">
      <h2>3) المشتريات الرقمية</h2>
      <p>في iOS تتم المشتريات الرقمية عبر In-App Purchase وفق سياسات App Store.</p>
    </div>
    <div class="card">
      <h2>4) الدعم</h2>
      <p>للدعم الفني استخدم صفحة الدعم داخل التطبيق أو عبر الرابط الرسمي /support.</p>
    </div>
  </div>
</body>
</html>
"""

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# CORS Configuration - Read from environment or allow all for flexibility
_cors_env = os.environ.get("CORS_ORIGINS", "")
if _cors_env == "*" or not _cors_env:
    # Allow all origins when CORS_ORIGINS is "*" or not set
    ALLOWED_ORIGINS = ["*"]
else:
    ALLOWED_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept"],
    expose_headers=["Authorization"],
    max_age=600,
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Saqr API - Welcome to the Advertising Platform"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint for deployment verification"""
    try:
        # Test database connection
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0",
        "service": "saqr-api"
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include feature routers
api_router.include_router(oauth_router)
api_router.include_router(auth_router)
api_router.include_router(ad_router)
api_router.include_router(withdrawal_router)
api_router.include_router(user_router)
api_router.include_router(advertiser_router)
api_router.include_router(admin_auth_router)
api_router.include_router(admin_dashboard_router)
api_router.include_router(payment_router)
api_router.include_router(tap_router)
api_router.include_router(tabby_router)
api_router.include_router(tamara_router)
api_router.include_router(notification_router)
api_router.include_router(invoice_router)
api_router.include_router(analytics_router)
api_router.include_router(withdrawal_methods_router)
api_router.include_router(activity_router)
api_router.include_router(payment_gateways_router)
api_router.include_router(settings_router)
api_router.include_router(wallet_router)
api_router.include_router(admin_users_router)
api_router.include_router(email_router)
api_router.include_router(rewarded_ads_router)
api_router.include_router(points_settings_router)
api_router.include_router(reports_router)
api_router.include_router(claude_ai_router)
api_router.include_router(dev_requests_router)
api_router.include_router(security_router)
api_router.include_router(unity_ads_router)
api_router.include_router(support_router)
api_router.include_router(two_factor_router)
api_router.include_router(comments_router)
api_router.include_router(moderation_router)
api_router.include_router(stories_router)
api_router.include_router(hashtags_router)
api_router.include_router(creator_fund_router)
api_router.include_router(push_router)
api_router.include_router(share_router)
api_router.include_router(challenges_router)
api_router.include_router(phone_auth_router)
api_router.include_router(games_router)
api_router.include_router(support_form_router)
api_router.include_router(diamonds_router)
api_router.include_router(economy_router)
api_router.include_router(gifts_router)
api_router.include_router(admin_iap_upload_router)
api_router.include_router(stripe_router)
api_router.include_router(social_router)
api_router.include_router(invitations_router)
api_router.include_router(leaderboards_router)
api_router.include_router(iap_router)
api_router.include_router(cache_router)
api_router.include_router(referrals_router)
api_router.include_router(clips_router)

# طير — bird marketplace routers
api_router.include_router(tair_listings_router)
api_router.include_router(tair_trips_router)
api_router.include_router(tair_orders_router)
api_router.include_router(tair_ratings_router)
api_router.include_router(tair_reports_router)
api_router.include_router(tair_species_router)
api_router.include_router(tair_forum_router)
api_router.include_router(tair_chat_router)
api_router.include_router(tair_notifs_router)
api_router.include_router(tair_kyc_router)

# Include WebSocket router (at app level, not api_router)
app.include_router(websocket_router)

# Include the router in the main app
app.include_router(api_router)

# ROOT LEVEL health check endpoint for Kubernetes liveness/readiness probes
@app.get("/health")
async def root_health_check():
    """Root-level health check endpoint for Kubernetes deployment"""
    try:
        # Test database connection
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0",
        "service": "saqr-api"
    }

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Set database for games routes
games_routes.set_database(db)


@app.on_event("startup")
async def cleanup_dummy_ads_on_startup():
    """Remove dummy/sample ads that were previously seeded. Runs once per start."""
    try:
        dummy_advertisers = ["Samsung", "Amazon", "Gourmet Restaurant"]
        result1 = await db.ads.delete_many({"advertiser": {"$in": dummy_advertisers}})
        result2 = await db.ads.delete_many(
            {"video_url": {"$regex": "commondatastorage.googleapis.com"}}
        )
        total = result1.deleted_count + result2.deleted_count
        if total > 0:
            logger.info(f"Cleaned up {total} dummy ads on startup")
    except Exception as e:
        logger.warning(f"cleanup_dummy_ads_on_startup failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()