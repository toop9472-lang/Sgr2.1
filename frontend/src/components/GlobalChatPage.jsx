// صفحة الدردشة العامة الاحترافية للويب - Professional Global Chat
// دردشة مفتوحة مع إيموجي صقر الخاصة بالتطبيق
// تصميم احترافي متقدم مع تفاعلات سلسة

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Diamond, MessageCircle, Globe, Flag, AlertCircle, Play, Sparkles, X, Smile } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MESSAGE_COST = 5;

// إيموجي صقر الخاصة بالتطبيق - ملصقات مربعة بدون خلفية
const SAQR_EMOJIS = [
  { id: 'thumbsup', name: 'أعجبني', url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/f22b7d699297f76a166f1e960d062f79e7683bf0793eb49ebed98517bc4ac4be.png', code: ':saqr_thumbsup:' },
  { id: 'love', name: 'حب', url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/1986500ba27ff6f8bc3238238c83c5a153cd88c6d06be7d21bde5759d04e8b74.png', code: ':saqr_love:' },
  { id: 'laugh', name: 'ضحك', url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/ad26704f95a65c309b106a20abe826fffeddf3b546d7cb84212d8d8c27239fd2.png', code: ':saqr_laugh:' },
  { id: 'sad', name: 'حزين', url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/85503815583adf764d273a3c420c0bf8d5cb76ed9e6707a9ae47ee3c3f33f4ca.png', code: ':saqr_sad:' },
  { id: 'cool', name: 'كول', url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/a0fcd10be8e9d67e883f695ce00ed136e6d130347fb3e3853198894a50dae715.png', code: ':saqr_cool:' },
  { id: 'wow', name: 'واو', url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/104eaa1feb35860efe174495bb5b919b46395645b4923abf89a01199c9e12d28.png', code: ':saqr_wow:' },
  { id: 'think', name: 'تفكير', url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/8af48afde2fd0a07cb8726c6d7f0a88466cd419e06709f1f4b065e895780e565.png', code: ':saqr_think:' },
  { id: 'win', name: 'فوز', url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/a71a67e5191b570ad0a9c06dbc9db72140b663b6c7535f9fe79a7b0ccf1ba95a.png', code: ':saqr_win:' },
];

const SERVERS = [
  { id: 'arabic', name: 'العربي', icon: Flag, color: '#22c55e', gradient: 'from-green-500 to-green-600', language: 'ar' },
  { id: 'english', name: 'English', icon: Globe, color: '#3b82f6', gradient: 'from-blue-500 to-blue-600', language: 'en' },
  { id: 'global', name: 'العالمي', icon: Sparkles, color: '#9333ea', gradient: 'from-purple-500 to-purple-600', language: 'multi' },
];

// تحويل أكواد الإيموجي إلى صور
const parseMessageWithEmojis = (text) => {
  const parts = [];
  let remaining = text;
  let key = 0;

  SAQR_EMOJIS.forEach(emoji => {
    const regex = new RegExp(emoji.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    remaining = remaining.replace(regex, `{{EMOJI:${emoji.id}}}`);
  });

  const segments = remaining.split(/({{EMOJI:\w+}})/);
  
  segments.forEach(segment => {
    const match = segment.match(/{{EMOJI:(\w+)}}/);
    if (match) {
      const emoji = SAQR_EMOJIS.find(e => e.id === match[1]);
      if (emoji) {
        parts.push({ type: 'emoji', url: emoji.url, key: key++ });
      }
    } else if (segment) {
      parts.push({ type: 'text', content: segment, key: key++ });
    }
  });

  return parts;
};

// مكون عرض الرسالة مع الإيموجي
const MessageContent = ({ text }) => {
  const parts = parseMessageWithEmojis(text);
  
  return (
    <span className="inline-flex flex-wrap items-center">
      {parts.map(part => {
        if (part.type === 'emoji') {
          return (
            <img
              key={part.key}
              src={part.url}
              alt="emoji"
              className="inline-block w-12 h-12 mx-1"
            />
          );
        }
        return <span key={part.key}>{part.content}</span>;
      })}
    </span>
  );
};

// مكون الرسالة الاحترافي
const ChatMessage = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarColor = () => {
    const colors = ['bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-red-500'];
    const index = (message.user_name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-slideIn`}>
      {!isOwn && (
        <button
          type="button"
          onClick={() => onAvatarClick && message.user_id && onAvatarClick(message.user_id)}
          className={`w-10 h-10 rounded-full ${getAvatarColor()} flex items-center justify-center mr-3 flex-shrink-0 ring-2 ring-white/20 hover:ring-blue-400/60 transition-all overflow-hidden`}
          data-testid={`chat-avatar-${message.id || message.user_id}`}
        >
          {message.user_avatar ? (
            <img src={message.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-white font-bold text-sm">{message.user_name?.charAt(0) || '?'}</span>
          )}
        </button>
      )}
      
      <div 
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isOwn 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 rounded-br-sm shadow-lg shadow-blue-500/20' 
            : 'bg-white/10 rounded-bl-sm backdrop-blur-sm border border-white/5'
        }`}
      >
        {!isOwn && (
          <p className="text-blue-400 text-xs font-semibold mb-1">{message.user_name}</p>
        )}
        <p className="text-white text-sm leading-relaxed">
          <MessageContent text={message.message} />
        </p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <p className={`text-xs ${isOwn ? 'text-white/60' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </p>
          {isOwn && (
            <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

// لوحة إيموجي صقر
const SaqrEmojiPicker = ({ visible, onSelect, onClose }) => {
  if (!visible) return null;

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-2xl p-4 shadow-2xl border border-white/10 animate-slideUp">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">إيموجي صقر</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {SAQR_EMOJIS.map(emoji => (
          <button
            key={emoji.id}
            onClick={() => onSelect(emoji)}
            className="flex flex-col items-center p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-110"
          >
            <img src={emoji.url} alt={emoji.name} className="w-14 h-14 mb-1" />
            <span className="text-gray-400 text-xs">{emoji.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// نافذة نقص الألماس
const InsufficientDiamondsModal = ({ visible, onWatchAds, onClose, currentDiamonds }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-3xl max-w-sm w-full p-8 text-center border border-white/10 shadow-2xl animate-scaleIn">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center ring-4 ring-red-500/20">
          <Diamond className="w-12 h-12 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-4">انتهت ألماساتك!</h3>
        
        <div className="flex items-center justify-center gap-2 bg-blue-500/10 py-3 px-6 rounded-xl mb-4">
          <Diamond className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 text-2xl font-bold">{currentDiamonds}</span>
          <span className="text-blue-400 text-sm">رصيدك الحالي</span>
        </div>
        
        <p className="text-gray-400 mb-6">تحتاج {MESSAGE_COST} ألماسات لإرسال رسالة</p>

        <button 
          onClick={onWatchAds}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/20"
        >
          <Play className="w-5 h-5" />
          شاهد إعلانات واحصل على الألماس
        </button>

        <button 
          onClick={onClose}
          className="mt-4 text-gray-500 hover:text-gray-400 transition-colors"
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
};

// المكون الرئيسي
const GlobalChatPage = ({ user, onBack, onNavigateToFortunes }) => {
  const { isDark } = useTheme();
  const { isRTL, t } = useLanguage();
  const [selectedServer, setSelectedServer] = useState(SERVERS[0]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [diamonds, setDiamonds] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(Math.floor(Math.random() * 50) + 10);
  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    loadBalance();
    loadMessages();
    
    pollInterval.current = setInterval(() => {
      loadMessages(false);
      setOnlineUsers(prev => Math.max(10, prev + Math.floor(Math.random() * 3) - 1));
    }, 3000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [selectedServer]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadBalance = async () => {
    try {
      const response = await fetch(`${API_URL}/api/economy/balance/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setDiamonds(data.diamonds || 0);
      }
    } catch (e) {
      console.log('Error loading balance:', e);
    }
  };

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await fetch(`${API_URL}/api/economy/chat/messages/${selectedServer.id}?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.log('Error loading messages:', e);
    } finally {
      setLoading(false);
    }
  };

  // Link/URL detector — blocks any kind of link in chat to match server policy
  const LINK_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?|t\.me\/[^\s]+|wa\.me\/[^\s]+|bit\.ly\/[^\s]+)/i;

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // SECURITY: Disallow any kind of link in chat
    if (LINK_REGEX.test(newMessage)) {
      alert('🚫 لا يُسمح بإرسال الروابط في الدردشة. يرجى إعادة كتابة رسالتك بدون روابط.');
      return;
    }

    if (diamonds < MESSAGE_COST) {
      setShowInsufficientModal(true);
      return;
    }

    setSending(true);
    
    try {
      const response = await fetch(`${API_URL}/api/economy/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          server_id: selectedServer.id,
          message: newMessage.trim(),
          user_name: user?.name || 'مستخدم',
          user_avatar: user?.avatar,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewMessage('');
        setDiamonds(data.new_balance);
        setMessages(prev => [...prev, data.chat_message]);
      } else {
        const error = await response.json().catch(() => ({}));
        if (error.detail?.error === 'insufficient_diamonds') {
          setShowInsufficientModal(true);
        } else if (typeof error.detail === 'string' && error.detail.includes('روابط')) {
          alert(error.detail);
        } else {
          alert(error.detail || 'حدث خطأ أثناء إرسال الرسالة');
        }
      }
    } catch (e) {
      console.log('Error sending message:', e);
      alert('حدث خطأ في الاتصال');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji.code);
    setShowEmojiPicker(false);
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/4d3046cfc1a9d31450a57219cfbd557c5dbee891f4bc793b5c782bdd9e9c112d.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="min-h-screen flex flex-col bg-[#0a0a0f]/85 backdrop-blur-sm">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={onBack}
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105 border border-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-bold text-white">الدردشة العامة</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-green-400 text-xs">{onlineUsers} متصل الآن</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-blue-500/10 px-4 py-2.5 rounded-full border border-blue-500/30">
              <Diamond className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-bold">{diamonds}</span>
            </div>
          </div>
        </div>

        {/* Cost Info */}
        <div className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm">تكلفة الرسالة: {MESSAGE_COST} ألماسات</span>
        </div>

        {/* Server Selector */}
        <div className="max-w-2xl mx-auto w-full px-4 py-4">
          <div className="flex gap-3">
            {SERVERS.map(server => {
              const Icon = server.icon;
              const isSelected = selectedServer.id === server.id;
              return (
                <button
                  key={server.id}
                  onClick={() => {
                    setSelectedServer(server);
                    setMessages([]);
                    setLoading(true);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border transition-all duration-300 ${
                    isSelected 
                      ? `bg-gradient-to-r ${server.gradient} border-transparent shadow-lg` 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-[1.02]'
                  }`}
                >
                  <Icon className="w-4 h-4" style={{ color: isSelected ? '#FFF' : server.color }} />
                  <span 
                    className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-400'}`}
                  >
                    {server.name}
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white ml-1"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-blue-400 animate-pulse">جاري تحميل الرسائل...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                <MessageCircle className="w-12 h-12 text-blue-500/30" />
              </div>
              <p className="text-lg font-semibold text-gray-400">لا توجد رسائل</p>
              <p className="text-sm mt-2 text-gray-500">كن أول من يبدأ المحادثة!</p>
              <button 
                onClick={() => setShowEmojiPicker(true)}
                className="mt-4 px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 hover:bg-blue-500/20 transition-all"
              >
                ابدأ بإرسال إيموجي صقر!
              </button>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isOwn={msg.user_id === user?.id}
                  onAvatarClick={onOpenUserProfile}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-[#0a0a0f]/95 backdrop-blur-lg border-t border-white/10 p-4">
          <div className="max-w-2xl mx-auto relative">
            {/* Emoji Picker */}
            <SaqrEmojiPicker
              visible={showEmojiPicker}
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
            
            {diamonds < MESSAGE_COST * 3 && diamonds >= MESSAGE_COST && (
              <div className="flex items-center justify-center gap-2 mb-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs">
                  رصيدك منخفض! يمكنك إرسال {Math.floor(diamonds / MESSAGE_COST)} رسالة فقط
                </span>
              </div>
            )}
            
            <div className="flex gap-3 items-end bg-white/5 rounded-2xl p-2 border border-white/10">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <img src={SAQR_EMOJIS[0].url} alt="emoji" className="w-7 h-7" />
              </button>
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب رسالتك..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none py-3 text-sm"
                maxLength={500}
              />
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  newMessage.trim() && !sending
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 hover:scale-105 shadow-lg shadow-blue-500/30'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                }`}
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Insufficient Diamonds Modal */}
        <InsufficientDiamondsModal
          visible={showInsufficientModal}
          onWatchAds={() => {
            setShowInsufficientModal(false);
            if (onNavigateToFortunes) onNavigateToFortunes();
          }}
          onClose={() => setShowInsufficientModal(false)}
          currentDiamonds={diamonds}
        />
      </div>
      
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default GlobalChatPage;
