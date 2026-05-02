// AI Quest Game Component - Web Version
import React, { useState, useEffect } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Brain, Sparkles, Zap } from 'lucide-react';
import soundManager from '../../utils/soundManager';

// AI Quiz questions in Arabic
const AI_QUESTIONS = [
  {
    q: 'ما هو اسم نموذج الذكاء الاصطناعي الذي أنشأته OpenAI للمحادثة؟',
    options: ['Bard', 'ChatGPT', 'Claude', 'Gemini'],
    correct: 1
  },
  {
    q: 'ما هو التعلم العميق (Deep Learning)؟',
    options: ['نوع من قواعد البيانات', 'فرع من التعلم الآلي يستخدم شبكات عصبية', 'لغة برمجة', 'نظام تشغيل'],
    correct: 1
  },
  {
    q: 'أي شركة طورت نموذج GPT-4؟',
    options: ['Google', 'Microsoft', 'OpenAI', 'Meta'],
    correct: 2
  },
  {
    q: 'ما هو الهدف الرئيسي من معالجة اللغة الطبيعية (NLP)؟',
    options: ['رسم الصور', 'فهم وتوليد اللغة البشرية', 'تشغيل الألعاب', 'تصميم المواقع'],
    correct: 1
  },
  {
    q: 'ما هي الشبكة العصبية الاصطناعية؟',
    options: ['نوع من الإنترنت', 'نموذج حسابي مستوحى من الدماغ البشري', 'جهاز طبي', 'برنامج رسوميات'],
    correct: 1
  },
  {
    q: 'ما هو التعلم بالتعزيز (Reinforcement Learning)؟',
    options: ['تعلم من البيانات المصنفة', 'تعلم من خلال التجربة والخطأ والمكافآت', 'تعلم من النصوص فقط', 'تعلم من الصور فقط'],
    correct: 1
  },
  {
    q: 'ما هو اختبار تورينج؟',
    options: ['اختبار سرعة الحاسوب', 'اختبار قدرة الآلة على محاكاة الذكاء البشري', 'اختبار أمان البرمجيات', 'اختبار الشبكات'],
    correct: 1
  },
  {
    q: 'أي من التالي يعتبر تطبيقاً للذكاء الاصطناعي؟',
    options: ['السيارات ذاتية القيادة', 'آلة حاسبة عادية', 'مصباح كهربائي', 'ساعة تقليدية'],
    correct: 0
  },
  {
    q: 'ما هو التعلم الآلي (Machine Learning)؟',
    options: ['تعليم الآلات يدوياً', 'قدرة الأنظمة على التعلم من البيانات', 'صيانة الحواسيب', 'تصميم الروبوتات'],
    correct: 1
  },
  {
    q: 'ما هي الرؤية الحاسوبية (Computer Vision)؟',
    options: ['شاشة الحاسوب', 'قدرة الحاسوب على فهم الصور والفيديو', 'نظارات ذكية', 'كاميرا رقمية'],
    correct: 1
  },
  {
    q: 'ما هو الغرض من نماذج اللغة الكبيرة (LLMs)؟',
    options: ['تخزين الملفات', 'فهم وتوليد النصوص', 'تشغيل الألعاب', 'تحرير الفيديو'],
    correct: 1
  },
  {
    q: 'أي شركة طورت نموذج Gemini؟',
    options: ['OpenAI', 'Google', 'Microsoft', 'Amazon'],
    correct: 1
  },
  {
    q: 'ما هو التعلم غير الموجه (Unsupervised Learning)؟',
    options: ['تعلم بدون بيانات', 'تعلم من بيانات غير مصنفة', 'تعلم من الألعاب', 'تعلم من الإنترنت'],
    correct: 1
  },
  {
    q: 'ما هو الذكاء الاصطناعي التوليدي (Generative AI)؟',
    options: ['AI يحذف المحتوى', 'AI ينشئ محتوى جديد', 'AI يبحث فقط', 'AI يترجم فقط'],
    correct: 1
  },
  {
    q: 'ما هو Transformer في سياق الذكاء الاصطناعي؟',
    options: ['روبوت', 'بنية شبكة عصبية للتعامل مع التسلسلات', 'نوع من الحواسيب', 'لغة برمجة'],
    correct: 1
  }
];

const AIQuestGame = ({ mode, onComplete, onClose }) => {
  const [questions] = useState(() => 
    [...AI_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10)
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && answered === null && !showResult) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && answered === null) {
      handleAnswer(-1);
    }
  }, [timeLeft, answered, showResult]);

  const handleAnswer = (idx) => {
    if (answered !== null) return;
    setAnswered(idx);

    if (idx === questions[currentQ].correct) {
      soundManager.success();
      const bonus = streak >= 3 ? 10 : 0;
      const timeBonus = Math.floor(timeLeft / 3);
      setScore(s => s + 15 + timeBonus + bonus);
      setStreak(s => s + 1);
    } else {
      soundManager.error();
      setStreak(0);
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1);
        setAnswered(null);
        setTimeLeft(15);
      } else {
        setShowResult(true);
        if (score > 80) {
          soundManager.win();
        }
        onComplete(score, score > 80 ? 'win' : 'lose');
      }
    }, 1500);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="aiquest-result">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Sparkles size={48} className="text-purple-400" />
          </div>
          <div className="text-5xl font-bold text-purple-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-6">نقطة في تحدي الذكاء الاصطناعي</div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                setCurrentQ(0);
                setScore(0);
                setAnswered(null);
                setShowResult(false);
                setStreak(0);
                setTimeLeft(15);
              }}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
            >
              <RotateCcw size={18} />
              العب مجدداً
            </button>
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold">
              إنهاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="aiquest-game">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="aiquest-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain size={24} className="text-purple-400" />
            AI Quest
          </h1>
          <div className="flex items-center gap-1 text-purple-400 font-bold">
            <Sparkles size={18} />
            {score}
          </div>
        </div>

        {/* Streak indicator */}
        {streak >= 3 && (
          <div className="flex items-center justify-center gap-2 mb-4 text-orange-400">
            <Zap size={20} />
            <span>🔥 سلسلة {streak} إجابات صحيحة!</span>
          </div>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{currentQ + 1} / {questions.length}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all" 
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} 
            />
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center justify-center gap-2 mb-6 ${timeLeft <= 5 ? 'text-red-400' : 'text-purple-400'}`}>
          <div className={`w-16 h-16 rounded-full border-4 ${timeLeft <= 5 ? 'border-red-500 animate-pulse' : 'border-purple-500'} flex items-center justify-center`}>
            <span className="text-2xl font-bold">{timeLeft}</span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 mb-4">
          <p className="text-lg text-center">{q.q}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            let bgClass = 'bg-white/5 hover:bg-white/10 border-transparent';
            if (answered !== null) {
              if (idx === q.correct) bgClass = 'bg-green-500/30 border-green-500';
              else if (idx === answered) bgClass = 'bg-red-500/30 border-red-500';
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered !== null}
                className={`w-full p-4 rounded-xl text-right transition-all border ${bgClass}`}
                data-testid={`aiquest-option-${idx}`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 ml-3">
                  {['أ', 'ب', 'ج', 'د'][idx]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AIQuestGame;
