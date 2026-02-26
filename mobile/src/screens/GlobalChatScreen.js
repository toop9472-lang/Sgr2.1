// صفحة الدردشة العامة - Global Chat Screen
// دردشة مفتوحة مقابل الألماس (5 ألماسات لكل رسالة)
// سيرفرات: عربي، إنجليزي، عالمي مع ترجمة

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

// السيرفرات المتاحة
const SERVERS = [
  { id: 'arabic', name: 'العربي', icon: 'flag', color: '#22c55e', language: 'ar' },
  { id: 'english', name: 'English', icon: 'globe-outline', color: '#3b82f6', language: 'en' },
  { id: 'global', name: 'العالمي', icon: 'earth', color: '#9333ea', language: 'multi' },
];

const MESSAGE_COST = 5; // تكلفة الرسالة بالألماسات

// مكون الرسالة
const ChatMessageItem = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
      {!isOwn && (
        <View style={styles.avatarContainer}>
          {message.user_avatar ? (
            <Image source={{ uri: message.user_avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0') }]}>
              <Text style={styles.avatarText}>{message.user_name?.charAt(0) || '?'}</Text>
            </View>
          )}
        </View>
      )}
      
      <View style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}>
        {!isOwn && (
          <Text style={styles.userName}>{message.user_name}</Text>
        )}
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {message.message}
        </Text>
        <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

// مكون اختيار السيرفر
const ServerSelector = ({ servers, selectedServer, onSelect }) => {
  return (
    <View style={styles.serverSelector}>
      {servers.map(server => (
        <TouchableOpacity
          key={server.id}
          style={[
            styles.serverTab,
            selectedServer?.id === server.id && { backgroundColor: server.color + '30', borderColor: server.color }
          ]}
          onPress={() => onSelect(server)}
        >
          <Ionicons 
            name={server.icon} 
            size={18} 
            color={selectedServer?.id === server.id ? server.color : '#888'} 
          />
          <Text style={[
            styles.serverTabText,
            selectedServer?.id === server.id && { color: server.color }
          ]}>
            {server.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// نافذة تنبيه نقص الألماس
const InsufficientDiamondsModal = ({ visible, onWatchAds, onClose, currentDiamonds }) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.modalGradient}
        >
          <View style={styles.modalIconContainer}>
            <Ionicons name="diamond" size={50} color="#ef4444" />
          </View>
          
          <Text style={styles.modalTitle}>انتهت ألماساتك!</Text>
          <Text style={styles.modalDesc}>
            رصيدك الحالي: {currentDiamonds} ألماسة
          </Text>
          <Text style={styles.modalDesc}>
            تحتاج {MESSAGE_COST} ألماسات لإرسال رسالة
          </Text>

          <TouchableOpacity style={styles.watchAdsBtn} onPress={onWatchAds}>
            <LinearGradient
              colors={['#ec4899', '#9333ea']}
              style={styles.watchAdsGradient}
            >
              <Ionicons name="play-circle" size={24} color="#FFF" />
              <Text style={styles.watchAdsText}>شاهد إعلانات واحصل على الألماس</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
            <Text style={styles.closeModalText}>إغلاق</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

// المكون الرئيسي
const GlobalChatScreen = ({ user, onClose, onNavigateToFortunes }) => {
  const [selectedServer, setSelectedServer] = useState(SERVERS[0]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [diamonds, setDiamonds] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const flatListRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    loadBalance();
    loadMessages();
    
    // Poll for new messages every 3 seconds
    pollInterval.current = setInterval(() => {
      loadMessages(false);
    }, 3000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [selectedServer]);

  const loadBalance = async () => {
    try {
      const response = await api.getBalance(user?.id);
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
      
      const response = await api.fetch(`/api/economy/chat/messages/${selectedServer.id}?limit=100`);
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
    
    // Check balance
    if (diamonds < MESSAGE_COST) {
      setShowInsufficientModal(true);
      return;
    }

    setSending(true);
    
    try {
      const response = await api.fetch('/api/economy/chat/send', {
        method: 'POST',
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
        
        // Add message to list
        setMessages(prev => [...prev, data.chat_message]);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        const error = await response.json();
        if (error.detail?.error === 'insufficient_diamonds') {
          setShowInsufficientModal(true);
        } else {
          Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الرسالة');
        }
      }
    } catch (e) {
      console.log('Error sending message:', e);
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSending(false);
    }
  };

  const handleServerChange = (server) => {
    setSelectedServer(server);
    setMessages([]);
    setLoading(true);
  };

  const handleWatchAds = () => {
    setShowInsufficientModal(false);
    if (onNavigateToFortunes) {
      onNavigateToFortunes();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a1a2e']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Ionicons name="chatbubbles" size={22} color="#60a5fa" />
            <Text style={styles.headerTitle}>الدردشة العامة</Text>
          </View>

          <View style={styles.diamondBadge}>
            <Ionicons name="diamond" size={16} color="#60a5fa" />
            <Text style={styles.diamondText}>{diamonds}</Text>
          </View>
        </View>

        {/* Cost Info */}
        <View style={styles.costInfo}>
          <Ionicons name="information-circle" size={14} color="#f59e0b" />
          <Text style={styles.costText}>تكلفة الرسالة: {MESSAGE_COST} ألماسات</Text>
        </View>

        {/* Server Selector */}
        <ServerSelector
          servers={SERVERS}
          selectedServer={selectedServer}
          onSelect={handleServerChange}
        />

        {/* Messages List */}
        <KeyboardAvoidingView 
          style={styles.messagesContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#60a5fa" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={60} color="#444" />
              <Text style={styles.emptyText}>لا توجد رسائل</Text>
              <Text style={styles.emptySubtext}>كن أول من يبدأ المحادثة!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatMessageItem
                  message={item}
                  isOwn={item.user_id === user?.id}
                />
              )}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="اكتب رسالتك..."
                placeholderTextColor="#666"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Balance Warning */}
            {diamonds < MESSAGE_COST * 3 && diamonds >= MESSAGE_COST && (
              <View style={styles.lowBalanceWarning}>
                <Ionicons name="warning" size={12} color="#f59e0b" />
                <Text style={styles.lowBalanceText}>
                  رصيدك منخفض! يمكنك إرسال {Math.floor(diamonds / MESSAGE_COST)} رسالة فقط
                </Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Insufficient Diamonds Modal */}
        <InsufficientDiamondsModal
          visible={showInsufficientModal}
          onWatchAds={handleWatchAds}
          onClose={() => setShowInsufficientModal(false)}
          currentDiamonds={diamonds}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
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
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  diamondBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  diamondText: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontSize: 14,
  },
  costInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  costText: {
    color: '#f59e0b',
    fontSize: 12,
  },
  serverSelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  serverTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  serverTabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 8,
  },
  messagesList: {
    padding: 12,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  ownMessageBubble: {
    backgroundColor: '#3b82f6',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  userName: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFF',
  },
  messageTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'left',
  },
  ownMessageTime: {
    textAlign: 'right',
    color: 'rgba(255,255,255,0.6)',
  },
  inputContainer: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#333',
  },
  lowBalanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 8,
  },
  lowBalanceText: {
    color: '#f59e0b',
    fontSize: 11,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239,68,68,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 6,
  },
  watchAdsBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
  },
  watchAdsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  watchAdsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeModalBtn: {
    marginTop: 16,
    padding: 10,
  },
  closeModalText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});

export default GlobalChatScreen;
