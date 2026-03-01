// صفحة الدردشة العامة للويب - Global Chat Page
// دردشة مفتوحة مقابل الألماس (5 ألماسات لكل رسالة)

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Diamond, MessageCircle, Globe, Flag, AlertCircle, Play, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MESSAGE_COST = 5;

const SERVERS = [
  { id: 'arabic', name: 'العربي', icon: Flag, color: '#22c55e', language: 'ar' },
  { id: 'english', name: 'English', icon: Globe, color: '#3b82f6', language: 'en' },
  { id: 'global', name: 'العالمي', icon: Sparkles, color: '#9333ea', language: 'multi' },
];

// مكون الرسالة
const ChatMessage = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isOwn && (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
          style={{ backgroundColor: '#' + (message.user_id?.slice(-6) || '888888') }}
        >
          <span className="text-white font-bold text-sm">{message.user_name?.charAt(0) || '?'}</span>
        </div>
      )}
      
      <div 
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-blue-500 rounded-br-sm' 
            : 'bg-white/10 rounded-bl-sm'
        }`}
      >
        {!isOwn && (
          <p className="text-blue-400 text-xs font-semibold mb-1">{message.user_name}</p>
        )}
        <p className="text-white text-sm leading-relaxed">{message.message}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-white/60 text-right' : 'text-gray-500'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

// نافذة نقص الألماس
const InsufficientDiamondsModal = ({ visible, onWatchAds, onClose, currentDiamonds }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-3xl max-w-sm w-full p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <Diamond className="w-10 h-10 text-red-400" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3">انتهت ألماساتك!</h3>
        <p className="text-gray-400 mb-2">رصيدك الحالي: {currentDiamonds} ألماسة</p>
        <p className="text-gray-400 mb-6">تحتاج {MESSAGE_COST} ألماسات لإرسال رسالة</p>

        <button 
          onClick={onWatchAds}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all mb-4"
        >
          <Play className="w-5 h-5" />
          شاهد إعلانات واحصل على الألماس
        </button>

        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-400 transition-colors"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

// المكون الرئيسي
const GlobalChatPage = ({ user, onBack, onNavigateToFortunes }) => {
  const [selectedServer, setSelectedServer] = useState(SERVERS[0]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [diamonds, setDiamonds] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    loadBalance();
    loadMessages();
    
    pollInterval.current = setInterval(() => {
      loadMessages(false);
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

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
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
        const error = await response.json();
        if (error.detail?.error === 'insufficient_diamonds') {
          setShowInsufficientModal(true);
        } else {
          alert('حدث خطأ أثناء إرسال الرسالة');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-bold text-white">الدردشة العامة</span>
          </div>

          <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-full">
            <Diamond className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-bold">{diamonds}</span>
          </div>
        </div>
      </div>

      {/* Cost Info */}
      <div className="flex items-center justify-center gap-2 py-2 bg-amber-500/10">
        <AlertCircle className="w-4 h-4 text-amber-400" />
        <span className="text-amber-400 text-sm">تكلفة الرسالة: {MESSAGE_COST} ألماسات</span>
      </div>

      {/* Server Selector */}
      <div className="max-w-2xl mx-auto w-full px-4 py-3">
        <div className="flex gap-2">
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  isSelected 
                    ? 'border-opacity-50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                style={isSelected ? { 
                  backgroundColor: server.color + '20', 
                  borderColor: server.color 
                } : {}}
              >
                <Icon className="w-4 h-4" style={{ color: isSelected ? server.color : '#888' }} />
                <span 
                  className="text-sm font-medium"
                  style={{ color: isSelected ? server.color : '#888' }}
                >
                  {server.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-blue-400 animate-pulse">جاري التحميل...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
            <p>لا توجد رسائل</p>
            <p className="text-sm mt-2">كن أول من يبدأ المحادثة!</p>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={msg.user_id === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-[#0a0a0f]/95 backdrop-blur-lg border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto">
          {diamonds < MESSAGE_COST * 3 && diamonds >= MESSAGE_COST && (
            <div className="flex items-center justify-center gap-2 mb-3 py-2 bg-amber-500/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs">
                رصيدك منخفض! يمكنك إرسال {Math.floor(diamonds / MESSAGE_COST)} رسالة فقط
              </span>
            </div>
          )}
          
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك..."
              className="flex-1 bg-white/10 border border-white/10 rounded-full px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              maxLength={500}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                newMessage.trim() && !sending
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-700 cursor-not-allowed'
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
  );
};

export default GlobalChatPage;
