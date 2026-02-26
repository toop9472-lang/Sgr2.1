// App Documentation Page - صفحة توثيق التطبيق للمراجعين
import React, { useState } from 'react';

const AppDocumentation = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'نظرة عامة', icon: '📱' },
    { id: 'features', label: 'الميزات', icon: '⭐' },
    { id: 'technical', label: 'التقنيات', icon: '⚙️' },
    { id: 'security', label: 'الأمان', icon: '🔒' },
    { id: 'api', label: 'API', icon: '🔗' },
    { id: 'testing', label: 'الاختبار', icon: '✅' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f] py-12 border-b border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">توثيق تطبيق صقر</h1>
              <p className="text-gray-400">Saqr Rewards App - Technical Documentation</p>
              <div className="flex gap-4 mt-4">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">v5.8.0</span>
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">Production Ready</span>
                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">iOS + Android</span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500">Bundle ID</p>
              <code className="text-blue-400">com.saqr.rewards</code>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-0 bg-[#111118]/95 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="container mx-auto px-6">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeSection === section.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <span className="ml-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">📱</span>
                نظرة عامة على التطبيق
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">الوصف</h3>
                  <p className="text-gray-300 leading-relaxed">
                    صقر هو تطبيق ألعاب ومكافآت تفاعلي يتيح للمستخدمين كسب النقاط والألماسات من خلال لعب مجموعة متنوعة من الألعاب الذهنية والترفيهية. يتميز التطبيق بنظام اقتصادي متكامل يربط بين اللعب والمكافآت الحقيقية.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">الفئة المستهدفة</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      محبي ألعاب الذكاء والتحدي
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      الباحثين عن الترفيه مع المكافآت
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      العمر: 12+ سنة
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      المنطقة: الشرق الأوسط (عربي)
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0f] rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">12+</p>
                  <p className="text-sm text-gray-500">لعبة متاحة</p>
                </div>
                <div className="bg-[#0a0a0f] rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">1000+</p>
                  <p className="text-sm text-gray-500">سؤال ثقافي</p>
                </div>
                <div className="bg-[#0a0a0f] rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-400">24/7</p>
                  <p className="text-sm text-gray-500">دعم متواصل</p>
                </div>
                <div className="bg-[#0a0a0f] rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">100%</p>
                  <p className="text-sm text-gray-500">آمن ومشفر</p>
                </div>
              </div>
            </section>

            {/* App Info Table */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-6">معلومات التطبيق</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="py-3 text-gray-500 w-1/3">اسم التطبيق</td>
                      <td className="py-3 font-medium">صقر - Saqr Rewards</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-500">Bundle Identifier</td>
                      <td className="py-3 font-mono text-blue-400">com.saqr.rewards</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-500">الإصدار الحالي</td>
                      <td className="py-3">5.8.0 (Build 26)</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-500">SDK Version</td>
                      <td className="py-3">Expo SDK 53</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-500">iOS Deployment Target</td>
                      <td className="py-3">iOS 15.1+</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-500">Android Min SDK</td>
                      <td className="py-3">API 24 (Android 7.0)</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-500">اللغة الرئيسية</td>
                      <td className="py-3">العربية (RTL Support)</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-500">حجم التطبيق</td>
                      <td className="py-3">~50 MB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Features Section */}
        {activeSection === 'features' && (
          <div className="space-y-8">
            {/* Games */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">🎮</span>
                الألعاب المتاحة
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'AI Quest', desc: 'مغامرة ذكاء اصطناعي تفاعلية', badge: 'جديد', color: 'pink' },
                  { name: 'الشطرنج', desc: 'لعبة الملوك والاستراتيجية', badge: 'أونلاين', color: 'purple' },
                  { name: 'إكس أو', desc: 'تحدي سريع مع أصدقائك', badge: 'أونلاين', color: 'orange' },
                  { name: 'الذاكرة', desc: 'اختبر قوة ذاكرتك', badge: '', color: 'teal' },
                  { name: 'الثعبان', desc: 'اللعبة الكلاسيكية المحبوبة', badge: 'كلاسيك', color: 'green' },
                  { name: 'أسئلة ثقافية', desc: '1000+ سؤال متنوع', badge: 'شعبي', color: 'emerald' },
                  { name: 'تركيب الصور', desc: 'أحجية صور متنوعة', badge: '', color: 'blue' },
                  { name: 'الألغاز', desc: 'ألغاز ذهنية محفزة', badge: '', color: 'yellow' },
                  { name: 'تكسير الطوب', desc: 'أركيد كلاسيكي', badge: '', color: 'pink' },
                  { name: 'سباق الحساب', desc: 'تحدي رياضي سريع', badge: 'تحدي', color: 'violet' },
                  { name: 'سباق الكلمات', desc: 'اكتشف الكلمات المخفية', badge: '', color: 'cyan' },
                  { name: 'تبديل الألوان', desc: 'سرعة ردة الفعل', badge: '', color: 'rose' },
                ].map((game, idx) => (
                  <div key={idx} className="bg-[#0a0a0f] rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{game.name}</h3>
                      {game.badge && (
                        <span className={`text-xs px-2 py-1 rounded-full bg-${game.color}-500/20 text-${game.color}-400`}>
                          {game.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{game.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Economy System */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">💎</span>
                النظام الاقتصادي
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">نقاط صقر (Saqr Points)</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>تُكتسب من الفوز في الألعاب</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>الحد اليومي: 150 نقطة من الألعاب</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>قابلة للتحويل: 500 نقطة = 1 دولار</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>مكافآت المتصدرين الأسبوعية</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">الألماسات (Diamonds)</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>300 ألماسة ترحيبية مجانية</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>تُستخدم للعب أونلاين</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>قابلة للشراء من المتجر</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>تُكتسب من تحديات الإعلانات</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 bg-[#0a0a0f] rounded-xl p-6">
                <h4 className="font-semibold mb-4">باقات الألماسات</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'البداية', diamonds: 100, price: '$4.99' },
                    { name: 'الفضية', diamonds: 275, price: '$9.99' },
                    { name: 'الذهبية', diamonds: 575, price: '$19.99' },
                    { name: 'البلاتينية', diamonds: 1200, price: '$39.99' },
                  ].map((pkg, idx) => (
                    <div key={idx} className="bg-[#111118] rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-400">{pkg.diamonds}</p>
                      <p className="text-xs text-gray-500">{pkg.name}</p>
                      <p className="text-sm font-medium text-green-400 mt-1">{pkg.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Ad Challenges */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">🎯</span>
                تحديات الإعلانات
              </h2>
              
              <p className="text-gray-400 mb-6">
                نظام مكافآت يتيح للمستخدمين كسب ألماسات مجانية من خلال مشاهدة الإعلانات بشكل اختياري.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'المشاهد المبتدئ', desc: 'شاهد إعلان واحد', reward: '5 ألماسات' },
                  { title: 'المشاهد النشط', desc: 'شاهد 3 إعلانات', reward: '20 ألماسة' },
                  { title: 'المشاهد المتحمس', desc: 'شاهد 5 إعلانات', reward: '50 ألماسة' },
                  { title: 'المشاهد المحترف', desc: 'شاهد 10 إعلانات', reward: '150 ألماسة' },
                  { title: 'المثابر', desc: '3 أيام متتالية', reward: '100 ألماسة' },
                  { title: 'المستكشف', desc: 'جرب لعبة جديدة', reward: 'محاولة مجانية' },
                ].map((challenge, idx) => (
                  <div key={idx} className="bg-[#0a0a0f] rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{challenge.title}</h4>
                      <p className="text-sm text-gray-500">{challenge.desc}</p>
                    </div>
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                      {challenge.reward}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Shop */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">🛒</span>
                المتجر الداخلي
              </h2>
              
              <div className="grid md:grid-cols-5 gap-4">
                {[
                  { name: 'الصور الرمزية', count: '10+', icon: '👤' },
                  { name: 'الإطارات', count: '8+', icon: '🖼️' },
                  { name: 'المظاهر', count: '5+', icon: '🎨' },
                  { name: 'التعزيزات', count: '6+', icon: '⚡' },
                  { name: 'VIP', count: '3', icon: '👑' },
                ].map((cat, idx) => (
                  <div key={idx} className="bg-[#0a0a0f] rounded-xl p-4 text-center">
                    <span className="text-3xl">{cat.icon}</span>
                    <p className="font-semibold mt-2">{cat.name}</p>
                    <p className="text-sm text-gray-500">{cat.count} عنصر</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Technical Section */}
        {activeSection === 'technical' && (
          <div className="space-y-8">
            {/* Tech Stack */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">⚙️</span>
                التقنيات المستخدمة
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">Frontend (Mobile)</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'React Native', version: '0.79.2', desc: 'إطار التطبيق الرئيسي' },
                      { name: 'Expo', version: 'SDK 53', desc: 'منصة التطوير والبناء' },
                      { name: 'React Navigation', version: '7.x', desc: 'التنقل بين الشاشات' },
                      { name: 'Expo Linear Gradient', version: '14.x', desc: 'التدرجات اللونية' },
                      { name: 'AsyncStorage', version: '2.x', desc: 'التخزين المحلي' },
                      { name: 'React Native WebView', version: '13.x', desc: 'عرض صفحات الويب' },
                    ].map((tech, idx) => (
                      <div key={idx} className="bg-[#0a0a0f] rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{tech.name}</p>
                          <p className="text-xs text-gray-500">{tech.desc}</p>
                        </div>
                        <code className="text-blue-400 text-sm">{tech.version}</code>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Backend</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'FastAPI', version: '0.115.x', desc: 'إطار API الرئيسي' },
                      { name: 'Python', version: '3.11+', desc: 'لغة البرمجة' },
                      { name: 'MongoDB', version: '7.x', desc: 'قاعدة البيانات' },
                      { name: 'Motor', version: '3.x', desc: 'MongoDB Async Driver' },
                      { name: 'Pydantic', version: '2.x', desc: 'التحقق من البيانات' },
                      { name: 'JWT', version: '-', desc: 'المصادقة والتوثيق' },
                    ].map((tech, idx) => (
                      <div key={idx} className="bg-[#0a0a0f] rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{tech.name}</p>
                          <p className="text-xs text-gray-500">{tech.desc}</p>
                        </div>
                        <code className="text-green-400 text-sm">{tech.version}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Project Structure */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6">هيكل المشروع</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">Mobile App Structure</h3>
                  <pre className="bg-[#0a0a0f] rounded-lg p-4 text-sm overflow-x-auto">
{`/app/mobile/
├── App.js                 # نقطة الدخول
├── app.json               # إعدادات Expo
├── eas.json               # إعدادات البناء
├── package.json           # التبعيات
│
├── src/
│   ├── screens/           # الشاشات (15+)
│   │   ├── AuthScreen.js
│   │   ├── GamesScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── ShopScreen.js
│   │   ├── SupportScreen.js
│   │   ├── AdminWebViewScreen.js
│   │   └── games/         # شاشات الألعاب
│   │       ├── ChessGame.js
│   │       ├── AIQuestGame.js
│   │       ├── MemoryGame.js
│   │       └── ...
│   │
│   ├── components/        # المكونات
│   │   ├── AdChallengesModal.js
│   │   └── ...
│   │
│   ├── services/          # الخدمات
│   │   ├── api.js
│   │   ├── storage.js
│   │   ├── multiplayer.js
│   │   └── NotificationService.js
│   │
│   └── data/              # البيانات
│       └── questionsData.js  # 1000+ سؤال
│
└── assets/                # الأصول
    └── logo_saqr.png`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Backend Structure</h3>
                  <pre className="bg-[#0a0a0f] rounded-lg p-4 text-sm overflow-x-auto">
{`/app/backend/
├── server.py              # نقطة الدخول
├── requirements.txt       # التبعيات
│
├── routes/                # API Routes (40+)
│   ├── auth_routes.py
│   ├── economy_routes.py
│   ├── games_routes.py
│   ├── diamonds_routes.py
│   ├── support_routes.py
│   ├── ad_routes.py
│   ├── admin_*.py
│   └── ...
│
├── models/                # نماذج البيانات
│   ├── user.py
│   ├── game.py
│   └── ...
│
├── services/              # الخدمات
│   ├── auth_service.py
│   ├── email_service.py
│   └── ...
│
└── tests/                 # الاختبارات
    └── ...`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Dependencies */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6">التبعيات الرئيسية</h2>
              
              <div className="bg-[#0a0a0f] rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm">
{`// package.json - Main Dependencies
{
  "dependencies": {
    "expo": "~53.0.0",
    "react": "19.0.0",
    "react-native": "0.79.2",
    "@react-navigation/native": "^7.1.6",
    "@react-navigation/native-stack": "^7.3.10",
    "expo-auth-session": "~6.1.3",
    "expo-linear-gradient": "~14.1.4",
    "expo-notifications": "~0.31.1",
    "expo-device": "~7.1.4",
    "expo-web-browser": "~15.0.10",
    "react-native-webview": "^13.16.0",
    "@react-native-async-storage/async-storage": "2.1.2",
    "react-native-google-mobile-ads": "^15.4.0"
  }
}`}
                </pre>
              </div>
            </section>
          </div>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <div className="space-y-8">
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">🔒</span>
                الأمان والخصوصية
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-4">إجراءات الأمان</h3>
                  <ul className="space-y-3">
                    {[
                      'JWT Authentication للمصادقة',
                      'تشفير كلمات المرور (bcrypt)',
                      'HTTPS لجميع الاتصالات',
                      'Rate Limiting للحماية من الهجمات',
                      'Input Validation لجميع المدخلات',
                      'Secure Storage للتوكنات',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 bg-[#0a0a0f] rounded-lg p-3">
                        <span className="text-green-400">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">الخصوصية</h3>
                  <ul className="space-y-3">
                    {[
                      'لا نشارك البيانات مع أطراف ثالثة',
                      'حذف الحساب متاح للمستخدم',
                      'جمع الحد الأدنى من البيانات',
                      'تشفير البيانات الحساسة',
                      'سياسة خصوصية واضحة',
                      'متوافق مع GDPR',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 bg-[#0a0a0f] rounded-lg p-3">
                        <span className="text-blue-400">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Permissions */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6">الأذونات المطلوبة</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0f] rounded-xl p-6">
                  <h3 className="font-semibold text-blue-400 mb-4">iOS Permissions</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-400">Internet Access</span>
                      <span className="text-green-400">مطلوب</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Camera (اختياري)</span>
                      <span className="text-yellow-400">اختياري</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Photo Library (اختياري)</span>
                      <span className="text-yellow-400">اختياري</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">User Tracking (Ads)</span>
                      <span className="text-green-400">مطلوب</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-[#0a0a0f] rounded-xl p-6">
                  <h3 className="font-semibold text-green-400 mb-4">Android Permissions</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-400">INTERNET</span>
                      <span className="text-green-400">مطلوب</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">VIBRATE</span>
                      <span className="text-green-400">مطلوب</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">AD_ID</span>
                      <span className="text-green-400">مطلوب</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">RECORD_AUDIO</span>
                      <span className="text-red-400">محظور</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* API Section */}
        {activeSection === 'api' && (
          <div className="space-y-8">
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">🔗</span>
                API Endpoints
              </h2>
              
              <div className="space-y-4">
                {[
                  { method: 'POST', path: '/api/auth/register', desc: 'تسجيل مستخدم جديد' },
                  { method: 'POST', path: '/api/auth/login', desc: 'تسجيل الدخول' },
                  { method: 'GET', path: '/api/auth/google', desc: 'تسجيل الدخول بـ Google' },
                  { method: 'GET', path: '/api/auth/apple', desc: 'تسجيل الدخول بـ Apple' },
                  { method: 'GET', path: '/api/economy/balance/{user_id}', desc: 'رصيد المستخدم' },
                  { method: 'POST', path: '/api/economy/record-game', desc: 'تسجيل نتيجة اللعبة' },
                  { method: 'POST', path: '/api/economy/add-diamonds', desc: 'إضافة ألماسات (مكافآت)' },
                  { method: 'GET', path: '/api/games/leaderboard', desc: 'لوحة المتصدرين' },
                  { method: 'GET', path: '/api/diamonds/packages', desc: 'باقات الألماسات' },
                  { method: 'POST', path: '/api/support/tickets', desc: 'إنشاء تذكرة دعم' },
                  { method: 'GET', path: '/api/health', desc: 'حالة الخادم' },
                ].map((endpoint, idx) => (
                  <div key={idx} className="bg-[#0a0a0f] rounded-lg p-4 flex items-center gap-4">
                    <span className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                      endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                      endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm flex-1">{endpoint.path}</code>
                    <span className="text-gray-500 text-sm">{endpoint.desc}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-400 text-sm">
                  <strong>Base URL:</strong> https://premium-quest-app.preview.emergentagent.com/api
                </p>
              </div>
            </section>

            {/* API Response Example */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-6">مثال على الاستجابة</h2>
              
              <div className="bg-[#0a0a0f] rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm">
{`// GET /api/economy/balance/{user_id}
{
  "saqr_points": 1250,
  "diamonds": 450,
  "saqr_points_value_sar": 2.5,
  "daily_points_earned": 85,
  "daily_points_remaining": 65,
  "daily_limit": 150
}

// POST /api/economy/record-game
{
  "points_awarded": 20,
  "diamonds_awarded": 10,
  "new_total_points": 1270,
  "new_total_diamonds": 460,
  "can_earn_more": true,
  "daily_remaining": 45
}`}
                </pre>
              </div>
            </section>
          </div>
        )}

        {/* Testing Section */}
        {activeSection === 'testing' && (
          <div className="space-y-8">
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">✅</span>
                معلومات الاختبار
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-[#0a0a0f] rounded-xl p-6">
                  <h3 className="font-semibold text-green-400 mb-4">حساب الاختبار</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">الطريقة</p>
                      <p className="font-medium">إنشاء حساب جديد أو Google/Apple Sign-In</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">الألماسات الترحيبية</p>
                      <p className="font-medium text-blue-400">300 ألماسة مجانية</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">جميع الميزات</p>
                      <p className="font-medium text-green-400">متاحة فوراً</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#0a0a0f] rounded-xl p-6">
                  <h3 className="font-semibold text-blue-400 mb-4">الدعم الفني</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">واتساب</p>
                      <p className="font-medium">+966539999415</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                      <p className="font-medium">sky-321@hotmail.com</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">أوقات العمل</p>
                      <p className="font-medium text-green-400">24/7</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tested Devices */}
            <section className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-6">الأجهزة المختبرة</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0f] rounded-xl p-4">
                  <h3 className="font-semibold text-blue-400 mb-3">iOS</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      iPhone 15 Pro Max (iOS 18)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      iPhone 14 (iOS 17)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      iPad Air M3 (iPadOS 18)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      iPad Pro 12.9" (iPadOS 17)
                    </li>
                  </ul>
                </div>
                
                <div className="bg-[#0a0a0f] rounded-xl p-4">
                  <h3 className="font-semibold text-green-400 mb-3">Android</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      Samsung Galaxy S24 (Android 14)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      Google Pixel 8 (Android 14)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      OnePlus 12 (Android 14)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      Samsung Tab S9 (Android 14)
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#111118] border-t border-gray-800 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-right">
              <p className="font-bold text-lg">صقر - Saqr Rewards</p>
              <p className="text-gray-500 text-sm">Version 5.8.0 | © 2024</p>
            </div>
            <div className="flex gap-4">
              <a href="/support" className="text-blue-400 hover:underline">الدعم</a>
              <a href="/privacy" className="text-blue-400 hover:underline">الخصوصية</a>
              <a href="/terms" className="text-blue-400 hover:underline">الشروط</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppDocumentation;
