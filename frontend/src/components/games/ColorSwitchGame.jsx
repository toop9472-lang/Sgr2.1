// Color Switch Game Component - Web Version
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Zap } from 'lucide-react';
import soundManager from '../../utils/soundManager';

const COLORS = [
  { name: 'red', hex: '#ef4444', arabic: 'أحمر' },
  { name: 'blue', hex: '#3b82f6', arabic: 'أزرق' },
  { name: 'green', hex: '#22c55e', arabic: 'أخضر' },
  { name: 'yellow', hex: '#eab308', arabic: 'أصفر' },
  { name: 'purple', hex: '#8b5cf6', arabic: 'بنفسجي' },
  { name: 'orange', hex: '#f97316', arabic: 'برتقالي' },
];

const ColorSwitchGame = ({ mode, onComplete, onClose }) => {
  const [score, setScore] = useState(0);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [displayedText, setDisplayedText] = useState('');
  const [textColor, setTextColor] = useState(COLORS[0]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showInstruction, setShowInstruction] = useState(true);
  const [questionType, setQuestionType] = useState('color'); // 'color' or 'text'
  const timerRef = useRef(null);

  // Generate new question
  const generateQuestion = () => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomTextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const type = Math.random() > 0.5 ? 'color' : 'text';
    
    setDisplayedText(randomColor.arabic);
    setTextColor(randomTextColor);
    setQuestionType(type);
    
    // The correct answer depends on question type
    if (type === 'color') {
      setCurrentColor(randomTextColor); // Answer should match the color of the text
    } else {
      setCurrentColor(randomColor); // Answer should match what the text says
    }
  };

  // Start game
  const startGame = () => {
    setShowInstruction(false);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setGameOver(false);
    generateQuestion();
  };

  // Reset game
  const resetGame = () => {
    setShowInstruction(true);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setGameOver(false);
    clearInterval(timerRef.current);
  };

  // Timer
  useEffect(() => {
    if (showInstruction || gameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameOver(true);
          soundManager.lose();
          onComplete(score, score > 100 ? 'win' : 'lose');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [showInstruction, gameOver]);

  // Handle answer
  const handleAnswer = (selectedColor) => {
    if (gameOver || showInstruction) return;

    const isCorrect = selectedColor.name === currentColor.name;

    if (isCorrect) {
      soundManager.success();
      const bonus = streak >= 3 ? 5 : 0;
      setScore(prev => prev + 10 + bonus);
      setStreak(prev => prev + 1);
      // Add time bonus for streaks
      if (streak >= 5) {
        setTimeLeft(prev => Math.min(30, prev + 2));
      }
    } else {
      soundManager.error();
      setStreak(0);
      setTimeLeft(prev => Math.max(0, prev - 3));
    }

    generateQuestion();
  };

  // Instruction screen
  if (showInstruction) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="colorswitch-instruction">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-rose-400">تبديل الألوان</h1>
            <div className="w-10" />
          </div>

          <div className="bg-white/5 rounded-2xl p-6 text-center">
            <Zap size={60} className="mx-auto text-rose-400 mb-4" />
            <h2 className="text-2xl font-bold mb-4">كيف تلعب؟</h2>
            <div className="text-gray-400 space-y-3 text-right mb-6">
              <p>🎨 سيظهر لك اسم لون مكتوب بلون مختلف</p>
              <p>❓ السؤال سيكون: ما هو <strong>لون النص</strong>؟ أو ما هو <strong>اسم اللون</strong>؟</p>
              <p>⚡ اختر الإجابة الصحيحة بسرعة!</p>
              <p>🔥 كل 3 إجابات صحيحة متتالية = بونص!</p>
            </div>
            <button
              onClick={startGame}
              className="bg-rose-600 hover:bg-rose-700 px-8 py-4 rounded-xl font-bold text-lg w-full"
            >
              ابدأ اللعب!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game over screen
  if (gameOver) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="colorswitch-result">
        <div className="text-center">
          <Trophy size={80} className="mx-auto text-rose-400 mb-4" />
          <div className="text-5xl font-bold text-rose-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-6">نقطة</div>
          <div className="flex gap-4 justify-center">
            <button onClick={startGame} className="bg-rose-600 hover:bg-rose-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="colorswitch-game">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="colorswitch-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-rose-400">تبديل الألوان</h1>
          <button onClick={resetGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="colorswitch-reset-btn">
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-around mb-6 bg-white/5 rounded-xl p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-rose-400">{score}</div>
            <div className="text-xs text-gray-500">النقاط</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
              {timeLeft}
            </div>
            <div className="text-xs text-gray-500">الوقت</div>
          </div>
          {streak >= 2 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">🔥 {streak}</div>
              <div className="text-xs text-gray-500">متتالي</div>
            </div>
          )}
        </div>

        {/* Question */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6 text-center">
          <div className="text-sm text-gray-400 mb-4">
            {questionType === 'color' ? 'ما هو لون النص؟' : 'ما هو اسم اللون المكتوب؟'}
          </div>
          <div 
            className="text-5xl font-bold py-4"
            style={{ color: textColor.hex }}
          >
            {displayedText}
          </div>
        </div>

        {/* Answer buttons */}
        <div className="grid grid-cols-3 gap-3">
          {COLORS.map(color => (
            <button
              key={color.name}
              onClick={() => handleAnswer(color)}
              className="aspect-square rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: color.hex }}
              data-testid={`colorswitch-btn-${color.name}`}
            >
              <span className="text-white text-sm font-bold drop-shadow-lg">
                {color.arabic}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorSwitchGame;
