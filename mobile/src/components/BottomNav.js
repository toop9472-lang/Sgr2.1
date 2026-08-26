// طير — Bottom Navigation (4 tabs)
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HAS_NOTCH = Platform.OS === "ios" && SCREEN_HEIGHT >= 812;

const TABS = [
  { id: "listings", label: "الرئيسية", icon: "home", iconActive: "home" },
  { id: "trips", label: "الرحلات", icon: "car-outline", iconActive: "car" },
  { id: "orders", label: "طلباتي", icon: "cube-outline", iconActive: "cube" },
  { id: "account", label: "حسابي", icon: "person-outline", iconActive: "person" },
];

export default function BottomNav({ currentPage, onNavigate, badges = {} }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const active = currentPage === tab.id;
          const badge = badges[tab.id];
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => onNavigate(tab.id)}
              data-testid={`bottom-nav-${tab.id}`}
            >
              <View
                style={[
                  styles.iconWrap,
                  active && styles.iconWrapActive,
                ]}
              >
                <Ionicons
                  name={active ? tab.iconActive : tab.icon}
                  size={22}
                  color={active ? "#065f46" : "#64748b"}
                />
                {badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badge > 9 ? "9+" : String(badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: HAS_NOTCH ? 22 : 8,
    paddingTop: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 10,
  },
  bar: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  iconWrap: {
    width: 44,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: "#a7f3d0",
  },
  label: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  labelActive: {
    color: "#065f46",
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});
