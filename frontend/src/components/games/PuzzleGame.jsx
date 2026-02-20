// Puzzle Game Component
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Puzzle, RotateCcw, Trophy, HelpCircle, Diamond, Eye } from 'lucide-react';
import soundManager from '../../utils/soundManager';
import { puzzleImages } from '../../data/gameData';

const PuzzleGame = ({ mode, onComplete, onClose, userDiamonds, onUseDiamonds }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [emptyIndex, setEmptyIndex] = useState(15);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [gridSize, setGridSize] = useState(4);
  const [showPreview, setShowPreview] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (startTime && !solved) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, solved]);

  const initGame = (image, size = 4) => {
    setGridSize(size);
    const totalTiles = size * size;
    const newTiles = Array.from({ length: totalTiles - 1 }, (_, i) => i);
    
    // Shuffle tiles
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
    }
    newTiles.push(null);
    
    setTiles(newTiles);
    setEmptyIndex(totalTiles - 1);
    setMoves(0);
    setSolved(false);
    setSelectedImage(image);
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  const handleTileClick = (index) => {
    if (solved) return;
    
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;
    
    const isAdjacent = 
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);
    
    if (isAdjacent) {
      soundManager.puzzleMove();
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setEmptyIndex(index);
      setMoves(m => m + 1);
      
      // Check if solved
      const isSolved = newTiles.slice(0, -1).every((tile, i) => tile === i);
      if (isSolved) {
        setSolved(true);
        soundManager.win();
        const timeBonus = Math.max(0, 50 - Math.floor(elapsedTime / 10));
        const moveBonus = Math.max(0, 30 - Math.floor(moves / 10));
        const points = 20 + timeBonus + moveBonus;
        onComplete(points, 'win');
      }
    }
  };

  const showHint = () => {
    if (userDiamonds < 2) return;
    onUseDiamonds(2);
    setShowPreview(true);
    setTimeout(() => setShowPreview(false), 3000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Image Selection Screen
  if (!selectedImage) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4" data-testid="puzzle-selection">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="puzzle-back-btn">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Puzzle size={24} className="text-blue-400" />
              تركيب الصور
            </h1>
            <div className="w-10" />
          </div>

          <p className="text-center text-gray-400 mb-6">اختر صورة لتركيبها</p>

          <div className="grid grid-cols-3 gap-3">
            {puzzleImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => initGame(img)}
                className="aspect-square rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                data-testid={`puzzle-image-${idx}`}
              >
                <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">12 صورة متنوعة</p>
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4" data-testid="puzzle-game">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="puzzle-close-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Puzzle size={24} className="text-blue-400" />
            تركيب الصور
          </h1>
          <button onClick={() => setSelectedImage(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="puzzle-reset-btn">
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-around mb-4 bg-white/5 rounded-xl p-3">
          <div className="text-center">
            <div className="text-gray-400 text-xs">الحركات</div>
            <div className="text-xl font-bold">{moves}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-xs">الوقت</div>
            <div className="text-xl font-bold">{formatTime(elapsedTime)}</div>
          </div>
        </div>

        {/* Hint Button */}
        <button
          onClick={showHint}
          disabled={userDiamonds < 2}
          className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 py-2 rounded-xl mb-4 border border-purple-500/30"
          data-testid="puzzle-hint-btn"
        >
          <Eye size={18} />
          <span>معاينة الصورة</span>
          <Diamond size={14} />
          <span>2</span>
        </button>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a2e] rounded-2xl p-4 max-w-sm">
              <img src={selectedImage} alt="Preview" className="rounded-xl w-full" />
              <p className="text-center text-gray-400 mt-2 text-sm">المعاينة لمدة 3 ثواني</p>
            </div>
          </div>
        )}

        {/* Puzzle Grid */}
        <div 
          className="grid gap-1 bg-white/10 p-1 rounded-xl mb-4"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {tiles.map((tile, index) => (
            <button
              key={index}
              onClick={() => handleTileClick(index)}
              disabled={tile === null}
              className={`aspect-square rounded overflow-hidden transition-all ${
                tile === null ? 'bg-black/50' : 'hover:ring-2 hover:ring-blue-500'
              }`}
              data-testid={`puzzle-tile-${index}`}
            >
              {tile !== null && (
                <div
                  className="w-full h-full bg-cover bg-no-repeat"
                  style={{
                    backgroundImage: `url(${selectedImage})`,
                    backgroundPosition: `${(tile % gridSize) * (100 / (gridSize - 1))}% ${Math.floor(tile / gridSize) * (100 / (gridSize - 1))}%`,
                    backgroundSize: `${gridSize * 100}%`
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Solved Message */}
        {solved && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
            <Trophy size={60} className="mx-auto text-yellow-400 mb-3" />
            <div className="text-2xl font-bold text-green-400 mb-2">أحسنت!</div>
            <div className="text-gray-400 mb-4">
              أكملت الصورة في {moves} حركة و {formatTime(elapsedTime)}
            </div>
            <button 
              onClick={() => setSelectedImage(null)} 
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
              data-testid="puzzle-play-again-btn"
            >
              صورة جديدة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleGame;
