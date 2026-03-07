// Games Screen - Professional Gaming Hub with Multiplayer
// Puzzle, Chess, Tic-Tac-Toe, Trivia, Riddles, Brick Breaker - Online & vs AI
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import storage from '../services/storage';
import multiplayerService from '../services/multiplayer';
import ChessGame from './games/ChessGame';
import BrickBreakerGame from './games/BrickBreakerGame';
import AIQuestGame from './games/AIQuestGame';
import MemoryGame from './games/MemoryGame';
import SnakeGame from './games/SnakeGame';
import ColorSwitchGame from './games/ColorSwitchGame';
import MathRaceGame from './games/MathRaceGame';
import WordRaceGame from './games/WordRaceGame';
import MillionaireScreen from './MillionaireScreen';
import { triviaQuestions, riddlesQuestions } from '../data/questionsData';
import AdChallengesModal from '../components/AdChallengesModal';
import SaqrFortunesScreen from './SaqrFortunesScreen';
import { shuffleArray } from '../utils/random';

const { width, height } = Dimensions.get('window');
const ioniconGlyphMap = Ionicons?.glyphMap || {};
const resolveIconName = (iconName, fallback = 'ellipse-outline') => (
  ioniconGlyphMap[iconName] ? iconName : fallback
);
const FREE_PLAYS_PER_GAME = 2;
const AD_UNLOCK_SESSIONS = 3;
const adGateStorageKey = (userId) => `saqr_games_ad_gate_v3_${userId || 'guest'}`;

// ==================== PREMIUM GAME CARD COMPONENT ====================
const GameCard = ({ game, onPress, pulseAnim, gameCost }) => {
  return (
    <Animated.View style={[styles.gameCardWrapper, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity style={styles.gameCard} onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={['rgba(18,18,28,0.98)', 'rgba(11,11,18,0.98)']}
          style={styles.gameCardShell}
        >
          <View style={styles.gameTopRow}>
            <View style={styles.gameModePills}>
              <View style={[styles.modePill, game.online ? styles.modePillOnline : styles.modePillSolo]}>
                <Ionicons
                  name={game.online ? 'wifi' : 'person'}
                  size={10}
                  color={game.online ? '#60a5fa' : '#22c55e'}
                />
                <Text style={[styles.modePillText, { color: game.online ? '#60a5fa' : '#22c55e' }]}>
                  {game.online ? 'أونلاين' : 'فردي'}
                </Text>
              </View>
              {game.trend ? (
                <View style={styles.trendPill}>
                  <Ionicons name="trending-up" size={10} color="#fbbf24" />
                  <Text style={styles.trendPillText}>{game.trend}</Text>
                </View>
              ) : null}
            </View>
            {game.badge ? <Text style={styles.gameBadgeLabel}>{game.badge}</Text> : null}
          </View>

          <View style={styles.gameArtContainer}>
            <LinearGradient colors={game.colors} style={styles.gameArtGlow} />
            <View style={[styles.gameArtOrb, { borderColor: `${game.accent}66` }]}>
              <LinearGradient colors={game.orbGradient} style={styles.gameArtOrbGradient}>
                <Ionicons name={resolveIconName(game.icon, 'game-controller-outline')} size={34} color="#fff" />
                {game.secondaryIcon ? (
                  <View style={styles.gameSecondaryIcon}>
                    <Ionicons name={resolveIconName(game.secondaryIcon, 'sparkles-outline')} size={12} color="#fff" />
                  </View>
                ) : null}
              </LinearGradient>
            </View>
            <Text style={styles.gameEmoji}>{game.emoji}</Text>
          </View>

          <View style={styles.gameCardFooter}>
            <Text style={styles.gameNameNew}>{game.name}</Text>
            <Text style={styles.gameDescNew} numberOfLines={2}>
              {game.description}
            </Text>
            <View style={styles.gameMetaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="sparkles" size={12} color="#fbbf24" />
                <Text style={styles.metaPillText}>حتى +{game.maxPoints}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="layers-outline" size={12} color="#94a3b8" />
                <Text style={styles.metaPillText}>{game.category}</Text>
              </View>
              {game.online && (
                <View style={styles.metaPill}>
                  <Ionicons name="diamond" size={12} color="#60a5fa" />
                  <Text style={styles.metaPillText}>{gameCost || game.onlineCost || 20}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

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

// ==================== AD CONTINUE MODAL ====================
const AdContinueModal = ({ visible, gameName, onWatchAd, onClose }) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.adModalOverlay}>
        <View style={styles.adModalCard}>
          <LinearGradient colors={['#161625', '#0f0f1b']} style={styles.adModalGradient}>
            <View style={styles.adModalIcon}>
              <Ionicons name="play-circle" size={34} color="#fff" />
            </View>
            <Text style={styles.adModalTitle}>تابع اللعب بدون إزعاج</Text>
            <Text style={styles.adModalSub}>
              لمواصلة لعب {gameName || 'اللعبة'}، شاهد إعلانًا واحدًا فقط وسنفتح لك 3 جولات إضافية.
            </Text>
            <TouchableOpacity style={styles.adModalPrimaryBtn} onPress={onWatchAd} activeOpacity={0.9}>
              <LinearGradient colors={['#ec4899', '#9333ea']} style={styles.adModalPrimaryGradient}>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.adModalPrimaryText}>شاهد إعلان وتابع الآن</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adModalSecondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.adModalSecondaryText}>لاحقًا</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// ==================== TIC TAC TOE GAME ====================
const TicTacToeGame = ({
  mode,
  onComplete,
  onClose,
  isOnline,
  isMyTurn: initialTurn,
  onSendMove,
  variant = 'classic',
  title = 'Arena X-O',
}) => {
  const boardSize = variant === 'pro4' ? 4 : 3;
  const totalCells = boardSize * boardSize;
  const rewardMap = variant === 'pro4'
    ? { win: 26, lose: 7, draw: 12 }
    : { win: 20, lose: 5, draw: 10 };

  const [board, setBoard] = useState(() => Array(totalCells).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(isOnline ? initialTurn : true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ player: 0, opponent: 0, draws: 0 });
  const [opponentName] = useState(isOnline ? 'منافس' : 'الكمبيوتر');

  const checkWinner = useCallback((squares) => {
    for (let row = 0; row < boardSize; row += 1) {
      const first = squares[row * boardSize];
      if (first && Array.from({ length: boardSize }).every((_, c) => squares[row * boardSize + c] === first)) {
        return first;
      }
    }

    for (let col = 0; col < boardSize; col += 1) {
      const first = squares[col];
      if (first && Array.from({ length: boardSize }).every((_, r) => squares[r * boardSize + col] === first)) {
        return first;
      }
    }

    const mainDiag = squares[0];
    if (mainDiag && Array.from({ length: boardSize }).every((_, i) => squares[i * boardSize + i] === mainDiag)) {
      return mainDiag;
    }

    const antiDiag = squares[boardSize - 1];
    if (antiDiag && Array.from({ length: boardSize }).every((_, i) => squares[i * boardSize + (boardSize - 1 - i)] === antiDiag)) {
      return antiDiag;
    }

    return squares.every((s) => s !== null) ? 'draw' : null;
  }, [boardSize]);

  const handleGameEnd = useCallback((result) => {
    setGameOver(true);
    if (result === 'X') {
      setWinner('player');
      setScores((s) => ({ ...s, player: s.player + 1 }));
      onComplete(rewardMap.win, 'win');
    } else if (result === 'O') {
      setWinner('opponent');
      setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
      onComplete(rewardMap.lose, 'lose');
    } else {
      setWinner('draw');
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      onComplete(rewardMap.draw, 'draw');
    }
  }, [onComplete, rewardMap.draw, rewardMap.lose, rewardMap.win]);

  // استقبال حركات الخصم الأونلاين
  useEffect(() => {
    if (!isOnline) return;
    const unsubMove = require('../services/multiplayer').default.on('opponentMove', (data) => {
      if (!data.move || typeof data.move.position !== 'number') return;
      const movePos = data.move.position;

      setBoard((prevBoard) => {
        if (movePos < 0 || movePos >= totalCells || prevBoard[movePos] || gameOver) {
          return prevBoard;
        }
        const nextBoard = [...prevBoard];
        nextBoard[movePos] = 'O';
        const result = checkWinner(nextBoard);
        if (result) {
          handleGameEnd(result);
        } else {
          setIsPlayerTurn(true);
        }
        return nextBoard;
      });
    });

    return () => unsubMove();
  }, [checkWinner, gameOver, handleGameEnd, isOnline, totalCells]);

  const minimax = (squares, isMax, depth = 0) => {
    const result = checkWinner(squares);
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (result === 'draw') return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i += 1) {
        if (!squares[i]) {
          squares[i] = 'O';
          best = Math.max(best, minimax(squares, false, depth + 1));
          squares[i] = null;
        }
      }
      return best;
    }

    let best = Infinity;
    for (let i = 0; i < 9; i += 1) {
      if (!squares[i]) {
        squares[i] = 'X';
        best = Math.min(best, minimax(squares, true, depth + 1));
        squares[i] = null;
      }
    }
    return best;
  };

  const getAIMove = (currentBoard) => {
    const empty = currentBoard
      .map((s, i) => (s === null ? i : null))
      .filter((i) => i !== null);

    if (empty.length === 0) return null;

    if (totalCells > 9) {
      const findCriticalMove = (symbol) => {
        for (const idx of empty) {
          currentBoard[idx] = symbol;
          const wins = checkWinner(currentBoard) === symbol;
          currentBoard[idx] = null;
          if (wins) return idx;
        }
        return null;
      };

      if (mode === 'ai_medium' && Math.random() < 0.45) {
        return empty[Math.floor(Math.random() * empty.length)];
      }

      const winningMove = findCriticalMove('O');
      if (winningMove !== null) return winningMove;

      const blockingMove = findCriticalMove('X');
      if (blockingMove !== null) return blockingMove;

      const center = Math.floor(totalCells / 2);
      if (currentBoard[center] === null) return center;

      return empty[Math.floor(Math.random() * empty.length)];
    }

    if (mode === 'ai_medium' && Math.random() < 0.5) {
      return empty[Math.floor(Math.random() * empty.length)];
    }

    let bestScore = -Infinity;
    let bestMove = empty[0];
    for (const i of empty) {
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

    if (isOnline && onSendMove) {
      onSendMove({ position: index, symbol: 'X' });
    }

    const result = checkWinner(newBoard);
    if (result) {
      handleGameEnd(result);
      return;
    }

    setIsPlayerTurn(false);

    if (!isOnline && (mode === 'ai_medium' || mode === 'ai_hard')) {
      setTimeout(() => {
        const aiIndex = getAIMove([...newBoard]);
        if (aiIndex !== null && aiIndex !== undefined) {
          newBoard[aiIndex] = 'O';
          setBoard([...newBoard]);
          const aiResult = checkWinner(newBoard);
          if (aiResult) {
            handleGameEnd(aiResult);
          } else {
            setIsPlayerTurn(true);
          }
        }
      }, variant === 'pro4' ? 450 : 600);
    }
  };

  const resetGame = () => {
    setBoard(Array(totalCells).fill(null));
    setIsPlayerTurn(isOnline ? initialTurn : true);
    setGameOver(false);
    setWinner(null);
  };

  const boardWidth = Math.min(width - 60, variant === 'pro4' ? 360 : 320);
  const cellSize = (boardWidth - 20) / boardSize;
  const iconSize = boardSize === 4 ? 38 : 50;

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>{title}</Text>
        <TouchableOpacity onPress={resetGame} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

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
          <Ionicons name={isOnline ? 'person' : 'hardware-chip'} size={20} color="#f59e0b" />
          <Text style={styles.scoreLabel}>{opponentName}</Text>
          <Text style={styles.scoreNum}>{scores.opponent}</Text>
        </View>
      </View>

      <View style={[styles.tttBoard, { width: boardWidth }]}>
        {board.map((cell, idx) => {
          const row = Math.floor(idx / boardSize);
          const col = idx % boardSize;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.tttCell,
                {
                  width: cellSize,
                  height: cellSize,
                },
                col !== boardSize - 1 && styles.cellBorderR,
                row !== boardSize - 1 && styles.cellBorderB,
              ]}
              onPress={() => handlePress(idx)}
              activeOpacity={0.7}
            >
              {cell && (
                <Ionicons
                  name={cell === 'X' ? 'close' : 'ellipse-outline'}
                  size={iconSize}
                  color={cell === 'X' ? '#60a5fa' : '#f59e0b'}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

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

      {gameOver && (
        <View style={styles.resultCard}>
          <Ionicons
            name={winner === 'player' ? 'trophy' : winner === 'draw' ? 'remove' : 'sad'}
            size={50}
            color={winner === 'player' ? '#fbbf24' : winner === 'draw' ? '#888' : '#ef4444'}
          />
          <Text style={styles.resultText}>
            {winner === 'player' ? 'فوز!' : winner === 'draw' ? 'تعادل' : 'خسارة'}
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
// ==================== PUZZLE GAME (PROFESSIONAL AI-GENERATED IMAGES) ====================
const PUZZLE_IMAGES = [
  { 
    id: 1, 
    name: 'غروب الشمس', 
    icon: 'sunny', 
    gradient: ['#f59e0b', '#ef4444'], 
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/790aea00464f3094d85b3ec7bcb2afb006df8e90e0f04201191220ec251f21df.png' 
  },
  { 
    id: 2, 
    name: 'الجبال', 
    icon: 'snow', 
    gradient: ['#06b6d4', '#3b82f6'], 
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/3d8c26e54596dfd6119b3e0dbc132bba3f9a7a4b838f53c5f707a8ee3b76a5e5.png' 
  },
  { 
    id: 3, 
    name: 'القطة', 
    icon: 'paw', 
    gradient: ['#f97316', '#fbbf24'], 
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/80dd5458cd76b663ba0070e59843f6a7aba7a44cb4cf4d0a4e40eca1f3712cab.png' 
  },
  { 
    id: 4, 
    name: 'الزهور', 
    icon: 'flower', 
    gradient: ['#ec4899', '#db2777'], 
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/d57d16dad83d4ac03e77928fabc5111a4bd66f58c3ec7ea3def95ff179a63a10.png' 
  },
];

// Responsive puzzle size
const getPuzzleSize = () => {
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth > 600;
  return isTablet ? 350 : screenWidth - 48;
};

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const gridSize = difficulty;
  const puzzleSize = getPuzzleSize();

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
          <View style={[styles.previewImage, { width: width - 80, height: width - 80, overflow: 'hidden', borderRadius: 16 }]}>
            <Image 
              source={{ uri: currentImage.image }} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View style={styles.previewOverlay}>
              <Text style={styles.previewName}>{currentImage.name}</Text>
            </View>
          </View>
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
          <Ionicons name={resolveIconName(currentImage.icon, 'image-outline')} size={20} color="#FFF" />
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

      {/* Puzzle Grid - باستخدام صور حقيقية */}
      <View style={[styles.puzzleGrid, { width: puzzleSize, alignSelf: 'center' }]}>
        {pieces.map((piece, idx) => {
          const pieceSize = (puzzleSize - 8) / gridSize;
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
              {/* عرض جزء من الصورة الحقيقية */}
              <View style={[styles.pieceInner, { overflow: 'hidden' }]}>
                <Image 
                  source={{ uri: currentImage.image }}
                  style={{
                    width: puzzleSize - 8,
                    height: puzzleSize - 8,
                    position: 'absolute',
                    left: -(col * pieceSize),
                    top: -(row * pieceSize),
                  }}
                  resizeMode="cover"
                />
                {/* تأثير عند التحديد */}
                {isSelected && (
                  <View style={styles.pieceSelectedOverlay} />
                )}
                {/* علامة صح للقطع الصحيحة */}
                {isCorrect && !completed && (
                  <View style={styles.pieceCorrectBadge}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </View>
              {/* رقم القطعة */}
              <View style={[styles.pieceNumBadge, isSelected && styles.pieceNumBadgeSelected]}>
                <Text style={styles.pieceNum}>{piece + 1}</Text>
              </View>
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

  // اختيار 50 سؤال عشوائي متغير لكل جولة
  useEffect(() => {
    const shuffled = shuffleArray(triviaQuestions);
    const selected = shuffled.slice(0, 50).map(q => ({
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
    const shuffled = shuffleArray(riddlesQuestions);
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
const GamesScreen = ({ user, onPointsEarned, onOpenDiamondShop, onOpenAchievements, balanceRefresh, language, onClose }) => {
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
  const [showAdChallenges, setShowAdChallenges] = useState(false);
  const [showSaqrFortunes, setShowSaqrFortunes] = useState(false);
  const [showAdUnlockModal, setShowAdUnlockModal] = useState(false);
  const [pendingAdGame, setPendingAdGame] = useState(null);
  const [adGateState, setAdGateState] = useState({ freePlays: {}, adCredits: {} });
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pendingOnlineGameRef = useRef(null);
  const adRewardedRef = useRef(false);

  // كتالوج الألعاب الجديد (12 لعبة: فردي + أونلاين)
  const games = useMemo(() => ([
    {
      id: 'aiquest',
      name: 'AI Quest Infinity',
      icon: 'sparkles',
      secondaryIcon: 'hardware-chip-outline',
      emoji: '🤖',
      colors: ['rgba(236,72,153,0.45)', 'rgba(147,51,234,0.38)'],
      orbGradient: ['#ec4899', '#8b5cf6'],
      accent: '#ec4899',
      description: 'تحديات ذكاء متقدمة متعددة المراحل بإيقاع احترافي.',
      maxPoints: 32,
      online: false,
      onlineCost: 0,
      category: 'ذكاء',
      badge: 'PRO',
      trend: 'رائج',
    },
    {
      id: 'chess',
      name: 'Grand Chess',
      icon: 'shield-half',
      secondaryIcon: 'trail-sign-outline',
      emoji: '♟️',
      colors: ['rgba(124,58,237,0.45)', 'rgba(30,41,59,0.4)'],
      orbGradient: ['#8b5cf6', '#4c1d95'],
      accent: '#8b5cf6',
      description: 'شطرنج تكتيكي بواجهة نظيفة وحساب نقاط متوازن.',
      maxPoints: 26,
      online: false,
      onlineCost: 0,
      category: 'استراتيجية',
      badge: 'Elite',
      trend: '',
    },
    {
      id: 'tictactoe',
      name: 'Arena X-O',
      icon: 'grid',
      secondaryIcon: 'wifi-outline',
      emoji: '⚔️',
      colors: ['rgba(249,115,22,0.48)', 'rgba(234,88,12,0.35)'],
      orbGradient: ['#f97316', '#ea580c'],
      accent: '#f97316',
      description: 'نسخة أونلاين سريعة جدًا لمواجهات مباشرة.',
      maxPoints: 24,
      online: true,
      onlineCost: 20,
      backendGameId: 'tictactoe',
      variant: 'classic',
      category: 'أونلاين',
      badge: 'Live',
      trend: 'PvP',
    },
    {
      id: 'tactix',
      name: 'TactiX 4x4',
      icon: 'grid-outline',
      secondaryIcon: 'flash-outline',
      emoji: '🧠',
      colors: ['rgba(59,130,246,0.5)', 'rgba(14,116,144,0.34)'],
      orbGradient: ['#3b82f6', '#0ea5e9'],
      accent: '#3b82f6',
      description: 'إكس أو موسعة 4x4 مع عمق تكتيكي أعلى.',
      maxPoints: 28,
      online: true,
      onlineCost: 25,
      backendGameId: 'tictactoe',
      variant: 'pro4',
      category: 'أونلاين',
      badge: 'New',
      trend: 'Hot',
    },
    {
      id: 'memory',
      name: 'Memory Matrix',
      icon: 'layers-outline',
      secondaryIcon: 'scan-outline',
      emoji: '🧩',
      colors: ['rgba(20,184,166,0.46)', 'rgba(15,118,110,0.34)'],
      orbGradient: ['#14b8a6', '#0f766e'],
      accent: '#14b8a6',
      description: 'مصفوفة ذاكرة دقيقة بتصاعد صعوبة احترافي.',
      maxPoints: 20,
      online: false,
      onlineCost: 0,
      category: 'تركيز',
      badge: 'Focus',
      trend: '',
    },
    {
      id: 'snake',
      name: 'Neon Snake Rush',
      icon: 'git-branch',
      secondaryIcon: 'flame-outline',
      emoji: '🐍',
      colors: ['rgba(34,197,94,0.46)', 'rgba(21,128,61,0.34)'],
      orbGradient: ['#22c55e', '#15803d'],
      accent: '#22c55e',
      description: 'إيقاع أسرع وكومبو أعلى وتحكم أكثر سلاسة.',
      maxPoints: 22,
      online: false,
      onlineCost: 0,
      category: 'Arcade',
      badge: 'Turbo',
      trend: '',
    },
    {
      id: 'brickbreaker',
      name: 'Brick Storm',
      icon: 'cube',
      secondaryIcon: 'sparkles-outline',
      emoji: '🧱',
      colors: ['rgba(236,72,153,0.45)', 'rgba(190,24,93,0.34)'],
      orbGradient: ['#ec4899', '#be185d'],
      accent: '#ec4899',
      description: 'مراحل متدرجة وتأثيرات كومبو محسّنة للمحترفين.',
      maxPoints: 23,
      online: false,
      onlineCost: 0,
      category: 'Arcade',
      badge: '',
      trend: '',
    },
    {
      id: 'puzzle',
      name: 'Puzzle Studio',
      icon: 'apps-outline',
      secondaryIcon: 'image-outline',
      emoji: '🖼️',
      colors: ['rgba(59,130,246,0.45)', 'rgba(30,64,175,0.34)'],
      orbGradient: ['#3b82f6', '#1e40af'],
      accent: '#3b82f6',
      description: 'ألغاز صور ممتعة بدقة عالية ومراحل متنوعة.',
      maxPoints: 21,
      online: false,
      onlineCost: 0,
      category: 'ألغاز',
      badge: '',
      trend: '',
    },
    {
      id: 'trivia',
      name: 'Trivia Prime',
      icon: 'school',
      secondaryIcon: 'help-circle-outline',
      emoji: '📚',
      colors: ['rgba(16,185,129,0.46)', 'rgba(4,120,87,0.34)'],
      orbGradient: ['#10b981', '#047857'],
      accent: '#10b981',
      description: 'أسئلة متجددة وصياغة احترافية بتحديات دقيقة.',
      maxPoints: 26,
      online: false,
      onlineCost: 0,
      category: 'ثقافة',
      badge: '250+',
      trend: '',
    },
    {
      id: 'mathrace',
      name: 'Math Blitz',
      icon: 'calculator',
      secondaryIcon: 'speedometer-outline',
      emoji: '➗',
      colors: ['rgba(139,92,246,0.45)', 'rgba(109,40,217,0.33)'],
      orbGradient: ['#8b5cf6', '#6d28d9'],
      accent: '#8b5cf6',
      description: 'سرعة حساب مذهلة مع تقييم لحظي وديناميكي.',
      maxPoints: 24,
      online: false,
      onlineCost: 0,
      category: 'رياضيات',
      badge: 'Pro',
      trend: '',
    },
    {
      id: 'wordrace',
      name: 'Word Arena',
      icon: 'text-outline',
      secondaryIcon: 'language-outline',
      emoji: '✍️',
      colors: ['rgba(6,182,212,0.45)', 'rgba(8,145,178,0.33)'],
      orbGradient: ['#06b6d4', '#0891b2'],
      accent: '#06b6d4',
      description: 'تحديات كلمات سريعة مع دعم عربي محسّن.',
      maxPoints: 24,
      online: false,
      onlineCost: 0,
      category: 'لغوي',
      badge: '',
      trend: '',
    },
    {
      id: 'colorswitch',
      name: 'Color Reactor',
      icon: 'color-palette',
      secondaryIcon: 'flash-outline',
      emoji: '🎨',
      colors: ['rgba(244,63,94,0.45)', 'rgba(225,29,72,0.35)'],
      orbGradient: ['#f43f5e', '#e11d48'],
      accent: '#f43f5e',
      description: 'اختبر سرعة ردّ الفعل في نمط بصري متوهج.',
      maxPoints: 19,
      online: false,
      onlineCost: 0,
      category: 'رد فعل',
      badge: '',
      trend: '',
    },
    {
      id: 'riddles',
      name: 'Riddle Mania',
      icon: 'bulb-outline',
      secondaryIcon: 'help-buoy-outline',
      emoji: '💡',
      colors: ['rgba(234,179,8,0.45)', 'rgba(202,138,4,0.33)'],
      orbGradient: ['#eab308', '#ca8a04'],
      accent: '#eab308',
      description: 'ألغاز ممتعة بذكاء تصاعدي لرفع التفاعل.',
      maxPoints: 22,
      online: false,
      onlineCost: 0,
      backendGameId: 'riddles',
      category: 'ألغاز',
      badge: 'Mind',
      trend: '',
    },
    {
      id: 'millionaire',
      name: 'Millionaire Live',
      icon: 'cash-outline',
      secondaryIcon: 'trophy-outline',
      emoji: '💰',
      colors: ['rgba(245,158,11,0.45)', 'rgba(217,119,6,0.33)'],
      orbGradient: ['#f59e0b', '#d97706'],
      accent: '#f59e0b',
      description: 'تجربة أسئلة نهائية بإثارة متصاعدة.',
      maxPoints: 40,
      online: false,
      onlineCost: 0,
      backendGameId: 'millionaire',
      category: 'مميز',
      badge: 'Show',
      trend: 'Top',
    },
    {
      id: 'snakefury',
      name: 'Snake Fury',
      icon: 'git-branch',
      secondaryIcon: 'flame',
      emoji: '⚡',
      colors: ['rgba(34,197,94,0.46)', 'rgba(16,185,129,0.34)'],
      orbGradient: ['#22c55e', '#10b981'],
      accent: '#22c55e',
      description: 'نمط ثعبان أسرع بمضاعف نقاط عالي.',
      maxPoints: 25,
      online: false,
      onlineCost: 0,
      backendGameId: 'snake',
      variant: 'fury',
      category: 'Arcade',
      badge: 'Fast',
      trend: '',
    },
    {
      id: 'memoryflash',
      name: 'Memory Flash',
      icon: 'scan-outline',
      secondaryIcon: 'timer-outline',
      emoji: '🪄',
      colors: ['rgba(20,184,166,0.46)', 'rgba(6,182,212,0.34)'],
      orbGradient: ['#14b8a6', '#06b6d4'],
      accent: '#14b8a6',
      description: 'ذاكرة سريعة بإيقاع خاطف ومكافآت أعلى.',
      maxPoints: 23,
      online: false,
      onlineCost: 0,
      backendGameId: 'memory',
      variant: 'flash',
      category: 'تركيز',
      badge: '',
      trend: '',
    },
    {
      id: 'brickstormx',
      name: 'Brick Storm X',
      icon: 'cube-outline',
      secondaryIcon: 'flash-outline',
      emoji: '💥',
      colors: ['rgba(236,72,153,0.45)', 'rgba(124,58,237,0.33)'],
      orbGradient: ['#ec4899', '#8b5cf6'],
      accent: '#ec4899',
      description: 'تكسير طوب بنمط مكثف وصعوبة أعلى.',
      maxPoints: 27,
      online: false,
      onlineCost: 0,
      backendGameId: 'brickbreaker',
      variant: 'x',
      category: 'Arcade',
      badge: 'Hard',
      trend: '',
    },
    {
      id: 'puzzlemaster',
      name: 'Puzzle Master',
      icon: 'apps',
      secondaryIcon: 'flash-outline',
      emoji: '🧠',
      colors: ['rgba(59,130,246,0.45)', 'rgba(99,102,241,0.33)'],
      orbGradient: ['#3b82f6', '#6366f1'],
      accent: '#3b82f6',
      description: 'ألغاز صور أسرع بزمن أقصر للتحدي.',
      maxPoints: 24,
      online: false,
      onlineCost: 0,
      backendGameId: 'puzzle',
      variant: 'master',
      category: 'ألغاز',
      badge: 'Pro',
      trend: '',
    },
    {
      id: 'triviaplus',
      name: 'Trivia Plus',
      icon: 'school-outline',
      secondaryIcon: 'rocket-outline',
      emoji: '🌍',
      colors: ['rgba(16,185,129,0.45)', 'rgba(59,130,246,0.32)'],
      orbGradient: ['#10b981', '#3b82f6'],
      accent: '#10b981',
      description: 'أسئلة متنوعة بإيقاع أسرع ومكافآت أقوى.',
      maxPoints: 28,
      online: false,
      onlineCost: 0,
      backendGameId: 'trivia',
      variant: 'plus',
      category: 'ثقافة',
      badge: 'Plus',
      trend: '',
    },
    {
      id: 'wordmaster',
      name: 'Word Master',
      icon: 'text-outline',
      secondaryIcon: 'flash-outline',
      emoji: '📝',
      colors: ['rgba(6,182,212,0.45)', 'rgba(14,165,233,0.33)'],
      orbGradient: ['#06b6d4', '#0ea5e9'],
      accent: '#06b6d4',
      description: 'كلمات أصعب وتحفيز أعلى لوقت أطول.',
      maxPoints: 28,
      online: false,
      onlineCost: 0,
      backendGameId: 'wordrace',
      variant: 'master',
      category: 'لغوي',
      badge: '',
      trend: '',
    },
  ]), []);

  const getGameById = useCallback((gameId) => games.find((g) => g.id === gameId), [games]);
  const resolveBackendGameId = useCallback((gameId) => {
    const game = getGameById(gameId);
    return game?.backendGameId || gameId;
  }, [getGameById]);

  useEffect(() => {
    const loadGateState = async () => {
      try {
        const saved = await AsyncStorage.getItem(adGateStorageKey(user?.id));
        if (!saved) return;
        const parsed = JSON.parse(saved);
        setAdGateState({
          freePlays: parsed?.freePlays || {},
          adCredits: parsed?.adCredits || {},
        });
      } catch (e) {
        if (__DEV__) console.log('Ad gate load error:', e.message);
      }
    };
    loadGateState();
  }, [user?.id]);

  useEffect(() => {
    AsyncStorage.setItem(adGateStorageKey(user?.id), JSON.stringify(adGateState)).catch(() => {});
  }, [adGateState, user?.id]);

  const isGameLockedByAds = useCallback((gameId) => {
    const freePlays = adGateState.freePlays?.[gameId] || 0;
    const adCredits = adGateState.adCredits?.[gameId] || 0;
    return freePlays >= FREE_PLAYS_PER_GAME && adCredits <= 0;
  }, [adGateState.adCredits, adGateState.freePlays]);

  const consumeGameSessionCredit = useCallback((gameId) => {
    setAdGateState((prev) => {
      const freePlays = prev.freePlays?.[gameId] || 0;
      const adCredits = prev.adCredits?.[gameId] || 0;

      if (adCredits > 0) {
        return {
          ...prev,
          adCredits: { ...prev.adCredits, [gameId]: Math.max(0, adCredits - 1) },
        };
      }

      return {
        ...prev,
        freePlays: { ...prev.freePlays, [gameId]: freePlays + 1 },
      };
    });
  }, []);

  const unlockAndConsumeGameSession = useCallback((gameId) => {
    setAdGateState((prev) => {
      const freePlays = prev.freePlays?.[gameId] || 0;
      const adCredits = (prev.adCredits?.[gameId] || 0) + AD_UNLOCK_SESSIONS;
      return {
        ...prev,
        freePlays: { ...prev.freePlays, [gameId]: freePlays },
        adCredits: { ...prev.adCredits, [gameId]: Math.max(0, adCredits - 1) },
      };
    });
  }, []);

  const launchGame = useCallback((gameId) => {
    const game = getGameById(gameId);
    if (!game) return;
    if (game.online) {
      setShowModeSelector(gameId);
    } else {
      setActiveGame(gameId);
      setGameMode('solo');
    }
  }, [getGameById]);

  // Multiplayer event handlers
  useEffect(() => {
    const unsubMatchFound = multiplayerService.on('matchFound', (data) => {
      console.log('Match found!', data);
      setShowWaiting(false);
      setMatchData(data);
      setOnlineOpponent(data.players.find(p => p !== user?.id));
      setIsMyTurn(data.your_turn);
      const targetGame = pendingOnlineGameRef.current || data.game_type;
      setActiveGame(targetGame);
      setGameMode('online');
      setShowModeSelector(null);
      pendingOnlineGameRef.current = null;
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

    const unsubConnectionLost = multiplayerService.on('connectionLost', () => {
      setShowWaiting(false);
      pendingOnlineGameRef.current = null;
      Alert.alert('انقطع الاتصال', 'تعذر إكمال البحث عن منافس. حاول مرة أخرى.');
    });

    return () => {
      unsubMatchFound();
      unsubOpponentMove();
      unsubPlayerLeft();
      unsubGameEnded();
      unsubConnectionLost();
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
    if (!user?.id) {
      if (__DEV__) console.log('GamesScreen: No user ID for balance');
      return;
    }
    try {
      const response = await api.getBalance(user.id);
      if (response.ok) {
        const data = await response.json();
        setBalance(prevBalance => ({ ...prevBalance, ...data }));
      } else {
        if (__DEV__) console.log('GamesScreen: Balance API error:', response.status);
      }
    } catch (e) {
      if (__DEV__) console.log('GamesScreen: Balance error:', e.message);
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
      if (__DEV__) console.log('Leaderboard error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = (gameId) => {
    const game = getGameById(gameId);
    if (!game) return;

    if (isGameLockedByAds(gameId)) {
      setPendingAdGame(gameId);
      setShowAdUnlockModal(true);
      return;
    }

    if (!game.online) {
      consumeGameSessionCredit(gameId);
    }

    launchGame(gameId);
  };

  const handleModeSelect = async (mode) => {
    const selectedGame = getGameById(showModeSelector);
    if (!selectedGame) return;
    const backendGameId = resolveBackendGameId(selectedGame.id);

    if (mode === 'online') {
      // التحقق من الرصيد قبل الدخول
      const cost = gameCosts[backendGameId] || selectedGame.onlineCost || 20;
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
        const response = await api.enterOnlineGame(user.id, backendGameId, true);
        if (response.ok) {
          consumeGameSessionCredit(selectedGame.id);
          setShowWaiting(true);
          pendingOnlineGameRef.current = selectedGame.id;
          fetchBalance();
          
          // البحث عن منافس حقيقي عبر WebSocket
          if (multiplayerService.isConnected()) {
            multiplayerService.findMatch(backendGameId);
          } else {
            // إعادة الاتصال والبحث
            await multiplayerService.connect(user.id);
            multiplayerService.findMatch(backendGameId);
          }
        } else {
          const error = await response.json();
          Alert.alert('خطأ', error.detail || 'حدث خطأ');
        }
      } catch (e) {
        Alert.alert('خطأ', 'حدث خطأ في الاتصال');
      }
    } else {
      consumeGameSessionCredit(selectedGame.id);
      setActiveGame(selectedGame.id);
      setGameMode(mode);
      setShowModeSelector(null);
    }
  };

  const cancelOnlineSearch = () => {
    multiplayerService.cancelSearch();
    setShowWaiting(false);
    setShowModeSelector(null);
    pendingOnlineGameRef.current = null;
  };

  const handleWatchAdToContinue = () => {
    setShowAdUnlockModal(false);
    adRewardedRef.current = false;
    setShowSaqrFortunes(true);
  };

  const handleFortunesClose = () => {
    setShowSaqrFortunes(false);
    fetchBalance();

    if (!pendingAdGame) {
      adRewardedRef.current = false;
      return;
    }

    if (adRewardedRef.current) {
      const gameToStart = pendingAdGame;
      setPendingAdGame(null);
      adRewardedRef.current = false;
      unlockAndConsumeGameSession(gameToStart);
      Alert.alert('تم الفتح', 'ممتاز! حصلت على 3 جولات إضافية.');
      launchGame(gameToStart);
      return;
    }

    Alert.alert('للمتابعة', 'شاهد إعلانًا كاملاً في صفحة الإعلانات ثم ارجع للمتابعة.');
  };

  const handleGameComplete = async (points, result) => {
    const isOnline = gameMode === 'online';
    const won = result === 'win';
    
    // إرسال نتيجة اللعبة للخصم إذا كانت أونلاين
    if (isOnline) {
      multiplayerService.endGame({ points }, won ? user.id : onlineOpponent);
    }
    
    try {
      const backendGameId = resolveBackendGameId(activeGame);
      const opponentCost = gameCosts[backendGameId] || 20;
      const response = await api.recordGameResult(
        user.id,
        backendGameId,
        isOnline,
        won,
        isOnline ? opponentCost : 0
      );
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
      pendingOnlineGameRef.current = null;
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
      pendingOnlineGameRef.current = null;
    }
    setActiveGame(null);
    setGameMode(null);
  };

  // مشاهدة إعلان
  const handleWatchAd = async () => {
    // في الإنتاج: استدعاء Google AdMob
    // حالياً: محاكاة مشاهدة إعلان
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1500);
    });
  };

  // استلام مكافأة التحدي
  const handleClaimAdReward = async (amount, type) => {
    if (type === 'diamonds') {
      // إضافة الألماسات للمستخدم
      try {
        const response = await api.addDiamonds(user.id, amount, 'ad_challenge_reward');
        if (response.ok) {
          fetchBalance();
        }
      } catch (e) {
        console.log('Error claiming reward:', e);
      }
    }
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
        return <TicTacToeGame {...gameProps} variant="classic" title="Arena X-O" />;
      case 'tactix':
        return <TicTacToeGame {...gameProps} variant="pro4" title="TactiX 4x4" />;
      case 'brickbreaker':
        return <BrickBreakerGame difficulty={gameMode === 'ai_hard' ? 'hard' : 'medium'} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'brickstormx':
        return <BrickBreakerGame difficulty="hard" onComplete={handleGameComplete} onClose={closeGame} />;
      case 'puzzle':
        return <PuzzleGame {...gameProps} />;
      case 'puzzlemaster':
        return <PuzzleGame {...gameProps} mode="master" />;
      case 'trivia':
        return <TriviaGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'triviaplus':
        return <TriviaGame mode="plus" onComplete={handleGameComplete} onClose={closeGame} />;
      case 'riddles':
        return <RiddlesGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'memory':
        return <MemoryGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'memoryflash':
        return <MemoryGame mode="flash" onComplete={handleGameComplete} onClose={closeGame} />;
      case 'snake':
        return <SnakeGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'snakefury':
        return <SnakeGame mode="fury" onComplete={handleGameComplete} onClose={closeGame} />;
      case 'mathrace':
        return <MathRaceGame {...gameProps} />;
      case 'wordrace':
        return <WordRaceGame {...gameProps} />;
      case 'wordmaster':
        return <WordRaceGame {...gameProps} mode="master" />;
      case 'colorswitch':
        return <ColorSwitchGame mode={gameMode} onComplete={handleGameComplete} onClose={closeGame} />;
      case 'millionaire':
        return <MillionaireScreen onComplete={handleGameComplete} onClose={closeGame} />;
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
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.mainTitle}>الألعاب</Text>
            <Text style={styles.mainSub}>{`${games.length} تجربة متطورة • فردي + أونلاين`}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Daily Points Progress */}
        <View style={styles.dailyProgressCard}>
          <View style={styles.dailyProgressHeader}>
            <Ionicons name="calendar-outline" size={18} color="#10b981" />
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

        {/* Premium Stats Card */}
        <View style={styles.premiumStatsCard}>
          <LinearGradient
            colors={['rgba(30,30,50,0.95)', 'rgba(20,20,35,0.98)']}
            style={styles.premiumStatsGradient}
          >
            {/* Rank */}
            <View style={styles.premiumStatItem}>
              <View style={styles.premiumStatIconBg}>
                <Ionicons name="trophy" size={20} color="#fbbf24" />
              </View>
              <View style={styles.premiumStatInfo}>
                <Text style={styles.premiumStatValue}>#{userStats.rank || '-'}</Text>
                <Text style={styles.premiumStatLabel}>ترتيبك</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.premiumStatDivider} />

            {/* Saqr Points */}
            <View style={styles.premiumStatItem}>
              <View style={[styles.premiumStatIconBg, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Ionicons name="star" size={20} color="#fbbf24" />
              </View>
              <View style={styles.premiumStatInfo}>
                <Text style={styles.premiumStatValue}>{(balance.saqr_points || 0).toLocaleString()}</Text>
                <Text style={styles.premiumStatLabel}>نقاط صقر</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.premiumStatDivider} />

            {/* Diamonds with Shop Button */}
            <TouchableOpacity 
              style={styles.premiumStatItem}
              onPress={onOpenDiamondShop}
              activeOpacity={0.7}
            >
              <View style={[styles.premiumStatIconBg, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
                <Ionicons name="diamond" size={20} color="#60a5fa" />
                <View style={styles.shopPlusBadge}>
                  <Ionicons name="add" size={8} color="#FFF" />
                </View>
              </View>
              <View style={styles.premiumStatInfo}>
                <Text style={[styles.premiumStatValue, { color: '#60a5fa' }]}>{(balance.diamonds || 0).toLocaleString()}</Text>
                <Text style={styles.premiumStatLabel}>ألماسات</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Daily Progress Bar */}
          <View style={styles.dailyProgressContainer}>
            <View style={styles.dailyProgressInfo}>
              <Ionicons name="flash" size={14} color="#22c55e" />
              <Text style={styles.dailyProgressText}>
                {balance.daily_points_remaining || 0} / 150 نقطة يومية متبقية
              </Text>
            </View>
            <View style={styles.dailyProgressBar}>
              <View 
                style={[
                  styles.dailyProgressFill, 
                  { width: `${((150 - (balance.daily_points_remaining || 0)) / 150) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Exchange Rate Info */}
        <View style={styles.exchangeInfo}>
          <Ionicons name="information-circle" size={16} color="#10b981" />
          <Text style={styles.exchangeText}>500 نقطة صقر = 1 دولار</Text>
        </View>

        {/* Ad Challenges Button - ثروات صقر */}
        <TouchableOpacity 
          style={styles.adChallengesBtn}
          onPress={() => setShowSaqrFortunes(true)}
          activeOpacity={0.85}
        >
          <LinearGradient 
            colors={['#ec4899', '#9333ea', '#6366f1']} 
            style={styles.adChallengesGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.adChallengeBtnIcon}>
              <Ionicons name="diamond" size={22} color="#FFF" />
            </View>
            <View style={styles.adChallengesBtnInfo}>
              <Text style={styles.adChallengesBtnTitle}>ثروات صقر</Text>
              <Text style={styles.adChallengesBtnSub}>شاهد واربح من 1 إلى 100 ألماسة! عجلة الحظ وصناديق الكنز</Text>
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>جديد</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Games */}
        <View style={styles.gamesHeaderRow}>
          <Text style={styles.sectionTitle}>مكتبة الألعاب</Text>
          <View style={styles.gamesCountPill}>
            <Ionicons name="rocket-outline" size={12} color="#93c5fd" />
            <Text style={styles.gamesCountText}>{games.length} لعبة</Text>
          </View>
        </View>
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

        {/* Leaderboard Section - New Professional Design */}
        <View style={styles.leaderboardSection}>
          {/* Leaderboard Banner */}
          <ImageBackground
            source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8b2dfe633f2e1cbd852cd43d21c498c0e3b21e805e853619ee9798c4c28a9cf9.png' }}
            style={styles.leaderboardBanner}
            imageStyle={styles.leaderboardBannerImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              style={styles.leaderboardBannerOverlay}
            >
              <Text style={styles.leaderboardBannerTitle}>التصنيف العالمي</Text>
              <Text style={styles.leaderboardBannerDesc}>تنافس مع أفضل اللاعبين!</Text>
            </LinearGradient>
          </ImageBackground>

          {/* Top 3 Rewards */}
          <View style={styles.topRewardsRow}>
            <View style={[styles.topRewardItem, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
              <Ionicons name="medal" size={28} color="#94a3b8" />
              <Text style={styles.topRewardRank}>2</Text>
              <Text style={styles.topRewardPoints}>1900</Text>
            </View>
            <View style={[styles.topRewardItem, styles.topRewardFirst]}>
              <Ionicons name="trophy" size={32} color="#fbbf24" />
              <Text style={styles.topRewardRank}>1</Text>
              <Text style={styles.topRewardPoints}>3000</Text>
            </View>
            <View style={[styles.topRewardItem, { backgroundColor: 'rgba(205, 127, 50, 0.15)' }]}>
              <Ionicons name="medal" size={28} color="#cd7f32" />
              <Text style={styles.topRewardRank}>3</Text>
              <Text style={styles.topRewardPoints}>1000</Text>
            </View>
          </View>

          {/* Leaderboard List */}
          <View style={styles.leaderboardCardNew}>
            {leaderboard.slice(0, 10).map((player, idx) => (
              <View key={idx} style={[styles.lbRowNew, idx < 3 && styles.lbTopRowNew]}>
                <View style={[styles.lbRankBadge, idx === 0 && styles.lbRankGold, idx === 1 && styles.lbRankSilver, idx === 2 && styles.lbRankBronze]}>
                  {idx < 3 ? (
                    <Ionicons name="trophy" size={16} color="#FFF" />
                  ) : (
                    <Text style={styles.lbRankTextNew}>{idx + 1}</Text>
                  )}
                </View>
                <View style={styles.lbInfoNew}>
                  <Text style={styles.lbNameNew}>{player.name}</Text>
                  <View style={styles.lbGamesRow}>
                    <Ionicons name="game-controller" size={12} color="#64748b" />
                    <Text style={styles.lbGamesNew}>{player.gamesPlayed} لعبة</Text>
                  </View>
                </View>
                <View style={styles.lbPointsNew}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.lbPointsTextNew}>{player.points}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Saqr Fortunes Screen */}
      {showSaqrFortunes && (
        <View style={StyleSheet.absoluteFill}>
          <SaqrFortunesScreen
            user={user}
            onClose={handleFortunesClose}
            onBalanceUpdate={() => {
              adRewardedRef.current = true;
              fetchBalance();
            }}
          />
        </View>
      )}

      <AdContinueModal
        visible={showAdUnlockModal}
        gameName={getGameById(pendingAdGame)?.name}
        onWatchAd={handleWatchAdToContinue}
        onClose={() => {
          setShowAdUnlockModal(false);
          setPendingAdGame(null);
        }}
      />

      {/* Ad Challenges Modal (Legacy) */}
      <AdChallengesModal
        visible={showAdChallenges}
        onClose={() => setShowAdChallenges(false)}
        onWatchAd={handleWatchAd}
        onClaimReward={handleClaimAdReward}
        userDiamonds={balance.diamonds || 0}
      />
    </LinearGradient>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  mainHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 50, 
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  mainTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  mainSub: { fontSize: 12, color: '#888', marginTop: 2 },
  
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
  
  // Premium Stats Card
  premiumStatsCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  premiumStatsGradient: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12 },
  premiumStatItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  premiumStatIconBg: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  premiumStatInfo: { alignItems: 'flex-start' },
  premiumStatValue: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  premiumStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  premiumStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },
  shopPlusBadge: { position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(20,20,35,1)' },
  dailyProgressContainer: { backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 10, paddingHorizontal: 16 },
  dailyProgressInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dailyProgressText: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  dailyProgressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  dailyProgressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 2 },
  
  // Exchange Info
  exchangeInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },
  exchangeText: { fontSize: 12, color: '#10b981' },
  
  // Ad Challenges Button
  adChallengesBtn: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  adChallengesGradient: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  adChallengeBtnIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  adChallengesBtnInfo: { flex: 1 },
  adChallengesBtnTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  adChallengesBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  newBadge: { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'right', marginBottom: 12 },
  gamesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  gamesCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  gamesCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93c5fd',
  },
  
  gamesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gameCardWrapper: {
    width: (width - 48) / 2,
    marginHorizontal: 4,
    marginBottom: 12,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 228,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  gameCardShell: {
    flex: 1,
    padding: 12,
    gap: 10,
  },
  gameTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameModePills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modePillSolo: {
    borderColor: 'rgba(34,197,94,0.45)',
    backgroundColor: 'rgba(34,197,94,0.14)',
  },
  modePillOnline: {
    borderColor: 'rgba(96,165,250,0.45)',
    backgroundColor: 'rgba(96,165,250,0.14)',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    backgroundColor: 'rgba(251,191,36,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
  },
  gameBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  gameArtContainer: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameArtGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    opacity: 0.85,
  },
  gameArtOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  gameArtOrbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameSecondaryIcon: {
    position: 'absolute',
    right: 10,
    top: 9,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  gameEmoji: {
    position: 'absolute',
    bottom: 0,
    fontSize: 18,
  },
  gameCardFooter: {
    gap: 6,
  },
  gameNameNew: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  gameDescNew: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 16,
    minHeight: 32,
  },
  gameMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  
  // Old styles kept for compatibility
  gameCardGradient: { padding: 16, alignItems: 'center', minHeight: 180 },
  gameImageContainer: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden', marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  gameImage: { width: '100%', height: '100%', borderRadius: 14 },
  gameIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  gameName: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  gameDesc: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  gameBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 10 },
  gameBadgeText: { fontSize: 9, fontWeight: '700', color: '#000' },
  categoryTag: { backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
  categoryText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  gameFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 3 },
  pointsText: { fontSize: 10, color: '#fbbf24', fontWeight: '600' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(96,165,250,0.2)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, gap: 3 },
  onlineText: { fontSize: 10, color: '#60a5fa', fontWeight: '600' },
  freeBadge: { backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  freeText: { fontSize: 10, color: '#10b981', fontWeight: '600' },
  
  // Diamond with plus badge
  diamondWithPlus: { position: 'relative' },
  plusBadge: { position: 'absolute', top: -4, right: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0a0a0f' },
  
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

  // Ad Continue Modal
  adModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  adModalGradient: {
    padding: 20,
    alignItems: 'center',
  },
  adModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(236,72,153,0.35)',
  },
  adModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  adModalSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  adModalPrimaryBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  adModalPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  adModalPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  adModalSecondaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  adModalSecondaryText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  
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
  puzzleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignSelf: 'center', gap: 4, maxWidth: 500 },
  puzzlePiece: { borderRadius: 10, overflow: 'hidden', position: 'relative' },
  pieceSelected: { borderWidth: 3, borderColor: '#60a5fa', transform: [{ scale: 0.95 }] },
  pieceCorrect: { borderWidth: 2, borderColor: '#10b981' },
  pieceInner: { flex: 1 },
  pieceOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  pieceOverlaySelected: { backgroundColor: 'rgba(59,130,246,0.4)' },
  pieceNum: { fontSize: 22, fontWeight: '700', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
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
  
  // Leaderboard Section - New Professional Design
  leaderboardSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  leaderboardBanner: {
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  leaderboardBannerImage: {
    borderRadius: 20,
  },
  leaderboardBannerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  leaderboardBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  leaderboardBannerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  topRewardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  topRewardItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    width: 90,
  },
  topRewardFirst: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingVertical: 16,
    transform: [{ scale: 1.1 }],
  },
  topRewardRank: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  topRewardPoints: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 2,
  },
  leaderboardCardNew: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lbRowNew: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginVertical: 3,
  },
  lbTopRowNew: {
    backgroundColor: 'rgba(251,191,36,0.05)',
  },
  lbRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lbRankGold: {
    backgroundColor: '#fbbf24',
  },
  lbRankSilver: {
    backgroundColor: '#94a3b8',
  },
  lbRankBronze: {
    backgroundColor: '#cd7f32',
  },
  lbRankTextNew: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  lbInfoNew: {
    flex: 1,
  },
  lbNameNew: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  lbGamesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lbGamesNew: {
    fontSize: 11,
    color: '#64748b',
  },
  lbPointsNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  lbPointsTextNew: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  
  // Puzzle Game Styles - صور حقيقية
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pieceSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  pieceCorrectBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceNumBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceNumBadgeSelected: {
    backgroundColor: '#3b82f6',
  },
});

export default GamesScreen;
