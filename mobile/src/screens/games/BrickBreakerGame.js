// Brick Breaker Game - تكسير الطوب - Professional Edition
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
import gameSounds from '../../utils/gameSounds';

// AI-Generated Professional Background
const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/41eae3dfab42e60e7a57f9291dbf06c43e5e3e8b6629673c00658c524c1a237e.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive sizing for iPad
const isTablet = screenWidth > 600;
const MAX_GAME_WIDTH = isTablet ? 500 : screenWidth - 32;
const GAME_WIDTH = Math.min(screenWidth - 32, MAX_GAME_WIDTH);
const GAME_HEIGHT = Math.min(screenHeight * 0.55, 500);
const PADDLE_WIDTH = isTablet ? 100 : 80;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 14;
const BRICK_ROWS = 5;
const BRICK_COLS = isTablet ? 8 : 7;
const BRICK_WIDTH = (GAME_WIDTH - 20) / BRICK_COLS;
const BRICK_HEIGHT = 22;
const BRICK_GAP = 2;

const BRICK_COLORS = [
  ['#ef4444', '#dc2626'], // Red
  ['#f59e0b', '#d97706'], // Orange
  ['#eab308', '#ca8a04'], // Yellow
  ['#22c55e', '#16a34a'], // Green
  ['#3b82f6', '#2563eb'], // Blue
];

const BrickBreakerGame = ({ difficulty = 'medium', onComplete, onClose }) => {
  const [gameState, setGameState] = useState('ready'); // ready, playing, paused, won, lost
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [bricks, setBricks] = useState([]);
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
  
  // Ball state
  const ballX = useRef(new Animated.Value(GAME_WIDTH / 2 - BALL_SIZE / 2)).current;
  const ballY = useRef(new Animated.Value(GAME_HEIGHT - 100)).current;
  const ballVelX = useRef(difficulty === 'hard' ? 5 : 4);
  const ballVelY = useRef(difficulty === 'hard' ? -6 : -5);
  const gameLoop = useRef(null);
  const ballPosX = useRef(GAME_WIDTH / 2 - BALL_SIZE / 2);
  const ballPosY = useRef(GAME_HEIGHT - 100);

  // Initialize bricks
  const initBricks = useCallback(() => {
    const newBricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          id: `${row}-${col}`,
          x: 10 + col * (BRICK_WIDTH + BRICK_GAP),
          y: 60 + row * (BRICK_HEIGHT + BRICK_GAP),
          width: BRICK_WIDTH - BRICK_GAP,
          height: BRICK_HEIGHT,
          colors: BRICK_COLORS[row % BRICK_COLORS.length],
          points: (BRICK_ROWS - row) * 10,
          active: true,
        });
      }
    }
    setBricks(newBricks);
  }, []);

  // Reset ball position
  const resetBall = useCallback(() => {
    ballPosX.current = paddleX + PADDLE_WIDTH / 2 - BALL_SIZE / 2;
    ballPosY.current = GAME_HEIGHT - 100;
    ballX.setValue(ballPosX.current);
    ballY.setValue(ballPosY.current);
    ballVelX.current = (Math.random() > 0.5 ? 1 : -1) * (difficulty === 'hard' ? 5 : 4);
    ballVelY.current = difficulty === 'hard' ? -6 : -5;
  }, [paddleX, difficulty]);

  // Start new game
  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    initBricks();
    resetBall();
    setGameState('playing');
  }, [initBricks, resetBall]);

  // Paddle pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newX = paddleX + gestureState.dx;
        newX = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, newX));
        setPaddleX(newX);
      },
    })
  ).current;

  // Touch to move paddle
  const handleTouch = useCallback((evt) => {
    const touchX = evt.nativeEvent.locationX;
    const newPaddleX = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, touchX - PADDLE_WIDTH / 2));
    setPaddleX(newPaddleX);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoop.current) {
        clearInterval(gameLoop.current);
        gameLoop.current = null;
      }
      return;
    }

    gameLoop.current = setInterval(() => {
      // Update ball position
      let newX = ballPosX.current + ballVelX.current;
      let newY = ballPosY.current + ballVelY.current;

      // Wall collisions
      if (newX <= 0 || newX >= GAME_WIDTH - BALL_SIZE) {
        ballVelX.current = -ballVelX.current;
        newX = Math.max(0, Math.min(GAME_WIDTH - BALL_SIZE, newX));
      }
      if (newY <= 0) {
        ballVelY.current = -ballVelY.current;
        newY = 0;
      }

      // Paddle collision
      if (
        newY + BALL_SIZE >= GAME_HEIGHT - 40 &&
        newY + BALL_SIZE <= GAME_HEIGHT - 40 + PADDLE_HEIGHT &&
        newX + BALL_SIZE >= paddleX &&
        newX <= paddleX + PADDLE_WIDTH
      ) {
        ballVelY.current = -Math.abs(ballVelY.current);
        // Add angle based on where ball hits paddle
        const hitPos = (newX + BALL_SIZE / 2 - paddleX) / PADDLE_WIDTH;
        ballVelX.current = (hitPos - 0.5) * 10;
        newY = GAME_HEIGHT - 40 - BALL_SIZE;
      }

      // Ball fell below
      if (newY > GAME_HEIGHT) {
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState('lost');
            gameSounds.lose();
            const points = Math.floor(score * (difficulty === 'hard' ? 1.5 : 1));
            onComplete(points, 'lose');
          } else {
            gameSounds.wrong();
            resetBall();
          }
          return newLives;
        });
        return;
      }

      // Brick collisions
      setBricks((currentBricks) => {
        let bricksHit = false;
        const newBricks = currentBricks.map((brick) => {
          if (!brick.active) return brick;

          if (
            newX + BALL_SIZE >= brick.x &&
            newX <= brick.x + brick.width &&
            newY + BALL_SIZE >= brick.y &&
            newY <= brick.y + brick.height
          ) {
            bricksHit = true;
            gameSounds.buttonTap();
            setScore((prev) => prev + brick.points);
            
            // Determine collision side
            const overlapLeft = newX + BALL_SIZE - brick.x;
            const overlapRight = brick.x + brick.width - newX;
            const overlapTop = newY + BALL_SIZE - brick.y;
            const overlapBottom = brick.y + brick.height - newY;
            
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            
            if (minOverlapX < minOverlapY) {
              ballVelX.current = -ballVelX.current;
            } else {
              ballVelY.current = -ballVelY.current;
            }

            return { ...brick, active: false };
          }
          return brick;
        });

        // Check if all bricks destroyed
        if (newBricks.every((b) => !b.active)) {
          setGameState('won');
          gameSounds.win();
          const basePoints = score + 500; // Bonus for completing
          const points = Math.floor(basePoints * (difficulty === 'hard' ? 1.5 : 1));
          onComplete(points, 'win');
        }

        return newBricks;
      });

      // Update ball position
      ballPosX.current = newX;
      ballPosY.current = newY;
      ballX.setValue(newX);
      ballY.setValue(newY);
    }, 16);

    return () => {
      if (gameLoop.current) {
        clearInterval(gameLoop.current);
      }
    };
  }, [gameState, paddleX, difficulty, score, resetBall, onComplete]);

  // Initialize on mount
  useEffect(() => {
    initBricks();
  }, [initBricks]);

  const renderBricks = () => {
    return bricks.map((brick) => {
      if (!brick.active) return null;
      return (
        <LinearGradient
          key={brick.id}
          colors={brick.colors}
          style={[
            styles.brick,
            {
              left: brick.x,
              top: brick.y,
              width: brick.width,
              height: brick.height,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      );
    });
  };

  return (
    <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>تكسير الطوب</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Ionicons name="heart" size={18} color="#ef4444" />
          <Text style={styles.statText}>{lives}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="trophy" size={18} color="#fbbf24" />
          <Text style={styles.statText}>{score}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="layers" size={18} color="#60a5fa" />
          <Text style={styles.statText}>المستوى {level}</Text>
        </View>
      </View>

      {/* Game Area */}
      <View 
        style={styles.gameArea}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
      >
        {/* Bricks */}
        {renderBricks()}

        {/* Ball */}
        <Animated.View
          style={[
            styles.ball,
            {
              transform: [
                { translateX: ballX },
                { translateY: ballY },
              ],
            },
          ]}
        />

        {/* Paddle */}
        <View
          style={[
            styles.paddle,
            {
              left: paddleX,
              bottom: 40,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <LinearGradient
            colors={['#60a5fa', '#3b82f6']}
            style={styles.paddleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        {/* Game State Overlays */}
        {gameState === 'ready' && (
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.startBtnGradient}
              >
                <Ionicons name="play" size={40} color="#FFF" />
                <Text style={styles.startBtnText}>ابدأ اللعب</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {(gameState === 'won' || gameState === 'lost') && (
          <View style={styles.overlay}>
            <View style={styles.resultCard}>
              <Ionicons
                name={gameState === 'won' ? 'trophy' : 'sad'}
                size={60}
                color={gameState === 'won' ? '#fbbf24' : '#ef4444'}
              />
              <Text style={styles.resultTitle}>
                {gameState === 'won' ? 'فوز' : 'انتهت اللعبة'}
              </Text>
              <Text style={styles.resultScore}>النقاط: {score}</Text>
              <View style={styles.resultBtns}>
                <TouchableOpacity style={styles.playAgainBtn} onPress={startGame}>
                  <Ionicons name="refresh" size={20} color="#FFF" />
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

      {/* Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="finger-print" size={20} color="#FFF" />
        <Text style={styles.instructionText}>حرّك إصبعك لتحريك المضرب</Text>
      </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gameArea: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brick: {
    position: 'absolute',
    borderRadius: 4,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    borderRadius: PADDLE_HEIGHT / 2,
    overflow: 'hidden',
  },
  paddleGradient: {
    flex: 1,
    borderRadius: PADDLE_HEIGHT / 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
  },
  resultScore: {
    fontSize: 20,
    color: '#fbbf24',
    marginTop: 8,
  },
  resultBtns: {
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
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  instructionText: {
    color: '#666',
    fontSize: 14,
  },
});

export default BrickBreakerGame;
