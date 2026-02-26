// Trivia Game Component
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Brain, Star, Trophy, Clock, HelpCircle, Diamond, Flame } from 'lucide-react';
import soundManager from '../../utils/soundManager';
import { triviaQuestions } from '../../data/gameData';

const TriviaGame = ({ onComplete, onClose, userDiamonds, onUseDiamonds }) => {
  // 50 سؤال عشوائي متغير لكل جولة
  const [questions] = useState(() => [...triviaQuestions].sort(() => Math.random() - 0.5).slice(0, 50));
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [streak, setStreak] = useState(0);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);

  useEffect(() => {
    if (timeLeft > 0 && answered === null && !showResult) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && answered === null) {
      handleAnswer(-1);
    }
  }, [timeLeft, answered, showResult]);

  const getHint = () => {
    if (userDiamonds < 2 || eliminatedOptions.length > 0) return;
    onUseDiamonds(2);
    const wrongOptions = [0, 1, 2, 3].filter(i => i !== questions[currentQ].correct);
    const toEliminate = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedOptions(toEliminate);
  };

  const handleAnswer = (idx) => {
    if (answered !== null) return;
    setAnswered(idx);
    
    if (idx === questions[currentQ].correct) {
      soundManager.triviaCorrect();
      const bonus = streak >= 3 ? 5 : 0;
      setScore(s => s + 10 + Math.floor(timeLeft / 4) + bonus);
      setStreak(s => s + 1);
    } else {
      soundManager.triviaWrong();
      setStreak(0);
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1);
        setAnswered(null);
        setTimeLeft(20);
        setEliminatedOptions([]);
      } else {
        setShowResult(true);
        if (score > 50) {
          soundManager.win();
        }
        onComplete(score, score > 50 ? 'win' : 'lose');
      }
    }, 1500);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="trivia-result">
        <div className="text-center">
          <Trophy size={80} className="mx-auto text-yellow-400 mb-4" />
          <div className="text-5xl font-bold text-yellow-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-6">نقطة</div>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold" data-testid="trivia-finish-btn">
            إنهاء
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="trivia-game">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="trivia-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain size={24} className="text-green-400" />
            أسئلة ثقافية
          </h1>
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <Star size={18} />
            {score}
          </div>
        </div>

        {streak >= 3 && (
          <div className="flex items-center justify-center gap-2 mb-4 text-orange-400">
            <Flame size={20} />
            <span>سلسلة {streak} إجابات صحيحة!</span>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{currentQ + 1} / {questions.length}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className={`flex items-center justify-center gap-2 mb-6 ${timeLeft <= 5 ? 'text-red-400' : 'text-blue-400'}`}>
          <Clock size={20} />
          <span className="text-2xl font-bold">{timeLeft}</span>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 mb-4 border border-white/10">
          <p className="text-lg text-center">{q.q}</p>
        </div>

        <button
          onClick={getHint}
          disabled={userDiamonds < 2 || eliminatedOptions.length > 0}
          className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 py-2 rounded-xl mb-4 border border-purple-500/30"
          data-testid="trivia-hint-btn"
        >
          <HelpCircle size={18} />
          <span>حذف إجابتين</span>
          <Diamond size={14} />
          <span>2</span>
        </button>

        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            if (eliminatedOptions.includes(idx)) return null;
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
                data-testid={`trivia-option-${idx}`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 ml-3">
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

export default TriviaGame;
