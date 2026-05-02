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
import { ICON_ASSETS } from "../constants/uiAssets";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const hasNotch = Platform.OS === "ios" && SCREEN_HEIGHT >= 812;
const NAV_ICONS = {
  home: ICON_ASSETS.home,
  clips: ICON_ASSETS.clips,
  watch: ICON_ASSETS.watch,
  advertiser: ICON_ASSETS.advertise,
  profile: ICON_ASSETS.profile,
};

const BottomNav = ({ currentPage, onNavigate, onAdsPress, onClipsPress }) => {
  const { language } = useLanguage();
  const navItems = [
    {
      id: "home",
      label: language === "ar" ? "الرئيسية" : "Home",
      icon: NAV_ICONS.home,
    },
    {
      id: "advertiser",
      label: language === "ar" ? "أعلن" : "Advertise",
      icon: NAV_ICONS.advertiser,
    },
    {
      id: "profile",
      label: language === "ar" ? "حسابي" : "Profile",
      icon: NAV_ICONS.profile,
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
            source={{ uri: item.icon }}
            style={[
              styles.navIcon,
              { opacity: isActive ? 1 : 0.68 },
              isActive ? styles.navIconActive : null,
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
              <Image source={{ uri: NAV_ICONS.clips }} style={styles.centerIcon} />
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
              <Image source={{ uri: NAV_ICONS.watch }} style={styles.centerIcon} />
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
  navIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  navIconActive: {
    tintColor: "#dbeafe",
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
  centerIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    tintColor: "#fff",
  },
});

export default BottomNav;
