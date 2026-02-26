// Snake Game - Classic Snake Game
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const GRID_SIZE = 15;
const CELL_SIZE = Math.floor((width - 40) / GRID_SIZE);
const INITIAL_SPEED = 200;

const SnakeGame = ({ mode, onComplete, onClose }) => {
  const [snake, setSnake] = useState([{ x: 7, y: 7 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const gameLoopRef = useRef(null);
  const directionRef = useRef({ x: 1, y: 0 });

  // Generate random food position
  const generateFood = useCallback((currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameOver && !isPaused) {
      gameLoopRef.current = setInterval(() => {
        moveSnake();
      }, speed);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [gameOver, isPaused, speed]);

  const moveSnake = () => {
    setSnake(currentSnake => {
      const head = currentSnake[0];
      const currentDir = directionRef.current;
      const newHead = {
        x: (head.x + currentDir.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + currentDir.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self
      if (currentSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        endGame(currentSnake.length - 1);
        return currentSnake;
      }

      const newSnake = [newHead, ...currentSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        // Increase speed every 5 foods
        if ((currentSnake.length - 1) % 5 === 0 && speed > 80) {
          setSpeed(s => s - 10);
        }
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  };

  const endGame = (finalScore) => {
    clearInterval(gameLoopRef.current);
    setGameOver(true);
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
    
    // حساب النقاط
    let points = 10;
    if (finalScore >= 100) points = 25;
    else if (finalScore >= 50) points = 20;
    else if (finalScore >= 30) points = 15;
    
    setTimeout(() => {
      onComplete(points, finalScore >= 30 ? 'win' : 'lose');
    }, 500);
  };

  const handleDirection = (newDir) => {
    // Prevent reverse direction
    if (
      (newDir.x !== 0 && newDir.x === -directionRef.current.x) ||
      (newDir.y !== 0 && newDir.y === -directionRef.current.y)
    ) {
      return;
    }
    directionRef.current = newDir;
    setDirection(newDir);
  };

  const restartGame = () => {
    clearInterval(gameLoopRef.current);
    setSnake([{ x: 7, y: 7 }]);
    setFood(generateFood([{ x: 7, y: 7 }]));
    directionRef.current = { x: 1, y: 0 };
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameOver(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnakeHead = snake[0].x === x && snake[0].y === y;
        const isSnakeBody = snake.slice(1).some(seg => seg.x === x && seg.y === y);
        const isFood = food.x === x && food.y === y;
        
        cells.push(
          <View
            key={`${x}-${y}`}
            style={[
              styles.cell,
              isSnakeHead && styles.snakeHead,
              isSnakeBody && styles.snakeBody,
              isFood && styles.food,
            ]}
          >
            {isFood && <Ionicons name="ellipse" size={CELL_SIZE * 0.7} color="#ef4444" />}
            {isSnakeHead && <View style={styles.snakeEye} />}
          </View>
        );
      }
    }
    return cells;
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>الثعبان</Text>
        <TouchableOpacity onPress={togglePause} style={styles.headerBtn}>
          <Ionicons name={isPaused ? 'play' : 'pause'} size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      {/* Score */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>النقاط</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>الأفضل</Text>
          <Text style={styles.scoreValue}>{highScore}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>الطول</Text>
          <Text style={styles.scoreValue}>{snake.length}</Text>
        </View>
      </View>

      {/* Game Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {renderGrid()}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => handleDirection({ x: 0, y: -1 })}
          >
            <Ionicons name="chevron-up" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => handleDirection({ x: -1, y: 0 })}
          >
            <Ionicons name="chevron-back" size={32} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.controlSpacer} />
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => handleDirection({ x: 1, y: 0 })}
          >
            <Ionicons name="chevron-forward" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => handleDirection({ x: 0, y: 1 })}
          >
            <Ionicons name="chevron-down" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Over / Pause Overlay */}
      {(gameOver || isPaused) && (
        <View style={styles.overlay}>
          <LinearGradient colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.9)']} style={styles.overlayContent}>
            {gameOver ? (
              <>
                <Ionicons name="skull" size={50} color="#ef4444" />
                <Text style={styles.overlayTitle}>انتهت اللعبة!</Text>
                <Text style={styles.overlayText}>نقاطك: {score}</Text>
                <TouchableOpacity style={styles.restartBtn} onPress={restartGame}>
                  <Ionicons name="refresh" size={20} color="#FFF" />
                  <Text style={styles.restartText}>العب مرة أخرى</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="pause-circle" size={50} color="#60a5fa" />
                <Text style={styles.overlayTitle}>إيقاف مؤقت</Text>
                <TouchableOpacity style={styles.restartBtn} onPress={togglePause}>
                  <Ionicons name="play" size={20} color="#FFF" />
                  <Text style={styles.restartText}>استمر</Text>
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },

  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  scoreItem: { alignItems: 'center' },
  scoreLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  scoreValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 4 },

  gridContainer: {
    alignItems: 'center',
    padding: 16,
  },
  grid: {
    width: CELL_SIZE * GRID_SIZE,
    height: CELL_SIZE * GRID_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1e1e28',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snakeHead: {
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  snakeBody: {
    backgroundColor: '#16a34a',
    borderRadius: 2,
  },
  snakeEye: {
    width: 4,
    height: 4,
    backgroundColor: '#FFF',
    borderRadius: 2,
    position: 'absolute',
    top: '30%',
    right: '30%',
  },
  food: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  controls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  controlSpacer: { width: 70, height: 70 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    minWidth: 280,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  overlayText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  restartText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default SnakeGame;
