// Games Page - Web Version
import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== TIC TAC TOE GAME ====================
const TicTacToeGame = ({ mode, onComplete, onClose }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ player: 0, opponent: 0, draws: 0 });

  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkWinner = (squares) => {
    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.every(s => s !== null) ? 'draw' : null;
  };

  const minimax = (squares, isMax, depth = 0) => {
    const result = checkWinner(squares);
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (result === 'draw') return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          best = Math.max(best, minimax(squares, false, depth + 1));
          squares[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          best = Math.min(best, minimax(squares, true, depth + 1));
          squares[i] = null;
        }
      }
      return best;
    }
  };

  const getAIMove = (currentBoard) => {
    const empty = currentBoard.map((s, i) => s === null ? i : null).filter(i => i !== null);
    
    if (mode === 'ai_medium' && Math.random() < 0.5) {
      return empty[Math.floor(Math.random() * empty.length)];
    }
    
    let bestScore = -Infinity;
    let bestMove = empty[0];
    
    for (let i of empty) {
      currentBoard[i] = 'O';
      const score = minimax(currentBoard, false);
      currentBoard[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
    return bestMove;
  };

  const handlePress = (index) => {
    if (board[index] || gameOver || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      endGame(result);
      return;
    }

    setIsPlayerTurn(false);
    
    setTimeout(() => {
      const aiIndex = getAIMove([...newBoard]);
      if (aiIndex !== null && aiIndex !== undefined) {
        newBoard[aiIndex] = 'O';
        setBoard([...newBoard]);
        const aiResult = checkWinner(newBoard);
        if (aiResult) {
          endGame(aiResult);
        } else {
          setIsPlayerTurn(true);
        }
      }
    }, 600);
  };

  const endGame = (result) => {
    setGameOver(true);
    setWinner(result);
    
    if (result === 'X') {
      setScores(s => ({ ...s, player: s.player + 1 }));
      onComplete(mode === 'ai_hard' ? 80 : 50, 'win');
    } else if (result === 'draw') {
      setScores(s => ({ ...s, draws: s.draws + 1 }));
      onComplete(20, 'draw');
    } else {
      setScores(s => ({ ...s, opponent: s.opponent + 1 }));
      onComplete(5, 'lose');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">إكس أو</h1>
          <button onClick={resetGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Score Board */}
        <div className="flex justify-around items-center mb-8 bg-white/5 rounded-2xl p-4">
          <div className={`text-center p-3 rounded-xl ${isPlayerTurn && !gameOver ? 'bg-blue-500/20 border border-blue-500/30' : ''}`}>
            <div className="text-blue-400 text-sm">أنت</div>
            <div className="text-2xl font-bold">{scores.player}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 text-sm">تعادل</div>
            <div className="text-xl text-gray-400">{scores.draws}</div>
          </div>
          <div className={`text-center p-3 rounded-xl ${!isPlayerTurn && !gameOver ? 'bg-orange-500/20 border border-orange-500/30' : ''}`}>
            <div className="text-orange-400 text-sm">الكمبيوتر</div>
            <div className="text-2xl font-bold">{scores.opponent}</div>
          </div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl mb-6">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handlePress(idx)}
              className={`aspect-square flex items-center justify-center text-4xl font-bold rounded-xl transition-all
                ${cell ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'}
                ${cell === 'X' ? 'text-blue-400' : 'text-orange-400'}`}
            >
              {cell}
            </button>
          ))}
        </div>

        {/* Turn Indicator */}
        {!gameOver && (
          <div className="text-center text-gray-400">
            {isPlayerTurn ? 'دورك' : 'دور الكمبيوتر...'}
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="bg-white/10 rounded-2xl p-6 text-center">
            <div className={`text-5xl mb-3 ${winner === 'X' ? 'text-yellow-400' : winner === 'draw' ? 'text-gray-400' : 'text-red-400'}`}>
              {winner === 'X' ? '🏆' : winner === 'draw' ? '🤝' : '😞'}
            </div>
            <div className="text-2xl font-bold mb-4">
              {winner === 'X' ? 'فوز!' : winner === 'draw' ? 'تعادل' : 'خسارة'}
            </div>
            <button 
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
            >
              العب مجدداً
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== TRIVIA GAME ====================
const TriviaGame = ({ onComplete, onClose }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  const questions = [
    { q: 'ما هي عاصمة المملكة العربية السعودية؟', options: ['الرياض', 'جدة', 'مكة', 'الدمام'], correct: 0 },
    { q: 'كم عدد أركان الإسلام؟', options: ['3', '4', '5', '6'], correct: 2 },
    { q: 'ما هو أطول نهر في العالم؟', options: ['الأمازون', 'النيل', 'المسيسيبي', 'اليانغتسي'], correct: 1 },
    { q: 'في أي عام هبط الإنسان على القمر؟', options: ['1965', '1969', '1972', '1975'], correct: 1 },
    { q: 'ما هي أكبر قارة في العالم؟', options: ['أفريقيا', 'أمريكا الشمالية', 'آسيا', 'أوروبا'], correct: 2 },
  ];

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
      setScore(s => s + 10 + Math.floor(timeLeft / 3));
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1);
        setAnswered(null);
        setTimeLeft(15);
      } else {
        setShowResult(true);
        onComplete(score, questions.length);
      }
    }, 1500);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <div className="text-5xl font-bold text-yellow-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-6">نقطة</div>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold">
            إنهاء
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">أسئلة ثقافية</h1>
          <div className="text-yellow-400 font-bold">{score}</div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{currentQ + 1} / {questions.length}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className={`text-center mb-6 ${timeLeft <= 5 ? 'text-red-400' : 'text-blue-400'}`}>
          <span className="text-2xl font-bold">{timeLeft}</span>
        </div>

        {/* Question */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6">
          <p className="text-lg text-center">{q.q}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            let bgClass = 'bg-white/5 hover:bg-white/10';
            if (answered !== null) {
              if (idx === q.correct) bgClass = 'bg-green-500/30 border-green-500';
              else if (idx === answered) bgClass = 'bg-red-500/30 border-red-500';
            }
            
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered !== null}
                className={`w-full p-4 rounded-xl text-right transition-all border border-transparent ${bgClass}`}
              >
                <span className="inline-block w-8 h-8 rounded-full bg-white/10 text-center leading-8 ml-3">
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

// ==================== MAIN GAMES PAGE ====================
const GamesPage = ({ user, onNavigate, onPointsEarned }) => {
  const [activeGame, setActiveGame] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState({ rank: '-', points: 0, games: 0 });
  const [loading, setLoading] = useState(true);

  const games = [
    { id: 'chess', name: 'الشطرنج', icon: '♟️', colors: ['#8b5cf6', '#6d28d9'], description: 'لعبة الملوك', maxPoints: 200, online: true },
    { id: 'tictactoe', name: 'إكس أو', icon: '⭕', colors: ['#f59e0b', '#d97706'], description: 'تحدى منافسك', maxPoints: 80, online: true },
    { id: 'puzzle', name: 'تركيب الصور', icon: '🧩', colors: ['#3b82f6', '#1d4ed8'], description: 'رتب القطع', maxPoints: 150, online: false },
    { id: 'trivia', name: 'أسئلة ثقافية', icon: '❓', colors: ['#10b981', '#059669'], description: 'اختبر معلوماتك', maxPoints: 100, online: false },
    { id: 'riddles', name: 'الألغاز', icon: '💡', colors: ['#ef4444', '#dc2626'], description: 'حل الألغاز', maxPoints: 160, online: false },
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/games/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setUserStats(data.userStats || {});
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = (gameId) => {
    const game = games.find(g => g.id === gameId);
    if (game.online) {
      setShowModeSelector(gameId);
    } else {
      setActiveGame(gameId);
      setGameMode('solo');
    }
  };

  const handleModeSelect = (mode) => {
    setActiveGame(showModeSelector);
    setGameMode(mode);
    setShowModeSelector(null);
  };

  const handleGameComplete = async (points) => {
    try {
      await fetch(`${API_URL}/api/games/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameId: activeGame, points }),
      });
      if (onPointsEarned) onPointsEarned(points);
    } catch (e) {}
    
    fetchLeaderboard();
  };

  const closeGame = () => {
    setActiveGame(null);
    setGameMode(null);
  };

  // Render active game
  if (activeGame === 'tictactoe') {
    return <TicTacToeGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
  }
  if (activeGame === 'trivia') {
    return <TriviaGame onComplete={handleGameComplete} onClose={closeGame} />;
  }

  // Mode Selector
  if (showModeSelector) {
    const game = games.find(g => g.id === showModeSelector);
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" dir="rtl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setShowModeSelector(null)} className="p-2 rounded-full bg-white/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">{game?.name}</h1>
            <div className="w-10" />
          </div>

          <p className="text-center text-gray-400 mb-8">اختر نوع اللعب</p>

          <div className="space-y-4">
            <button 
              onClick={() => handleModeSelect('ai_medium')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl text-right"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">🤖</div>
                <div>
                  <div className="font-bold text-lg">كمبيوتر - متوسط</div>
                  <div className="text-green-100 text-sm">للتدريب والتعلم</div>
                </div>
              </div>
            </button>

            <button 
              onClick={() => handleModeSelect('ai_hard')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-2xl text-right"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">💀</div>
                <div>
                  <div className="font-bold text-lg">كمبيوتر - صعب</div>
                  <div className="text-red-100 text-sm">تحدٍ حقيقي</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24" dir="rtl">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold">الألعاب</h1>
        <p className="text-gray-400 mt-1">العب وتنافس واكسب النقاط</p>
      </div>

      {/* User Stats */}
      <div className="mx-6 bg-white/5 rounded-2xl p-5 mb-8">
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-yellow-400 text-2xl mb-1">🏆</div>
            <div className="text-2xl font-bold">#{userStats.rank || '-'}</div>
            <div className="text-gray-500 text-sm">ترتيبك</div>
          </div>
          <div className="h-12 w-px bg-white/10 self-center" />
          <div className="text-center">
            <div className="text-blue-400 text-2xl mb-1">💎</div>
            <div className="text-2xl font-bold">{userStats.points || 0}</div>
            <div className="text-gray-500 text-sm">نقاطك</div>
          </div>
          <div className="h-12 w-px bg-white/10 self-center" />
          <div className="text-center">
            <div className="text-green-400 text-2xl mb-1">🎮</div>
            <div className="text-2xl font-bold">{userStats.games || 0}</div>
            <div className="text-gray-500 text-sm">ألعابك</div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="px-6 mb-8">
        <h2 className="text-xl font-bold mb-4">اختر لعبة</h2>
        <div className="grid grid-cols-2 gap-4">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              className="rounded-2xl overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${game.colors[0]}, ${game.colors[1]})` }}
            >
              <div className="p-5 text-center">
                <div className="text-4xl mb-3">{game.icon}</div>
                <div className="font-bold text-lg">{game.name}</div>
                <div className="text-white/80 text-sm mb-3">{game.description}</div>
                <div className="inline-flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full text-sm">
                  💎 {game.maxPoints}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-6">
        <h2 className="text-xl font-bold mb-4">التصنيف العالمي</h2>
        <div className="bg-white/5 rounded-2xl overflow-hidden">
          {leaderboard.slice(0, 10).map((player, idx) => (
            <div 
              key={idx} 
              className={`flex items-center p-4 border-b border-white/5 ${idx < 3 ? 'bg-yellow-500/5' : ''}`}
            >
              <div className="w-10 text-center">
                {idx < 3 ? (
                  <span className={`text-xl ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : 'text-orange-400'}`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="text-gray-500">#{idx + 1}</span>
                )}
              </div>
              <div className="flex-1 mr-3">
                <div className="font-semibold">{player.name}</div>
                <div className="text-gray-500 text-sm">{player.gamesPlayed} لعبة</div>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                💎 <span className="font-bold">{player.points}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
