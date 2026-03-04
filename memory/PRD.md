# صقر - Saqr App PRD

## حالة التطبيق: ✅ تم إصلاح جميع الأخطاء - جاهز للبناء

---

## الإصلاحات المنجزة (4 مارس 2026)

### 1. مشكلة تسجيل الدخول ✅
- إصلاح مشكلة قراءة الـ response مرتين باستخدام `response.clone()`
- إضافة تتبع مفصل للأخطاء
- تحسين رسائل الخطأ للمستخدم

### 2. مشكلة Apple Sign-In ✅
- إضافة `usesAppleSignIn: true` في app.json
- إضافة `expo-apple-authentication` للـ plugins
- تحسين معالجة خطأ `ERR_REQUEST_UNKNOWN`

### 3. مشكلة الدردشة والألماس ✅
- إصلاح Backend ليرجع `diamonds` في user object عند تسجيل الدخول
- قيمة افتراضية 300 ألماسة للمستخدمين الجدد
- تحسين loadBalance في GlobalChatScreen

### 4. صور المتجر ✅
- توليد صور AI للأفتارات (5 صور):
  - الصقر الذهبي
  - الماسة الزرقاء
  - اللهب الناري
  - التاج الملكي
  - النجم اللامع
- توليد صور AI للإطارات (3 صور):
  - الإطار الذهبي
  - الإطار النيون
  - الإطار الملكي
- توليد صور AI لباقات الألماس (6 صور)

### 5. صور لعبة البازل ✅
- توليد 4 صور AI جديدة:
  - غروب الشمس
  - الجبال
  - القطة
  - الزهور

### 6. نظام الإنجازات ✅
- إعادة كتابة النظام بالكامل ليكون مبني على:
  - مشاهدة الإعلانات (ads_watched)
  - مشاركة التطبيق (app_shares)
  - الإحالات الناجحة (successful_referrals)
- 12 إنجاز جديد

### 7. الإعدادات ✅
- إضافة زر تسجيل الخروج
- تحسين ErrorBoundary مع زر "إعادة المحاولة"

### 8. شاشة الإعلانات ✅
- إصلاح موضع الـ navContainer لتظهر بشكل صحيح على الأجهزة الحديثة
- زيادة bottom من 40 إلى 60
- إضافة paddingBottom لـ iOS

### 9. تحديث الحزم ✅
- تصحيح 6 حزم للتوافق مع Expo SDK 53

---

## الملفات المعدلة

### Mobile
- `/app/mobile/App.js` - ErrorBoundary, handlers
- `/app/mobile/app.json` - Apple Sign-In config
- `/app/mobile/src/screens/AuthScreen.js` - login flow
- `/app/mobile/src/screens/ShopScreen.js` - AI images
- `/app/mobile/src/screens/GamesScreen.js` - puzzle images
- `/app/mobile/src/screens/GlobalChatScreen.js` - balance loading
- `/app/mobile/src/screens/AdViewerScreen.js` - UI fix
- `/app/mobile/src/screens/AchievementsScreen.js` - new stats
- `/app/mobile/src/screens/SettingsScreen.js` - logout button
- `/app/mobile/src/services/api.js` - response cloning
- `/app/mobile/src/services/authProviders.js` - error handling
- `/app/mobile/src/services/AchievementsContext.js` - new achievements

### Backend
- `/app/backend/routes/auth_routes.py` - return diamonds in user object

---

## المهام القادمة

### P0 - عند طلب المستخدم
- بناء نسخة جديدة: `eas build --platform all`
- رفع للمتاجر: `eas submit`

### P1 - أولوية عالية
- إصلاح مشاكل iPad (crashes, UI glitches)
- الحصول على Google Client IDs

### P2 - أولوية متوسطة
- توليد المزيد من صور AI للعناصر المتبقية
- البحث عن ألعاب طرف ثالث احترافية

---

## بيانات الاختبار
- Email: `demo@saqr.app`
- Password: `Demo123456`

---

## الإصدار الحالي
- Version: 7.2.4
- Build: 76

## آخر تحديث
4 مارس 2026
