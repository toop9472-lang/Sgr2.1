import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getCatalog, sendGift } from "../services/giftsService";
import {
  isIAPAvailable,
  purchaseGiftProduct,
  finishPurchase,
} from "../services/appleIapService";
import { hapticLight, hapticMedium } from "../utils/haptics";

/**
 * Bottom-sheet picker that lists the gift catalog (3D images, not emojis),
 * lets the user pick one, and triggers the send flow.
 *
 * NOTE: Apple In-App Purchase wiring is Phase 2. For now we send the
 * request directly with `platform: "sandbox"` so the receiver still gets
 * the animation + gems. When real IAP is hooked up, the parent should
 * call `sendGift` AFTER the IAP transaction succeeds and pass the
 * transactionId / receipt.
 */
const TIERS = [
  { id: "all", label: "الكل" },
  { id: "low", label: "≤25 ر.س", max: 25 },
  { id: "mid", label: "≤100 ر.س", max: 100 },
  { id: "high", label: "+100 ر.س", min: 100 },
];

const GiftPickerModal = ({
  visible,
  user,
  receiver,        // { user_id, name, avatar }
  contextType = "profile",
  contextId,
  onClose,
  onSent,          // (giftTx) => void  — parent can play the animation locally
}) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sending, setSending] = useState(false);

  const senderId = user?.id || user?.user_id;

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const data = await getCatalog();
      if (alive) {
        setGifts(Array.isArray(data?.gifts) ? data.gifts : []);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible]);

  const filtered = useMemo(() => {
    const f = TIERS.find((t) => t.id === filter);
    if (!f || f.id === "all") return gifts;
    return gifts.filter((g) => {
      if (f.max && g.price_sar <= f.max) return true;
      if (f.min && g.price_sar > f.min) return true;
      return false;
    });
  }, [gifts, filter]);

  const selected = useMemo(
    () => filtered.find((g) => g.gift_id === selectedId) || null,
    [filtered, selectedId],
  );

  const doSend = useCallback(async () => {
    if (!selected || sending) return;
    if (!senderId) {
      Alert.alert("تسجيل الدخول مطلوب", "يجب تسجيل الدخول لإرسال هدية.");
      return;
    }
    if (!receiver?.user_id) {
      Alert.alert("خطأ", "لم يتم تحديد المستلم.");
      return;
    }
    if (receiver.user_id === senderId) {
      Alert.alert("غير ممكن", "لا يمكنك إهداء نفسك.");
      return;
    }
    hapticMedium();
    setSending(true);

    // ── iOS production flow: real Apple IAP via StoreKit 2 ────────────────
    if (Platform.OS === "ios" && isIAPAvailable()) {
      const productId = selected.ios_product_id;
      let purchaseResult = null;
      try {
        purchaseResult = await purchaseGiftProduct(productId);
      } catch (e) {
        setSending(false);
        if (!e?.userCancelled) {
          Alert.alert("تعذر الشراء", String(e?.message || e));
        }
        return;
      }

      if (!purchaseResult?.jws) {
        setSending(false);
        Alert.alert("خطأ", "لم نستلم إيصال الشراء من Apple. حاول مرة أخرى.");
        return;
      }

      try {
        const res = await sendGift({
          senderId,
          receiverId: receiver.user_id,
          giftId: selected.gift_id,
          contextType,
          contextId,
          platform: "ios",
          transactionId: purchaseResult.transactionId,
          receipt: purchaseResult.jws,
        });
        // Always finish the StoreKit transaction once the gems are credited
        await finishPurchase(purchaseResult.purchase);
        if (onSent) {
          onSent({
            ...res,
            gift: { ...selected, ...(res?.gift || {}) },
            receiver,
          });
        }
        onClose && onClose();
      } catch (e) {
        Alert.alert(
          "تعذر إيصال الهدية",
          `${e?.message || e}\n\nسيتم استرداد المبلغ تلقائياً من Apple إذا لم يُستهلك الشراء.`,
        );
      } finally {
        setSending(false);
      }
      return;
    }

    // ── Android / Expo Go / dev: backend-only sandbox path ────────────────
    try {
      const res = await sendGift({
        senderId,
        receiverId: receiver.user_id,
        giftId: selected.gift_id,
        contextType,
        contextId,
        platform: Platform.OS === "android" ? "android" : "sandbox",
      });
      if (onSent)
        onSent({
          ...res,
          gift: { ...selected, ...(res?.gift || {}) },
          receiver,
        });
      onClose && onClose();
    } catch (e) {
      Alert.alert("تعذر الإرسال", String(e?.message || e));
    } finally {
      setSending(false);
    }
  }, [contextId, contextType, onClose, onSent, receiver, selected, sending, senderId]);

  const renderItem = useCallback(
    ({ item }) => {
      const isActive = item.gift_id === selectedId;
      return (
        <TouchableOpacity
          style={[styles.tile, isActive && { borderColor: item.accent_color, borderWidth: 2 }]}
          activeOpacity={0.85}
          onPress={() => {
            hapticLight();
            setSelectedId(item.gift_id);
          }}
        >
          <View style={[styles.tileGlow, { backgroundColor: `${item.accent_color}22` }]} />
          <Image source={{ uri: item.icon_url }} style={styles.tileImage} />
          <Text style={styles.tileName} numberOfLines={1}>
            {item.name_ar}
          </Text>
          <View style={styles.tilePriceRow}>
            <Ionicons name="cash-outline" size={11} color="#fbbf24" />
            <Text style={styles.tilePrice}>{item.price_sar} ر.س</Text>
          </View>
          <View style={styles.tileGemsRow}>
            <Ionicons name="diamond-outline" size={10} color="#22d3ee" />
            <Text style={styles.tileGems}>+{item.gems_reward}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedId],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LinearGradient
            colors={["#0b1020", "#0e172d", "#1e1b4b"]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.title}>أرسل هدية</Text>
              {receiver?.name ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  إلى {receiver.name}
                </Text>
              ) : null}
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Tier tabs */}
          <View style={styles.tabs}>
            {TIERS.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tab, filter === t.id && styles.tabActive]}
                onPress={() => {
                  hapticLight();
                  setFilter(t.id);
                }}
              >
                <Text
                  style={[styles.tabText, filter === t.id && styles.tabTextActive]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Grid */}
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#60a5fa" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.gift_id}
              renderItem={renderItem}
              numColumns={3}
              columnWrapperStyle={{ gap: 8, paddingHorizontal: 10 }}
              contentContainerStyle={{ gap: 10, paddingVertical: 10, paddingBottom: 160 }}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Footer / Send Button */}
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              {selected ? (
                <>
                  <Image source={{ uri: selected.icon_url }} style={styles.footerIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.footerName}>{selected.name_ar}</Text>
                    <Text style={styles.footerHint}>
                      المتلقي يكسب {selected.gems_reward} جوهرة (20% من قيمة الهدية)
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.footerHint}>اختر هدية لإرسالها</Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!selected || sending) && styles.sendBtnDisabled,
                selected && { backgroundColor: selected.accent_color },
              ]}
              disabled={!selected || sending}
              onPress={doSend}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color="#fff" />
                  <Text style={styles.sendBtnText}>
                    {selected ? `إرسال • ${selected.price_sar} ر.س` : "إرسال"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "82%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "800" },
  subtitle: { color: "rgba(226,232,240,0.7)", fontSize: 11, marginTop: 2 },
  tabs: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tabActive: {
    backgroundColor: "rgba(96,165,250,0.18)",
    borderColor: "rgba(96,165,250,0.45)",
  },
  tabText: { color: "rgba(226,232,240,0.65)", fontSize: 11, fontWeight: "700" },
  tabTextActive: { color: "#bfdbfe" },
  tile: {
    flex: 1,
    aspectRatio: 0.78,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 8,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  tileGlow: {
    position: "absolute",
    top: -22,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.9,
  },
  tileImage: {
    width: 64,
    height: 64,
    marginTop: 6,
    resizeMode: "contain",
  },
  tileName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  tilePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  tilePrice: { color: "#fbbf24", fontSize: 11, fontWeight: "800" },
  tileGemsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
  },
  tileGems: { color: "#67e8f9", fontSize: 9, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: "rgba(5, 8, 18, 0.94)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerIcon: { width: 38, height: 38, resizeMode: "contain" },
  footerName: { color: "#fff", fontSize: 13, fontWeight: "800" },
  footerHint: {
    color: "rgba(226,232,240,0.65)",
    fontSize: 11,
    marginTop: 2,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#22c55e",
    minWidth: 130,
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});

export default GiftPickerModal;
