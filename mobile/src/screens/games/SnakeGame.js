// Snake Game - Professional Touch Control Snake
// لعبة الثعبان بالتحكم باللمس (السحب)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ImageBackground,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// AI-Generated Professional Background
const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/2abaadcae5e79b9f0fb8beb005410c0d4e020163500cfde37b75485bea913ea2.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 600;
const MAX_GAME_SIZE = isTablet ? 400 : screenWidth - 40;
const GRID_SIZE = 15;
const CELL_SIZE = Math.floor(MAX_GAME_SIZE / GRID_SIZE);

// سرعات حسب المستوى
const SPEEDS = {
  easy: 200,
  medium: 150,
  hard: 100,
  extreme: 60,
};

// أنواع الطعام المختلفة
const FOOD_TYPES = [
  { icon: 'ellipse', points: 10, color: '#ef4444' },
  { icon: 'flame', points: 15, color: '#f97316' },
  { icon: 'diamond', points: 20, color: '#8b5cf6' },
  { icon: 'star', points: 30, color: '#fbbf24' },
  { icon: 'flash', points: 50, color: '#3b82f6' },
];

const SnakeGame = ({ mode = 'medium', onComplete, onClose }) => {
  const [snake, setSnake] = useState([
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
  ]);
  const [food, setFood] = useState({ x: 10, y: 7, type: FOOD_TYPES[0] });
  const [bonusFood, setBonusFood] = useState(null);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [difficulty, setDifficulty] = useState(mode);
  
  const gameLoopRef = useRef(null);
  const directionRef = useRef({ x: 1, y: 0 });
  const comboTimerRef = useRef(null);
  const speedRef = useRef(SPEEDS[mode] || SPEEDS.medium);
  
  // Animations
  const foodAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;

  // Touch Control - PanResponder للسحب
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        // حد أدنى للسحب 20 بكسل
        if (absDx < 20 && absDy < 20) return;
        
        const currentDir = directionRef.current;
        
        if (absDx > absDy) {
          // حركة أفقية
          if (dx > 0 && currentDir.x !== -1) {
            changeDirection({ x: 1, y: 0 }); // يمين
          } else if (dx < 0 && currentDir.x !== 1) {
            changeDirection({ x: -1, y: 0 }); // يسار
          }
        } else {
          // حركة عمودية
          if (dy > 0 && currentDir.y !== -1) {
            changeDirection({ x: 0, y: 1 }); // أسفل
          } else if (dy < 0 && currentDir.y !== 1) {
            changeDirection({ x: 0, y: -1 }); // أعلى
          }
        }
      },
    })
  ).current;

  // تأثير الطعام
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(foodAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(foodAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    return () => clearTimeout(comboTimerRef.current);
  }, []);

  // إنشاء طعام عشوائي
  const generateFood = useCallback((currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    
    const typeIndex = Math.min(Math.floor(Math.random() * Math.min(level, FOOD_TYPES.length)), FOOD_TYPES.length - 1);
    newFood.type = FOOD_TYPES[typeIndex];
    
    return newFood;
  }, [level]);

  // إنشاء طعام إضافي
  const spawnBonusFood = useCallback((currentSnake) => {
    if (Math.random() < 0.15) {
      let pos;
      do {
        pos = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } while (currentSnake.some(seg => seg.x === pos.x && seg.y === pos.y));
      
      setBonusFood({
        ...pos,
        type: { icon: 'sparkles', points: 100, color: '#fbbf24' },
        expiresAt: Date.now() + 5000,
      });
      
      setTimeout(() => setBonusFood(null), 5000);
    }
  }, []);

  // Game Loop
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    gameLoopRef.current = setInterval(() => {
      setSnake(currentSnake => {
        const head = { ...currentSnake[0] };
        const currentDir = directionRef.current;
        
        head.x += currentDir.x;
        head.y += currentDir.y;

        // التفاف الشاشة
        if (head.x < 0) head.x = GRID_SIZE - 1;
        if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        if (head.y >= GRID_SIZE) head.y = 0;

        const ateMainFood = head.x === food.x && head.y === food.y;
        const ateBonusFood = bonusFood && head.x === bonusFood.x && head.y === bonusFood.y;

        // السماح بالحركة إلى موقع الذيل إذا لم يكن هناك أكل في نفس الخطوة
        const bodyToCheck = ateMainFood || ateBonusFood ? currentSnake : currentSnake.slice(0, -1);
        if (bodyToCheck.some(seg => seg.x === head.x && seg.y === head.y)) {
          endGame(score);
          return currentSnake;
        }

        const newSnake = [head, ...currentSnake];

        // أكل الطعام
        if (ateMainFood) {
          const points = food.type.points * (1 + combo * 0.1);
          setScore(s => {
            const newScore = s + Math.round(points);
            // زيادة المستوى
            if (newScore >= level * 100) {
              setLevel(l => l + 1);
              speedRef.current = Math.max(40, speedRef.current - 10);
            }
            return newScore;
          });
          
          // تأثير النقاط
          Animated.sequence([
            Animated.timing(scoreAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.timing(scoreAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          ]).start();
          
          // كومبو
          setCombo(c => c + 1);
          setShowCombo(true);
          clearTimeout(comboTimerRef.current);
          comboTimerRef.current = setTimeout(() => {
            setCombo(0);
            setShowCombo(false);
          }, 3000);
          
          setFood(generateFood(newSnake));
          spawnBonusFood(newSnake);
          
          return newSnake;
        }

        // أكل الطعام الإضافي
        if (ateBonusFood) {
          setScore(s => s + bonusFood.type.points);
          setBonusFood(null);
          return newSnake;
        }

        newSnake.pop();
        return newSnake;
      });
    }, speedRef.current);

    return () => clearInterval(gameLoopRef.current);
  }, [gameStarted, gameOver, isPaused, food, bonusFood, score, combo, level, generateFood, spawnBonusFood]);

  const endGame = (finalScore) => {
    clearInterval(gameLoopRef.current);
    clearTimeout(comboTimerRef.current);
    setGameOver(true);

    const newRecord = finalScore > highScore;
    setIsNewRecord(newRecord);
    if (newRecord) {
      setHighScore(finalScore);
    }
    
    let points = 10;
    if (finalScore >= 500) points = 50;
    else if (finalScore >= 300) points = 35;
    else if (finalScore >= 100) points = 25;
    else if (finalScore >= 50) points = 15;
    
    onComplete && onComplete(points, finalScore >= 100 ? 'win' : 'lose');
  };

  const changeDirection = (newDir) => {
    if (gameOver || isPaused) return;
    
    const currentDir = directionRef.current;
    if (newDir.x !== -currentDir.x || newDir.y !== -currentDir.y) {
      directionRef.current = newDir;
      setDirection(newDir);
    }
  };

  const startGame = (diff) => {
    clearTimeout(comboTimerRef.current);
    setDifficulty(diff);
    speedRef.current = SPEEDS[diff] || SPEEDS.medium;
    setGameStarted(true);
    setSnake([{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }]);
    setFood({ x: 10, y: 7, type: FOOD_TYPES[0] });
    setBonusFood(null);
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setLevel(1);
    setCombo(0);
    setShowCombo(false);
    setIsNewRecord(false);
  };

  const resetGame = () => {
    startGame(difficulty);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // شاشة اختيار الصعوبة
  if (!gameStarted) {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.difficultyScreen}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.gameTitle}>الثعبان</Text>
            <Text style={styles.gameSubtitle}>اسحب للتحكم في الاتجاه</Text>
            
            <View style={styles.difficultyOptions}>
              <TouchableOpacity style={[styles.diffBtn, { backgroundColor: '#22c55e' }]} onPress={() => startGame('easy')}>
                <Ionicons name="leaf" size={24} color="#FFF" />
                <Text style={styles.diffText}>سهل</Text>
                <Text style={styles.diffDesc}>للمبتدئين</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.diffBtn, { backgroundColor: '#f59e0b' }]} onPress={() => startGame('medium')}>
                <Ionicons name="flash" size={24} color="#FFF" />
                <Text style={styles.diffText}>متوسط</Text>
                <Text style={styles.diffDesc}>تحدي معتدل</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.diffBtn, { backgroundColor: '#ef4444' }]} onPress={() => startGame('hard')}>
                <Ionicons name="flame" size={24} color="#FFF" />
                <Text style={styles.diffText}>صعب</Text>
                <Text style={styles.diffDesc}>للمحترفين</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.diffBtn, { backgroundColor: '#7c3aed' }]} onPress={() => startGame('extreme')}>
                <Ionicons name="skull" size={24} color="#FFF" />
                <Text style={styles.diffText}>جهنمي</Text>
                <Text style={styles.diffDesc}>مستحيل!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // رندر خلية
  const renderCell = (x, y) => {
    const isSnakeHead = snake[0].x === x && snake[0].y === y;
    const isSnakeBody = snake.slice(1).some(seg => seg.x === x && seg.y === y);
    const isFood = food.x === x && food.y === y;
    const isBonusFood = bonusFood && bonusFood.x === x && bonusFood.y === y;
    const snakeIndex = snake.findIndex(seg => seg.x === x && seg.y === y);

    return (
      <View key={`${x}-${y}`} style={styles.cell}>
        {isSnakeHead && (
          <View style={[styles.snakeHead, {
            transform: [
              { rotate: direction.x === 1 ? '0deg' : direction.x === -1 ? '180deg' : direction.y === 1 ? '90deg' : '-90deg' }
            ]
          }]}>
            <Ionicons name="caret-forward" size={12} color="#fff" />
          </View>
        )}
        {isSnakeBody && (
          <View style={[
            styles.snakeBody,
            { opacity: 1 - (snakeIndex * 0.02) }
          ]} />
        )}
        {isFood && (
          <Animated.View style={[styles.food, { transform: [{ scale: foodAnim }] }]}>
            <Ionicons name={food.type.icon} size={12} color="#fff" />
          </Animated.View>
        )}
        {isBonusFood && (
          <Animated.View style={[styles.bonusFood, { transform: [{ scale: foodAnim }] }]}>
            <Ionicons name={bonusFood.type.icon} size={12} color="#fff" />
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.scoreContainer}>
            <Animated.Text style={[styles.score, { transform: [{ scale: scoreAnim }] }]}>
              {score}
            </Animated.Text>
            <Text style={styles.highScore}>أعلى: {highScore}</Text>
          </View>
          
          <TouchableOpacity style={styles.headerBtn} onPress={togglePause}>
            <Ionicons name={isPaused ? "play" : "pause"} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Ionicons name="flash" size={16} color="#fbbf24" />
            <Text style={styles.statText}>المستوى {level}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statText}>الطول: {snake.length}</Text>
          </View>
          {showCombo && combo > 1 && (
            <View style={[styles.statItem, styles.comboItem]}>
              <Text style={styles.comboText}>x{combo} كومبو!</Text>
            </View>
          )}
        </View>

        {/* نص التعليمات */}
        <Text style={styles.swipeHint}>اسحب للتحكم</Text>

        {/* Game Board with Touch */}
        <View style={styles.boardContainer} {...panResponder.panHandlers}>
          <View style={styles.board}>
            {Array.from({ length: GRID_SIZE }, (_, y) => (
              <View key={y} style={styles.row}>
                {Array.from({ length: GRID_SIZE }, (_, x) => renderCell(x, y))}
              </View>
            ))}
          </View>
        </View>

        {/* Pause Overlay */}
        {isPaused && !gameOver && (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseModal}>
              <Ionicons name="pause-circle" size={54} color="#60a5fa" style={styles.pauseIcon} />
              <Text style={styles.pauseTitle}>إيقاف مؤقت</Text>
              <TouchableOpacity style={styles.resumeBtn} onPress={togglePause}>
                <Text style={styles.resumeText}>استمرار</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Game Over */}
        {gameOver && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverModal}>
              <Ionicons
                name={score >= 100 ? 'trophy' : score >= 50 ? 'thumbs-up' : 'close-circle'}
                size={54}
                color={score >= 100 ? '#fbbf24' : score >= 50 ? '#22c55e' : '#ef4444'}
                style={styles.gameOverIcon}
              />
              <Text style={styles.gameOverTitle}>انتهت اللعبة!</Text>
              <Text style={styles.finalScore}>{score} نقطة</Text>
              {isNewRecord && score > 0 && (
                <Text style={styles.newRecord}>رقم قياسي جديد</Text>
              )}
              <View style={styles.gameOverStats}>
                <Text style={styles.statLabel}>الطول: {snake.length}</Text>
                <Text style={styles.statLabel}>المستوى: {level}</Text>
              </View>
              <View style={styles.gameOverButtons}>
                <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
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
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  
  // Difficulty Screen
  difficultyScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
  },
  gameTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  gameSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 40,
  },
  difficultyOptions: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
  },
  diffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  diffText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  diffDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: { alignItems: 'center' },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  highScore: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    color: '#FFF',
    fontSize: 12,
  },
  comboItem: {
    backgroundColor: '#f59e0b',
  },
  comboText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Swipe Hint
  swipeHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginVertical: 8,
  },

  // Board
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  board: {
    width: GRID_SIZE * CELL_SIZE,
    height: GRID_SIZE * CELL_SIZE,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  row: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  
  // Snake
  snakeHead: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snakeBody: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    borderRadius: (CELL_SIZE - 4) / 2,
    backgroundColor: '#22c55e',
  },
  
  // Food
  food: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusFood: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pause
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseModal: {
    backgroundColor: '#1e1e2e',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  pauseIcon: { marginBottom: 16 },
  pauseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  resumeBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resumeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Game Over
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverModal: {
    backgroundColor: '#1e1e2e',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
  },
  gameOverIcon: { marginBottom: 12 },
  gameOverTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  finalScore: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 8,
  },
  newRecord: {
    fontSize: 16,
    color: '#22c55e',
    marginBottom: 16,
  },
  gameOverStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  gameOverButtons: {
    width: '100%',
    gap: 12,
  },
  playAgainBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  playAgainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exitBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  exitText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});

export default SnakeGame;
