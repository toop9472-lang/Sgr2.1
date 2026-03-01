/**
 * Language Switcher Component - Circular Design (مثل الموبايل)
 * أيقونة دائرية لتغيير اللغة مع modal منبثق في المنتصف
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe, Check, X } from 'lucide-react';

const languages = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

// Modal Component using Portal
const LanguageModal = ({ isOpen, onClose, currentLang, onSelect }) => {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div 
        className="relative w-[340px] max-w-[90vw] bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-xl">اختر اللغة</span>
        </div>

        {/* Languages Grid */}
        <div className="grid grid-cols-2 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onSelect(lang.code);
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:scale-[1.02] ${
                currentLang === lang.code 
                  ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
              data-testid={`lang-option-${lang.code}`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className={`text-sm font-semibold flex-1 text-left ${
                currentLang === lang.code ? 'text-blue-400' : 'text-white/70'
              }`}>
                {lang.name}
              </span>
              {currentLang === lang.code && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
};

const LanguageSwitcher = ({ className = '' }) => {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <>
      {/* Circular Button - مثل الموبايل */}
      <button
        onClick={() => setIsOpen(true)}
        className={`w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center transition-all shadow-lg hover:scale-105 ${className}`}
        data-testid="language-switcher"
      >
        <span className="text-xl">{currentLang.flag}</span>
      </button>

      {/* Modal */}
      <LanguageModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentLang={language}
        onSelect={changeLanguage}
      />
    </>
  );
};

export default LanguageSwitcher;
