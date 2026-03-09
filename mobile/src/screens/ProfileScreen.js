// Profile Screen - User profile and settings
// Complete Professional Design with All Features
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Modal,
  TextInput,
  Share,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import storage from '../services/storage';
import { useAchievements } from '../services/AchievementsContext';

const ProfileScreen = ({
  user,
  onLogout,
  onNavigate,
  onOpenAchievements,
  onOpenShop,
  onOpenAdminPanel,
  onUpdateProfile,
}) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatar || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [profileFrame, setProfileFrame] = useState(null);
  const [economy, setEconomy] = useState({
    saqr_points: user?.points || 0,
    saqr_gems: user?.saqr_gems || 0,
  });
  
  // Achievements context
  const { recordAppShared } = useAchievements();
  
  const userGems = economy?.saqr_gems ?? user?.saqr_gems ?? 0;
  const userIdentifier = user?.id || user?.user_id || 'N/A';
  const watchedAds = user?.ads_watched || 0;
  const referralCode = user?.referral_code || 'SAQR' + (user?.id?.slice(-6) || '123456').toUpperCase();
  const referrals = user?.referrals_count || 0;
  const redeemableRiyals = Math.floor(userGems / 500);
  const riyalValue = redeemableRiyals.toFixed(0);
  const gemsRemainder = userGems % 500;
  const gemsProgress = (gemsRemainder / 500) * 100;
  const gemsToNextRiyal = gemsRemainder === 0 ? 500 : 500 - gemsRemainder;

  useEffect(() => {
    const loadProfileAppearance = async () => {
      try {
        const savedAvatar = await AsyncStorage.getItem('selected_profile_avatar');
        const savedFrame = await AsyncStorage.getItem('selected_profile_frame');
        if (savedAvatar) {
          setProfileAvatar(savedAvatar);
          setEditAvatarUrl(savedAvatar);
        }
        if (savedFrame) {
          setProfileFrame(JSON.parse(savedFrame));
        }
      } catch (e) {
        console.log('Profile appearance load error:', e);
      }
    };

    const loadBalance = async () => {
      try {
        const uid = user?.id || user?.user_id;
        if (!uid) return;
        const response = await api.getBalance(uid);
        if (response.ok) {
          const data = await response.json();
          setEconomy({
            saqr_points: data.saqr_points ?? data.points ?? 0,
            saqr_gems: data.saqr_gems ?? 0,
          });
        }
      } catch (e) {
        console.log('Profile balance load error:', e);
      }
    };

    loadProfileAppearance();
    loadBalance();
  }, [user?.id, user?.user_id]);

  const handleWithdraw = () => {
    if (redeemableRiyals < 1) {
      Alert.alert(
        'رصيد غير كافٍ',
        `تحتاج 500 جوهرة صقر على الأقل للسحب. لديك حالياً ${userGems} جوهرة.`,
        [{ text: 'حسناً' }]
      );
    } else {
      Alert.alert(
        'طلب سحب',
        `هل تريد سحب ${redeemableRiyals} ر.س؟\nسيتم خصم ${redeemableRiyals * 500} جوهرة صقر ومراجعة الطلب خلال 24 ساعة.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تأكيد السحب', onPress: submitWithdrawal }
        ]
      );
    }
  };

  const submitWithdrawal = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getToken();
      const response = await api.requestWithdrawal({ amount: redeemableRiyals }, token);
      if (response.ok) {
        Alert.alert('تم الطلب', 'تم إرسال طلب السحب بنجاح. سيتم مراجعته خلال 24 ساعة.');
      } else {
        Alert.alert('خطأ', 'فشل في إرسال الطلب. حاول مرة أخرى.');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      Alert.alert('خطأ', 'كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (passwords.new.length < 8) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setIsLoading(true);
    try {
      const token = await storage.getToken();
      const response = await api.changePassword({
        current_password: passwords.current,
        new_password: passwords.new
      }, token);
      
      if (response.ok) {
        Alert.alert('تم بنجاح', 'تم تغيير كلمة المرور بنجاح');
        setShowChangePassword(false);
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const data = await response.json();
        Alert.alert('خطأ', data.detail || 'فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: `جرب تطبيق صقر واكسب المال من مشاهدة الإعلانات!\n\nاستخدم كود الإحالة: ${referralCode}\n\nحمّل التطبيق الآن!`,
        title: 'شارك تطبيق صقر',
      });
      
      // Record app share for achievements if share was successful
      if (result.action === Share.sharedAction && recordAppShared) {
        recordAppShared();
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const copyReferralCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('تم النسخ', `تم نسخ كود الإحالة: ${referralCode}`);
  };

  const copyUserIdentifier = async () => {
    await Clipboard.setStringAsync(String(userIdentifier));
    Alert.alert('تم النسخ', `تم نسخ معرّف الحساب: ${userIdentifier}`);
  };

  const handleSupport = () => {
    Alert.alert(
      'الدعم الفني',
      'اختر طريقة التواصل:',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'البريد الإلكتروني', onPress: () => Linking.openURL('mailto:support@saqr.app?subject=طلب دعم') },
        { text: 'واتساب', onPress: () => Linking.openURL('https://wa.me/966500000000') },
      ]
    );
  };

  const handleHistory = () => {
    Alert.alert(
      'سجل المعاملات',
      `إجمالي الإعلانات المشاهدة: ${watchedAds}\nرصيد الجواهر الحالي: ${userGems}\n\nلا توجد عمليات سحب سابقة.`,
      [{ text: 'حسناً' }]
    );
  };

  const handlePrivacy = () => {
    Linking.openURL(`${api.baseUrl}/privacy`);
  };

  const handleTerms = () => {
    Linking.openURL(`${api.baseUrl}/terms`);
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleTrackingPermission = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('معلومات', 'إذن التتبع (ATT) متاح على iOS فقط.');
      return;
    }
    try {
      const current = await getTrackingPermissionsAsync();
      if (current?.status === 'undetermined') {
        const next = await requestTrackingPermissionsAsync();
        Alert.alert('إذن التتبع', `الحالة الحالية: ${next?.status || 'unknown'}`);
        return;
      }
      Alert.alert('إذن التتبع', `الحالة الحالية: ${current?.status || 'unknown'}`);
    } catch (e) {
      Alert.alert('تعذر الفحص', 'حدث خطأ أثناء قراءة إذن التتبع.');
    }
  };

  // معالجة الضغط المتكرر على رقم الإصدار لفتح تسجيل دخول الأدمن
  const handleVersionTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    
    if (newCount >= 7) {
      setShowAdminLogin(true);
      setAdminTapCount(0);
    }
    
    // إعادة تعيين العداد بعد 3 ثواني
    setTimeout(() => setAdminTapCount(0), 3000);
  };

  // تسجيل دخول الأدمن
  const handleAdminLogin = async () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد وكلمة المرور');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.adminLogin(adminEmail.trim(), adminPassword);
      const data = await response.json();
      
      if (response.ok && data.token) {
        await AsyncStorage.setItem('admin_token', data.token);
        setShowAdminLogin(false);
        setAdminEmail('');
        setAdminPassword('');
        if (onOpenAdminPanel) {
          onOpenAdminPanel();
        }
      } else {
        Alert.alert('خطأ', data.detail || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('خطأ', 'يرجى إدخال اسم صحيح');
      return;
    }
    const trimmedAvatarUrl = editAvatarUrl.trim();
    if (trimmedAvatarUrl && !/^https?:\/\//i.test(trimmedAvatarUrl)) {
      Alert.alert('خطأ', 'رابط الصورة يجب أن يبدأ بـ http أو https');
      return;
    }

    if (trimmedAvatarUrl) {
      await AsyncStorage.setItem('selected_profile_avatar', trimmedAvatarUrl);
      setProfileAvatar(trimmedAvatarUrl);
    }

    onUpdateProfile && onUpdateProfile({ name: trimmedName, avatar: trimmedAvatarUrl || profileAvatar || null });
    setShowEditProfile(false);
    Alert.alert('تم', 'تم تحديث الملف الشخصي بنجاح');
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmText.trim()) {
      Alert.alert('خطأ', 'اكتب DELETE أو حذف لتأكيد العملية');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await api.deleteAccount(deleteConfirmText.trim(), deletePassword || null);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('تعذر حذف الحساب', data?.detail || 'حدث خطأ أثناء حذف الحساب');
        return;
      }

      Alert.alert(
        'تم حذف الحساب',
        'تم حذف الحساب نهائيًا من النظام.',
        [{
          text: 'حسناً',
          onPress: async () => {
            setShowDeleteAccount(false);
            setDeleteConfirmText('');
            setDeletePassword('');
            await storage.clearAll();
            onLogout && onLogout();
          },
        }],
      );
    } catch (error) {
      Alert.alert('خطأ اتصال', 'تعذر حذف الحساب حالياً. حاول مرة أخرى.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const menuItems = [
    { id: 'shop', icon: 'cart', label: 'المتجر', action: onOpenShop, color: '#3b82f6' },
    { id: 'achievements', icon: 'trophy', label: 'الإنجازات', action: onOpenAchievements, color: '#fbbf24' },
    { id: 'settings', icon: 'settings-outline', label: 'الإعدادات', action: handleSettings, color: '#94a3b8' },
    { id: 'withdraw', icon: 'wallet-outline', label: 'سحب الأرباح', action: handleWithdraw, color: '#22c55e' },
    { id: 'history', icon: 'receipt-outline', label: 'سجل المعاملات', action: handleHistory, color: '#60a5fa' },
    { id: 'password', icon: 'lock-closed-outline', label: 'تغيير كلمة المرور', action: () => setShowChangePassword(true), color: '#a855f7' },
    { id: 'support', icon: 'headset-outline', label: 'الدعم الفني', action: () => onNavigate('support'), color: '#f97316' },
    { id: 'advertiser-dashboard', icon: 'bar-chart-outline', label: 'لوحة تحكم المعلن', action: () => onNavigate('advertiser-dashboard'), color: '#ec4899' },
    { id: 'share', icon: 'share-social-outline', label: 'شارك التطبيق', action: handleShareApp, color: '#6366f1' },
    { id: 'privacy', icon: 'shield-checkmark-outline', label: 'سياسة الخصوصية', action: handlePrivacy, color: '#14b8a6' },
    { id: 'terms', icon: 'document-text-outline', label: 'شروط الاستخدام', action: handleTerms, color: '#06b6d4' },
    ...(Platform.OS === 'ios'
      ? [{ id: 'tracking', icon: 'eye-outline', label: 'إذن تتبع الإعلانات (ATT)', action: handleTrackingPermission, color: '#38bdf8' }]
      : []),
    { id: 'delete-account', icon: 'trash-outline', label: 'حذف الحساب نهائياً', action: () => setShowDeleteAccount(true), color: '#ef4444' },
  ];
  
  // إضافة زر الأدمن فقط إذا كان المستخدم مدير (role = admin أو super_admin)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.is_admin === true;
  if (isAdmin && onOpenAdminPanel) {
    menuItems.splice(2, 0, { id: 'admin', icon: 'shield-checkmark', label: 'لوحة تحكم الأدمن', action: onOpenAdminPanel, color: '#ef4444' });
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={[
              styles.avatar,
              profileFrame?.colors?.[0] ? { borderColor: profileFrame.colors[0] } : null,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              setEditName(user?.name || editName);
              setEditAvatarUrl(profileAvatar || '');
              setShowEditProfile(true);
            }}
          >
            {profileAvatar ? (
              <Image source={{ uri: profileAvatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name || 'مستخدم'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          <TouchableOpacity style={styles.userIdChip} onPress={copyUserIdentifier} activeOpacity={0.7}>
            <Ionicons name="id-card-outline" size={14} color="#93c5fd" />
            <Text style={styles.userIdLabel}>ID: {userIdentifier}</Text>
            <Ionicons name="copy-outline" size={14} color="#93c5fd" />
          </TouchableOpacity>
          {user?.isGuest && (
            <View style={styles.guestBadge}>
              <Ionicons name="person-outline" size={12} color="#fbbf24" />
              <Text style={styles.guestText}>زائر</Text>
            </View>
          )}
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={24} color="#60a5fa" />
          </View>
          <Text style={styles.balanceLabel}>القيمة القابلة للسحب</Text>
          <Text style={styles.balanceValue}>{riyalValue} ر.س</Text>
          <Text style={styles.balancePoints}>{userGems} جوهرة صقر</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(gemsProgress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{gemsToNextRiyal} جوهرة للريال التالي</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="sparkles" size={18} color="#f472b6" />
            <Text style={styles.statValue}>{userGems}</Text>
            <Text style={styles.statLabel}>الجواهر</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="play-circle" size={18} color="#60a5fa" />
            <Text style={styles.statValue}>{watchedAds}</Text>
            <Text style={styles.statLabel}>إعلانات</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="people" size={18} color="#22c55e" />
            <Text style={styles.statValue}>{referrals}</Text>
            <Text style={styles.statLabel}>إحالات</Text>
          </View>
        </View>

        {/* Referral Code */}
        <View style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <Ionicons name="gift" size={20} color="#ec4899" />
            <Text style={styles.referralTitle}>كود الإحالة</Text>
          </View>
          <TouchableOpacity style={styles.referralCodeBox} onPress={copyReferralCode} activeOpacity={0.7}>
            <Text style={styles.referralCode}>{referralCode}</Text>
            <Ionicons name="copy-outline" size={18} color="#60a5fa" />
          </TouchableOpacity>
          <Text style={styles.referralDesc}>شارك الكود واحصل على 50 جوهرة صقر لكل صديق يسجل!</Text>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem} 
              onPress={item.action}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ))}
          
          {/* Logout */}
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]} 
            onPress={confirmLogout}
            activeOpacity={0.6}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.menuLabel, styles.logoutText]}>تسجيل الخروج</Text>
            <Ionicons name="chevron-forward" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* App Version - اضغط 7 مرات لفتح لوحة الأدمن */}
        <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.7}>
          <Text style={styles.versionText}>الإصدار 7.2.6</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Login Modal */}
      <Modal visible={showAdminLogin} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تسجيل دخول الأدمن</Text>
              <TouchableOpacity onPress={() => {
                setShowAdminLogin(false);
                setAdminEmail('');
                setAdminPassword('');
              }}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.adminLoginIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#ef4444" />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل بريد الأدمن"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={adminEmail}
                onChangeText={setAdminEmail}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={adminPassword}
                onChangeText={setAdminPassword}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.adminLoginBtn, isLoading && styles.modalButtonDisabled]}
              onPress={handleAdminLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="enter-outline" size={20} color="#FFF" />
                  <Text style={styles.adminLoginBtnText}>دخول لوحة التحكم</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور الحالية</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور الحالية"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={passwords.current}
                onChangeText={(t) => setPasswords({...passwords, current: t})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور الجديدة</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور الجديدة"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={passwords.new}
                onChangeText={(t) => setPasswords({...passwords, new: t})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={passwords.confirm}
                onChangeText={(t) => setPasswords({...passwords, confirm: t})}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.modalButton, isLoading && styles.modalButtonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.modalButtonText}>تغيير كلمة المرور</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل الملف الشخصي</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الاسم</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>رابط الصورة الشخصية (اختياري)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/avatar.png"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={editAvatarUrl}
                autoCapitalize="none"
                onChangeText={setEditAvatarUrl}
              />
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleSaveProfile}>
              <Text style={styles.modalButtonText}>حفظ التغييرات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteAccount} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>حذف الحساب نهائياً</Text>
              <TouchableOpacity
                onPress={() => {
                  if (isDeletingAccount) return;
                  setShowDeleteAccount(false);
                  setDeleteConfirmText('');
                  setDeletePassword('');
                }}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.dangerBox}>
              <Ionicons name="warning-outline" size={20} color="#fecaca" />
              <Text style={styles.dangerText}>
                سيتم حذف الحساب وجميع بياناته نهائياً. لا يمكن التراجع عن هذه العملية.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>اكتب DELETE أو حذف للتأكيد</Text>
              <TextInput
                style={styles.input}
                placeholder="DELETE"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور (لحسابات البريد فقط)</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.deleteAccountBtn, isDeletingAccount && styles.modalButtonDisabled]}
              onPress={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.deleteAccountBtnText}>تأكيد حذف الحساب</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 100 },

  profileHeader: { alignItems: 'center', marginBottom: 20 },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#3b82f6', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0f',
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  name: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  email: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
  userIdChip: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.35)',
  },
  userIdLabel: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  guestBadge: { 
    backgroundColor: 'rgba(251,191,36,0.15)', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  guestText: { color: '#fbbf24', fontSize: 11 },

  balanceCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  balanceValue: { color: '#60a5fa', fontSize: 36, fontWeight: 'bold', marginVertical: 2 },
  balancePoints: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  progressContainer: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 3,
  },
  progressText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 6 },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 14, 
    padding: 14, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },

  referralCard: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  referralTitle: { color: '#ec4899', fontSize: 14, fontWeight: '600' },
  referralCodeBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  referralCode: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  referralDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center' },

  menuSection: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'transparent',
    gap: 10,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { flex: 1, color: '#FFF', fontSize: 14 },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: '#ef4444' },

  versionText: { 
    color: 'rgba(255,255,255,0.25)', 
    fontSize: 10, 
    textAlign: 'center', 
    marginTop: 20 
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0a0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Admin Login Styles
  adminLoginIcon: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(239,68,68,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  adminLoginBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  adminLoginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(248,113,113,0.4)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  dangerText: {
    color: '#fecaca',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  deleteAccountBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteAccountBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
