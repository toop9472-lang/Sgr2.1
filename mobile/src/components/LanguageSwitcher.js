// Language Switcher Component - Circular Design
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../i18n/LanguageContext';

const { width } = Dimensions.get('window');

const LANGUAGE_LABELS = {
  ar: 'AR',
  en: 'EN',
  fr: 'FR',
  tr: 'TR',
};

const LanguageSwitcher = ({ onLanguageChange, style }) => {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  const selectLanguage = async (langCode) => {
    try {
      await setLanguage(langCode);
      // Backward compatibility for screens still reading legacy key.
      await AsyncStorage.setItem('saqr_language', langCode);
      setShowModal(false);
      if (onLanguageChange) {
        onLanguageChange(langCode);
      }
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const uiLanguages = supportedLanguages.map((lang) => ({
    ...lang,
    shortLabel: LANGUAGE_LABELS[lang.code] || lang.code.toUpperCase(),
  }));
  const currentLang = uiLanguages.find(l => l.code === language) || uiLanguages[0];

  return (
    <>
      {/* Circular Button */}
      <TouchableOpacity 
        style={[styles.circleButton, style]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.flagEmoji}>{currentLang.shortLabel}</Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="globe-outline" size={24} color="#60a5fa" />
              <Text style={styles.modalTitle}>اختر اللغة</Text>
            </View>

            {/* Languages Grid */}
            <View style={styles.languagesGrid}>
              {uiLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    language === lang.code && styles.languageItemSelected
                  ]}
                  onPress={() => selectLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langFlag}>{lang.shortLabel}</Text>
                  <Text style={[
                    styles.langName,
                    language === lang.code && styles.langNameSelected
                  ]}>
                    {lang.name}
                  </Text>
                  {language === lang.code && (
                    <View style={styles.checkMark}>
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Circular Button
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  flagEmoji: {
    fontSize: 22,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },

  // Languages Grid
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  languageItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  languageItemSelected: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderColor: 'rgba(59,130,246,0.5)',
  },
  langFlag: {
    fontSize: 24,
  },
  langName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  langNameSelected: {
    color: '#60a5fa',
  },
  checkMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LanguageSwitcher;
