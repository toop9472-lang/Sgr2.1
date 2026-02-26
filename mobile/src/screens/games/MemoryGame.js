// Memory Game - Professional Memory Matching Game
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 600;
const MAX_GRID_WIDTH = isTablet ? 400 : screenWidth - 40;
const CARD_MARGIN = 4;
const GRID_SIZE = 4; // 4x4 grid = 16 cards = 8 pairs
const CARD_SIZE = (MAX_GRID_WIDTH - (CARD_MARGIN * 2 * GRID_SIZE)) / GRID_SIZE;

// إيموجي الأيقونات للبطاقات
const CARD_ICONS = [
  { icon: 'star', color: '#fbbf24' },
  { icon: 'heart', color: '#ef4444' },
  { icon: 'moon', color: '#a855f7' },
  { icon: 'sunny', color: '#f97316' },
  { icon: 'leaf', color: '#22c55e' },
  { icon: 'water', color: '#3b82f6' },
  { icon: 'flame', color: '#dc2626' },
  { icon: 'diamond', color: '#06b6d4' },
  { icon: 'flash', color: '#eab308' },
  { icon: 'rocket', color: '#8b5cf6' },
  { icon: 'planet', color: '#14b8a6' },
  { icon: 'snow', color: '#60a5fa' },
];

const createCards = (pairs = 8) => {
  const selectedIcons = CARD_ICONS.slice(0, pairs);
  const cards = [];
  
  selectedIcons.forEach((item, index) => {
    // كل أيقونة تضاف مرتين (زوج)
    cards.push({ id: index * 2, icon: item.icon, color: item.color, pairId: index });
    cards.push({ id: index * 2 + 1, icon: item.icon, color: item.color, pairId: index });
  });
  
  // خلط البطاقات
  return cards.sort(() => Math.random() - 0.5);
};

const MemoryCard = ({ card, isFlipped, isMatched, onPress, disabled }) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped || isMatched ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, isMatched]);
  
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={onPress} 
      disabled={disabled || isMatched}
      activeOpacity={0.8}
    >
      {/* Back of card */}
      <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterpolate }] }]}>
        <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.cardGradient}>
          <Ionicons name="help" size={24} color="rgba(255,255,255,0.5)" />
        </LinearGradient>
      </Animated.View>
      
      {/* Front of card */}
      <Animated.View style={[styles.card, styles.cardFront, isMatched && styles.cardMatched, { transform: [{ rotateY: frontInterpolate }] }]}>
        <Ionicons name={card.icon} size={32} color={card.color} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const MemoryGame = ({ mode, onComplete, onClose }) => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef(null);
  
  // بدء اللعبة
  useEffect(() => {
    startNewGame();
    return () => clearInterval(timerRef.current);
  }, []);
  
  const startNewGame = () => {
    const newCards = createCards(8);
    setCards(newCards);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setTime(0);
    setGameOver(false);
    setIsChecking(false);
    
    // بدء المؤقت
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
  };
  
  const handleCardPress = (cardId) => {
    if (isChecking || flippedCards.length >= 2) return;
    if (flippedCards.includes(cardId)) return;
    if (matchedPairs.includes(cards.find(c => c.id === cardId)?.pairId)) return;
    
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsChecking(true);
      
      const [first, second] = newFlipped;
      const firstCard = cards.find(c => c.id === first);
      const secondCard = cards.find(c => c.id === second);
      
      if (firstCard.pairId === secondCard.pairId) {
        // تطابق!
        const newMatched = [...matchedPairs, firstCard.pairId];
        setMatchedPairs(newMatched);
        setFlippedCards([]);
        setIsChecking(false);
        
        // التحقق من الفوز
        if (newMatched.length === 8) {
          clearInterval(timerRef.current);
          setGameOver(true);
          
          // حساب النقاط بناءً على الوقت والحركات
          let points = 18;
          if (moves < 16) points = 25;
          else if (moves < 20) points = 22;
          else if (moves < 25) points = 20;
          
          setTimeout(() => {
            onComplete(points, 'win');
          }, 1000);
        }
      } else {
        // لا تطابق - إخفاء بعد ثانية
        setTimeout(() => {
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>لعبة الذاكرة</Text>
        <TouchableOpacity onPress={startNewGame} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>
      
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={18} color="#60a5fa" />
          <Text style={styles.statValue}>{formatTime(time)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="swap-horizontal" size={18} color="#fbbf24" />
          <Text style={styles.statValue}>{moves} حركة</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
          <Text style={styles.statValue}>{matchedPairs.length}/8</Text>
        </View>
      </View>
      
      {/* Game Board */}
      <View style={styles.board}>
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            card={card}
            isFlipped={flippedCards.includes(card.id)}
            isMatched={matchedPairs.includes(card.pairId)}
            onPress={() => handleCardPress(card.id)}
            disabled={isChecking}
          />
        ))}
      </View>
      
      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>اقلب البطاقات وجد الأزواج المتطابقة</Text>
      </View>
      
      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <LinearGradient colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.9)']} style={styles.gameOverContent}>
            <Ionicons name="trophy" size={60} color="#fbbf24" />
            <Text style={styles.gameOverTitle}>مبروك</Text>
            <Text style={styles.gameOverText}>أكملت اللعبة في {formatTime(time)}</Text>
            <Text style={styles.gameOverText}>عدد الحركات: {moves}</Text>
            <TouchableOpacity style={styles.playAgainBtn} onPress={startNewGame}>
              <Text style={styles.playAgainText}>العب مرة أخرى</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  stat: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  statValue: { 
    color: '#FFF', 
    fontSize: 15, 
    fontWeight: '600' 
  },
  
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
  },
  
  cardContainer: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: CARD_MARGIN,
  },
  card: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBack: {
    backgroundColor: '#1e1e28',
  },
  cardFront: {
    backgroundColor: '#1e1e28',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardMatched: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverContent: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  gameOverText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginVertical: 4,
  },
  playAgainBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  playAgainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MemoryGame;
