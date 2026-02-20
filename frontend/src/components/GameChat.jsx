// Online Game Chat Component
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Smile, Volume2, VolumeX } from 'lucide-react';
import soundManager from '../utils/soundManager';

const quickMessages = [
  { text: 'مرحباً!', emoji: '👋' },
  { text: 'حظاً موفقاً', emoji: '🍀' },
  { text: 'لعبة جيدة!', emoji: '👏' },
  { text: 'انتظر لحظة', emoji: '⏳' },
  { text: 'شكراً', emoji: '🙏' },
  { text: 'أحسنت!', emoji: '🎉' },
];

const GameChat = ({ isOpen, onClose, gameId, playerId, playerName, opponentName, wsConnection }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (wsConnection) {
      const handleMessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          soundManager.message();
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender: data.sender,
            text: data.message,
            isMe: data.sender === playerId,
            timestamp: new Date()
          }]);
        }
      };

      wsConnection.addEventListener('message', handleMessage);
      return () => wsConnection.removeEventListener('message', handleMessage);
    }
  }, [wsConnection, playerId]);

  const sendMessage = (text) => {
    if (!text.trim() || !wsConnection) return;

    const message = {
      type: 'chat',
      game_id: gameId,
      sender: playerId,
      sender_name: playerName,
      message: text
    };

    wsConnection.send(JSON.stringify(message));
    soundManager.click();

    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: playerId,
      senderName: playerName,
      text: text,
      isMe: true,
      timestamp: new Date()
    }]);

    setNewMessage('');
    setShowQuickMessages(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 left-4 w-80 bg-[#1a1a2e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} />
          <span className="font-semibold">الدردشة</span>
          {opponentName && <span className="text-xs opacity-80">مع {opponentName}</span>}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-3 space-y-2 bg-[#0f0f1a]">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <MessageCircle size={40} className="mx-auto mb-2 opacity-30" />
            <p>ابدأ المحادثة!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.isMe ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                  msg.isMe
                    ? 'bg-blue-600 rounded-br-sm'
                    : 'bg-white/10 rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <span className="text-[10px] opacity-50">
                  {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      {showQuickMessages && (
        <div className="bg-[#1a1a2e] border-t border-white/10 p-2">
          <div className="grid grid-cols-3 gap-1">
            {quickMessages.map((qm, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(`${qm.emoji} ${qm.text}`)}
                className="text-xs bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                {qm.emoji} {qm.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 bg-[#1a1a2e] border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickMessages(!showQuickMessages)}
            className={`p-2 rounded-full transition-colors ${showQuickMessages ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <Smile size={18} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-full transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

// Chat Toggle Button
export const ChatToggleButton = ({ unreadCount, onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-24 left-4 p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all z-40"
  >
    <MessageCircle size={24} />
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
        {unreadCount}
      </span>
    )}
  </button>
);

// Sound Toggle Button
export const SoundToggleButton = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`p-2 rounded-full transition-colors ${enabled ? 'bg-green-600/20 text-green-400' : 'bg-white/10 text-gray-400'}`}
    title={enabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
  >
    {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
  </button>
);

export default GameChat;
