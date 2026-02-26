import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen bg-gray-950 text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          data-testid="privacy-back-btn"
        >
          <ArrowLeft size={20} />
          <span>{isRTL ? 'رجوع' : 'Back'}</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="text-gray-400">
            {isRTL ? 'اخر تحديث: فبراير 2026' : 'Last Updated: February 2026'}
          </p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '1. مقدمة' : '1. Introduction'}
            </h2>
            <p>
              {isRTL 
                ? 'مرحبا بك في تطبيق صقر للمكافات. نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك عند استخدام تطبيقنا.'
                : 'Welcome to Saqr Rewards App. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use our application.'}
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '2. البيانات التي نجمعها' : '2. Data We Collect'}
            </h2>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">*</span>
                  <span>{isRTL ? 'معلومات الحساب: البريد الالكتروني واسم المستخدم' : 'Account Information: Email and username'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">*</span>
                  <span>{isRTL ? 'بيانات الاستخدام: الاعلانات المشاهدة والنقاط المكتسبة' : 'Usage Data: Watched ads and earned points'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">*</span>
                  <span>{isRTL ? 'معلومات الجهاز: نوع الجهاز ونظام التشغيل' : 'Device Information: Device type and operating system'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">*</span>
                  <span>{isRTL ? 'بيانات الارصدة: جواهر صقر والالماسات ونقاط صقر' : 'Balance Data: Saqr Gems, Diamonds, and Saqr Points'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">*</span>
                  <span>{isRTL ? 'بيانات التواصل: الرسائل والاصدقاء (مشفرة)' : 'Communication Data: Messages and friends (encrypted)'}</span>
                </li>
              </ul>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '3. كيف نستخدم بياناتك' : '3. How We Use Your Data'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'تقديم خدمات التطبيق وادارة حسابك' : 'Provide app services and manage your account'}</li>
              <li>{isRTL ? 'احتساب النقاط وجواهر صقر والالماسات' : 'Calculate points, Saqr Gems, and diamonds'}</li>
              <li>{isRTL ? 'تمكين التواصل مع الاصدقاء والدردشة' : 'Enable communication with friends and chat'}</li>
              <li>{isRTL ? 'تحسين تجربة المستخدم' : 'Improve user experience'}</li>
              <li>{isRTL ? 'ارسال اشعارات مهمة' : 'Send important notifications'}</li>
              <li>{isRTL ? 'منع الغش والاحتيال' : 'Prevent fraud and cheating'}</li>
              <li>{isRTL ? 'معالجة طلبات السحب النقدي' : 'Process cash withdrawal requests'}</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '4. حماية البيانات' : '4. Data Protection'}
            </h2>
            <p className="mb-4">
              {isRTL 
                ? 'نستخدم تقنيات امان متقدمة لحماية بياناتك:'
                : 'We use advanced security technologies to protect your data:'}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-green-400 font-bold mb-2">{isRTL ? 'التشفير' : 'Encryption'}</div>
                <p className="text-sm text-gray-400">{isRTL ? 'جميع البيانات مشفرة اثناء النقل والتخزين' : 'All data is encrypted in transit and at rest'}</p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-blue-400 font-bold mb-2">{isRTL ? 'جدران الحماية' : 'Firewalls'}</div>
                <p className="text-sm text-gray-400">{isRTL ? 'حماية متعددة الطبقات ضد الاختراق' : 'Multi-layer protection against intrusion'}</p>
              </div>
            </div>
            <p className="mt-4">
              {isRTL 
                ? 'لا نشارك معلوماتك الشخصية مع اطراف ثالثة الا بموافقتك او عند الضرورة القانونية.'
                : 'We do not share your personal information with third parties without your consent or legal necessity.'}
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '5. حقوقك' : '5. Your Rights'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'الوصول الى بياناتك الشخصية' : 'Access your personal data'}</li>
              <li>{isRTL ? 'تصحيح البيانات غير الدقيقة' : 'Correct inaccurate data'}</li>
              <li>{isRTL ? 'طلب حذف حسابك' : 'Request account deletion'}</li>
              <li>{isRTL ? 'الغاء الاشتراك في الاشعارات' : 'Opt-out of notifications'}</li>
              <li>{isRTL ? 'تصدير بياناتك' : 'Export your data'}</li>
              <li>{isRTL ? 'الاعتراض على معالجة البيانات' : 'Object to data processing'}</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '6. ملفات تعريف الارتباط' : '6. Cookies'}
            </h2>
            <p>
              {isRTL 
                ? 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتذكر تفضيلاتك. يمكنك ادارة اعدادات ملفات تعريف الارتباط من خلال متصفحك.'
                : 'We use cookies to improve your experience and remember your preferences. You can manage cookie settings through your browser.'}
            </p>
          </section>

          {/* Third Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '7. خدمات الطرف الثالث' : '7. Third-Party Services'}
            </h2>
            <p className="mb-4">
              {isRTL 
                ? 'نستخدم خدمات طرف ثالث موثوقة:'
                : 'We use trusted third-party services:'}
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'Google AdMob - لعرض الاعلانات' : 'Google AdMob - for displaying ads'}</li>
              <li>{isRTL ? 'Stripe - لمعالجة المدفوعات' : 'Stripe - for payment processing'}</li>
              <li>{isRTL ? 'Google/Apple Sign In - لتسجيل الدخول' : 'Google/Apple Sign In - for authentication'}</li>
            </ul>
          </section>

          {/* Children Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '8. خصوصية الاطفال' : '8. Children\'s Privacy'}
            </h2>
            <p>
              {isRTL 
                ? 'تطبيقنا غير موجه للاطفال دون سن 18 عاما. لا نجمع عن قصد معلومات من الاطفال دون هذا السن.'
                : 'Our app is not directed to children under 18. We do not knowingly collect information from children under this age.'}
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '9. الاحتفاظ بالبيانات' : '9. Data Retention'}
            </h2>
            <p>
              {isRTL 
                ? 'نحتفظ ببياناتك طالما حسابك نشط. عند حذف الحساب، يتم حذف جميع البيانات خلال 30 يوما.'
                : 'We retain your data as long as your account is active. Upon account deletion, all data is deleted within 30 days.'}
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '10. التغييرات على السياسة' : '10. Changes to Policy'}
            </h2>
            <p>
              {isRTL 
                ? 'قد نقوم بتحديث سياسة الخصوصية من وقت لاخر. سنخطرك باي تغييرات جوهرية عبر التطبيق او البريد الالكتروني.'
                : 'We may update this privacy policy from time to time. We will notify you of any significant changes through the app or email.'}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '11. اتصل بنا' : '11. Contact Us'}
            </h2>
            <p className="mb-4">
              {isRTL 
                ? 'اذا كانت لديك اي اسئلة حول سياسة الخصوصية، يرجى التواصل معنا:'
                : 'If you have any questions about this privacy policy, please contact us:'}
            </p>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{isRTL ? 'البريد:' : 'Email:'}</span>
                  <span className="text-blue-400">sky-321@hotmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{isRTL ? 'واتساب:' : 'WhatsApp:'}</span>
                  <span className="text-green-400">+966539999415</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{isRTL ? 'اوقات الدعم:' : 'Support Hours:'}</span>
                  <span className="text-yellow-400">24/7</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>{isRTL ? '2026 صقر للمكافات. جميع الحقوق محفوظة.' : '2026 Saqr Rewards. All rights reserved.'}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
