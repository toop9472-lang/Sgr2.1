// طير — Trips List (Carrier network) + Create/Edit
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { tripsApi } from "../services/tairApi";

const CITIES = [
  "الرياض", "جدة", "مكة", "المدينة", "الدمام",
  "الأحساء", "الطائف", "بريدة", "تبوك", "أبها",
];
const VEHICLES = ["سيدان", "SUV", "بيك أب", "شاحنة صغيرة"];

const statusColor = (s) =>
  ({
    scheduled: "#0891b2",
    departed: "#eab308",
    in_transit: "#f59e0b",
    arrived: "#10b981",
    completed: "#064e3b",
    cancelled: "#ef4444",
  }[s] || "#64748b");
const statusLabel = (s) =>
  ({
    scheduled: "مجدولة",
    departed: "انطلقت",
    in_transit: "في الطريق",
    arrived: "وصلت",
    completed: "مكتملة",
    cancelled: "ملغاة",
  }[s] || s);

function TripCard({ trip, onPress }) {
  const dt = trip.depart_at ? new Date(trip.depart_at) : null;
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress(trip)}
      data-testid={`trip-card-${trip.trip_id}`}
    >
      <View style={styles.cardTop}>
        <View style={[styles.statusPill, { backgroundColor: statusColor(trip.status) + "22" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(trip.status) }]} />
          <Text style={[styles.statusText, { color: statusColor(trip.status) }]}>
            {statusLabel(trip.status)}
          </Text>
        </View>
        <View style={styles.cageBadge}>
          <Ionicons name="cube-outline" size={13} color="#10b981" />
          <Text style={styles.cageText}>
            {trip.available_cages}/{trip.total_cages} أقفاص
          </Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.cityBox}>
          <Text style={styles.cityLabel}>من</Text>
          <Text style={styles.cityName}>{trip.from_city}</Text>
        </View>
        <View style={styles.routeArrow}>
          <Ionicons name="arrow-back" size={22} color="#10b981" />
        </View>
        <View style={styles.cityBox}>
          <Text style={styles.cityLabel}>إلى</Text>
          <Text style={styles.cityName}>{trip.to_city}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={13} color="#64748b" />
          <Text style={styles.metaText}>
            {dt ? dt.toLocaleDateString("ar-SA") : "-"}{" "}
            {dt ? dt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : ""}
          </Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="car-outline" size={13} color="#64748b" />
          <Text style={styles.metaText}>{trip.vehicle_type}</Text>
        </View>
        {trip.has_ac ? (
          <View style={styles.metaChip}>
            <Ionicons name="snow-outline" size={13} color="#0891b2" />
            <Text style={[styles.metaText, { color: "#0891b2" }]}>مكيّف</Text>
          </View>
        ) : null}
      </View>

      {trip.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {trip.notes}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function CreateTripModal({ visible, user, onClose, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    from_city: "الرياض",
    to_city: "جدة",
    depart_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    vehicle_type: "سيدان",
    has_ac: true,
    total_cages: "4",
    accepts_sensitive: true,
    notes: "",
    price_hint_sar: "",
  });
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (form.from_city === form.to_city) {
      Alert.alert("تنبيه", "المدينتان يجب أن تكونا مختلفتين");
      return;
    }
    try {
      setSaving(true);
      const userId = user?.user_id || user?.id;
      const created = await tripsApi.create(userId, {
        from_city: form.from_city,
        to_city: form.to_city,
        depart_at: new Date(form.depart_at).toISOString(),
        vehicle_type: form.vehicle_type,
        has_ac: form.has_ac,
        total_cages: Number(form.total_cages) || 4,
        accepts_sensitive: form.accepts_sensitive,
        notes: form.notes.trim() || null,
        price_hint_sar: form.price_hint_sar ? Number(form.price_hint_sar) : null,
      });
      onCreated && onCreated(created);
      onClose();
    } catch (e) {
      Alert.alert("خطأ", e?.message || "تعذّر إنشاء الرحلة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#f8fafc" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LinearGradient colors={["#c8fce6", "#a7f3d0"]} style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={26} color="#065f46" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>رحلة جديدة</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <FormLabel>من *</FormLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.pill, form.from_city === c && styles.pillActive]}
                onPress={() => set("from_city", c)}
              >
                <Text style={[styles.pillText, form.from_city === c && styles.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FormLabel>إلى *</FormLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.pill, form.to_city === c && styles.pillActive]}
                onPress={() => set("to_city", c)}
              >
                <Text style={[styles.pillText, form.to_city === c && styles.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FormLabel>تاريخ ووقت الانطلاق *</FormLabel>
          <TextInput
            style={styles.input}
            value={form.depart_at}
            onChangeText={(v) => set("depart_at", v)}
            placeholder="YYYY-MM-DDTHH:mm"
            placeholderTextColor="#94a3b8"
          />

          <FormLabel>نوع المركبة</FormLabel>
          <View style={{ flexDirection: "row-reverse", gap: 6 }}>
            {VEHICLES.map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.pill, { flex: 1, alignItems: "center" }, form.vehicle_type === v && styles.pillActive]}
                onPress={() => set("vehicle_type", v)}
              >
                <Text style={[styles.pillText, form.vehicle_type === v && styles.pillTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row-reverse", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <FormLabel>عدد الأقفاص</FormLabel>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={form.total_cages}
                onChangeText={(v) => set("total_cages", v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormLabel>سعر إرشادي (ر.س)</FormLabel>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor="#94a3b8"
                value={form.price_hint_sar}
                onChangeText={(v) => set("price_hint_sar", v)}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.checkbox} onPress={() => set("has_ac", !form.has_ac)}>
            <Ionicons name={form.has_ac ? "checkbox" : "square-outline"} size={22} color="#10b981" />
            <Text style={styles.checkLabel}>يوجد تكييف</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => set("accepts_sensitive", !form.accepts_sensitive)}
          >
            <Ionicons
              name={form.accepts_sensitive ? "checkbox" : "square-outline"}
              size={22}
              color="#10b981"
            />
            <Text style={styles.checkLabel}>أقبل الطيور الحساسة</Text>
          </TouchableOpacity>

          <FormLabel>ملاحظات</FormLabel>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            multiline
            placeholder="أي تفاصيل إضافية للمرسلين"
            placeholderTextColor="#94a3b8"
            value={form.notes}
            onChangeText={(v) => set("notes", v)}
          />
        </ScrollView>

        <View style={styles.submitBar}>
          <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitText}>نشر الرحلة</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormLabel({ children }) {
  return <Text style={styles.formLabel}>{children}</Text>;
}

export default function TripsScreen({ user, onOpenTrip }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCity, setFromCity] = useState(null);
  const [toCity, setToCity] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { status: "active", limit: 50 };
      if (fromCity) params.from_city = fromCity;
      if (toCity) params.to_city = toCity;
      const res = await tripsApi.list(params);
      setTrips(res.items || []);
    } catch (e) {
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fromCity, toCity]);

  useEffect(() => {
    load();
  }, [load]);

  const renderHeader = (
    <View>
      <LinearGradient colors={["#c8fce6", "#a7f3d0", "#7dd3fc"]} style={styles.hero}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>الرحلات المتاحة</Text>
            <Text style={styles.heroSubtitle}>وصلها بأمان عبر موصلينا</Text>
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => setCreateOpen(true)}
            data-testid="create-trip-cta"
          >
            <Ionicons name="add-circle" size={20} color="#065f46" />
            <Text style={styles.ctaText}>رحلة جديدة</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <TouchableOpacity
            style={[styles.filterChip, !fromCity && styles.filterChipActive]}
            onPress={() => setFromCity(null)}
          >
            <Text style={[styles.filterText, !fromCity && styles.filterTextActive]}>من: الكل</Text>
          </TouchableOpacity>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={"from-" + c}
              style={[styles.filterChip, fromCity === c && styles.filterChipActive]}
              onPress={() => setFromCity(c)}
            >
              <Text style={[styles.filterText, fromCity === c && styles.filterTextActive]}>من: {c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, marginTop: 6 }}
        >
          <TouchableOpacity
            style={[styles.filterChip, !toCity && styles.filterChipActive]}
            onPress={() => setToCity(null)}
          >
            <Text style={[styles.filterText, !toCity && styles.filterTextActive]}>إلى: الكل</Text>
          </TouchableOpacity>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={"to-" + c}
              style={[styles.filterChip, toCity === c && styles.filterChipActive]}
              onPress={() => setToCity(c)}
            >
              <Text style={[styles.filterText, toCity === c && styles.filterTextActive]}>إلى: {c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(t) => t.trip_id}
        renderItem={({ item }) => <TripCard trip={item} onPress={onOpenTrip} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#10b981" size="large" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={64} color="#a7f3d0" />
              <Text style={styles.emptyTitle}>لا توجد رحلات حالياً</Text>
              <Text style={styles.emptyText}>كن أول موصل! انشر رحلتك واستقبل الطلبات</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#10b981"
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <CreateTripModal
        visible={createOpen}
        user={user}
        onClose={() => setCreateOpen(false)}
        onCreated={() => load()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  hero: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16 },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#065f46", textAlign: "right" },
  heroSubtitle: { fontSize: 13, color: "#0f766e", marginTop: 2, textAlign: "right" },
  ctaButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaText: { color: "#065f46", fontWeight: "700", fontSize: 13 },

  filters: { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 10 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  filterChipActive: { backgroundColor: "#065f46" },
  filterText: { color: "#475569", fontWeight: "600", fontSize: 12 },
  filterTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cageBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cageText: { color: "#065f46", fontSize: 11, fontWeight: "700" },

  routeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  cityBox: { flex: 1, alignItems: "center" },
  cityLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  cityName: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginTop: 2 },
  routeArrow: { paddingHorizontal: 4 },

  metaRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  metaChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  metaText: { color: "#475569", fontSize: 11, fontWeight: "600" },
  notes: { color: "#64748b", fontSize: 12, marginTop: 10, textAlign: "right" },

  empty: { alignItems: "center", padding: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },
  emptyText: { fontSize: 13, color: "#64748b", textAlign: "center" },

  // Create modal
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#065f46" },
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    textAlign: "right",
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    textAlign: "right",
    backgroundColor: "#fff",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  pillActive: { backgroundColor: "#10b981" },
  pillText: { color: "#475569", fontWeight: "600", fontSize: 13 },
  pillTextActive: { color: "#fff" },
  checkbox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  checkLabel: { color: "#334155", fontSize: 13, fontWeight: "600" },
  submitBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  submitBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 16,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
