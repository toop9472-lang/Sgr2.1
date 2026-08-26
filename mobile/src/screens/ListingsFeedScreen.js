// طير — Listings Feed (Home tab)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { listingsApi, speciesApi } from "../services/tairApi";

const CITIES = [
  "الكل",
  "الرياض",
  "جدة",
  "مكة",
  "المدينة",
  "الدمام",
  "الأحساء",
  "الطائف",
  "بريدة",
  "تبوك",
  "أبها",
];

const formatPrice = (sar) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(sar) + " ر.س";

function ListingCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress(item)}
      data-testid={`listing-card-${item.listing_id}`}
    >
      <View style={styles.imageWrap}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="images-outline" size={40} color="#94a3b8" />
          </View>
        )}
        {item.price_negotiable ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>قابل للتفاوض</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color="#64748b" />
          <Text style={styles.metaText}>{item.city}</Text>
          {item.district ? (
            <Text style={styles.metaText}> · {item.district}</Text>
          ) : null}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(item.price_sar)}</Text>
          <View style={styles.stats}>
            <Ionicons name="eye-outline" size={13} color="#94a3b8" />
            <Text style={styles.statText}>{item.view_count || 0}</Text>
            <Ionicons
              name="heart-outline"
              size={13}
              color="#94a3b8"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.statText}>{item.favorite_count || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ListingsFeedScreen({ user, onOpenListing, onCreateListing }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const [selectedCity, setSelectedCity] = useState("الكل");
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [q, setQ] = useState("");
  const [species, setSpecies] = useState([]);

  const load = useCallback(
    async (reset = false) => {
      try {
        if (reset) setLoading(true);
        const params = { limit: 30 };
        if (selectedCity && selectedCity !== "الكل") params.city = selectedCity;
        if (selectedSpecies) params.species = selectedSpecies;
        if (q.trim()) params.q = q.trim();
        const res = await listingsApi.feed(params);
        setListings(res.items || []);
        setTotal(res.total || 0);
      } catch (e) {
        console.warn("feed error", e?.message || e);
        setListings([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCity, selectedSpecies, q],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  useEffect(() => {
    speciesApi
      .list()
      .then((r) => setSpecies(r.items || []))
      .catch(() => {});
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const renderItem = ({ item }) => (
    <ListingCard item={item} onPress={onOpenListing} />
  );

  const renderHeader = useMemo(
    () => (
      <View>
        {/* Hero */}
        <LinearGradient
          colors={["#c8fce6", "#a7f3d0", "#7dd3fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>طير 🐦</Text>
              <Text style={styles.heroSubtitle}>
                سوق الطيور والحيوانات الأليفة الموثوق
              </Text>
            </View>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={onCreateListing}
              activeOpacity={0.85}
              data-testid="create-listing-cta"
            >
              <Ionicons name="add-circle" size={20} color="#065f46" />
              <Text style={styles.ctaText}>إعلان جديد</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              value={q}
              onChangeText={setQ}
              placeholder="ابحث عن كناري، كوكتيل، ببغاء..."
              placeholderTextColor="#94a3b8"
              returnKeyType="search"
              onSubmitEditing={() => load(true)}
              data-testid="search-input"
            />
            {q.length > 0 ? (
              <TouchableOpacity onPress={() => setQ("")}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </LinearGradient>

        {/* City filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={{ paddingHorizontal: 14 }}
        >
          {CITIES.map((c) => {
            const active = c === selectedCity;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCity(c)}
                data-testid={`chip-city-${c}`}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Species filter */}
        {species.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.speciesRow}
            contentContainerStyle={{ paddingHorizontal: 14 }}
          >
            <TouchableOpacity
              style={[styles.speciesChip, !selectedSpecies && styles.speciesChipActive]}
              onPress={() => setSelectedSpecies(null)}
            >
              <Text
                style={[
                  styles.speciesChipText,
                  !selectedSpecies && styles.speciesChipTextActive,
                ]}
              >
                جميع الأنواع
              </Text>
            </TouchableOpacity>
            {species.slice(0, 15).map((s) => {
              const active = s.species_id === selectedSpecies;
              return (
                <TouchableOpacity
                  key={s.species_id}
                  style={[styles.speciesChip, active && styles.speciesChipActive]}
                  onPress={() => setSelectedSpecies(s.species_id)}
                  data-testid={`chip-species-${s.species_id}`}
                >
                  <Text
                    style={[
                      styles.speciesChipText,
                      active && styles.speciesChipTextActive,
                    ]}
                  >
                    {s.name_ar}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.resultBar}>
          <Text style={styles.resultCount}>{total} إعلان متاح</Text>
        </View>
      </View>
    ),
    [q, selectedCity, selectedSpecies, species, total, onCreateListing, load],
  );

  const renderEmpty = () =>
    loading ? (
      <View style={styles.emptyBox}>
        <ActivityIndicator color="#10b981" size="large" />
      </View>
    ) : (
      <View style={styles.emptyBox}>
        <Ionicons name="egg-outline" size={64} color="#a7f3d0" />
        <Text style={styles.emptyTitle}>لا توجد إعلانات مطابقة</Text>
        <Text style={styles.emptyText}>
          جرّب تغيير المدينة أو النوع، أو انشر إعلانك الآن
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.listing_id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 10 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  hero: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  heroRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#065f46",
    textAlign: "right",
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#0f766e",
    textAlign: "right",
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaText: {
    color: "#065f46",
    fontWeight: "700",
    fontSize: 13,
  },
  searchWrap: {
    marginTop: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    color: "#0f172a",
    fontSize: 14,
    textAlign: "right",
    padding: 0,
  },

  chipsRow: { paddingVertical: 10, backgroundColor: "#fff" },
  chip: {
    marginHorizontal: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  chipActive: { backgroundColor: "#065f46" },
  chipText: { color: "#475569", fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#fff" },

  speciesRow: {
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  speciesChip: {
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#ecfeff",
    borderWidth: 1,
    borderColor: "#a5f3fc",
  },
  speciesChipActive: { backgroundColor: "#06b6d4", borderColor: "#06b6d4" },
  speciesChipText: { color: "#0e7490", fontWeight: "600", fontSize: 12 },
  speciesChipTextActive: { color: "#fff" },

  resultBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  resultCount: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },

  card: {
    flex: 1,
    margin: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  imageWrap: { position: "relative", aspectRatio: 1 },
  image: { width: "100%", height: "100%", backgroundColor: "#f1f5f9" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  priceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(6, 95, 70, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priceBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  cardBody: { padding: 10 },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "right",
  },
  metaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  metaText: { color: "#64748b", fontSize: 11 },
  priceRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  price: { color: "#065f46", fontSize: 16, fontWeight: "800" },
  stats: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
  },
  statText: { color: "#94a3b8", fontSize: 11, fontWeight: "600" },

  emptyBox: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
