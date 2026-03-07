// In-App Shop - متجر التطبيق الداخلي
// شراء عناصر بالماس: خلفيات، أيقونات، تأثيرات، باقات VIP
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Shop Categories
const SHOP_CATEGORIES = [
  { id: 'all', name: 'الكل', icon: 'apps' },
  { id: 'avatars', name: 'الصور الرمزية', icon: 'person-circle' },
  { id: 'frames', name: 'الإطارات', icon: 'square' },
  { id: 'themes', name: 'المظاهر', icon: 'color-palette' },
  { id: 'boosters', name: 'التعزيزات', icon: 'rocket' },
  { id: 'vip', name: 'VIP', icon: 'diamond' },
];

// Shop Items Database - with AI-generated images
const SHOP_ITEMS = [
  // Avatars - الصور الرمزية
  {
    id: 'avatar_gold',
    name: 'الصقر الذهبي',
    description: 'صورة رمزية ذهبية فاخرة',
    category: 'avatars',
    price: 100,
    icon: 'shield',
    colors: ['#fbbf24', '#d97706'],
    type: 'avatar',
    rarity: 'rare',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/49657672d9a64589c56e4aaf8d04fd1ed449ed3eb20bdd620a2dd446c56d8f93.png',
  },
  {
    id: 'avatar_diamond',
    name: 'الماسة الزرقاء',
    description: 'صورة رمزية كريستالية',
    category: 'avatars',
    price: 250,
    icon: 'diamond',
    colors: ['#3b82f6', '#1d4ed8'],
    type: 'avatar',
    rarity: 'epic',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/023917c49fab8b87593072b51baa9584ecaec8bddecc94d124c69166ba378dad.png',
  },
  {
    id: 'avatar_fire',
    name: 'اللهب الناري',
    description: 'صورة رمزية نارية',
    category: 'avatars',
    price: 150,
    icon: 'flame',
    colors: ['#ef4444', '#dc2626'],
    type: 'avatar',
    rarity: 'rare',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/4dc85c2c6db823cb599e231591fae681ea6a3f675e8193fc0460d56837dc4c47.png',
  },
  {
    id: 'avatar_crown',
    name: 'التاج الملكي',
    description: 'صورة رمزية للأبطال',
    category: 'avatars',
    price: 500,
    icon: 'trophy',
    colors: ['#a855f7', '#7c3aed'],
    type: 'avatar',
    rarity: 'legendary',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/33a946656c353bd7e90889bb7c01499898ff0a23da35e2e6bcd661d595319a4b.png',
  },
  {
    id: 'avatar_star',
    name: 'النجم اللامع',
    description: 'صورة رمزية متألقة',
    category: 'avatars',
    price: 75,
    icon: 'star',
    colors: ['#fbbf24', '#f59e0b'],
    type: 'avatar',
    rarity: 'common',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/86abd9d66ea83500fffe680b9db5618403214798c4150d5508f861cbeece635e.png',
  },
  
  // Frames - الإطارات
  {
    id: 'frame_gold',
    name: 'الإطار الذهبي',
    description: 'إطار ذهبي لصورتك',
    category: 'frames',
    price: 200,
    icon: 'square-outline',
    colors: ['#fbbf24', '#b45309'],
    type: 'frame',
    rarity: 'rare',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/81b25ff7dff1c22531ebee6eb6d1b1c78ed8dbcf4fd47ded3f3e8b36b7e331c5.png',
  },
  {
    id: 'frame_neon',
    name: 'الإطار النيون',
    description: 'إطار متوهج بألوان النيون',
    category: 'frames',
    price: 300,
    icon: 'flash',
    colors: ['#ec4899', '#8b5cf6'],
    type: 'frame',
    rarity: 'epic',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/b5329ed8b521321c18a1a23f7dfacb283e436fa40a3601f5f0a053e9f07f461b.png',
  },
  {
    id: 'frame_royal',
    name: 'الإطار الملكي',
    description: 'إطار فخم للمتميزين',
    category: 'frames',
    price: 450,
    icon: 'ribbon',
    colors: ['#7c3aed', '#4c1d95'],
    type: 'frame',
    rarity: 'epic',
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/3db2e3f1eb9a0f47dec7b567bf019a25c2c537936ae0045036c460a5f41d9901.png',
  },
  {
    id: 'frame_ice',
    name: 'الإطار الجليدي',
    description: 'إطار بارد ومنعش',
    category: 'frames',
    price: 150,
    icon: 'snow',
    colors: ['#06b6d4', '#0891b2'],
    type: 'frame',
    rarity: 'rare',
  },
  
  // Themes - المظاهر
  {
    id: 'theme_dark_blue',
    name: 'الأزرق الداكن',
    description: 'مظهر أزرق أنيق',
    category: 'themes',
    price: 350,
    icon: 'moon',
    colors: ['#1e3a8a', '#1e40af'],
    type: 'theme',
    rarity: 'rare',
  },
  {
    id: 'theme_sunset',
    name: 'غروب الشمس',
    description: 'مظهر دافئ وجميل',
    category: 'themes',
    price: 400,
    icon: 'sunny',
    colors: ['#f97316', '#ea580c'],
    type: 'theme',
    rarity: 'epic',
  },
  {
    id: 'theme_forest',
    name: 'الغابة الخضراء',
    description: 'مظهر طبيعي هادئ',
    category: 'themes',
    price: 300,
    icon: 'leaf',
    colors: ['#22c55e', '#16a34a'],
    type: 'theme',
    rarity: 'rare',
  },
  {
    id: 'theme_galaxy',
    name: 'المجرة',
    description: 'مظهر فضائي رائع',
    category: 'themes',
    price: 600,
    icon: 'planet',
    colors: ['#8b5cf6', '#6366f1'],
    type: 'theme',
    rarity: 'legendary',
  },
  
  // Boosters - التعزيزات
  {
    id: 'booster_2x_points',
    name: 'مضاعف النقاط',
    description: 'ضاعف نقاطك لمدة ساعة',
    category: 'boosters',
    price: 50,
    icon: 'trending-up',
    colors: ['#10b981', '#059669'],
    type: 'booster',
    duration: 60, // minutes
    effect: 'points_2x',
    rarity: 'common',
  },
  {
    id: 'booster_3x_points',
    name: 'ثلاثة أضعاف النقاط',
    description: 'ثلاثة أضعاف نقاطك لمدة 30 دقيقة',
    category: 'boosters',
    price: 100,
    icon: 'flash',
    colors: ['#fbbf24', '#d97706'],
    type: 'booster',
    duration: 30,
    effect: 'points_3x',
    rarity: 'rare',
  },
  {
    id: 'booster_extra_life',
    name: 'حياة إضافية',
    description: 'احصل على حياة إضافية في الألعاب',
    category: 'boosters',
    price: 30,
    icon: 'heart',
    colors: ['#ef4444', '#dc2626'],
    type: 'booster',
    uses: 3,
    effect: 'extra_life',
    rarity: 'common',
  },
  {
    id: 'booster_hint_pack',
    name: 'حزمة التلميحات',
    description: '10 تلميحات للألعاب',
    category: 'boosters',
    price: 40,
    icon: 'bulb',
    colors: ['#f59e0b', '#d97706'],
    type: 'booster',
    uses: 10,
    effect: 'hints',
    rarity: 'common',
  },
  {
    id: 'booster_time_freeze',
    name: 'تجميد الوقت',
    description: 'أوقف المؤقت لمدة 30 ثانية',
    category: 'boosters',
    price: 60,
    icon: 'time',
    colors: ['#06b6d4', '#0891b2'],
    type: 'booster',
    uses: 5,
    effect: 'time_freeze',
    rarity: 'rare',
  },
  
  // VIP Packages - باقات VIP
  {
    id: 'vip_weekly',
    name: 'VIP أسبوعي',
    description: 'مضاعفة النقاط + إطار ذهبي لمدة أسبوع',
    category: 'vip',
    price: 200,
    icon: 'star',
    colors: ['#fbbf24', '#f59e0b'],
    type: 'vip',
    duration: 7, // days
    benefits: ['points_2x', 'gold_frame', 'no_ads'],
    rarity: 'rare',
  },
  {
    id: 'vip_monthly',
    name: 'VIP شهري',
    description: 'كل المميزات + مكافآت يومية مضاعفة',
    category: 'vip',
    price: 500,
    icon: 'diamond',
    colors: ['#a855f7', '#7c3aed'],
    type: 'vip',
    duration: 30,
    benefits: ['points_3x', 'all_frames', 'no_ads', 'daily_bonus_2x', 'exclusive_avatar'],
    rarity: 'epic',
  },
  {
    id: 'vip_lifetime',
    name: 'VIP مدى الحياة',
    description: 'كل المميزات للأبد + عناصر حصرية',
    category: 'vip',
    price: 2000,
    icon: 'ribbon',
    colors: ['#ec4899', '#be185d'],
    type: 'vip',
    duration: -1, // lifetime
    benefits: ['points_3x', 'all_items', 'no_ads', 'daily_bonus_3x', 'legendary_items', 'priority_support'],
    rarity: 'legendary',
  },
];

// Diamond Packages for Purchase - with AI-generated professional images
const DIAMOND_PACKAGES = [
  { id: 'pack_50', diamonds: 50, price: 4.99, bonus: 0, icon: 'diamond-outline', image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/8d0264089edcfd06522002458fa06c39546c26f3c63eb9ee166111a86c4a1f70.png' },
  { id: 'pack_150', diamonds: 150, price: 9.99, bonus: 20, icon: 'diamond', image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/2331b4dba6a7794ca82e307739d695d26c4b52262ad971bb241272053261e7d0.png' },
  { id: 'pack_350', diamonds: 350, price: 19.99, bonus: 50, icon: 'diamond', image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/f3510c77236365fa4fa98a435bc3fe90061eeff371b68553e5ab0802c561dd42.png' },
  { id: 'pack_750', diamonds: 750, price: 39.99, bonus: 150, icon: 'diamond', image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/27e837516af9a27d6232662cf8922fdf81f6f3db1555b994002eb12554331c93.png' },
  { id: 'pack_1500', diamonds: 1500, price: 74.99, bonus: 400, icon: 'diamond', image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/a50037c315fcbd1d811fced1e2e9b7183b7d8255812d7a6faf8d1d451883de1c.png' },
  { id: 'pack_3500', diamonds: 3500, price: 149.99, bonus: 1000, icon: 'diamond', image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/72b5b17853dba2913709717ad1d6f03c49d7354619584ae3a9ac2d8cc9ba3e41.png' },
];

// Rarity colors
const RARITY_COLORS = {
  common: { bg: '#4b5563', text: 'عادي' },
  rare: { bg: '#3b82f6', text: 'نادر' },
  epic: { bg: '#a855f7', text: 'ملحمي' },
  legendary: { bg: '#fbbf24', text: 'أسطوري' },
};

// Shop Item Card - with AI Images
const ShopItemCard = ({ item, owned, equipped, onPurchase, onEquip, userDiamonds }) => {
  const canAfford = userDiamonds >= item.price;
  const rarity = RARITY_COLORS[item.rarity];
  const canEquip = owned && ['avatar', 'frame', 'theme'].includes(item.type);
  
  return (
    <TouchableOpacity
      style={[styles.itemCard, owned && styles.itemCardOwned]}
      onPress={() => {
        if (!owned) {
          onPurchase(item);
          return;
        }
        if (canEquip) {
          onEquip(item);
        }
      }}
      activeOpacity={owned ? 0.85 : 0.8}
    >
      {item.image ? (
        <View style={styles.itemImageContainer}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.itemImage}
            resizeMode="cover"
          />
          {owned && (
            <View style={styles.ownedImageBadge}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={owned ? ['#1e293b', '#334155'] : item.colors}
          style={styles.itemIconContainer}
        >
          <Ionicons name={item.icon} size={32} color={owned ? '#666' : '#FFF'} />
          {owned && (
            <View style={styles.ownedBadge}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
          )}
        </LinearGradient>
      )}
      
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, owned && styles.itemNameOwned]}>{item.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
        
        <View style={styles.itemFooter}>
          <View style={[styles.rarityBadge, { backgroundColor: rarity.bg + '30' }]}>
            <Text style={[styles.rarityText, { color: rarity.bg }]}>{rarity.text}</Text>
          </View>
          
          {!owned ? (
            <View style={[styles.priceTag, !canAfford && styles.priceTagDisabled]}>
              <Ionicons name="diamond" size={14} color={canAfford ? '#60a5fa' : '#666'} />
              <Text style={[styles.priceText, !canAfford && styles.priceTextDisabled]}>
                {item.price}
              </Text>
            </View>
          ) : (
            <View style={styles.ownedTag}>
              <Ionicons
                name={equipped ? 'checkmark-circle' : 'checkmark-done-circle-outline'}
                size={14}
                color={equipped ? '#22c55e' : '#a3e635'}
              />
              <Text style={styles.ownedText}>
                {equipped ? 'مفعّل' : (canEquip ? 'تفعيل' : 'مملوك')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Diamond Package Card with Real Images
const DiamondPackageCard = ({ pack, onPurchase }) => {
  const hasBonus = pack.bonus > 0;
  
  return (
    <TouchableOpacity 
      style={styles.diamondCard}
      onPress={() => onPurchase(pack)}
      activeOpacity={0.8}
    >
      <View style={styles.diamondCardContainer}>
        {/* Background Image */}
        <Image 
          source={{ uri: pack.image }} 
          style={styles.diamondCardImage}
          resizeMode="cover"
        />
        {/* Overlay Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.diamondCardGradient}
        >
          {hasBonus && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>+{pack.bonus}</Text>
            </View>
          )}
          
          <View style={styles.diamondCardContent}>
            <View style={styles.diamondIconBadge}>
              <Ionicons name="diamond" size={18} color="#60a5fa" />
            </View>
            <Text style={styles.diamondAmount}>{pack.diamonds}</Text>
            <Text style={styles.diamondLabel}>ماسة</Text>
            <View style={styles.diamondPrice}>
              <Text style={styles.diamondPriceText}>${pack.price}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

// Purchase Confirmation Modal
const PurchaseModal = ({ item, visible, onConfirm, onCancel, userDiamonds }) => {
  if (!item) return null;
  
  const canAfford = userDiamonds >= item.price;
  const remaining = userDiamonds - item.price;
  
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient colors={item.colors} style={styles.modalHeader}>
            <Ionicons name={item.icon} size={50} color="#FFF" />
          </LinearGradient>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{item.name}</Text>
            <Text style={styles.modalDesc}>{item.description}</Text>
            
            <View style={styles.modalPriceRow}>
              <Text style={styles.modalPriceLabel}>السعر:</Text>
              <View style={styles.modalPriceValue}>
                <Ionicons name="diamond" size={20} color="#60a5fa" />
                <Text style={styles.modalPriceText}>{item.price}</Text>
              </View>
            </View>
            
            <View style={styles.modalBalanceRow}>
              <Text style={styles.modalBalanceLabel}>رصيدك:</Text>
              <Text style={[styles.modalBalanceValue, !canAfford && styles.insufficientBalance]}>
                {userDiamonds} ماسة
              </Text>
            </View>
            
            {canAfford && (
              <View style={styles.modalRemainingRow}>
                <Text style={styles.modalRemainingLabel}>المتبقي بعد الشراء:</Text>
                <Text style={styles.modalRemainingValue}>{remaining} ماسة</Text>
              </View>
            )}
            
            {!canAfford && (
              <View style={styles.insufficientWarning}>
                <Ionicons name="warning" size={18} color="#ef4444" />
                <Text style={styles.insufficientText}>
                  تحتاج {item.price - userDiamonds} ماسة إضافية
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, !canAfford && styles.confirmButtonDisabled]}
              onPress={onConfirm}
              disabled={!canAfford}
            >
              <Ionicons name="cart" size={18} color="#FFF" />
              <Text style={styles.confirmButtonText}>
                {canAfford ? 'شراء' : 'رصيد غير كافٍ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main Shop Screen
const ShopScreen = ({ user, userDiamonds = 0, onClose, onUpdateDiamonds, onPurchaseItem }) => {
  const userId = user?.id || user?.user_id || 'guest';
  const ownedItemsKey = `owned_shop_items_${userId}`;
  const activeBoostersKey = `active_boosters_${userId}`;
  const equippedItemsKey = `equipped_shop_items_${userId}`;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ownedItems, setOwnedItems] = useState([]);
  const [equippedItems, setEquippedItems] = useState({
    avatar: null,
    frame: null,
    theme: null,
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDiamondShop, setShowDiamondShop] = useState(false);
  const [activeBoosters, setActiveBoosters] = useState([]);
  
  // Load owned items
  useEffect(() => {
    loadOwnedItems();
    loadEquippedItems();
    loadActiveBoosters();
  }, [ownedItemsKey, equippedItemsKey, activeBoostersKey]);
  
  const loadOwnedItems = async () => {
    try {
      const saved = await AsyncStorage.getItem(ownedItemsKey);
      if (saved) {
        setOwnedItems(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading owned items:', error);
    }
  };
  
  const loadActiveBoosters = async () => {
    try {
      const saved = await AsyncStorage.getItem(activeBoostersKey);
      if (saved) {
        const boosters = JSON.parse(saved);
        // Filter expired boosters
        const now = Date.now();
        const active = boosters.filter(b => b.expiresAt > now || b.uses > 0);
        setActiveBoosters(active);
        await AsyncStorage.setItem(activeBoostersKey, JSON.stringify(active));
      }
    } catch (error) {
      console.log('Error loading boosters:', error);
    }
  };

  const loadEquippedItems = async () => {
    try {
      const saved = await AsyncStorage.getItem(equippedItemsKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEquippedItems({
          avatar: parsed.avatar || null,
          frame: parsed.frame || null,
          theme: parsed.theme || null,
        });
      }
    } catch (error) {
      console.log('Error loading equipped items:', error);
    }
  };
  
  const saveOwnedItems = async (items) => {
    try {
      await AsyncStorage.setItem(ownedItemsKey, JSON.stringify(items));
    } catch (error) {
      console.log('Error saving owned items:', error);
    }
  };

  const saveEquippedItems = async (items) => {
    try {
      await AsyncStorage.setItem(equippedItemsKey, JSON.stringify(items));
    } catch (error) {
      console.log('Error saving equipped items:', error);
    }
  };

  const handleEquipItem = async (item) => {
    if (!['avatar', 'frame', 'theme'].includes(item.type)) {
      return;
    }

    const updated = {
      ...equippedItems,
      [item.type]: item.id,
    };
    setEquippedItems(updated);
    await saveEquippedItems(updated);

    if (onPurchaseItem) {
      onPurchaseItem({ ...item, action: 'equip' });
    }

    Alert.alert('تم التفعيل', `تم تفعيل "${item.name}" بنجاح.`);
  };
  
  const handlePurchase = (item) => {
    setSelectedItem(item);
    setShowPurchaseModal(true);
  };
  
  const confirmPurchase = async () => {
    if (!selectedItem || userDiamonds < selectedItem.price) return;
    
    // Deduct diamonds
    const newBalance = userDiamonds - selectedItem.price;
    onUpdateDiamonds(newBalance);
    
    // Add to owned items
    const newOwnedItems = [...ownedItems, selectedItem.id];
    setOwnedItems(newOwnedItems);
    await saveOwnedItems(newOwnedItems);

    // Auto-equip personalizable items
    if (['avatar', 'frame', 'theme'].includes(selectedItem.type)) {
      const updatedEquip = {
        ...equippedItems,
        [selectedItem.type]: selectedItem.id,
      };
      setEquippedItems(updatedEquip);
      await saveEquippedItems(updatedEquip);
    }
    
    // Handle boosters
    if (selectedItem.type === 'booster') {
      const booster = {
        id: selectedItem.id,
        effect: selectedItem.effect,
        expiresAt: selectedItem.duration ? Date.now() + (selectedItem.duration * 60 * 1000) : 0,
        uses: selectedItem.uses || 0,
      };
      const newBoosters = [...activeBoosters, booster];
      setActiveBoosters(newBoosters);
      await AsyncStorage.setItem(activeBoostersKey, JSON.stringify(newBoosters));
    }
    
    // Handle VIP
    if (selectedItem.type === 'vip') {
      const vipData = {
        id: selectedItem.id,
        benefits: selectedItem.benefits,
        expiresAt: selectedItem.duration === -1 ? -1 : Date.now() + (selectedItem.duration * 24 * 60 * 60 * 1000),
      };
      await AsyncStorage.setItem('vip_status', JSON.stringify(vipData));
    }
    
    // Callback
    if (onPurchaseItem) {
      onPurchaseItem({ ...selectedItem, action: 'purchase' });
    }
    
    setShowPurchaseModal(false);
    setSelectedItem(null);
    
    Alert.alert(
      'تم الشراء بنجاح',
      `لقد حصلت على "${selectedItem.name}"`,
      [{ text: 'رائع' }]
    );
  };
  
  const handleDiamondPurchase = (pack) => {
    Alert.alert(
      'شراء الماس',
      `هل تريد شراء ${pack.diamonds}${pack.bonus > 0 ? ` + ${pack.bonus}` : ''} ماسة مقابل $${pack.price}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'شراء', 
          onPress: () => {
            // In production, this would trigger in-app purchase
            const total = pack.diamonds + pack.bonus;
            onUpdateDiamonds(userDiamonds + total);
            Alert.alert('تم', `تمت إضافة ${total} ماسة إلى رصيدك`);
          }
        }
      ]
    );
  };
  
  // Filter items by category
  const filteredItems = selectedCategory === 'all' 
    ? SHOP_ITEMS 
    : SHOP_ITEMS.filter(item => item.category === selectedCategory);
  
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>المتجر</Text>
          <TouchableOpacity 
            style={styles.diamondBalance}
            onPress={() => setShowDiamondShop(true)}
          >
            <Ionicons name="diamond" size={18} color="#60a5fa" />
            <Text style={styles.diamondBalanceText}>{userDiamonds}</Text>
            <Ionicons name="add-circle" size={18} color="#10b981" />
          </TouchableOpacity>
        </View>
        
        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {SHOP_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryTab,
                selectedCategory === cat.id && styles.categoryTabActive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons 
                name={cat.icon} 
                size={18} 
                color={selectedCategory === cat.id ? '#FFF' : '#888'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Active Boosters */}
        {activeBoosters.length > 0 && (
          <View style={styles.activeBoostersContainer}>
            <Text style={styles.activeBoostersTitle}>التعزيزات النشطة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeBoosters.map((booster, idx) => {
                const item = SHOP_ITEMS.find(i => i.id === booster.id);
                if (!item) return null;
                return (
                  <View key={idx} style={styles.activeBoosterBadge}>
                    <Ionicons name={item.icon} size={16} color={item.colors[0]} />
                    <Text style={styles.activeBoosterText}>{item.name}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
        
        {/* Items Grid */}
        <ScrollView 
          style={styles.itemsContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.itemsGrid}>
            {filteredItems.map(item => (
              <ShopItemCard
                key={item.id}
                item={item}
                owned={ownedItems.includes(item.id)}
                equipped={equippedItems[item.type] === item.id}
                onPurchase={handlePurchase}
                onEquip={handleEquipItem}
                userDiamonds={userDiamonds}
              />
            ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Purchase Modal */}
        <PurchaseModal
          item={selectedItem}
          visible={showPurchaseModal}
          onConfirm={confirmPurchase}
          onCancel={() => {
            setShowPurchaseModal(false);
            setSelectedItem(null);
          }}
          userDiamonds={userDiamonds}
        />
        
        {/* Diamond Shop Modal */}
        <Modal visible={showDiamondShop} animationType="slide" transparent>
          <View style={styles.diamondShopOverlay}>
            <View style={styles.diamondShopContent}>
              <View style={styles.diamondShopHeader}>
                <Text style={styles.diamondShopTitle}>شراء الماس</Text>
                <TouchableOpacity onPress={() => setShowDiamondShop(false)}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.diamondPacksGrid}>
                  {DIAMOND_PACKAGES.map(pack => (
                    <DiamondPackageCard
                      key={pack.id}
                      pack={pack}
                      onPurchase={handleDiamondPurchase}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  diamondBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  diamondBalanceText: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Categories
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  
  // Active Boosters
  activeBoostersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  activeBoostersTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  activeBoosterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  activeBoosterText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Items Grid
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // Item Card
  itemCard: {
    width: (width - 48) / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemCardOwned: {
    opacity: 0.7,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  itemIconContainer: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  itemImageContainer: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  ownedImageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemNameOwned: {
    color: '#888',
  },
  itemDesc: {
    color: '#666',
    fontSize: 11,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceTagDisabled: {
    opacity: 0.5,
  },
  priceText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  priceTextDisabled: {
    color: '#666',
  },
  ownedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownedText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1a1a24',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalPriceLabel: {
    color: '#888',
    fontSize: 14,
  },
  modalPriceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalPriceText: {
    color: '#60a5fa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalBalanceLabel: {
    color: '#888',
    fontSize: 14,
  },
  modalBalanceValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  insufficientBalance: {
    color: '#ef4444',
  },
  modalRemainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalRemainingLabel: {
    color: '#888',
    fontSize: 14,
  },
  modalRemainingValue: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  insufficientWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  insufficientText: {
    color: '#ef4444',
    fontSize: 13,
  },
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
  },
  confirmButtonDisabled: {
    backgroundColor: '#333',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Diamond Shop
  diamondShopOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  diamondShopContent: {
    backgroundColor: '#1a1a24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  diamondShopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  diamondShopTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  diamondPacksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // Diamond Card
  diamondCard: {
    width: (width - 60) / 3,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  diamondCardContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  diamondCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  diamondCardGradient: {
    flex: 1,
    padding: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  diamondCardContent: {
    alignItems: 'center',
  },
  diamondIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(96,165,250,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bonusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10,
  },
  bonusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  diamondAmount: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  diamondLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  diamondPrice: {
    backgroundColor: 'rgba(59,130,246,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  diamondPriceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ShopScreen;
export { SHOP_ITEMS, DIAMOND_PACKAGES, SHOP_CATEGORIES };
