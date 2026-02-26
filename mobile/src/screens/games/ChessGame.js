// Chess Game - Professional Chess with AI
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 600;
const MAX_BOARD_SIZE = isTablet ? 450 : screenWidth - 32;
const BOARD_SIZE = Math.min(screenWidth - 32, MAX_BOARD_SIZE);
const SQUARE_SIZE = BOARD_SIZE / 8;

// Chess piece unicode characters
const PIECES = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

// Initial board setup
const INITIAL_BOARD = [
  ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
  ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
  ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr'],
];

const getPieceDisplay = (piece) => {
  if (!piece) return null;
  const color = piece[0] === 'w' ? 'white' : 'black';
  const type = {
    k: 'king',
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    n: 'knight',
    p: 'pawn',
  }[piece[1]];
  return { char: PIECES[color][type], color };
};

// Chess logic helper functions
const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

const getValidMoves = (board, row, col, piece, canCastle = true) => {
  const moves = [];
  const color = piece[0];
  const type = piece[1];
  const opponentColor = color === 'w' ? 'b' : 'w';

  const addMove = (r, c) => {
    if (!isValidPosition(r, c)) return false;
    const target = board[r][c];
    if (!target) {
      moves.push([r, c]);
      return true;
    } else if (target[0] === opponentColor) {
      moves.push([r, c]);
      return false;
    }
    return false;
  };

  const addCapture = (r, c) => {
    if (!isValidPosition(r, c)) return;
    const target = board[r][c];
    if (target && target[0] === opponentColor) {
      moves.push([r, c]);
    }
  };

  switch (type) {
    case 'p': // Pawn
      const direction = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      
      // Forward move
      if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
        moves.push([row + direction, col]);
        // Double move from start
        if (row === startRow && !board[row + 2 * direction][col]) {
          moves.push([row + 2 * direction, col]);
        }
      }
      // Captures
      if (isValidPosition(row + direction, col - 1)) {
        const leftTarget = board[row + direction][col - 1];
        if (leftTarget && leftTarget[0] === opponentColor) {
          moves.push([row + direction, col - 1]);
        }
      }
      if (isValidPosition(row + direction, col + 1)) {
        const rightTarget = board[row + direction][col + 1];
        if (rightTarget && rightTarget[0] === opponentColor) {
          moves.push([row + direction, col + 1]);
        }
      }
      break;

    case 'r': // Rook
      for (let i = row - 1; i >= 0; i--) if (!addMove(i, col)) break;
      for (let i = row + 1; i < 8; i++) if (!addMove(i, col)) break;
      for (let i = col - 1; i >= 0; i--) if (!addMove(row, i)) break;
      for (let i = col + 1; i < 8; i++) if (!addMove(row, i)) break;
      break;

    case 'n': // Knight
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      knightMoves.forEach(([dr, dc]) => {
        const r = row + dr, c = col + dc;
        if (isValidPosition(r, c)) {
          const target = board[r][c];
          if (!target || target[0] === opponentColor) {
            moves.push([r, c]);
          }
        }
      });
      break;

    case 'b': // Bishop
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col + i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col + i)) break;
      break;

    case 'q': // Queen
      // Rook moves
      for (let i = row - 1; i >= 0; i--) if (!addMove(i, col)) break;
      for (let i = row + 1; i < 8; i++) if (!addMove(i, col)) break;
      for (let i = col - 1; i >= 0; i--) if (!addMove(row, i)) break;
      for (let i = col + 1; i < 8; i++) if (!addMove(row, i)) break;
      // Bishop moves
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col + i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col + i)) break;
      break;

    case 'k': // King
      const kingMoves = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      kingMoves.forEach(([dr, dc]) => {
        const r = row + dr, c = col + dc;
        if (isValidPosition(r, c)) {
          const target = board[r][c];
          if (!target || target[0] === opponentColor) {
            moves.push([r, c]);
          }
        }
      });
      break;
  }

  return moves;
};

// Check if king is in check
const isKingInCheck = (board, color) => {
  // Find king position
  let kingRow, kingCol;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === color + 'k') {
        kingRow = r;
        kingCol = c;
        break;
      }
    }
    if (kingRow !== undefined) break;
  }

  if (kingRow === undefined) return false;

  // Check if any opponent piece can capture king
  const opponentColor = color === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === opponentColor) {
        const moves = getValidMoves(board, r, c, piece, false);
        if (moves.some(([mr, mc]) => mr === kingRow && mc === kingCol)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Evaluate board for AI
const evaluateBoard = (board) => {
  const pieceValues = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const value = pieceValues[piece[1]] || 0;
        score += piece[0] === 'w' ? -value : value;
      }
    }
  }
  return score;
};

// Get all possible moves for a color
const getAllMoves = (board, color) => {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === color) {
        const pieceMoves = getValidMoves(board, r, c, piece);
        pieceMoves.forEach(([tr, tc]) => {
          moves.push({ from: [r, c], to: [tr, tc], piece });
        });
      }
    }
  }
  return moves;
};

// Simple minimax AI
const getBestMove = (board, depth, isMaximizing, difficulty) => {
  const color = isMaximizing ? 'b' : 'w';
  const moves = getAllMoves(board, color);

  if (moves.length === 0) return null;

  // For medium difficulty, add some randomness
  if (difficulty === 'medium' && Math.random() < 0.3) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestMove = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const newBoard = board.map(row => [...row]);
    newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
    newBoard[move.from[0]][move.from[1]] = null;

    let score;
    if (depth <= 1) {
      score = evaluateBoard(newBoard);
    } else {
      const result = getBestMove(newBoard, depth - 1, !isMaximizing, difficulty);
      score = result ? evaluateBoard(newBoard) : evaluateBoard(newBoard);
    }

    if (isMaximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

const ChessGame = ({ mode, onComplete, onClose }) => {
  const [board, setBoard] = useState(INITIAL_BOARD.map(row => [...row]));
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('w');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [moveHistory, setMoveHistory] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // AI move
  useEffect(() => {
    if (currentTurn === 'b' && !gameOver && mode !== 'online') {
      setIsThinking(true);
      setTimeout(() => {
        const difficulty = mode === 'ai_hard' ? 'hard' : 'medium';
        const depth = difficulty === 'hard' ? 3 : 2;
        const bestMove = getBestMove(board, depth, true, difficulty);

        if (bestMove) {
          makeMove(bestMove.from[0], bestMove.from[1], bestMove.to[0], bestMove.to[1]);
        } else {
          // No valid moves - checkmate or stalemate
          setGameOver(true);
          setWinner('w');
          onComplete(mode === 'ai_hard' ? 200 : 100, 'win');
        }
        setIsThinking(false);
      }, 800);
    }
  }, [currentTurn, gameOver, mode, board]);

  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    const capturedPiece = newBoard[toRow][toCol];

    // Handle pawn promotion
    let finalPiece = piece;
    if (piece[1] === 'p' && (toRow === 0 || toRow === 7)) {
      finalPiece = piece[0] + 'q'; // Auto-promote to queen
    }

    newBoard[toRow][toCol] = finalPiece;
    newBoard[fromRow][fromCol] = null;

    // Update captured pieces
    if (capturedPiece) {
      const color = capturedPiece[0] === 'w' ? 'white' : 'black';
      setCapturedPieces(prev => ({
        ...prev,
        [color]: [...prev[color], capturedPiece],
      }));
    }

    // Check for checkmate
    const nextColor = currentTurn === 'w' ? 'b' : 'w';
    const opponentMoves = getAllMoves(newBoard, nextColor);
    
    if (opponentMoves.length === 0) {
      setGameOver(true);
      setWinner(currentTurn);
      const points = mode === 'ai_hard' ? 200 : 100;
      onComplete(currentTurn === 'w' ? points : 10, currentTurn === 'w' ? 'win' : 'lose');
    }

    // Check if opponent's king is captured (checkmate)
    if (capturedPiece && capturedPiece[1] === 'k') {
      setGameOver(true);
      setWinner(currentTurn);
      const points = mode === 'ai_hard' ? 200 : 100;
      onComplete(currentTurn === 'w' ? points : 10, currentTurn === 'w' ? 'win' : 'lose');
    }

    setBoard(newBoard);
    setMoveHistory(prev => [...prev, { from: [fromRow, fromCol], to: [toRow, toCol], piece, captured: capturedPiece }]);
    setCurrentTurn(nextColor);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const handleSquarePress = (row, col) => {
    if (gameOver || isThinking) return;
    if (currentTurn === 'b' && mode !== 'online') return; // AI's turn

    const piece = board[row][col];

    // If already selected and clicking a valid move target
    if (selectedSquare) {
      const [selRow, selCol] = selectedSquare;
      const isValidMove = validMoves.some(([vr, vc]) => vr === row && vc === col);

      if (isValidMove) {
        makeMove(selRow, selCol, row, col);
        return;
      }
    }

    // Select a piece
    if (piece && piece[0] === currentTurn) {
      setSelectedSquare([row, col]);
      setValidMoves(getValidMoves(board, row, col, piece));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD.map(row => [...row]));
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentTurn('w');
    setGameOver(false);
    setWinner(null);
    setCapturedPieces({ white: [], black: [] });
    setMoveHistory([]);
  };

  const renderSquare = (row, col) => {
    const isDark = (row + col) % 2 === 1;
    const piece = board[row][col];
    const pieceData = getPieceDisplay(piece);
    const isSelected = selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col;
    const isValidMove = validMoves.some(([vr, vc]) => vr === row && vc === col);

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.square,
          isDark ? styles.darkSquare : styles.lightSquare,
          isSelected && styles.selectedSquare,
          isValidMove && styles.validMoveSquare,
        ]}
        onPress={() => handleSquarePress(row, col)}
        activeOpacity={0.8}
      >
        {pieceData && (
          <Text style={[
            styles.pieceText, 
            { 
              color: pieceData.color === 'white' ? '#FAFAFA' : '#1a1a2e',
              textShadowColor: pieceData.color === 'white' ? '#000' : 'rgba(255,255,255,0.3)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: pieceData.color === 'white' ? 4 : 2,
            }
          ]}>
            {pieceData.char}
          </Text>
        )}
        {isValidMove && !piece && <View style={styles.validMoveDot} />}
      </TouchableOpacity>
    );
  };

  const renderCapturedPieces = (color) => {
    const pieces = capturedPieces[color];
    return (
      <View style={styles.capturedRow}>
        {pieces.map((p, idx) => {
          const data = getPieceDisplay(p);
          return (
            <Text key={idx} style={[styles.capturedPiece, { color: data.color === 'white' ? '#FFF' : '#333' }]}>
              {data.char}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>الشطرنج</Text>
        <TouchableOpacity onPress={resetGame} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      {/* Opponent Info */}
      <View style={styles.playerInfo}>
        <View style={[styles.playerBadge, currentTurn === 'b' && !gameOver && styles.activeTurn]}>
          <Ionicons name={mode === 'online' ? 'person' : 'hardware-chip'} size={20} color="#f59e0b" />
          <Text style={styles.playerName}>{mode === 'online' ? 'منافس' : 'الكمبيوتر'}</Text>
          {isThinking && <Text style={styles.thinkingText}>يفكر...</Text>}
        </View>
        {renderCapturedPieces('white')}
      </View>

      {/* Chess Board */}
      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(row => (
            <View key={row} style={styles.boardRow}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(col => renderSquare(row, col))}
            </View>
          ))}
        </View>
        
        {/* Column labels */}
        <View style={styles.colLabels}>
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(label => (
            <Text key={label} style={styles.label}>{label}</Text>
          ))}
        </View>
      </View>

      {/* Player Info */}
      <View style={styles.playerInfo}>
        {renderCapturedPieces('black')}
        <View style={[styles.playerBadge, currentTurn === 'w' && !gameOver && styles.activeTurn]}>
          <Ionicons name="person" size={20} color="#60a5fa" />
          <Text style={styles.playerName}>أنت</Text>
        </View>
      </View>

      {/* Game Over Modal */}
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <View style={styles.gameOverCard}>
            <Ionicons 
              name={winner === 'w' ? 'trophy' : 'sad'} 
              size={60} 
              color={winner === 'w' ? '#fbbf24' : '#ef4444'} 
            />
            <Text style={styles.gameOverTitle}>
              {winner === 'w' ? 'فوز!' : 'خسارة'}
            </Text>
            <Text style={styles.gameOverSub}>
              {winner === 'w' ? 'أحسنت! لقد فزت في المباراة' : 'حظ أوفر في المرة القادمة'}
            </Text>
            <View style={styles.gameOverBtns}>
              <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.playAgainText}>العب مجدداً</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
                <Text style={styles.exitText}>خروج</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginVertical: 8,
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeTurn: {
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  playerName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  thinkingText: {
    color: '#f59e0b',
    fontSize: 12,
    marginLeft: 4,
  },
  capturedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 150,
  },
  capturedPiece: {
    fontSize: 18,
    marginRight: 2,
  },
  boardContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  board: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3b4158',
  },
  boardRow: {
    flexDirection: 'row',
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightSquare: {
    backgroundColor: '#e8dcc8',
  },
  darkSquare: {
    backgroundColor: '#8b7355',
  },
  selectedSquare: {
    backgroundColor: 'rgba(96,165,250,0.6)',
  },
  validMoveSquare: {
    backgroundColor: 'rgba(34,197,94,0.4)',
  },
  pieceText: {
    fontSize: SQUARE_SIZE * 0.75,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
    fontWeight: 'bold',
  },
  validMoveDot: {
    width: SQUARE_SIZE * 0.25,
    height: SQUARE_SIZE * 0.25,
    borderRadius: SQUARE_SIZE * 0.125,
    backgroundColor: 'rgba(34,197,94,0.7)',
  },
  colLabels: {
    flexDirection: 'row',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  label: {
    width: SQUARE_SIZE,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gameOverCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
  },
  gameOverSub: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  gameOverBtns: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  playAgainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  exitBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  exitText: {
    color: '#888',
    fontSize: 14,
  },
});

export default ChessGame;
