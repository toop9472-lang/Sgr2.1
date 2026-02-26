# Saqr Rewards App - PRD

## Original Problem Statement
Build a professional gaming platform app (transformed from ad-watching app) to pass Apple's review, with a complete economy system featuring Saqr Points, Diamonds, and Saqr Gems.

## User's Preferred Language
Arabic (العربية)

---

## CRITICAL: Currency System (نظام العملات)

### عملتان منفصلتان:

1. **جواهر صقر (Saqr Gems)** - للاستبدال بالمال الحقيقي
   - تحصل عليها من: مشاهدة الإعلانات، عجلة الحظ، صناديق الكنز
   - 500 جوهرة = 1 دولار أمريكي
   - لا يمكن إنفاقها داخل التطبيق

2. **الألماس (Diamonds)** - للاستهلاك داخل التطبيق
   - تحصل عليه من: الألعاب، المكافآت، الإعلانات (بونص)
   - يستخدم في: الدردشة (5 ألماسات/رسالة)، المتجر، الألعاب
   - لا يمكن استبداله بمال

---

## LATEST UPDATE (February 2026) - Version 6.1.0

### تحديث 26 فبراير 2026 - النظام الاجتماعي الكامل

#### 1. نظام الأصدقاء (Friends System)
**الملفات:**
- `/app/mobile/src/screens/FriendsScreen.js` - شاشة الأصدقاء
- `/app/mobile/src/screens/PrivateMessagesScreen.js` - شاشة الرسائل الخاصة
- `/app/backend/routes/social_routes.py` - APIs الاجتماعية

**الميزات:**
- البحث عن مستخدمين وإرسال طلبات صداقة
- قبول/رفض طلبات الصداقة
- قائمة الأصدقاء مع معلومات تاريخ الصداقة
- إزالة الأصدقاء

**APIs:**
- `GET /api/social/users/search?query={query}` - البحث عن مستخدمين
- `POST /api/social/friends/request` - إرسال طلب صداقة
- `POST /api/social/friends/accept` - قبول طلب صداقة
- `POST /api/social/friends/reject` - رفض طلب صداقة
- `GET /api/social/friends/list/{user_id}` - قائمة الأصدقاء
- `GET /api/social/friends/requests/{user_id}` - طلبات الصداقة المعلقة
- `DELETE /api/social/friends/remove/{user_id}/{friend_id}` - إزالة صديق

#### 2. الرسائل الخاصة (Private Messages)
**الميزات:**
- إرسال رسائل خاصة للأصدقاء فقط (مجاناً)
- البريد الوارد مع عدد الرسائل غير المقروءة
- محادثات منظمة حسب الصديق

**APIs:**
- `POST /api/social/messages/send` - إرسال رسالة خاصة
- `GET /api/social/messages/conversation/{user_id}/{friend_id}` - جلب المحادثة
- `GET /api/social/messages/inbox/{user_id}` - البريد الوارد

#### 3. دعوات الألعاب والتحديات (Game Invites & Challenges)
**الميزات:**
- دعوة الأصدقاء للألعاب مجاناً
- دعوات عامة في الدردشة (25 ألماسة)
- نظام تحديات مع جوائز مضاعفة للفائز (جواهر صقر)

**APIs:**
- `POST /api/social/game/invite` - إرسال دعوة لعب
- `POST /api/social/game/accept-invite/{invite_id}/{user_id}` - قبول الدعوة
- `POST /api/social/game/complete-challenge` - إتمام التحدي وتوزيع الجوائز

#### 4. نظام البلاغات (Reports System)
**الميزات:**
- الإبلاغ عن مستخدمين أو رسائل مخالفة
- أنواع البلاغات: spam, harassment, inappropriate, other
- تتبع عدد البلاغات على المستخدمين

**APIs:**
- `POST /api/social/report` - تقديم بلاغ
- `GET /api/social/reports/user/{user_id}` - بلاغات المستخدم (للأدمن)

#### 5. إخفاء شريط التنقل (BottomNav)
**التعديل:**
- يتم إخفاء شريط التنقل عند فتح: الألعاب، الدردشة، ثروات صقر، الأصدقاء، الرسائل
- زر رجوع واضح في كل شاشة داخلية

**الملفات المعدلة:**
- `/app/mobile/App.js` - التحكم في إظهار/إخفاء BottomNav
- `/app/mobile/src/screens/GamesScreen.js` - إضافة header مع زر رجوع

---

## PREVIOUS UPDATE (February 2026) - Version 6.0.0

### 1. نظام الدردشة العامة (Global Chat)
**الملفات:**
- `/app/mobile/src/screens/GlobalChatScreen.js` - جديد
- `/app/frontend/src/components/GlobalChatPage.jsx` - جديد
- `/app/backend/routes/economy_routes.py` - تحديث

**الميزات:**
- 3 سيرفرات: عربي، إنجليزي، عالمي (متعدد اللغات)
- تكلفة الرسالة: 5 ألماسات
- عند انتهاء الألماس: "انتهت ألماساتك! تابع الإعلانات واحصل على الألماس"
- Polling للرسائل الجديدة كل 3 ثواني

**APIs:**
- `POST /api/economy/chat/send` - إرسال رسالة
- `GET /api/economy/chat/messages/{server_id}` - جلب الرسائل
- `GET /api/economy/chat/servers` - قائمة السيرفرات
- `GET /api/economy/chat/check-balance/{user_id}` - التحقق من الرصيد

### 2. تحديث نظام ثروات صقر
**التغييرات:**
- الآن يعطي "جواهر صقر" بدلاً من "الألماس"
- إضافة بونص ألماسات عند مشاهدة الإعلانات
- تفريق واضح بين العملتين في الواجهة

**APIs جديدة:**
- `POST /api/economy/add-saqr-gems` - إضافة جواهر صقر
- `GET /api/economy/saqr-gems/{user_id}` - رصيد جواهر صقر

### 3. تحديثات الواجهة
- إضافة زر "الدردشة العامة" في الصفحة الرئيسية (موبايل + ويب)
- تحديث وصف "ثروات صقر" ليوضح أنها للاستبدال بالمال
- شارة "5 ألماسات" على زر الدردشة

---

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
- [x] اصلاح صفحة الدعم
- [x] تحسين تسجيل الدخول الاجتماعي
- [x] **نظام الاصدقاء والرسائل الخاصة**
- [x] **نظام دعوات الالعاب والتحديات**
- [x] **نظام البلاغات**
- [x] **اخفاء شريط التنقل عند فتح الالعاب/الدردشة**
- [x] **استبدال الالماس بجواهر صقر في ثروات صقر**
- [x] **تحسين شريط الرصيد العلوي (جواهر صقر + الماس)**
- [x] **تحسين ايقونة الذكاء الاصطناعي**
- [x] **تحديث شروط الاستخدام والخصوصية**
- [x] **ازالة الايموجي من تطبيق الموبايل**
- [x] **تحديث صفحة الالعاب في الويب لتطابق الموبايل**
- [x] **تحسين لعبة الشطرنج (قطع أكبر، ثيم خشبي أوضح)**
- [x] **عدد أسئلة Trivia = 50 سؤال على الموبايل**
- [ ] **بناء ورفع التطبيق**

### P1 (مهم)
- [ ] اختبار على iPad حقيقي
- [ ] التحقق من Google AdMob الحقيقي
- [ ] دمج اعلانات حقيقية بدل المؤقت الوهمي
- [ ] تحسين أداء الألعاب إذا ظهرت مشاكل بعد الاختبار الحقيقي

### P2 (مستقبلي)
- [ ] اضافة العاب جديدة
- [ ] نظام الانجازات المتقدم

---

## معلومات الاتصال للدعم
- **البريد:** sky-321@hotmail.com
- **واتساب:** +966539999415
- **أوقات العمل:** 24/7
