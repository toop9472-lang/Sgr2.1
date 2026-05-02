// Snake Game Component - Web Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import soundManager from '../../utils/soundManager';

const GRID_SIZE = 20;
const CELL_SIZE = 15;
const INITIAL_SPEED = 150;

const SnakeGame = ({ mode, onComplete, onClose }) => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const gameLoopRef = useRef(null);
  const directionRef = useRef(direction);

  // Generate random food position
  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  // Initialize game
  const initGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection({ x: 0, y: -1 });
    directionRef.current = { x: 0, y: -1 };
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setSpeed(INITIAL_SPEED);
  };

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    gameLoopRef.current = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: (head.x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + directionRef.current.y + GRID_SIZE) % GRID_SIZE
        };

        // Check collision with self
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          soundManager.lose();
          clearInterval(gameLoopRef.current);
          setHighScore(prev => Math.max(prev, score));
          onComplete(score, score > 50 ? 'win' : 'lose');
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check if food is eaten
        if (newHead.x === food.x && newHead.y === food.y) {
          soundManager.success();
          setScore(prev => prev + 10);
          setFood(generateFood());
          // Increase speed
          setSpeed(prev => Math.max(50, prev - 5));
          return newSnake;
        }

        newSnake.pop();
        return newSnake;
      });
    }, speed);

    return () => clearInterval(gameLoopRef.current);
  }, [gameOver, isPaused, food, speed, score]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current.y !== 1) {
            directionRef.current = { x: 0, y: -1 };
            setDirection({ x: 0, y: -1 });
          }
          break;
        case 'ArrowDown':
          if (directionRef.current.y !== -1) {
            directionRef.current = { x: 0, y: 1 };
            setDirection({ x: 0, y: 1 });
          }
          break;
        case 'ArrowLeft':
          if (directionRef.current.x !== 1) {
            directionRef.current = { x: -1, y: 0 };
            setDirection({ x: -1, y: 0 });
          }
          break;
        case 'ArrowRight':
          if (directionRef.current.x !== -1) {
            directionRef.current = { x: 1, y: 0 };
            setDirection({ x: 1, y: 0 });
          }
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  const handleDirectionButton = (newDir) => {
    if (gameOver) return;
    soundManager.click();
    if (newDir.y === -1 && directionRef.current.y !== 1) {
      directionRef.current = newDir;
      setDirection(newDir);
    } else if (newDir.y === 1 && directionRef.current.y !== -1) {
      directionRef.current = newDir;
      setDirection(newDir);
    } else if (newDir.x === -1 && directionRef.current.x !== 1) {
      directionRef.current = newDir;
      setDirection(newDir);
    } else if (newDir.x === 1 && directionRef.current.x !== -1) {
      directionRef.current = newDir;
      setDirection(newDir);
    }
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="snake-result">
        <div className="text-center">
          <Trophy size={80} className="mx-auto text-yellow-400 mb-4" />
          <div className="text-5xl font-bold text-green-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-2">نقطة</div>
          <div className="text-sm text-gray-500 mb-6">
            أفضل نتيجة: {highScore}
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={initGame} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
              <RotateCcw size={18} />
              العب مجدداً
            </button>
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold">
              إنهاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="snake-game">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="snake-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-green-400">لعبة الثعبان</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPaused(prev => !prev)} 
              className="p-2 rounded-full bg-white/10 hover:bg-white/20"
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
            <button onClick={initGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="snake-reset-btn">
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-green-400">{score}</div>
          <div className="text-gray-500 text-sm">النقاط</div>
        </div>

        {/* Game Board */}
        <div 
          className="mx-auto bg-[#1a1a2e] rounded-xl p-2 relative overflow-hidden"
          style={{ 
            width: GRID_SIZE * CELL_SIZE + 16, 
            height: GRID_SIZE * CELL_SIZE + 16 
          }}
        >
          {/* Grid background */}
          <div 
            className="grid absolute inset-2"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`
            }}
          >
            {Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, i) => (
              <div key={i} className="border border-white/5" />
            ))}
          </div>

          {/* Snake */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`absolute rounded-sm transition-all duration-75 ${
                index === 0 ? 'bg-green-500' : 'bg-green-400'
              }`}
              style={{
                left: segment.x * CELL_SIZE + 8,
                top: segment.y * CELL_SIZE + 8,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />
          ))}

          {/* Food */}
          <div
            className="absolute bg-red-500 rounded-full animate-pulse"
            style={{
              left: food.x * CELL_SIZE + 8,
              top: food.y * CELL_SIZE + 8,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />

          {/* Pause overlay */}
          {isPaused && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-2xl font-bold">إيقاف مؤقت</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={() => handleDirectionButton({ x: 0, y: -1 })}
            className="p-4 bg-green-600/20 hover:bg-green-600/40 rounded-xl"
          >
            <ArrowUp size={28} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleDirectionButton({ x: -1, y: 0 })}
              className="p-4 bg-green-600/20 hover:bg-green-600/40 rounded-xl"
            >
              <ArrowLeft size={28} />
            </button>
            <button
              onClick={() => handleDirectionButton({ x: 0, y: 1 })}
              className="p-4 bg-green-600/20 hover:bg-green-600/40 rounded-xl"
            >
              <ArrowDown size={28} />
            </button>
            <button
              onClick={() => handleDirectionButton({ x: 1, y: 0 })}
              className="p-4 bg-green-600/20 hover:bg-green-600/40 rounded-xl"
            >
              <ArrowRight size={28} />
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          استخدم أزرار الأسهم للتحكم
        </p>
      </div>
    </div>
  );
};

export default SnakeGame;
