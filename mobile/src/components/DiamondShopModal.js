// Diamond Shop Modal - متجر شحن الألماسات
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const DiamondShopModal = ({ visible, onClose, userId, onPurchaseComplete }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fetchPackages();
      startAnimations();
    }
  }, [visible]);

  const startAnimations = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await api.getDiamondPackages();
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.log('Packages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    Alert.alert(
      'تأكيد الشراء',
      `هل تريد شراء ${pkg.name}\n${pkg.diamonds + pkg.bonus} ألماسة مقابل ${pkg.price} ر.س؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'شراء',
          onPress: async () => {
            setPurchasing(pkg.id);
            try {
              // الحصول على URL الأصلي
              const originUrl = typeof window !== 'undefined' 
                ? window.location.origin 
                : 'https://quality-restore-1.preview.emergentagent.com';
              
              // إنشاء جلسة دفع Stripe
              const response = await api.fetch('/api/diamond-payments/checkout/create', {
                method: 'POST',
                body: JSON.stringify({
                  user_id: userId,
                  package_id: pkg.id,
                  origin_url: originUrl
                })
              });
              
              if (response.ok) {
                const data = await response.json();
                
                // فتح صفحة الدفع
                if (data.checkout_url) {
                  // للويب
                  if (typeof window !== 'undefined') {
                    window.location.href = data.checkout_url;
                  } else {
                    // للموبايل
                    const supported = await Linking.canOpenURL(data.checkout_url);
                    if (supported) {
                      await Linking.openURL(data.checkout_url);
                    }
                  }
                }
              } else {
                const error = await response.json();
                Alert.alert('خطأ', error.detail || 'حدث خطأ في بدء عملية الدفع');
              }
            } catch (error) {
              console.log('Payment error:', error);
              Alert.alert('خطأ', 'حدث خطأ في الاتصال');
            } finally {
              setPurchasing(null);
            }
          }
        }
      ]
    );
  };

  // وظيفة الشراء المجاني (للاختبار)
  const handleFreePurchase = async (pkg) => {
    Alert.alert(
      'شراء تجريبي',
      `هل تريد الحصول على ${pkg.diamonds + pkg.bonus} ألماسة مجاناً؟\n(وضع الاختبار)`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم',
          onPress: async () => {
            setPurchasing(pkg.id);
            try {
              const response = await api.purchaseDiamonds(userId, pkg.id);
              if (response.ok) {
                const data = await response.json();
                Alert.alert(
                  'تم الشراء!',
                  `تم إضافة ${data.diamonds_added} ألماسة لرصيدك`,
                  [{ text: 'رائع!', onPress: () => {
                    if (onPurchaseComplete) {
                      onPurchaseComplete(data);
                    }
                    onClose();
                  }}]
                );
              } else {
                const error = await response.json();
                Alert.alert('خطأ', error.detail || 'حدث خطأ في الشراء');
              }
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ في الاتصال');
            } finally {
              setPurchasing(null);
            }
          }
        }
      ]
    );
  };

  const getPackageColors = (packageId) => {
    switch (packageId) {
      case 'starter': return ['#64748b', '#475569'];
      case 'silver': return ['#94a3b8', '#64748b'];
      case 'gold': return ['#fbbf24', '#d97706'];
      case 'platinum': return ['#3b82f6', '#1d4ed8'];
      default: return ['#64748b', '#475569'];
    }
  };

  const getPackageIcon = (packageId) => {
    switch (packageId) {
      case 'starter': return 'diamond-outline';
      case 'silver': return 'diamond';
      case 'gold': return 'trophy';
      case 'platinum': return 'rocket';
      default: return 'diamond-outline';
    }
  };

  const renderPackage = (pkg, index) => {
    const colors = getPackageColors(pkg.id);
    const icon = getPackageIcon(pkg.id);
    const isPopular = pkg.id === 'gold';
    
    return (
      <Animated.View
        key={pkg.id}
        style={[
          styles.packageCard,
          { transform: [{ scale: purchasing === pkg.id ? 0.95 : 1 }] }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleFreePurchase(pkg)}
          onLongPress={() => handlePurchase(pkg)}
          disabled={purchasing !== null}
        >
          <LinearGradient
            colors={colors}
            style={[styles.packageGradient, isPopular && styles.popularPackage]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isPopular && (
              <View style={styles.popularBadge}>
                <Ionicons name="star" size={10} color="#FFF" />
                <Text style={styles.popularText}>الأكثر مبيعاً</Text>
              </View>
            )}
            
            <View style={styles.packageHeader}>
              <View style={styles.packageIconContainer}>
                <Ionicons name={icon} size={28} color="#FFF" />
              </View>
              <Text style={styles.packageName}>{pkg.name}</Text>
            </View>
            
            <View style={styles.diamondInfo}>
              <View style={styles.diamondRow}>
                <Ionicons name="diamond" size={24} color="#FFF" />
                <Text style={styles.diamondCount}>{pkg.diamonds}</Text>
              </View>
              {pkg.bonus > 0 && (
                <View style={styles.bonusContainer}>
                  <Text style={styles.bonusText}>+ {pkg.bonus} مجاناً!</Text>
                </View>
              )}
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>{pkg.price}</Text>
              <Text style={styles.priceCurrency}>ر.س</Text>
            </View>
            
            {purchasing === pkg.id ? (
              <ActivityIndicator color="#FFF" style={styles.purchaseLoader} />
            ) : (
              <View style={styles.buyButton}>
                <Text style={styles.buyButtonText}>شراء</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <LinearGradient
                colors={['#60a5fa', '#3b82f6']}
                style={styles.headerIconBg}
              >
                <Ionicons name="diamond" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.headerTitle}>متجر الألماسات</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
          
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="#60a5fa" />
            <Text style={styles.infoText}>
              استخدم الألماسات للعب أونلاين وتحدي لاعبين حقيقيين!
            </Text>
          </View>

          {/* Test Mode Banner */}
          <View style={styles.testBanner}>
            <Ionicons name="flask" size={16} color="#f59e0b" />
            <Text style={styles.testText}>
              وضع الاختبار - اضغط للشراء المجاني
            </Text>
          </View>

          {/* Packages */}
          {loading ? (
            <ActivityIndicator size="large" color="#60a5fa" style={styles.loader} />
          ) : (
            <ScrollView
              style={styles.packagesScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.packagesContainer}
            >
              {packages.map((pkg, index) => renderPackage(pkg, index))}
              
              {/* Footer Note */}
              <View style={styles.footerNote}>
                <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                <Text style={styles.footerText}>معاملات آمنة 100%</Text>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f0f1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRight: {
    width: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(96,165,250,0.1)',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#60a5fa',
  },
  testBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.1)',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  testText: {
    fontSize: 11,
    color: '#f59e0b',
  },
  loader: {
    marginVertical: 60,
  },
  packagesScroll: {
    flex: 1,
  },
  packagesContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  packageCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  packageGradient: {
    padding: 20,
  },
  popularPackage: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderRadius: 20,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: '#fbbf24',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  packageIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  diamondInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  diamondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diamondCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bonusContainer: {
    backgroundColor: 'rgba(16,185,129,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  priceCurrency: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  buyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  purchaseLoader: {
    paddingVertical: 12,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#10b981',
  },
});

export default DiamondShopModal;
