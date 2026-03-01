// Math Race Game - Professional Speed Math Challenge
// لعبة سباق الرياضيات الاحترافية
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

const { width: screenWidth } = Dimensions.get('window');

// خلفية اللعبة
const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/859703c501805508bde619abff117e247072d5e95f5d1c5713f5c43febcc9c87.png';

const GAME_DURATION = 60; // ثانية
const OPERATIONS = ['+', '-', '×', '÷'];

const MathRaceGame = ({ mode, onComplete, onClose }) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [difficulty, setDifficulty] = useState(1);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const timerRef = useRef(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    generateQuestion();
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: timeLeft / GAME_DURATION,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateQuestion = () => {
    const maxNum = 10 + (difficulty * 5);
    const opIndex = Math.min(Math.floor(Math.random() * (1 + Math.floor(difficulty / 2))), 3);
    const operation = OPERATIONS[opIndex];
    
    let num1, num2, answer;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * maxNum) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * maxNum) + 10;
        num2 = Math.floor(Math.random() * Math.min(num1, maxNum)) + 1;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        break;
      case '÷':
        num2 = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        num1 = num2 * answer;
        break;
    }

    setQuestion({ num1, num2, operation, answer });
    
    // إنشاء خيارات
    const wrongAnswers = new Set();
    while (wrongAnswers.size < 3) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrong = answer + offset;
      if (wrong !== answer && wrong > 0) {
        wrongAnswers.add(wrong);
      }
    }
    
    const allOptions = [answer, ...Array.from(wrongAnswers)]
      .sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setIsCorrect(null);
  };

  const handleAnswer = (selected) => {
    if (gameOver || isCorrect !== null) return;
    
    const correct = selected === question.answer;
    setIsCorrect(correct);
    setQuestionsAnswered(q => q + 1);

    if (correct) {
      gameSounds.correct();
      const points = 10 * (1 + streak * 0.1) * difficulty;
      setScore(s => s + Math.floor(points));
      setStreak(s => s + 1);
      setCorrectAnswers(c => c + 1);
      if (streak + 1 > maxStreak) setMaxStreak(streak + 1);
      
      // زيادة الصعوبة
      if ((correctAnswers + 1) % 5 === 0) {
        setDifficulty(d => Math.min(d + 1, 5));
      }

      // أنيميشن النجاح
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    } else {
      gameSounds.wrong();
      setStreak(0);
      
      // أنيميشن الخطأ
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    // السؤال التالي
    setTimeout(() => {
      generateQuestion();
    }, 800);
  };

  const endGame = () => {
    setGameOver(true);
    clearInterval(timerRef.current);
    
    if (score >= 500) {
      gameSounds.win();
      onComplete && onComplete(50, 'win');
    } else if (score >= 200) {
      gameSounds.levelUp();
      onComplete && onComplete(30, 'good');
    } else {
      gameSounds.lose();
      onComplete && onComplete(15, 'lose');
    }
  };

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setDifficulty(1);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    generateQuestion();
    startTimer();
  };

  const getOperationColor = (op) => {
    switch (op) {
      case '+': return '#22c55e';
      case '-': return '#ef4444';
      case '×': return '#3b82f6';
      case '÷': return '#f59e0b';
      default: return '#FFF';
    }
  };

  return (
    <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <Animated.View style={[styles.scoreBox, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.scoreLabel}>النقاط</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </Animated.View>
          
          <View style={styles.streakBox}>
            <Ionicons name="flame" size={20} color="#f59e0b" />
            <Text style={styles.streakValue}>{streak}</Text>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={styles.timerBar}>
            <Animated.View 
              style={[
                styles.timerFill,
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: timeLeft > 20 ? '#22c55e' : timeLeft > 10 ? '#f59e0b' : '#ef4444',
                }
              ]} 
            />
          </View>
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>

        {/* Difficulty & Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="speedometer" size={16} color="#8b5cf6" />
            <Text style={styles.statText}>المستوى {difficulty}</Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.statText}>{correctAnswers}/{questionsAnswered}</Text>
          </View>
        </View>

        {/* Question */}
        {question && (
          <Animated.View style={[styles.questionBox, { transform: [{ translateX: shakeAnim }] }]}>
            <View style={styles.questionInner}>
              <Text style={styles.questionNum}>{question.num1}</Text>
              <View style={[styles.operationBadge, { backgroundColor: getOperationColor(question.operation) }]}>
                <Text style={styles.operationText}>{question.operation}</Text>
              </View>
              <Text style={styles.questionNum}>{question.num2}</Text>
              <Text style={styles.equalsSign}>=</Text>
              <Text style={styles.questionMark}>?</Text>
            </View>
          </Animated.View>
        )}

        {/* Answer Options */}
        <View style={styles.optionsGrid}>
          {options.map((option, index) => {
            const isSelected = isCorrect !== null;
            const isThisCorrect = option === question?.answer;
            const wasSelected = isSelected && (isThisCorrect || (isCorrect === false && option === question?.answer));
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionBtn,
                  isSelected && isThisCorrect && styles.optionCorrect,
                  isSelected && !isThisCorrect && styles.optionWrong,
                ]}
                onPress={() => handleAnswer(option)}
                disabled={isCorrect !== null}
                activeOpacity={0.8}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback */}
        {isCorrect !== null && (
          <View style={styles.feedbackContainer}>
            <Text style={[styles.feedbackText, { color: isCorrect ? '#22c55e' : '#ef4444' }]}>
              {isCorrect ? '✓ صحيح!' : '✗ خطأ!'}
            </Text>
          </View>
        )}

        {/* Game Over */}
        {gameOver && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverModal}>
              <Text style={styles.gameOverEmoji}>
                {score >= 500 ? '🏆' : score >= 200 ? '⭐' : '📊'}
              </Text>
              <Text style={styles.gameOverTitle}>انتهى الوقت!</Text>
              <Text style={styles.finalScore}>{score} نقطة</Text>
              
              <View style={styles.finalStats}>
                <View style={styles.finalStatItem}>
                  <Text style={styles.finalStatLabel}>الإجابات الصحيحة</Text>
                  <Text style={styles.finalStatValue}>{correctAnswers}/{questionsAnswered}</Text>
                </View>
                <View style={styles.finalStatItem}>
                  <Text style={styles.finalStatLabel}>أعلى سلسلة</Text>
                  <Text style={styles.finalStatValue}>{maxStreak}</Text>
                </View>
                <View style={styles.finalStatItem}>
                  <Text style={styles.finalStatLabel}>المستوى</Text>
                  <Text style={styles.finalStatValue}>{difficulty}</Text>
                </View>
              </View>

              <View style={styles.gameOverButtons}>
                <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
                  <Ionicons name="refresh" size={20} color="#FFF" />
                  <Text style={styles.playAgainText}>العب مرة أخرى</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
                  <Text style={styles.exitText}>خروج</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.3)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 10,
  },
  scoreValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  streakValue: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: 'bold',
  },

  timerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerBar: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 6,
  },
  timerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 40,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statText: {
    color: '#FFF',
    fontSize: 12,
  },

  questionBox: {
    marginHorizontal: 20,
    marginVertical: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  questionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  questionNum: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  operationBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operationText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  equalsSign: {
    color: '#94a3b8',
    fontSize: 36,
    marginHorizontal: 8,
  },
  questionMark: {
    color: '#60a5fa',
    fontSize: 48,
    fontWeight: 'bold',
  },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  optionBtn: {
    width: (screenWidth - 64) / 2,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  optionCorrect: {
    backgroundColor: 'rgba(34,197,94,0.4)',
    borderColor: '#22c55e',
  },
  optionWrong: {
    backgroundColor: 'rgba(239,68,68,0.4)',
    borderColor: '#ef4444',
  },
  optionText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },

  feedbackContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverModal: {
    backgroundColor: '#1e293b',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '85%',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  gameOverEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  gameOverTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  finalScore: {
    color: '#3b82f6',
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  finalStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  finalStatItem: {
    alignItems: 'center',
  },
  finalStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 4,
  },
  finalStatValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameOverButtons: {
    width: '100%',
    gap: 12,
  },
  playAgainBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playAgainText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default MathRaceGame;
