// Snake Game - Professional Snake with Effects & Sounds
// لعبة الثعبان الاحترافية مع تأثيرات وأصوات
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 600;
const MAX_GAME_SIZE = isTablet ? 400 : screenWidth - 40;
const GRID_SIZE = 15;
const CELL_SIZE = Math.floor(MAX_GAME_SIZE / GRID_SIZE);
const INITIAL_SPEED = 180;

// أنواع الطعام المختلفة
const FOOD_TYPES = [
  { emoji: '🍎', points: 10, color: '#ef4444' },
  { emoji: '🍊', points: 15, color: '#f97316' },
  { emoji: '🍇', points: 20, color: '#8b5cf6' },
  { emoji: '⭐', points: 30, color: '#fbbf24' },
  { emoji: '💎', points: 50, color: '#3b82f6' },
];

const SnakeGame = ({ mode, onComplete, onClose }) => {
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
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [particles, setParticles] = useState([]);
  
  const gameLoopRef = useRef(null);
  const directionRef = useRef({ x: 1, y: 0 });
  const comboTimerRef = useRef(null);
  
  // Animations
  const foodAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;

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

  // إنشاء طعام عشوائي
  const generateFood = useCallback((currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    
    // اختيار نوع الطعام بناءً على المستوى
    const typeIndex = Math.min(Math.floor(Math.random() * Math.min(level, FOOD_TYPES.length)), FOOD_TYPES.length - 1);
    newFood.type = FOOD_TYPES[typeIndex];
    
    return newFood;
  }, [level]);

  // إنشاء طعام إضافي
  const spawnBonusFood = useCallback((currentSnake) => {
    if (Math.random() < 0.15) { // 15% فرصة
      let pos;
      do {
        pos = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } while (currentSnake.some(seg => seg.x === pos.x && seg.y === pos.y));
      
      setBonusFood({ ...pos, type: FOOD_TYPES[4], timer: 50 }); // 💎
      
      // إزالة بعد 5 ثواني
      setTimeout(() => setBonusFood(null), 5000);
    }
  }, []);

  // حلقة اللعبة
  useEffect(() => {
    if (!gameOver && !isPaused) {
      gameLoopRef.current = setInterval(() => {
        moveSnake();
      }, speed);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [gameOver, isPaused, speed]);

  // إضافة جزيئات
  const addParticles = (x, y, color) => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: x * CELL_SIZE + CELL_SIZE / 2,
      y: y * CELL_SIZE + CELL_SIZE / 2,
      color,
      angle: (i * 45) * (Math.PI / 180),
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 500);
  };

  const moveSnake = () => {
    setSnake(currentSnake => {
      const head = currentSnake[0];
      const currentDir = directionRef.current;
      const newHead = {
        x: (head.x + currentDir.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + currentDir.y + GRID_SIZE) % GRID_SIZE,
      };

      // التصادم مع النفس
      if (currentSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        endGame(score);
        return currentSnake;
      }

      const newSnake = [newHead, ...currentSnake];

      // أكل الطعام العادي
      if (newHead.x === food.x && newHead.y === food.y) {
        const points = food.type.points * (1 + combo * 0.1);
        setScore(s => s + Math.floor(points));
        setFood(generateFood(newSnake));
        gameSounds.snakeEat();
        addParticles(food.x, food.y, food.type.color);
        
        // كومبو
        setCombo(c => c + 1);
        setShowCombo(true);
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => {
          setCombo(0);
          setShowCombo(false);
        }, 3000);
        
        // زيادة السرعة
        if (newSnake.length % 5 === 0 && speed > 80) {
          setSpeed(s => s - 8);
          setLevel(l => l + 1);
          gameSounds.levelUp();
        }
        
        // فرصة طعام إضافي
        spawnBonusFood(newSnake);
        
        // تأثير النقاط
        Animated.sequence([
          Animated.timing(scoreAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
          Animated.timing(scoreAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
        
        return newSnake;
      }

      // أكل الطعام الإضافي
      if (bonusFood && newHead.x === bonusFood.x && newHead.y === bonusFood.y) {
        setScore(s => s + bonusFood.type.points * 2);
        setBonusFood(null);
        gameSounds.bonus();
        addParticles(bonusFood.x, bonusFood.y, '#3b82f6');
        return newSnake;
      }

      newSnake.pop();
      return newSnake;
    });
  };

  const endGame = (finalScore) => {
    clearInterval(gameLoopRef.current);
    setGameOver(true);
    gameSounds.snakeDie();
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
    
    // حساب المكافأة
    let points = 10;
    if (finalScore >= 500) points = 50;
    else if (finalScore >= 300) points = 35;
    else if (finalScore >= 100) points = 25;
    else if (finalScore >= 50) points = 15;
    
    onComplete && onComplete(points, finalScore >= 100 ? 'win' : 'lose');
  };

  const changeDirection = (newDir) => {
    if (gameOver) return;
    
    const currentDir = directionRef.current;
    // منع الانعكاس
    if (newDir.x !== -currentDir.x || newDir.y !== -currentDir.y) {
      directionRef.current = newDir;
      setDirection(newDir);
      gameSounds.buttonTap();
    }
  };

  const resetGame = () => {
    clearInterval(gameLoopRef.current);
    setSnake([{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }]);
    setFood({ x: 10, y: 7, type: FOOD_TYPES[0] });
    setBonusFood(null);
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setSpeed(INITIAL_SPEED);
    setLevel(1);
    setCombo(0);
    setParticles([]);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    gameSounds.buttonTap();
  };

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
            <Text style={styles.snakeEmoji}>🐍</Text>
          </View>
        )}
        {isSnakeBody && (
          <View style={[
            styles.snakeBody,
            { opacity: 1 - (snakeIndex * 0.03) }
          ]} />
        )}
        {isFood && (
          <Animated.View style={[styles.food, { transform: [{ scale: foodAnim }] }]}>
            <Text style={styles.foodEmoji}>{food.type.emoji}</Text>
          </Animated.View>
        )}
        {isBonusFood && (
          <Animated.View style={[styles.bonusFood, { transform: [{ scale: foodAnim }] }]}>
            <Text style={styles.foodEmoji}>{bonusFood.type.emoji}</Text>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.gradient}>
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

        {/* Game Board */}
        <View style={styles.boardContainer}>
          <View style={styles.board}>
            {Array.from({ length: GRID_SIZE }, (_, y) => (
              <View key={y} style={styles.row}>
                {Array.from({ length: GRID_SIZE }, (_, x) => renderCell(x, y))}
              </View>
            ))}
            
            {/* Particles */}
            {particles.map(p => (
              <View
                key={p.id}
                style={[
                  styles.particle,
                  {
                    left: p.x,
                    top: p.y,
                    backgroundColor: p.color,
                  }
                ]}
              />
            ))}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <View style={styles.controlSpacer} />
            <TouchableOpacity 
              style={styles.controlBtn} 
              onPress={() => changeDirection({ x: 0, y: -1 })}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-up" size={32} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.controlSpacer} />
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity 
              style={styles.controlBtn} 
              onPress={() => changeDirection({ x: -1, y: 0 })}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={32} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.centerBtn}>
              <Text style={styles.centerEmoji}>🎮</Text>
            </View>
            <TouchableOpacity 
              style={styles.controlBtn} 
              onPress={() => changeDirection({ x: 1, y: 0 })}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <View style={styles.controlSpacer} />
            <TouchableOpacity 
              style={styles.controlBtn} 
              onPress={() => changeDirection({ x: 0, y: 1 })}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-down" size={32} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.controlSpacer} />
          </View>
        </View>

        {/* Pause Overlay */}
        {isPaused && !gameOver && (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseModal}>
              <Text style={styles.pauseEmoji}>⏸️</Text>
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
              <Text style={styles.gameOverEmoji}>
                {score >= 100 ? '🏆' : score >= 50 ? '👏' : '😢'}
              </Text>
              <Text style={styles.gameOverTitle}>انتهت اللعبة!</Text>
              <Text style={styles.finalScore}>{score} نقطة</Text>
              {score > highScore - score && score > 0 && (
                <Text style={styles.newRecord}>🎉 رقم قياسي جديد!</Text>
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
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  highScore: {
    fontSize: 12,
    color: '#888',
  },

  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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

  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  board: {
    width: CELL_SIZE * GRID_SIZE,
    height: CELL_SIZE * GRID_SIZE,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  snakeHead: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snakeEmoji: {
    fontSize: CELL_SIZE * 0.8,
  },
  snakeBody: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  food: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusFood: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodEmoji: {
    fontSize: CELL_SIZE * 0.7,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  controls: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  controlSpacer: {
    width: 70,
    height: 70,
    margin: 4,
  },
  centerBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(34,197,94,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  centerEmoji: {
    fontSize: 30,
  },

  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseModal: {
    backgroundColor: '#1e293b',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  pauseEmoji: {
    fontSize: 50,
    marginBottom: 16,
  },
  pauseTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resumeBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resumeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverModal: {
    backgroundColor: '#1e293b',
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
    marginBottom: 8,
  },
  finalScore: {
    color: '#22c55e',
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  newRecord: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  gameOverStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
  },
  gameOverButtons: {
    width: '100%',
    gap: 12,
  },
  playAgainBtn: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
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

export default SnakeGame;
