// Chess Game - Professional Chess with Wooden Theme
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
// Make board larger - use more screen space
const BOARD_SIZE = Math.min(screenWidth - 16, screenHeight * 0.55, 450);
const SQUARE_SIZE = BOARD_SIZE / 8;

// Chess piece unicode - larger and clearer
const PIECES = {
  white: { king: '\u2654', queen: '\u2655', rook: '\u2656', bishop: '\u2657', knight: '\u2658', pawn: '\u2659' },
  black: { king: '\u265A', queen: '\u265B', rook: '\u265C', bishop: '\u265D', knight: '\u265E', pawn: '\u265F' },
};

// Initial board
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

const getValidMoves = (board, row, col, piece) => {
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
    case 'p': // Pawn
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      if (isValidPosition(row + dir, col) && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRow && !board[row + 2 * dir][col]) moves.push([row + 2 * dir, col]);
      }
      // Captures
      [-1, 1].forEach(dc => {
        if (isValidPosition(row + dir, col + dc)) {
          const t = board[row + dir][col + dc];
          if (t && t[0] === opponentColor) moves.push([row + dir, col + dc]);
        }
      });
      break;

    case 'r': // Rook
      for (let i = row - 1; i >= 0; i--) if (!addMove(i, col)) break;
      for (let i = row + 1; i < 8; i++) if (!addMove(i, col)) break;
      for (let i = col - 1; i >= 0; i--) if (!addMove(row, i)) break;
      for (let i = col + 1; i < 8; i++) if (!addMove(row, i)) break;
      break;

    case 'n': // Knight
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
        const r = row + dr, c = col + dc;
        if (isValidPosition(r, c)) {
          const t = board[r][c];
          if (!t || t[0] === opponentColor) moves.push([r, c]);
        }
      });
      break;

    case 'b': // Bishop
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col + i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col + i)) break;
      break;

    case 'q': // Queen (Rook + Bishop)
      for (let i = row - 1; i >= 0; i--) if (!addMove(i, col)) break;
      for (let i = row + 1; i < 8; i++) if (!addMove(i, col)) break;
      for (let i = col - 1; i >= 0; i--) if (!addMove(row, i)) break;
      for (let i = col + 1; i < 8; i++) if (!addMove(row, i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row - i, col + i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col - i)) break;
      for (let i = 1; i < 8; i++) if (!addMove(row + i, col + i)) break;
      break;

    case 'k': // King
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

const getAllMoves = (board, color) => {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === color) {
        getValidMoves(board, r, c, piece).forEach(([tr, tc]) => {
          moves.push({ from: [r, c], to: [tr, tc], piece });
        });
      }
    }
  }
  return moves;
};

const evaluateBoard = (board) => {
  const values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) score += (p[0] === 'w' ? -1 : 1) * (values[p[1]] || 0);
    }
  }
  return score;
};

const getBestMove = (board, depth, isMax) => {
  const color = isMax ? 'b' : 'w';
  const moves = getAllMoves(board, color);
  if (!moves.length) return null;

  let best = null, bestScore = isMax ? -Infinity : Infinity;
  for (const m of moves) {
    const newBoard = board.map(row => [...row]);
    newBoard[m.to[0]][m.to[1]] = newBoard[m.from[0]][m.from[1]];
    newBoard[m.from[0]][m.from[1]] = null;
    const score = depth <= 1 ? evaluateBoard(newBoard) : evaluateBoard(newBoard);
    if (isMax ? score > bestScore : score < bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
};

const ChessGame = ({ mode, onComplete, onClose }) => {
  const [board, setBoard] = useState(INITIAL_BOARD.map(row => [...row]));
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [turn, setTurn] = useState('w');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [captured, setCaptured] = useState({ white: [], black: [] });
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (turn === 'b' && !gameOver && mode !== 'online') {
      setThinking(true);
      setTimeout(() => {
        const best = getBestMove(board, 2, true);
        if (best) {
          makeMove(best.from[0], best.from[1], best.to[0], best.to[1]);
        } else {
          setGameOver(true);
          setWinner('w');
          onComplete && onComplete(100, 'win');
        }
        setThinking(false);
      }, 600);
    }
  }, [turn, gameOver, mode, board]);

  const makeMove = (fromR, fromC, toR, toC) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromR][fromC];
    const cap = newBoard[toR][toC];

    // Pawn promotion
    let finalPiece = piece;
    if (piece[1] === 'p' && (toR === 0 || toR === 7)) finalPiece = piece[0] + 'q';

    newBoard[toR][toC] = finalPiece;
    newBoard[fromR][fromC] = null;

    if (cap) {
      const capColor = cap[0] === 'w' ? 'white' : 'black';
      setCaptured(prev => ({ ...prev, [capColor]: [...prev[capColor], cap] }));
    }

    // Check for king capture
    if (cap && cap[1] === 'k') {
      setGameOver(true);
      setWinner(turn);
      onComplete && onComplete(turn === 'w' ? 100 : 10, turn === 'w' ? 'win' : 'lose');
    }

    const nextTurn = turn === 'w' ? 'b' : 'w';
    if (getAllMoves(newBoard, nextTurn).length === 0) {
      setGameOver(true);
      setWinner(turn);
      onComplete && onComplete(turn === 'w' ? 100 : 10, turn === 'w' ? 'win' : 'lose');
    }

    setBoard(newBoard);
    setTurn(nextTurn);
    setSelected(null);
    setValidMoves([]);
  };

  const handlePress = (row, col) => {
    if (gameOver || thinking || (turn === 'b' && mode !== 'online')) return;

    const piece = board[row][col];

    if (selected) {
      const isValid = validMoves.some(([vr, vc]) => vr === row && vc === col);
      if (isValid) { makeMove(selected[0], selected[1], row, col); return; }
    }

    if (piece && piece[0] === turn) {
      setSelected([row, col]);
      setValidMoves(getValidMoves(board, row, col, piece));
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  };

  const reset = () => {
    setBoard(INITIAL_BOARD.map(row => [...row]));
    setSelected(null);
    setValidMoves([]);
    setTurn('w');
    setGameOver(false);
    setWinner(null);
    setCaptured({ white: [], black: [] });
  };

  const renderSquare = (row, col) => {
    const isDark = (row + col) % 2 === 1;
    const piece = board[row][col];
    const pieceData = getPieceDisplay(piece);
    const isSel = selected && selected[0] === row && selected[1] === col;
    const isValid = validMoves.some(([vr, vc]) => vr === row && vc === col);

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.square,
          isDark ? styles.darkSquare : styles.lightSquare,
          isSel && styles.selectedSquare,
          isValid && styles.validSquare,
        ]}
        onPress={() => handlePress(row, col)}
        activeOpacity={0.8}
      >
        {pieceData && (
          <Text style={[
            styles.piece,
            pieceData.color === 'white' ? styles.whitePiece : styles.blackPiece
          ]}>
            {pieceData.char}
          </Text>
        )}
        {isValid && !piece && <View style={styles.validDot} />}
      </TouchableOpacity>
    );
  };

  const renderCaptured = (color) => (
    <View style={styles.capturedRow}>
      {captured[color].map((p, i) => {
        const d = getPieceDisplay(p);
        return <Text key={i} style={[styles.capturedPiece, d.color === 'white' ? styles.whitePiece : styles.blackPiece]}>{d.char}</Text>;
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>الشطرنج</Text>
        <TouchableOpacity onPress={reset} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      {/* Opponent */}
      <View style={styles.playerRow}>
        <View style={[styles.playerBadge, turn === 'b' && !gameOver && styles.activeBadge]}>
          <Ionicons name="hardware-chip" size={18} color="#f59e0b" />
          <Text style={styles.playerName}>الكمبيوتر</Text>
          {thinking && <Text style={styles.thinkText}>يفكر...</Text>}
        </View>
        {renderCaptured('white')}
      </View>

      {/* Board */}
      <View style={styles.boardWrap}>
        <View style={styles.board}>
          {[0,1,2,3,4,5,6,7].map(row => (
            <View key={row} style={styles.boardRow}>
              {[0,1,2,3,4,5,6,7].map(col => renderSquare(row, col))}
            </View>
          ))}
        </View>
      </View>

      {/* Player */}
      <View style={styles.playerRow}>
        {renderCaptured('black')}
        <View style={[styles.playerBadge, turn === 'w' && !gameOver && styles.activeBadge]}>
          <Ionicons name="person" size={18} color="#60a5fa" />
          <Text style={styles.playerName}>انت</Text>
        </View>
      </View>

      {/* Game Over */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Ionicons name={winner === 'w' ? 'trophy' : 'sad'} size={50} color={winner === 'w' ? '#fbbf24' : '#ef4444'} />
            <Text style={styles.modalTitle}>{winner === 'w' ? 'فوز!' : 'خسارة'}</Text>
            <Text style={styles.modalSub}>{winner === 'w' ? 'احسنت!' : 'حظ اوفر'}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.playBtn} onPress={reset}>
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.playBtnText}>العب مجددا</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
                <Text style={styles.exitBtnText}>خروج</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginVertical: 8 },
  playerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  activeBadge: { backgroundColor: 'rgba(96,165,250,0.15)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  playerName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  thinkText: { color: '#f59e0b', fontSize: 12, marginLeft: 4 },
  capturedRow: { flexDirection: 'row', flexWrap: 'wrap', maxWidth: 140 },
  capturedPiece: { fontSize: 18, marginRight: 2 },
  boardWrap: { alignItems: 'center', marginVertical: 8 },
  board: { borderRadius: 8, overflow: 'hidden', borderWidth: 3, borderColor: '#5c4033' },
  boardRow: { flexDirection: 'row' },
  square: { width: SQUARE_SIZE, height: SQUARE_SIZE, justifyContent: 'center', alignItems: 'center' },
  // خشبي فاتح
  lightSquare: { backgroundColor: '#DEB887' },
  // خشبي غامق
  darkSquare: { backgroundColor: '#8B4513' },
  selectedSquare: { backgroundColor: 'rgba(96,165,250,0.6)' },
  validSquare: { backgroundColor: 'rgba(34,197,94,0.4)' },
  // القطع أكبر وأوضح
  piece: { fontSize: SQUARE_SIZE * 0.92, fontWeight: 'bold', lineHeight: SQUARE_SIZE },
  // القطع البيضاء - كريمي مع حدود سوداء واضحة جداً
  whitePiece: { 
    color: '#FFF8E7', 
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // القطع السوداء - أسود غامق مع حدود فاتحة
  blackPiece: { 
    color: '#0a0a0a',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  validDot: { width: SQUARE_SIZE * 0.25, height: SQUARE_SIZE * 0.25, borderRadius: SQUARE_SIZE * 0.125, backgroundColor: 'rgba(34,197,94,0.7)' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { backgroundColor: '#1a1a24', borderRadius: 24, padding: 32, alignItems: 'center', width: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 28, fontWeight: '700', color: '#FFF', marginTop: 12 },
  modalSub: { fontSize: 14, color: '#888', marginTop: 6 },
  modalBtns: { marginTop: 20, width: '100%', gap: 10 },
  playBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 12 },
  playBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  exitBtn: { paddingVertical: 10, alignItems: 'center' },
  exitBtnText: { color: '#888', fontSize: 14 },
});

export default ChessGame;
