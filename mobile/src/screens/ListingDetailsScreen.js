// طير — Listing Details
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { listingsApi, tairReportsApi } from "../services/tairApi";

const { width } = Dimensions.get("window");

const genderLabel = (g) =>
  ({ male: "ذكر", female: "أنثى", pair: "زوج", unknown: "غير محدد" }[g] || g);
const healthLabel = (s) =>
  ({
    excellent: "ممتازة",
    good: "جيدة",
    needs_care: "تحتاج رعاية",
    special_needs: "احتياجات خاصة",
  }[s] || s);

export default function ListingDetailsScreen({
  user,
  listingId,
  onBack,
  onContactSeller,
  onOrder,
}) {
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    const viewerId = user?.user_id || user?.id;
    listingsApi
      .get(listingId, viewerId)
      .then((doc) => {
        setListing(doc);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [listingId, user]);

  const toggleFav = async () => {
    try {
      const res = await listingsApi.toggleFavorite(
        listingId,
        user?.user_id || user?.id,
      );
      setFavorited(res.favorited);
    } catch (e) {
      Alert.alert("خطأ", "تعذّر تحديث المفضلة");
    }
  };

  const shareListing = async () => {
    if (!listing) return;
    await Share.share({
      message: `${listing.title} — ${listing.price_sar} ر.س\nطير · ${listing.city}`,
    });
  };

  const reportListing = () => {
    Alert.alert(
      "الإبلاغ عن الإعلان",
      "اختر سبب الإبلاغ:",
      [
        { text: "احتيال", onPress: () => submitReport("scam") },
        { text: "إعلان مزيّف", onPress: () => submitReport("fake_listing") },
        { text: "نوع محظور", onPress: () => submitReport("prohibited_species") },
        { text: "إساءة", onPress: () => submitReport("abuse") },
        { text: "إلغاء", style: "cancel" },
      ],
    );
  };

  const submitReport = async (reason) => {
    try {
      await tairReportsApi.create(user?.user_id || user?.id, {
        target_type: "listing",
        target_id: listingId,
        reason,
      });
      Alert.alert("شكراً 🙏", "تم استلام البلاغ وسيراجعه فريقنا");
    } catch (e) {
      Alert.alert("خطأ", "تعذّر إرسال البلاغ");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#10b981" size="large" />
      </View>
    );
  }
  if (!listing) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>الإعلان غير موجود</Text>
        <TouchableOpacity onPress={onBack} style={styles.linkBtn}>
          <Text style={styles.linkText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = (user?.user_id || user?.id) === listing.seller_id;
  const images = listing.images?.length ? listing.images : [listing.cover_image].filter(Boolean);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image gallery */}
        <View style={styles.gallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              setImgIdx(i);
            }}
          >
            {images.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{ width, height: width, backgroundColor: "#f1f5f9" }}
              />
            ))}
          </ScrollView>
          {/* Dots */}
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === imgIdx && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}

          {/* Top actions */}
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
              <Ionicons name="arrow-forward" size={22} color="#0f172a" />
            </TouchableOpacity>
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              <TouchableOpacity style={styles.iconBtn} onPress={shareListing}>
                <Ionicons name="share-social-outline" size={20} color="#0f172a" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={toggleFav}>
                <Ionicons
                  name={favorited ? "heart" : "heart-outline"}
                  size={20}
                  color={favorited ? "#ef4444" : "#0f172a"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Price */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{listing.price_sar} ر.س</Text>
              {listing.price_negotiable ? (
                <Text style={styles.negotiable}>قابل للتفاوض</Text>
              ) : null}
            </View>
            <View style={styles.viewsBadge}>
              <Ionicons name="eye-outline" size={13} color="#64748b" />
              <Text style={styles.viewsText}>{listing.view_count || 0} مشاهدة</Text>
            </View>
          </View>

          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#10b981" />
            <Text style={styles.locationText}>
              {listing.city}
              {listing.district ? ` · ${listing.district}` : ""}
            </Text>
          </View>

          {/* Spec cards */}
          <View style={styles.specGrid}>
            <SpecCard icon="male-female" label="الجنس" value={genderLabel(listing.gender)} />
            {listing.age_months ? (
              <SpecCard icon="calendar" label="العمر" value={`${listing.age_months} شهر`} />
            ) : null}
            {listing.breed ? (
              <SpecCard icon="paw" label="السلالة" value={listing.breed} />
            ) : null}
            {listing.color ? (
              <SpecCard icon="color-palette" label="اللون" value={listing.color} />
            ) : null}
          </View>

          {/* Description */}
          <Text style={styles.h3}>الوصف</Text>
          <Text style={styles.desc}>{listing.description}</Text>

          {/* Health */}
          <Text style={styles.h3}>الحالة الصحية</Text>
          <View style={styles.healthBox}>
            <Row
              icon="pulse"
              label="الحالة العامة"
              value={healthLabel(listing.health?.status)}
            />
            <Row
              icon="shield-checkmark"
              label="محصّن"
              value={listing.health?.vaccinated ? "نعم" : "لا"}
              color={listing.health?.vaccinated ? "#10b981" : "#94a3b8"}
            />
            {listing.health?.ring_number ? (
              <Row icon="pricetag" label="رقم الخاتم" value={listing.health.ring_number} />
            ) : null}
            {listing.health?.notes ? (
              <Row icon="document-text" label="ملاحظات" value={listing.health.notes} />
            ) : null}
          </View>

          {/* Report button */}
          <TouchableOpacity style={styles.reportBtn} onPress={reportListing}>
            <Ionicons name="flag-outline" size={16} color="#ef4444" />
            <Text style={styles.reportText}>الإبلاغ عن هذا الإعلان</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      {!isOwner ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => onContactSeller && onContactSeller(listing.seller_id)}
            data-testid="contact-seller-btn"
          >
            <Ionicons name="chatbubble-outline" size={18} color="#065f46" />
            <Text style={styles.secondaryText}>تواصل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => onOrder && onOrder(listing)}
            data-testid="order-btn"
          >
            <LinearGradient
              colors={["#10b981", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGrad}
            >
              <Ionicons name="cube" size={18} color="#fff" />
              <Text style={styles.primaryText}>اطلب مع موصل</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomBar}>
          <View style={{ flex: 1, alignItems: "center", paddingVertical: 14 }}>
            <Text style={{ color: "#64748b", fontSize: 13 }}>
              هذا إعلانك — عدّله من "حسابي"
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function SpecCard({ icon, label, value }) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={18} color="#10b981" />
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}
function Row({ icon, label, value, color }) {
  return (
    <View style={styles.hrow}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
        <Ionicons name={icon} size={16} color={color || "#64748b"} />
        <Text style={styles.hlabel}>{label}</Text>
      </View>
      <Text style={[styles.hvalue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyText: { color: "#64748b", fontSize: 15 },
  linkBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  linkText: { color: "#10b981", fontWeight: "700" },

  gallery: { position: "relative", backgroundColor: "#f1f5f9" },
  topActions: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  dotActive: { backgroundColor: "#fff", width: 18 },

  body: { padding: 16 },
  priceRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontSize: 26, fontWeight: "800", color: "#065f46" },
  negotiable: { color: "#0891b2", fontSize: 12, fontWeight: "700" },
  viewsBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  viewsText: { color: "#64748b", fontSize: 12 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "right",
    marginTop: 10,
  },
  locationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  locationText: { color: "#065f46", fontSize: 13, fontWeight: "600" },

  specGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  spec: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#ecfdf5",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  specLabel: { color: "#065f46", fontSize: 11, fontWeight: "600" },
  specValue: { color: "#064e3b", fontSize: 14, fontWeight: "700" },

  h3: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "right",
  },
  desc: { color: "#475569", fontSize: 14, lineHeight: 22, textAlign: "right" },

  healthBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  hrow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hlabel: { color: "#64748b", fontSize: 13 },
  hvalue: { color: "#0f172a", fontSize: 13, fontWeight: "700" },

  reportBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    marginTop: 20,
  },
  reportText: { color: "#ef4444", fontSize: 12, fontWeight: "600" },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    padding: 12,
    paddingBottom: 26,
    flexDirection: "row-reverse",
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#10b981",
  },
  secondaryText: { color: "#065f46", fontWeight: "700", fontSize: 14 },
  primaryBtn: { flex: 1.5, borderRadius: 14, overflow: "hidden" },
  primaryGrad: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
