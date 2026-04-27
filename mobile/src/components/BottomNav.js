// Bottom Navigation Component - Transparent Design Like Web
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useLanguage } from "../i18n/LanguageContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const hasNotch = Platform.OS === "ios" && SCREEN_HEIGHT >= 812;
const NAV_ICONS = {
  home: require("../../assets/nav-icons/home.png"),
  clips: require("../../assets/nav-icons/clips.png"),
  watch: require("../../assets/nav-icons/watch.png"),
  advertiser: require("../../assets/nav-icons/ads.png"),
  profile: require("../../assets/nav-icons/profile.png"),
};

const BottomNav = ({ currentPage, onNavigate, onAdsPress, onClipsPress }) => {
  const { language } = useLanguage();
  const navItems = [
    {
      id: "home",
      label: language === "ar" ? "الرئيسية" : "Home",
      image: NAV_ICONS.home,
    },
    {
      id: "advertiser",
      label: language === "ar" ? "أعلن" : "Advertise",
      image: NAV_ICONS.advertiser,
    },
    {
      id: "profile",
      label: language === "ar" ? "حسابي" : "Profile",
      image: NAV_ICONS.profile,
    },
  ];

  const NavButton = ({ item }) => {
    const isActive = currentPage === item.id;

    return (
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate(item.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.navIconWrapper,
            isActive && styles.navIconWrapperActive,
          ]}
        >
          <Image
            source={item.image}
            style={[
              styles.navImage,
              isActive ? styles.navImageActive : styles.navImageMuted,
            ]}
          />
        </View>
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.navContent}>
          {/* الرئيسية */}
          <NavButton item={navItems[0]} />

          {/* زر المقاطع - في المنتصف */}
          <TouchableOpacity
            onPress={() =>
              onClipsPress ? onClipsPress() : onNavigate("clips")
            }
            activeOpacity={0.8}
            style={styles.centerButton}
          >
            <View style={styles.centerButtonGlow} />
            <LinearGradient
              colors={["#a3e635", "#65a30d"]}
              style={styles.clipsButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image source={NAV_ICONS.clips} style={styles.centerNavImage} />
              <Text style={styles.centerButtonText}>
                {language === "ar" ? "مقاطع" : "Clips"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* زر المشاهدة - في المنتصف */}
          <TouchableOpacity
            onPress={onAdsPress}
            activeOpacity={0.8}
            style={styles.centerButton}
          >
            <View
              style={[
                styles.centerButtonGlow,
                { backgroundColor: "rgba(236,72,153,0.32)" },
              ]}
            />
            <LinearGradient
              colors={["#f43f5e", "#be123c"]}
              style={styles.watchButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image source={NAV_ICONS.watch} style={styles.centerNavImage} />
              <Text style={styles.centerButtonText}>
                {language === "ar" ? "شاهد" : "Watch"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* أعلن */}
          <NavButton item={navItems[1]} />

          {/* حسابي */}
          <NavButton item={navItems[2]} />
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: hasNotch ? 8 : Platform.OS === "ios" ? 2 : 0,
  },
  blurContainer: {
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(10, 10, 15, 0.85)",
  },
  navContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },
  navIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconWrapperActive: {
    backgroundColor: "rgba(96, 165, 250, 0.15)",
  },
  navImage: {
    width: 19,
    height: 19,
  },
  navImageActive: {
    opacity: 1,
  },
  navImageMuted: {
    opacity: 0.65,
  },
  navLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#60a5fa",
    fontWeight: "600",
  },
  centerButton: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButtonGlow: {
    position: "absolute",
    width: 100,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(132,204,22,0.3)",
    top: 0,
    left: 0,
  },
  clipsButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  watchButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  centerButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  centerNavImage: {
    width: 18,
    height: 18,
  },
});

export default BottomNav;
