// Chess Game Component
import React, { useState } from 'react';
import { ChevronLeft, Crown, RotateCcw, Diamond, HelpCircle } from 'lucide-react';
import soundManager from '../../utils/soundManager';
import { INITIAL_CHESS_BOARD } from '../../data/gameData';

const ChessGame = ({ mode, onComplete, onClose, userDiamonds, onUseDiamonds, wsConnection, gameId, isOnline }) => {
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
      default:
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
          soundManager.chessCapture();
          const capColor = isWhitePiece(captured) ? 'white' : 'black';
          setCapturedPieces(prev => ({
            ...prev,
            [capColor]: [...prev[capColor], captured]
          }));
          
          if (captured.toLowerCase() === 'k') {
            setGameOver(true);
            setWinner(turn);
            soundManager.win();
            onComplete(turn === 'white' ? 30 : 10, turn === 'white' ? 'win' : 'lose');
          }
        } else {
          soundManager.chessPiece();
        }
        
        // Send move to opponent if online
        if (isOnline && wsConnection) {
          wsConnection.send(JSON.stringify({
            action: 'game_move',
            move: { from: [selRow, selCol], to: [row, col], piece: board[selRow][selCol] }
          }));
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
        soundManager.click();
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
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4" data-testid="chess-game">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="chess-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Crown size={24} className="text-purple-400" />
            الشطرنج
          </h1>
          <button onClick={resetGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="chess-reset-btn">
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
        <div className="grid grid-cols-8 gap-0.5 bg-white/10 p-1 rounded-lg mb-4">
          {board.map((row, r) => 
            row.map((piece, c) => {
              const isSelected = selectedPiece?.[0] === r && selectedPiece?.[1] === c;
              const isValid = validMoves.some(([vr, vc]) => vr === r && vc === c);
              const isHint = showHint && hintMove && 
                ((hintMove.from[0] === r && hintMove.from[1] === c) || 
                 (hintMove.to[0] === r && hintMove.to[1] === c));
              
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`aspect-square flex items-center justify-center text-2xl md:text-3xl
                    ${(r + c) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-800'}
                    ${isSelected ? 'ring-2 ring-blue-400' : ''}
                    ${isValid ? 'ring-2 ring-green-400 bg-green-400/30' : ''}
                    ${isHint ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
                >
                  {piece && pieceSymbols[piece]}
                </button>
              );
            })
          )}
        </div>

        {/* Hint Button */}
        {!isOnline && (
          <button
            onClick={getHint}
            disabled={userDiamonds < 2}
            className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 py-3 rounded-xl mb-4 border border-purple-500/30"
            data-testid="chess-hint-btn"
          >
            <HelpCircle size={18} />
            <span>تلميح</span>
            <Diamond size={14} />
            <span>2</span>
          </button>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="bg-white/10 rounded-2xl p-6 text-center">
            <Crown size={60} className={`mx-auto mb-3 ${winner === 'white' ? 'text-yellow-400' : 'text-red-400'}`} />
            <div className="text-2xl font-bold mb-4">
              {winner === 'white' ? 'فوز!' : 'خسارة!'}
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

export default ChessGame;
