// Speed Math Game Component
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calculator, Star, Flame } from 'lucide-react';
import soundManager from '../../utils/soundManager';
import { generateMathProblem } from '../../data/gameData';

const SpeedMathGame = ({ mode, onComplete, onClose, userDiamonds, onUseDiamonds }) => {
  const [problems, setProblems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [difficulty] = useState('medium');
  const totalProblems = 15;

  useEffect(() => {
    const newProblems = [];
    for (let i = 0; i < totalProblems; i++) {
      newProblems.push(generateMathProblem(difficulty));
    }
    setProblems(newProblems);
  }, [difficulty]);

  useEffect(() => {
    if (showResult || problems.length === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleTimeout();
          return 10;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, showResult, problems.length]);

  const handleTimeout = () => {
    soundManager.error();
    setStreak(0);
    moveNext();
  };

  const handleAnswer = (idx) => {
    if (answered !== null || problems.length === 0) return;
    
    const problem = problems[currentIdx];
    setAnswered(idx);
    
    if (idx === problem.correctIndex) {
      soundManager.triviaCorrect();
      const bonus = streak >= 3 ? 5 : 0;
      const timeBonus = Math.floor(timeLeft / 2);
      setScore(s => s + 10 + timeBonus + bonus);
      setStreak(s => s + 1);
    } else {
      soundManager.triviaWrong();
      setStreak(0);
    }

    setTimeout(moveNext, 1000);
  };

  const moveNext = () => {
    if (currentIdx < totalProblems - 1) {
      setCurrentIdx(c => c + 1);
      setAnswered(null);
      setTimeLeft(10);
    } else {
      setShowResult(true);
      soundManager.win();
      onComplete(score, score > 50 ? 'win' : 'lose');
    }
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="speedmath-result">
        <div className="text-center">
          <Calculator size={80} className="mx-auto text-blue-400 mb-4" />
          <div className="text-5xl font-bold text-blue-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-2">نقطة</div>
          <div className="text-green-400 mb-6">سلسلة: {streak} إجابات صحيحة متتالية</div>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold" data-testid="speedmath-finish-btn">
            إنهاء
          </button>
        </div>
      </div>
    );
  }

  if (problems.length === 0) {
    return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">جاري التحميل...</div>;
  }

  const problem = problems[currentIdx];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="speedmath-game">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="speedmath-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calculator size={24} className="text-blue-400" />
            سرعة الحساب
          </h1>
          <div className="flex items-center gap-3">
            {streak >= 3 && (
              <div className="flex items-center gap-1 text-orange-400">
                <Flame size={18} />
                <span>{streak}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-yellow-400 font-bold">
              <Star size={18} />
              {score}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${((currentIdx + 1) / totalProblems) * 100}%` }} />
          </div>
          <div className="text-center text-gray-400 text-sm mt-2">{currentIdx + 1} / {totalProblems}</div>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full border-4 ${timeLeft <= 3 ? 'border-red-500 animate-pulse' : 'border-blue-500'} flex items-center justify-center`}>
            <span className={`text-3xl font-bold ${timeLeft <= 3 ? 'text-red-400' : 'text-white'}`}>{timeLeft}</span>
          </div>
        </div>

        {/* Math Problem */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 mb-6">
          <p className="text-4xl font-bold text-center">{problem.question}</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3">
          {problem.options.map((opt, idx) => {
            let bgClass = 'bg-white/5 hover:bg-white/10 border-transparent';
            if (answered !== null) {
              if (idx === problem.correctIndex) bgClass = 'bg-green-500/30 border-green-500';
              else if (idx === answered) bgClass = 'bg-red-500/30 border-red-500';
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered !== null}
                className={`p-6 rounded-xl text-center text-2xl font-bold transition-all border-2 ${bgClass}`}
                data-testid={`speedmath-option-${idx}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Streak Indicator */}
        {streak >= 2 && (
          <div className="mt-4 text-center text-orange-400 flex items-center justify-center gap-2">
            <Flame size={20} />
            <span>{streak} إجابات صحيحة متتالية!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeedMathGame;
