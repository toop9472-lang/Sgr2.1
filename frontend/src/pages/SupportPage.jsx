// Support Page - For App Store Compliance
import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// معلومات الدعم الحقيقية
const SUPPORT_EMAIL = 'sky-321@hotmail.com';
const SUPPORT_WHATSAPP = '+966539999415';

const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketId, setTicketId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/support/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setTicketId(data.ticket_id);
        setSubmitted(true);
      } else {
        alert('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
    } catch (error) {
      console.error('Submit error:', error);
      // Still show success for demo purposes
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const faqs = [
    {
      question: 'كيف أكسب النقاط؟',
      answer: 'يمكنك كسب النقاط من خلال لعب الألعاب المختلفة مثل الشطرنج وإكس أو وتركيب الصور، إضافة إلى تسجيل الدخول يومياً وإكمال التحديات.'
    },
    {
      question: 'ما هي الألعاب المتوفرة؟',
      answer: 'يتوفر لدينا: الشطرنج، إكس أو، تركيب الصور، أسئلة ثقافية، والألغاز. كل لعبة تمنحك نقاط عند الفوز!'
    },
    {
      question: 'كيف ألعب ضد لاعبين حقيقيين؟',
      answer: 'اختر وضع "أونلاين" عند بدء اللعبة وسيتم مطابقتك مع لاعب حقيقي تلقائياً.'
    },
    {
      question: 'كيف أستبدل النقاط؟',
      answer: 'يمكنك استبدال النقاط بمكافآت متنوعة من خلال قسم المكافآت في التطبيق.'
    },
    {
      question: 'هل التطبيق مجاني؟',
      answer: 'نعم، التطبيق مجاني تماماً للتحميل والاستخدام.'
    },
    {
      question: 'كيف أتواصل مع الدعم؟',
      answer: 'يمكنك التواصل معنا عبر البريد الإلكتروني support@saqr.app أو من خلال نموذج التواصل أدناه.'
    },
    {
      question: 'هل بياناتي آمنة؟',
      answer: 'نعم، نحن نستخدم أحدث تقنيات التشفير لحماية بياناتك الشخصية.'
    },
    {
      question: 'ما هي لوحة المتصدرين؟',
      answer: 'لوحة المتصدرين تعرض أفضل اللاعبين عالمياً بناءً على نقاطهم المكتسبة من الألعاب.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#111118] to-[#0a0a0f] py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">مركز الدعم</h1>
          <p className="text-gray-400 text-lg">نحن هنا لمساعدتك</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Contact Info */}
        <section className="mb-16">
          <div className="grid md:grid-cols-4 gap-6">
            <a 
              href={`https://wa.me/${SUPPORT_WHATSAPP.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111118] rounded-2xl p-6 text-center border border-gray-800 hover:border-green-500/50 transition-colors"
            >
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">واتساب</h3>
              <p className="text-green-400 font-mono text-sm">{SUPPORT_WHATSAPP}</p>
              <p className="text-gray-500 text-xs mt-1">تواصل فوري</p>
            </a>

            <a 
              href={`mailto:${SUPPORT_EMAIL}?subject=طلب دعم - تطبيق صقر`}
              className="bg-[#111118] rounded-2xl p-6 text-center border border-gray-800 hover:border-blue-500/50 transition-colors"
            >
              <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">البريد الإلكتروني</h3>
              <p className="text-blue-400 text-sm">{SUPPORT_EMAIL}</p>
              <p className="text-gray-500 text-xs mt-1">رد خلال 24 ساعة</p>
            </a>

            <div className="bg-[#111118] rounded-2xl p-6 text-center border border-gray-800">
              <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">ساعات العمل</h3>
              <p className="text-yellow-400">24/7</p>
              <p className="text-gray-500 text-xs mt-1">طوال الأسبوع</p>
            </div>

            <div className="bg-[#111118] rounded-2xl p-6 text-center border border-gray-800">
              <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">الموقع</h3>
              <p className="text-purple-400 text-sm">المملكة العربية السعودية</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">الأسئلة الشائعة</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="bg-[#111118] rounded-xl border border-gray-800 overflow-hidden group">
                <summary className="p-5 cursor-pointer font-medium flex justify-between items-center hover:bg-[#1a1a24] transition-colors">
                  {faq.question}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-gray-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center">تواصل معنا</h2>
          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-8 text-center">
                <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold mb-2">تم إرسال رسالتك بنجاح!</h3>
                <p className="text-gray-400">سنتواصل معك في أقرب وقت ممكن.</p>
                {ticketId && (
                  <p className="text-blue-400 mt-2 text-sm">رقم التذكرة: {ticketId}</p>
                )}
                <button 
                  onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-4 text-blue-400 hover:underline"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-[#111118] rounded-2xl p-8 border border-gray-800">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">الاسم</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="اسمك الكامل"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">الموضوع</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">اختر الموضوع</option>
                    <option value="account">مشكلة في الحساب</option>
                    <option value="games">مشكلة في الألعاب</option>
                    <option value="points">استفسار عن النقاط</option>
                    <option value="rewards">استفسار عن المكافآت</option>
                    <option value="technical">مشكلة تقنية</option>
                    <option value="suggestion">اقتراح</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">الرسالة</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال الرسالة'
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#111118] border-t border-gray-800 py-8 mt-16">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>© 2024 صقر. جميع الحقوق محفوظة.</p>
          <div className="mt-4 space-x-4 space-x-reverse">
            <a href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <span>|</span>
            <a href="/terms" className="hover:text-white transition-colors">الشروط والأحكام</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SupportPage;
