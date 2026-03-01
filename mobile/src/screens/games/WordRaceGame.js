// Word Race Game - Find Hidden Words
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import gameSounds from '../../utils/gameSounds';

// AI-Generated Professional Background
const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/1686eb6c53be174737bae618b3efe2ae326d4a885e6864935b7dc822635a6c92.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 600;
const GAME_WIDTH = isTablet ? Math.min(screenWidth * 0.7, 500) : screenWidth;
const GAME_TIME = 90;

// كلمات عربية مع تلميحات
const WORDS_DB = [
  { word: 'شمس', hint: 'تضيء النهار', category: 'طبيعة' },
  { word: 'قمر', hint: 'يضيء الليل', category: 'طبيعة' },
  { word: 'بحر', hint: 'مياه مالحة واسعة', category: 'طبيعة' },
  { word: 'نهر', hint: 'مياه عذبة تجري', category: 'طبيعة' },
  { word: 'جبل', hint: 'مرتفع من الأرض', category: 'طبيعة' },
  { word: 'سماء', hint: 'فوق رؤوسنا زرقاء', category: 'طبيعة' },
  { word: 'نجم', hint: 'يلمع في الليل', category: 'طبيعة' },
  { word: 'ورد', hint: 'زهرة جميلة عطرة', category: 'طبيعة' },
  { word: 'شجر', hint: 'ينمو ويخضر', category: 'طبيعة' },
  { word: 'مطر', hint: 'ماء من السماء', category: 'طبيعة' },
  { word: 'كتاب', hint: 'نقرأ فيه', category: 'أدوات' },
  { word: 'قلم', hint: 'نكتب به', category: 'أدوات' },
  { word: 'باب', hint: 'ندخل منه', category: 'أدوات' },
  { word: 'كرسي', hint: 'نجلس عليه', category: 'أدوات' },
  { word: 'طاولة', hint: 'نأكل عليها', category: 'أدوات' },
  { word: 'هاتف', hint: 'نتصل به', category: 'أدوات' },
  { word: 'ساعة', hint: 'تخبرنا بالوقت', category: 'أدوات' },
  { word: 'مفتاح', hint: 'نفتح به الباب', category: 'أدوات' },
  { word: 'أسد', hint: 'ملك الغابة', category: 'حيوانات' },
  { word: 'فيل', hint: 'أكبر حيوان بري', category: 'حيوانات' },
  { word: 'قط', hint: 'حيوان أليف يموء', category: 'حيوانات' },
  { word: 'كلب', hint: 'حيوان أليف ينبح', category: 'حيوانات' },
  { word: 'طير', hint: 'يطير في السماء', category: 'حيوانات' },
  { word: 'سمك', hint: 'يعيش في الماء', category: 'حيوانات' },
  { word: 'حصان', hint: 'نركبه ويصهل', category: 'حيوانات' },
  { word: 'جمل', hint: 'سفينة الصحراء', category: 'حيوانات' },
  { word: 'تفاح', hint: 'فاكهة حمراء أو خضراء', category: 'طعام' },
  { word: 'موز', hint: 'فاكهة صفراء منحنية', category: 'طعام' },
  { word: 'خبز', hint: 'نأكله مع كل وجبة', category: 'طعام' },
  { word: 'حليب', hint: 'أبيض ومفيد للعظام', category: 'طعام' },
  { word: 'عسل', hint: 'ينتجه النحل حلو', category: 'طعام' },
  { word: 'أرز', hint: 'حبوب بيضاء نطبخها', category: 'طعام' },
  { word: 'سيارة', hint: 'وسيلة نقل بأربع عجلات', category: 'مواصلات' },
  { word: 'طائرة', hint: 'تطير في السماء', category: 'مواصلات' },
  { word: 'قطار', hint: 'يسير على قضبان', category: 'مواصلات' },
  { word: 'سفينة', hint: 'تبحر في البحر', category: 'مواصلات' },
  { word: 'دراجة', hint: 'لها عجلتان', category: 'مواصلات' },
  { word: 'صديق', hint: 'نحبه ونلعب معه', category: 'علاقات' },
  { word: 'أخ', hint: 'ابن أبي وأمي', category: 'علاقات' },
  { word: 'معلم', hint: 'يعلمنا في المدرسة', category: 'مهن' },
  { word: 'طبيب', hint: 'يعالج المرضى', category: 'مهن' },
  { word: 'مهندس', hint: 'يصمم المباني', category: 'مهن' },
  { word: 'شرطي', hint: 'يحمي الناس', category: 'مهن' },
];

const shuffleWord = (word) => {
  return word.split('').sort(() => Math.random() - 0.5).join('');
};

const WordRaceGame = ({ mode, isOnline, onComplete, onClose }) => {
  const [currentWord, setCurrentWord] = useState(null);
  const [shuffledWord, setShuffledWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [wordsFound, setWordsFound] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [usedWords, setUsedWords] = useState([]);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    startGame();
    return () => clearInterval(timerRef.current);
  }, []);

  const getNewWord = (exclude = []) => {
    const available = WORDS_DB.filter(w => !exclude.includes(w.word));
    if (available.length === 0) return WORDS_DB[0];
    return available[Math.floor(Math.random() * available.length)];
  };

  const startGame = () => {
    const word = getNewWord([]);
    setCurrentWord(word);
    setShuffledWord(shuffleWord(word.word));
    setUserInput('');
    setScore(0);
    setStreak(0);
    setTimeLeft(GAME_TIME);
    setWordsFound(0);
    setShowHint(false);
    setGameOver(false);
    setUsedWords([]);
    
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
    
    let points = Math.min(22, wordsFound * 3);
    if (wordsFound >= 12) points = 25;
    else if (wordsFound >= 8) points = 20;
    else if (wordsFound >= 5) points = 15;
    
    setTimeout(() => {
      onComplete(points, wordsFound >= 5 ? 'win' : 'lose');
    }, 1000);
  };

  const nextWord = () => {
    const newUsed = [...usedWords, currentWord.word];
    setUsedWords(newUsed);
    const word = getNewWord(newUsed);
    setCurrentWord(word);
    setShuffledWord(shuffleWord(word.word));
    setUserInput('');
    setShowHint(false);
  };

  const handleSubmit = () => {
    if (!userInput.trim()) return;
    
    const isCorrect = userInput.trim() === currentWord.word;
    setFeedback(isCorrect);
    
    setTimeout(() => setFeedback(null), 500);
    
    if (isCorrect) {
      const bonus = showHint ? 0 : 5;
      const streakBonus = Math.min(streak, 3);
      setScore(s => s + 10 + bonus + streakBonus);
      setStreak(s => s + 1);
      setWordsFound(w => w + 1);
      nextWord();
    } else {
      setStreak(0);
    }
    
    setUserInput('');
  };

  const handleSkip = () => {
    setStreak(0);
    nextWord();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentWord) {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
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
          <Ionicons name="time" size={20} color={timeLeft <= 15 ? '#ef4444' : '#60a5fa'} />
          <Text style={[styles.timerText, timeLeft <= 15 && styles.timerWarning]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={18} color="#fbbf24" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{wordsFound}</Text>
          <Text style={styles.statLabel}>كلمات</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{streak}</Text>
          <Text style={styles.statLabel}>متتالي</Text>
        </View>
      </View>

      {/* Word Card */}
      <View style={styles.wordContainer}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{currentWord.category}</Text>
        </View>
        
        <LinearGradient colors={['#1e1e28', '#252532']} style={styles.wordCard}>
          <Text style={styles.shuffledWord}>{shuffledWord}</Text>
          {streak >= 3 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#f59e0b" />
              <Text style={styles.streakText}>×{streak}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Hint */}
        {showHint ? (
          <View style={styles.hintBox}>
            <Ionicons name="bulb" size={18} color="#fbbf24" />
            <Text style={styles.hintText}>{currentWord.hint}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.hintBtn} onPress={() => setShowHint(true)}>
            <Ionicons name="bulb-outline" size={18} color="#fbbf24" />
            <Text style={styles.hintBtnText}>عرض التلميح (-5 نقاط)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, feedback === false && styles.inputWrong, feedback === true && styles.inputCorrect]}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="اكتب الكلمة هنا..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCapitalize="none"
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Ionicons name="checkmark" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Ionicons name="play-skip-forward" size={18} color="rgba(255,255,255,0.6)" />
        <Text style={styles.skipText}>تخطي</Text>
      </TouchableOpacity>

      {/* Game Over */}
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <LinearGradient colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.9)']} style={styles.gameOverContent}>
            <Ionicons name="text" size={50} color="#06b6d4" />
            <Text style={styles.gameOverTitle}>انتهى الوقت!</Text>
            <View style={styles.gameOverStats}>
              <View style={styles.gameOverStat}>
                <Text style={styles.gameOverStatValue}>{wordsFound}</Text>
                <Text style={styles.gameOverStatLabel}>كلمة</Text>
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
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
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
  scoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { color: '#fbbf24', fontSize: 18, fontWeight: 'bold' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    padding: 16,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },

  wordContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  categoryBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  categoryText: { color: '#06b6d4', fontSize: 14 },
  wordCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  shuffledWord: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 8,
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
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  hintText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 16,
    gap: 6,
  },
  hintBtnText: { color: '#fbbf24', fontSize: 14 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e28',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 20,
    color: '#FFF',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputCorrect: { borderColor: '#22c55e' },
  inputWrong: { borderColor: '#ef4444' },
  submitBtn: {
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  skipText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },

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

export default WordRaceGame;
