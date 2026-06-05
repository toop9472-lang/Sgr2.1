// GiftStoreScreen — read-only catalog browser. Users can preview all 12 gifts,
// their prices, and the gem reward the receiver earns. Tapping a gift shows a
// quick info modal with a "اذهب لاختيار مستلم" button that opens the friends list.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getCatalog } from "../services/giftsService";
import { hapticLight } from "../utils/haptics";

const GiftStoreScreen = ({ onBack, onSendToFriend }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCatalog(true);
      setGifts(Array.isArray(data?.gifts) ? data.gifts : []);
    } catch (_) {
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.tile, { borderColor: item.accent_color + "55" }]}
      activeOpacity={0.85}
      onPress={() => { hapticLight(); setPicked(item); }}
    >
      <View style={[styles.glow, { backgroundColor: item.accent_color + "33" }]} />
      <View style={styles.iconWrap}>
        <Image source={{ uri: item.icon_url }} style={styles.icon} />
      </View>
      <Text style={styles.name} numberOfLines={1}>{item.name_ar}</Text>
      <View style={styles.priceRow}>
        <Ionicons name="cash-outline" size={11} color="#fbbf24" />
        <Text style={styles.priceText}>{item.price_sar} ر.س</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} accessibilityLabel="رجوع">
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>متجر الهدايا</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#f472b6" />
        </View>
      ) : (
        <FlatList
          data={gifts}
          keyExtractor={(g) => g.gift_id}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={{ gap: 10, paddingHorizontal: 14 }}
          contentContainerStyle={{ gap: 10, paddingVertical: 6, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail modal */}
      <Modal
        visible={!!picked}
        animationType="fade"
        transparent
        onRequestClose={() => setPicked(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={[picked?.accent_color + "33" || "#0b1020", "#0b1020"]}
              style={StyleSheet.absoluteFillObject}
            />
            {picked ? (
              <>
                <View style={[styles.modalGlow, { backgroundColor: picked.accent_color + "55" }]} />
                <Image source={{ uri: picked.icon_url }} style={styles.modalIcon} />
                <Text style={styles.modalName}>{picked.name_ar}</Text>
                <View style={styles.modalPriceRow}>
                  <View style={styles.modalChip}>
                    <Ionicons name="cash-outline" size={14} color="#fbbf24" />
                    <Text style={[styles.modalChipText, { color: "#fbbf24" }]}>{picked.price_sar} ر.س</Text>
                  </View>
                </View>
                <Text style={styles.modalDesc}>
                  هدية فاخرة مع تأثير حركي فوق الشاشة. عند الإرسال يحصل المستلم على إشعار وأنيميشن سينمائي.
                </Text>
                <TouchableOpacity
                  style={[styles.modalSendBtn, { backgroundColor: picked.accent_color }]}
                  onPress={() => { setPicked(null); onSendToFriend && onSendToFriend(picked); }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="paper-plane" size={15} color="#fff" />
                  <Text style={styles.modalSendText}>اختر مستلم وأرسل</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPicked(null)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>إغلاق</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "rgba(10,4,16,0.65)" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  banner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(244,114,182,0.10)",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.3)",
  },
  bannerText: {
    flex: 1,
    color: "#fbcfe8",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  tile: {
    flex: 1,
    aspectRatio: 0.78,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.7)",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -22,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.9,
  },
  iconWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { width: 72, height: 72, resizeMode: "contain" },
  name: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
    textAlign: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  priceText: { color: "#fbbf24", fontSize: 11, fontWeight: "800" },
  gemsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
  },
  gemsText: { color: "#67e8f9", fontSize: 9, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalGlow: {
    position: "absolute",
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.55,
  },
  modalIcon: { width: 110, height: 110, resizeMode: "contain" },
  modalName: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 10 },
  modalPriceRow: {
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  modalChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalChipText: { fontSize: 12, fontWeight: "800" },
  modalDesc: {
    color: "rgba(226,232,240,0.7)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 18,
  },
  modalSendBtn: {
    marginTop: 18,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  modalSendText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  modalCloseBtn: { marginTop: 12 },
  modalCloseText: { color: "rgba(226,232,240,0.6)", fontSize: 12, fontWeight: "700" },
});

export default GiftStoreScreen;
