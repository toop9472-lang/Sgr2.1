// طير — Create Listing (Seller flow)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { listingsApi, speciesApi } from "../services/tairApi";
import api from "../services/api";

const CITIES = [
  "الرياض", "جدة", "مكة", "المدينة", "الدمام",
  "الأحساء", "الطائف", "بريدة", "تبوك", "أبها",
];
const GENDERS = [
  { id: "male", label: "ذكر" },
  { id: "female", label: "أنثى" },
  { id: "pair", label: "زوج" },
  { id: "unknown", label: "غير محدد" },
];
const HEALTH_STATUSES = [
  { id: "excellent", label: "ممتازة" },
  { id: "good", label: "جيدة" },
  { id: "needs_care", label: "تحتاج رعاية" },
  { id: "special_needs", label: "احتياجات خاصة" },
];

export default function CreateListingScreen({ user, onDone, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [species, setSpecies] = useState([]);
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    title: "",
    species: "",
    breed: "",
    gender: "unknown",
    age_months: "",
    color: "",
    description: "",
    price_sar: "",
    price_negotiable: true,
    city: "الرياض",
    district: "",
    health: {
      status: "good",
      vaccinated: false,
      ring_number: "",
      notes: "",
    },
  });

  useEffect(() => {
    speciesApi
      .list()
      .then((r) => setSpecies(r.items || []))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const setHealth = (k, v) =>
    setForm((prev) => ({ ...prev, health: { ...prev.health, [k]: v } }));

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("الإذن مطلوب", "نحتاج إذن الوصول للصور");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.8,
    });
    if (res.canceled) return;
    const newImgs = res.assets.slice(0, 8 - images.length);
    setImages([...images, ...newImgs]);
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const uploadImages = async () => {
    const urls = [];
    for (const img of images) {
      const fd = new FormData();
      fd.append("file", {
        uri: img.uri,
        name: `listing_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
      try {
        const res = await api.fetch("/api/clips/upload-media", {
          method: "POST",
          body: fd,
          headers: {}, // let FormData set boundary
        });
        if (res?.url) urls.push(res.url);
      } catch (e) {
        console.warn("upload failed", e?.message);
      }
    }
    return urls;
  };

  const validate = () => {
    if (!form.title.trim()) return "أدخل عنوان الإعلان";
    if (!form.species) return "اختر نوع الطائر/الحيوان";
    if (!form.description.trim() || form.description.length < 20)
      return "الوصف يجب أن يكون 20 حرفاً على الأقل";
    if (!form.price_sar || Number(form.price_sar) <= 0)
      return "أدخل سعراً صحيحاً";
    if (images.length < 1) return "أضف صورة واحدة على الأقل";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("تنبيه", err);
      return;
    }
    try {
      setSaving(true);
      const imageUrls = await uploadImages();
      if (imageUrls.length === 0) {
        Alert.alert("خطأ", "تعذّر رفع الصور، حاول مرة أخرى");
        setSaving(false);
        return;
      }

      const userId = user?.user_id || user?.id;
      const payload = {
        title: form.title.trim(),
        category: "birds",
        species: form.species,
        breed: form.breed.trim() || null,
        gender: form.gender,
        age_months: form.age_months ? Number(form.age_months) : null,
        color: form.color.trim() || null,
        description: form.description.trim(),
        price_sar: Number(form.price_sar),
        price_negotiable: form.price_negotiable,
        city: form.city,
        district: form.district.trim() || null,
        images: imageUrls,
        cover_image: imageUrls[0],
        health: {
          status: form.health.status,
          vaccinated: form.health.vaccinated,
          ring_number: form.health.ring_number.trim() || null,
          notes: form.health.notes.trim() || null,
        },
      };

      const created = await listingsApi.create(userId, payload);
      Alert.alert("نجاح ✅", "تم نشر إعلانك بنجاح", [
        { text: "حسناً", onPress: () => onDone && onDone(created) },
      ]);
    } catch (e) {
      Alert.alert("خطأ", e?.message || "حدث خطأ أثناء النشر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <LinearGradient
        colors={["#c8fce6", "#a7f3d0"]}
        style={styles.header}
      >
        <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color="#065f46" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إعلان جديد</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Images */}
        <SectionTitle icon="images" title="الصور *" hint="1-8 صور" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
        >
          <TouchableOpacity
            style={styles.imagePlaceholder}
            onPress={pickImages}
            data-testid="pick-images-btn"
          >
            <Ionicons name="add" size={32} color="#10b981" />
            <Text style={styles.imagePickText}>إضافة صور</Text>
          </TouchableOpacity>
          {images.map((img, i) => (
            <View key={i} style={styles.imageTile}>
              <Image source={{ uri: img.uri }} style={styles.imageThumb} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => removeImage(i)}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Basic */}
        <SectionTitle icon="pricetag" title="المعلومات الأساسية" />

        <Field label="عنوان الإعلان *">
          <TextInput
            style={styles.input}
            placeholder="مثال: زوج كناري مالتي مقاطعة أخضر"
            placeholderTextColor="#94a3b8"
            value={form.title}
            onChangeText={(v) => set("title", v)}
            data-testid="input-title"
          />
        </Field>

        <Field label="النوع *">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {species.map((s) => (
              <TouchableOpacity
                key={s.species_id}
                style={[
                  styles.pill,
                  form.species === s.species_id && styles.pillActive,
                ]}
                onPress={() => set("species", s.species_id)}
                data-testid={`species-${s.species_id}`}
              >
                <Text
                  style={[
                    styles.pillText,
                    form.species === s.species_id && styles.pillTextActive,
                  ]}
                >
                  {s.name_ar}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Field>

        <View style={{ flexDirection: "row-reverse", gap: 8 }}>
          <Field label="السلالة" style={{ flex: 1 }}>
            <TextInput
              style={styles.input}
              placeholder="Malinois"
              placeholderTextColor="#94a3b8"
              value={form.breed}
              onChangeText={(v) => set("breed", v)}
            />
          </Field>
          <Field label="العمر (شهر)" style={{ flex: 1 }}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="8"
              placeholderTextColor="#94a3b8"
              value={form.age_months}
              onChangeText={(v) => set("age_months", v)}
            />
          </Field>
        </View>

        <Field label="الجنس">
          <View style={{ flexDirection: "row-reverse", gap: 6 }}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.pill,
                  { flex: 1, alignItems: "center" },
                  form.gender === g.id && styles.pillActive,
                ]}
                onPress={() => set("gender", g.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    form.gender === g.id && styles.pillTextActive,
                  ]}
                >
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="اللون">
          <TextInput
            style={styles.input}
            placeholder="أصفر ذهبي مع لون أبيض"
            placeholderTextColor="#94a3b8"
            value={form.color}
            onChangeText={(v) => set("color", v)}
          />
        </Field>

        <Field label="الوصف التفصيلي *" hint="20 حرف على الأقل">
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]}
            placeholder="اذكر تفاصيل مثل العادات، النظام الغذائي، سبب البيع..."
            placeholderTextColor="#94a3b8"
            value={form.description}
            onChangeText={(v) => set("description", v)}
            multiline
            data-testid="input-description"
          />
        </Field>

        {/* Health */}
        <SectionTitle icon="medkit" title="الحالة الصحية *" />
        <Field label="الحالة العامة">
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
            {HEALTH_STATUSES.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={[
                  styles.pill,
                  form.health.status === h.id && styles.pillActive,
                ]}
                onPress={() => setHealth("status", h.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    form.health.status === h.id && styles.pillTextActive,
                  ]}
                >
                  {h.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="رقم الخاتم (اختياري)">
          <TextInput
            style={styles.input}
            placeholder="SA-2026-1234"
            placeholderTextColor="#94a3b8"
            value={form.health.ring_number}
            onChangeText={(v) => setHealth("ring_number", v)}
          />
        </Field>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setHealth("vaccinated", !form.health.vaccinated)}
        >
          <Ionicons
            name={form.health.vaccinated ? "checkbox" : "square-outline"}
            size={22}
            color="#10b981"
          />
          <Text style={styles.checkboxLabel}>محصّن ضد الأمراض الشائعة</Text>
        </TouchableOpacity>

        <Field label="ملاحظات صحية">
          <TextInput
            style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]}
            placeholder="أي حالة أو ملاحظة يجب أن يعرفها المشتري"
            placeholderTextColor="#94a3b8"
            value={form.health.notes}
            onChangeText={(v) => setHealth("notes", v)}
            multiline
          />
        </Field>

        {/* Price + Location */}
        <SectionTitle icon="cash" title="السعر والموقع" />

        <View style={{ flexDirection: "row-reverse", gap: 8 }}>
          <Field label="السعر (ر.س) *" style={{ flex: 1 }}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="350"
              placeholderTextColor="#94a3b8"
              value={form.price_sar}
              onChangeText={(v) => set("price_sar", v)}
              data-testid="input-price"
            />
          </Field>
        </View>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => set("price_negotiable", !form.price_negotiable)}
        >
          <Ionicons
            name={form.price_negotiable ? "checkbox" : "square-outline"}
            size={22}
            color="#10b981"
          />
          <Text style={styles.checkboxLabel}>السعر قابل للتفاوض</Text>
        </TouchableOpacity>

        <Field label="المدينة *">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.pill,
                  form.city === c && styles.pillActive,
                ]}
                onPress={() => set("city", c)}
              >
                <Text
                  style={[
                    styles.pillText,
                    form.city === c && styles.pillTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Field>

        <Field label="الحي (اختياري)">
          <TextInput
            style={styles.input}
            placeholder="حي النرجس"
            placeholderTextColor="#94a3b8"
            value={form.district}
            onChangeText={(v) => set("district", v)}
          />
        </Field>
      </ScrollView>

      {/* Submit bar */}
      <View style={styles.submitBar}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={submit}
          disabled={saving}
          data-testid="submit-listing-btn"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitText}>نشر الإعلان</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({ icon, title, hint }) {
  return (
    <View style={styles.section}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
        <Ionicons name={icon} size={16} color="#10b981" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

function Field({ label, hint, children, style }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#065f46",
  },

  section: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionHint: {
    fontSize: 11,
    color: "#94a3b8",
  },
  labelRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    textAlign: "right",
  },
  hint: { fontSize: 10, color: "#94a3b8" },

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

  imagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#a7f3d0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
  },
  imagePickText: { color: "#10b981", fontSize: 11, marginTop: 4, fontWeight: "600" },
  imageTile: { width: 96, height: 96, position: "relative" },
  imageThumb: { width: "100%", height: "100%", borderRadius: 14 },
  removeImage: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },

  checkbox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  checkboxLabel: { color: "#334155", fontSize: 13, fontWeight: "600" },

  submitBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
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
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
