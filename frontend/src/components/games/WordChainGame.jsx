// Word Chain Game Component
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Type } from 'lucide-react';
import soundManager from '../../utils/soundManager';
import { arabicWords } from '../../data/gameData';

const WordChainGame = ({ mode, onComplete, onClose, wsConnection, isOnline }) => {
  const [currentWord, setCurrentWord] = useState('');
  const [lastLetter, setLastLetter] = useState('');
  const [playerTurn, setPlayerTurn] = useState(true);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [usedWords, setUsedWords] = useState(new Set());
  const [inputWord, setInputWord] = useState('');
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [words] = useState(arabicWords);
  const inputRef = useRef(null);

  useEffect(() => {
    const startWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(startWord);
    setLastLetter(startWord[startWord.length - 1]);
    setUsedWords(new Set([startWord]));
  }, [words]);

  useEffect(() => {
    if (gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleTimeout();
          return 15;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playerTurn, gameOver]);

  const handleTimeout = () => {
    if (playerTurn) {
      soundManager.error();
      setMessage('انتهى الوقت! خسرت الدور');
      setOpponentScore(s => s + 1);
      if (opponentScore + 1 >= 3) {
        endGame(false);
        return;
      }
    } else {
      soundManager.success();
      setMessage('فشل الخصم! حصلت على نقطة');
      setScore(s => s + 1);
      if (score + 1 >= 3) {
        endGame(true);
        return;
      }
    }
    setTimeLeft(15);
    setPlayerTurn(!playerTurn);
  };

  const submitWord = () => {
    const word = inputWord.trim();
    
    if (!word) return;
    
    if (word[0] !== lastLetter) {
      setMessage(`يجب أن تبدأ الكلمة بحرف "${lastLetter}"`);
      soundManager.error();
      return;
    }
    
    if (usedWords.has(word)) {
      setMessage('هذه الكلمة مستخدمة بالفعل!');
      soundManager.error();
      return;
    }
    
    if (word.length < 2) {
      setMessage('الكلمة قصيرة جداً!');
      soundManager.error();
      return;
    }

    soundManager.success();
    setCurrentWord(word);
    setLastLetter(word[word.length - 1]);
    setUsedWords(prev => new Set([...prev, word]));
    setScore(s => s + 1);
    setInputWord('');
    setMessage('');
    
    // Send word to opponent if online
    if (isOnline && wsConnection) {
      wsConnection.send(JSON.stringify({
        action: 'game_move',
        move: { word }
      }));
    }
    
    if (score + 1 >= 5) {
      endGame(true);
      return;
    }

    setPlayerTurn(false);
    setTimeLeft(15);
    
    if (!isOnline) {
      setTimeout(() => {
        makeAIMove(word[word.length - 1]);
      }, 1500);
    }
  };

  const makeAIMove = (startLetter) => {
    const validWords = words.filter(w => 
      w[0] === startLetter && !usedWords.has(w)
    );
    
    if (validWords.length === 0) {
      setMessage('فشل الخصم في إيجاد كلمة!');
      soundManager.success();
      setScore(s => s + 1);
      if (score + 1 >= 5) {
        endGame(true);
        return;
      }
    } else {
      const aiWord = validWords[Math.floor(Math.random() * validWords.length)];
      setCurrentWord(aiWord);
      setLastLetter(aiWord[aiWord.length - 1]);
      setUsedWords(prev => new Set([...prev, aiWord]));
      setOpponentScore(s => s + 1);
      setMessage(`الخصم: ${aiWord}`);
      soundManager.move();
      
      if (opponentScore + 1 >= 5) {
        endGame(false);
        return;
      }
    }
    
    setPlayerTurn(true);
    setTimeLeft(15);
  };

  const endGame = (won) => {
    setGameOver(true);
    if (won) {
      soundManager.win();
      onComplete(score * 10, 'win');
    } else {
      soundManager.lose();
      onComplete(score * 5, 'lose');
    }
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="wordchain-result">
        <div className="text-center">
          <Type size={80} className={`mx-auto mb-4 ${score >= opponentScore ? 'text-green-400' : 'text-red-400'}`} />
          <div className="text-3xl font-bold mb-2">{score >= opponentScore ? 'فزت!' : 'خسرت!'}</div>
          <div className="text-xl mb-4">
            <span className="text-green-400">{score}</span>
            <span className="text-gray-400"> - </span>
            <span className="text-red-400">{opponentScore}</span>
          </div>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold" data-testid="wordchain-finish-btn">
            إنهاء
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" data-testid="wordchain-game">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="wordchain-back-btn">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Type size={24} className="text-orange-400" />
            سباق الكلمات
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">{score}</span>
            <span className="text-gray-400">-</span>
            <span className="text-red-400 font-bold">{opponentScore}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full border-4 ${timeLeft <= 5 ? 'border-red-500 animate-pulse' : 'border-orange-500'} flex items-center justify-center`}>
            <span className={`text-3xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>{timeLeft}</span>
          </div>
        </div>

        {/* Turn Indicator */}
        <div className={`text-center p-3 rounded-xl mb-4 ${playerTurn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {playerTurn ? 'دورك!' : (isOnline ? 'دور الخصم...' : 'دور الكمبيوتر...')}
        </div>

        {/* Current Word */}
        <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-2xl p-6 mb-4">
          <p className="text-sm text-gray-400 text-center mb-2">الكلمة الحالية:</p>
          <p className="text-3xl font-bold text-center">{currentWord}</p>
          <p className="text-sm text-center mt-2 text-orange-400">
            الكلمة التالية يجب أن تبدأ بحرف: <span className="text-2xl font-bold">{lastLetter}</span>
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-3 mb-4 text-center text-purple-400">
            {message}
          </div>
        )}

        {/* Input */}
        {playerTurn && (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitWord()}
              placeholder={`اكتب كلمة تبدأ بـ "${lastLetter}"`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-orange-500"
              autoFocus
              data-testid="wordchain-input"
            />
            <button
              onClick={submitWord}
              className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-semibold"
              data-testid="wordchain-submit-btn"
            >
              أرسل
            </button>
          </div>
        )}

        {/* Used Words */}
        <div className="mt-6">
          <p className="text-gray-400 text-sm mb-2">الكلمات المستخدمة ({usedWords.size}):</p>
          <div className="flex flex-wrap gap-2">
            {[...usedWords].slice(-10).map((word, idx) => (
              <span key={idx} className="bg-white/5 px-3 py-1 rounded-full text-sm">{word}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordChainGame;
