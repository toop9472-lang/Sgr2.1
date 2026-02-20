// Tic Tac Toe Game Component
import React, { useState } from 'react';
import { ChevronLeft, Grid3X3, RotateCcw, Trophy, Users, Cpu, X } from 'lucide-react';
import soundManager from '../../utils/soundManager';

const TicTacToeGame = ({ mode, onComplete, onClose, wsConnection, isOnline }) => {
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
    soundManager.click();
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    
    // Send move to opponent if online
    if (isOnline && wsConnection) {
      wsConnection.send(JSON.stringify({
        action: 'game_move',
        move: { index, symbol: 'X' }
      }));
    }
    
    const result = checkWinner(newBoard);
    if (result) {
      endGame(result);
      return;
    }
    setIsPlayerTurn(false);
    
    if (!isOnline) {
      setTimeout(() => {
        const aiIndex = getAIMove([...newBoard]);
        if (aiIndex !== null && aiIndex !== undefined) {
          soundManager.move();
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
    }
  };

  const endGame = (result) => {
    setGameOver(true);
    setWinner(result.winner);
    setWinningLine(result.line);
    if (result.winner === 'X') {
      soundManager.win();
      setScores(s => ({ ...s, player: s.player + 1 }));
      onComplete(mode === 'ai_hard' ? 25 : 20, 'win');
    } else if (result.winner === 'draw') {
      soundManager.success();
      setScores(s => ({ ...s, draws: s.draws + 1 }));
      onComplete(10, 'draw');
    } else {
      soundManager.lose();
      setScores(s => ({ ...s, opponent: s.opponent + 1 }));
      onComplete(5, 'lose');
    }
  };

  const resetGame = () => {
    soundManager.click();
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="tictactoe-game">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="tictactoe-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Grid3X3 size={24} className="text-orange-400" />
            اكس او
          </h1>
          <button onClick={resetGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="tictactoe-reset-btn">
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
            <div className="text-orange-400 text-sm">{isOnline ? 'الخصم' : 'الكمبيوتر'}</div>
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
              data-testid={`tictactoe-cell-${idx}`}
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
              <><Cpu size={18} className="animate-pulse" /><span>{isOnline ? 'دور الخصم...' : 'دور الكمبيوتر...'}</span></>
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
            <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto" data-testid="tictactoe-play-again-btn">
              <RotateCcw size={18} />
              العب مجدداً
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicTacToeGame;
