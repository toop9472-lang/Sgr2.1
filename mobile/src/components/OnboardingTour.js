// Onboarding tour shown on first launch — 4 quick slides explaining Saqr.
import React, { useState, useRef, useEffect, memo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HOME_ICONS } from "../constants/uiAssets";

const { width: SW } = Dimensions.get("window");

const SLIDES = [
  {
    image: HOME_ICONS.brand,
    title: "أهلاً بك في صقر",
    sub: "اكسب جواهر حقيقية من مشاهداتك اليومية.",
    cta: "ابدأ الجولة",
  },
  {
    image: HOME_ICONS.watch,
    title: "شاهد إعلانات وأكسب",
    sub: "كل إعلان قصير تشاهده = 5 جواهر فورية.",
    cta: "التالي",
  },
  {
    image: HOME_ICONS.reels,
    title: "ريلز المجتمع",
    sub: "اكتشف، أعجب، علّق وانشر مقاطع 15 ثانية.",
    cta: "التالي",
  },
  {
    image: HOME_ICONS.fortunes,
    title: "بدّل جواهرك إلى ريال",
    sub: "500 جوهرة = 3 ﷼. اسحب بسهولة من ثروات صقر.",
    cta: "ابدأ الآن",
  },
];

const KEY = "saqr_onboarding_v1_completed";

const OnboardingTour = ({ onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (!v) setVisible(true);
      })
      .catch(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (!visible) return;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [idx, visible, fade]);

  const handleNext = () => {
    if (idx < SLIDES.length - 1) {
      setIdx(idx + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    try {
      await AsyncStorage.setItem(KEY, "1");
    } catch (_) {
      /* ignore */
    }
    setVisible(false);
    onComplete && onComplete();
  };

  if (!visible) return null;
  const slide = SLIDES[idx];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      <LinearGradient
        colors={["#06070d", "#0b0c14", "#0d0d1a"]}
        style={styles.container}
      >
        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={finish}>
          <Text style={styles.skipText}>تخطّي</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.body, { opacity: fade }]}>
          <View style={styles.imageWrap}>
            <Image source={slide.image} style={styles.image} />
            <View style={styles.imageGlow} />
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.sub}>{slide.sub}</Text>
        </Animated.View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === idx && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.ctaBtn}
          onPress={handleNext}
        >
          <Text style={styles.ctaText}>{slide.cta}</Text>
          <Ionicons name="arrow-back" size={16} color="#0a0a0f" />
        </TouchableOpacity>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipBtn: {
    position: "absolute",
    top: 50,
    left: 22,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  skipText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  body: { alignItems: "center", paddingTop: 50 },
  imageWrap: {
    width: SW * 0.62,
    height: SW * 0.62,
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 36,
    borderWidth: 1,
    borderColor: "rgba(255,215,128,0.22)",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 8,
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  imageGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  sub: {
    color: "#cbd5e1",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    marginBottom: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(148,163,184,0.35)",
  },
  dotActive: {
    width: 22,
    backgroundColor: "#fbbf24",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    minWidth: 180,
    justifyContent: "center",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 6,
  },
  ctaText: { color: "#0a0a0f", fontSize: 15, fontWeight: "900" },
});

export default memo(OnboardingTour);
