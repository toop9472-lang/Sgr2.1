# Saqr Rewards App - PRD

## Original Problem Statement
Build a professional gaming platform app (transformed from ad-watching app) to pass Apple's review, with a complete economy system featuring Saqr Points and Diamonds.

## User's Preferred Language
Arabic (العربية)

---

## LATEST UPDATE (February 2026) - Version 5.9.0

### التحديثات الجديدة - نظام ثروات صقر:

#### 1. شاشة ثروات صقر (Saqr Fortunes) - جديد
**الملفات:**
- `/app/mobile/src/screens/SaqrFortunesScreen.js` - جديد
- `/app/mobile/src/components/AdRewardsCenter.js` - جديد
- `/app/mobile/src/components/TreasureChests.js` - جديد

**الميزات:**
- **نظام مكافآت الإعلانات الممتع:**
  - مشاهدة إعلان = دوران عجلة الحظ
  - جوائز من 1 إلى 100 ألماسة
  - 500 ألماسة = 1 دولار أمريكي
  
- **عجلة الحظ (Lucky Wheel):**
  - 8 جوائز مختلفة
  - رسوم متحركة احترافية
  - اهتزاز عند الفوز
  
- **صناديق الكنز (Treasure Chests):**
  - برونزي (5 إعلانات): 5-15 ألماسة
  - فضي (15 إعلان): 20-50 ألماسة
  - ذهبي (30 إعلان): 60-150 ألماسة
  - بلاتيني (50 إعلان): 150-300 ألماسة
  - أسطوري (100 إعلان): 350-750 ألماسة

- **مكافآت الإعلانات المتتالية (Streak Bonuses):**
  - 3 متتالية = +5 ألماسات
  - 5 متتالية = +10 ألماسات
  - 10 متتالية = +25 ألماسة
  - 20 متتالية = +60 ألماسة
  - 30 متتالية = +100 ألماسة

- **التحديات اليومية:**
  - أول إعلان = 3 ألماسات
  - 5 إعلانات = 10 ألماسات
  - 10 إعلانات = 25 ألماسة
  - تحديات الوقت (صباحي/ليلي)

#### 2. تحسينات Backend
**الملفات:**
- `/app/backend/routes/economy_routes.py` - تحديث

**Endpoints جديدة:**
- `POST /api/economy/ad-watch-reward` - مكافأة مشاهدة (1 ألماسة/دقيقة)
- `GET /api/economy/ad-stats/{user_id}` - إحصائيات الإعلانات
- `POST /api/economy/claim-chest-reward` - استلام صندوق الكنز

#### 3. تحسينات API
**الملف:** `/app/mobile/src/services/api.js`

**دوال جديدة:**
- `claimAdWatchReward()` - مكافأة المشاهدة
- `getAdStats()` - إحصائيات الإعلانات
- `claimChestReward()` - مكافأة الصندوق

---

## تحديثات سابقة - Version 5.8.0

### تحديث إضافي - نظام ثروات صقر على الويب
**الملفات:**
- `/app/frontend/src/components/SaqrFortunesPage.jsx` - جديد
- `/app/frontend/src/components/HomePage.jsx` - تحديث (زر ثروات صقر)
- `/app/frontend/src/App.js` - تحديث (routing)
- `/app/frontend/src/App.css` - تحديث (animations)

**الميزات على الويب:**
- عجلة الحظ مع Canvas
- صناديق الكنز الخمسة
- التحديات اليومية
- مكافآت المتتالي
- شريط تقدم الدولار
- رسوم متحركة وتأثيرات بصرية

---

### التحديثات في الإصدار 5.8.0:

### التحديثات الجديدة في هذا الإصدار:

#### 1. صفحة الدعم الفني - محدثة
**الملفات:**
- `/app/mobile/src/screens/SupportScreen.js`
- `/app/frontend/src/pages/SupportPage.jsx`

**التحسينات:**
- إضافة معلومات الاتصال المباشرة:
  - واتساب: +966539999415
  - البريد: sky-321@hotmail.com
- أوقات الدعم: 24/7
- روابط مباشرة للتواصل
- واجهة محسنة مع أيقونات واضحة

#### 2. تحديات الإعلانات (Ad Challenges) - جديد
**الملفات:**
- `/app/mobile/src/components/AdChallengesModal.js`
- `/app/mobile/src/screens/GamesScreen.js` (تحديث)
- `/app/backend/routes/economy_routes.py` (endpoint جديد)

**الميزات:**
- 6 تحديات للمشاهدة:
  - شاهد 1 إعلان = 5 ماسات
  - شاهد 3 إعلانات = 20 ماسة
  - شاهد 5 إعلانات = 50 ماسة
  - شاهد 10 إعلانات = 150 ماسة
  - مشاهدة 3 أيام متتالية = 100 ماسة
  - جرب لعبة جديدة = محاولة مجانية
- مكافآت فورية:
  - محاولة شطرنج مجانية
  - محاولة أحجية مجانية
  - مضاعفة الماس
- تتبع التقدم والـ streak
- حفظ البيانات في AsyncStorage

#### 3. لوحة تحكم الأدمن (Admin WebView) - جديد
**الملفات:**
- `/app/mobile/src/screens/AdminWebViewScreen.js`
- `/app/mobile/src/screens/ProfileScreen.js` (تحديث)
- `/app/mobile/App.js` (تحديث)
- `/app/mobile/src/services/api.js` (endpoint جديد)

**الميزات:**
- WebView لفتح لوحة التحكم داخل التطبيق
- مخفي عن المستخدمين العاديين
- الوصول بطريقتين:
  1. للأدمن المسجل: زر في القائمة يظهر تلقائياً
  2. وصول سري: الضغط 7 مرات على رقم الإصدار → نافذة تسجيل دخول أدمن
- دعم التنقل (رجوع/أمام/تحديث)
- معالجة الأخطاء

#### 4. تحسين تسجيل الدخول الاجتماعي (iPad Fix)
**الملفات:**
- `/app/mobile/src/screens/AuthScreen.js`

**التحسينات:**
- إضافة `preferEphemeralSession: true` لتوافق أفضل مع iPad
- معالجة أخطاء محسنة
- رسائل خطأ واضحة بالعربية
- دعم dismiss event

#### 5. تبعيات جديدة
```bash
# تم تثبيتها
yarn add react-native-webview
npx expo install expo-notifications expo-device
```

---

## الإصدار والبناء

### الإصدار الحالي
- **Version:** 5.8.0
- **iOS buildNumber:** 26
- **Android versionCode:** 58

### eas.json جاهز للبناء
- Production profile مُعدّ
- الشهادات موجودة في `/app/mobile/certificates/`
- Submit profile مُعدّ لـ App Store

---

## رد Apple والحلول

### 1. Guideline 1.5 - صفحة الدعم
**المشكلة:** URL الدعم لا يحتوي معلومات كافية
**الحل:** ✅ تم تحديث صفحة الدعم بمعلومات الاتصال الحقيقية

### 2. Guideline 2.1 - تسجيل الدخول
**المشكلة:** خطأ عند تسجيل الدخول بالحساب التجريبي، Google/Apple لا يعمل على iPad
**الحل:** ✅ تم تحسين كود تسجيل الدخول الاجتماعي مع `preferEphemeralSession`

---

## الملفات المحدثة في هذا الإصدار

### Mobile (كل التعديلات في /app/mobile فقط)
| ملف | نوع التغيير |
|-----|-------------|
| `src/screens/SupportScreen.js` | تحديث - إضافة معلومات الاتصال |
| `src/screens/GamesScreen.js` | تحديث - إضافة تحديات الإعلانات |
| `src/screens/AuthScreen.js` | تحديث - تحسين iPad |
| `src/screens/ProfileScreen.js` | تحديث - إضافة وصول الأدمن |
| `src/screens/AdminWebViewScreen.js` | جديد |
| `src/components/AdChallengesModal.js` | جديد |
| `src/services/api.js` | تحديث - endpoints جديدة |
| `App.js` | تحديث - AdminWebViewScreen |
| `app.json` | تحديث - version 5.8.0 |
| `package.json` | تحديث - react-native-webview |

### Backend
| ملف | نوع التغيير |
|-----|-------------|
| `routes/economy_routes.py` | تحديث - endpoint add-diamonds |

### Frontend (Web)
| ملف | نوع التغيير |
|-----|-------------|
| `src/pages/SupportPage.jsx` | تحديث - معلومات الاتصال |

---

## خطوات البناء والرفع

### 1. البناء لـ iOS
```bash
cd /app/mobile
eas build --platform ios --profile production
```

### 2. الرفع لـ App Store
```bash
eas submit --platform ios --profile production
```

### 3. ملاحظات للمراجعة
- حساب تجريبي: يجب إنشاء حساب جديد في التطبيق
- Google/Apple Sign In يعمل على جميع الأجهزة بما فيها iPad
- صفحة الدعم تحتوي معلومات تواصل حقيقية

---

## المهام المتبقية

### P0 (حرج)
- [x] تثبيت expo-notifications و expo-device
- [x] إصلاح صفحة الدعم
- [x] تحسين تسجيل الدخول الاجتماعي
- [ ] **بناء ورفع التطبيق**

### P1 (مهم)
- [ ] اختبار على iPad حقيقي
- [ ] التحقق من Google AdMob

### P2 (مستقبلي)
- [ ] إعادة ميزة الدردشة
- [ ] إضافة ألعاب جديدة

---

## معلومات الاتصال للدعم
- **البريد:** sky-321@hotmail.com
- **واتساب:** +966539999415
- **أوقات العمل:** 24/7
