// Games Screen - Professional Gaming Hub with Multiplayer
// Puzzle, Chess, Tic-Tac-Toe, Trivia, Riddles, Brick Breaker - Online & vs AI
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import storage from '../services/storage';
import multiplayerService from '../services/multiplayer';
import ChessGame from './games/ChessGame';
import BrickBreakerGame from './games/BrickBreakerGame';
import AIQuestGame from './games/AIQuestGame';
import MemoryGame from './games/MemoryGame';
import SnakeGame from './games/SnakeGame';
import { triviaQuestions, riddlesQuestions } from '../data/questionsData';
import AdChallengesModal from '../components/AdChallengesModal';

const { width, height } = Dimensions.get('window');

// ==================== GAME CARD COMPONENT - PROFESSIONAL DESIGN ====================
const GameCard = ({ game, onPress, pulseAnim, gameCost }) => (
  <Animated.View style={[styles.gameCardWrapper, { transform: [{ scale: pulseAnim }] }]}>
    <TouchableOpacity style={styles.gameCard} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={game.colors} style={styles.gameCardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Badge */}
        {game.badge ? (
          <View style={styles.gameBadge}>
            <Text style={styles.gameBadgeText}>{game.badge}</Text>
          </View>
        ) : null}
        
        {/* Icon with glow effect */}
        <View style={styles.gameIconContainer}>
          <View style={styles.gameIconGlow} />
          <View style={styles.gameIconBg}>
            <Ionicons name={game.icon} size={36} color="#FFF" />
          </View>
        </View>
        
        {/* Game Info */}
        <Text style={styles.gameName}>{game.name}</Text>
        <Text style={styles.gameDesc}>{game.description}</Text>
        
        {/* Category Tag */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{game.category}</Text>
        </View>
        
        {/* Footer */}
        <View style={styles.gameFooter}>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={styles.pointsText}>+{game.maxPoints}</Text>
          </View>
          {game.online && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Ionicons name="globe" size={12} color="#60a5fa" />
              <Text style={styles.onlineText}>أونلاين</Text>
            </View>
          )}
          {!game.online && (
            <View style={styles.freeBadge}>
              <Ionicons name="game-controller" size={12} color="#10b981" />
              <Text style={styles.freeText}>فردي</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
);

// ==================== MODE SELECTOR ====================
const ModeSelector = ({ onSelectMode, onClose, gameName }) => (
  <View style={styles.modeContainer}>
    <View style={styles.modeHeader}>
      <TouchableOpacity onPress={onClose} style={styles.modeCloseBtn}>
        <Ionicons name="close" size={24} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.modeTitle}>{gameName}</Text>
      <View style={{ width: 40 }} />
    </View>
    
    <Text style={styles.modeSubtitle}>اختر نوع اللعب</Text>
    
    <View style={styles.modeOptions}>
      <TouchableOpacity style={styles.modeOption} onPress={() => onSelectMode('online')}>
        <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.modeGradient}>
          <Ionicons name="globe-outline" size={40} color="#FFF" />
          <Text style={styles.modeOptionTitle}>أونلاين</Text>
          <Text style={styles.modeOptionDesc}>تحدى لاعبين حقيقيين</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.modeOption} onPress={() => onSelectMode('ai_medium')}>
        <LinearGradient colors={['#10b981', '#059669']} style={styles.modeGradient}>
          <Ionicons name="hardware-chip-outline" size={40} color="#FFF" />
          <Text style={styles.modeOptionTitle}>كمبيوتر - متوسط</Text>
          <Text style={styles.modeOptionDesc}>للتدريب والتعلم</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.modeOption} onPress={() => onSelectMode('ai_hard')}>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.modeGradient}>
          <Ionicons name="skull-outline" size={40} color="#FFF" />
          <Text style={styles.modeOptionTitle}>كمبيوتر - صعب</Text>
          <Text style={styles.modeOptionDesc}>تحدٍ حقيقي</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </View>
);

// ==================== WAITING FOR OPPONENT ====================
const WaitingScreen = ({ onCancel, gameType }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, []);
  
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  
  return (
    <View style={styles.waitingContainer}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Ionicons name="sync-outline" size={60} color="#60a5fa" />
      </Animated.View>
      <Text style={styles.waitingTitle}>جاري البحث عن منافس...</Text>
      <Text style={styles.waitingDesc}>انتظر قليلاً ليتم إيجاد لاعب مناسب</Text>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>إلغاء</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==================== TIC TAC TOE GAME ====================
const TicTacToeGame = ({ mode, onComplete, onClose, isOnline, opponent, isMyTurn: initialTurn, matchData, onSendMove }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(isOnline ? initialTurn : true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ player: 0, opponent: 0, draws: 0 });
  const [opponentName, setOpponentName] = useState(isOnline ? 'منافس' : (mode === 'online' ? 'منافس' : 'الكمبيوتر'));

  // استقبال حركات الخصم الأونلاين
  useEffect(() => {
    if (isOnline) {
      const unsubMove = require('../services/multiplayer').default.on('opponentMove', (data) => {
        if (data.move && typeof data.move.position === 'number') {
          const newBoard = [...board];
          newBoard[data.move.position] = 'O';
          setBoard(newBoard);
          
          const result = checkWinner(newBoard);
          if (result) {
            handleGameEnd(result, newBoard);
          } else {
            setIsPlayerTurn(true);
          }
        }
      });
      
      return () => unsubMove();
    }
  }, [board, isOnline]);

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

  const handleGameEnd = (result, newBoard) => {
    setGameOver(true);
    if (result === 'X') {
      setWinner('player');
      setScores(s => ({ ...s, player: s.player + 1 }));
      onComplete(20, 'win');
    } else if (result === 'O') {
      setWinner('opponent');
      setScores(s => ({ ...s, opponent: s.opponent + 1 }));
      onComplete(5, 'lose');
    } else {
      setWinner('draw');
      setScores(s => ({ ...s, draws: s.draws + 1 }));
      onComplete(10, 'draw');
    }
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
    
    if (mode === 'ai_medium') {
      // 50% chance of best move, 50% random
      if (Math.random() < 0.5) {
        return empty[Math.floor(Math.random() * empty.length)];
      }
    }
    
    // Hard mode - always best move
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

    // إرسال الحركة للخصم الأونلاين
    if (isOnline && onSendMove) {
      onSendMove({ position: index, symbol: 'X' });
    }

    const result = checkWinner(newBoard);
    if (result) {
      handleGameEnd(result, newBoard);
      return;
    }

    setIsPlayerTurn(false);
    
    // AI Move (فقط إذا كان اللعب ضد الكمبيوتر)
    if (!isOnline && (mode === 'ai_medium' || mode === 'ai_hard')) {
      setTimeout(() => {
        const aiIndex = getAIMove([...newBoard]);
        if (aiIndex !== null && aiIndex !== undefined) {
          newBoard[aiIndex] = 'O';
          setBoard([...newBoard]);
          const aiResult = checkWinner(newBoard);
          if (aiResult) {
            handleGameEnd(aiResult, newBoard);
          } else {
            setIsPlayerTurn(true);
          }
        }
      }, 600);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner(null);
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>إكس أو</Text>
        <TouchableOpacity onPress={resetGame} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <View style={[styles.scorePlayer, isPlayerTurn && !gameOver && styles.activePlayer]}>
          <Ionicons name="person" size={20} color="#60a5fa" />
          <Text style={styles.scoreLabel}>أنت</Text>
          <Text style={styles.scoreNum}>{scores.player}</Text>
        </View>
        <View style={styles.scoreMiddle}>
          <Text style={styles.drawsLabel}>تعادل</Text>
          <Text style={styles.drawsNum}>{scores.draws}</Text>
        </View>
        <View style={[styles.scorePlayer, !isPlayerTurn && !gameOver && styles.activePlayer]}>
          <Ionicons name={mode === 'online' ? 'person' : 'hardware-chip'} size={20} color="#f59e0b" />
          <Text style={styles.scoreLabel}>{opponentName}</Text>
          <Text style={styles.scoreNum}>{scores.opponent}</Text>
        </View>
      </View>

      {/* Board */}
      <View style={styles.tttBoard}>
        {board.map((cell, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.tttCell,
              idx % 3 !== 2 && styles.cellBorderR,
              idx < 6 && styles.cellBorderB,
            ]}
            onPress={() => handlePress(idx)}
            activeOpacity={0.7}
          >
            {cell && (
              <Ionicons
                name={cell === 'X' ? 'close' : 'ellipse-outline'}
                size={50}
                color={cell === 'X' ? '#60a5fa' : '#f59e0b'}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Turn Indicator */}
      {!gameOver && (
        <View style={styles.turnIndicator}>
          <Ionicons 
            name={isPlayerTurn ? 'close' : 'ellipse-outline'} 
            size={24} 
            color={isPlayerTurn ? '#60a5fa' : '#f59e0b'} 
          />
          <Text style={styles.turnText}>
            {isPlayerTurn ? 'دورك' : `دور ${opponentName}`}
          </Text>
        </View>
      )}

      {/* Game Over */}
      {gameOver && (
        <View style={styles.resultCard}>
          <Ionicons 
            name={winner === 'X' ? 'trophy' : winner === 'draw' ? 'remove' : 'sad'} 
            size={50} 
            color={winner === 'X' ? '#fbbf24' : winner === 'draw' ? '#888' : '#ef4444'} 
          />
          <Text style={styles.resultText}>
            {winner === 'X' ? 'فوز!' : winner === 'draw' ? 'تعادل' : 'خسارة'}
          </Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.playAgainText}>العب مجدداً</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ==================== PUZZLE GAME ====================
// ==================== PUZZLE GAME (PROFESSIONAL IMAGE PUZZLE) ====================
const PUZZLE_IMAGES = [
  { id: 1, name: 'الطبيعة', icon: 'leaf', gradient: ['#22c55e', '#15803d'] },
  { id: 2, name: 'المحيط', icon: 'water', gradient: ['#3b82f6', '#1d4ed8'] },
  { id: 3, name: 'الغروب', icon: 'sunny', gradient: ['#f97316', '#ea580c'] },
  { id: 4, name: 'الفضاء', icon: 'rocket', gradient: ['#8b5cf6', '#7c3aed'] },
  { id: 5, name: 'الصحراء', icon: 'partly-sunny', gradient: ['#fbbf24', '#d97706'] },
  { id: 6, name: 'الزهور', icon: 'flower', gradient: ['#ec4899', '#db2777'] },
];

const PuzzleGame = ({ mode, onComplete, onClose }) => {
  const [pieces, setPieces] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [selected, setSelected] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const [currentImage, setCurrentImage] = useState(PUZZLE_IMAGES[0]);
  const [showPreview, setShowPreview] = useState(true);
  const [hintUsed, setHintUsed] = useState(0);
  const gridSize = difficulty;

  useEffect(() => {
    // عرض الصورة الأصلية لمدة 3 ثواني قبل البدء
    setShowPreview(true);
    const previewTimer = setTimeout(() => {
      setShowPreview(false);
      initPuzzle();
    }, 3000);
    return () => clearTimeout(previewTimer);
  }, [difficulty, currentImage]);

  useEffect(() => {
    let interval;
    if (!completed && pieces.length > 0 && !showPreview) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [completed, pieces, showPreview]);

  const initPuzzle = () => {
    const total = gridSize * gridSize;
    let arr = [...Array(total).keys()];
    // Fisher-Yates Shuffle للتأكد من قابلية الحل
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setPieces(arr);
    setMoves(0);
    setTimer(0);
    setCompleted(false);
    setSelected(null);
    setHintUsed(0);
  };

  const handlePiecePress = (idx) => {
    if (completed || showPreview) return;
    
    if (selected === null) {
      setSelected(idx);
    } else {
      const newPieces = [...pieces];
      [newPieces[selected], newPieces[idx]] = [newPieces[idx], newPieces[selected]];
      setPieces(newPieces);
      setMoves(m => m + 1);
      setSelected(null);

      if (newPieces.every((p, i) => p === i)) {
        setCompleted(true);
        const basePoints = { 3: 50, 4: 100, 5: 150 }[gridSize] || 50;
        const timeBonus = Math.max(0, 30 - Math.floor(timer / 10));
        const movesBonus = Math.max(0, 20 - Math.floor(moves / 5));
        const hintPenalty = hintUsed * 10;
        const totalPoints = Math.max(10, basePoints + timeBonus + movesBonus - hintPenalty);
        onComplete(totalPoints, 'win');
      }
    }
  };

  const useHint = () => {
    if (hintUsed >= 3 || completed) return;
    // عرض الصورة الأصلية لمدة 2 ثانية
    setShowPreview(true);
    setHintUsed(h => h + 1);
    setTimeout(() => setShowPreview(false), 2000);
  };

  const changeImage = () => {
    const currentIdx = PUZZLE_IMAGES.findIndex(img => img.id === currentImage.id);
    const nextIdx = (currentIdx + 1) % PUZZLE_IMAGES.length;
    setCurrentImage(PUZZLE_IMAGES[nextIdx]);
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // شاشة المعاينة
  if (showPreview) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>تركيب الصور</Text>
          <View style={{ width: 44 }} />
        </View>
        
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>احفظ هذه الصورة!</Text>
          <LinearGradient
            colors={currentImage.gradient}
            style={[styles.previewImage, { width: width - 80, height: width - 80 }]}
          >
            <Ionicons name={currentImage.icon} size={60} color="#FFF" />
            <Text style={styles.previewName}>{currentImage.name}</Text>
            <View style={styles.previewGrid}>
              {[...Array(gridSize * gridSize).keys()].map((num) => (
                <View key={num} style={[styles.previewPiece, { width: (width - 100) / gridSize, height: (width - 100) / gridSize }]}>
                  <Text style={styles.previewPieceNum}>{num + 1}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
          <Text style={styles.previewCountdown}>تبدأ اللعبة خلال ثوانٍ...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>تركيب الصور</Text>
        <TouchableOpacity onPress={initPuzzle} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      {/* Current Image Indicator */}
      <TouchableOpacity onPress={changeImage} style={styles.imageIndicator}>
        <LinearGradient colors={currentImage.gradient} style={styles.imageIndicatorGradient}>
          <Ionicons name={currentImage.icon} size={20} color="#FFF" />
          <Text style={styles.imageIndicatorName}>{currentImage.name}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Difficulty Selector */}
      <View style={styles.difficultyRow}>
        {[3, 4, 5].map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d}×{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color="#60a5fa" />
          <Text style={styles.statText}>{formatTime(timer)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="swap-horizontal" size={18} color="#f59e0b" />
          <Text style={styles.statText}>{moves} حركة</Text>
        </View>
        <TouchableOpacity style={styles.hintBtn} onPress={useHint} disabled={hintUsed >= 3}>
          <Ionicons name="bulb" size={18} color={hintUsed >= 3 ? '#666' : '#fbbf24'} />
          <Text style={[styles.hintText, hintUsed >= 3 && { color: '#666' }]}>{3 - hintUsed}</Text>
        </TouchableOpacity>
      </View>

      {/* Puzzle Grid */}
      <View style={[styles.puzzleGrid, { width: width - 40 }]}>
        {pieces.map((piece, idx) => {
          const pieceSize = (width - 48) / gridSize;
          const isCorrect = piece === idx;
          const isSelected = selected === idx;
          
          // حساب موقع القطعة في الشبكة الأصلية
          const row = Math.floor(piece / gridSize);
          const col = piece % gridSize;
          
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.puzzlePiece,
                { width: pieceSize, height: pieceSize },
                isSelected && styles.pieceSelected,
                completed && styles.pieceCorrect,
              ]}
              onPress={() => handlePiecePress(idx)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={completed ? ['#10b981', '#059669'] : 
                        isCorrect ? ['#22c55e', '#16a34a'] : 
                        isSelected ? ['#3b82f6', '#2563eb'] : 
                        currentImage.gradient}
                style={styles.pieceInner}
              >
                <Text style={styles.pieceNum}>{piece + 1}</Text>
                {isCorrect && !completed && (
                  <Ionicons name="checkmark" size={12} color="#fff" style={styles.correctBadge} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {pieces.filter((p, i) => p === i).length} / {gridSize * gridSize} قطعة صحيحة
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(pieces.filter((p, i) => p === i).length / (gridSize * gridSize)) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {completed && (
        <View style={styles.completedCard}>
          <Ionicons name="trophy" size={50} color="#fbbf24" />
          <Text style={styles.completedText}>ممتاز</Text>
          <Text style={styles.completedSub}>{moves} حركة في {formatTime(timer)}</Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={() => {
            setCurrentImage(PUZZLE_IMAGES[Math.floor(Math.random() * PUZZLE_IMAGES.length)]);
          }}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.playAgainText}>صورة جديدة</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ==================== TRIVIA GAME ====================
const TriviaGame = ({ mode, onComplete, onClose }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [questions, setQuestions] = useState([]);

  // اختيار 15 سؤال عشوائي من 100 سؤال
  useEffect(() => {
    const shuffled = [...triviaQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 15).map(q => ({
      q: q.question,
      options: q.options,
      correct: q.answer,
      category: q.category
    }));
    setQuestions(selected);
  }, []);

  useEffect(() => {
    if (questions.length === 0) return;
    if (timeLeft > 0 && answered === null && !showResult) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && answered === null) {
      handleAnswer(-1);
    }
  }, [timeLeft, answered, showResult, questions]);

  const handleAnswer = (idx) => {
    if (answered !== null || questions.length === 0) return;
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
        const finalScore = score + (idx === questions[currentQ].correct ? 10 + Math.floor(timeLeft / 4) : 0);
        onComplete(finalScore, 'win');
      }
    }, 1500);
  };

  if (questions.length === 0) {
    return (
      <View style={styles.gameContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={{ color: '#FFF', marginTop: 20 }}>جاري تحميل الأسئلة...</Text>
      </View>
    );
  }

  if (showResult) {
    const correctAnswers = Math.floor(score / 10);
    return (
      <View style={styles.gameContainer}>
        <View style={styles.resultScreen}>
          <Ionicons name="ribbon" size={80} color="#fbbf24" />
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalLabel}>نقطة</Text>
          <Text style={styles.finalSub}>أجبت بشكل صحيح على {correctAnswers} من {questions.length} سؤال</Text>
          <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
            <Text style={styles.exitText}>إنهاء</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const q = questions[currentQ];

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>أسئلة ثقافية</Text>
        <View style={styles.headerBtn}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{currentQ + 1} / {questions.length}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentQ + 1) / questions.length) * 100}%` }]} />
        </View>
      </View>

      {/* Timer */}
      <View style={[styles.timerCircle, timeLeft <= 5 && styles.timerDanger]}>
        <Ionicons name="time" size={20} color={timeLeft <= 5 ? '#ef4444' : '#60a5fa'} />
        <Text style={[styles.timerText, timeLeft <= 5 && styles.timerDangerText]}>{timeLeft}</Text>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q.q}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {q.options.map((opt, idx) => {
          let optStyle = styles.optionBtn;
          if (answered !== null) {
            if (idx === q.correct) optStyle = [styles.optionBtn, styles.optionCorrect];
            else if (idx === answered) optStyle = [styles.optionBtn, styles.optionWrong];
          }
          
          return (
            <TouchableOpacity
              key={idx}
              style={optStyle}
              onPress={() => handleAnswer(idx)}
              disabled={answered !== null}
            >
              <View style={styles.optionLetter}>
                <Text style={styles.optionLetterText}>{['أ', 'ب', 'ج', 'د'][idx]}</Text>
              </View>
              <Text style={styles.optionText}>{opt}</Text>
              {answered !== null && idx === q.correct && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
              {answered !== null && idx === answered && idx !== q.correct && (
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ==================== RIDDLES GAME ====================
const RiddlesGame = ({ mode, onComplete, onClose }) => {
  const [currentR, setCurrentR] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [hints, setHints] = useState(3);
  const [revealed, setRevealed] = useState(false);
  const [riddles, setRiddles] = useState([]);
  const [timeLeft, setTimeLeft] = useState(25);

  // اختيار 12 لغز عشوائي من 50 لغز
  useEffect(() => {
    const shuffled = [...riddlesQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 12).map(q => ({
      r: q.question,
      options: q.options,
      correct: q.answer
    }));
    setRiddles(selected);
  }, []);

  useEffect(() => {
    if (riddles.length === 0) return;
    if (timeLeft > 0 && answered === null && !showResult) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && answered === null) {
      handleAnswer(-1);
    }
  }, [timeLeft, answered, showResult, riddles]);

  const handleAnswer = (idx) => {
    if (answered !== null || riddles.length === 0) return;
    setAnswered(idx);
    
    if (idx === riddles[currentR].correct) {
      setScore(s => s + 15 + Math.floor(timeLeft / 5));
    }

    setTimeout(() => {
      if (currentR < riddles.length - 1) {
        setCurrentR(c => c + 1);
        setAnswered(null);
        setTimeLeft(25);
        setRevealed(false);
      } else {
        setShowResult(true);
        const finalScore = score + (idx === riddles[currentR].correct ? 15 + Math.floor(timeLeft / 5) : 0);
        onComplete(finalScore, 'win');
      }
    }, 1500);
  };

  const useHint = () => {
    if (hints > 0 && answered === null) {
      setHints(h => h - 1);
      setRevealed(true);
    }
  };

  if (riddles.length === 0) {
    return (
      <View style={styles.gameContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={{ color: '#FFF', marginTop: 20 }}>جاري تحميل الألغاز...</Text>
      </View>
    );
  }

  if (showResult) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.resultScreen}>
          <Ionicons name="bulb" size={80} color="#fbbf24" />
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalLabel}>نقطة</Text>
          <Text style={styles.finalSub}>حللت {riddles.length} لغز</Text>
          <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
            <Text style={styles.exitText}>إنهاء</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const r = riddles[currentR];

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>الألغاز</Text>
        <View style={styles.headerBtn}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <View style={styles.riddleProgress}>
        <Text style={styles.riddleNum}>اللغز {currentR + 1} من {riddles.length}</Text>
        <TouchableOpacity style={styles.hintsBox} onPress={useHint} disabled={hints === 0}>
          <Ionicons name="bulb" size={18} color={hints > 0 ? '#fbbf24' : '#666'} />
          <Text style={styles.hintsText}>{hints}</Text>
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <View style={[styles.timerCircle, timeLeft <= 8 && styles.timerDanger]}>
        <Ionicons name="time" size={20} color={timeLeft <= 8 ? '#ef4444' : '#8b5cf6'} />
        <Text style={[styles.timerText, timeLeft <= 8 && styles.timerDangerText]}>{timeLeft}</Text>
      </View>

      <View style={styles.riddleCard}>
        <Ionicons name="help-circle" size={40} color="#8b5cf6" style={{ marginBottom: 16 }} />
        <Text style={styles.riddleText}>{r.r}</Text>
        
        {revealed && hints < 3 && (
          <View style={styles.hintBox}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.hintText}>تلميح: أحد الخيارات الموجودة</Text>
          </View>
        )}
      </View>

      {/* Options */}
      <View style={styles.optionsGrid}>
        {r.options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.optionBtn,
              answered === idx && idx === r.correct && styles.optionCorrect,
              answered === idx && idx !== r.correct && styles.optionWrong,
              answered !== null && idx === r.correct && styles.optionCorrect,
            ]}
            onPress={() => handleAnswer(idx)}
            disabled={answered !== null}
          >
            <Text style={[
              styles.optionText,
              (answered === idx || (answered !== null && idx === r.correct)) && styles.optionTextSelected
            ]}>
              {opt}
            </Text>
            {answered !== null && idx === r.correct && (
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            )}
            {answered === idx && idx !== r.correct && (
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ==================== MAIN GAMES SCREEN ====================
const GamesScreen = ({ user, onPointsEarned, onOpenDiamondShop, balanceRefresh }) => {
  const [activeGame, setActiveGame] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(null);
  const [showWaiting, setShowWaiting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState({ rank: '-', points: 0, games: 0 });
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ saqr_points: 0, diamonds: 300, daily_points_remaining: 150 });
  const [gameCosts, setGameCosts] = useState({});
  const [onlineOpponent, setOnlineOpponent] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [matchData, setMatchData] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // قائمة الألعاب المحسنة مع أيقونات متطورة
  const games = [
    { 
      id: 'aiquest', 
      name: 'AI Quest', 
      icon: 'sparkles', 
      colors: ['#ec4899', '#9333ea'], 
      description: 'تحدى الذكاء الاصطناعي في مغامرة ذهنية', 
      maxPoints: 30, 
      online: false, 
      onlineCost: 0,
      category: 'ذكاء اصطناعي',
      badge: 'جديد ومميز'
    },
    { 
      id: 'chess', 
      name: 'الشطرنج', 
      icon: 'game-controller', 
      colors: ['#7c3aed', '#4c1d95'], 
      description: 'لعبة الملوك والاستراتيجية', 
      maxPoints: 25, 
      online: true, 
      onlineCost: 30,
      category: 'استراتيجية',
      badge: 'مميز'
    },
    { 
      id: 'tictactoe', 
      name: 'إكس أو', 
      icon: 'grid', 
      colors: ['#f97316', '#c2410c'], 
      description: 'تحدى منافسك وفكر بذكاء', 
      maxPoints: 20, 
      online: true, 
      onlineCost: 20,
      category: 'سريعة',
      badge: 'شعبي'
    },
    { 
      id: 'memory', 
      name: 'الذاكرة', 
      icon: 'copy', 
      colors: ['#14b8a6', '#0f766e'], 
      description: 'اختبر ذاكرتك وركز', 
      maxPoints: 18, 
      online: false, 
      onlineCost: 0,
      category: 'ذهنية',
      badge: ''
    },
    { 
      id: 'snake', 
      name: 'الثعبان', 
      icon: 'git-branch', 
      colors: ['#22c55e', '#15803d'], 
      description: 'اللعبة الكلاسيكية المحبوبة', 
      maxPoints: 20, 
      online: false, 
      onlineCost: 0,
      category: 'كلاسيكية',
      badge: 'كلاسيك'
    },
    { 
      id: 'trivia', 
      name: 'أسئلة ثقافية', 
      icon: 'school', 
      colors: ['#10b981', '#047857'], 
      description: 'اختبر معلوماتك العامة', 
      maxPoints: 25, 
      online: true, 
      onlineCost: 20,
      category: 'ثقافية',
      badge: '250+ سؤال'
    },
    { 
      id: 'puzzle', 
      name: 'تركيب الصور', 
      icon: 'extension-puzzle', 
      colors: ['#3b82f6', '#1e40af'], 
      description: 'رتب القطع لتكمل الصورة', 
      maxPoints: 20, 
      online: true, 
      onlineCost: 25,
      category: 'ذهنية',
      badge: ''
    },
    { 
      id: 'riddles', 
      name: 'الألغاز', 
      icon: 'bulb', 
      colors: ['#eab308', '#ca8a04'], 
      description: 'حل الألغاز الذكية', 
      maxPoints: 20, 
      online: false, 
      onlineCost: 0,
      category: 'ذهنية',
      badge: ''
    },
    { 
      id: 'brickbreaker', 
      name: 'تكسير الطوب', 
      icon: 'cube', 
      colors: ['#ec4899', '#be185d'], 
      description: 'كسّر كل الطوب واربح', 
      maxPoints: 20, 
      online: false, 
      onlineCost: 0,
      category: 'آركيد',
      badge: ''
    },
    { 
      id: 'mathrace', 
      name: 'سباق الحساب', 
      icon: 'calculator', 
      colors: ['#8b5cf6', '#6d28d9'], 
      description: 'حل المعادلات بسرعة', 
      maxPoints: 22, 
      online: true, 
      onlineCost: 20,
      category: 'رياضيات',
      badge: 'تحدي'
    },
    { 
      id: 'wordrace', 
      name: 'سباق الكلمات', 
      icon: 'text', 
      colors: ['#06b6d4', '#0891b2'], 
      description: 'اكتشف الكلمات المخفية', 
      maxPoints: 22, 
      online: true, 
      onlineCost: 25,
      category: 'لغوية',
      badge: ''
    },
    { 
      id: 'colorswitch', 
      name: 'تبديل الألوان', 
      icon: 'color-palette', 
      colors: ['#f43f5e', '#e11d48'], 
      description: 'سرعة التفاعل مع الألوان', 
      maxPoints: 18, 
      online: false, 
      onlineCost: 0,
      category: 'سريعة',
      badge: ''
    },
  ];

  // Multiplayer event handlers
  useEffect(() => {
    const unsubMatchFound = multiplayerService.on('matchFound', (data) => {
      console.log('Match found!', data);
      setShowWaiting(false);
      setMatchData(data);
      setOnlineOpponent(data.players.find(p => p !== user?.id));
      setIsMyTurn(data.your_turn);
      setActiveGame(data.game_type);
      setGameMode('online');
      setShowModeSelector(null);
    });

    const unsubOpponentMove = multiplayerService.on('opponentMove', (data) => {
      console.log('Opponent moved:', data);
      // سيتم معالجتها في كل لعبة
    });

    const unsubPlayerLeft = multiplayerService.on('playerLeft', (data) => {
      Alert.alert('انتهت المباراة', 'غادر الخصم المباراة', [
        { text: 'موافق', onPress: () => {
          handleGameComplete(20, 'win'); // ربح بالانسحاب
          closeGame();
        }}
      ]);
    });

    const unsubGameEnded = multiplayerService.on('gameEnded', (data) => {
      console.log('Game ended:', data);
    });

    return () => {
      unsubMatchFound();
      unsubOpponentMove();
      unsubPlayerLeft();
      unsubGameEnded();
    };
  }, [user?.id]);

  useEffect(() => {
    fetchLeaderboard();
    fetchBalance();
    fetchGameCosts();
    startAnimations();

    // Connect to multiplayer service
    if (user?.id) {
      multiplayerService.connect(user.id).catch(e => console.log('WS connect error:', e));
    }

    return () => {
      multiplayerService.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    if (balanceRefresh) {
      fetchBalance();
    }
  }, [balanceRefresh]);

  const fetchBalance = async () => {
    if (!user?.id) return;
    try {
      const response = await api.getBalance(user.id);
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (e) {
      console.log('Balance error:', e);
    }
  };

  const fetchGameCosts = async () => {
    try {
      const response = await api.getGameCosts();
      if (response.ok) {
        const data = await response.json();
        setGameCosts(data.online_costs || {});
      }
    } catch (e) {
      console.log('Game costs error:', e);
    }
  };

  const startAnimations = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.getLeaderboard();
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        // Find user rank
        const userRank = data.leaderboard?.findIndex(l => l.user_id === user?.id);
        if (userRank >= 0) {
          setUserStats({ rank: userRank + 1, points: data.leaderboard[userRank].saqr_points, games: 0 });
        }
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

  const handleModeSelect = async (mode) => {
    if (mode === 'online') {
      // التحقق من الرصيد قبل الدخول
      const cost = gameCosts[showModeSelector] || 20;
      if (balance.diamonds < cost) {
        Alert.alert(
          'رصيد غير كافٍ',
          `تحتاج ${cost} ألماسة للعب أونلاين. رصيدك الحالي: ${balance.diamonds}`,
          [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'شراء ألماسات', onPress: () => onOpenDiamondShop && onOpenDiamondShop() }
          ]
        );
        return;
      }

      // خصم الألماسات
      try {
        const response = await api.enterOnlineGame(user.id, showModeSelector, true);
        if (response.ok) {
          setShowWaiting(true);
          fetchBalance();
          
          // البحث عن منافس حقيقي عبر WebSocket
          if (multiplayerService.isConnected()) {
            multiplayerService.findMatch(showModeSelector);
          } else {
            // إعادة الاتصال والبحث
            await multiplayerService.connect(user.id);
            multiplayerService.findMatch(showModeSelector);
          }
        } else {
          const error = await response.json();
          Alert.alert('خطأ', error.detail || 'حدث خطأ');
        }
      } catch (e) {
        Alert.alert('خطأ', 'حدث خطأ في الاتصال');
      }
    } else {
      setActiveGame(showModeSelector);
      setGameMode(mode);
      setShowModeSelector(null);
    }
  };

  const cancelOnlineSearch = () => {
    multiplayerService.cancelSearch();
    setShowWaiting(false);
    setShowModeSelector(null);
  };

  const handleGameComplete = async (points, result) => {
    const isOnline = gameMode === 'online';
    const won = result === 'win';
    
    // إرسال نتيجة اللعبة للخصم إذا كانت أونلاين
    if (isOnline) {
      multiplayerService.endGame({ points }, won ? user.id : onlineOpponent);
    }
    
    try {
      const opponentCost = gameCosts[activeGame] || 20;
      const response = await api.recordGameResult(user.id, activeGame, isOnline, won, isOnline ? opponentCost : 0);
      if (response.ok) {
        const data = await response.json();
        if (onPointsEarned && data.points_awarded > 0) {
          onPointsEarned(data.points_awarded);
        }
        
        let message = `حصلت على ${data.points_awarded} نقطة صقر`;
        if (data.diamonds_awarded > 0) {
          message += ` و ${data.diamonds_awarded} ألماسة`;
        }
        if (!data.can_earn_more) {
          message += '\n\nوصلت للحد اليومي (150 نقطة)';
        }
        
        Alert.alert(won ? 'فوز!' : 'نتيجة اللعبة', message);
        fetchBalance();
      }
    } catch (e) {
      console.log('Game complete error:', e);
    }
    
    // تنظيف حالة الأونلاين
    if (gameMode === 'online') {
      setOnlineOpponent(null);
      setIsMyTurn(false);
      setMatchData(null);
    }
    
    fetchLeaderboard();
  };

  const closeGame = () => {
    // إذا كانت لعبة أونلاين، أعلم الخصم
    if (gameMode === 'online') {
      multiplayerService.endGame({ forfeit: true }, onlineOpponent);
      setOnlineOpponent(null);
      setIsMyTurn(false);
      setMatchData(null);
    }
    setActiveGame(null);
    setGameMode(null);
  };

  // Render active game
  if (activeGame) {
    const gameProps = {
      mode: gameMode,
      onComplete: handleGameComplete,
      onClose: closeGame,
      // Props للعب الأونلاين
      isOnline: gameMode === 'online',
      opponent: onlineOpponent,
      isMyTurn: isMyTurn,
      matchData: matchData,
      onSendMove: (move) => multiplayerService.sendMove(move),
    };
    
    switch (activeGame) {
      case 'aiquest':
        return <AIQuestGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'chess':
        return <ChessGame {...gameProps} />;
      case 'tictactoe':
        return <TicTacToeGame {...gameProps} />;
      case 'brickbreaker':
        return <BrickBreakerGame difficulty={gameMode === 'ai_hard' ? 'hard' : 'medium'} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'puzzle':
        return <PuzzleGame {...gameProps} />;
      case 'trivia':
        return <TriviaGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'riddles':
        return <RiddlesGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'memory':
        return <MemoryGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'snake':
        return <SnakeGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'mathrace':
        return <MathRaceGame {...gameProps} />;
      case 'wordrace':
        return <WordRaceGame {...gameProps} />;
      case 'colorswitch':
        return <ColorSwitchGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      default:
        return <ComingSoonGame name={games.find(g => g.id === activeGame)?.name || 'لعبة'} onClose={closeGame} />;
    }
  }

  // Mode selector modal
  if (showModeSelector) {
    return (
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
        {showWaiting ? (
          <WaitingScreen onCancel={cancelOnlineSearch} />
        ) : (
          <ModeSelector
            gameName={games.find(g => g.id === showModeSelector)?.name}
            onSelectMode={handleModeSelect}
            onClose={() => setShowModeSelector(null)}
          />
        )}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.mainHeader}>
          <Text style={styles.mainTitle}>الألعاب</Text>
          <Text style={styles.mainSub}>العب وتنافس واكسب النقاط</Text>
        </View>

        {/* Daily Points Progress */}
        <View style={styles.dailyProgressCard}>
          <View style={styles.dailyProgressHeader}>
            <Ionicons name="today" size={18} color="#10b981" />
            <Text style={styles.dailyProgressTitle}>النقاط اليومية</Text>
          </View>
          <View style={styles.dailyProgressBar}>
            <View style={[styles.dailyProgressFill, { width: `${Math.min(100, ((150 - balance.daily_points_remaining) / 150) * 100)}%` }]} />
          </View>
          <View style={styles.dailyProgressInfo}>
            <Text style={styles.dailyProgressText}>
              {150 - balance.daily_points_remaining} / 150 نقطة
            </Text>
            <Text style={styles.dailyProgressRemaining}>
              متبقي: {balance.daily_points_remaining}
            </Text>
          </View>
        </View>

        {/* User Stats */}
        <View style={styles.userCard}>
          <View style={styles.userStatItem}>
            <Ionicons name="trophy" size={24} color="#fbbf24" />
            <Text style={styles.userStatNum}>#{userStats.rank || '-'}</Text>
            <Text style={styles.userStatLabel}>ترتيبك</Text>
          </View>
          <View style={styles.userStatDivider} />
          <View style={styles.userStatItem}>
            <Ionicons name="star" size={24} color="#fbbf24" />
            <Text style={styles.userStatNum}>{balance.saqr_points || 0}</Text>
            <Text style={styles.userStatLabel}>نقاط صقر</Text>
          </View>
          <View style={styles.userStatDivider} />
          <View style={styles.userStatItem}>
            <Ionicons name="diamond" size={24} color="#60a5fa" />
            <Text style={styles.userStatNum}>{balance.diamonds || 0}</Text>
            <Text style={styles.userStatLabel}>ألماسات</Text>
          </View>
        </View>

        {/* Exchange Rate Info */}
        <View style={styles.exchangeInfo}>
          <Ionicons name="information-circle" size={16} color="#10b981" />
          <Text style={styles.exchangeText}>500 نقطة صقر = 1 دولار</Text>
        </View>

        {/* Games */}
        <Text style={styles.sectionTitle}>اختر لعبة</Text>
        <View style={styles.gamesContainer}>
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onPress={() => handleGameSelect(game.id)}
              pulseAnim={pulseAnim}
              gameCost={gameCosts[game.id]}
            />
          ))}
        </View>

        {/* Leaderboard Rewards Info */}
        <View style={styles.rewardsInfoCard}>
          <View style={styles.rewardsInfoHeader}>
            <Ionicons name="gift" size={20} color="#fbbf24" />
            <Text style={styles.rewardsInfoTitle}>مكافآت المتصدرين</Text>
          </View>
          <View style={styles.rewardsInfoList}>
            <View style={styles.rewardRow}>
              <Ionicons name="medal" size={18} color="#fbbf24" />
              <Text style={styles.rewardText}>المركز الأول: 3000 نقطة</Text>
            </View>
            <View style={styles.rewardRow}>
              <Ionicons name="medal" size={18} color="#94a3b8" />
              <Text style={styles.rewardText}>المركز الثاني: 1900 نقطة</Text>
            </View>
            <View style={styles.rewardRow}>
              <Ionicons name="medal" size={18} color="#cd7f32" />
              <Text style={styles.rewardText}>المركز الثالث: 1000 نقطة</Text>
            </View>
          </View>
        </View>

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>التصنيف العالمي</Text>
        <View style={styles.leaderboardCard}>
          {leaderboard.slice(0, 10).map((player, idx) => (
            <View key={idx} style={[styles.lbRow, idx < 3 && styles.lbTopRow]}>
              <View style={styles.lbRank}>
                {idx < 3 ? (
                  <Ionicons name="medal" size={24} color={['#fbbf24', '#94a3b8', '#cd7f32'][idx]} />
                ) : (
                  <Text style={styles.lbRankText}>#{idx + 1}</Text>
                )}
              </View>
              <View style={styles.lbInfo}>
                <Text style={styles.lbName}>{player.name}</Text>
                <Text style={styles.lbGames}>{player.gamesPlayed} لعبة</Text>
              </View>
              <View style={styles.lbPoints}>
                <Ionicons name="diamond" size={14} color="#fbbf24" />
                <Text style={styles.lbPointsText}>{player.points}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  mainHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  mainTitle: { fontSize: 28, fontWeight: '700', color: '#FFF', textAlign: 'right' },
  mainSub: { fontSize: 14, color: '#888', textAlign: 'right', marginTop: 4 },
  
  // Daily Progress Card
  dailyProgressCard: { marginHorizontal: 20, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  dailyProgressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dailyProgressTitle: { fontSize: 14, fontWeight: '600', color: '#10b981' },
  dailyProgressBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  dailyProgressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 4 },
  dailyProgressInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  dailyProgressText: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  dailyProgressRemaining: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  
  userCard: { marginHorizontal: 20, backgroundColor: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  userStatItem: { alignItems: 'center' },
  userStatNum: { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 6 },
  userStatLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  userStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  // Exchange Info
  exchangeInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 },
  exchangeText: { fontSize: 12, color: '#10b981' },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'right', marginHorizontal: 20, marginBottom: 12 },
  
  gamesContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, justifyContent: 'space-between', marginBottom: 20 },
  gameCardWrapper: { width: (width - 48) / 2, marginHorizontal: 4, marginBottom: 12 },
  gameCard: { borderRadius: 18, overflow: 'hidden' },
  gameCardGradient: { padding: 16, alignItems: 'center', minHeight: 150 },
  gameIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gameName: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  gameDesc: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  gameFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 3 },
  pointsText: { fontSize: 10, color: '#fbbf24', fontWeight: '600' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(96,165,250,0.2)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, gap: 3 },
  onlineText: { fontSize: 10, color: '#60a5fa', fontWeight: '600' },
  freeBadge: { backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  freeText: { fontSize: 10, color: '#10b981', fontWeight: '600' },
  
  // Rewards Info
  rewardsInfoCard: { marginHorizontal: 20, backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)' },
  rewardsInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rewardsInfoTitle: { fontSize: 14, fontWeight: '700', color: '#fbbf24' },
  rewardsInfoList: { gap: 8 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  
  leaderboardCard: { marginHorizontal: 20, backgroundColor: 'rgba(30,41,59,0.4)', borderRadius: 16, padding: 12 },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  lbTopRow: { backgroundColor: 'rgba(251,191,36,0.05)', marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 8 },
  lbRank: { width: 36, alignItems: 'center' },
  lbRankText: { fontSize: 13, color: '#888', fontWeight: '600' },
  lbInfo: { flex: 1, marginLeft: 10 },
  lbName: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  lbGames: { fontSize: 10, color: '#888' },
  lbPoints: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lbPointsText: { fontSize: 14, color: '#fbbf24', fontWeight: '700' },
  
  // Mode Selector
  modeContainer: { flex: 1, padding: 20, paddingTop: 60 },
  modeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  modeCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  modeTitle: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  modeSubtitle: { fontSize: 18, color: '#888', textAlign: 'center', marginBottom: 30 },
  modeOptions: { gap: 16 },
  modeOption: { borderRadius: 20, overflow: 'hidden' },
  modeGradient: { padding: 24, alignItems: 'center' },
  modeOptionTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 12 },
  modeOptionDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  // Waiting
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  waitingTitle: { fontSize: 20, fontWeight: '600', color: '#FFF', marginTop: 24 },
  waitingDesc: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  cancelBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  cancelText: { color: '#FFF', fontSize: 16 },
  
  // Game Common
  gameContainer: { flex: 1, backgroundColor: '#0a0a0f', padding: 20, paddingTop: 50 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  gameTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  scoreText: { fontSize: 18, fontWeight: '700', color: '#fbbf24' },
  
  // Tic Tac Toe
  scoreBoard: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 24 },
  scorePlayer: { alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  activePlayer: { backgroundColor: 'rgba(96,165,250,0.15)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  scoreLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  scoreNum: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  scoreMiddle: { alignItems: 'center' },
  drawsLabel: { fontSize: 12, color: '#666' },
  drawsNum: { fontSize: 20, fontWeight: '600', color: '#888' },
  tttBoard: { flexDirection: 'row', flexWrap: 'wrap', width: width - 60, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 10 },
  tttCell: { width: (width - 80) / 3, height: (width - 80) / 3, justifyContent: 'center', alignItems: 'center' },
  cellBorderR: { borderRightWidth: 2, borderRightColor: 'rgba(255,255,255,0.1)' },
  cellBorderB: { borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.1)' },
  turnIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 8 },
  turnText: { fontSize: 16, color: '#888' },
  resultCard: { alignItems: 'center', marginTop: 30, padding: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  resultText: { fontSize: 28, fontWeight: '700', color: '#FFF', marginTop: 12 },
  playAgainBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  playAgainText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  // Puzzle
  difficultyRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  diffBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  diffBtnActive: { backgroundColor: '#3b82f6' },
  diffText: { color: '#888', fontSize: 14, fontWeight: '600' },
  diffTextActive: { color: '#FFF' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  statText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  puzzleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignSelf: 'center', gap: 4 },
  puzzlePiece: { borderRadius: 10, overflow: 'hidden' },
  pieceSelected: { borderWidth: 3, borderColor: '#60a5fa', transform: [{ scale: 0.95 }] },
  pieceCorrect: { borderWidth: 2, borderColor: '#10b981' },
  pieceInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pieceNum: { fontSize: 22, fontWeight: '700', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  correctBadge: { position: 'absolute', bottom: 4, right: 4 },
  completedCard: { alignItems: 'center', marginTop: 24, padding: 24, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  completedText: { fontSize: 26, fontWeight: '700', color: '#10b981', marginTop: 8 },
  completedSub: { fontSize: 14, color: '#888', marginTop: 4 },
  // Preview Styles
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  previewTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 20 },
  previewImage: { borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  previewEmoji: { fontSize: 60, marginBottom: 10 },
  previewName: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 20 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10, gap: 2 },
  previewPiece: { borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  previewPieceNum: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  previewCountdown: { fontSize: 16, color: '#888', marginTop: 20 },
  // Image Indicator
  imageIndicator: { alignSelf: 'center', marginBottom: 16 },
  imageIndicatorGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  imageIndicatorEmoji: { fontSize: 20 },
  imageIndicatorName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  // Hint Button
  hintBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  hintText: { color: '#fbbf24', fontWeight: '600', fontSize: 14 },
  // Progress Container
  progressContainer: { marginTop: 16, alignItems: 'center' },
  
  // Trivia
  progressRow: { marginBottom: 16 },
  progressText: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  timerCircle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', gap: 6, backgroundColor: 'rgba(96,165,250,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  timerDanger: { backgroundColor: 'rgba(239,68,68,0.1)' },
  timerText: { fontSize: 18, fontWeight: '700', color: '#60a5fa' },
  timerDangerText: { color: '#ef4444' },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 20, marginBottom: 24 },
  questionText: { fontSize: 18, color: '#FFF', textAlign: 'center', lineHeight: 28 },
  optionsContainer: { gap: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  optionCorrect: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981' },
  optionWrong: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionLetterText: { color: '#FFF', fontWeight: '600' },
  optionText: { flex: 1, fontSize: 15, color: '#FFF' },
  resultScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  finalScore: { fontSize: 64, fontWeight: '700', color: '#fbbf24', marginTop: 16 },
  finalLabel: { fontSize: 18, color: '#888' },
  finalSub: { fontSize: 14, color: '#666', marginTop: 8 },
  exitBtn: { marginTop: 30, backgroundColor: '#3b82f6', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  exitText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  // Riddles
  riddleProgress: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  riddleNum: { fontSize: 14, color: '#888' },
  hintsBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  hintsText: { color: '#fbbf24', fontWeight: '600' },
  riddleCard: { backgroundColor: 'rgba(139,92,246,0.1)', padding: 30, borderRadius: 24, alignItems: 'center', marginBottom: 24 },
  riddleText: { fontSize: 20, color: '#FFF', textAlign: 'center', lineHeight: 32 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: 'rgba(251,191,36,0.1)', padding: 12, borderRadius: 12 },
  hintText: { color: '#fbbf24', fontSize: 14 },
  answerSection: { gap: 16 },
  answerInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, fontSize: 16, color: '#FFF', textAlign: 'right', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  riddleBtns: { flexDirection: 'row', gap: 12 },
  hintBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(251,191,36,0.1)', padding: 14, borderRadius: 12 },
  hintBtnText: { color: '#fbbf24', fontWeight: '600' },
  submitBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', padding: 14, borderRadius: 12 },
  submitText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  
  // Options Grid for Riddles/Trivia
  optionsGrid: { gap: 10 },
  optionTextSelected: { color: '#FFF', fontWeight: '700' },
});

export default GamesScreen;
