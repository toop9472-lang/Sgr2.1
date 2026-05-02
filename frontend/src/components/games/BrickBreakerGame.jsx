// Brick Breaker Game Component - Web Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Play, Pause } from 'lucide-react';
import soundManager from '../../utils/soundManager';

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 7;
const BRICK_WIDTH = 45;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 4;

const BrickBreakerGame = ({ mode, onComplete, onClose }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [level, setLevel] = useState(1);

  // Game state refs
  const paddleX = useRef((CANVAS_WIDTH - PADDLE_WIDTH) / 2);
  const ballX = useRef(CANVAS_WIDTH / 2);
  const ballY = useRef(CANVAS_HEIGHT - 50);
  const ballDX = useRef(4);
  const ballDY = useRef(-4);
  const bricks = useRef([]);
  const animationRef = useRef(null);

  // Initialize bricks
  const initBricks = useCallback(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
    const newBricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        newBricks.push({
          x: c * (BRICK_WIDTH + BRICK_PADDING) + 15,
          y: r * (BRICK_HEIGHT + BRICK_PADDING) + 40,
          status: 1,
          color: colors[r % colors.length],
          points: (BRICK_ROWS - r) * 10
        });
      }
    }
    bricks.current = newBricks;
  }, []);

  // Reset ball position
  const resetBall = () => {
    ballX.current = CANVAS_WIDTH / 2;
    ballY.current = CANVAS_HEIGHT - 50;
    ballDX.current = 4 * (Math.random() > 0.5 ? 1 : -1);
    ballDY.current = -4;
  };

  // Initialize game
  const initGame = () => {
    paddleX.current = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    resetBall();
    initBricks();
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setIsPaused(true);
    setLevel(1);
  };

  useEffect(() => {
    initGame();
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Mouse/touch control
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      paddleX.current = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
    };

    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientX);

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver || gameWon || isPaused) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw bricks
      bricks.current.forEach(brick => {
        if (brick.status === 1) {
          ctx.fillStyle = brick.color;
          ctx.beginPath();
          ctx.roundRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
          ctx.fill();
        }
      });

      // Draw paddle
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(paddleX.current, CANVAS_HEIGHT - 30, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
      ctx.fill();

      // Draw ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ballX.current, ballY.current, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Update ball position
      ballX.current += ballDX.current;
      ballY.current += ballDY.current;

      // Wall collision
      if (ballX.current + BALL_RADIUS > CANVAS_WIDTH || ballX.current - BALL_RADIUS < 0) {
        ballDX.current = -ballDX.current;
      }
      if (ballY.current - BALL_RADIUS < 0) {
        ballDY.current = -ballDY.current;
      }

      // Paddle collision
      if (
        ballY.current + BALL_RADIUS > CANVAS_HEIGHT - 30 &&
        ballY.current - BALL_RADIUS < CANVAS_HEIGHT - 30 + PADDLE_HEIGHT &&
        ballX.current > paddleX.current &&
        ballX.current < paddleX.current + PADDLE_WIDTH
      ) {
        ballDY.current = -Math.abs(ballDY.current);
        // Add angle based on where ball hits paddle
        const hitPos = (ballX.current - paddleX.current) / PADDLE_WIDTH;
        ballDX.current = 6 * (hitPos - 0.5);
        soundManager.click();
      }

      // Brick collision
      bricks.current.forEach(brick => {
        if (brick.status === 1) {
          if (
            ballX.current + BALL_RADIUS > brick.x &&
            ballX.current - BALL_RADIUS < brick.x + BRICK_WIDTH &&
            ballY.current + BALL_RADIUS > brick.y &&
            ballY.current - BALL_RADIUS < brick.y + BRICK_HEIGHT
          ) {
            ballDY.current = -ballDY.current;
            brick.status = 0;
            setScore(prev => prev + brick.points);
            soundManager.success();
          }
        }
      });

      // Check win
      if (bricks.current.every(b => b.status === 0)) {
        setGameWon(true);
        soundManager.win();
        onComplete(score + 100, 'win');
        return;
      }

      // Ball out of bounds
      if (ballY.current > CANVAS_HEIGHT) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
            soundManager.lose();
            onComplete(Math.floor(score / 2), 'lose');
          } else {
            resetBall();
            setIsPaused(true);
          }
          return newLives;
        });
        return;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPaused, gameOver, gameWon, score]);

  // Draw static frame when paused
  useEffect(() => {
    if (!isPaused && !gameOver && !gameWon) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    bricks.current.forEach(brick => {
      if (brick.status === 1) {
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
        ctx.fill();
      }
    });

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(paddleX.current, CANVAS_HEIGHT - 30, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ballX.current, ballY.current, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }, [isPaused, gameOver, gameWon]);

  if (gameOver || gameWon) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="brickbreaker-result">
        <div className="text-center">
          <Trophy size={80} className={`mx-auto mb-4 ${gameWon ? 'text-yellow-400' : 'text-red-400'}`} />
          <div className="text-3xl font-bold mb-2">{gameWon ? 'فوز!' : 'انتهت اللعبة'}</div>
          <div className="text-5xl font-bold text-pink-400 mb-2">{score}</div>
          <div className="text-gray-400 mb-6">نقطة</div>
          <div className="flex gap-4 justify-center">
            <button onClick={initGame} className="bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
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
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="brickbreaker-game">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="brickbreaker-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-pink-400">تكسير الطوب</h1>
          <button onClick={initGame} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="brickbreaker-reset-btn">
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-around mb-4 bg-white/5 rounded-xl p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-400">{score}</div>
            <div className="text-xs text-gray-500">النقاط</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{'❤️'.repeat(lives)}</div>
            <div className="text-xs text-gray-500">الحياة</div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="bg-[#1a1a2e] rounded-xl cursor-none"
            onClick={() => setIsPaused(false)}
          />
        </div>

        {/* Start/Pause button */}
        {isPaused && (
          <div className="text-center mt-4">
            <button
              onClick={() => setIsPaused(false)}
              className="bg-pink-600 hover:bg-pink-700 px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto"
            >
              <Play size={20} />
              {lives < 3 ? 'متابعة' : 'ابدأ'}
            </button>
            <p className="text-gray-500 text-sm mt-2">حرك الماوس للتحكم في المضرب</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrickBreakerGame;
