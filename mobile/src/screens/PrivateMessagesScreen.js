// صفحة البريد الخاص - Private Messages Screen
// التراسل مع الأصدقاء والبريد الوارد

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const { width } = Dimensions.get('window');

// مكون عنصر البريد الوارد
const InboxItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.inboxItem} onPress={() => onPress(item)}>
      <View style={styles.inboxAvatar}>
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6']}
          style={styles.avatarPlaceholder}
        >
          <Text style={styles.avatarText}>{item.from_user_name?.charAt(0) || '?'}</Text>
        </LinearGradient>
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count}</Text>
          </View>
        )}
      </View>

      <View style={styles.inboxInfo}>
        <Text style={styles.inboxName}>{item.from_user_name}</Text>
        <Text style={styles.inboxPreview} numberOfLines={1}>{item.last_message}</Text>
      </View>

      <View style={styles.inboxMeta}>
        <Text style={styles.inboxTime}>
          {new Date(item.last_time).toLocaleDateString('ar-SA')}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#444" />
      </View>
    </TouchableOpacity>
  );
};

// مكون الرسالة
const MessageItem = ({ message, isOwn, onReport }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
      <TouchableOpacity 
        style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}
        onLongPress={() => !isOwn && onReport && onReport(message)}
      >
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {message.message}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {formatTime(message.created_at)}
          </Text>
          {isOwn && (
            <Ionicons 
              name={message.read ? "checkmark-done" : "checkmark"} 
              size={14} 
              color={message.read ? "#22c55e" : "rgba(255,255,255,0.4)"} 
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

// مكون المحادثة
const ConversationView = ({ user, friend, onBack, onReport }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    loadMessages();
    
    pollInterval.current = setInterval(() => {
      loadMessages(false);
    }, 3000);

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const res = await api.fetch(`/api/social/messages/conversation/${user?.id}/${friend.id || friend.from_user_id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await api.fetch('/api/social/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          from_user_id: user?.id,
          to_user_id: friend.id || friend.from_user_id,
          from_user_name: user?.name || 'مستخدم',
          message: newMessage.trim()
        }),
      });

      if (res.ok) {
        setNewMessage('');
        loadMessages(false);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        const error = await res.json();
        Alert.alert('خطأ', error.detail || 'حدث خطأ');
      }
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSending(false);
    }
  };

  const handleReport = (message) => {
    Alert.alert(
      'الإبلاغ عن الرسالة',
      'هل تريد الإبلاغ عن هذه الرسالة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إبلاغ',
          style: 'destructive',
          onPress: () => onReport && onReport(message, friend)
        }
      ]
    );
  };

  return (
    <View style={styles.conversationContainer}>
      {/* Header */}
      <View style={styles.conversationHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.conversationHeaderInfo}>
          <Text style={styles.conversationName}>{friend.name || friend.from_user_name}</Text>
          <Text style={styles.conversationStatus}>صديق</Text>
        </View>

        <TouchableOpacity 
          style={styles.reportBtn}
          onPress={() => Alert.alert('إبلاغ', 'اضغط مطولاً على أي رسالة للإبلاغ عنها')}
        >
          <Ionicons name="flag-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.messagesArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#444" />
            <Text style={styles.emptyText}>ابدأ المحادثة!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageItem
                message={item}
                isOwn={item.from_user_id === user?.id}
                onReport={handleReport}
              />
            )}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
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
      </KeyboardAvoidingView>
    </View>
  );
};

// المكون الرئيسي
const PrivateMessagesScreen = ({ user, onClose, initialFriend }) => {
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(initialFriend || null);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!initialFriend) {
      loadInbox();
    }
  }, []);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const res = await api.fetch(`/api/social/messages/inbox/${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setInbox(data.inbox || []);
        setTotalUnread(data.total_unread || 0);
      }
    } catch (e) {
      console.error('Error loading inbox:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (message, friend) => {
    try {
      const res = await api.fetch('/api/social/report', {
        method: 'POST',
        body: JSON.stringify({
          reporter_id: user?.id,
          reported_user_id: friend.id || friend.from_user_id,
          report_type: 'inappropriate',
          content_type: 'private_message',
          content_id: message.id,
          reason: 'رسالة مخالفة'
        }),
      });

      if (res.ok) {
        Alert.alert('تم', 'تم تقديم البلاغ وسيتم مراجعته');
      }
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ');
    }
  };

  if (selectedConversation) {
    return (
      <ConversationView
        user={user}
        friend={selectedConversation}
        onBack={() => {
          setSelectedConversation(null);
          loadInbox();
        }}
        onReport={handleReport}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>البريد الخاص</Text>
          <View style={styles.unreadBadgeHeader}>
            <Ionicons name="mail" size={16} color="#3b82f6" />
            <Text style={styles.unreadCount}>{totalUnread}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBar}>
          <Ionicons name="information-circle" size={14} color="#22c55e" />
          <Text style={styles.infoText}>الرسائل الخاصة مجانية للأصدقاء</Text>
        </View>

        {/* Inbox */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : inbox.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={60} color="#444" />
            <Text style={styles.emptyText}>البريد فارغ</Text>
            <Text style={styles.emptySubtext}>ابدأ محادثة مع أصدقائك!</Text>
          </View>
        ) : (
          <FlatList
            data={inbox}
            keyExtractor={(item) => item.from_user_id}
            renderItem={({ item }) => (
              <InboxItem item={item} onPress={setSelectedConversation} />
            )}
            contentContainerStyle={styles.inboxList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,15,0.55)' },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  unreadBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  unreadCount: { color: '#3b82f6', fontWeight: 'bold', fontSize: 14 },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  infoText: { color: '#22c55e', fontSize: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: { color: '#666', fontSize: 16, marginTop: 16 },
  emptySubtext: { color: '#444', fontSize: 14, marginTop: 8 },
  inboxList: { padding: 16, paddingBottom: 100 },
  // Inbox Item
  inboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inboxAvatar: { marginRight: 12, position: 'relative' },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  inboxInfo: { flex: 1 },
  inboxName: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  inboxPreview: { color: '#888', fontSize: 13 },
  inboxMeta: { alignItems: 'flex-end', gap: 4 },
  inboxTime: { color: '#666', fontSize: 11 },
  // Conversation
  conversationContainer: { flex: 1, backgroundColor: '#0a0a0f' },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0a0a0f',
  },
  conversationHeaderInfo: { flex: 1, marginLeft: 12 },
  conversationName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  conversationStatus: { color: '#22c55e', fontSize: 12 },
  reportBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesArea: { flex: 1 },
  messagesList: { padding: 12, paddingBottom: 20 },
  messageContainer: { flexDirection: 'row', marginBottom: 12 },
  ownMessageContainer: { justifyContent: 'flex-end' },
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
  },
  messageText: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  ownMessageText: { color: '#FFF' },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  ownMessageTime: { color: 'rgba(255,255,255,0.6)' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
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
  sendBtnDisabled: { backgroundColor: '#333' },
});

export default PrivateMessagesScreen;
