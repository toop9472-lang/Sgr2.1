// Brick Breaker Game - تكسير الطوب - Professional 10 Levels
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/41eae3dfab42e60e7a57f9291dbf06c43e5e3e8b6629673c00658c524c1a237e.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 600;
const GAME_WIDTH = Math.min(screenWidth - 32, isTablet ? 500 : screenWidth - 32);
const GAME_HEIGHT = Math.min(screenHeight * 0.5, 450);
const PADDLE_WIDTH = isTablet ? 100 : 80;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 14;

// إعدادات المراحل (10 مراحل)
const LEVELS = [
  { rows: 3, cols: 6, ballSpeed: 4, timeLimit: 90, name: 'المبتدئ', color: '#22c55e' },
  { rows: 4, cols: 6, ballSpeed: 4.5, timeLimit: 80, name: 'السهل', color: '#84cc16' },
  { rows: 4, cols: 7, ballSpeed: 5, timeLimit: 75, name: 'التحدي', color: '#eab308' },
  { rows: 5, cols: 7, ballSpeed: 5.5, timeLimit: 70, name: 'المتوسط', color: '#f59e0b' },
  { rows: 5, cols: 8, ballSpeed: 6, timeLimit: 65, name: 'الصعب', color: '#f97316' },
  { rows: 6, cols: 8, ballSpeed: 6.5, timeLimit: 60, name: 'المحترف', color: '#ef4444' },
  { rows: 6, cols: 8, ballSpeed: 7, timeLimit: 55, name: 'الخبير', color: '#dc2626' },
  { rows: 7, cols: 8, ballSpeed: 7.5, timeLimit: 50, name: 'الأسطورة', color: '#b91c1c' },
  { rows: 7, cols: 8, ballSpeed: 8, timeLimit: 45, name: 'الجنون', color: '#991b1b' },
  { rows: 8, cols: 8, ballSpeed: 9, timeLimit: 40, name: 'المستحيل', color: '#7f1d1d' },
];

const BRICK_COLORS = [
  ['#ef4444', '#dc2626'],
  ['#f59e0b', '#d97706'],
  ['#eab308', '#ca8a04'],
  ['#22c55e', '#16a34a'],
  ['#3b82f6', '#2563eb'],
  ['#8b5cf6', '#7c3aed'],
  ['#ec4899', '#db2777'],
  ['#14b8a6', '#0d9488'],
];

// Power-ups
const POWERUPS = [
  { type: 'wide', icon: '📏', color: '#3b82f6', effect: 'توسيع المضرب' },
  { type: 'multi', icon: '🔥', color: '#ef4444', effect: 'كرات متعددة' },
  { type: 'slow', icon: '🐢', color: '#22c55e', effect: 'إبطاء الكرة' },
  { type: 'life', icon: '❤️', color: '#ec4899', effect: 'حياة إضافية' },
  { type: 'time', icon: '⏰', color: '#fbbf24', effect: '+15 ثانية' },
];

const BrickBreakerGame = ({ difficulty = 'medium', onComplete, onClose }) => {
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, won, lost, levelComplete
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bricks, setBricks] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const [paddleWidth, setPaddleWidth] = useState(PADDLE_WIDTH);
  const [powerups, setPowerups] = useState([]);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  
  const ballX = useRef(new Animated.Value(GAME_WIDTH / 2 - BALL_SIZE / 2)).current;
  const ballY = useRef(new Animated.Value(GAME_HEIGHT - 80)).current;
  const ballVelX = useRef(4);
  const ballVelY = useRef(-4);
  const gameLoop = useRef(null);
  const timerRef = useRef(null);
  const ballPosX = useRef(GAME_WIDTH / 2 - BALL_SIZE / 2);
  const ballPosY = useRef(GAME_HEIGHT - 80);
  const comboTimeoutRef = useRef(null);

  const levelConfig = LEVELS[currentLevel] || LEVELS[0];
  const BRICK_HEIGHT = 20;

  useEffect(() => {
    return () => clearTimeout(comboTimeoutRef.current);
  }, []);

  // Initialize bricks for current level
  const initBricks = useCallback((targetLevel = currentLevel) => {
    const config = LEVELS[targetLevel] || LEVELS[0];
    const brickWidth = (GAME_WIDTH - 20) / config.cols;
    const newBricks = [];
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const hasPowerup = Math.random() < 0.1;
        newBricks.push({
          id: `${row}-${col}`,
          x: 10 + col * brickWidth,
          y: 50 + row * (BRICK_HEIGHT + 3),
          width: brickWidth - 2,
          height: BRICK_HEIGHT,
          colors: BRICK_COLORS[(row + targetLevel) % BRICK_COLORS.length],
          points: (config.rows - row) * 10 * (targetLevel + 1),
          active: true,
          powerup: hasPowerup ? POWERUPS[Math.floor(Math.random() * POWERUPS.length)] : null,
          hits: row === 0 && targetLevel >= 5 ? 2 : 1, // طوب قوي في المراحل المتقدمة
        });
      }
    }
    setBricks(newBricks);
    setTimeLeft(config.timeLimit);
  }, [currentLevel]);

  // Reset ball
  const resetBall = useCallback((ballSpeed = levelConfig.ballSpeed, nextPaddleX = paddleX, nextPaddleWidth = paddleWidth) => {
    ballPosX.current = nextPaddleX + nextPaddleWidth / 2 - BALL_SIZE / 2;
    ballPosY.current = GAME_HEIGHT - 80;
    ballX.setValue(ballPosX.current);
    ballY.setValue(ballPosY.current);
    ballVelX.current = (Math.random() > 0.5 ? 1 : -1) * ballSpeed;
    ballVelY.current = -ballSpeed;
  }, [paddleX, paddleWidth, levelConfig.ballSpeed]);

  // Start level
  const startLevel = useCallback((lvl = 0) => {
    const targetLevel = Math.max(0, Math.min(lvl, LEVELS.length - 1));
    const targetConfig = LEVELS[targetLevel] || LEVELS[0];
    const centeredPaddleX = (GAME_WIDTH - PADDLE_WIDTH) / 2;

    setCurrentLevel(targetLevel);
    setGameState('playing');
    setPaddleX(centeredPaddleX);
    setPaddleWidth(PADDLE_WIDTH);
    setCombo(0);
    setShowCombo(false);
    setPowerups([]);
    initBricks(targetLevel);
    resetBall(targetConfig.ballSpeed, centeredPaddleX, PADDLE_WIDTH);
  }, [initBricks, resetBall]);

  // Timer
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setLives(l => {
              if (l <= 1) {
                setGameState('lost');
                onComplete && onComplete(Math.floor(score / 10), 'lose');
                return 0;
              }
              return l - 1;
            });
            resetBall();
            return levelConfig.timeLimit;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, levelConfig.timeLimit, resetBall, onComplete, score]);

  // Apply powerup
  const applyPowerup = useCallback((powerup) => {
    switch (powerup.type) {
      case 'wide':
        setPaddleWidth(w => Math.min(w * 1.5, PADDLE_WIDTH * 2));
        break;
      case 'slow':
        ballVelX.current *= 0.7;
        ballVelY.current *= 0.7;
        break;
      case 'life':
        setLives(l => l + 1);
        break;
      case 'time':
        setTimeLeft(t => t + 15);
        break;
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoop.current = setInterval(() => {
      ballPosX.current += ballVelX.current;
      ballPosY.current += ballVelY.current;

      // Wall collisions
      if (ballPosX.current <= 0 || ballPosX.current >= GAME_WIDTH - BALL_SIZE) {
        ballVelX.current *= -1;
        ballPosX.current = Math.max(0, Math.min(ballPosX.current, GAME_WIDTH - BALL_SIZE));
      }
      if (ballPosY.current <= 0) {
        ballVelY.current *= -1;
        ballPosY.current = 0;
      }

      // Paddle collision
      if (
        ballPosY.current >= GAME_HEIGHT - 30 - BALL_SIZE &&
        ballPosX.current + BALL_SIZE >= paddleX &&
        ballPosX.current <= paddleX + paddleWidth
      ) {
        ballVelY.current = -Math.abs(ballVelY.current);
        const hitPos = (ballPosX.current + BALL_SIZE / 2 - paddleX) / paddleWidth;
        ballVelX.current = (hitPos - 0.5) * levelConfig.ballSpeed * 2;
        ballPosY.current = GAME_HEIGHT - 30 - BALL_SIZE;
      }

      // Lost ball
      if (ballPosY.current > GAME_HEIGHT) {
        setCombo(0);
        setLives(l => {
          if (l <= 1) {
            clearInterval(gameLoop.current);
            setGameState('lost');
            onComplete && onComplete(Math.floor(score / 10), 'lose');
            return 0;
          }
          resetBall();
          return l - 1;
        });
      }

      // Brick collisions
      setBricks(prevBricks => {
        let updated = false;
        const newBricks = prevBricks.map(brick => {
          if (!brick.active) return brick;

          if (
            ballPosX.current + BALL_SIZE >= brick.x &&
            ballPosX.current <= brick.x + brick.width &&
            ballPosY.current + BALL_SIZE >= brick.y &&
            ballPosY.current <= brick.y + brick.height
          ) {
            updated = true;
            
            if (brick.hits > 1) {
              ballVelY.current *= -1;
              return { ...brick, hits: brick.hits - 1 };
            }

            // Hit brick
            const newCombo = combo + 1;
            setCombo(newCombo);
            setShowCombo(true);
            clearTimeout(comboTimeoutRef.current);
            comboTimeoutRef.current = setTimeout(() => {
              setCombo(0);
              setShowCombo(false);
            }, 2000);

            const comboBonus = Math.floor(newCombo / 3) * 10;
            setScore(s => s + brick.points + comboBonus);
            ballVelY.current *= -1;

            // Drop powerup
            if (brick.powerup) {
              applyPowerup(brick.powerup);
            }

            return { ...brick, active: false };
          }
          return brick;
        });

        // Check level complete
        if (updated && newBricks.every(b => !b.active)) {
          clearInterval(gameLoop.current);
          clearInterval(timerRef.current);
          
          if (currentLevel < LEVELS.length - 1) {
            setGameState('levelComplete');
          } else {
            setGameState('won');
            onComplete && onComplete(Math.floor(score / 5), 'win');
          }
        }

        return newBricks;
      });

      ballX.setValue(ballPosX.current);
      ballY.setValue(ballPosY.current);
    }, 16);

    return () => clearInterval(gameLoop.current);
  }, [gameState, paddleX, paddleWidth, resetBall, combo, currentLevel, levelConfig.ballSpeed, score, applyPowerup, onComplete]);

  // Paddle control
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX - paddleWidth / 2;
        const newX = Math.max(0, Math.min(touchX, GAME_WIDTH - paddleWidth));
        setPaddleX(newX);
      },
    })
  ).current;

  // Level selection screen
  if (gameState === 'menu') {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.menuScreen}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.gameTitle}>🧱 تكسير الطوب</Text>
            <Text style={styles.gameSubtitle}>10 مراحل • تحدي الوقت</Text>
            
            <View style={styles.levelsGrid}>
              {LEVELS.map((lvl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.levelBtn, { backgroundColor: lvl.color }]}
                  onPress={() => startLevel(idx)}
                >
                  <Text style={styles.levelNum}>{idx + 1}</Text>
                  <Text style={styles.levelName}>{lvl.name}</Text>
                  <Text style={styles.levelTime}>{lvl.timeLimit}ث</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // Level complete screen
  if (gameState === 'levelComplete') {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.resultScreen}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultTitle}>مرحلة {currentLevel + 1} مكتملة!</Text>
            <Text style={styles.resultScore}>{score} نقطة</Text>
            <Text style={styles.resultTime}>الوقت المتبقي: {timeLeft}ث</Text>
            
            <TouchableOpacity 
              style={styles.nextLevelBtn}
              onPress={() => startLevel(currentLevel + 1)}
            >
              <Text style={styles.nextLevelText}>المرحلة التالية</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // Game over / Won screens
  if (gameState === 'lost' || gameState === 'won') {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.resultScreen}>
            <Text style={styles.resultEmoji}>{gameState === 'won' ? '🏆' : '💔'}</Text>
            <Text style={styles.resultTitle}>
              {gameState === 'won' ? 'فوز مذهل!' : 'انتهت اللعبة'}
            </Text>
            <Text style={styles.resultScore}>{score} نقطة</Text>
            <Text style={styles.resultLevel}>وصلت للمرحلة {currentLevel + 1}</Text>
            
            <View style={styles.resultButtons}>
              <TouchableOpacity style={styles.playAgainBtn} onPress={() => startLevel(0)}>
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.playAgainText}>من البداية</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
                <Text style={styles.exitText}>خروج</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.levelText}>المرحلة {currentLevel + 1}</Text>
            <Text style={styles.levelNameText}>{levelConfig.name}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerBtn} 
            onPress={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
          >
            <Ionicons name={gameState === 'paused' ? 'play' : 'pause'} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>نقاط</Text>
          </View>
          
          <View style={[styles.statItem, styles.timerItem, timeLeft <= 10 && styles.timerCritical]}>
            <Ionicons name="time" size={18} color={timeLeft <= 10 ? '#ef4444' : '#fbbf24'} />
            <Text style={[styles.timerValue, timeLeft <= 10 && styles.timerCriticalText]}>{timeLeft}</Text>
          </View>
          
          <View style={styles.livesContainer}>
            {[...Array(lives)].map((_, i) => (
              <Text key={i} style={styles.lifeIcon}>❤️</Text>
            ))}
          </View>
        </View>

        {/* Combo */}
        {showCombo && combo > 2 && (
          <View style={styles.comboContainer}>
            <Text style={styles.comboText}>x{combo} كومبو!</Text>
          </View>
        )}

        {/* Game Area */}
        <View style={styles.gameArea} {...panResponder.panHandlers}>
          <View style={[styles.gameBoard, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
            {/* Bricks */}
            {bricks.map(brick => brick.active && (
              <LinearGradient
                key={brick.id}
                colors={brick.colors}
                style={[styles.brick, {
                  left: brick.x,
                  top: brick.y,
                  width: brick.width,
                  height: brick.height,
                }]}
              >
                {brick.hits > 1 && (
                  <View style={styles.strongBrick}>
                    <Text style={styles.strongBrickText}>🛡️</Text>
                  </View>
                )}
                {brick.powerup && (
                  <Text style={styles.powerupIcon}>{brick.powerup.icon}</Text>
                )}
              </LinearGradient>
            ))}

            {/* Ball */}
            <Animated.View
              style={[styles.ball, {
                left: ballX,
                top: ballY,
              }]}
            >
              <LinearGradient colors={['#FFF', '#ccc']} style={styles.ballInner} />
            </Animated.View>

            {/* Paddle */}
            <LinearGradient
              colors={['#60a5fa', '#3b82f6']}
              style={[styles.paddle, {
                left: paddleX,
                width: paddleWidth,
              }]}
            />
          </View>
        </View>

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseModal}>
              <Text style={styles.pauseEmoji}>⏸️</Text>
              <Text style={styles.pauseTitle}>إيقاف مؤقت</Text>
              <TouchableOpacity style={styles.resumeBtn} onPress={() => setGameState('playing')}>
                <Text style={styles.resumeText}>استمرار</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  
  // Menu
  menuScreen: {
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
  gameTitle: { fontSize: 36, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  gameSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 30 },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 350,
  },
  levelBtn: {
    width: 65,
    height: 65,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNum: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  levelName: { fontSize: 8, color: 'rgba(255,255,255,0.8)' },
  levelTime: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },

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
  headerCenter: { alignItems: 'center' },
  levelText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  levelNameText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  // Stats
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  timerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timerCritical: { backgroundColor: 'rgba(239,68,68,0.3)' },
  timerValue: { fontSize: 22, fontWeight: 'bold', color: '#fbbf24' },
  timerCriticalText: { color: '#ef4444' },
  livesContainer: { flexDirection: 'row', gap: 4 },
  lifeIcon: { fontSize: 18 },

  // Combo
  comboContainer: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comboText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // Game
  gameArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gameBoard: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brick: {
    position: 'absolute',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strongBrick: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  strongBrickText: { fontSize: 10 },
  powerupIcon: { fontSize: 12 },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    overflow: 'hidden',
  },
  ballInner: { flex: 1 },
  paddle: {
    position: 'absolute',
    bottom: 20,
    height: PADDLE_HEIGHT,
    borderRadius: PADDLE_HEIGHT / 2,
  },

  // Results
  resultScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultEmoji: { fontSize: 60, marginBottom: 16 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  resultScore: { fontSize: 36, fontWeight: 'bold', color: '#fbbf24', marginBottom: 8 },
  resultTime: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  resultLevel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24 },
  nextLevelBtn: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  nextLevelText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  resultButtons: { gap: 12, alignItems: 'center' },
  playAgainBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  playAgainText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  exitBtn: { paddingVertical: 10 },
  exitText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },

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
  pauseEmoji: { fontSize: 48, marginBottom: 16 },
  pauseTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
  resumeBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resumeText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default BrickBreakerGame;
