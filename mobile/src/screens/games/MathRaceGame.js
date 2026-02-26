// Math Race Game - Fast Math Challenges
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 600;
const GAME_WIDTH = isTablet ? Math.min(screenWidth * 0.7, 500) : screenWidth;
const GAME_TIME = 60; // 60 ثانية

const generateQuestion = (difficulty) => {
  let num1, num2, operator, answer;
  
  if (difficulty < 5) {
    // سهل: جمع وطرح بسيط
    num1 = Math.floor(Math.random() * 20) + 1;
    num2 = Math.floor(Math.random() * 20) + 1;
    operator = Math.random() > 0.5 ? '+' : '-';
    if (operator === '-' && num2 > num1) [num1, num2] = [num2, num1];
    answer = operator === '+' ? num1 + num2 : num1 - num2;
  } else if (difficulty < 10) {
    // متوسط: ضرب وقسمة بسيطة
    const type = Math.random();
    if (type < 0.4) {
      num1 = Math.floor(Math.random() * 50) + 10;
      num2 = Math.floor(Math.random() * 30) + 5;
      operator = Math.random() > 0.5 ? '+' : '-';
      if (operator === '-' && num2 > num1) [num1, num2] = [num2, num1];
      answer = operator === '+' ? num1 + num2 : num1 - num2;
    } else {
      num1 = Math.floor(Math.random() * 10) + 2;
      num2 = Math.floor(Math.random() * 10) + 2;
      operator = '×';
      answer = num1 * num2;
    }
  } else {
    // صعب: عمليات مختلطة
    const type = Math.random();
    if (type < 0.3) {
      num1 = Math.floor(Math.random() * 100) + 20;
      num2 = Math.floor(Math.random() * 50) + 10;
      operator = Math.random() > 0.5 ? '+' : '-';
      if (operator === '-' && num2 > num1) [num1, num2] = [num2, num1];
      answer = operator === '+' ? num1 + num2 : num1 - num2;
    } else if (type < 0.7) {
      num1 = Math.floor(Math.random() * 12) + 2;
      num2 = Math.floor(Math.random() * 12) + 2;
      operator = '×';
      answer = num1 * num2;
    } else {
      // قسمة بدون باقي
      answer = Math.floor(Math.random() * 10) + 2;
      num2 = Math.floor(Math.random() * 10) + 2;
      num1 = answer * num2;
      operator = '÷';
    }
  }
  
  // إنشاء خيارات
  const options = [answer];
  while (options.length < 4) {
    let wrongAnswer;
    const diff = Math.floor(Math.random() * 10) + 1;
    wrongAnswer = Math.random() > 0.5 ? answer + diff : answer - diff;
    if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // خلط الخيارات
  options.sort(() => Math.random() - 0.5);
  
  return {
    question: `${num1} ${operator} ${num2} = ?`,
    options,
    correctAnswer: answer,
    correctIndex: options.indexOf(answer),
  };
};

const MathRaceGame = ({ mode, isOnline, opponent, isMyTurn, onComplete, onClose, onSendMove }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const timerRef = useRef(null);
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startGame();
    return () => clearInterval(timerRef.current);
  }, []);

  const startGame = () => {
    setCurrentQuestion(generateQuestion(0));
    setScore(0);
    setStreak(0);
    setTimeLeft(GAME_TIME);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setGameOver(false);
    
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

  const endGame = () => {
    clearInterval(timerRef.current);
    setGameOver(true);
    
    // حساب النقاط
    let points = Math.min(22, Math.floor(correctAnswers * 1.5));
    if (correctAnswers >= 20) points = 25;
    else if (correctAnswers >= 15) points = 22;
    else if (correctAnswers >= 10) points = 18;
    else if (correctAnswers >= 5) points = 12;
    
    setTimeout(() => {
      onComplete(points, correctAnswers >= 10 ? 'win' : 'lose');
    }, 1000);
  };

  const showFeedback = (isCorrect) => {
    setFeedback(isCorrect);
    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(feedbackAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setFeedback(null));
  };

  const handleAnswer = (selectedIndex) => {
    if (gameOver) return;
    
    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    showFeedback(isCorrect);
    
    if (isCorrect) {
      const newStreak = streak + 1;
      const bonus = Math.min(newStreak, 5);
      setScore(s => s + 10 + bonus);
      setStreak(newStreak);
      setCorrectAnswers(c => c + 1);
    } else {
      setStreak(0);
    }
    
    setQuestionsAnswered(q => q + 1);
    
    // السؤال التالي
    setTimeout(() => {
      setCurrentQuestion(generateQuestion(questionsAnswered + 1));
    }, 200);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return (
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Ionicons name="time" size={20} color={timeLeft <= 10 ? '#ef4444' : '#60a5fa'} />
          <Text style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={18} color="#fbbf24" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{questionsAnswered}</Text>
          <Text style={styles.statLabel}>سؤال</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>{correctAnswers}</Text>
          <Text style={styles.statLabel}>صحيح</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{streak}</Text>
          <Text style={styles.statLabel}>متتالي</Text>
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <LinearGradient colors={['#1e1e28', '#252532']} style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          {streak >= 3 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#f59e0b" />
              <Text style={styles.streakText}>×{streak}</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionBtn}
            onPress={() => handleAnswer(index)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.optionGradient}
            >
              <Text style={styles.optionText}>{option}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback Animation */}
      {feedback !== null && (
        <Animated.View style={[styles.feedbackOverlay, { opacity: feedbackAnim }]}>
          <View style={[styles.feedbackBadge, feedback ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Ionicons name={feedback ? 'checkmark' : 'close'} size={40} color="#FFF" />
          </View>
        </Animated.View>
      )}

      {/* Game Over */}
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <LinearGradient colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.9)']} style={styles.gameOverContent}>
            <Ionicons name="calculator" size={50} color="#8b5cf6" />
            <Text style={styles.gameOverTitle}>انتهى الوقت!</Text>
            <View style={styles.gameOverStats}>
              <View style={styles.gameOverStat}>
                <Text style={styles.gameOverStatValue}>{correctAnswers}</Text>
                <Text style={styles.gameOverStatLabel}>إجابة صحيحة</Text>
              </View>
              <View style={styles.gameOverStat}>
                <Text style={styles.gameOverStatValue}>{score}</Text>
                <Text style={styles.gameOverStatLabel}>نقطة</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.playAgainBtn} onPress={startGame}>
              <Ionicons name="refresh" size={20} color="#FFF" />
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
  loadingText: { color: '#FFF', fontSize: 18, textAlign: 'center', marginTop: 100 },
  
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timerText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  timerWarning: { color: '#ef4444' },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: { color: '#fbbf24', fontSize: 18, fontWeight: 'bold' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },

  questionContainer: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  questionCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    position: 'relative',
  },
  questionText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
  },
  streakBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: { color: '#f59e0b', fontSize: 14, fontWeight: 'bold' },

  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  optionBtn: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  optionText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },

  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  feedbackBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackCorrect: { backgroundColor: '#22c55e' },
  feedbackWrong: { backgroundColor: '#ef4444' },

  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverContent: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    minWidth: 300,
  },
  gameOverTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 20,
  },
  gameOverStats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 24,
  },
  gameOverStat: { alignItems: 'center' },
  gameOverStatValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  gameOverStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  playAgainText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default MathRaceGame;
