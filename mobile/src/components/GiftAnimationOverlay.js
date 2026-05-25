import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Cinematic gift animation overlay (TikTok-style).
 *
 * Renders:
 *  1) A burst of N particle copies of the gift icon animating across the screen
 *     according to the `animation` field (fall | rise | drive | bounce | sparkle | epic).
 *  2) A large "hero" gift in the center with sender name + reward toast.
 *
 * The whole overlay auto-dismisses after ~3.5s.
 *
 * Designed to work with the built-in Animated API (no Lottie/Reanimated
 * native deps needed) so it works in the current Expo build without rebuilding.
 */
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const HERO_SIZE = 160;
const PARTICLE_SIZE = 54;

const randRange = (a, b) => a + Math.random() * (b - a);

const Particle = ({ icon, animation, accent, index, total }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  const config = useMemo(() => {
    const baseDelay = (index / Math.max(1, total)) * 700 + Math.random() * 350;

    let startX = randRange(SCREEN_W * 0.05, SCREEN_W * 0.95);
    let startY = -PARTICLE_SIZE;
    let endX = startX + randRange(-50, 50);
    let endY = SCREEN_H + PARTICLE_SIZE;
    let duration = 2500 + Math.random() * 1500;
    let rotateAmount = randRange(-360, 360);

    if (animation === "rise") {
      startY = SCREEN_H + PARTICLE_SIZE;
      endY = -PARTICLE_SIZE;
      duration = 2600 + Math.random() * 1400;
    } else if (animation === "drive") {
      startX = -PARTICLE_SIZE - 40;
      endX = SCREEN_W + PARTICLE_SIZE;
      startY = randRange(SCREEN_H * 0.3, SCREEN_H * 0.7);
      endY = startY + randRange(-30, 30);
      duration = 1800 + Math.random() * 800;
      rotateAmount = randRange(-30, 30);
    } else if (animation === "sparkle") {
      // spiral outwards from center
      const angle = randRange(0, Math.PI * 2);
      const radius = randRange(80, SCREEN_W * 0.42);
      startX = SCREEN_W / 2;
      startY = SCREEN_H / 2;
      endX = SCREEN_W / 2 + Math.cos(angle) * radius;
      endY = SCREEN_H / 2 + Math.sin(angle) * radius;
      duration = 1400 + Math.random() * 1000;
    } else if (animation === "bounce") {
      startY = SCREEN_H + PARTICLE_SIZE;
      endY = randRange(SCREEN_H * 0.35, SCREEN_H * 0.7);
      duration = 1600 + Math.random() * 900;
    } else if (animation === "epic") {
      // explosive radial burst
      const angle = randRange(0, Math.PI * 2);
      const radius = randRange(SCREEN_W * 0.3, SCREEN_W * 0.55);
      startX = SCREEN_W / 2;
      startY = SCREEN_H / 2;
      endX = SCREEN_W / 2 + Math.cos(angle) * radius;
      endY = SCREEN_H / 2 + Math.sin(angle) * radius;
      duration = 1600 + Math.random() * 1000;
    }

    return { baseDelay, startX, startY, endX, endY, duration, rotateAmount };
  }, [animation, index, total]);

  useEffect(() => {
    translateX.setValue(config.startX);
    translateY.setValue(config.startY);
    Animated.sequence([
      Animated.delay(config.baseDelay),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: config.endX,
          duration: config.duration,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: config.endY,
          duration: config.duration,
          easing:
            animation === "bounce"
              ? Easing.bounce
              : Easing.bezier(0.45, 0.05, 0.55, 0.95),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: config.duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(config.duration - 800),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [animation, config, opacity, rotate, scale, translateX, translateY]);

  const rotateInterp = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: [`0deg`, `${config.rotateAmount}deg`],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate: rotateInterp },
            { scale },
          ],
        },
      ]}
    >
      <Image source={{ uri: icon }} style={styles.particleImage} />
      {animation === "sparkle" || animation === "epic" ? (
        <View
          style={[
            styles.particleGlow,
            { shadowColor: accent, backgroundColor: `${accent}33` },
          ]}
        />
      ) : null}
    </Animated.View>
  );
};

const GiftAnimationOverlay = ({ gift, onDone }) => {
  const heroScale = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroRotate = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(80)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const totalDuration = 3600;

  useEffect(() => {
    if (!gift) return;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(heroScale, {
          toValue: 1,
          friction: 5,
          tension: 90,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 350,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(heroRotate, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(cardSlide, {
            toValue: 0,
            duration: 450,
            delay: 350,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 400,
            delay: 350,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.delay(totalDuration - 1300),
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished && onDone) onDone();
    });
  }, [
    backdropOpacity,
    cardOpacity,
    cardSlide,
    gift,
    heroOpacity,
    heroRotate,
    heroScale,
    onDone,
  ]);

  if (!gift) return null;

  const icon = gift.gift_icon_url || gift.icon_url;
  const accent = gift.gift_accent_color || gift.accent_color || "#fbbf24";
  const animation = gift.gift_animation || gift.animation || "fall";
  const particleCount = gift.gift_particle_count || gift.particle_count || 14;
  const senderName = gift.sender_name || gift.from_name || "صديقك";
  const giftName = gift.gift_name_ar || gift.name_ar || "هدية";
  const gemsAwarded = gift.gems_awarded || gift.gems_reward || 0;
  const priceSar = gift.price_sar || 0;

  const rotateInterp = heroRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "15deg"],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Soft radial backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
      >
        <LinearGradient
          colors={[`${accent}33`, "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <Particle
          key={i}
          icon={icon}
          animation={animation}
          accent={accent}
          index={i}
          total={particleCount}
        />
      ))}

      {/* Hero gift */}
      <Animated.View
        style={[
          styles.heroWrap,
          {
            opacity: heroOpacity,
            transform: [{ scale: heroScale }, { rotate: rotateInterp }],
          },
        ]}
      >
        <View
          style={[
            styles.heroGlow,
            { backgroundColor: `${accent}33`, shadowColor: accent },
          ]}
        />
        <Image source={{ uri: icon }} style={styles.heroImage} />
      </Animated.View>

      {/* Sender card */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardSlide }],
          },
        ]}
      >
        <LinearGradient
          colors={[`${accent}66`, "rgba(15,23,42,0.92)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardInner}
        >
          <Text style={styles.cardSender} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={styles.cardLine}>أرسل لك</Text>
          <Text style={[styles.cardGift, { color: accent }]} numberOfLines={1}>
            {giftName}
          </Text>
          {priceSar > 0 ? (
            <Text style={styles.cardPrice}>قيمة الهدية: {priceSar} ر.س</Text>
          ) : null}
          {gemsAwarded > 0 ? (
            <View style={styles.cardGemPill}>
              <Text style={styles.cardGemText}>+{gemsAwarded} جوهرة صقر</Text>
            </View>
          ) : null}
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    top: 0,
    left: -PARTICLE_SIZE / 2,
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  particleImage: {
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    resizeMode: "contain",
  },
  particleGlow: {
    position: "absolute",
    width: PARTICLE_SIZE * 1.2,
    height: PARTICLE_SIZE * 1.2,
    borderRadius: PARTICLE_SIZE,
    opacity: 0.5,
    shadowOpacity: 0.8,
    shadowRadius: 20,
    zIndex: -1,
  },
  heroWrap: {
    position: "absolute",
    top: SCREEN_H / 2 - HERO_SIZE / 2 - 60,
    left: SCREEN_W / 2 - HERO_SIZE / 2,
    width: HERO_SIZE,
    height: HERO_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  heroGlow: {
    position: "absolute",
    width: HERO_SIZE * 1.4,
    height: HERO_SIZE * 1.4,
    borderRadius: HERO_SIZE,
    shadowOpacity: 0.9,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    elevation: 30,
  },
  heroImage: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    resizeMode: "contain",
  },
  card: {
    position: "absolute",
    bottom: SCREEN_H * 0.18,
    alignSelf: "center",
    width: SCREEN_W * 0.78,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  cardInner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  cardSender: { color: "#fff", fontSize: 16, fontWeight: "800" },
  cardLine: { color: "rgba(226,232,240,0.85)", fontSize: 13, marginTop: 2 },
  cardGift: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  cardPrice: {
    color: "rgba(226,232,240,0.7)",
    fontSize: 11,
    marginTop: 6,
  },
  cardGemPill: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.18)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.5)",
  },
  cardGemText: { color: "#67e8f9", fontSize: 13, fontWeight: "800" },
});

export default GiftAnimationOverlay;
