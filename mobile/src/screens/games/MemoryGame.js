// Memory Game - Professional Memory Match Game
// لعبة الذاكرة الاحترافية - تطابق الأزواج
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import gameSounds from '../../utils/gameSounds';

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 6;
const GRID_COLS = 4;
const CARD_SIZE = (screenWidth - 48 - (CARD_MARGIN * 2 * GRID_COLS)) / GRID_COLS;

// الرموز المستخدمة
const SYMBOLS = [
  { emoji: '🎮', color: '#ef4444' },
  { emoji: '🎯', color: '#f97316' },
  { emoji: '🎲', color: '#fbbf24' },
  { emoji: '🎪', color: '#22c55e' },
  { emoji: '🎨', color: '#3b82f6' },
  { emoji: '🎭', color: '#8b5cf6' },
  { emoji: '🎵', color: '#ec4899' },
  { emoji: '🎬', color: '#06b6d4' },
  { emoji: '⚽', color: '#84cc16' },
  { emoji: '🏀', color: '#f97316' },
  { emoji: '🎾', color: '#eab308' },
  { emoji: '🎱', color: '#1f2937' },
];

const MemoryGame = ({ mode, onComplete, onClose }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [difficulty, setDifficulty] = useState('medium'); // easy: 3x4, medium: 4x4, hard: 4x5
  
  const timerRef = useRef(null);
  const flipAnims = useRef([]);

  // إعداد اللعبة
  useEffect(() => {
    initGame();
    return () => clearInterval(timerRef.current);
  }, [difficulty]);

  const initGame = () => {
    const pairs = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10;
    const selectedSymbols = SYMBOLS.slice(0, pairs);
    const cardPairs = [...selectedSymbols, ...selectedSymbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        ...symbol,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(cardPairs);
    flipAnims.current = cardPairs.map(() => new Animated.Value(0));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setGameOver(false);
    setTimer(0);
    setIsPlaying(false);
    setCombo(0);
  };

  // المؤقت
  useEffect(() => {
    if (isPlaying && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, gameOver]);

  // التحقق من التطابق
  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        // تطابق!
        gameSounds.memoryMatch();
        setMatched(prev => [...prev, first, second]);
        setScore(s => s + (100 * (1 + combo * 0.2)));
        setCombo(c => c + 1);
        setFlipped([]);
        
        // التحقق من الفوز
        if (matched.length + 2 === cards.length) {
          endGame(true);
        }
      } else {
        // لا تطابق
        gameSounds.memoryMismatch();
        setCombo(0);
        setTimeout(() => {
          // قلب البطاقات
          flipAnims.current[first] && Animated.timing(flipAnims.current[first], {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
          flipAnims.current[second] && Animated.timing(flipAnims.current[second], {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
          setFlipped([]);
        }, 1000);
      }
    }
  }, [flipped]);

  const flipCard = (index) => {
    if (gameOver || flipped.length >= 2 || flipped.includes(index) || matched.includes(index)) {
      return;
    }

    if (!isPlaying) {
      setIsPlaying(true);
    }

    gameSounds.buttonTap();
    setMoves(m => m + 1);
    setFlipped(prev => [...prev, index]);
    
    // أنيميشن القلب
    Animated.timing(flipAnims.current[index], {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const endGame = (won) => {
    clearInterval(timerRef.current);
    setGameOver(true);
    
    if (won) {
      gameSounds.win();
      if (!bestTime || timer < bestTime) {
        setBestTime(timer);
      }
      
      // حساب النقاط بناءً على الوقت والحركات
      const timeBonus = Math.max(0, 300 - timer * 2);
      const moveBonus = Math.max(0, 200 - moves * 5);
      const finalScore = score + timeBonus + moveBonus;
      
      onComplete && onComplete(Math.min(100, Math.floor(finalScore / 10)), 'win');
    } else {
      gameSounds.lose();
      onComplete && onComplete(10, 'lose');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCard = (card, index) => {
    const isFlippedCard = flipped.includes(index) || matched.includes(index);
    const flipAnim = flipAnims.current[index];
    
    const frontInterpolate = flipAnim?.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '360deg'],
    }) || '180deg';
    
    const backInterpolate = flipAnim?.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    }) || '0deg';

    return (
      <TouchableOpacity
        key={card.id}
        style={styles.cardContainer}
        onPress={() => flipCard(index)}
        activeOpacity={0.9}
      >
        {/* الوجه الخلفي */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { transform: [{ rotateY: backInterpolate }] },
          ]}
        >
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.cardGradient}
          >
            <Text style={styles.cardBackIcon}>❓</Text>
          </LinearGradient>
        </Animated.View>
        
        {/* الوجه الأمامي */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            { 
              transform: [{ rotateY: frontInterpolate }],
              backgroundColor: matched.includes(index) ? '#22c55e20' : '#FFF',
            },
          ]}
        >
          <Text style={styles.cardEmoji}>{card.emoji}</Text>
          {matched.includes(index) && (
            <View style={styles.matchedBadge}>
              <Ionicons name="checkmark" size={16} color="#22c55e" />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const gridRows = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e1b4b', '#312e81', '#1e1b4b']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <Text style={styles.title}>لعبة الذاكرة</Text>
          
          <TouchableOpacity style={styles.headerBtn} onPress={initGame}>
            <Ionicons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={20} color="#fbbf24" />
            <Text style={styles.statValue}>{formatTime(timer)}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="hand-left-outline" size={20} color="#3b82f6" />
            <Text style={styles.statValue}>{moves}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="star" size={20} color="#22c55e" />
            <Text style={styles.statValue}>{Math.floor(score)}</Text>
          </View>
          {combo > 1 && (
            <View style={[styles.statBox, styles.comboBox]}>
              <Text style={styles.comboText}>x{combo}</Text>
            </View>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(matched.length / cards.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {matched.length / 2} / {cards.length / 2}
          </Text>
        </View>

        {/* Game Board */}
        <View style={styles.board}>
          <View style={[styles.grid, { flexWrap: 'wrap' }]}>
            {cards.map((card, index) => renderCard(card, index))}
          </View>
        </View>

        {/* Difficulty Selector (before game starts) */}
        {!isPlaying && moves === 0 && (
          <View style={styles.difficultyRow}>
            {['easy', 'medium', 'hard'].map((diff) => (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.diffBtn,
                  difficulty === diff && styles.diffBtnActive,
                ]}
                onPress={() => setDifficulty(diff)}
              >
                <Text style={[
                  styles.diffText,
                  difficulty === diff && styles.diffTextActive,
                ]}>
                  {diff === 'easy' ? 'سهل' : diff === 'medium' ? 'متوسط' : 'صعب'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Game Over */}
        {gameOver && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverModal}>
              <Text style={styles.gameOverEmoji}>🎉</Text>
              <Text style={styles.gameOverTitle}>أحسنت!</Text>
              <Text style={styles.gameOverSubtitle}>أكملت اللعبة</Text>
              
              <View style={styles.finalStats}>
                <View style={styles.finalStatItem}>
                  <Text style={styles.finalStatLabel}>الوقت</Text>
                  <Text style={styles.finalStatValue}>{formatTime(timer)}</Text>
                </View>
                <View style={styles.finalStatItem}>
                  <Text style={styles.finalStatLabel}>الحركات</Text>
                  <Text style={styles.finalStatValue}>{moves}</Text>
                </View>
                <View style={styles.finalStatItem}>
                  <Text style={styles.finalStatLabel}>النقاط</Text>
                  <Text style={styles.finalStatValue}>{Math.floor(score)}</Text>
                </View>
              </View>

              {bestTime && timer <= bestTime && (
                <Text style={styles.newRecord}>🏆 أفضل وقت!</Text>
              )}

              <View style={styles.gameOverButtons}>
                <TouchableOpacity style={styles.playAgainBtn} onPress={initGame}>
                  <Ionicons name="refresh" size={20} color="#FFF" />
                  <Text style={styles.playAgainText}>العب مرة أخرى</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
                  <Text style={styles.exitText}>خروج</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
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
    fontWeight: 'bold',
    color: '#FFF',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comboBox: {
    backgroundColor: '#f59e0b',
  },
  comboText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },

  board: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cardContainer: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: CARD_MARGIN,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backfaceVisibility: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    overflow: 'hidden',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cardBackIcon: {
    fontSize: CARD_SIZE * 0.4,
  },
  cardFront: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  cardEmoji: {
    fontSize: CARD_SIZE * 0.5,
  },
  matchedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  diffBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  diffBtnActive: {
    backgroundColor: '#3b82f6',
  },
  diffText: {
    color: '#888',
    fontSize: 14,
  },
  diffTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverModal: {
    backgroundColor: '#1e1b4b',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '85%',
  },
  gameOverEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  gameOverTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  gameOverSubtitle: {
    color: '#888',
    fontSize: 16,
    marginBottom: 20,
  },
  finalStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  finalStatItem: {
    alignItems: 'center',
  },
  finalStatLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  finalStatValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  newRecord: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  gameOverButtons: {
    width: '100%',
    gap: 12,
  },
  playAgainBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playAgainText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default MemoryGame;
