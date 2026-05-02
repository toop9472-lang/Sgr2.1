import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen bg-gray-950 text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          data-testid="terms-back-btn"
        >
          <ArrowLeft size={20} />
          <span>{isRTL ? 'رجوع' : 'Back'}</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {isRTL ? 'شروط الاستخدام' : 'Terms of Service'}
          </h1>
          <p className="text-gray-400">
            {isRTL ? 'اخر تحديث: فبراير 2026' : 'Last Updated: February 2026'}
          </p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          {/* Acceptance */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '1. قبول الشروط' : '1. Acceptance of Terms'}
            </h2>
            <p>
              {isRTL 
                ? 'باستخدامك لتطبيق صقر للمكافات، فانك توافق على الالتزام بهذه الشروط والاحكام. اذا كنت لا توافق على اي جزء من هذه الشروط، يرجى عدم استخدام التطبيق.'
                : 'By using the Saqr Rewards App, you agree to be bound by these terms and conditions. If you do not agree to any part of these terms, please do not use the application.'}
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '2. الاهلية' : '2. Eligibility'}
            </h2>
            <p>
              {isRTL 
                ? 'يجب ان يكون عمرك 18 عاما او اكثر لاستخدام هذا التطبيق. باستخدامك للتطبيق، تؤكد انك تستوفي هذا المتطلب العمري.'
                : 'You must be 18 years or older to use this application. By using the app, you confirm that you meet this age requirement.'}
            </p>
          </section>

          {/* User Account */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '3. حساب المستخدم' : '3. User Account'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'انت مسؤول عن الحفاظ على سرية معلومات حسابك' : 'You are responsible for maintaining the confidentiality of your account information'}</li>
              <li>{isRTL ? 'يجب تقديم معلومات دقيقة وحديثة عند التسجيل' : 'You must provide accurate and current information when registering'}</li>
              <li>{isRTL ? 'لا يجوز مشاركة حسابك مع الاخرين' : 'You may not share your account with others'}</li>
              <li>{isRTL ? 'انت مسؤول عن جميع الانشطة التي تتم من خلال حسابك' : 'You are responsible for all activities that occur through your account'}</li>
            </ul>
          </section>

          {/* Currency System */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '4. نظام العملات' : '4. Currency System'}
            </h2>
            <div className="bg-gray-900/50 rounded-xl p-6 mb-4 border border-gray-800">
              <h3 className="text-lg font-bold text-pink-400 mb-3">
                {isRTL ? 'جواهر صقر (للاستبدال بالمال)' : 'Saqr Gems (Cash Exchangeable)'}
              </h3>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>{isRTL ? 'تحصل عليها من: مشاهدة الاعلانات، عجلة الحظ، صناديق الكنز' : 'Earned from: watching ads, fortune wheel, treasure chests'}</li>
                <li>{isRTL ? '500 جوهرة صقر = 1 دولار امريكي' : '500 Saqr Gems = 1 USD'}</li>
                <li>{isRTL ? 'يمكن سحبها كنقد حقيقي عند الوصول للحد الادنى' : 'Can be withdrawn as real cash upon reaching minimum threshold'}</li>
              </ul>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-blue-400 mb-3">
                {isRTL ? 'الالماس (للاستهلاك داخل التطبيق)' : 'Diamonds (In-App Currency)'}
              </h3>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>{isRTL ? 'تحصل عليه من: الالعاب، المكافات، الشراء' : 'Earned from: games, rewards, purchases'}</li>
                <li>{isRTL ? 'يستخدم في: الدردشة (5 الماسات/رسالة)، المتجر، الالعاب' : 'Used for: chat (5 diamonds/message), store, games'}</li>
                <li>{isRTL ? 'لا يمكن استبداله بمال حقيقي' : 'Cannot be exchanged for real money'}</li>
                <li>{isRTL ? 'المستخدمون الجدد يحصلون على 300 الماسة مجانا' : 'New users receive 300 diamonds for free'}</li>
              </ul>
            </div>
          </section>

          {/* Social Features */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '5. الميزات الاجتماعية' : '5. Social Features'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'الرسائل الخاصة متاحة فقط بين الاصدقاء' : 'Private messages are available only between friends'}</li>
              <li>{isRTL ? 'دعوات الالعاب للاصدقاء مجانية' : 'Game invites to friends are free'}</li>
              <li>{isRTL ? 'دعوات الالعاب في الدردشة العامة تكلف 25 الماسة' : 'Game invites in public chat cost 25 diamonds'}</li>
              <li>{isRTL ? 'يحق لنا حذف اي محتوى مخالف دون اشعار' : 'We reserve the right to remove any violating content without notice'}</li>
              <li>{isRTL ? 'الابلاغ عن المستخدمين المخالفين واجب على الجميع' : 'Reporting violating users is everyone\'s duty'}</li>
            </ul>
          </section>

          {/* In-App Purchases */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '6. عمليات الشراء داخل التطبيق' : '6. In-App Purchases'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'جميع عمليات الشراء نهائية وغير قابلة للاسترداد' : 'All purchases are final and non-refundable'}</li>
              <li>{isRTL ? 'يتم معالجة المدفوعات بشكل امن عبر Stripe' : 'Payments are securely processed via Stripe'}</li>
              <li>{isRTL ? 'تتم اضافة الالماسات المشتراة فورا الى حسابك' : 'Purchased diamonds are added immediately to your account'}</li>
              <li>{isRTL ? 'في حالة حدوث مشكلة تقنية، تواصل مع الدعم' : 'For technical issues, contact support'}</li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '7. الانشطة المحظورة' : '7. Prohibited Activities'}
            </h2>
            <p className="mb-4">
              {isRTL ? 'يحظر عليك القيام بالتالي:' : 'You are prohibited from:'}
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'استخدام برامج الية او روبوتات للتفاعل مع التطبيق' : 'Using automated programs or bots to interact with the app'}</li>
              <li>{isRTL ? 'محاولة التلاعب بنظام النقاط او المكافات' : 'Attempting to manipulate the points or rewards system'}</li>
              <li>{isRTL ? 'انشاء حسابات متعددة للحصول على مكافات اضافية' : 'Creating multiple accounts to gain additional rewards'}</li>
              <li>{isRTL ? 'انتهاك حقوق الملكية الفكرية' : 'Violating intellectual property rights'}</li>
              <li>{isRTL ? 'نشر محتوى مسيء او غير قانوني' : 'Posting offensive or illegal content'}</li>
              <li>{isRTL ? 'التحرش بالمستخدمين الاخرين او ارسال رسائل مزعجة' : 'Harassing other users or sending spam messages'}</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '8. الملكية الفكرية' : '8. Intellectual Property'}
            </h2>
            <p>
              {isRTL 
                ? 'جميع المحتويات والعلامات التجارية والشعارات المعروضة في التطبيق هي ملك لنا او لمرخصينا. لا يجوز استخدام اي من هذه المواد دون اذن كتابي مسبق.'
                : 'All content, trademarks, and logos displayed in the app are owned by us or our licensors. None of these materials may be used without prior written permission.'}
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '9. تحديد المسؤولية' : '9. Limitation of Liability'}
            </h2>
            <p>
              {isRTL 
                ? 'لن نكون مسؤولين عن اي اضرار غير مباشرة او عرضية او تبعية ناتجة عن استخدامك للتطبيق. استخدامك للتطبيق يكون على مسؤوليتك الخاصة.'
                : 'We will not be liable for any indirect, incidental, or consequential damages arising from your use of the app. Your use of the app is at your own risk.'}
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '10. انهاء الحساب' : '10. Termination'}
            </h2>
            <p>
              {isRTL 
                ? 'نحتفظ بالحق في تعليق او انهاء حسابك في اي وقت اذا انتهكت هذه الشروط او قمت باي نشاط احتيالي. عند الانهاء، ستفقد جميع النقاط والمكافات غير المستخدمة.'
                : 'We reserve the right to suspend or terminate your account at any time if you violate these terms or engage in fraudulent activity. Upon termination, you will forfeit all unused points and rewards.'}
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '11. تعديل الشروط' : '11. Changes to Terms'}
            </h2>
            <p>
              {isRTL 
                ? 'نحتفظ بالحق في تعديل هذه الشروط في اي وقت. سيتم اخطارك باي تغييرات جوهرية عبر التطبيق او البريد الالكتروني. استمرارك في استخدام التطبيق بعد التعديلات يعني موافقتك على الشروط الجديدة.'
                : 'We reserve the right to modify these terms at any time. You will be notified of any material changes via the app or email. Your continued use of the app after modifications constitutes acceptance of the new terms.'}
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '12. القانون الحاكم' : '12. Governing Law'}
            </h2>
            <p>
              {isRTL 
                ? 'تخضع هذه الشروط وتفسر وفقا لقوانين المملكة العربية السعودية، دون اعتبار لتعارض احكام القوانين.'
                : 'These terms shall be governed by and construed in accordance with the laws of Saudi Arabia, without regard to its conflict of law provisions.'}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '13. اتصل بنا' : '13. Contact Us'}
            </h2>
            <p className="mb-4">
              {isRTL 
                ? 'اذا كانت لديك اي اسئلة حول هذه الشروط، يرجى التواصل معنا عبر:'
                : 'If you have any questions about these terms, please contact us at:'}
            </p>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-gray-400">{isRTL ? 'البريد:' : 'Email:'}</span>
                <span className="text-blue-400">sky-321@hotmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{isRTL ? 'واتساب:' : 'WhatsApp:'}</span>
                <span className="text-green-400">+966539999415</span>
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

export default TermsOfService;
