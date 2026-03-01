/**
 * Language Switcher Component - Circular Design (مثل الموبايل)
 * أيقونة دائرية لتغيير اللغة مع قائمة منسدلة
 */
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

const LanguageSwitcher = ({ className = '' }) => {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Circular Button - مثل الموبايل */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center transition-all shadow-lg hover:scale-105"
        data-testid="language-switcher"
      >
        <span className="text-xl">{currentLang.flag}</span>
      </button>

      {/* Modal/Dropdown - تصميم مطابق للموبايل */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[340px] bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl z-50 p-5 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <Globe className="w-6 h-6 text-blue-400" />
              <span className="text-white font-bold text-lg">اختر اللغة</span>
            </div>

            {/* Languages Grid - مثل الموبايل */}
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
                    language === lang.code 
                      ? 'bg-blue-500/20 border-blue-500/50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  data-testid={`lang-option-${lang.code}`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`text-sm font-semibold flex-1 text-left ${
                    language === lang.code ? 'text-blue-400' : 'text-white/70'
                  }`}>
                    {lang.name}
                  </span>
                  {language === lang.code && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      
      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;
