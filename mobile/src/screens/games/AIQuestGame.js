// AI Quest - لعبة مغامرة ذكاء اصطناعي مبتكرة
// لعبة تتحدى فيها الذكاء الاصطناعي في سلسلة من التحديات المتنوعة
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  TextInput,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import gameSounds from '../../utils/gameSounds';

// AI-Generated Professional Background
const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/e25830e67b07b9abd00a45cfdba92ba9699cedf84dd86dc00ee05ea23d562afc.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 600;
const GAME_WIDTH = isTablet ? Math.min(screenWidth * 0.8, 600) : screenWidth;

// أنواع التحديات المختلفة
const CHALLENGE_TYPES = ['math', 'pattern', 'logic', 'word', 'memory'];

// توليد تحدي رياضي
const generateMathChallenge = (level) => {
  const difficulty = Math.min(level, 5);
  let a, b, op, answer, question;
  
  switch (difficulty) {
    case 1:
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      op = Math.random() > 0.5 ? '+' : '-';
      break;
    case 2:
      a = Math.floor(Math.random() * 30) + 10;
      b = Math.floor(Math.random() * 10) + 1;
      op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
      break;
    case 3:
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * 20) + 5;
      op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
      break;
    default:
      a = Math.floor(Math.random() * 100) + 50;
      b = Math.floor(Math.random() * 30) + 10;
      op = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)];
      if (op === '÷') {
        a = b * Math.floor(Math.random() * 10 + 2);
      }
  }
  
  switch (op) {
    case '+': answer = a + b; break;
    case '-': answer = a - b; break;
    case '×': answer = a * b; break;
    case '÷': answer = a / b; break;
  }
  
  question = `${a} ${op} ${b} = ?`;
  
  // توليد خيارات خاطئة
  const options = [answer];
  while (options.length < 4) {
    const wrong = answer + (Math.floor(Math.random() * 20) - 10);
    if (wrong !== answer && !options.includes(wrong) && wrong > 0) {
      options.push(Math.floor(wrong));
    }
  }
  options.sort(() => Math.random() - 0.5);
  
  return {
    type: 'math',
    question,
    options,
    correctIndex: options.indexOf(answer),
    timeLimit: Math.max(15 - level, 8),
    points: 10 + level * 5,
  };
};

// توليد تحدي الأنماط
const generatePatternChallenge = (level) => {
  const patterns = [
    { seq: [2, 4, 6, 8], next: 10, hint: 'أرقام زوجية' },
    { seq: [1, 3, 5, 7], next: 9, hint: 'أرقام فردية' },
    { seq: [1, 2, 4, 8], next: 16, hint: 'مضاعفة' },
    { seq: [1, 4, 9, 16], next: 25, hint: 'مربعات الأرقام' },
    { seq: [2, 6, 12, 20], next: 30, hint: 'n² + n' },
    { seq: [1, 1, 2, 3, 5], next: 8, hint: 'فيبوناتشي' },
    { seq: [3, 6, 12, 24], next: 48, hint: 'ضرب في 2' },
    { seq: [100, 90, 80, 70], next: 60, hint: 'طرح 10' },
    { seq: [1, 8, 27, 64], next: 125, hint: 'مكعبات' },
    { seq: [5, 10, 20, 40], next: 80, hint: 'ضرب في 2' },
    { seq: [2, 3, 5, 7, 11], next: 13, hint: 'أعداد أولية' },
    { seq: [1, 3, 6, 10], next: 15, hint: 'أرقام مثلثية' },
    { seq: [0, 1, 1, 2, 3, 5], next: 8, hint: 'فيبوناتشي من الصفر' },
    { seq: [2, 4, 8, 16], next: 32, hint: 'قوى العدد 2' },
    { seq: [3, 9, 27, 81], next: 243, hint: 'قوى العدد 3' },
    { seq: [1, 2, 6, 24], next: 120, hint: 'المضروب (!)' },
    { seq: [10, 20, 30, 40], next: 50, hint: 'جمع 10' },
    { seq: [99, 88, 77, 66], next: 55, hint: 'طرح 11' },
    { seq: [5, 10, 15, 20], next: 25, hint: 'جمع 5' },
    { seq: [1, 4, 7, 10], next: 13, hint: 'جمع 3' },
    { seq: [64, 32, 16, 8], next: 4, hint: 'قسمة على 2' },
    { seq: [1000, 100, 10], next: 1, hint: 'قسمة على 10' },
    { seq: [2, 5, 10, 17], next: 26, hint: 'n² + 1' },
    { seq: [0, 3, 8, 15], next: 24, hint: 'n² - 1' },
  ];
  
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const options = [pattern.next];
  
  while (options.length < 4) {
    const wrong = pattern.next + (Math.floor(Math.random() * 30) - 15);
    if (wrong !== pattern.next && !options.includes(wrong) && wrong >= 0) {
      options.push(wrong);
    }
  }
  options.sort(() => Math.random() - 0.5);
  
  return {
    type: 'pattern',
    question: `ما هو الرقم التالي في السلسلة؟\n${pattern.seq.join(' → ')} → ?`,
    options,
    correctIndex: options.indexOf(pattern.next),
    hint: pattern.hint,
    timeLimit: Math.max(20 - level, 10),
    points: 15 + level * 5,
  };
};

// توليد تحدي منطقي
const generateLogicChallenge = (level) => {
  const puzzles = [
    {
      question: 'إذا كان اليوم قبل الخميس بيومين، فما هو اليوم؟',
      options: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء'],
      answer: 3,
    },
    {
      question: 'عمر أحمد ضعف عمر سارة. إذا كان عمر سارة 10 سنوات، فكم عمر أحمد؟',
      options: ['15', '20', '25', '30'],
      answer: 1,
    },
    {
      question: 'في سباق، تجاوزت المركز الثاني. ما هو مركزك الآن؟',
      options: ['الأول', 'الثاني', 'الثالث', 'الرابع'],
      answer: 1,
    },
    {
      question: 'كم مثلث في الشكل المكون من 4 خطوط متقاطعة؟',
      options: ['4', '6', '8', '10'],
      answer: 2,
    },
    {
      question: 'إذا كان 5 آلات تصنع 5 قطع في 5 دقائق، كم آلة تصنع 100 قطعة في 100 دقيقة؟',
      options: ['5', '20', '50', '100'],
      answer: 0,
    },
    {
      question: 'أب وابن مجموع أعمارهما 66 سنة. الأب ضعف عمر الابن. كم عمر الابن؟',
      options: ['18', '20', '22', '24'],
      answer: 2,
    },
    {
      question: 'قطار يسير 60 كم/س. كم يقطع في 30 دقيقة؟',
      options: ['20 كم', '30 كم', '40 كم', '60 كم'],
      answer: 1,
    },
    {
      question: 'إذا كانت الساعة 3:45، كم درجة بين العقربين؟',
      options: ['157.5°', '172.5°', '180°', '202.5°'],
      answer: 1,
    },
    {
      question: 'لدي 3 تفاحات، أخذت واحدة. كم تفاحة معي؟',
      options: ['0', '1', '2', '3'],
      answer: 1,
    },
    {
      question: 'إذا نام شخص الساعة 9 مساءً واستيقظ الساعة 6 صباحاً، كم ساعة نام؟',
      options: ['7', '8', '9', '10'],
      answer: 2,
    },
    {
      question: 'كتاب يحتوي 200 صفحة. قرأت نصفه، كم صفحة بقيت؟',
      options: ['50', '75', '100', '150'],
      answer: 2,
    },
    {
      question: 'إذا كان عمر خالد 15 سنة بعد 5 سنوات، كم عمره الآن؟',
      options: ['8', '10', '12', '20'],
      answer: 1,
    },
    {
      question: 'مزارع لديه 17 خروفاً، ماتت جميعها إلا 9. كم خروفاً بقي؟',
      options: ['8', '9', '17', '0'],
      answer: 1,
    },
    {
      question: 'ما هو الرقم الذي إذا ضربته في نفسه يعطي 144؟',
      options: ['10', '11', '12', '14'],
      answer: 2,
    },
    {
      question: 'طبيب أعطى مريضاً 3 حبات دواء يأخذها كل نصف ساعة. متى ينتهي منها؟',
      options: ['ساعة', 'ساعة ونصف', 'نصف ساعة', '45 دقيقة'],
      answer: 0,
    },
    {
      question: 'كم شهراً في السنة يحتوي على 28 يوماً؟',
      options: ['1', '6', '12', '4'],
      answer: 2,
    },
    {
      question: 'والد أحمد له 5 أبناء: علي، حسن، محمود، خالد و...؟',
      options: ['سعيد', 'أحمد', 'عمر', 'يوسف'],
      answer: 1,
    },
    {
      question: 'إذا كانت الساعة 12 ظهراً، ماذا تكون الساعة بعد 23 ساعة؟',
      options: ['11 صباحاً', '12 ظهراً', '11 مساءً', '1 ظهراً'],
      answer: 0,
    },
    {
      question: 'رجل يمشي 4 كم شمالاً ثم 3 كم شرقاً. كم يبعد عن نقطة البداية؟',
      options: ['5 كم', '6 كم', '7 كم', '1 كم'],
      answer: 0,
    },
    {
      question: 'إذا كان لديك فقط عود ثقاب واحد ودخلت غرفة مظلمة فيها شمعة ومصباح زيت وموقد، ماذا تشعل أولاً؟',
      options: ['الشمعة', 'المصباح', 'الموقد', 'عود الثقاب'],
      answer: 3,
    },
  ];
  
  const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  
  return {
    type: 'logic',
    question: puzzle.question,
    options: puzzle.options,
    correctIndex: puzzle.answer,
    timeLimit: Math.max(25 - level, 12),
    points: 20 + level * 5,
  };
};

// توليد تحدي كلمات
const generateWordChallenge = (level) => {
  const challenges = [
    { question: 'ما هو عكس كلمة "سعادة"؟', options: ['فرح', 'حزن', 'غضب', 'قلق'], answer: 1 },
    { question: 'أكمل المثل: العين بصيرة و...', options: ['اليد طويلة', 'اليد قصيرة', 'القلب كبير', 'الصبر جميل'], answer: 1 },
    { question: 'ما هو مرادف "شجاعة"؟', options: ['خوف', 'جبن', 'بسالة', 'ضعف'], answer: 2 },
    { question: 'ما هو جمع كلمة "كتاب"؟', options: ['كتابات', 'كتب', 'كتّاب', 'مكتبات'], answer: 1 },
    { question: 'أكمل: من جدّ ...', options: ['وجد', 'نجح', 'فاز', 'ربح'], answer: 0 },
    { question: 'ما هو ضد كلمة "الكرم"؟', options: ['العطاء', 'السخاء', 'البخل', 'الجود'], answer: 2 },
    { question: 'ما هو مفرد كلمة "أقلام"؟', options: ['قلم', 'قلمة', 'أقلمة', 'قولم'], answer: 0 },
    { question: 'ما هو جمع كلمة "سماء"؟', options: ['سماوات', 'سموات', 'أسمية', 'سماءات'], answer: 0 },
    { question: 'أكمل المثل: الصديق وقت ...', options: ['الفرح', 'الضيق', 'النوم', 'الأكل'], answer: 1 },
    { question: 'ما هو عكس كلمة "نجاح"؟', options: ['فوز', 'إخفاق', 'تقدم', 'صعود'], answer: 1 },
    { question: 'ما مرادف كلمة "الجميل"؟', options: ['القبيح', 'الحسن', 'السيء', 'الغريب'], answer: 1 },
    { question: 'ما هو جمع كلمة "رجل"؟', options: ['رجال', 'رجلات', 'أرجال', 'رجول'], answer: 0 },
    { question: 'أكمل: خير الكلام ما ...', options: ['طال', 'قل ودل', 'كثر', 'تأخر'], answer: 1 },
    { question: 'ما هو ضد كلمة "الصعود"؟', options: ['النزول', 'الطيران', 'القفز', 'الجري'], answer: 0 },
    { question: 'ما مفرد كلمة "أصدقاء"؟', options: ['صداقة', 'صديق', 'صدق', 'صادق'], answer: 1 },
    { question: 'أكمل المثل: رب أخ لك لم ...', options: ['تعرفه', 'تره', 'تلده أمك', 'تحبه'], answer: 2 },
    { question: 'ما عكس كلمة "الظلام"؟', options: ['الليل', 'النور', 'الغيم', 'المطر'], answer: 1 },
    { question: 'ما مرادف كلمة "السرعة"؟', options: ['البطء', 'العجلة', 'الثبات', 'الهدوء'], answer: 1 },
    { question: 'ما جمع كلمة "يد"؟', options: ['يدات', 'أيدي', 'يدين', 'يدود'], answer: 1 },
    { question: 'أكمل: العقل السليم في الجسم ...', options: ['القوي', 'السليم', 'الكبير', 'الصغير'], answer: 1 },
  ];
  
  const challenge = challenges[Math.floor(Math.random() * challenges.length)];
  
  return {
    type: 'word',
    question: challenge.question,
    options: challenge.options,
    correctIndex: challenge.answer,
    timeLimit: Math.max(18 - level, 10),
    points: 12 + level * 4,
  };
};

// توليد تحدي ذاكرة
const generateMemoryChallenge = (level) => {
  const colors = ['أحمر', 'أزرق', 'أخضر', 'أصفر', 'برتقالي', 'بنفسجي'];
  const shapes = ['مربع', 'دائرة', 'مثلث', 'نجمة', 'قلب', 'معين'];
  
  // توليد تسلسل عشوائي
  const sequenceLength = Math.min(3 + Math.floor(level / 2), 6);
  const sequence = [];
  
  for (let i = 0; i < sequenceLength; i++) {
    if (Math.random() > 0.5) {
      sequence.push(colors[Math.floor(Math.random() * colors.length)]);
    } else {
      sequence.push(shapes[Math.floor(Math.random() * shapes.length)]);
    }
  }
  
  // السؤال عن عنصر معين
  const askIndex = Math.floor(Math.random() * sequenceLength);
  const correctAnswer = sequence[askIndex];
  
  const options = [correctAnswer];
  const allOptions = [...colors, ...shapes];
  while (options.length < 4) {
    const option = allOptions[Math.floor(Math.random() * allOptions.length)];
    if (!options.includes(option)) {
      options.push(option);
    }
  }
  options.sort(() => Math.random() - 0.5);
  
  return {
    type: 'memory',
    sequence: sequence,
    question: `احفظ التسلسل ثم أجب:\nما هو العنصر رقم ${askIndex + 1}؟`,
    options,
    correctIndex: options.indexOf(correctAnswer),
    timeLimit: Math.max(10 + sequenceLength * 2, 8),
    points: 15 + level * 5,
    showSequenceFor: 3 + sequenceLength,
  };
};

// توليد تحدي عشوائي
const generateChallenge = (level) => {
  const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
  
  switch (type) {
    case 'math': return generateMathChallenge(level);
    case 'pattern': return generatePatternChallenge(level);
    case 'logic': return generateLogicChallenge(level);
    case 'word': return generateWordChallenge(level);
    case 'memory': return generateMemoryChallenge(level);
    default: return generateMathChallenge(level);
  }
};

// مكون عرض التسلسل للذاكرة
const SequenceDisplay = ({ sequence, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= sequence.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [sequence]);
  
  return (
    <View style={styles.sequenceContainer}>
      <Text style={styles.sequenceTitle}>احفظ التسلسل!</Text>
      <View style={styles.sequenceItems}>
        {sequence.map((item, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sequenceItem,
              index <= currentIndex && styles.sequenceItemActive,
            ]}
          >
            <Text style={styles.sequenceItemText}>
              {index <= currentIndex ? item : '?'}
            </Text>
          </Animated.View>
        ))}
      </View>
      <Text style={styles.sequenceHint}>
        {currentIndex + 1} / {sequence.length}
      </Text>
    </View>
  );
};

// اللعبة الرئيسية
const AIQuestGame = ({ mode, onComplete, onClose }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [showingSequence, setShowingSequence] = useState(false);
  const [aiScore, setAiScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  
  const timerRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // بدء لعبة جديدة
  useEffect(() => {
    startNewChallenge();
    return () => clearInterval(timerRef.current);
  }, []);
  
  // مؤقت
  useEffect(() => {
    if (timeLeft > 0 && !answered && !gameOver && !showingSequence) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      
      // تحريك شريط التقدم
      Animated.timing(progressAnim, {
        toValue: (timeLeft - 1) / currentChallenge?.timeLimit || 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else if (timeLeft === 0 && !answered && currentChallenge) {
      handleAnswer(-1); // انتهى الوقت
    }
    
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, answered, gameOver, showingSequence]);
  
  const startNewChallenge = () => {
    const challenge = generateChallenge(level);
    setCurrentChallenge(challenge);
    setTimeLeft(challenge.timeLimit);
    setAnswered(null);
    progressAnim.setValue(1);
    
    // إذا كان تحدي ذاكرة، عرض التسلسل أولاً
    if (challenge.type === 'memory') {
      setShowingSequence(true);
    }
  };
  
  const handleSequenceComplete = () => {
    setShowingSequence(false);
    setTimeLeft(currentChallenge.timeLimit);
  };
  
  const handleAnswer = (index) => {
    if (answered !== null) return;
    setAnswered(index);
    clearTimeout(timerRef.current);
    
    const correct = index === currentChallenge.correctIndex;
    
    if (correct) {
      // إجابة صحيحة
      const bonus = Math.floor(timeLeft * 2);
      const streakBonus = streak >= 3 ? 10 : 0;
      setScore(s => s + currentChallenge.points + bonus + streakBonus);
      setStreak(s => {
        const newStreak = s + 1;
        if (newStreak > highestStreak) setHighestStreak(newStreak);
        return newStreak;
      });
      
      // AI يخسر قليلاً
      setAiScore(s => Math.max(0, s - 5));
      
      setTimeout(() => {
        if ((level % 3 === 0) && level > 0) {
          setLevel(l => l + 1);
        }
        startNewChallenge();
      }, 1500);
    } else {
      // إجابة خاطئة
      setStreak(0);
      setLives(l => l - 1);
      setAiScore(s => s + currentChallenge.points);
      
      // اهتزاز
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      
      if (lives <= 1) {
        setGameOver(true);
        const won = score > aiScore;
        setTimeout(() => {
          onComplete(Math.floor(score / 10), won ? 'win' : 'lose');
        }, 1000);
      } else {
        setTimeout(() => {
          setLevel(l => Math.max(1, l));
          startNewChallenge();
        }, 2000);
      }
    }
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'math': return 'calculator';
      case 'pattern': return 'grid';
      case 'logic': return 'bulb';
      case 'word': return 'text';
      case 'memory': return 'layers';
      default: return 'help-circle';
    }
  };
  
  const getTypeName = (type) => {
    switch (type) {
      case 'math': return 'حساب';
      case 'pattern': return 'أنماط';
      case 'logic': return 'منطق';
      case 'word': return 'كلمات';
      case 'memory': return 'ذاكرة';
      default: return 'تحدي';
    }
  };
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'math': return ['#3b82f6', '#1d4ed8'];
      case 'pattern': return ['#8b5cf6', '#6d28d9'];
      case 'logic': return ['#f59e0b', '#d97706'];
      case 'word': return ['#10b981', '#059669'];
      case 'memory': return ['#ec4899', '#db2777'];
      default: return ['#6b7280', '#4b5563'];
    }
  };
  
  // شاشة انتهاء اللعبة
  if (gameOver) {
    const won = score > aiScore;
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
        <View style={styles.gameOverContainer}>
          <LinearGradient
            colors={won ? ['#22c55e', '#16a34a'] : ['#ef4444', '#dc2626']}
            style={styles.gameOverIcon}
          >
            <Ionicons name={won ? 'trophy' : 'skull'} size={60} color="#FFF" />
          </LinearGradient>
          
          <Text style={styles.gameOverTitle}>
            {won ? 'تهانينا' : 'انتهت اللعبة'}
          </Text>
          <Text style={styles.gameOverSubtitle}>
            {won ? 'لقد هزمت الذكاء الاصطناعي!' : 'الذكاء الاصطناعي فاز هذه المرة'}
          </Text>
          
          <View style={styles.finalScoreContainer}>
            <View style={styles.finalScoreItem}>
              <Text style={styles.finalScoreLabel}>نقاطك</Text>
              <Text style={[styles.finalScoreValue, { color: '#3b82f6' }]}>{score}</Text>
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.finalScoreItem}>
              <Text style={styles.finalScoreLabel}>AI</Text>
              <Text style={[styles.finalScoreValue, { color: '#ef4444' }]}>{aiScore}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={20} color="#f59e0b" />
              <Text style={styles.statValue}>{highestStreak}</Text>
              <Text style={styles.statLabel}>أعلى سلسلة</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={20} color="#10b981" />
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>المستوى</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.exitButton} onPress={onClose}>
            <Text style={styles.exitButtonText}>خروج</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ImageBackground>
    );
  }
  
  // عرض تسلسل الذاكرة
  if (showingSequence && currentChallenge?.type === 'memory') {
    return (
      <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
        <SequenceDisplay
          sequence={currentChallenge.sequence}
          onComplete={handleSequenceComplete}
        />
        </View>
      </ImageBackground>
    );
  }
  
  if (!currentChallenge) return null;
  
  return (
    <ImageBackground source={{ uri: GAME_BG }} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Quest</Text>
          <Text style={styles.headerLevel}>المستوى {level}</Text>
        </View>
        <View style={styles.livesContainer}>
          {[1, 2, 3].map(i => (
            <Ionicons
              key={i}
              name={i <= lives ? 'heart' : 'heart-outline'}
              size={20}
              color={i <= lives ? '#ef4444' : '#4b5563'}
            />
          ))}
        </View>
      </View>
      
      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <View style={styles.playerScore}>
          <Ionicons name="person" size={24} color="#3b82f6" />
          <Text style={styles.playerScoreText}>{score}</Text>
        </View>
        <View style={styles.vsContainer}>
          <Text style={styles.vsTextSmall}>VS</Text>
          {streak >= 3 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#FFF" />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}
        </View>
        <View style={styles.aiScore}>
          <Ionicons name="hardware-chip" size={24} color="#ef4444" />
          <Text style={styles.aiScoreText}>{aiScore}</Text>
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
                backgroundColor: timeLeft <= 5 ? '#ef4444' : '#3b82f6',
              },
            ]}
          />
        </View>
        <View style={styles.timerText}>
          <Ionicons name="time" size={16} color={timeLeft <= 5 ? '#ef4444' : '#60a5fa'} />
          <Text style={[styles.timerValue, timeLeft <= 5 && { color: '#ef4444' }]}>
            {timeLeft}
          </Text>
        </View>
      </View>
      
      {/* Challenge Card */}
      <Animated.View style={[styles.challengeCard, { transform: [{ translateX: shakeAnim }] }]}>
        <LinearGradient
          colors={getTypeColor(currentChallenge.type)}
          style={styles.challengeType}
        >
          <Ionicons name={getTypeIcon(currentChallenge.type)} size={18} color="#FFF" />
          <Text style={styles.challengeTypeName}>{getTypeName(currentChallenge.type)}</Text>
        </LinearGradient>
        
        <Text style={styles.questionText}>{currentChallenge.question}</Text>
        
        {currentChallenge.hint && (
          <View style={styles.hintContainer}>
            <Ionicons name="bulb-outline" size={14} color="#fbbf24" />
            <Text style={styles.hintText}>{currentChallenge.hint}</Text>
          </View>
        )}
      </Animated.View>
      
      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentChallenge.options.map((option, index) => {
          let optionStyle = styles.optionButton;
          let textStyle = styles.optionText;
          
          if (answered !== null) {
            if (index === currentChallenge.correctIndex) {
              optionStyle = [styles.optionButton, styles.optionCorrect];
              textStyle = [styles.optionText, styles.optionTextSelected];
            } else if (index === answered) {
              optionStyle = [styles.optionButton, styles.optionWrong];
              textStyle = [styles.optionText, styles.optionTextSelected];
            }
          }
          
          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleAnswer(index)}
              disabled={answered !== null}
              activeOpacity={0.8}
            >
              <Text style={textStyle}>{option}</Text>
              {answered !== null && index === currentChallenge.correctIndex && (
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              )}
              {answered !== null && index === answered && index !== currentChallenge.correctIndex && (
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Points Indicator */}
      <View style={styles.pointsIndicator}>
        <Ionicons name="star" size={16} color="#fbbf24" />
        <Text style={styles.pointsIndicatorText}>+{currentChallenge.points} نقطة</Text>
      </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
    paddingTop: 50,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerLevel: {
    fontSize: 12,
    color: '#60a5fa',
    marginTop: 2,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  
  // Score Board
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  playerScore: {
    alignItems: 'center',
    flex: 1,
  },
  playerScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 4,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  vsTextSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
  },
  streakText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiScore: {
    alignItems: 'center',
    flex: 1,
  },
  aiScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 4,
  },
  
  // Timer
  timerContainer: {
    marginBottom: 20,
  },
  timerBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  timerValue: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Challenge Card
  challengeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  challengeType: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  challengeTypeName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  hintText: {
    color: '#fbbf24',
    fontSize: 12,
  },
  
  // Options
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionCorrect: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
  },
  optionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  optionText: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: 'bold',
  },
  
  // Points Indicator
  pointsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pointsIndicatorText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Sequence Display
  sequenceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30,
  },
  sequenceItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: width - 60,
  },
  sequenceItem: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sequenceItemActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    borderColor: '#ec4899',
  },
  sequenceItemText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sequenceHint: {
    color: '#888',
    fontSize: 14,
    marginTop: 20,
  },
  
  // Game Over
  gameOverContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gameOverIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  gameOverSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
  },
  finalScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  finalScoreItem: {
    alignItems: 'center',
  },
  finalScoreLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  finalScoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  exitButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AIQuestGame;
