// Games Page - Web Version - Professional Icons
import React, { useState, useEffect } from 'react';
import { 
  Trophy, Grid3X3, Puzzle, Brain, Lightbulb, Layers,
  ArrowRight, RotateCcw, Clock, Star, Diamond, Medal,
  Gamepad2, Users, Cpu, X, ChevronLeft
} from 'lucide-react';

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
      onComplete(mode === 'ai_hard' ? 25 : 20, 'win');
    } else if (result === 'draw') {
      setScores(s => ({ ...s, draws: s.draws + 1 }));
      onComplete(10, 'draw');
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
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Grid3X3 size={24} className="text-orange-400" />
            اكس او
          </h1>
          <button onClick={resetGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <RotateCcw size={20} className="text-blue-400" />
          </button>
        </div>

        {/* Score Board */}
        <div className="flex justify-around items-center mb-8 bg-white/5 rounded-2xl p-4">
          <div className={`text-center p-3 rounded-xl ${isPlayerTurn && !gameOver ? 'bg-blue-500/20 border border-blue-500/30' : ''}`}>
            <div className="text-blue-400 text-sm">انت</div>
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
          <div className="text-center text-gray-400 flex items-center justify-center gap-2">
            {isPlayerTurn ? (
              <>
                <Users size={18} />
                <span>دورك</span>
              </>
            ) : (
              <>
                <Cpu size={18} className="animate-pulse" />
                <span>دور الكمبيوتر...</span>
              </>
            )}
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="bg-white/10 rounded-2xl p-6 text-center">
            <div className={`mb-3 ${winner === 'X' ? 'text-yellow-400' : winner === 'draw' ? 'text-gray-400' : 'text-red-400'}`}>
              {winner === 'X' ? (
                <Trophy size={60} className="mx-auto" />
              ) : winner === 'draw' ? (
                <Users size={60} className="mx-auto" />
              ) : (
                <X size={60} className="mx-auto" />
              )}
            </div>
            <div className="text-2xl font-bold mb-4">
              {winner === 'X' ? 'فوز!' : winner === 'draw' ? 'تعادل' : 'خسارة'}
            </div>
            <button 
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors"
            >
              <RotateCcw size={18} />
              العب مجددا
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
  const [timeLeft, setTimeLeft] = useState(20);

  const questions = [
    { q: 'ما هي عاصمة المملكة العربية السعودية؟', options: ['الرياض', 'جدة', 'مكة', 'الدمام'], correct: 0 },
    { q: 'كم عدد اركان الاسلام؟', options: ['3', '4', '5', '6'], correct: 2 },
    { q: 'ما هو اطول نهر في العالم؟', options: ['الامازون', 'النيل', 'المسيسيبي', 'اليانغتسي'], correct: 1 },
    { q: 'في اي عام هبط الانسان على القمر؟', options: ['1965', '1969', '1972', '1975'], correct: 1 },
    { q: 'ما هي اكبر قارة في العالم؟', options: ['افريقيا', 'امريكا الشمالية', 'اسيا', 'اوروبا'], correct: 2 },
    { q: 'من هو مؤسس الدولة السعودية الاولى؟', options: ['محمد بن سعود', 'عبدالعزيز بن عبدالرحمن', 'فيصل بن تركي', 'سعود بن عبدالعزيز'], correct: 0 },
    { q: 'ما هو العنصر الاكثر وفرة في الكون؟', options: ['الاكسجين', 'الهيدروجين', 'الكربون', 'الهيليوم'], correct: 1 },
    { q: 'كم عدد الكواكب في المجموعة الشمسية؟', options: ['7', '8', '9', '10'], correct: 1 },
    { q: 'ما هي اللغة الاكثر انتشارا في العالم؟', options: ['العربية', 'الانجليزية', 'الصينية', 'الاسبانية'], correct: 2 },
    { q: 'من اكتشف الجاذبية الارضية؟', options: ['اينشتاين', 'نيوتن', 'غاليليو', 'كوبرنيكوس'], correct: 1 },
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
      setScore(s => s + 10 + Math.floor(timeLeft / 4));
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1);
        setAnswered(null);
        setTimeLeft(20);
      } else {
        setShowResult(true);
        onComplete(score, 'win');
      }
    }, 1500);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Trophy size={80} className="mx-auto text-yellow-400 mb-4" />
          <div className="text-5xl font-bold text-yellow-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-6">نقطة</div>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold transition-colors">
            انهاء
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
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain size={24} className="text-green-400" />
            اسئلة ثقافية
          </h1>
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <Star size={18} />
            {score}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{currentQ + 1} / {questions.length}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center justify-center gap-2 mb-6 ${timeLeft <= 5 ? 'text-red-400' : 'text-blue-400'}`}>
          <Clock size={20} />
          <span className="text-2xl font-bold">{timeLeft}</span>
        </div>

        {/* Question */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
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
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-center ml-3">
                  {['ا', 'ب', 'ج', 'د'][idx]}
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

// ==================== RIDDLES GAME ====================
const RiddlesGame = ({ onComplete, onClose }) => {
  const [currentR, setCurrentR] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const riddles = [
    { q: 'شيء له رأس ولا عين له، ما هو؟', options: ['الدبوس', 'القلم', 'المسمار', 'الابرة'], correct: 0 },
    { q: 'ما هو الشيء الذي كلما زاد نقص؟', options: ['العمر', 'المال', 'الوقت', 'الماء'], correct: 0 },
    { q: 'شيء يمشي بلا أرجل ويبكي بلا عيون؟', options: ['السحاب', 'الريح', 'النهر', 'الشمعة'], correct: 0 },
    { q: 'ما هو الشيء الذي يسمع بلا أذن ويتكلم بلا لسان؟', options: ['الهاتف', 'الراديو', 'التلفاز', 'الكتاب'], correct: 0 },
    { q: 'أنا ابن الماء فإن تركوني في الماء مت، فمن أنا؟', options: ['الثلج', 'السمك', 'الملح', 'السكر'], correct: 0 },
    { q: 'ما الشيء الذي له أسنان ولا يعض؟', options: ['المشط', 'المنشار', 'الشوكة', 'المفتاح'], correct: 0 },
    { q: 'شيء موجود في السماء وإذا أضفت إليه حرفا أصبح في الأرض؟', options: ['نجم/منجم', 'قمر/مقر', 'شمس/شمس', 'سحاب/سحاب'], correct: 0 },
    { q: 'ما هو الشيء الذي يكتب ولا يقرأ؟', options: ['القلم', 'الممحاة', 'الكتاب', 'الورقة'], correct: 0 },
    { q: 'له أوراق وما هو بنبات، له جلد وما هو بحيوان، وعلم وما هو بإنسان؟', options: ['الكتاب', 'الشجرة', 'الحيوان', 'الانسان'], correct: 0 },
    { q: 'ما هو الشيء الذي إذا أخذنا منه ازداد وكبر؟', options: ['الحفرة', 'البئر', 'الجبل', 'النهر'], correct: 0 },
  ];

  const handleAnswer = (idx) => {
    if (answered !== null) return;
    setAnswered(idx);
    
    if (idx === riddles[currentR].correct) {
      setScore(s => s + 15);
    }

    setTimeout(() => {
      if (currentR < riddles.length - 1) {
        setCurrentR(c => c + 1);
        setAnswered(null);
      } else {
        setShowResult(true);
        onComplete(score, 'win');
      }
    }, 1500);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Lightbulb size={80} className="mx-auto text-yellow-400 mb-4" />
          <div className="text-5xl font-bold text-yellow-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-6">نقطة</div>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold transition-colors">
            انهاء
          </button>
        </div>
      </div>
    );
  }

  const r = riddles[currentR];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Lightbulb size={24} className="text-red-400" />
            الالغاز
          </h1>
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <Star size={18} />
            {score}
          </div>
        </div>

        <div className="mb-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${((currentR + 1) / riddles.length) * 100}%` }}
            />
          </div>
          <div className="text-center text-gray-400 text-sm mt-2">{currentR + 1} / {riddles.length}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 mb-6">
          <p className="text-lg text-center">{r.q}</p>
        </div>

        <div className="space-y-3">
          {r.options.map((opt, idx) => {
            let bgClass = 'bg-white/5 hover:bg-white/10 border-transparent';
            if (answered !== null) {
              if (idx === r.correct) bgClass = 'bg-green-500/30 border-green-500';
              else if (idx === answered) bgClass = 'bg-red-500/30 border-red-500';
            }
            
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered !== null}
                className={`w-full p-4 rounded-xl text-right transition-all border ${bgClass}`}
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

// ==================== PUZZLE GAME ====================
const PuzzleGame = ({ onComplete, onClose }) => {
  const [tiles, setTiles] = useState([]);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, null];
    const shuffled = shuffleArray([...numbers]);
    setTiles(shuffled);
    setMoves(0);
    setSolved(false);
    setStartTime(Date.now());
  };

  const shuffleArray = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const canMove = (idx) => {
    const emptyIdx = tiles.indexOf(null);
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const emptyRow = Math.floor(emptyIdx / 3);
    const emptyCol = emptyIdx % 3;
    
    return (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1;
  };

  const moveTile = (idx) => {
    if (!canMove(idx) || solved) return;
    
    const newTiles = [...tiles];
    const emptyIdx = tiles.indexOf(null);
    [newTiles[idx], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[idx]];
    setTiles(newTiles);
    setMoves(m => m + 1);

    // Check if solved
    const isSolved = newTiles.slice(0, 8).every((t, i) => t === i + 1) && newTiles[8] === null;
    if (isSolved) {
      setSolved(true);
      const timeBonus = Math.max(0, 30 - Math.floor((Date.now() - startTime) / 1000));
      const moveBonus = Math.max(0, 50 - moves);
      onComplete(20 + timeBonus + moveBonus, 'win');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Puzzle size={24} className="text-blue-400" />
            تركيب الصور
          </h1>
          <button onClick={initGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <RotateCcw size={20} className="text-blue-400" />
          </button>
        </div>

        <div className="text-center mb-4 text-gray-400">
          الحركات: {moves}
        </div>

        <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl mb-6">
          {tiles.map((tile, idx) => (
            <button
              key={idx}
              onClick={() => moveTile(idx)}
              disabled={tile === null || solved}
              className={`aspect-square flex items-center justify-center text-2xl font-bold rounded-xl transition-all
                ${tile === null ? 'bg-transparent' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              {tile}
            </button>
          ))}
        </div>

        {solved && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
            <Trophy size={60} className="mx-auto text-yellow-400 mb-4" />
            <div className="text-2xl font-bold text-green-400 mb-2">ممتاز!</div>
            <div className="text-gray-400 mb-4">اكملت اللغز في {moves} حركة</div>
            <button 
              onClick={initGame}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              العب مجددا
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== BRICK BREAKER GAME ====================
const BrickBreakerGame = ({ onComplete, onClose }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [bricks, setBricks] = useState([]);
  const [ballPos, setBallPos] = useState({ x: 50, y: 80 });
  const [paddlePos, setPaddlePos] = useState(50);
  const [ballDir, setBallDir] = useState({ x: 2, y: -2 });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initBricks();
  }, []);

  const initBricks = () => {
    const newBricks = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        newBricks.push({
          id: row * 6 + col,
          x: col * 16 + 2,
          y: row * 8 + 5,
          active: true,
          color: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][row]
        });
      }
    }
    setBricks(newBricks);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setBallPos({ x: 50, y: 80 });
    setBallDir({ x: 2, y: -2 });
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const interval = setInterval(() => {
      setBallPos(prev => {
        let newX = prev.x + ballDir.x;
        let newY = prev.y + ballDir.y;
        let newDirX = ballDir.x;
        let newDirY = ballDir.y;

        // Wall collision
        if (newX <= 0 || newX >= 100) newDirX = -newDirX;
        if (newY <= 0) newDirY = -newDirY;

        // Paddle collision
        if (newY >= 85 && newY <= 90 && Math.abs(newX - paddlePos) < 10) {
          newDirY = -Math.abs(newDirY);
          newDirX = (newX - paddlePos) / 5;
        }

        // Ball lost
        if (newY > 95) {
          setLives(l => {
            if (l <= 1) {
              setGameOver(true);
              setIsPlaying(false);
              onComplete(score, 'lose');
              return 0;
            }
            return l - 1;
          });
          return { x: 50, y: 80 };
        }

        // Brick collision
        setBricks(currentBricks => {
          const newBricks = [...currentBricks];
          for (let brick of newBricks) {
            if (brick.active && 
                newX >= brick.x && newX <= brick.x + 14 &&
                newY >= brick.y && newY <= brick.y + 6) {
              brick.active = false;
              newDirY = -newDirY;
              setScore(s => s + 10);
              
              // Check win
              if (newBricks.filter(b => b.active).length === 0) {
                setGameOver(true);
                setIsPlaying(false);
                onComplete(score + 50, 'win');
              }
              break;
            }
          }
          return newBricks;
        });

        setBallDir({ x: newDirX, y: newDirY });
        return { x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, paddlePos, ballDir, score]);

  const handleTouch = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) / rect.width * 100;
    setPaddlePos(Math.max(10, Math.min(90, x)));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Layers size={20} className="text-pink-400" />
            تكسير الطوب
          </h1>
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <Star size={16} />
            {score}
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <div className="text-pink-400 text-sm">الحياة: {'❤️'.repeat(lives)}</div>
        </div>

        <div 
          className="relative bg-gradient-to-b from-purple-900/50 to-pink-900/50 rounded-2xl overflow-hidden border border-white/10"
          style={{ height: '400px' }}
          onMouseMove={handleTouch}
          onTouchMove={handleTouch}
          onClick={() => !isPlaying && !gameOver && setIsPlaying(true)}
        >
          {/* Bricks */}
          {bricks.map(brick => brick.active && (
            <div
              key={brick.id}
              className={`absolute rounded ${brick.color}`}
              style={{
                left: `${brick.x}%`,
                top: `${brick.y}%`,
                width: '14%',
                height: '6%'
              }}
            />
          ))}

          {/* Ball */}
          <div
            className="absolute w-3 h-3 bg-white rounded-full"
            style={{
              left: `${ballPos.x}%`,
              top: `${ballPos.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />

          {/* Paddle */}
          <div
            className="absolute bg-blue-500 rounded-full"
            style={{
              left: `${paddlePos}%`,
              top: '88%',
              width: '20%',
              height: '3%',
              transform: 'translateX(-50%)'
            }}
          />

          {/* Start/Game Over Overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                {gameOver ? (
                  <>
                    <div className="text-2xl font-bold mb-2">{lives === 0 ? 'انتهت اللعبة' : 'فوز!'}</div>
                    <div className="text-yellow-400 text-xl mb-4">النقاط: {score}</div>
                    <button 
                      onClick={initBricks}
                      className="bg-pink-600 hover:bg-pink-700 px-6 py-2 rounded-xl font-semibold"
                    >
                      العب مجددا
                    </button>
                  </>
                ) : (
                  <div className="text-xl">انقر للبدء</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== CHESS GAME (Simple) ====================
const ChessGame = ({ mode, onComplete, onClose }) => {
  const [message, setMessage] = useState('');
  
  // Simple placeholder for chess - would need full implementation
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy size={24} className="text-purple-400" />
            الشطرنج
          </h1>
          <div className="w-10" />
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-8 text-center">
          <Trophy size={80} className="mx-auto text-purple-400 mb-6" />
          <h2 className="text-2xl font-bold mb-4">لعبة الشطرنج</h2>
          <p className="text-gray-400 mb-6">
            هذه اللعبة قيد التطوير وستكون متاحة قريباً مع ميزات متقدمة
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => {
                onComplete(15, 'win');
                onClose();
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              احصل على نقاط المشاركة
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              العودة للقائمة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== GAME ICONS MAP ====================
const gameIcons = {
  chess: Trophy,
  tictactoe: Grid3X3,
  brickbreaker: Layers,
  puzzle: Puzzle,
  trivia: Brain,
  riddles: Lightbulb,
};

// ==================== MAIN GAMES PAGE ====================
const GamesPage = ({ user, onNavigate, onPointsEarned }) => {
  const [activeGame, setActiveGame] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [balance, setBalance] = useState({ saqr_points: 0, diamonds: 300, daily_points_remaining: 150 });
  const [loading, setLoading] = useState(true);

  const games = [
    { id: 'chess', name: 'الشطرنج', colors: ['#8b5cf6', '#6d28d9'], description: 'لعبة الملوك', maxPoints: 25, online: true, onlineCost: 30 },
    { id: 'tictactoe', name: 'اكس او', colors: ['#f59e0b', '#d97706'], description: 'تحدى منافسك', maxPoints: 20, online: true, onlineCost: 20 },
    { id: 'brickbreaker', name: 'تكسير الطوب', colors: ['#ec4899', '#db2777'], description: 'كسر كل الطوب', maxPoints: 20, online: false },
    { id: 'puzzle', name: 'تركيب الصور', colors: ['#3b82f6', '#1d4ed8'], description: 'رتب القطع', maxPoints: 20, online: true, onlineCost: 25 },
    { id: 'trivia', name: 'اسئلة ثقافية', colors: ['#10b981', '#059669'], description: 'اختبر معلوماتك', maxPoints: 25, online: false },
    { id: 'riddles', name: 'الالغاز', colors: ['#ef4444', '#dc2626'], description: 'حل الالغاز', maxPoints: 20, online: false },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lbRes, balRes] = await Promise.all([
        fetch(`${API_URL}/api/economy/leaderboard`),
        user?.id ? fetch(`${API_URL}/api/economy/balance/${user.id}`) : null
      ]);
      
      if (lbRes.ok) {
        const data = await lbRes.json();
        setLeaderboard(data.leaderboard || []);
      }
      
      if (balRes?.ok) {
        const data = await balRes.json();
        setBalance(data);
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
      await fetch(`${API_URL}/api/economy/game-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          user_id: user?.id, 
          game_id: activeGame, 
          is_online: false, 
          won: true,
          opponent_diamonds: 0
        }),
      });
      if (onPointsEarned) onPointsEarned(points);
    } catch (e) {
      console.log(e);
    }
    
    fetchData();
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
  if (activeGame === 'riddles') {
    return <RiddlesGame onComplete={handleGameComplete} onClose={closeGame} />;
  }
  if (activeGame === 'puzzle') {
    return <PuzzleGame onComplete={handleGameComplete} onClose={closeGame} />;
  }
  if (activeGame === 'brickbreaker') {
    return <BrickBreakerGame onComplete={handleGameComplete} onClose={closeGame} />;
  }
  if (activeGame === 'chess') {
    return <ChessGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
  }

  // Mode Selector
  if (showModeSelector) {
    const game = games.find(g => g.id === showModeSelector);
    const GameIcon = gameIcons[showModeSelector] || Gamepad2;
    
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" dir="rtl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setShowModeSelector(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <X size={24} />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <GameIcon size={24} style={{ color: game?.colors[0] }} />
              {game?.name}
            </h1>
            <div className="w-10" />
          </div>

          <p className="text-center text-gray-400 mb-8">اختر نوع اللعب</p>

          <div className="space-y-4">
            <button 
              onClick={() => handleModeSelect('ai_medium')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl text-right hover:from-green-400 hover:to-green-500 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Cpu size={28} />
                </div>
                <div>
                  <div className="font-bold text-lg">كمبيوتر - متوسط</div>
                  <div className="text-green-100 text-sm">للتدريب والتعلم</div>
                </div>
              </div>
            </button>

            <button 
              onClick={() => handleModeSelect('ai_hard')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-2xl text-right hover:from-red-400 hover:to-red-500 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Trophy size={28} />
                </div>
                <div>
                  <div className="font-bold text-lg">كمبيوتر - صعب</div>
                  <div className="text-red-100 text-sm">تحد حقيقي</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find user rank
  const userRank = leaderboard.findIndex(l => l.user_id === user?.id);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24" dir="rtl">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gamepad2 size={28} className="text-lime-400" />
          الالعاب
        </h1>
        <p className="text-gray-400 mt-1 text-sm">العب وتنافس واكسب النقاط</p>
      </div>

      {/* Daily Progress */}
      <div className="mx-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-green-400" />
          <span className="text-green-400 text-sm font-semibold">النقاط اليومية</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, ((150 - balance.daily_points_remaining) / 150) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-green-400 font-semibold">{150 - balance.daily_points_remaining} / 150</span>
          <span className="text-gray-500">متبقي: {balance.daily_points_remaining}</span>
        </div>
      </div>

      {/* User Stats */}
      <div className="mx-6 bg-white/5 rounded-2xl p-4 mb-6">
        <div className="flex justify-around">
          <div className="text-center">
            <Medal size={24} className="mx-auto text-yellow-400 mb-1" />
            <div className="text-xl font-bold">#{userRank >= 0 ? userRank + 1 : '-'}</div>
            <div className="text-gray-500 text-xs">ترتيبك</div>
          </div>
          <div className="h-12 w-px bg-white/10 self-center" />
          <div className="text-center">
            <Star size={24} className="mx-auto text-yellow-400 mb-1" />
            <div className="text-xl font-bold">{balance.saqr_points || 0}</div>
            <div className="text-gray-500 text-xs">نقاط صقر</div>
          </div>
          <div className="h-12 w-px bg-white/10 self-center" />
          <div className="text-center">
            <Diamond size={24} className="mx-auto text-blue-400 mb-1" />
            <div className="text-xl font-bold">{balance.diamonds || 0}</div>
            <div className="text-gray-500 text-xs">الماسات</div>
          </div>
        </div>
      </div>

      {/* Exchange Info */}
      <div className="mx-6 mb-6 flex items-center justify-center gap-2 text-green-400 text-sm">
        <Star size={14} />
        <span>500 نقطة صقر = 1 دولار</span>
      </div>

      {/* Games Grid */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Gamepad2 size={20} />
          اختر لعبة
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {games.map(game => {
            const GameIcon = gameIcons[game.id] || Gamepad2;
            return (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${game.colors[0]}, ${game.colors[1]})` }}
              >
                <div className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
                    <GameIcon size={24} />
                  </div>
                  <div className="font-bold">{game.name}</div>
                  <div className="text-white/80 text-xs mb-2">{game.description}</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="inline-flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full text-xs">
                      <Star size={10} />
                      +{game.maxPoints}
                    </div>
                    {game.online && (
                      <div className="inline-flex items-center gap-1 bg-blue-500/30 px-2 py-0.5 rounded-full text-xs">
                        <Diamond size={10} />
                        {game.onlineCost}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Rewards */}
      <div className="mx-6 mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={18} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold text-sm">مكافات المتصدرين</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Medal size={16} className="text-yellow-400" />
            <span className="text-white/80">المركز الاول: 3000 نقطة</span>
          </div>
          <div className="flex items-center gap-2">
            <Medal size={16} className="text-gray-400" />
            <span className="text-white/80">المركز الثاني: 1900 نقطة</span>
          </div>
          <div className="flex items-center gap-2">
            <Medal size={16} className="text-orange-400" />
            <span className="text-white/80">المركز الثالث: 1000 نقطة</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          التصنيف العالمي
        </h2>
        <div className="bg-white/5 rounded-2xl overflow-hidden">
          {leaderboard.slice(0, 10).map((player, idx) => (
            <div 
              key={idx} 
              className={`flex items-center p-3 border-b border-white/5 ${idx < 3 ? 'bg-yellow-500/5' : ''}`}
            >
              <div className="w-10 text-center">
                {idx < 3 ? (
                  <Medal 
                    size={22} 
                    className={idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : 'text-orange-400'} 
                  />
                ) : (
                  <span className="text-gray-500 text-sm">#{idx + 1}</span>
                )}
              </div>
              <div className="flex-1 mr-3">
                <div className="font-semibold text-sm">{player.name}</div>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={14} />
                <span className="font-bold text-sm">{player.saqr_points}</span>
              </div>
            </div>
          ))}
          
          {leaderboard.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Trophy size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا يوجد لاعبون بعد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
