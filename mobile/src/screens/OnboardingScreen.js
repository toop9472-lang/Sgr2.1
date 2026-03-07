// Onboarding Screen - شاشة الترحيب للمستخدمين الجدد
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'مرحباً في صقر',
    description: 'تطبيق المكافآت الأول في المملكة!\nاربح نقاط وماس من الإعلانات والألعاب',
    icon: 'shield',
    colors: ['#1e3a5f', '#0a1929'],
  },
  {
    id: '2',
    title: 'شاهد واربح',
    description: 'شاهد إعلانات قصيرة واحصل على جواهر صقر\n500 جوهرة = 1 ريال سعودي',
    icon: 'tv',
    colors: ['#1e3a5f', '#0a1929'],
  },
  {
    id: '3',
    title: 'العب واستمتع',
    description: '12 لعبة ممتعة بانتظارك!\nالشطرنج، الثعبان، من سيربح المليون والمزيد',
    icon: 'game-controller',
    colors: ['#1e3a5f', '#0a1929'],
  },
  {
    id: '4',
    title: 'ادعُ أصدقاءك',
    description: 'احصل على 100 نقطة لكل صديق يسجل!\nشارك رابط الدعوة الآن',
    icon: 'people',
    colors: ['#1e3a5f', '#0a1929'],
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Mark onboarding as complete
      await AsyncStorage.setItem('onboarding_completed', 'true');
      onComplete && onComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    onComplete && onComplete();
  };

  const renderSlide = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <LinearGradient colors={item.colors} style={styles.slide}>
        <Animated.View style={[styles.slideContent, { transform: [{ scale }], opacity }]}>
          <Ionicons name={item.icon} size={72} color="#60a5fa" style={styles.slideIcon} />
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
        </Animated.View>
      </LinearGradient>
    );
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {ONBOARDING_SLIDES.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, { width: dotWidth, opacity }]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>تخطي</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'ابدأ الآن' : 'التالي'}
            </Text>
            <Ionicons
              name={currentIndex === ONBOARDING_SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={20}
              color="#FFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
  },
  slideIcon: {
    fontSize: 100,
    marginBottom: 30,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
    marginHorizontal: 4,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  nextButton: {
    width: '100%',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default OnboardingScreen;
