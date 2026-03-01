// Riddles Game Component - Web Version
import React, { useState, useEffect } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Lightbulb, HelpCircle, Diamond, Eye } from 'lucide-react';
import soundManager from '../../utils/soundManager';

// Arabic riddles
const RIDDLES = [
  {
    q: 'ما هو الشيء الذي يمشي بلا أرجل؟',
    answer: 'الساعة',
    hint: 'ننظر إليه لنعرف الوقت',
    options: ['الساعة', 'الهواء', 'الماء', 'السحاب']
  },
  {
    q: 'ما هو الشيء الذي كلما أخذت منه كبر؟',
    answer: 'الحفرة',
    hint: 'تجده في الأرض',
    options: ['الجبل', 'الحفرة', 'البحر', 'النهر']
  },
  {
    q: 'ما هو الشيء الذي يسمع بلا أذن ويتكلم بلا لسان؟',
    answer: 'الهاتف',
    hint: 'نستخدمه للتواصل',
    options: ['الراديو', 'التلفزيون', 'الهاتف', 'الكمبيوتر']
  },
  {
    q: 'ما هو الشيء الذي يدخل الماء ولا يبتل؟',
    answer: 'الضوء',
    hint: 'يأتي من الشمس',
    options: ['الظل', 'الضوء', 'الهواء', 'الصوت']
  },
  {
    q: 'ما هو البيت الذي ليس فيه أبواب ولا نوافذ؟',
    answer: 'بيت الشعر',
    hint: 'متعلق بالأدب',
    options: ['بيت العنكبوت', 'بيت الشعر', 'بيت النمل', 'بيت النحل']
  },
  {
    q: 'ما هو الشيء الذي لا يمشي إلا بالضرب؟',
    answer: 'المسمار',
    hint: 'نستخدمه في النجارة',
    options: ['الطبل', 'المسمار', 'الكرة', 'الجرس']
  },
  {
    q: 'ما هو الشيء الذي له رأس ولا عين له؟',
    answer: 'الدبوس',
    hint: 'صغير وحاد',
    options: ['الإبرة', 'الدبوس', 'المسمار', 'البرغي']
  },
  {
    q: 'ما هو الشيء الذي تراه في الليل ثلاث مرات وفي النهار مرة واحدة؟',
    answer: 'حرف اللام',
    hint: 'فكر في الحروف',
    options: ['القمر', 'النجوم', 'حرف اللام', 'الظلام']
  },
  {
    q: 'ما هو الشيء الذي يحملك وتحمله؟',
    answer: 'الحذاء',
    hint: 'نلبسه في أقدامنا',
    options: ['السيارة', 'الحذاء', 'الدراجة', 'الحقيبة']
  },
  {
    q: 'ما هو الشيء الذي لا يبلل حتى لو دخل الماء؟',
    answer: 'الظل',
    hint: 'يتبعك في الشمس',
    options: ['الضوء', 'الهواء', 'الظل', 'الصوت']
  },
  {
    q: 'شيء موجود في السماء إذا أضفت إليه حرفاً أصبح في الأرض؟',
    answer: 'نجم - منجم',
    hint: 'فكر في الحرف "م"',
    options: ['قمر - مقر', 'نجم - منجم', 'شمس - مشمس', 'غيم - مغيم']
  },
  {
    q: 'ما هو الشيء الذي ليس له بداية ولا نهاية؟',
    answer: 'الدائرة',
    hint: 'شكل هندسي',
    options: ['الخط', 'الدائرة', 'المربع', 'المثلث']
  },
  {
    q: 'أنا ابن الماء فإن تركوني في الماء مت، فمن أنا؟',
    answer: 'الثلج',
    hint: 'يتكون في البرودة',
    options: ['السمك', 'الثلج', 'الملح', 'السكر']
  },
  {
    q: 'ما هو الشيء الذي يقرصك ولا تراه؟',
    answer: 'الجوع',
    hint: 'تشعر به في معدتك',
    options: ['البرد', 'الجوع', 'الهواء', 'الظلام']
  },
  {
    q: 'ما هو الشيء الذي تذبحه وتبكي عليه؟',
    answer: 'البصل',
    hint: 'نوع من الخضروات',
    options: ['البصل', 'الفلفل', 'الثوم', 'الطماطم']
  }
];

const RiddlesGame = ({ mode, onComplete, onClose, userDiamonds, onUseDiamonds }) => {
  const [riddles] = useState(() => [...RIDDLES].sort(() => Math.random() - 0.5).slice(0, 10));
  const [currentR, setCurrentR] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);

  const handleAnswer = (idx) => {
    if (answered !== null) return;
    setAnswered(idx);

    const isCorrect = riddles[currentR].options[idx] === riddles[currentR].answer;

    if (isCorrect) {
      soundManager.success();
      const bonus = streak >= 3 ? 10 : 0;
      const hintPenalty = showHint ? 5 : 0;
      setScore(s => s + 20 - hintPenalty + bonus);
      setStreak(s => s + 1);
    } else {
      soundManager.error();
      setStreak(0);
    }

    setTimeout(() => {
      if (currentR < riddles.length - 1) {
        setCurrentR(c => c + 1);
        setAnswered(null);
        setShowHint(false);
      } else {
        setShowResult(true);
        if (score > 100) {
          soundManager.win();
        }
        onComplete(score, score > 100 ? 'win' : 'lose');
      }
    }, 2000);
  };

  const getHint = () => {
    if (userDiamonds < 2 || showHint) return;
    onUseDiamonds(2);
    setShowHint(true);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="riddles-result">
        <div className="text-center">
          <Lightbulb size={80} className="mx-auto text-yellow-400 mb-4" />
          <div className="text-5xl font-bold text-yellow-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-6">نقطة</div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                setCurrentR(0);
                setScore(0);
                setAnswered(null);
                setShowResult(false);
                setShowHint(false);
                setStreak(0);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
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

  const riddle = riddles[currentR];
  const correctIndex = riddle.options.indexOf(riddle.answer);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="riddles-game">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="riddles-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Lightbulb size={24} className="text-yellow-400" />
            الألغاز
          </h1>
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <Trophy size={18} />
            {score}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>اللغز {currentR + 1} من {riddles.length}</span>
            {streak >= 3 && <span className="text-orange-400">🔥 {streak} متتالية</span>}
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 transition-all" 
              style={{ width: `${((currentR + 1) / riddles.length) * 100}%` }} 
            />
          </div>
        </div>

        {/* Riddle */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-4">
          <HelpCircle size={40} className="mx-auto text-yellow-400 mb-4" />
          <p className="text-xl text-center leading-relaxed">{riddle.q}</p>
        </div>

        {/* Hint */}
        {showHint && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 text-center">
            <Eye size={20} className="inline mr-2 text-blue-400" />
            <span className="text-blue-400">تلميح: {riddle.hint}</span>
          </div>
        )}

        {/* Hint button */}
        {!showHint && answered === null && (
          <button
            onClick={getHint}
            disabled={userDiamonds < 2}
            className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 py-2 rounded-xl mb-4 border border-purple-500/30"
            data-testid="riddles-hint-btn"
          >
            <Eye size={18} />
            <span>تلميح</span>
            <Diamond size={14} />
            <span>2</span>
          </button>
        )}

        {/* Options */}
        <div className="space-y-3">
          {riddle.options.map((opt, idx) => {
            let bgClass = 'bg-white/5 hover:bg-white/10 border-transparent';
            if (answered !== null) {
              if (idx === correctIndex) bgClass = 'bg-green-500/30 border-green-500';
              else if (idx === answered) bgClass = 'bg-red-500/30 border-red-500';
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered !== null}
                className={`w-full p-4 rounded-xl text-center transition-all border-2 ${bgClass}`}
                data-testid={`riddles-option-${idx}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RiddlesGame;
