// Games Page - Professional Version with All Features
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, Grid3X3, Puzzle, Brain, Lightbulb, Layers,
  RotateCcw, Clock, Star, Diamond, Medal, Gamepad2, 
  Users, Cpu, X, ChevronLeft, Zap, Eye, Wifi, Crown,
  HelpCircle, Play, Pause, Volume2, VolumeX, Target,
  Sparkles, Gift, Lock, Unlock, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, RefreshCw, Award, Flame
} from 'lucide-react';
import { triviaQuestions, riddles, puzzleImages, INITIAL_CHESS_BOARD } from '../data/gameData';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== CHESS GAME (Real Implementation) ====================
const ChessGame = ({ mode, onComplete, onClose, userDiamonds, onUseDiamonds }) => {
  const [board, setBoard] = useState(JSON.parse(JSON.stringify(INITIAL_CHESS_BOARD)));
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [turn, setTurn] = useState('white');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [moveHistory, setMoveHistory] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [hintMove, setHintMove] = useState(null);

  const pieceSymbols = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  const isWhitePiece = (piece) => piece && piece === piece.toUpperCase();
  const isBlackPiece = (piece) => piece && piece === piece.toLowerCase();

  const getValidMoves = (row, col, piece) => {
    const moves = [];
    const isWhite = isWhitePiece(piece);
    const pieceType = piece.toLowerCase();

    const addMove = (r, c) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = board[r][c];
        if (!target || (isWhite ? isBlackPiece(target) : isWhitePiece(target))) {
          moves.push([r, c]);
          return !target;
        }
      }
      return false;
    };

    switch (pieceType) {
      case 'p':
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        if (!board[row + direction]?.[col]) {
          moves.push([row + direction, col]);
          if (row === startRow && !board[row + 2 * direction]?.[col]) {
            moves.push([row + 2 * direction, col]);
          }
        }
        [-1, 1].forEach(dc => {
          const target = board[row + direction]?.[col + dc];
          if (target && (isWhite ? isBlackPiece(target) : isWhitePiece(target))) {
            moves.push([row + direction, col + dc]);
          }
        });
        break;
      case 'r':
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr, dc]) => {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr*i, col + dc*i)) break;
          }
        });
        break;
      case 'n':
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
          addMove(row + dr, col + dc);
        });
        break;
      case 'b':
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr, dc]) => {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr*i, col + dc*i)) break;
          }
        });
        break;
      case 'q':
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr, dc]) => {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr*i, col + dc*i)) break;
          }
        });
        break;
      case 'k':
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr, dc]) => {
          addMove(row + dr, col + dc);
        });
        break;
    }
    return moves;
  };

  const handleCellClick = (row, col) => {
    if (gameOver) return;
    
    const piece = board[row][col];
    
    if (selectedPiece) {
      const [selRow, selCol] = selectedPiece;
      const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
      
      if (isValidMove) {
        const newBoard = board.map(r => [...r]);
        const captured = newBoard[row][col];
        newBoard[row][col] = newBoard[selRow][selCol];
        newBoard[selRow][selCol] = null;
        
        if (captured) {
          const capColor = isWhitePiece(captured) ? 'white' : 'black';
          setCapturedPieces(prev => ({
            ...prev,
            [capColor]: [...prev[capColor], captured]
          }));
          
          if (captured.toLowerCase() === 'k') {
            setGameOver(true);
            setWinner(turn);
            onComplete(turn === 'white' ? 30 : 10, turn === 'white' ? 'win' : 'lose');
          }
        }
        
        setBoard(newBoard);
        setMoveHistory(prev => [...prev, { from: [selRow, selCol], to: [row, col], piece: board[selRow][selCol] }]);
        setTurn(turn === 'white' ? 'black' : 'white');
        setSelectedPiece(null);
        setValidMoves([]);
        
        // AI move
        if (mode !== 'online' && !gameOver) {
          setTimeout(() => makeAIMove(newBoard), 500);
        }
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    } else if (piece && ((turn === 'white' && isWhitePiece(piece)) || (turn === 'black' && isBlackPiece(piece)))) {
      if (turn === 'white') {
        setSelectedPiece([row, col]);
        setValidMoves(getValidMoves(row, col, piece));
      }
    }
  };

  const makeAIMove = (currentBoard) => {
    if (gameOver) return;
    
    const blackPieces = [];
    currentBoard.forEach((row, r) => {
      row.forEach((piece, c) => {
        if (isBlackPiece(piece)) {
          blackPieces.push({ piece, row: r, col: c });
        }
      });
    });

    let bestMove = null;
    let bestScore = -Infinity;
    
    blackPieces.forEach(({ piece, row, col }) => {
      const moves = getValidMoves(row, col, piece);
      moves.forEach(([toRow, toCol]) => {
        const target = currentBoard[toRow][toCol];
        let score = Math.random() * 10;
        if (target) {
          const values = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 100 };
          score += values[target.toLowerCase()] * 10;
        }
        if (mode === 'ai_hard') {
          score += (4 - Math.abs(toRow - 4)) + (4 - Math.abs(toCol - 4));
        }
        if (score > bestScore) {
          bestScore = score;
          bestMove = { from: [row, col], to: [toRow, toCol], piece };
        }
      });
    });

    if (bestMove) {
      const newBoard = currentBoard.map(r => [...r]);
      const captured = newBoard[bestMove.to[0]][bestMove.to[1]];
      newBoard[bestMove.to[0]][bestMove.to[1]] = newBoard[bestMove.from[0]][bestMove.from[1]];
      newBoard[bestMove.from[0]][bestMove.from[1]] = null;
      
      if (captured) {
        setCapturedPieces(prev => ({
          ...prev,
          white: [...prev.white, captured]
        }));
        if (captured.toLowerCase() === 'k') {
          setGameOver(true);
          setWinner('black');
          onComplete(5, 'lose');
        }
      }
      
      setBoard(newBoard);
      setTurn('white');
    }
  };

  const getHint = () => {
    if (userDiamonds < 2) return;
    onUseDiamonds(2);
    
    const whitePieces = [];
    board.forEach((row, r) => {
      row.forEach((piece, c) => {
        if (isWhitePiece(piece)) {
          whitePieces.push({ piece, row: r, col: c });
        }
      });
    });

    let bestMove = null;
    let bestScore = -Infinity;
    
    whitePieces.forEach(({ piece, row, col }) => {
      const moves = getValidMoves(row, col, piece);
      moves.forEach(([toRow, toCol]) => {
        const target = board[toRow][toCol];
        let score = Math.random() * 5;
        if (target) {
          const values = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 100 };
          score += values[target.toLowerCase()] * 10;
        }
        if (score > bestScore) {
          bestScore = score;
          bestMove = { from: [row, col], to: [toRow, toCol] };
        }
      });
    });

    if (bestMove) {
      setHintMove(bestMove);
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3000);
    }
  };

  const resetGame = () => {
    setBoard(JSON.parse(JSON.stringify(INITIAL_CHESS_BOARD)));
    setSelectedPiece(null);
    setValidMoves([]);
    setTurn('white');
    setGameOver(false);
    setWinner(null);
    setCapturedPieces({ white: [], black: [] });
    setMoveHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Crown size={24} className="text-purple-400" />
            الشطرنج
          </h1>
          <button onClick={resetGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Captured pieces */}
        <div className="flex justify-between mb-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">أسير:</span>
            <span>{capturedPieces.black.map(p => pieceSymbols[p]).join('')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{capturedPieces.white.map(p => pieceSymbols[p]).join('')}</span>
            <span className="text-gray-400">:أسير</span>
          </div>
        </div>

        {/* Turn indicator */}
        <div className={`text-center mb-2 py-2 rounded-lg ${turn === 'white' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'}`}>
          {turn === 'white' ? 'دورك (الأبيض)' : 'دور الخصم (الأسود)'}
        </div>

        {/* Chess Board */}
        <div className="aspect-square bg-gradient-to-br from-amber-900 to-amber-800 rounded-lg p-1 mb-4">
          <div className="grid grid-cols-8 gap-0 h-full">
            {board.map((row, r) => 
              row.map((piece, c) => {
                const isLight = (r + c) % 2 === 0;
                const isSelected = selectedPiece && selectedPiece[0] === r && selectedPiece[1] === c;
                const isValidMove = validMoves.some(([vr, vc]) => vr === r && vc === c);
                const isHint = showHint && hintMove && 
                  ((hintMove.from[0] === r && hintMove.from[1] === c) || 
                   (hintMove.to[0] === r && hintMove.to[1] === c));
                
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`relative flex items-center justify-center text-2xl md:text-3xl font-bold transition-all
                      ${isLight ? 'bg-amber-200' : 'bg-amber-700'}
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                      ${isHint ? 'ring-2 ring-green-500 animate-pulse' : ''}`}
                  >
                    {isValidMove && (
                      <div className={`absolute w-3 h-3 rounded-full ${piece ? 'ring-2 ring-red-500 bg-transparent' : 'bg-green-500/50'}`} />
                    )}
                    {piece && (
                      <span className={isWhitePiece(piece) ? 'text-white drop-shadow-lg' : 'text-gray-900'}>
                        {pieceSymbols[piece]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Hint button */}
        <button
          onClick={getHint}
          disabled={userDiamonds < 2}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 py-3 rounded-xl mb-4"
        >
          <HelpCircle size={20} />
          <span>تلميح</span>
          <Diamond size={16} />
          <span>2</span>
        </button>

        {/* Game Over */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#1a1a2e] rounded-2xl p-8 text-center max-w-sm mx-4">
              <Trophy size={80} className={`mx-auto mb-4 ${winner === 'white' ? 'text-yellow-400' : 'text-gray-400'}`} />
              <h2 className="text-2xl font-bold mb-2">{winner === 'white' ? 'فوز!' : 'خسارة'}</h2>
              <p className="text-gray-400 mb-6">{winner === 'white' ? 'أحسنت! لقد فزت' : 'حظ أوفر في المرة القادمة'}</p>
              <div className="flex gap-3">
                <button onClick={resetGame} className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl">
                  العب مجدداً
                </button>
                <button onClick={onClose} className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl">
                  خروج
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== TIC TAC TOE GAME ====================
const TicTacToeGame = ({ mode, onComplete, onClose }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ player: 0, opponent: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState(null);

  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkWinner = (squares) => {
    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: pattern };
      }
    }
    return squares.every(s => s !== null) ? { winner: 'draw', line: null } : null;
  };

  const minimax = (squares, isMax, depth = 0) => {
    const result = checkWinner(squares);
    if (result?.winner === 'O') return 10 - depth;
    if (result?.winner === 'X') return depth - 10;
    if (result?.winner === 'draw') return 0;

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
    if (mode === 'ai_medium' && Math.random() < 0.4) {
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
    setWinner(result.winner);
    setWinningLine(result.line);
    if (result.winner === 'X') {
      setScores(s => ({ ...s, player: s.player + 1 }));
      onComplete(mode === 'ai_hard' ? 25 : 20, 'win');
    } else if (result.winner === 'draw') {
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
    setWinningLine(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Grid3X3 size={24} className="text-orange-400" />
            اكس او
          </h1>
          <button onClick={resetGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <RotateCcw size={20} className="text-blue-400" />
          </button>
        </div>

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

        <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl mb-6">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handlePress(idx)}
              className={`aspect-square flex items-center justify-center text-4xl font-bold rounded-xl transition-all
                ${cell ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'}
                ${cell === 'X' ? 'text-blue-400' : 'text-orange-400'}
                ${winningLine?.includes(idx) ? 'ring-2 ring-yellow-400 bg-yellow-400/20' : ''}`}
            >
              {cell}
            </button>
          ))}
        </div>

        {!gameOver && (
          <div className="text-center text-gray-400 flex items-center justify-center gap-2">
            {isPlayerTurn ? (
              <><Users size={18} /><span>دورك</span></>
            ) : (
              <><Cpu size={18} className="animate-pulse" /><span>دور الكمبيوتر...</span></>
            )}
          </div>
        )}

        {gameOver && (
          <div className="bg-white/10 rounded-2xl p-6 text-center">
            <div className={`mb-3 ${winner === 'X' ? 'text-yellow-400' : winner === 'draw' ? 'text-gray-400' : 'text-red-400'}`}>
              {winner === 'X' ? <Trophy size={60} className="mx-auto" /> : winner === 'draw' ? <Users size={60} className="mx-auto" /> : <X size={60} className="mx-auto" />}
            </div>
            <div className="text-2xl font-bold mb-4">
              {winner === 'X' ? 'فوز!' : winner === 'draw' ? 'تعادل' : 'خسارة'}
            </div>
            <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto">
              <RotateCcw size={18} />
              العب مجدداً
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== TRIVIA GAME (100 Questions) ====================
const TriviaGame = ({ onComplete, onClose, userDiamonds, onUseDiamonds }) => {
  const [questions] = useState(() => [...triviaQuestions].sort(() => Math.random() - 0.5).slice(0, 15));
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
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
      const bonus = streak >= 3 ? 5 : 0;
      setScore(s => s + 10 + Math.floor(timeLeft / 4) + bonus);
      setStreak(s => s + 1);
    } else {
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
        onComplete(score, score > 50 ? 'win' : 'lose');
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
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
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

// ==================== RIDDLES GAME (100 Riddles) ====================
const RiddlesGame = ({ onComplete, onClose, userDiamonds, onUseDiamonds }) => {
  const [riddlesList] = useState(() => [...riddles].sort(() => Math.random() - 0.5).slice(0, 15));
  const [currentR, setCurrentR] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const getHint = () => {
    if (userDiamonds < 2) return;
    onUseDiamonds(2);
    setShowHint(true);
  };

  const handleAnswer = (idx) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === riddlesList[currentR].correct) {
      setScore(s => s + 15);
    }
    setTimeout(() => {
      if (currentR < riddlesList.length - 1) {
        setCurrentR(c => c + 1);
        setAnswered(null);
        setShowHint(false);
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
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold">
            إنهاء
          </button>
        </div>
      </div>
    );
  }

  const r = riddlesList[currentR];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Lightbulb size={24} className="text-red-400" />
            الألغاز
          </h1>
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <Star size={18} />
            {score}
          </div>
        </div>

        <div className="mb-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all" style={{ width: `${((currentR + 1) / riddlesList.length) * 100}%` }} />
          </div>
          <div className="text-center text-gray-400 text-sm mt-2">{currentR + 1} / {riddlesList.length}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 mb-4">
          <p className="text-lg text-center">{r.q}</p>
        </div>

        {showHint && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 mb-4 text-center text-green-400">
            الإجابة الصحيحة هي: {r.options[r.correct]}
          </div>
        )}

        <button
          onClick={getHint}
          disabled={userDiamonds < 2 || showHint}
          className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 py-2 rounded-xl mb-4 border border-purple-500/30"
        >
          <Eye size={18} />
          <span>كشف الإجابة</span>
          <Diamond size={14} />
          <span>2</span>
        </button>

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

// ==================== PUZZLE GAME (With Images) ====================
const PuzzleGame = ({ mode, onComplete, onClose, userDiamonds, onUseDiamonds }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [emptyIndex, setEmptyIndex] = useState(15);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [gridSize, setGridSize] = useState(4);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const initGame = (image, size = 4) => {
    setGridSize(size);
    const totalTiles = size * size;
    const numbers = Array.from({ length: totalTiles - 1 }, (_, i) => i);
    
    // Shuffle ensuring solvability
    let shuffled;
    do {
      shuffled = [...numbers].sort(() => Math.random() - 0.5);
    } while (!isSolvable(shuffled, size));
    
    setTiles(shuffled);
    setEmptyIndex(totalTiles - 1);
    setMoves(0);
    setSolved(false);
    setSelectedImage(image);
    setImageLoaded(false);
  };

  const isSolvable = (arr, size) => {
    let inversions = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) inversions++;
      }
    }
    return size % 2 === 1 ? inversions % 2 === 0 : true;
  };

  const canMove = (idx) => {
    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;
    return (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1;
  };

  const moveTile = (idx) => {
    if (!canMove(idx) || solved) return;
    
    const newTiles = [...tiles];
    const tileIdx = tiles.indexOf(tiles[idx]);
    
    // Swap with empty
    [newTiles[idx], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[idx]];
    
    const temp = tiles[idx];
    newTiles[emptyIndex] = temp;
    newTiles[idx] = null;
    
    setTiles(prevTiles => {
      const updated = [...prevTiles];
      updated[emptyIndex] = prevTiles[idx];
      updated[idx] = null;
      return updated;
    });
    
    setEmptyIndex(idx);
    setMoves(m => m + 1);

    // Check if solved
    const isSolved = tiles.every((t, i) => {
      if (i === emptyIndex) return true;
      return t === i;
    });
    
    if (isSolved) {
      setSolved(true);
      const bonus = Math.max(0, 100 - moves);
      onComplete(20 + bonus, 'win');
    }
  };

  const getHint = () => {
    if (userDiamonds < 2) return;
    onUseDiamonds(2);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  };

  if (!selectedImage) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Puzzle size={24} className="text-blue-400" />
              تركيب الصور
            </h1>
            <div className="w-10" />
          </div>

          <p className="text-center text-gray-400 mb-6">اختر صورة للتركيب</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {puzzleImages.map(img => (
              <button
                key={img.id}
                onClick={() => initGame(img)}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
              >
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                  <span className="text-white font-semibold">{img.name}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-3">اختر مستوى الصعوبة</p>
            <div className="flex justify-center gap-3">
              <button className="px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-400">
                3×3 سهل
              </button>
              <button className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
                4×4 متوسط
              </button>
              <button className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400">
                5×5 صعب
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">{selectedImage.name}</h1>
          <button onClick={() => initGame(selectedImage)} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="flex justify-between mb-4 text-sm">
          <span className="text-gray-400">الحركات: {moves}</span>
          {showHint && <span className="text-green-400">انظر الصورة الأصلية أدناه</span>}
        </div>

        {/* Puzzle Grid */}
        <div className="aspect-square bg-white/5 rounded-xl p-1 mb-4 relative overflow-hidden">
          <div className={`grid gap-1 h-full`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {Array.from({ length: gridSize * gridSize }, (_, idx) => {
              const tileValue = tiles[idx];
              const isCorrect = tileValue === idx;
              
              if (idx === emptyIndex || tileValue === null || tileValue === undefined) {
                return <div key={idx} className="bg-black/50 rounded" />;
              }

              const tileRow = Math.floor(tileValue / gridSize);
              const tileCol = tileValue % gridSize;
              const bgPosX = (tileCol / (gridSize - 1)) * 100;
              const bgPosY = (tileRow / (gridSize - 1)) * 100;

              return (
                <button
                  key={idx}
                  onClick={() => moveTile(idx)}
                  disabled={!canMove(idx)}
                  className={`rounded overflow-hidden transition-all ${canMove(idx) ? 'hover:ring-2 ring-blue-500' : ''} ${isCorrect ? 'ring-1 ring-green-500/50' : ''}`}
                  style={{
                    backgroundImage: `url(${selectedImage.url})`,
                    backgroundSize: `${gridSize * 100}%`,
                    backgroundPosition: `${bgPosX}% ${bgPosY}%`
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Hint - Show original image */}
        <button
          onClick={getHint}
          disabled={userDiamonds < 2}
          className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 py-3 rounded-xl mb-4 border border-purple-500/30"
        >
          <Eye size={18} />
          <span>عرض الصورة الأصلية</span>
          <Diamond size={14} />
          <span>2</span>
        </button>

        {showHint && (
          <div className="mb-4">
            <img src={selectedImage.url} alt="Original" className="w-full rounded-xl" />
          </div>
        )}

        {solved && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
            <Trophy size={60} className="mx-auto text-yellow-400 mb-4" />
            <div className="text-2xl font-bold text-green-400 mb-2">ممتاز!</div>
            <div className="text-gray-400 mb-4">أكملت اللغز في {moves} حركة</div>
            <button onClick={() => setSelectedImage(null)} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold">
              لعبة جديدة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== BRICK BREAKER GAME (Advanced) ====================
const BrickBreakerGame = ({ onComplete, onClose }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState('ready'); // ready, playing, paused, over, won
  const [bonusBrick, setBonusBrick] = useState(null);
  
  const gameRef = useRef({
    ball: { x: 200, y: 350, dx: 4, dy: -4, radius: 8 },
    paddle: { x: 150, width: 80, height: 12 },
    bricks: [],
    animationId: null
  });

  const initBricks = useCallback((lvl) => {
    const rows = Math.min(4 + lvl, 8);
    const cols = 8;
    const bricks = [];
    const bonusIdx = Math.floor(Math.random() * (rows * cols));
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        bricks.push({
          x: c * 48 + 10,
          y: r * 25 + 40,
          width: 44,
          height: 20,
          active: true,
          hits: r < 2 ? 2 : 1,
          color: r < 2 ? '#ef4444' : r < 4 ? '#f59e0b' : r < 6 ? '#22c55e' : '#3b82f6',
          isBonus: idx === bonusIdx,
          points: idx === bonusIdx ? 50 : 10
        });
      }
    }
    gameRef.current.bricks = bricks;
    setBonusBrick(bonusIdx);
  }, []);

  useEffect(() => {
    initBricks(level);
    gameRef.current.ball = { x: 200, y: 350, dx: 3 + level * 0.5, dy: -(3 + level * 0.5), radius: 8 };
  }, [level, initBricks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const draw = () => {
      const { ball, paddle, bricks } = gameRef.current;
      
      // Clear
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, 400, 500);
      
      // Draw bricks
      bricks.forEach(brick => {
        if (!brick.active) return;
        ctx.fillStyle = brick.isBonus ? '#fbbf24' : brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        if (brick.isBonus) {
          ctx.fillStyle = '#000';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('★', brick.x + 16, brick.y + 15);
        }
        if (brick.hits > 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
      });
      
      // Draw paddle
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(paddle.x, 470, paddle.width, paddle.height, 6);
      ctx.fill();
      
      // Draw ball
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw lives
      ctx.fillStyle = '#ef4444';
      ctx.font = '16px Arial';
      for (let i = 0; i < lives; i++) {
        ctx.fillText('❤️', 10 + i * 25, 25);
      }
      
      // Draw score
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`نقاط: ${score}`, 320, 25);
      
      // Draw level
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`المستوى: ${level}`, 160, 25);
    };

    const update = () => {
      if (gameState !== 'playing') return;
      
      const { ball, paddle, bricks } = gameRef.current;
      
      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;
      
      // Wall collision
      if (ball.x < ball.radius || ball.x > 400 - ball.radius) {
        ball.dx = -ball.dx;
      }
      if (ball.y < ball.radius) {
        ball.dy = -ball.dy;
      }
      
      // Paddle collision
      if (ball.y > 460 && ball.y < 480 && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        ball.dy = -Math.abs(ball.dy);
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = (hitPos - 0.5) * 8;
      }
      
      // Ball lost
      if (ball.y > 500) {
        setLives(l => {
          if (l <= 1) {
            setGameState('over');
            onComplete(score, 'lose');
            return 0;
          }
          ball.x = 200;
          ball.y = 350;
          ball.dx = 3 + level * 0.5;
          ball.dy = -(3 + level * 0.5);
          return l - 1;
        });
      }
      
      // Brick collision
      bricks.forEach(brick => {
        if (!brick.active) return;
        if (ball.x > brick.x && ball.x < brick.x + brick.width &&
            ball.y > brick.y && ball.y < brick.y + brick.height) {
          brick.hits--;
          if (brick.hits <= 0) {
            brick.active = false;
            setScore(s => s + brick.points);
          }
          ball.dy = -ball.dy;
        }
      });
      
      // Check win
      if (bricks.every(b => !b.active)) {
        if (level < 5) {
          setLevel(l => l + 1);
          setGameState('ready');
        } else {
          setGameState('won');
          onComplete(score + 100, 'win');
        }
      }
      
      draw();
      gameRef.current.animationId = requestAnimationFrame(update);
    };

    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      gameRef.current.paddle.x = Math.max(0, Math.min(400 - gameRef.current.paddle.width, x - 40));
    };

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('click', () => {
      if (gameState === 'ready') setGameState('playing');
    });

    if (gameState === 'playing') {
      gameRef.current.animationId = requestAnimationFrame(update);
    } else {
      draw();
    }

    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('touchmove', handleMove);
      if (gameRef.current.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
    };
  }, [gameState, score, lives, level, onComplete]);

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameState('ready');
    initBricks(1);
    gameRef.current.ball = { x: 200, y: 350, dx: 4, dy: -4, radius: 8 };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Layers size={20} className="text-pink-400" />
            تكسير الطوب
          </h1>
          <button onClick={resetGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="relative">
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={500}
            className="w-full bg-[#0a0a0f] rounded-xl border border-white/10 touch-none"
          />
          
          {gameState === 'ready' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
              <div className="text-center">
                <Zap size={60} className="mx-auto text-yellow-400 mb-4" />
                <p className="text-xl mb-4">المستوى {level}</p>
                <p className="text-gray-400">انقر للبدء</p>
              </div>
            </div>
          )}
          
          {(gameState === 'over' || gameState === 'won') && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-xl">
              <div className="text-center">
                {gameState === 'won' ? (
                  <Trophy size={80} className="mx-auto text-yellow-400 mb-4" />
                ) : (
                  <X size={80} className="mx-auto text-red-400 mb-4" />
                )}
                <h2 className="text-2xl font-bold mb-2">
                  {gameState === 'won' ? 'فوز!' : 'انتهت اللعبة'}
                </h2>
                <p className="text-yellow-400 text-xl mb-4">النقاط: {score}</p>
                <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl">
                  العب مجدداً
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>★ الطوبة الذهبية = 50 نقطة</p>
        </div>
      </div>
    </div>
  );
};

// ==================== GAME ICONS MAP ====================
const gameIcons = {
  chess: Crown,
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
    { id: 'chess', name: 'الشطرنج', colors: ['#8b5cf6', '#6d28d9'], description: 'لعبة الملوك الاستراتيجية', maxPoints: 30, online: true, onlineCost: 30 },
    { id: 'tictactoe', name: 'اكس او', colors: ['#f59e0b', '#d97706'], description: 'تحدى منافسك', maxPoints: 25, online: true, onlineCost: 20 },
    { id: 'brickbreaker', name: 'تكسير الطوب', colors: ['#ec4899', '#db2777'], description: '5 مستويات تحدي', maxPoints: 100, online: false },
    { id: 'puzzle', name: 'تركيب الصور', colors: ['#3b82f6', '#1d4ed8'], description: 'صور حقيقية للتركيب', maxPoints: 50, online: true, onlineCost: 25 },
    { id: 'trivia', name: 'أسئلة ثقافية', colors: ['#10b981', '#059669'], description: '100 سؤال متنوع', maxPoints: 50, online: false },
    { id: 'riddles', name: 'الألغاز', colors: ['#ef4444', '#dc2626'], description: '100 لغز ممتع', maxPoints: 50, online: false },
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

  const handleUseDiamonds = (amount) => {
    setBalance(prev => ({ ...prev, diamonds: prev.diamonds - amount }));
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
          is_online: gameMode === 'online', 
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
  if (activeGame === 'chess') {
    return <ChessGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} userDiamonds={balance.diamonds} onUseDiamonds={handleUseDiamonds} />;
  }
  if (activeGame === 'tictactoe') {
    return <TicTacToeGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
  }
  if (activeGame === 'trivia') {
    return <TriviaGame onComplete={handleGameComplete} onClose={closeGame} userDiamonds={balance.diamonds} onUseDiamonds={handleUseDiamonds} />;
  }
  if (activeGame === 'riddles') {
    return <RiddlesGame onComplete={handleGameComplete} onClose={closeGame} userDiamonds={balance.diamonds} onUseDiamonds={handleUseDiamonds} />;
  }
  if (activeGame === 'puzzle') {
    return <PuzzleGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} userDiamonds={balance.diamonds} onUseDiamonds={handleUseDiamonds} />;
  }
  if (activeGame === 'brickbreaker') {
    return <BrickBreakerGame onComplete={handleGameComplete} onClose={closeGame} />;
  }

  // Mode Selector with Online Option
  if (showModeSelector) {
    const game = games.find(g => g.id === showModeSelector);
    const GameIcon = gameIcons[showModeSelector] || Gamepad2;
    
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" dir="rtl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setShowModeSelector(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
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
            {/* Online Mode */}
            <button 
              onClick={() => handleModeSelect('online')}
              disabled={balance.diamonds < game?.onlineCost}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 disabled:from-gray-600 disabled:to-gray-700 p-6 rounded-2xl text-right hover:from-blue-400 hover:to-blue-500 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Wifi size={28} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg flex items-center gap-2">
                    لعب أونلاين
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">جديد</span>
                  </div>
                  <div className="text-blue-100 text-sm">تحدى لاعبين حقيقيين</div>
                </div>
                <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
                  <Diamond size={16} className="text-blue-300" />
                  <span>{game?.onlineCost}</span>
                </div>
              </div>
            </button>

            {/* AI Medium */}
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

            {/* AI Hard */}
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
                  <div className="text-red-100 text-sm">تحدٍ حقيقي</div>
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
          الألعاب
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
                        <Wifi size={10} />
                        أونلاين
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
          <span className="text-yellow-400 font-bold text-sm">مكافآت المتصدرين (أسبوعياً)</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-yellow-400" />
            <span className="text-white/80">المركز الأول: <span className="text-yellow-400 font-bold">3000 نقطة</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Medal size={16} className="text-gray-400" />
            <span className="text-white/80">المركز الثاني: <span className="text-gray-300 font-bold">1900 نقطة</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Medal size={16} className="text-orange-400" />
            <span className="text-white/80">المركز الثالث: <span className="text-orange-400 font-bold">1000 نقطة</span></span>
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
                {idx === 0 ? <Crown size={22} className="text-yellow-400 mx-auto" /> :
                 idx === 1 ? <Medal size={22} className="text-gray-400 mx-auto" /> :
                 idx === 2 ? <Medal size={22} className="text-orange-400 mx-auto" /> :
                 <span className="text-gray-500 text-sm">#{idx + 1}</span>}
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
