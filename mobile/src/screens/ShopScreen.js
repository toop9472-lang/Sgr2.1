import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const { width } = Dimensions.get('window');

const SHOP_CATEGORIES = [
  { id: 'all', name: 'الكل', icon: 'apps' },
  { id: 'profile_frames', name: 'إطارات الملف', icon: 'person-circle' },
  { id: 'chat_frames', name: 'إطارات الدردشة', icon: 'chatbubbles' },
  { id: 'avatars', name: 'الأفاتارات', icon: 'image' },
  { id: 'themes', name: 'الثيمات', icon: 'color-palette' },
  { id: 'bundles', name: 'باقات خاصة', icon: 'sparkles' },
];

const SHOP_ITEMS = [
  {
    id: 'profile_frame_royal_gold',
    name: 'إطار ملف ملكي ذهبي',
    description: 'إطار احترافي ذهبي لصورة الملف الشخصي.',
    category: 'profile_frames',
    slot: 'profile_frame',
    price: 95,
    rarity: 'rare',
    icon: 'shield-checkmark',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/81b25ff7dff1c22531ebee6eb6d1b1c78ed8dbcf4fd47ded3f3e8b36b7e331c5.png',
    colors: ['#fbbf24', '#d97706'],
  },
  {
    id: 'profile_frame_neon_pulse',
    name: 'إطار ملف نيون نابض',
    description: 'إطار متوهج عالي الوضوح لواجهة حديثة.',
    category: 'profile_frames',
    slot: 'profile_frame',
    price: 140,
    rarity: 'epic',
    icon: 'flash',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/b5329ed8b521321c18a1a23f7dfacb283e436fa40a3601f5f0a053e9f07f461b.png',
    colors: ['#ec4899', '#8b5cf6'],
  },
  {
    id: 'chat_frame_sapphire_wave',
    name: 'إطار دردشة ياقوتي',
    description: 'إطار رسائل فاخر للدردشة العامة والخاصة.',
    category: 'chat_frames',
    slot: 'chat_frame',
    price: 115,
    rarity: 'rare',
    icon: 'chatbubbles',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/023917c49fab8b87593072b51baa9584ecaec8bddecc94d124c69166ba378dad.png',
    colors: ['#0ea5e9', '#1d4ed8'],
  },
  {
    id: 'chat_frame_inferno',
    name: 'إطار دردشة لهب',
    description: 'إطار متحرك بطابع ناري قوي للمحادثات.',
    category: 'chat_frames',
    slot: 'chat_frame',
    price: 165,
    rarity: 'epic',
    icon: 'flame',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/4dc85c2c6db823cb599e231591fae681ea6a3f675e8193fc0460d56837dc4c47.png',
    colors: ['#ef4444', '#b91c1c'],
  },
  {
    id: 'avatar_falcon_elite',
    name: 'أفاتار صقر النخبة',
    description: 'صورة رمزية فاخرة بدقة عالية.',
    category: 'avatars',
    slot: 'avatar',
    price: 170,
    rarity: 'epic',
    icon: 'person-circle',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/33a946656c353bd7e90889bb7c01499898ff0a23da35e2e6bcd661d595319a4b.png',
    colors: ['#6366f1', '#7c3aed'],
  },
  {
    id: 'theme_aurora_pro',
    name: 'ثيم أورورا برو',
    description: 'مظهر احترافي بألوان فخمة ومتدرجة.',
    category: 'themes',
    slot: 'theme',
    price: 145,
    rarity: 'rare',
    icon: 'color-palette',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/86abd9d66ea83500fffe680b9db5618403214798c4150d5508f861cbeece635e.png',
    colors: ['#14b8a6', '#2563eb'],
  },
  {
    id: 'bundle_creator_studio',
    name: 'باقة صانع المحتوى',
    description: 'إطار ملف + إطار دردشة + أفاتار حصري.',
    category: 'bundles',
    slot: null,
    price: 320,
    rarity: 'legendary',
    icon: 'sparkles',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/f3510c77236365fa4fa98a435bc3fe90061eeff371b68553e5ab0802c561dd42.png',
    colors: ['#a855f7', '#db2777'],
  },
];

const DIAMOND_PACKAGES = [
  { id: 'starter', name: 'حزمة البداية', diamonds: 100, bonus: 0, price: 3, image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/8d0264089edcfd06522002458fa06c39546c26f3c63eb9ee166111a86c4a1f70.png' },
  { id: 'silver', name: 'الحزمة الفضية', diamonds: 250, bonus: 25, price: 7, image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/2331b4dba6a7794ca82e307739d695d26c4b52262ad971bb241272053261e7d0.png' },
  { id: 'gold', name: 'الحزمة الذهبية', diamonds: 500, bonus: 75, price: 12, image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/f3510c77236365fa4fa98a435bc3fe90061eeff371b68553e5ab0802c561dd42.png' },
  { id: 'platinum', name: 'الحزمة البلاتينية', diamonds: 1000, bonus: 200, price: 19, image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/a50037c315fcbd1d811fced1e2e9b7183b7d8255812d7a6faf8d1d451883de1c.png' },
];

const DIAMOND_PACK_META = {
  starter: { badge: 'الدخول السريع', badgeColor: '#64748b' },
  silver: { badge: 'شائع', badgeColor: '#0ea5e9' },
  gold: { badge: 'الأكثر مبيعاً', badgeColor: '#f59e0b' },
  platinum: { badge: 'أفضل قيمة', badgeColor: '#22c55e' },
};

const RARITY = {
  common: { label: 'عادي', color: '#64748b' },
  rare: { label: 'نادر', color: '#3b82f6' },
  epic: { label: 'ملحمي', color: '#a855f7' },
  legendary: { label: 'أسطوري', color: '#f59e0b' },
};

const normalizeBundle = (bundle) => ({
  ...bundle,
  price: Number(bundle?.price_diamonds ?? bundle?.price ?? 0) || 0,
});

const ShopScreen = ({ user, userDiamonds = 0, onClose, onUpdateDiamonds, onPurchaseItem }) => {
  const userId = user?.id || user?.user_id || null;
  const isGuest = !userId || user?.isGuest || String(userId).startsWith('guest');
  const cacheKey = `feature_shop_state_${userId || 'guest'}`;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bundles, setBundles] = useState(SHOP_ITEMS);
  const [diamondPackages, setDiamondPackages] = useState(DIAMOND_PACKAGES);
  const [ownedItems, setOwnedItems] = useState([]);
  const [equippedSlots, setEquippedSlots] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDiamondShop, setShowDiamondShop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const filteredItems = useMemo(() => (
    selectedCategory === 'all'
      ? bundles
      : bundles.filter((item) => item.category === selectedCategory)
  ), [bundles, selectedCategory]);

  const persistLocalState = useCallback(async (owned, active) => {
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ owned, active }));
    } catch (_) {}
  }, [cacheKey]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [bundlesRes, packsRes] = await Promise.all([
        api.getFeatureBundles().catch(() => null),
        api.getDiamondPackages().catch(() => null),
      ]);

      if (bundlesRes?.ok) {
        const data = await bundlesRes.json();
        const serverBundles = Array.isArray(data?.bundles) ? data.bundles.map(normalizeBundle) : [];
        if (serverBundles.length > 0) {
          setBundles(serverBundles);
        }
      }

      if (packsRes?.ok) {
        const data = await packsRes.json();
        if (Array.isArray(data?.packages) && data.packages.length > 0) {
          setDiamondPackages(data.packages);
        }
      }

      if (!isGuest && userId) {
        const myRes = await api.getMyFeatureBundles(userId);
        if (myRes.ok) {
          const myData = await myRes.json();
          const owned = myData?.owned_bundle_ids || [];
          const active = myData?.active_feature_slots || {};
          setOwnedItems(owned);
          setEquippedSlots(active);
          await persistLocalState(owned, active);
        }
      } else {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setOwnedItems(parsed?.owned || []);
          setEquippedSlots(parsed?.active || {});
        }
      }
    } catch (e) {
      console.log('Shop load error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, isGuest, persistLocalState, userId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const emitAppliedItem = useCallback((item, action) => {
    if (!onPurchaseItem || !item) return;
    const slot = item.slot;
    let mappedType = null;
    if (slot === 'profile_frame') mappedType = 'frame';
    if (slot === 'chat_frame') mappedType = 'chat_frame';
    if (slot === 'avatar') mappedType = 'avatar';
    if (slot === 'theme') mappedType = 'theme';
    if (!mappedType) return;
    onPurchaseItem({ ...item, type: mappedType, action });
  }, [onPurchaseItem]);

  const handleEquip = useCallback(async (item) => {
    if (!item?.slot) return;
    if (!ownedItems.includes(item.id)) return;
    try {
      if (!isGuest && userId) {
        const res = await api.equipFeatureBundle(userId, item.id);
        if (res.ok) {
          const data = await res.json();
          const active = data?.active_feature_slots || {};
          setEquippedSlots(active);
          await persistLocalState(ownedItems, active);
        }
      } else {
        const next = { ...equippedSlots, [item.slot]: item.id };
        setEquippedSlots(next);
        await persistLocalState(ownedItems, next);
      }
      emitAppliedItem(item, 'equip');
      Alert.alert('تم التفعيل', `تم تفعيل "${item.name}" بنجاح.`);
    } catch (_) {
      Alert.alert('تعذر التفعيل', 'حدث خطأ أثناء تفعيل العنصر.');
    }
  }, [emitAppliedItem, equippedSlots, isGuest, ownedItems, persistLocalState, userId]);

  const confirmPurchase = useCallback(async () => {
    if (!selectedItem || processing) return;
    if (Platform.OS === 'ios') {
      Alert.alert(
        'غير متاح حالياً على iOS',
        'شراء المميزات على iOS متوقف مؤقتاً لحين اكتمال ربط Apple In-App Purchase.',
      );
      return;
    }
    if (isGuest || !userId) {
      Alert.alert('تسجيل مطلوب', 'يرجى تسجيل الدخول لشراء المميزات بشكل فعلي.');
      return;
    }
    if ((userDiamonds || 0) < selectedItem.price) {
      Alert.alert('رصيد غير كافٍ', 'لا يوجد ألماس كافٍ لإتمام الشراء.');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.purchaseFeatureBundle(userId, selectedItem.id);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data?.detail;
        const message = typeof detail === 'string'
          ? detail
          : (detail?.error === 'insufficient_diamonds'
            ? `الرصيد غير كافٍ. المطلوب ${detail.required} والمتاح ${detail.current}`
            : 'تعذر إتمام الشراء حالياً.');
        Alert.alert('فشل الشراء', message);
        return;
      }

      const owned = data?.owned_bundle_ids || ownedItems;
      const active = data?.active_feature_slots || equippedSlots;
      setOwnedItems(owned);
      setEquippedSlots(active);
      await persistLocalState(owned, active);

      if (typeof data?.remaining_diamonds === 'number') {
        onUpdateDiamonds?.(data.remaining_diamonds);
      }

      emitAppliedItem(selectedItem, 'purchase');
      setShowPurchaseModal(false);
      setSelectedItem(null);
      Alert.alert('تم الشراء', data?.message || 'تم شراء الباقة بنجاح.');
    } catch (_) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال أثناء تنفيذ الشراء.');
    } finally {
      setProcessing(false);
    }
  }, [emitAppliedItem, equippedSlots, isGuest, onUpdateDiamonds, ownedItems, persistLocalState, processing, selectedItem, userDiamonds, userId]);

  const handleDiamondPurchase = useCallback((pack) => {
    if (isGuest || !userId) {
      Alert.alert('تسجيل مطلوب', 'يرجى تسجيل الدخول لشراء باقات الألماس.');
      return;
    }
    if (Platform.OS === 'ios') {
      Alert.alert(
        'شراء الألماس على iPhone/iPad',
        'الشراء على iOS يتم عبر In-App Purchase (StoreKit) فقط وفق متطلبات App Store. سيتم فتحه مباشرة عبر App Store في الإصدار القادم دون أي دفع خارجي.',
      );
      return;
    }
    Alert.alert(
      'تأكيد شراء الألماس',
      `شراء ${pack.diamonds + (pack.bonus || 0)} ألماسة مقابل ${pack.price} ر.س`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'شراء',
          onPress: async () => {
            try {
              const res = await api.purchaseDiamonds(userId, pack.id);
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                Alert.alert('فشل الشراء', data?.detail || 'تعذر تنفيذ الشراء.');
                return;
              }
              const nextBalance = Number(data?.new_balance);
              if (Number.isFinite(nextBalance)) {
                onUpdateDiamonds?.(nextBalance);
              } else {
                onUpdateDiamonds?.((userDiamonds || 0) + Number(data?.diamonds_added || 0));
              }
              Alert.alert('تم', `تمت إضافة ${data?.diamonds_added || 0} ألماسة.`);
            } catch (_) {
              Alert.alert('خطأ', 'حدث خطأ في الاتصال أثناء شراء الألماس.');
            }
          },
        },
      ],
    );
  }, [isGuest, onUpdateDiamonds, userDiamonds, userId]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>جارٍ تحميل المتجر...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090d18', '#0f172a', '#111827']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>متجر المميزات</Text>
          <TouchableOpacity style={styles.balancePill} onPress={() => setShowDiamondShop(true)}>
            <Ionicons name="diamond" size={16} color="#60a5fa" />
            <Text style={styles.balanceText}>{userDiamonds || 0}</Text>
            <Ionicons name="add-circle" size={16} color="#10b981" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroInfoCard}>
          <Ionicons name="pricetag" size={16} color="#93c5fd" />
          <Text style={styles.heroInfoText}>
            متجران متكاملان: ألماس للشحن الفوري + مميزات احترافية قابلة للتفعيل.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {SHOP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryTab, selectedCategory === cat.id && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons name={cat.icon} size={16} color={selectedCategory === cat.id ? '#fff' : '#94a3b8'} />
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {filteredItems.map((item) => {
              const isOwned = ownedItems.includes(item.id);
              const isEquipped = item.slot && equippedSlots[item.slot] === item.id;
              const rarity = RARITY[item.rarity] || RARITY.common;
              const canAfford = (userDiamonds || 0) >= item.price;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, isOwned && styles.cardOwned]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (Platform.OS === 'ios' && !isOwned) {
                      Alert.alert(
                        'متجر iOS',
                        'شراء المميزات الرقمية على iOS سيكون عبر Apple In-App Purchase فقط.',
                      );
                      return;
                    }
                    if (isOwned && item.slot) {
                      handleEquip(item);
                    } else if (!isOwned) {
                      setSelectedItem(item);
                      setShowPurchaseModal(true);
                    }
                  }}
                >
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                    <View style={[styles.rarityBadge, { backgroundColor: `${rarity.color}33` }]}>
                      <Text style={[styles.rarityText, { color: rarity.color }]}>{rarity.label}</Text>
                    </View>
                    {isOwned && (
                      <View style={styles.ownedBadge}>
                        <Ionicons name={isEquipped ? 'checkmark-circle' : 'checkmark'} size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  <Text style={styles.itemPreviewText}>
                    {item.slot === 'profile_frame' ? 'يظهر على صورة الملف'
                      : item.slot === 'chat_frame' ? 'يظهر داخل الدردشة'
                      : item.slot === 'avatar' ? 'صورة حساب جديدة'
                      : item.slot === 'theme' ? 'يظهر كثيم للتطبيق'
                      : 'باقة عناصر متعددة'}
                  </Text>
                  <View style={styles.cardFooter}>
                    {!isOwned ? (
                      <View style={[styles.priceTag, !canAfford && styles.priceTagDisabled]}>
                        <Ionicons name="diamond" size={13} color={canAfford ? '#60a5fa' : '#64748b'} />
                        <Text style={[styles.priceText, !canAfford && styles.priceTextDisabled]}>{item.price}</Text>
                      </View>
                    ) : (
                      <Text style={styles.ownedText}>{isEquipped ? 'مفعّل' : 'مملوك'}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 90 }} />
        </ScrollView>
      </LinearGradient>

      <Modal transparent visible={showPurchaseModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
            <Text style={styles.modalDesc}>{selectedItem?.description}</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>السعر</Text>
              <Text style={styles.modalValue}>{selectedItem?.price || 0} ألماسة</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>الرصيد الحالي</Text>
              <Text style={styles.modalValue}>{userDiamonds || 0} ألماسة</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowPurchaseModal(false); setSelectedItem(null); }}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
                disabled={processing}
                onPress={confirmPurchase}
              >
                {processing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmBtnText}>شراء</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDiamondShop} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>متجر الألماس</Text>
              <TouchableOpacity onPress={() => setShowDiamondShop(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Platform.OS === 'ios' ? (
                <View style={styles.iosIapNotice}>
                  <Ionicons name="logo-apple" size={20} color="#bfdbfe" />
                  <Text style={styles.iosIapNoticeText}>
                    شراء الألماس على iOS يتم حصراً عبر Apple In-App Purchase (StoreKit).
                    {'\n'}تم تعطيل أي شراء خارجي لحين اكتمال ربط منتجات App Store.
                  </Text>
                </View>
              ) : diamondPackages.map((pack) => (
                <TouchableOpacity key={pack.id} style={styles.packCard} onPress={() => handleDiamondPurchase(pack)}>
                  <Image source={{ uri: pack.image }} style={styles.packImage} resizeMode="cover" />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.packOverlay}>
                    <View style={styles.packInfoTop}>
                      <Text style={styles.packName}>{pack.name}</Text>
                      <View style={styles.packTopBadges}>
                        {DIAMOND_PACK_META[pack.id]?.badge ? (
                          <Text style={[styles.packMetaBadge, { backgroundColor: `${DIAMOND_PACK_META[pack.id].badgeColor}E6` }]}>
                            {DIAMOND_PACK_META[pack.id].badge}
                          </Text>
                        ) : null}
                        {pack.bonus > 0 ? <Text style={styles.packBonus}>+{pack.bonus}</Text> : null}
                      </View>
                    </View>
                    <View style={styles.packInfoBottom}>
                      <View>
                        <Text style={styles.packDiamonds}>{pack.diamonds + (pack.bonus || 0)} ألماسة</Text>
                        <Text style={styles.packValueText}>
                          {((pack.diamonds + (pack.bonus || 0)) / Math.max(1, Number(pack.price || 1))).toFixed(1)} ألماسة/ريال
                        </Text>
                      </View>
                      <Text style={styles.packPrice}>{pack.price} ر.س</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  loadingWrap: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#cbd5e1', marginTop: 10, fontSize: 13 },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59,130,246,0.16)',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  balanceText: { color: '#60a5fa', fontWeight: '700', fontSize: 14 },
  categoriesContainer: { maxHeight: 50, marginBottom: 10 },
  categoriesContent: { paddingHorizontal: 16, gap: 8 },
  heroInfoCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(30,64,175,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.32)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroInfoText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
  },
  categoryTabActive: { backgroundColor: '#2563eb' },
  categoryText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: (width - 48) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  cardOwned: { borderColor: 'rgba(34,197,94,0.5)' },
  imageWrap: { width: '100%', height: 88, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  image: { width: '100%', height: '100%' },
  rarityBadge: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  rarityText: { fontSize: 10, fontWeight: '700' },
  ownedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 3 },
  cardDesc: { color: '#94a3b8', fontSize: 11, minHeight: 30 },
  itemPreviewText: { color: '#64748b', fontSize: 10, marginTop: 2 },
  cardFooter: { marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end' },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceTagDisabled: { opacity: 0.5 },
  priceText: { color: '#60a5fa', fontWeight: '800' },
  priceTextDisabled: { color: '#64748b' },
  ownedText: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    padding: 16,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  modalDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 14 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  modalLabel: { color: '#94a3b8' },
  modalValue: { color: '#e2e8f0', fontWeight: '700' },
  modalActions: { flexDirection: 'row', marginTop: 12 },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#cbd5e1', fontWeight: '700' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: { color: '#fff', fontWeight: '800' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '80%',
    backgroundColor: '#0b1220',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  packCard: {
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.4)',
  },
  packImage: { width: '100%', height: '100%' },
  packOverlay: { ...StyleSheet.absoluteFillObject, padding: 10, justifyContent: 'space-between' },
  packInfoTop: { flexDirection: 'row', justifyContent: 'space-between' },
  packTopBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  packName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  packMetaBadge: {
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '800',
  },
  packBonus: {
    color: '#fff',
    backgroundColor: 'rgba(16,185,129,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '800',
  },
  packInfoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  packDiamonds: { color: '#dbeafe', fontSize: 13, fontWeight: '700' },
  packValueText: { color: '#93c5fd', fontSize: 10, marginTop: 2 },
  packPrice: {
    color: '#fff',
    backgroundColor: 'rgba(37,99,235,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    fontWeight: '800',
  },
  iosIapNotice: {
    backgroundColor: 'rgba(30,64,175,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.35)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  iosIapNoticeText: {
    color: '#dbeafe',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});

export default ShopScreen;
export { SHOP_ITEMS, DIAMOND_PACKAGES, SHOP_CATEGORIES };
