// Color Switch Game - Test your reflexes
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import gameSounds from '../../utils/gameSounds';

// AI-Generated Professional Background
const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/79182119b4edb90ee55759d8b825745a99a765ec39d10e36ff547c01b5c07d08.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 600;
const GAME_WIDTH = isTablet ? Math.min(screenWidth * 0.7, 500) : screenWidth;

const COLORS = [
  { name: 'أحمر', color: '#ef4444', textColor: '#fef2f2' },
  { name: 'أخضر', color: '#22c55e', textColor: '#f0fdf4' },
  { name: 'أزرق', color: '#3b82f6', textColor: '#eff6ff' },
  { name: 'أصفر', color: '#eab308', textColor: '#fefce8' },
  { name: 'بنفسجي', color: '#a855f7', textColor: '#faf5ff' },
  { name: 'برتقالي', color: '#f97316', textColor: '#fff7ed' },
];

const ColorSwitchGame = ({ mode, onComplete, onClose }) => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentColor, setCurrentColor] = useState(null);
  const [displayedColorName, setDisplayedColorName] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setCombo(0);
    setTimeLeft(30);
    setGameOver(false);
    generateNewRound();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setTimeout(() => endGame(), 100);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const generateNewRound = () => {
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    const textIndex = Math.floor(Math.random() * COLORS.length);
    
    setCurrentColor(COLORS[colorIndex]);
    setDisplayedColorName(COLORS[textIndex]);
    
    // Animation
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const endGame = () => {
    clearInterval(timerRef.current);
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
    }
    
    let points = Math.min(18, Math.floor(score / 2));
    if (score >= 30) points = 22;
    else if (score >= 20) points = 18;
    else if (score >= 10) points = 12;
    
    setTimeout(() => {
      onComplete(points, score >= 15 ? 'win' : 'lose');
    }, 1000);
  };

  const handleAnswer = (isMatch) => {
    const actualMatch = currentColor.name === displayedColorName.name;
    const correct = isMatch === actualMatch;
    
    if (correct) {
      const comboBonus = Math.min(combo, 5);
      setScore(s => s + 1 + comboBonus);
      setCombo(c => c + 1);
      generateNewRound();
    } else {
      setCombo(0);
      // Penalty: lose 1 second
      setTimeLeft(t => Math.max(0, t - 1));
      generateNewRound();
    }
  };

  if (!gameStarted) {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.startContainer}>
            <Ionicons name="color-palette" size={80} color="#f43f5e" />
            <Text style={styles.startTitle}>تبديل الألوان</Text>
            <Text style={styles.startDesc}>
              سيظهر لك اسم لون بلون مختلف{'\n'}
              اضغط ✓ إذا تطابق الاسم مع اللون{'\n'}
              اضغط ✗ إذا لم يتطابق
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Ionicons name="play" size={24} color="#FFF" />
              <Text style={styles.startBtnText}>ابدأ اللعب</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.6)" />
              <Text style={styles.closeBtnText}>رجوع</Text>
            </TouchableOpacity>
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
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Ionicons name="time" size={20} color={timeLeft <= 10 ? '#ef4444' : '#60a5fa'} />
          <Text style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}>
            {timeLeft}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={18} color="#fbbf24" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Combo */}
      {combo >= 3 && (
        <View style={styles.comboContainer}>
          <Ionicons name="flame" size={20} color="#f59e0b" />
          <Text style={styles.comboText}>×{combo} متتالي!</Text>
        </View>
      )}

      {/* Color Display */}
      <View style={styles.colorContainer}>
        <Text style={styles.instruction}>هل اللون مطابق للاسم؟</Text>
        
        <Animated.View style={[styles.colorCard, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.colorText, { color: currentColor?.color }]}>
            {displayedColorName?.name}
          </Text>
        </Animated.View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.answerBtn, styles.noBtn]} 
          onPress={() => handleAnswer(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={40} color="#FFF" />
          <Text style={styles.answerBtnText}>لا</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.answerBtn, styles.yesBtn]} 
          onPress={() => handleAnswer(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={40} color="#FFF" />
          <Text style={styles.answerBtnText}>نعم</Text>
        </TouchableOpacity>
      </View>

      {/* Game Over */}
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <LinearGradient colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.9)']} style={styles.gameOverContent}>
            <Ionicons name="color-palette" size={50} color="#f43f5e" />
            <Text style={styles.gameOverTitle}>انتهى الوقت!</Text>
            <Text style={styles.gameOverScore}>نقاطك: {score}</Text>
            <Text style={styles.gameOverHighScore}>الأفضل: {highScore}</Text>
            <TouchableOpacity style={styles.playAgainBtn} onPress={startGame}>
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.playAgainText}>العب مرة أخرى</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  
  startContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  startTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 16,
  },
  startDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f43f5e',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },

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
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  timerText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timerWarning: { color: '#ef4444' },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    color: '#fbbf24',
    fontSize: 20,
    fontWeight: 'bold',
  },

  comboContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  comboText: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: 'bold',
  },

  colorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  instruction: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    marginBottom: 40,
  },
  colorCard: {
    backgroundColor: '#1e1e28',
    paddingHorizontal: 60,
    paddingVertical: 50,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  colorText: {
    fontSize: 52,
    fontWeight: 'bold',
  },

  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  answerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 20,
  },
  noBtn: {
    backgroundColor: '#ef4444',
  },
  yesBtn: {
    backgroundColor: '#22c55e',
  },
  answerBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
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
    minWidth: 280,
  },
  gameOverTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 12,
  },
  gameOverScore: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 4,
  },
  gameOverHighScore: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
  },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  playAgainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ColorSwitchGame;
