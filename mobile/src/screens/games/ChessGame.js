// Chess Game - Professional Chess with Full Rules
// قوانين الشطرنج العالمية الكاملة: التبييت، الأكل بالتجاوز، ترقية البيدق، كش مات
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ImageBackground,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import gameSounds from '../../utils/gameSounds';

// AI-Generated Professional Background
const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/5f7d92f290baa8d87bddc9fac33a18f8f09afa56e556b7e66faf34518194c56b.png';

// قطع شطرنج احترافية: أبيض/أسود برموز مختلفة
const PIECES = {
  white: { king: '\u2654', queen: '\u2655', rook: '\u2656', bishop: '\u2657', knight: '\u2658', pawn: '\u2659' },
  black: { king: '\u265A', queen: '\u265B', rook: '\u265C', bishop: '\u265D', knight: '\u265E', pawn: '\u265F' },
};

// اللوحة الأولية
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
  const type = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' }[piece[1]];
  return { char: PIECES[color][type], color };
};

const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

// البحث عن موقع الملك
const findKing = (board, color) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === `${color}k`) return [r, c];
    }
  }
  return null;
};

// التحقق من الكش
const isKingInCheck = (board, color) => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  
  const opponentColor = color === 'w' ? 'b' : 'w';
  
  // التحقق من جميع قطع الخصم
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === opponentColor) {
        const moves = getRawMoves(board, r, c, piece);
        if (moves.some(([mr, mc]) => mr === kingPos[0] && mc === kingPos[1])) {
          return true;
        }
      }
    }
  }
  return false;
};

// حركات القطع الأساسية (بدون فلترة الكش)
const getRawMoves = (board, row, col, piece) => {
  const moves = [];
  const color = piece[0];
  const type = piece[1];
  const opponentColor = color === 'w' ? 'b' : 'w';

  const addMove = (r, c) => {
    if (!isValidPosition(r, c)) return false;
    const target = board[r][c];
    if (!target) { moves.push([r, c]); return true; }
    if (target[0] === opponentColor) { moves.push([r, c]); return false; }
    return false;
  };

  switch (type) {
    case 'p': // البيدق
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      // التقدم للأمام
      if (isValidPosition(row + dir, col) && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        // الحركة المزدوجة من البداية
        if (row === startRow && !board[row + 2 * dir][col]) {
          moves.push([row + 2 * dir, col]);
        }
      }
      // الأكل القطري
      [-1, 1].forEach(dc => {
        if (isValidPosition(row + dir, col + dc)) {
          const t = board[row + dir][col + dc];
          if (t && t[0] === opponentColor) moves.push([row + dir, col + dc]);
        }
      });
      break;

    case 'r': // الرخ (القلعة)
      for (let i = row - 1; i >= 0; i--) if (!addMove(i, col)) break;
      for (let i = row + 1; i < 8; i++) if (!addMove(i, col)) break;
      for (let i = col - 1; i >= 0; i--) if (!addMove(row, i)) break;
      for (let i = col + 1; i < 8; i++) if (!addMove(row, i)) break;
      break;

    case 'n': // الحصان
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
        const r = row + dr, c = col + dc;
        if (isValidPosition(r, c)) {
          const t = board[r][c];
          if (!t || t[0] === opponentColor) moves.push([r, c]);
        }
      });
      break;

    case 'b': // الفيل
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col + i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col + i)) break;
      break;

    case 'q': // الوزير (ملكة)
      for (let i = row - 1; i >= 0; i--) if (!addMove(i, col)) break;
      for (let i = row + 1; i < 8; i++) if (!addMove(i, col)) break;
      for (let i = col - 1; i >= 0; i--) if (!addMove(row, i)) break;
      for (let i = col + 1; i < 8; i++) if (!addMove(row, i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col + i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col + i)) break;
      break;

    case 'k': // الملك
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => {
        const r = row + dr, c = col + dc;
        if (isValidPosition(r, c)) {
          const t = board[r][c];
          if (!t || t[0] === opponentColor) moves.push([r, c]);
        }
      });
      break;
  }
  return moves;
};

// الحركات القانونية (مع فلترة الكش)
const getValidMoves = (board, row, col, piece, castlingRights, enPassantSquare) => {
  const color = piece[0];
  const type = piece[1];
  let moves = getRawMoves(board, row, col, piece);
  
  // فلترة الحركات التي تعرض الملك للكش
  moves = moves.filter(([toR, toC]) => {
    const testBoard = board.map(r => [...r]);
    testBoard[toR][toC] = testBoard[row][col];
    testBoard[row][col] = null;
    return !isKingInCheck(testBoard, color);
  });

  // التبييت (Castling)
  if (type === 'k' && castlingRights) {
    const kingRow = color === 'w' ? 7 : 0;
    
    // التبييت القصير (جهة الملك)
    if (castlingRights[`${color}k`] && row === kingRow && col === 4) {
      if (!board[kingRow][5] && !board[kingRow][6] && board[kingRow][7] === `${color}r`) {
        // التأكد من عدم المرور بمربع مهدد
        if (!isKingInCheck(board, color)) {
          const test1 = board.map(r => [...r]);
          test1[kingRow][5] = test1[kingRow][4];
          test1[kingRow][4] = null;
          const test2 = board.map(r => [...r]);
          test2[kingRow][6] = test2[kingRow][4];
          test2[kingRow][4] = null;
          if (!isKingInCheck(test1, color) && !isKingInCheck(test2, color)) {
            moves.push([kingRow, 6, 'castle-k']);
          }
        }
      }
    }
    
    // التبييت الطويل (جهة الوزير)
    if (castlingRights[`${color}q`] && row === kingRow && col === 4) {
      if (!board[kingRow][1] && !board[kingRow][2] && !board[kingRow][3] && board[kingRow][0] === `${color}r`) {
        if (!isKingInCheck(board, color)) {
          const test1 = board.map(r => [...r]);
          test1[kingRow][3] = test1[kingRow][4];
          test1[kingRow][4] = null;
          const test2 = board.map(r => [...r]);
          test2[kingRow][2] = test2[kingRow][4];
          test2[kingRow][4] = null;
          if (!isKingInCheck(test1, color) && !isKingInCheck(test2, color)) {
            moves.push([kingRow, 2, 'castle-q']);
          }
        }
      }
    }
  }

  // الأكل بالتجاوز (En Passant)
  if (type === 'p' && enPassantSquare) {
    const dir = color === 'w' ? -1 : 1;
    const [epRow, epCol] = enPassantSquare;
    if (row + dir === epRow && Math.abs(col - epCol) === 1) {
      const testBoard = board.map(r => [...r]);
      testBoard[epRow][epCol] = testBoard[row][col];
      testBoard[row][col] = null;
      testBoard[row][epCol] = null; // إزالة البيدق المأكول
      if (!isKingInCheck(testBoard, color)) {
        moves.push([epRow, epCol, 'en-passant']);
      }
    }
  }

  return moves;
};

// التحقق من كش مات أو تعادل
const getGameState = (board, color, castlingRights, enPassantSquare) => {
  let hasValidMove = false;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === color) {
        const moves = getValidMoves(board, r, c, piece, castlingRights, enPassantSquare);
        if (moves.length > 0) {
          hasValidMove = true;
          break;
        }
      }
    }
    if (hasValidMove) break;
  }

  const inCheck = isKingInCheck(board, color);
  
  if (!hasValidMove && inCheck) return 'checkmate';
  if (!hasValidMove && !inCheck) return 'stalemate';
  if (inCheck) return 'check';
  return 'playing';
};

// تقييم اللوحة للذكاء الاصطناعي
const evaluateBoard = (board) => {
  const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  
  // قيم المواقع للبيادق
  const pawnTable = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  let score = 0;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const value = pieceValues[piece[1]] || 0;
        const posBonus = piece[1] === 'p' ? (piece[0] === 'w' ? pawnTable[r][c] : pawnTable[7-r][c]) : 0;
        
        if (piece[0] === 'w') {
          score += value + posBonus;
        } else {
          score -= value + posBonus;
        }
      }
    }
  }
  
  return score;
};

// Minimax مع Alpha-Beta
const minimax = (board, depth, alpha, beta, isMaximizing, castlingRights, enPassantSquare) => {
  if (depth === 0) return evaluateBoard(board);
  
  const color = isMaximizing ? 'b' : 'w';
  const moves = [];
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === color) {
        const validMoves = getValidMoves(board, r, c, piece, castlingRights, enPassantSquare);
        validMoves.forEach(move => moves.push({ from: [r, c], to: move, piece }));
      }
    }
  }
  
  if (moves.length === 0) {
    if (isKingInCheck(board, color)) {
      return isMaximizing ? -100000 + depth : 100000 - depth;
    }
    return 0; // تعادل
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = board.map(r => [...r]);
      newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
      newBoard[move.from[0]][move.from[1]] = null;
      const eval_ = minimax(newBoard, depth - 1, alpha, beta, false, castlingRights, null);
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = board.map(r => [...r]);
      newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
      newBoard[move.from[0]][move.from[1]] = null;
      const eval_ = minimax(newBoard, depth - 1, alpha, beta, true, castlingRights, null);
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

// اختيار أفضل حركة للكمبيوتر
const getBestMove = (board, castlingRights, enPassantSquare) => {
  const moves = [];
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === 'b') {
        const validMoves = getValidMoves(board, r, c, piece, castlingRights, enPassantSquare);
        validMoves.forEach(move => moves.push({ from: [r, c], to: move, piece }));
      }
    }
  }
  
  if (moves.length === 0) return null;
  
  let bestMove = moves[0];
  let bestScore = -Infinity;
  
  for (const move of moves) {
    const newBoard = board.map(r => [...r]);
    newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
    newBoard[move.from[0]][move.from[1]] = null;
    
    const score = minimax(newBoard, 3, -Infinity, Infinity, false, castlingRights, null);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
};

// المكون الرئيسي
const ChessGame = ({ mode, onComplete, onClose }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isCompactScreen = windowHeight < 760;
  const boardSize = useMemo(() => {
    const maxByWidth = Math.max(220, windowWidth - 32);
    const maxByHeight = Math.max(220, windowHeight * (isCompactScreen ? 0.44 : 0.5));
    return Math.min(maxByWidth, maxByHeight, 430);
  }, [windowWidth, windowHeight, isCompactScreen]);
  const squareSize = boardSize / 8;
  const styles = useMemo(() => createStyles(boardSize, squareSize, isCompactScreen), [boardSize, squareSize, isCompactScreen]);

  const [board, setBoard] = useState(INITIAL_BOARD.map(row => [...row]));
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [turn, setTurn] = useState('w');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameStatus, setGameStatus] = useState('playing');
  const [captured, setCaptured] = useState({ white: [], black: [] });
  const [thinking, setThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [showPromotion, setShowPromotion] = useState(null);
  
  // حقوق التبييت
  const [castlingRights, setCastlingRights] = useState({
    wk: true, wq: true, // الأبيض: قصير، طويل
    bk: true, bq: true, // الأسود: قصير، طويل
  });
  
  // مربع الأكل بالتجاوز
  const [enPassantSquare, setEnPassantSquare] = useState(null);
  
  // أنيميشن
  const lastMoveAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  // تحريك الكمبيوتر
  useEffect(() => {
    if (turn === 'b' && !gameOver && mode !== 'online') {
      setThinking(true);
      setTimeout(() => {
        const best = getBestMove(board, castlingRights, enPassantSquare);
        if (best) {
          makeMove(best.from[0], best.from[1], best.to[0], best.to[1], best.to[2]);
        } else {
          endGame('w');
        }
        setThinking(false);
      }, 800);
    }
  }, [turn, gameOver, mode]);

  // التحقق من حالة اللعبة
  useEffect(() => {
    const status = getGameState(board, turn, castlingRights, enPassantSquare);
    setGameStatus(status);
    
    if (status === 'check') {
      gameSounds.chessCheck();
      Animated.sequence([
        Animated.timing(checkAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(checkAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(checkAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(checkAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    } else if (status === 'checkmate') {
      endGame(turn === 'w' ? 'b' : 'w');
    } else if (status === 'stalemate') {
      endGame('draw');
    }
  }, [board, turn]);

  const endGame = (result) => {
    setGameOver(true);
    setWinner(result);
    
    if (result === 'w') {
      gameSounds.win();
      onComplete && onComplete(100, 'win');
    } else if (result === 'b') {
      gameSounds.lose();
      onComplete && onComplete(25, 'lose');
    } else {
      gameSounds.buttonTap();
      onComplete && onComplete(50, 'draw');
    }
  };

  const makeMove = (fromR, fromC, toR, toC, special = null) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromR][fromC];
    const capturedPiece = newBoard[toR][toC];
    const newCastling = { ...castlingRights };
    let newEnPassant = null;
    const isPromotionMove = piece[1] === 'p' && (toR === 0 || toR === 7);

    // معالجة التبييت
    if (special === 'castle-k') {
      // تبييت قصير
      const row = piece[0] === 'w' ? 7 : 0;
      newBoard[row][6] = piece;
      newBoard[row][4] = null;
      newBoard[row][5] = newBoard[row][7];
      newBoard[row][7] = null;
      gameSounds.chessCastle();
    } else if (special === 'castle-q') {
      // تبييت طويل
      const row = piece[0] === 'w' ? 7 : 0;
      newBoard[row][2] = piece;
      newBoard[row][4] = null;
      newBoard[row][3] = newBoard[row][0];
      newBoard[row][0] = null;
      gameSounds.chessCastle();
    } else if (special === 'en-passant') {
      // الأكل بالتجاوز
      newBoard[toR][toC] = piece;
      newBoard[fromR][fromC] = null;
      const capturedPawnRow = piece[0] === 'w' ? toR + 1 : toR - 1;
      const epCaptured = newBoard[capturedPawnRow][toC];
      newBoard[capturedPawnRow][toC] = null;
      setCaptured(prev => ({
        ...prev,
        [piece[0] === 'w' ? 'white' : 'black']: [...prev[piece[0] === 'w' ? 'white' : 'black'], epCaptured]
      }));
      gameSounds.chessCapture();
    } else {
      // حركة عادية
      newBoard[toR][toC] = piece;
      newBoard[fromR][fromC] = null;
      
      if (capturedPiece) {
        gameSounds.chessCapture();
        setCaptured(prev => ({
          ...prev,
          [piece[0] === 'w' ? 'white' : 'black']: [...prev[piece[0] === 'w' ? 'white' : 'black'], capturedPiece]
        }));
      } else {
        gameSounds.chessMove();
      }
    }

    // تحديث حقوق التبييت
    if (piece[1] === 'k') {
      newCastling[`${piece[0]}k`] = false;
      newCastling[`${piece[0]}q`] = false;
    }
    if (piece[1] === 'r') {
      if (fromC === 0) newCastling[`${piece[0]}q`] = false;
      if (fromC === 7) newCastling[`${piece[0]}k`] = false;
    }

    // تحديث مربع الأكل بالتجاوز
    if (piece[1] === 'p' && Math.abs(fromR - toR) === 2) {
      newEnPassant = [(fromR + toR) / 2, fromC];
    }

    // ترقية البيدق
    if (isPromotionMove) {
      setShowPromotion({ row: toR, col: toC, color: piece[0] });
    }

    setBoard(newBoard);
    setCastlingRights(newCastling);
    setEnPassantSquare(newEnPassant);
    setSelected(null);
    setValidMoves([]);
    setMoveHistory(prev => [...prev, { from: [fromR, fromC], to: [toR, toC], piece }]);
    
    if (!isPromotionMove) {
      setTurn(turn === 'w' ? 'b' : 'w');
    }

    // أنيميشن
    Animated.sequence([
      Animated.timing(lastMoveAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
      Animated.timing(lastMoveAnim, { toValue: 0, duration: 100, useNativeDriver: false }),
    ]).start();
  };

  const handlePromotion = (pieceType) => {
    if (!showPromotion) return;
    
    const newBoard = board.map(row => [...row]);
    newBoard[showPromotion.row][showPromotion.col] = `${showPromotion.color}${pieceType}`;
    setBoard(newBoard);
    setShowPromotion(null);
    setTurn(turn === 'w' ? 'b' : 'w');
    gameSounds.levelUp();
  };

  const handleSquarePress = (row, col) => {
    if (gameOver || thinking || turn === 'b') return;

    const piece = board[row][col];
    
    // اختيار قطعة
    if (piece && piece[0] === turn) {
      const moves = getValidMoves(board, row, col, piece, castlingRights, enPassantSquare);
      setSelected([row, col]);
      setValidMoves(moves);
      gameSounds.buttonTap();
      return;
    }

    // تنفيذ حركة
    if (selected) {
      const move = validMoves.find(m => m[0] === row && m[1] === col);
      if (move) {
        makeMove(selected[0], selected[1], row, col, move[2]);
      } else {
        setSelected(null);
        setValidMoves([]);
      }
    }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD.map(row => [...row]));
    setSelected(null);
    setValidMoves([]);
    setTurn('w');
    setGameOver(false);
    setWinner(null);
    setGameStatus('playing');
    setCaptured({ white: [], black: [] });
    setCastlingRights({ wk: true, wq: true, bk: true, bq: true });
    setEnPassantSquare(null);
    setMoveHistory([]);
  };

  const renderSquare = (row, col) => {
    const piece = board[row][col];
    const pieceDisplay = getPieceDisplay(piece);
    const isSelected = selected && selected[0] === row && selected[1] === col;
    const isValidMove = validMoves.some(m => m[0] === row && m[1] === col);
    const isCapture = isValidMove && piece;
    const isLight = (row + col) % 2 === 0;
    const isKingSquare = piece && piece[1] === 'k' && piece[0] === turn && gameStatus === 'check';
    
    const lastMove = moveHistory[moveHistory.length - 1];
    const isLastMoveSquare = lastMove && (
      (lastMove.from[0] === row && lastMove.from[1] === col) ||
      (lastMove.to[0] === row && lastMove.to[1] === col)
    );

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.square,
          { 
            backgroundColor: isLight ? '#f6e7c8' : '#8a6543',
            borderWidth: isSelected ? 2 : 0,
            borderColor: '#facc15',
          },
          isLastMoveSquare && styles.lastMoveSquare,
          isKingSquare && styles.checkSquare,
        ]}
        onPress={() => handleSquarePress(row, col)}
        activeOpacity={0.8}
      >
        {/* مؤشر الحركة المتاحة */}
        {isValidMove && !piece && (
          <View style={styles.validMoveIndicator} />
        )}
        
        {/* مؤشر الأكل */}
        {isCapture && (
          <View style={styles.captureIndicator} />
        )}

        {/* القطعة */}
        {pieceDisplay && (
          <View style={[styles.pieceWrap, pieceDisplay.color === 'white' ? styles.whitePieceWrap : styles.blackPieceWrap]}>
            <Text
              style={[
                styles.piece,
                pieceDisplay.color === 'white' ? styles.whitePiece : styles.blackPiece,
              ]}
            >
              {pieceDisplay.char}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.title}>الشطرنج الملكي</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Ionicons name="refresh" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View style={styles.statusBar}>
            {gameStatus === 'check' && (
              <Animated.View style={[styles.statusBadge, styles.checkBadge]}>
                <Text style={styles.statusText}>كش!</Text>
              </Animated.View>
            )}
            {thinking && (
              <View style={[styles.statusBadge, styles.thinkingBadge]}>
                <Text style={styles.statusText}>الخصم يفكر...</Text>
              </View>
            )}
            {!gameOver && !thinking && gameStatus !== 'check' && (
              <View style={styles.turnIndicator}>
                <View style={[styles.turnDot, turn === 'w' ? styles.whiteDot : styles.blackDot]} />
                <Text style={styles.turnText}>{turn === 'w' ? 'دورك' : 'دور الخصم'}</Text>
              </View>
            )}
          </View>

          {/* القطع المأكولة - الخصم */}
          <View style={styles.capturedRow}>
            {captured.black.map((p, i) => (
              <Text key={i} style={styles.capturedPiece}>{getPieceDisplay(p)?.char}</Text>
            ))}
          </View>

          {/* اللوحة */}
          <View style={styles.boardContainer}>
            <LinearGradient colors={['#facc15', '#b45309', '#facc15']} style={styles.boardFrame}>
              <View style={styles.board}>
                {board.map((row, rIdx) => (
                  <View key={rIdx} style={styles.row}>
                    {row.map((_, cIdx) => renderSquare(rIdx, cIdx))}
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* أرقام الصفوف */}
            <View style={styles.rowNumbers}>
              {[8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                <Text key={n} style={styles.boardLabel}>{n}</Text>
              ))}
            </View>

            {/* حروف الأعمدة */}
            <View style={styles.colLetters}>
              {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(l => (
                <Text key={l} style={styles.boardLabel}>{l}</Text>
              ))}
            </View>
          </View>

          {/* القطع المأكولة - اللاعب */}
          <View style={styles.capturedRow}>
            {captured.white.map((p, i) => (
              <Text key={i} style={styles.capturedPiece}>{getPieceDisplay(p)?.char}</Text>
            ))}
          </View>
        </ScrollView>

        {/* نافذة ترقية البيدق */}
        <Modal visible={!!showPromotion} transparent animationType="fade">
          <View style={styles.promotionOverlay}>
            <View style={styles.promotionModal}>
              <Text style={styles.promotionTitle}>اختر قطعة الترقية</Text>
              <View style={styles.promotionOptions}>
                {['q', 'r', 'b', 'n'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={styles.promotionOption}
                    onPress={() => handlePromotion(type)}
                  >
                    <Text
                      style={[
                        styles.promotionPiece,
                        showPromotion?.color === 'w' ? styles.whitePiece : styles.blackPiece,
                      ]}
                    >
                      {PIECES[showPromotion?.color === 'w' ? 'white' : 'black'][
                        { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[type]
                      ]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* نافذة نهاية اللعبة */}
        {gameOver && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverModal}>
              <View style={styles.gameOverIconWrap}>
                <Ionicons
                  name={winner === 'w' ? 'trophy' : winner === 'b' ? 'close-circle' : 'remove-circle'}
                  size={52}
                  color={winner === 'w' ? '#fbbf24' : winner === 'b' ? '#ef4444' : '#93c5fd'}
                />
              </View>
              <Text style={styles.gameOverTitle}>
                {winner === 'w' ? 'فوز!' : winner === 'b' ? 'خسارة' : 'تعادل'}
              </Text>
              <Text style={styles.gameOverSubtitle}>
                {winner === 'w' ? 'كش مات! أحسنت!' : winner === 'b' ? 'كش مات' : 'لا توجد حركات متاحة'}
              </Text>
              <View style={styles.gameOverButtons}>
                <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
                  <Text style={styles.playAgainText}>العب مرة أخرى</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exitButton} onPress={onClose}>
                  <Text style={styles.exitText}>خروج</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const createStyles = (boardSize, squareSize, isCompactScreen) => StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)' },
  scrollContent: { flexGrow: 1, paddingBottom: isCompactScreen ? 14 : 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: isCompactScreen ? 38 : 52,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: isCompactScreen ? 22 : 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusBar: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  checkBadge: {
    backgroundColor: '#ef4444',
  },
  thinkingBadge: {
    backgroundColor: '#3b82f6',
  },
  statusText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  whiteDot: { backgroundColor: '#FFF' },
  blackDot: { backgroundColor: '#111827' },
  turnText: {
    color: '#FFF',
    fontSize: 16,
  },

  capturedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 36,
    flexWrap: 'wrap',
    marginHorizontal: 10,
  },
  capturedPiece: {
    fontSize: Math.max(17, squareSize * 0.5),
    marginHorizontal: 2,
    color: '#e5e7eb',
  },

  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 18,
    marginHorizontal: 18,
  },
  boardFrame: {
    padding: 5,
    borderRadius: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 7,
  },
  board: {
    width: boardSize,
    height: boardSize,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: squareSize,
    height: squareSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastMoveSquare: {
    backgroundColor: 'rgba(251, 191, 36, 0.42)',
  },
  checkSquare: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  pieceWrap: {
    width: squareSize * 0.8,
    height: squareSize * 0.8,
    borderRadius: squareSize * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whitePieceWrap: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  blackPieceWrap: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  piece: {
    fontSize: squareSize * 0.74,
    fontWeight: '700',
  },
  whitePiece: {
    color: '#f8fafc',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  blackPiece: {
    color: '#111827',
    textShadowColor: 'rgba(255,255,255,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  validMoveIndicator: {
    width: squareSize * 0.28,
    height: squareSize * 0.28,
    borderRadius: squareSize * 0.14,
    backgroundColor: 'rgba(34, 197, 94, 0.55)',
  },
  captureIndicator: {
    position: 'absolute',
    width: squareSize - 4,
    height: squareSize - 4,
    borderRadius: (squareSize - 4) / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(239, 68, 68, 0.75)',
  },
  rowNumbers: {
    position: 'absolute',
    left: -14,
    top: 10,
    height: boardSize,
    justifyContent: 'space-around',
  },
  colLetters: {
    position: 'absolute',
    bottom: -8,
    left: 6,
    width: boardSize,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  boardLabel: {
    color: 'rgba(229,231,235,0.75)',
    fontSize: 11,
    fontWeight: '700',
  },

  // Promotion Modal
  promotionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promotionModal: {
    backgroundColor: '#131524',
    padding: 22,
    borderRadius: 20,
    alignItems: 'center',
    width: '88%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.45)',
  },
  promotionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  promotionOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  promotionOption: {
    width: 58,
    height: 58,
    backgroundColor: '#f6e7c8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promotionPiece: {
    fontSize: 36,
    color: '#111827',
  },

  // Game Over Modal
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverModal: {
    backgroundColor: '#111827',
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    width: '86%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
  },
  gameOverIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  gameOverTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gameOverSubtitle: {
    color: '#9ca3af',
    fontSize: 15,
    marginBottom: 22,
    textAlign: 'center',
  },
  gameOverButtons: {
    width: '100%',
    gap: 10,
  },
  playAgainButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  playAgainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default ChessGame;
