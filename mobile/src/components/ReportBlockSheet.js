// Reusable "Report / Block" action sheet used across Chat / Reels / Profile.
import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { hapticLight, hapticSuccess, hapticError } from '../utils/haptics';

const REPORT_REASONS = [
  { id: 'spam', label: 'محتوى مزعج / إعلان', icon: 'pricetag-outline' },
  { id: 'abuse', label: 'إساءة أو تنمر', icon: 'warning-outline' },
  { id: 'sexual', label: 'محتوى جنسي / غير لائق', icon: 'eye-off-outline' },
  { id: 'violence', label: 'عنف أو تهديد', icon: 'flash-outline' },
  { id: 'other', label: 'سبب آخر', icon: 'ellipsis-horizontal' },
];

const ReportBlockSheet = ({
  visible,
  onClose,
  reporterUserId,
  targetType, // 'clip' | 'comment' | 'chat_message' | 'user'
  targetId,
  targetUserId,
  targetUserName,
  onBlockedUser,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const headerSubtitle = useMemo(() => {
    if (targetUserName) return `الإجراء على: ${targetUserName}`;
    return 'اختر إجراءً';
  }, [targetUserName]);

  const handleReport = async (reasonId) => {
    if (!reporterUserId || !targetId) {
      Alert.alert('تنبيه', 'سجّل دخولك أولاً.');
      return;
    }
    setSubmitting(true);
    hapticLight();
    try {
      const r = await api.fetch('/api/moderation/report', {
        method: 'POST',
        body: JSON.stringify({
          reporter_id: reporterUserId,
          target_type: targetType,
          target_id: targetId,
          target_user_id: targetUserId,
          reason: reasonId,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        hapticSuccess();
        Alert.alert(
          '🛡️ شكراً لإبلاغك',
          data.message || 'سيراجع فريقنا المحتوى خلال 24 ساعة.',
        );
        onClose && onClose();
      } else {
        hapticError();
        Alert.alert('خطأ', data.detail || 'تعذر إرسال البلاغ.');
      }
    } catch (e) {
      hapticError();
      Alert.alert('خطأ', String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlock = async () => {
    if (!reporterUserId || !targetUserId) return;
    setSubmitting(true);
    hapticLight();
    try {
      const r = await api.fetch('/api/moderation/block', {
        method: 'POST',
        body: JSON.stringify({
          user_id: reporterUserId,
          target_user_id: targetUserId,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        hapticSuccess();
        if (onBlockedUser) onBlockedUser(targetUserId);
        Alert.alert('🚫 تم الحظر', data.message || 'لن ترى محتوى هذا المستخدم بعد الآن.');
        onClose && onClose();
      } else {
        hapticError();
        Alert.alert('خطأ', data.detail || 'تعذر حظر المستخدم.');
      }
    } catch (e) {
      hapticError();
      Alert.alert('خطأ', String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>الإبلاغ أو الحظر</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>

          <Text style={styles.sectionLabel}>سبب الإبلاغ</Text>
          {REPORT_REASONS.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.row}
              onPress={() => handleReport(r.id)}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={r.icon} size={18} color="#fbbf24" />
              </View>
              <Text style={styles.rowText}>{r.label}</Text>
              <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          ))}

          {targetUserId && targetType !== 'user' && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={[styles.row, styles.blockRow]}
                onPress={handleBlock}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <View style={[styles.rowIcon, styles.blockIcon]}>
                  <Ionicons name="hand-left" size={18} color="#fca5a5" />
                </View>
                <Text style={[styles.rowText, styles.blockText]}>
                  حظر المستخدم — لن ترى محتواه
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelText}>إلغاء</Text>
          </TouchableOpacity>

          {submitting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fbbf24" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: { flex: 1 },
  sheet: {
    backgroundColor: '#111118',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 8,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    textAlign: 'right',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
  },
  blockRow: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
  },
  blockIcon: { backgroundColor: 'rgba(239,68,68,0.18)' },
  blockText: { color: '#fca5a5' },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
  },
  cancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReportBlockSheet;
