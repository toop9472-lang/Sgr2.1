// طير — Create Listing (seller flow)
import React, { useEffect, useState } from "react";
import { X, Image as ImageIcon, Camera } from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi, SAUDI_CITIES } from "./tairApi";
import { TopBar } from "./TairUI";

const GENDERS = [
  { id: "unknown", label: "غير محدد" },
  { id: "male", label: "ذكر" },
  { id: "female", label: "أنثى" },
  { id: "pair", label: "زوج" },
];
const HEALTH_STATUS = [
  { id: "excellent", label: "ممتازة" },
  { id: "good", label: "جيدة" },
  { id: "needs_care", label: "تحتاج رعاية" },
  { id: "special_needs", label: "احتياجات خاصة" },
];

export default function CreateListingScreen({ user, onBack, onCreated }) {
  const [species, setSpecies] = useState([]);
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
    city: SAUDI_CITIES[0],
    district: "",
    health: { status: "good", vaccinated: false, ring_number: "", notes: "" },
    images: [],
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tairApi.listSpecies().then((s) => {
      setSpecies(s);
      if (s.length && !form.species) {
        setForm((f) => ({ ...f, species: s[0].species_id }));
      }
    });
  }, []);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setHealth = (k, v) =>
    setForm((f) => ({ ...f, health: { ...f.health, [k]: v } }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (form.images.length + files.length > 6) {
      setError("الحد الأقصى 6 صور");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const urls = [];
      for (const f of files) {
        const url = await tairApi.uploadImage(f, user.id || user.user_id);
        urls.push(url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      setError(err.response?.data?.detail || "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const submit = async () => {
    setError("");
    if (!form.title.trim()) return setError("العنوان مطلوب");
    if (!form.description.trim()) return setError("الوصف مطلوب");
    if (!form.species) return setError("اختر نوع الطائر");
    if (!form.price_sar || isNaN(Number(form.price_sar)))
      return setError("السعر مطلوب");
    if (!form.city) return setError("المدينة مطلوبة");

    const payload = {
      ...form,
      price_sar: Number(form.price_sar),
      age_months: form.age_months ? Number(form.age_months) : null,
      cover_image: form.images[0] || null,
    };
    setSaving(true);
    try {
      const created = await tairApi.createListing(payload, user.id || user.user_id);
      onCreated?.(created);
    } catch (err) {
      setError(err.response?.data?.detail || "فشل إنشاء الإعلان");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.screen} data-testid="create-listing-screen">
      <TopBar title="إعلان جديد" onBack={onBack} />

      <div style={S.container}>
        <div style={S.card}>
          <h2 style={S.h2}>الصور</h2>
          <p style={styles.hint}>حد أقصى 6 صور — الأولى ستكون صورة الغلاف</p>
          <div style={styles.imagesGrid}>
            {form.images.map((url, i) => (
              <div key={i} style={styles.imgTile}>
                <img src={url} alt={`img-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={() => removeImage(i)}
                  style={styles.imgRemove}
                  data-testid={`remove-image-${i}`}
                  aria-label="حذف"
                >
                  <X size={12} strokeWidth={3} />
                </button>
                {i === 0 && <div style={styles.coverBadge}>الغلاف</div>}
              </div>
            ))}
            {form.images.length < 6 && (
              <label style={styles.imgAdd} data-testid="add-image-btn">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading ? "…" : (
                  <>
                    <Camera size={22} strokeWidth={1.8} />
                    <span style={{ fontSize: 10, marginTop: 4 }}>إضافة</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>معلومات الطائر</h2>

          <label style={S.label}>العنوان *</label>
          <input
            style={S.input}
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="مثال: كناري ذكر مغني"
            data-testid="input-title"
          />

          <label style={{ ...S.label, marginTop: 12 }}>النوع *</label>
          <select
            style={S.input}
            value={form.species}
            onChange={(e) => setField("species", e.target.value)}
            data-testid="input-species"
          >
            {species.map((s) => (
              <option key={s.species_id} value={s.species_id}>
                {s.name_ar}
              </option>
            ))}
          </select>

          <div style={styles.row2}>
            <div>
              <label style={S.label}>الجنس</label>
              <select
                style={S.input}
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
                data-testid="input-gender"
              >
                {GENDERS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>العمر (شهر)</label>
              <input
                type="number"
                style={S.input}
                value={form.age_months}
                onChange={(e) => setField("age_months", e.target.value)}
                placeholder="6"
                data-testid="input-age"
              />
            </div>
          </div>

          <div style={styles.row2}>
            <div>
              <label style={S.label}>السلالة</label>
              <input
                style={S.input}
                value={form.breed}
                onChange={(e) => setField("breed", e.target.value)}
                placeholder="ألماني"
                data-testid="input-breed"
              />
            </div>
            <div>
              <label style={S.label}>اللون</label>
              <input
                style={S.input}
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                placeholder="أصفر"
                data-testid="input-color"
              />
            </div>
          </div>

          <label style={{ ...S.label, marginTop: 12 }}>الوصف *</label>
          <textarea
            style={{ ...S.input, minHeight: 100, resize: "vertical" }}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="اكتب معلومات مفيدة عن الطائر…"
            data-testid="input-description"
          />
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>الحالة الصحية</h2>
          <label style={S.label}>الحالة</label>
          <select
            style={S.input}
            value={form.health.status}
            onChange={(e) => setHealth("status", e.target.value)}
            data-testid="input-health-status"
          >
            {HEALTH_STATUS.map((h) => (
              <option key={h.id} value={h.id}>{h.label}</option>
            ))}
          </select>

          <label style={{ ...styles.checkboxRow, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={form.health.vaccinated}
              onChange={(e) => setHealth("vaccinated", e.target.checked)}
              data-testid="input-vaccinated"
            />
            <span>محصّن</span>
          </label>

          <label style={{ ...S.label, marginTop: 12 }}>رقم الخاتم</label>
          <input
            style={S.input}
            value={form.health.ring_number}
            onChange={(e) => setHealth("ring_number", e.target.value)}
            placeholder="اختياري"
            data-testid="input-ring"
          />
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>السعر والمكان</h2>
          <label style={S.label}>السعر (ر.س) *</label>
          <input
            type="number"
            style={S.input}
            value={form.price_sar}
            onChange={(e) => setField("price_sar", e.target.value)}
            placeholder="500"
            data-testid="input-price"
          />

          <label style={{ ...styles.checkboxRow, marginTop: 10 }}>
            <input
              type="checkbox"
              checked={form.price_negotiable}
              onChange={(e) => setField("price_negotiable", e.target.checked)}
              data-testid="input-negotiable"
            />
            <span>السعر قابل للتفاوض</span>
          </label>

          <div style={styles.row2}>
            <div>
              <label style={S.label}>المدينة *</label>
              <select
                style={S.input}
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                data-testid="input-city"
              >
                {SAUDI_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>الحي</label>
              <input
                style={S.input}
                value={form.district}
                onChange={(e) => setField("district", e.target.value)}
                placeholder="اختياري"
                data-testid="input-district"
              />
            </div>
          </div>
        </div>

        {error && <div style={S.errorBox} data-testid="create-listing-error">{error}</div>}

        <button
          onClick={submit}
          disabled={saving}
          style={{ ...S.primaryBtn, width: "100%", marginTop: 12, opacity: saving ? 0.7 : 1 }}
          data-testid="submit-listing"
        >
          {saving ? "جاري النشر…" : "انشر الإعلان"}
        </button>
      </div>
    </div>
  );
}

export function TopBarStub() { return null; }

const styles = {
  hint: { fontSize: 12, color: T.textMuted, marginTop: 0, marginBottom: 12, textAlign: "right" },
  imagesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
    gap: 8,
  },
  imgTile: {
    position: "relative",
    aspectRatio: "1/1",
    borderRadius: 10,
    overflow: "hidden",
    background: T.divider,
  },
  imgRemove: {
    position: "absolute",
    top: 4,
    insetInlineEnd: 4,
    background: "rgba(220, 38, 38, 0.92)",
    color: "#fff",
    border: "none",
    width: 22,
    height: 22,
    borderRadius: 11,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
  },
  coverBadge: {
    position: "absolute",
    bottom: 4,
    insetInlineStart: 4,
    background: "rgba(6, 95, 70, 0.9)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 6px",
    borderRadius: 6,
  },
  imgAdd: {
    aspectRatio: "1/1",
    borderRadius: T.radius,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: T.borderStrong,
    background: T.bgAlt,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: T.primary,
    cursor: "pointer",
    fontWeight: 700,
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 12,
  },
  checkboxRow: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: T.text,
    fontWeight: 600,
    cursor: "pointer",
  },
};
