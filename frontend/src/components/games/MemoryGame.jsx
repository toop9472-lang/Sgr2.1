// Memory Game Component - Web Version
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Brain, RotateCcw, Trophy, Clock, Star, Zap } from 'lucide-react';
import soundManager from '../../utils/soundManager';

// Card symbols with colors
const SYMBOLS = [
  { emoji: '🎮', color: '#ef4444' },
  { emoji: '🎯', color: '#f97316' },
  { emoji: '🎲', color: '#fbbf24' },
  { emoji: '🎪', color: '#22c55e' },
  { emoji: '🎨', color: '#3b82f6' },
  { emoji: '🎭', color: '#8b5cf6' },
  { emoji: '🎵', color: '#ec4899' },
  { emoji: '🎬', color: '#06b6d4' },
  { emoji: '⚽', color: '#84cc16' },
  { emoji: '🏀', color: '#f97316' },
  { emoji: '🎾', color: '#eab308' },
  { emoji: '🎱', color: '#1f2937' },
];

const MemoryGame = ({ mode, onComplete, onClose }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [combo, setCombo] = useState(0);
  const timerRef = useRef(null);

  // Initialize game
  useEffect(() => {
    initGame();
    return () => clearInterval(timerRef.current);
  }, []);

  const initGame = () => {
    const pairs = 8; // 16 cards (4x4 grid)
    const selectedSymbols = SYMBOLS.slice(0, pairs);
    const cardPairs = [...selectedSymbols, ...selectedSymbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        ...symbol,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(cardPairs);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setGameOver(false);
    setTimer(0);
    setIsPlaying(false);
    setCombo(0);
  };

  // Timer
  useEffect(() => {
    if (isPlaying && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, gameOver]);

  // Check for matches
  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.emoji === secondCard.emoji) {
        // Match found
        soundManager.success();
        setMatched(prev => [...prev, first, second]);
        setScore(prev => prev + 100 + (combo * 50));
        setCombo(prev => prev + 1);
        setFlipped([]);

        // Check for game completion
        if (matched.length + 2 === cards.length) {
          clearInterval(timerRef.current);
          setGameOver(true);
          soundManager.win();
          const finalScore = score + 100 + (combo * 50);
          const timeBonus = Math.max(0, 200 - timer);
          onComplete(Math.floor((finalScore + timeBonus) / 10), 'win');
        }
      } else {
        // No match
        soundManager.error();
        setCombo(0);
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flipped]);

  const handleCardClick = (index) => {
    if (!isPlaying) setIsPlaying(true);
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    soundManager.click();
    setFlipped(prev => [...prev, index]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="memory-result">
        <div className="text-center">
          <Trophy size={80} className="mx-auto text-yellow-400 mb-4" />
          <div className="text-5xl font-bold text-yellow-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-2">نقطة</div>
          <div className="text-sm text-gray-500 mb-6">
            الوقت: {formatTime(timer)} | الحركات: {moves}
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={initGame} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
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
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="memory-game">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="memory-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain size={24} className="text-teal-400" />
            لعبة الذاكرة
          </h1>
          <button onClick={initGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="memory-reset-btn">
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-around mb-6 bg-white/5 rounded-xl p-3">
          <div className="text-center">
            <Clock size={18} className="mx-auto text-blue-400 mb-1" />
            <div className="text-lg font-bold">{formatTime(timer)}</div>
            <div className="text-xs text-gray-500">الوقت</div>
          </div>
          <div className="text-center">
            <Star size={18} className="mx-auto text-yellow-400 mb-1" />
            <div className="text-lg font-bold">{score}</div>
            <div className="text-xs text-gray-500">النقاط</div>
          </div>
          <div className="text-center">
            <Zap size={18} className="mx-auto text-orange-400 mb-1" />
            <div className="text-lg font-bold">{moves}</div>
            <div className="text-xs text-gray-500">الحركات</div>
          </div>
          {combo > 1 && (
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">x{combo}</div>
              <div className="text-xs text-gray-500">كومبو</div>
            </div>
          )}
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-4 gap-2 bg-white/5 p-3 rounded-xl">
          {cards.map((card, index) => {
            const isFlippedOrMatched = flipped.includes(index) || matched.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleCardClick(index)}
                disabled={isFlippedOrMatched}
                className={`aspect-square rounded-xl flex items-center justify-center text-3xl transition-all duration-300 transform ${
                  isFlippedOrMatched 
                    ? 'bg-white/20 scale-100' 
                    : 'bg-gradient-to-br from-teal-500/20 to-blue-500/20 hover:from-teal-500/30 hover:to-blue-500/30 scale-100 hover:scale-105'
                } ${matched.includes(index) ? 'opacity-50' : ''}`}
                data-testid={`memory-card-${index}`}
              >
                {isFlippedOrMatched ? (
                  <span style={{ color: card.color }}>{card.emoji}</span>
                ) : (
                  <span className="text-white/20">?</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>التقدم</span>
            <span>{matched.length / 2} / {cards.length / 2}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all"
              style={{ width: `${(matched.length / cards.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryGame;
