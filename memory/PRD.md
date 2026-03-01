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
   - **500 جوهرة = 1 ريال سعودي** ✅ (تم التحديث)
   - لا يمكن إنفاقها داخل التطبيق

2. **الألماس (Diamonds)** - للاستهلاك داخل التطبيق
   - تحصل عليه من: الألعاب، المكافآت، الإعلانات (بونص)
   - يستخدم في: الدردشة (5 ألماسات/رسالة)، المتجر، الألعاب
   - لا يمكن استبداله بمال

---

## LATEST UPDATE (March 2026) - Version 7.1.0

### تحديث 1 مارس 2026 - إضافة 6 ألعاب جديدة للويب

#### الألعاب الجديدة المضافة للويب:
1. **لعبة الذاكرة (Memory Game)** - `/frontend/src/components/games/MemoryGame.jsx`
   - شبكة 4×4 من البطاقات
   - نظام combo للإجابات المتتالية
   - مؤقت ونقاط

2. **لعبة الثعبان (Snake Game)** - `/frontend/src/components/games/SnakeGame.jsx`
   - تحكم بالأسهم
   - سرعة متزايدة
   - إيقاف مؤقت

3. **تكسير الطوب (Brick Breaker)** - `/frontend/src/components/games/BrickBreakerGame.jsx`
   - 5 صفوف من الطوب الملون
   - 3 حياة
   - تحكم بالماوس

4. **تبديل الألوان (Color Switch)** - `/frontend/src/components/games/ColorSwitchGame.jsx`
   - أسئلة عن لون النص أو اسم اللون
   - مؤقت 30 ثانية
   - نظام streak

5. **AI Quest** - `/frontend/src/components/games/AIQuestGame.jsx`
   - 15 سؤال عن الذكاء الاصطناعي باللغة العربية
   - مؤقت 15 ثانية لكل سؤال
   - بونص للإجابات المتتالية

6. **الألغاز (Riddles)** - `/frontend/src/components/games/RiddlesGame.jsx`
   - 15 لغز عربي
   - نظام تلميحات (يكلف 2 ألماس)
   - 10 ألغاز لكل جولة

#### تم تحديث الملفات:
- `frontend/src/components/games/index.js` - إضافة exports للألعاب الجديدة
- `frontend/src/components/GamesPage.jsx` - إضافة imports و switch cases

#### حالة الاختبار:
- ✅ جميع الألعاب تم اختبارها ونجحت (100%)
- ✅ تسجيل الدخول يعمل
- ✅ التنقل لصفحة الألعاب يعمل
- ✅ data-testid attributes موجودة لكل لعبة

---

## PREVIOUS UPDATE (March 2026) - Version 7.0.0

### تحديث 1 مارس 2026 - نظام الدعوات والإنجازات الكامل

#### 1. نظام الدعوات (Invitations System):
**ملف جديد:** `/app/backend/routes/invitations_routes.py`

**أنواع الدعوات:**
- **دعوة لعبة (game)**: 10 نقاط للمرسل، 15 نقطة للقابل
- **دعوة دردشة (chat)**: 5 نقاط للمرسل، 10 نقاط للقابل
- **دعوة تحدي (challenge)**: الفائز يحصل على الرهان كاملاً

**API Endpoints:**
- `POST /api/invitations/create` - إنشاء دعوة جديدة
- `POST /api/invitations/accept` - قبول دعوة بالكود
- `GET /api/invitations/my-invitations` - عرض دعواتي

#### 2. نظام التحديات مع مكافآت مضاعفة (1v1 Challenges):
**API Endpoints:**
- `POST /api/invitations/challenges/create` - إنشاء تحدي
- `POST /api/invitations/challenges/respond` - قبول/رفض تحدي
- `POST /api/invitations/challenges/complete` - إنهاء التحدي وإعطاء الجائزة

**آلية العمل:**
1. اللاعب 1 يرسل تحدي مع رهان (مثلاً 50 ألماسة)
2. اللاعب 2 يقبل ← يتم خصم الرهان من كليهما
3. يلعبون اللعبة
4. الفائز يحصل على الرهان × 2 (100 ألماسة)

#### 3. نظام الإنجازات الشامل (Achievements System):
**18 إنجاز في 4 مستويات:**

**برونزي (Bronze):**
- البداية: العب لعبتك الأولى (20 نقطة + 10 ألماس)
- أول فوز: اربح لعبتك الأولى (30 نقطة + 15 ألماس)
- الصداقة: أضف أول صديق (25 نقطة + 10 ألماس)
- المتحدث: أرسل أول رسالة (15 نقطة + 5 ألماس)

**فضي (Silver):**
- اللاعب: العب 10 ألعاب (50 نقطة + 25 ألماس)
- الفائز: اربح 5 ألعاب (75 نقطة + 30 ألماس)
- الاجتماعي: أضف 5 أصدقاء (50 نقطة + 20 ألماس)
- الداعي: 3 دعوات مقبولة (60 نقطة + 25 ألماس)
- المثابر: 7 أيام متتالية (100 نقطة + 50 ألماس)
- الثرثار: 50 رسالة (40 نقطة + 20 ألماس)

**ذهبي (Gold):**
- اللاعب المحترف: العب 50 لعبة (150 نقطة + 75 ألماس)
- البطل: اربح 25 لعبة (200 نقطة + 100 ألماس)
- المشهور: أضف 20 صديق (150 نقطة + 75 ألماس)
- الوفي: 30 يوم متتالي (300 نقطة + 150 ألماس)
- المتحدي: اربح 10 تحديات (200 نقطة + 100 ألماس)

**أسطوري (Legend):**
- أسطورة الألعاب: العب 200 لعبة (500 نقطة + 250 ألماس)
- الأسطورة: اربح 100 لعبة (1000 نقطة + 500 ألماس)
- الملك: 100 يوم متتالي (1000 نقطة + 500 ألماس)

**API Endpoints:**
- `GET /api/invitations/achievements` - عرض جميع الإنجازات
- `POST /api/invitations/achievements/claim/{id}` - استلام مكافأة إنجاز
- `GET /api/invitations/achievements/stats` - إحصائيات الإنجازات

#### 4. تحسين إيموجي صقر:
- تم تكبير حجم الإيموجي في الدردشة (48x48 بدلاً من 28x28)
- تم تكبير حجم الإيموجي في لوحة الاختيار (56x56)

---

## PREVIOUS UPDATE (March 2026) - Version 6.6.0

### تحديث 1 مارس 2026 - تحسين شامل للدردشة والإيموجي + متطلبات المتاجر

#### 1. إيموجي صقر الخاصة بالتطبيق:
تم إنشاء 8 إيموجي مميزة خاصة بالتطبيق من شخصية صقر:
- **أعجبني (thumbsup)**: صقر يرفع إبهامه
- **حب (love)**: صقر بعيون قلوب
- **ضحك (laugh)**: صقر يضحك بدموع الفرح
- **حزين (sad)**: صقر حزين يبكي
- **كول (cool)**: صقر بنظارات شمسية
- **واو (wow)**: صقر متفاجئ
- **تفكير (think)**: صقر يفكر
- **فوز (win)**: صقر فائز بكأس

#### 2. تحسين صفحة الدردشة العامة (GlobalChatScreen):
- إضافة خلفية AI احترافية
- لوحة إيموجي صقر متحركة
- تحويل أكواد الإيموجي إلى صور داخل الرسائل
- عداد المتصلين في الوقت الفعلي
- تصميم فقاعات رسائل محسّن مع gradients
- أنيميشن ظهور الرسائل بشكل سلس
- مؤشرات قراءة الرسائل

#### 3. ملفات الإيموجي المشتركة:
**ملفات جديدة:**
- `/app/mobile/src/constants/saqrEmojis.js`
- `/app/frontend/src/constants/saqrEmojis.js`

#### 4. التطبيق على الويب:
- نفس التحسينات مطبقة على `GlobalChatPage.jsx`
- CSS animations مخصصة للتفاعلات
- دعم كامل لإيموجي صقر

---

### تحديث متطلبات Apple App Store و Google Play (2026)

#### متطلبات Apple:
**ITMS-90725: iOS SDK Version Issue**
- المشكلة: يجب البناء بـ iOS 26 SDK (Xcode 26) بدءاً من 28 أبريل 2026
- الحل: تحديث Xcode إلى الإصدار 26 على Mac
- تم إضافة: `privacyManifests` في `app.json`
- تم إنشاء: `/app/mobile/ios/PrivacyInfo.xcprivacy`

#### متطلبات Google Play:
**1. Android 15 (SDK 35) Target** ✅
```json
"compileSdkVersion": 35,
"targetSdkVersion": 35
```

**2. Edge-to-Edge Display** ✅
- تم إضافة plugin `react-native-edge-to-edge`
- تم تكوين `parentTheme: "EdgeToEdge"`

**3. Deprecated APIs Fix** ✅
- تم التعامل مع APIs المتوقفة عبر `react-native-edge-to-edge`

**4. Screen Orientation Restrictions** ✅
- تم تغيير `orientation` من `portrait` إلى `default`
- تم إضافة دعم جميع الاتجاهات لـ iPad

#### الملفات المحدثة:
- `/app/mobile/app.json` - الإصدار 6.0.0
- `/app/mobile/ios/PrivacyInfo.xcprivacy` - Privacy Manifest جديد
- `/app/mobile/STORE_REQUIREMENTS_2026.md` - دليل شامل

#### ملاحظات مهمة:
- **لـ iOS 26 SDK**: يجب استخدام Xcode 26 على Mac (غير متوفر في هذه البيئة)
- **للاختبار**: استخدم `eas build --platform ios --profile preview`

---

## PREVIOUS UPDATE (March 2026) - Version 6.5.0

### تحديث 1 مارس 2026 - تحسين الألعاب الاحترافي

#### 1. خلفيات AI جديدة لجميع الألعاب:
تم توليد رسومات احترافية بالذكاء الاصطناعي لكل لعبة:
- **الشطرنج (ChessGame):** خلفية ملكية بألوان أزرق داكن وذهبي
- **تكسير الطوب (BrickBreakerGame):** خلفية أركيد نيون مع تأثيرات فضائية
- **الثعبان (SnakeGame):** خلفية غابة رقمية مع تأثيرات متوهجة
- **الذاكرة (MemoryGame):** خلفية سحرية بنفسجية كونية
- **تبديل الألوان (ColorSwitchGame):** خلفية ألوان قوس قزح متدفقة
- **سباق الكلمات (WordRaceGame):** خلفية خط عربي أنيق
- **سباق الرياضيات (MathRaceGame):** خلفية أرقام ومعادلات رقمية
- **AI Quest:** خلفية شبكة عصبية مستقبلية

#### 2. دمج الأصوات والاهتزازات:
**الملف:** `/app/mobile/src/utils/gameSounds.js`
- أصوات للنقر والنجاح والفشل
- اهتزازات متنوعة (خفيفة، متوسطة، ثقيلة)
- أصوات خاصة بكل لعبة (شطرنج، ثعبان، ذاكرة، إلخ)

#### 3. الملفات المحدثة:
- `/app/mobile/src/screens/games/ChessGame.js` - ImageBackground + أصوات
- `/app/mobile/src/screens/games/BrickBreakerGame.js` - ImageBackground + أصوات
- `/app/mobile/src/screens/games/SnakeGame.js` - ImageBackground + أصوات
- `/app/mobile/src/screens/games/MemoryGame.js` - ImageBackground + أصوات
- `/app/mobile/src/screens/games/ColorSwitchGame.js` - ImageBackground + أصوات
- `/app/mobile/src/screens/games/WordRaceGame.js` - ImageBackground + أصوات
- `/app/mobile/src/screens/games/MathRaceGame.js` - ImageBackground + أصوات
- `/app/mobile/src/screens/games/AIQuestGame.js` - ImageBackground + أصوات

---

## PREVIOUS UPDATE (March 2026) - Version 6.4.0

### تحديث 1 مارس 2026 - إصلاحات الويب والترجمات

#### إصلاحات صفحة تسجيل الدخول على الويب:
**الملفات المعدلة:**
- `/app/frontend/src/components/AuthPage.jsx`

**التحسينات:**
- إزالة Card وجعل الخلفية موحدة (لا يوجد مربع كبير)
- استخدام AUTH_BG_IMAGE كخلفية موحدة مع gradient overlay
- تحسين تصميم أزرار تسجيل الدخول

#### إصلاحات الترجمة:
**الملفات المعدلة:**
- `/app/frontend/src/i18n/translations.js`

**المفاتيح الجديدة:**
- `saqrFortunes` / `saqrFortunesDesc`
- `globalChat` / `globalChatDesc`
- `friends` / `friendsDesc`
- `dailyChallenge` / `dailyChallengeDesc`
- `start`, `new`, `games`

#### دعم الوضع الفاتح (Light Mode):
**الملفات المعدلة:**
- `/app/frontend/src/components/HomePage.jsx`
- `/app/frontend/src/components/GamesPage.jsx`
- `/app/frontend/src/components/ProfilePage.jsx`
- `/app/frontend/src/components/SaqrFortunesPage.jsx`
- `/app/frontend/src/components/FriendsPage.jsx`
- `/app/frontend/src/components/GlobalChatPage.jsx`

**التحسينات:**
- إضافة `useTheme` hook لجميع الصفحات
- إضافة `isDark` متغير لتبديل الألوان بناءً على الثيم
- تحسين الألوان للوضع الفاتح

---

## PREVIOUS UPDATE (March 2026) - Version 6.2.0

### تحديث 1 مارس 2026 - تحسين شاشة تسجيل الدخول (موبايل)

#### تحسينات شاشة AuthScreen:
**الملفات المعدلة:**
- `/app/mobile/src/screens/AuthScreen.js`

**التحسينات:**
- إضافة خلفية احترافية جديدة مولدة بالذكاء الاصطناعي (ImageBackground)
- تأثير توهج على الشعار (logoGlow with shadow)
- تحسين أزرار تسجيل الدخول (Google/Apple) مع ظلال وحواف دائرية أكبر
- تحسين الفواصل والأزرار الثانوية
- ألوان شفافة احترافية للتكامل مع الخلفية

**الصورة الجديدة:**
- `AUTH_BG_IMAGE`: خلفية داكنة فاخرة مع جزيئات ذهبية وأشكال هندسية

---

## PREVIOUS UPDATE (February 2026) - Version 6.1.0

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
- [x] **تحديث العملة من دولار إلى ريال سعودي (500 جوهرة = 1 ريال)** ✅
- [x] **تحسين شاشة تسجيل الدخول مع خلفية احترافية جديدة** ✅ NEW
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
