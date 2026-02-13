# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points. Users watch ads, earn points (1 point per 60 seconds), and can withdraw earnings when they reach 500 points ($1).

## User's Preferred Language
Arabic (العربية)

---

## What's Been Implemented

### Core Features ✅
- [x] Cheat-proof point system (1 point per 60 seconds)
- [x] Ad Viewer with timer
- [x] Guest mode
- [x] Remember Me feature
- [x] Mobile-optimized UI
- [x] Privacy Policy page

### Mobile Builds ✅
- [x] Android build (.aab)
- [x] iOS build (.ipa)
- [x] AdMob configured

### Security Features ✅
- [x] CORS policy with allowlist
- [x] Security headers middleware
- [x] Rate limiting on login
- [x] Password strength validation
- [x] JWT refresh tokens
- [x] Account lockout
- [x] Change password API

### NEW FEATURES (February 13, 2026) ✅

#### 1. Support Tickets System
- [x] POST /api/support/tickets - Create ticket
- [x] GET /api/support/tickets - Get user tickets
- [x] GET /api/support/tickets/{id} - Get ticket details
- [x] POST /api/support/tickets/{id}/reply - Reply to ticket
- [x] POST /api/support/tickets/{id}/close - Close ticket
- [x] SupportTicketsPage.jsx component

#### 2. Two-Factor Authentication (2FA)
- [x] POST /api/2fa/enable - Enable 2FA
- [x] POST /api/2fa/verify - Verify and activate
- [x] POST /api/2fa/disable - Disable 2FA
- [x] POST /api/2fa/send-code - Send login code
- [x] POST /api/2fa/validate - Validate code
- [x] GET /api/2fa/status - Check status
- [x] Backup codes support
- [x] TwoFactorSettings.jsx component

#### 3. Comments System (Social) ✅ FULLY INTEGRATED
- [x] POST /api/comments/ - Create comment
- [x] GET /api/comments/ad/{id} - Get ad comments
- [x] POST /api/comments/like - Like/unlike comment
- [x] DELETE /api/comments/{id} - Delete comment
- [x] Replies support
- [x] CommentsSection.jsx component
- [x] **زر التعليقات في صفحة الإعلانات** (MessageCircle icon)
- [x] **نافذة التعليقات المنبثقة** (Modal)
- [x] **تكامل مع الجوال** (Mobile integration)

#### 4. Dark Mode
- [x] ThemeContext.js with dark/light/system modes
- [x] CSS variables for theming
- [x] Persistent preference in localStorage

#### 5. Multi-Language Support
- [x] Arabic (ar) - RTL
- [x] English (en)
- [x] French (fr)
- [x] Turkish (tr)
- [x] Updated translations.js
- [x] Language selector in settings

#### 6. Settings Page
- [x] SettingsPage.jsx component
- [x] Language selection
- [x] Theme selection
- [x] 2FA settings link
- [x] Notifications settings

### UI/UX Updates (February 13, 2026) ✅
- [x] Slim Bottom Tab Bar
- [x] Professional icons (Lucide/Ionicons)
- [x] Clean toasts without emojis
- [x] Git cleanup completed
- [x] **استبدال إيموجي الصقر 🦅 بالشعار** في شاشة التحميل
- [x] **إزالة جميع الإيموجي من الواجهة** واستبدالها بأيقونات Lucide

---

## App Versions
- **Current Version:** 5.0.0
- **iOS Build Number:** 14
- **Android Version Code:** 35

---

## Technical Architecture

### Frontend (Web)
- React + Tailwind CSS + Shadcn UI
- ThemeContext for dark/light modes
- LanguageContext for i18n

### Backend
- FastAPI (Python) + MongoDB
- New routes: support, 2fa, comments

### Mobile
- React Native + Expo
- Ionicons

---

## New API Endpoints (v5.0.0)

### Support
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/tickets` - List tickets
- `POST /api/support/tickets/{id}/reply` - Reply

### 2FA
- `POST /api/2fa/enable` - Enable
- `POST /api/2fa/verify` - Verify
- `GET /api/2fa/status` - Status

### Comments
- `POST /api/comments/` - Create
- `GET /api/comments/ad/{ad_id}` - List
- `POST /api/comments/like` - Like

---

## Completed Tasks (This Session)

### ✅ إصلاح ميزة التعليقات
- تم إضافة زر التعليقات (MessageCircle) في صفحة الإعلانات
- تم إنشاء نافذة التعليقات المنبثقة
- تم تكامل CommentsSection مع FullScreenAdsViewer

### ✅ استبدال إيموجي الصقر
- تم استبدال 🦅 بـ `/logo_saqr.png` في شاشة التحميل (App.js)
- تم استبدال 🦅 في AuthCallback.jsx
- تم إزالة جميع الإيموجي من HomePage.jsx

### ✅ إصلاح API التعليقات
- تم إصلاح prefix في comments_routes.py (من /api/comments إلى /comments)

### ✅ نظام الإعلانات والباقات (P2)
- تم التحقق من عمل API الباقات: 4 باقات (1000, 2700, 4800, 8400 ريال)
- تم التحقق من صفحة المعلنين تعرض الباقات بشكل صحيح
- تم التحقق من نموذج الإعلان والانتقال لصفحة الدفع
- تم التحقق من صفحة الدفع تعرض خيارات (Stripe, Tap, تحويل بنكي)
- تم تحديث AdvertiserScreen.js للموبايل ليشمل خطوة الدفع مثل الويب

### ✅ إشعارات البريد للمصادقة الثنائية (2FA)
- تم إضافة وظيفة `send_2fa_email()` في `two_factor_routes.py`
- تم إضافة endpoint جديد: `POST /api/2fa/send-login-code`
- قالب بريد إلكتروني احترافي باللغة العربية
- يعتمد على إعدادات Resend في لوحة التحكم

### ✅ لوحة التحليلات (Analytics Dashboard)
- صفحة `AnalyticsPage.jsx` مكتملة
- تعرض: المستخدمين، الإعلانات، المشاهدات، الإيرادات
- رسم بياني للمستخدمين النشطين يومياً (30 يوم)
- قائمة أفضل الإعلانات أداءً

---

## Pending Tasks

### P0 - Critical
- [ ] **Server Always-On:** Upgrade hosting plan (سبب رفض Apple) - يجب إبلاغ المستخدم

### P1 - High Priority  
- [ ] Build new iOS version (v5.0.0, build 14)
- [ ] Submit to Apple App Store
- [ ] Build new Android version
- [ ] Update Android SDK target version

### P2 - Medium Priority
- [x] ~~"Add Personal Ad/Packages" feature~~ ✅ تم التحقق والتأكد من عمله
- [x] ~~Email notifications for 2FA~~ ✅ تم التنفيذ
- [x] ~~Analytics dashboard~~ ✅ موجود ويعمل
- [x] ~~لوحة تحكم المعلن~~ ✅ تم إنشاء `AdvertiserDashboardScreen.js`
- [x] ~~شاشة الدعم الفني~~ ✅ تم إنشاء `SupportScreen.js`
- [x] ~~README.md~~ ✅ تم كتابة توثيق كامل

### P3 - Future
- [x] ~~Update iOS SDK to v26~~ (يتم عند البناء)
- [x] ~~Terms of Use page~~ ✅ تم إنشاء `/terms`
- [x] ~~تنظيف الملفات المؤقتة~~ ✅ تم حذف mobile_backup

---

## Recent Updates (February 13, 2026 - Session 3)

### ✅ توثيق المشروع (README.md)
- تم كتابة توثيق كامل للمشروع باللغة العربية
- يشمل: هيكل المشروع، الميزات، التقنيات، API endpoints، إعدادات البيئة

### ✅ لوحة تحكم المعلن (AdvertiserDashboardScreen)
- شاشة جديدة في `/app/mobile/src/screens/AdvertiserDashboardScreen.js`
- تسجيل دخول بالبريد الإلكتروني
- عرض إحصائيات شاملة: إجمالي الإعلانات، المشاهدات، المشاهدين الفريدين، نسبة الإكمال
- قائمة بجميع إعلانات المعلن مع حالة كل إعلان
- زر لإنشاء إعلان جديد

### ✅ شاشة الدعم الفني (SupportScreen)
- شاشة جديدة في `/app/mobile/src/screens/SupportScreen.js`
- إنشاء تذاكر دعم جديدة (4 فئات: عام، تقني، مدفوعات، الحساب)
- عرض قائمة التذاكر مع حالتها
- عرض تفاصيل التذكرة والمحادثة
- الرد على التذاكر وإغلاقها

### ✅ تنظيف المشروع
- حذف مجلد `/app/mobile_backup`
- تحديث `ProfileScreen.js` بروابط الشاشات الجديدة

### ✅ تحسينات إضافية (Session 3 - Part 2)
- **تنظيف الأكواد والملفات:**
  - حذف مجلد `contexts` المكرر في frontend و mobile
  - حذف ملفات `__pycache__` في backend
  - تنظيف `.gitignore` من التكرار
  - توحيد استيرادات ThemeContext
  
- **تحديث اللغات:**
  - تقليص اللغات من 4 إلى 2 (العربية والإنجليزية فقط)
  - تحديث `LanguageContext.js`
  - تحديث `SettingsPage.jsx`
  - تحديث `SettingsScreen.js` (موبايل)
  - حذف الترجمات الفرنسية والتركية من `translations.js`

- **تحسين واجهة تسجيل الدخول:**
  - تغيير زر "تجربة التطبيق بدون حساب" إلى رابط "دخول كزائر" بنص أبيض صغير
  - تطبيق نفس التغيير في الويب والموبايل

- **إصلاح URLs في الموبايل:**
  - توحيد جميع API_URL لتستخدم domain الإنتاج `saqrpointscom.store`
  - إزالة URLs المؤقتة (preview URLs)

---

## Recent Updates (February 13, 2026 - Session 2)

### ✅ تفعيل الوضع الداكن (Dark Mode)
- تم إضافة `ThemeProvider` في `App.js`
- تم إضافة صفحة الإعدادات `SettingsPage` في المسار
- يدعم 3 أوضاع: داكن، فاتح، حسب النظام

### ✅ تفعيل دعم اللغات
- يدعم 6 لغات: العربية، الإنجليزية، الفرنسية، التركية، الأوردو، الهندية
- يمكن التبديل من قائمة منسدلة في صفحة تسجيل الدخول والصفحة الرئيسية
- جميع الصفحات تتغير لغتها عند تغيير اللغة
- دعم RTL للعربية والأوردو

### ✅ صفحة شروط الاستخدام (Terms of Service)
- تم إنشاء `/app/frontend/src/pages/TermsOfService.jsx`
- مسارات: `/terms` و `/terms-of-service`
- تدعم اللغتين العربية والإنجليزية
- تم ربطها في صفحة تسجيل الدخول وصفحة الحساب

### ✅ إزالة بيانات الاعتماد من Git
- تم حذف `CREDENTIALS.md` نهائياً من سجل Git باستخدام `git filter-branch`
- تم تنظيف `reflog` و `gc`

### ✅ تحديثات الموبايل (Mobile Updates)
- **SettingsScreen.js** - صفحة إعدادات جديدة تدعم:
  - تغيير اللغة (العربية/الإنجليزية)
  - تغيير المظهر (داكن/فاتح/نظام)
  - التحقق بخطوتين
  - الإشعارات
- **ProfileScreen.js** - إضافة روابط:
  - الإعدادات
  - شروط الاستخدام
- **AuthScreen.js** - إضافة رابط شروط الاستخدام
- **App.js** - دمج صفحة الإعدادات

---

## Files Created/Modified

### New Files
- `/app/backend/routes/support_routes.py`
- `/app/backend/routes/two_factor_routes.py`
- `/app/backend/routes/comments_routes.py`
- `/app/frontend/src/context/ThemeContext.js`
- `/app/frontend/src/components/SupportTicketsPage.jsx`
- `/app/frontend/src/components/TwoFactorSettings.jsx`
- `/app/frontend/src/components/CommentsSection.jsx`
- `/app/frontend/src/components/SettingsPage.jsx`
- `/app/backend/tests/test_comments_api.py`

### Modified Files (This Session)
- `/app/frontend/src/App.js` - استبدال إيموجي بالشعار
- `/app/frontend/src/components/FullScreenAdsViewer.jsx` - إضافة زر التعليقات
- `/app/frontend/src/components/HomePage.jsx` - إزالة الإيموجي
- `/app/frontend/src/components/AdViewer.jsx` - إزالة الإيموجي
- `/app/frontend/src/components/AuthCallback.jsx` - استبدال إيموجي
- `/app/backend/routes/comments_routes.py` - إصلاح prefix
- `/app/mobile/src/screens/AdViewerScreen.js` - إضافة التعليقات للجوال
- `/app/mobile/src/services/api.js` - إضافة comments API

---

## Credentials
- **Test User:** demo@saqr.app / Demo123456
- **Guest Mode:** Click "تجربة التطبيق بدون حساب"

---

## Testing Status (February 13, 2026)
- ✅ Backend APIs: 100% (37+ tests passed)
- ✅ Frontend Components: 100% verified
- ✅ Comments Feature: Working
- ✅ Logo Replacement: Working
- ✅ Advertiser/Packages System: Working
- ✅ Payment Options (Stripe/Tap/Bank): Working
- ✅ Web-Mobile Consistency: Verified
- ✅ 2FA Email Notifications: Working
- ✅ Analytics Dashboard: Working
- 📱 Mobile: Ready for build
