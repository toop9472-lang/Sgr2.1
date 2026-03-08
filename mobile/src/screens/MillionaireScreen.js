// MillionaireScreen - من سيربح المليون
// لعبة أسئلة احترافية بنظام الجوائز والمساعدات
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ImageBackground,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePoints } from '../services/PointsContext';
import { shuffleArray } from '../utils/random';

const { width, height } = Dimensions.get('window');

const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/8cdadba2892459ff5914f65842239cb7d223d973dca3d9c0e02dc176bdacf78d.png';

// مستويات الجوائز (15 سؤال)
const PRIZE_LEVELS = [
  { level: 1, prize: 100, guaranteed: false },
  { level: 2, prize: 200, guaranteed: false },
  { level: 3, prize: 300, guaranteed: false },
  { level: 4, prize: 500, guaranteed: false },
  { level: 5, prize: 1000, guaranteed: true }, // نقطة أمان
  { level: 6, prize: 2000, guaranteed: false },
  { level: 7, prize: 4000, guaranteed: false },
  { level: 8, prize: 8000, guaranteed: false },
  { level: 9, prize: 16000, guaranteed: false },
  { level: 10, prize: 32000, guaranteed: true }, // نقطة أمان
  { level: 11, prize: 64000, guaranteed: false },
  { level: 12, prize: 125000, guaranteed: false },
  { level: 13, prize: 250000, guaranteed: false },
  { level: 14, prize: 500000, guaranteed: false },
  { level: 15, prize: 1000000, guaranteed: true }, // المليون!
];

// وسائل المساعدة
const LIFELINES = [
  { id: 'fifty', name: '50:50', icon: 'git-compare', cost: 10, description: 'إزالة إجابتين خاطئتين' },
  { id: 'audience', name: 'الجمهور', icon: 'people', cost: 15, description: 'استشر رأي الجمهور' },
  { id: 'call', name: 'اتصال', icon: 'call', cost: 20, description: 'اتصل بصديق' },
  { id: 'skip', name: 'تخطي', icon: 'arrow-forward', cost: 25, description: 'تخطي السؤال' },
];

// أسئلة اللعبة (مرتبة حسب الصعوبة)
const QUESTIONS = [
  // المستوى 1-5 (سهل)
  { q: 'ما هي عاصمة المملكة العربية السعودية؟', a: ['الرياض', 'جدة', 'مكة', 'الدمام'], correct: 0 },
  { q: 'كم عدد أيام الأسبوع؟', a: ['5', '6', '7', '8'], correct: 2 },
  { q: 'ما هو لون السماء في النهار الصافي؟', a: ['أحمر', 'أخضر', 'أزرق', 'أصفر'], correct: 2 },
  { q: 'كم عدد أركان الإسلام؟', a: ['3', '4', '5', '6'], correct: 2 },
  { q: 'ما هي أكبر قارة في العالم؟', a: ['أفريقيا', 'آسيا', 'أوروبا', 'أمريكا'], correct: 1 },
  // المستوى 6-10 (متوسط)
  { q: 'من هو مخترع المصباح الكهربائي؟', a: ['نيوتن', 'أديسون', 'آينشتاين', 'بيل'], correct: 1 },
  { q: 'كم عدد كواكب المجموعة الشمسية؟', a: ['7', '8', '9', '10'], correct: 1 },
  { q: 'ما هي أطول نهر في العالم؟', a: ['النيل', 'الأمازون', 'المسيسيبي', 'اليانغتسي'], correct: 0 },
  { q: 'في أي عام هبط الإنسان على القمر؟', a: ['1965', '1969', '1972', '1975'], correct: 1 },
  { q: 'ما هي عملة اليابان؟', a: ['يوان', 'ين', 'وون', 'روبية'], correct: 1 },
  // المستوى 11-15 (صعب)
  { q: 'من كتب رواية "البؤساء"؟', a: ['تولستوي', 'فيكتور هوجو', 'ديكنز', 'دوستويفسكي'], correct: 1 },
  { q: 'ما هو العنصر الأكثر وفرة في الكون؟', a: ['أكسجين', 'كربون', 'هيدروجين', 'هيليوم'], correct: 2 },
  { q: 'كم عدد عظام جسم الإنسان البالغ؟', a: ['186', '206', '226', '246'], correct: 1 },
  { q: 'ما هي أصغر دولة في العالم؟', a: ['موناكو', 'الفاتيكان', 'سان مارينو', 'مالطا'], correct: 1 },
  { q: 'في أي عام تأسست الأمم المتحدة؟', a: ['1942', '1945', '1948', '1950'], correct: 1 },
];

const MillionaireScreen = ({ onClose, onComplete }) => {
  const { diamonds, addDiamonds, useDiamonds, addPoints } = usePoints();
  
  const [gameState, setGameState] = useState('start'); // start, playing, won, lost
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [usedLifelines, setUsedLifelines] = useState([]);
  const [hiddenAnswers, setHiddenAnswers] = useState([]);
  const [audienceVotes, setAudienceVotes] = useState(null);
  const [friendHint, setFriendHint] = useState(null);
  const [showLifelineModal, setShowLifelineModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [guaranteedPrize, setGuaranteedPrize] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentQuestion = QUESTIONS[currentLevel];
  const currentPrize = PRIZE_LEVELS[currentLevel];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentLevel]);

  // استخدام وسيلة مساعدة
  const useLifeline = async (lifeline) => {
    if (usedLifelines.includes(lifeline.id)) {
      Alert.alert('تنبيه', 'استخدمت هذه المساعدة مسبقاً');
      return;
    }

    if (diamonds < lifeline.cost) {
      setShowAdModal(true);
      return;
    }

    const result = await useDiamonds(lifeline.cost);
    if (!result.success) {
      Alert.alert('خطأ', result.error);
      return;
    }

    setUsedLifelines([...usedLifelines, lifeline.id]);
    setShowLifelineModal(false);

    switch (lifeline.id) {
      case 'fifty':
        // إزالة إجابتين خاطئتين
        const wrongAnswers = [0, 1, 2, 3].filter(i => i !== currentQuestion.correct);
        const toHide = shuffleArray(wrongAnswers).slice(0, 2);
        setHiddenAnswers(toHide);
        break;
      
      case 'audience':
        // رأي الجمهور
        const votes = [0, 0, 0, 0];
        votes[currentQuestion.correct] = 50 + Math.floor(Math.random() * 30);
        const remaining = 100 - votes[currentQuestion.correct];
        [0, 1, 2, 3].filter(i => i !== currentQuestion.correct).forEach((i, idx) => {
          votes[i] = idx === 2 ? remaining : Math.floor(remaining * Math.random() * 0.5);
        });
        setAudienceVotes(votes);
        break;
      
      case 'call':
        // اتصال بصديق
        const confidence = Math.random() > 0.3 ? 'متأكد' : 'أعتقد';
        const answer = currentQuestion.a[currentQuestion.correct];
        setFriendHint(`${confidence} أن الإجابة هي "${answer}"`);
        break;
      
      case 'skip':
        // تخطي السؤال
        handleCorrectAnswer();
        break;
    }
  };

  // اختيار إجابة
  const selectAnswer = (index) => {
    if (showResult || hiddenAnswers.includes(index)) return;
    
    setSelectedAnswer(index);
    
    // تأثير نبض
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // تأكيد الإجابة
  const confirmAnswer = () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    
    setTimeout(() => {
      if (selectedAnswer === currentQuestion.correct) {
        handleCorrectAnswer();
      } else {
        handleWrongAnswer();
      }
    }, 2000);
  };

  // إجابة صحيحة
  const handleCorrectAnswer = () => {
    // تحديث نقطة الأمان
    if (currentPrize.guaranteed) {
      setGuaranteedPrize(currentPrize.prize);
    }

    if (currentLevel >= 14) {
      // فاز بالمليون!
      setGameState('won');
      addPoints(100); // مكافأة كبيرة
      addDiamonds(50);
    } else {
      // الانتقال للسؤال التالي
      setCurrentLevel(currentLevel + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setHiddenAnswers([]);
      setAudienceVotes(null);
      setFriendHint(null);
      fadeAnim.setValue(0);
    }
  };

  // إجابة خاطئة
  const handleWrongAnswer = () => {
    setGameState('lost');
    
    // إضافة نقاط حسب نقطة الأمان
    const finalPrize = guaranteedPrize;
    if (finalPrize > 0) {
      addPoints(Math.floor(finalPrize / 100));
    }
  };

  // الانسحاب بالجائزة
  const takeTheMoney = () => {
    Alert.alert(
      'تأكيد الانسحاب',
      `هل تريد الانسحاب بـ ${currentPrize.prize.toLocaleString()} جوهرة؟`,
      [
        { text: 'لا، استمر', style: 'cancel' },
        { 
          text: 'نعم، انسحب', 
          onPress: () => {
            addPoints(Math.floor(currentPrize.prize / 100));
            addDiamonds(currentLevel * 2);
            onComplete && onComplete(Math.floor(currentPrize.prize / 100), 'win');
            onClose && onClose();
          }
        },
      ]
    );
  };

  // شاشة البداية
  if (gameState === 'start') {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.startScreen}>
            <Ionicons name="cash" size={72} color="#fbbf24" style={styles.logoIcon} />
            <Text style={styles.title}>من سيربح المليون</Text>
            <Text style={styles.subtitle}>15 سؤال للوصول للمليون!</Text>
            
            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>قواعد اللعبة:</Text>
              <Text style={styles.ruleText}>• 15 سؤال متدرج الصعوبة</Text>
              <Text style={styles.ruleText}>• نقطتا أمان: السؤال 5 و 10</Text>
              <Text style={styles.ruleText}>• 4 وسائل مساعدة (بالماس)</Text>
              <Text style={styles.ruleText}>• يمكنك الانسحاب في أي وقت</Text>
            </View>
            
            <View style={styles.diamondsInfo}>
              <Ionicons name="diamond" size={20} color="#60a5fa" />
              <Text style={styles.diamondsText}>رصيدك: {diamonds} ماسة</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.startBtn}
              onPress={() => setGameState('playing')}
            >
              <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.startBtnGradient}>
                <Text style={styles.startBtnText}>ابدأ اللعب</Text>
                <Ionicons name="play" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // شاشة الفوز
  if (gameState === 'won') {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.resultScreen}>
            <Ionicons name="trophy" size={72} color="#fbbf24" style={styles.resultIcon} />
            <Text style={styles.resultTitle}>مبروك!</Text>
            <Text style={styles.resultSubtitle}>ربحت المليون!</Text>
            <Text style={styles.resultPrize}>1,000,000</Text>
            <Text style={styles.resultPoints}>+ 100 جوهرة + 50 ماسة</Text>
            
            <TouchableOpacity style={styles.closeResultBtn} onPress={onClose}>
              <Text style={styles.closeResultText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // شاشة الخسارة
  if (gameState === 'lost') {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.resultScreen}>
            <Ionicons name="close-circle" size={72} color="#ef4444" style={styles.resultIcon} />
            <Text style={styles.resultTitle}>للأسف!</Text>
            <Text style={styles.resultSubtitle}>الإجابة الصحيحة كانت:</Text>
            <Text style={styles.correctAnswer}>{currentQuestion.a[currentQuestion.correct]}</Text>
            {guaranteedPrize > 0 && (
              <Text style={styles.resultPrize}>ربحت: {guaranteedPrize.toLocaleString()}</Text>
            )}
            
            <TouchableOpacity style={styles.closeResultBtn} onPress={onClose}>
              <Text style={styles.closeResultText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // شاشة اللعب
  return (
    <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.prizeDisplay}>
            <Text style={styles.prizeLabel}>الجائزة الحالية</Text>
            <Text style={styles.prizeValue}>{currentPrize.prize.toLocaleString()}</Text>
          </View>
          
          <TouchableOpacity style={styles.headerBtn} onPress={takeTheMoney}>
            <Ionicons name="exit" size={24} color="#fbbf24" />
          </TouchableOpacity>
        </View>

        {/* Level indicator */}
        <View style={styles.levelBar}>
          <Text style={styles.levelText}>السؤال {currentLevel + 1} من 15</Text>
          {currentPrize.guaranteed && (
            <View style={styles.guaranteedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#22c55e" />
              <Text style={styles.guaranteedText}>مرحلة أمان</Text>
            </View>
          )}
        </View>

        {/* Question */}
        <Animated.View style={[styles.questionCard, { opacity: fadeAnim }]}>
          <Text style={styles.questionText}>{currentQuestion.q}</Text>
        </Animated.View>

        {/* Audience votes */}
        {audienceVotes && (
          <View style={styles.audienceCard}>
            <Text style={styles.audienceTitle}>رأي الجمهور:</Text>
            <View style={styles.audienceVotes}>
              {audienceVotes.map((vote, i) => (
                <View key={i} style={styles.voteBar}>
                  <Text style={styles.voteLabel}>{String.fromCharCode(65 + i)}</Text>
                  <View style={[styles.voteBarFill, { width: `${vote}%` }]} />
                  <Text style={styles.votePercent}>{vote}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Friend hint */}
        {friendHint && (
          <View style={styles.friendCard}>
            <Ionicons name="call" size={20} color="#22c55e" />
            <Text style={styles.friendText}>صديقك يقول: {friendHint}</Text>
          </View>
        )}

        {/* Answers */}
        <View style={styles.answersGrid}>
          {currentQuestion.a.map((answer, index) => {
            const isHidden = hiddenAnswers.includes(index);
            const isSelected = selectedAnswer === index;
            const isCorrect = showResult && index === currentQuestion.correct;
            const isWrong = showResult && isSelected && index !== currentQuestion.correct;
            
            return (
              <Animated.View key={index} style={{ transform: [{ scale: isSelected ? scaleAnim : 1 }] }}>
                <TouchableOpacity
                  style={[
                    styles.answerBtn,
                    isHidden && styles.answerHidden,
                    isSelected && styles.answerSelected,
                    isCorrect && styles.answerCorrect,
                    isWrong && styles.answerWrong,
                  ]}
                  onPress={() => selectAnswer(index)}
                  disabled={isHidden || showResult}
                >
                  <Text style={styles.answerLetter}>{String.fromCharCode(65 + index)}</Text>
                  <Text style={[styles.answerText, isHidden && styles.answerTextHidden]}>
                    {isHidden ? '---' : answer}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Confirm button */}
        {selectedAnswer !== null && !showResult && (
          <TouchableOpacity style={styles.confirmBtn} onPress={confirmAnswer}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.confirmGradient}>
              <Text style={styles.confirmText}>تأكيد الإجابة</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Lifelines */}
        <View style={styles.lifelinesBar}>
          {LIFELINES.map(lifeline => (
            <TouchableOpacity
              key={lifeline.id}
              style={[
                styles.lifelineBtn,
                usedLifelines.includes(lifeline.id) && styles.lifelineUsed,
              ]}
              onPress={() => {
                if (!usedLifelines.includes(lifeline.id)) {
                  setShowLifelineModal(true);
                }
              }}
              disabled={usedLifelines.includes(lifeline.id) || showResult}
            >
              <Ionicons 
                name={lifeline.icon} 
                size={20} 
                color={usedLifelines.includes(lifeline.id) ? '#666' : '#fbbf24'} 
              />
              <Text style={[
                styles.lifelineText,
                usedLifelines.includes(lifeline.id) && styles.lifelineTextUsed,
              ]}>
                {lifeline.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lifeline Modal */}
        <Modal visible={showLifelineModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>وسائل المساعدة</Text>
              
              <View style={styles.diamondsRow}>
                <Ionicons name="diamond" size={18} color="#60a5fa" />
                <Text style={styles.modalDiamonds}>رصيدك: {diamonds}</Text>
              </View>
              
              {LIFELINES.filter(l => !usedLifelines.includes(l.id)).map(lifeline => (
                <TouchableOpacity
                  key={lifeline.id}
                  style={styles.lifelineOption}
                  onPress={() => useLifeline(lifeline)}
                >
                  <View style={styles.lifelineInfo}>
                    <Ionicons name={lifeline.icon} size={24} color="#fbbf24" />
                    <View>
                      <Text style={styles.lifelineOptionName}>{lifeline.name}</Text>
                      <Text style={styles.lifelineDesc}>{lifeline.description}</Text>
                    </View>
                  </View>
                  <View style={styles.lifelineCost}>
                    <Ionicons name="diamond" size={14} color="#60a5fa" />
                    <Text style={styles.lifelineCostText}>{lifeline.cost}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setShowLifelineModal(false)}
              >
                <Text style={styles.modalCloseText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Ad Modal */}
        <Modal visible={showAdModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="diamond" size={40} color="#60a5fa" />
              <Text style={styles.modalTitle}>ماس غير كافي!</Text>
              <Text style={styles.modalDesc}>شاهد إعلان للحصول على 10 ماسات مجاناً</Text>
              
              <TouchableOpacity style={styles.watchAdBtn}>
                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.watchAdGradient}>
                  <Ionicons name="play" size={20} color="#FFF" />
                  <Text style={styles.watchAdText}>شاهد إعلان</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setShowAdModal(false)}
              >
                <Text style={styles.modalCloseText}>لاحقاً</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  closeBtn: { position: 'absolute', top: 50, right: 20, padding: 10, zIndex: 10 },

  // Start Screen
  startScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoIcon: { marginBottom: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fbbf24', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 30 },
  rulesCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 16, width: '100%', marginBottom: 20 },
  rulesTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  ruleText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  diamondsInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 30 },
  diamondsText: { fontSize: 16, color: '#60a5fa' },
  startBtn: { width: '100%' },
  startBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  startBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  prizeDisplay: { alignItems: 'center' },
  prizeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  prizeValue: { fontSize: 24, fontWeight: 'bold', color: '#fbbf24' },

  // Level Bar
  levelBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 },
  levelText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  guaranteedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  guaranteedText: { fontSize: 12, color: '#22c55e' },

  // Question
  questionCard: { backgroundColor: 'rgba(59,130,246,0.2)', marginHorizontal: 16, padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#3b82f6' },
  questionText: { fontSize: 18, fontWeight: '600', color: '#FFF', textAlign: 'center', lineHeight: 28 },

  // Audience
  audienceCard: { marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 },
  audienceTitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  audienceVotes: { gap: 4 },
  voteBar: { flexDirection: 'row', alignItems: 'center' },
  voteLabel: { width: 20, fontSize: 12, color: '#FFF' },
  voteBarFill: { height: 16, backgroundColor: '#3b82f6', borderRadius: 4, marginRight: 8 },
  votePercent: { fontSize: 12, color: '#FFF' },

  // Friend hint
  friendCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: 'rgba(34,197,94,0.2)', borderRadius: 12, gap: 8 },
  friendText: { fontSize: 14, color: '#FFF', flex: 1 },

  // Answers
  answersGrid: { padding: 16, gap: 10 },
  answerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  answerHidden: { opacity: 0.3 },
  answerSelected: { borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.2)' },
  answerCorrect: { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.3)' },
  answerWrong: { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.3)' },
  answerLetter: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 30, color: '#FFF', fontWeight: 'bold', marginRight: 12 },
  answerText: { fontSize: 16, color: '#FFF', flex: 1 },
  answerTextHidden: { color: '#666' },

  // Confirm
  confirmBtn: { marginHorizontal: 16, marginTop: 10 },
  confirmGradient: { padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  // Lifelines
  lifelinesBar: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12, marginTop: 'auto' },
  lifelineBtn: { alignItems: 'center', padding: 8 },
  lifelineUsed: { opacity: 0.4 },
  lifelineText: { fontSize: 10, color: '#FFF', marginTop: 4 },
  lifelineTextUsed: { color: '#666' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e1e2e', padding: 24, borderRadius: 20, width: '100%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  modalDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 20 },
  diamondsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  modalDiamonds: { fontSize: 16, color: '#60a5fa' },
  lifelineOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 10 },
  lifelineInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lifelineOptionName: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  lifelineDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  lifelineCost: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lifelineCostText: { fontSize: 14, color: '#60a5fa' },
  modalCloseBtn: { marginTop: 10, padding: 12 },
  modalCloseText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  watchAdBtn: { width: '100%', marginBottom: 10 },
  watchAdGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  watchAdText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },

  // Result
  resultScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultIcon: { marginBottom: 16 },
  resultTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  resultSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  resultPrize: { fontSize: 48, fontWeight: 'bold', color: '#fbbf24', marginBottom: 8 },
  resultPoints: { fontSize: 16, color: '#22c55e', marginBottom: 30 },
  correctAnswer: { fontSize: 20, color: '#22c55e', marginBottom: 20 },
  closeResultBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  closeResultText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});

export default MillionaireScreen;
