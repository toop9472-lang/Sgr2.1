// AI Chat Component - Modal with AI assistant for Saqr App
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import storage from '../services/storage';
import colors from '../styles/colors';

// AI System Context for Saqr App
const SYSTEM_CONTEXT = `أنت المساعد الذكي لتطبيق صقر - منصة ألعاب ومكافآت متكاملة. إليك معلومات عن التطبيق:

## نظام العملات:
1. **جواهر صقر (Saqr Gems)**: عملة للاستبدال بالمال الحقيقي
   - 500 جوهرة = 1 ريال سعودي
   - تكسبها من: مشاهدة الإعلانات، عجلة الحظ، صناديق الكنز، التحديات اليومية
   - لا يمكن إنفاقها داخل التطبيق

2. **الألماس (Diamonds)**: عملة داخل التطبيق
   - تكسبه من: الألعاب، الانتصارات، المكافآت
   - يستخدم في: الدردشة العامة (5 ألماسات/رسالة)، متجر الألماس

## الألعاب المتوفرة:
- شطرنج (Chess) - لعبة استراتيجية
- إكس أو (Tic Tac Toe) - لعبة سريعة
- أسئلة ثقافية (Trivia) - 50 سؤال
- رياضيات سريعة (Speed Math)
- سلسلة الكلمات (Word Chain)
- ألغاز (Puzzle)
- الثعبان (Snake)
- الذاكرة (Memory)
- 2048
- تتريس (Tetris)
- AI Quest - تحدي الذكاء الاصطناعي
- Fruit Ninja

## ثروات صقر (Saqr Fortunes):
- مشاهدة إعلانات مكافأة
- عجلة الحظ للجواهر
- صناديق الكنز (برونزي، فضي، ذهبي، بلاتيني، أسطوري)
- تحديات يومية مع مكافآت

## الميزات الاجتماعية:
- الدردشة العامة (عربي، إنجليزي، عالمي)
- نظام الأصدقاء
- الرسائل الخاصة
- دعوات اللعب

## السحب والتحويل:
- الحد الأدنى: 500 جوهرة (1 ريال)
- طرق السحب: تحويل بنكي، STC Pay

أجب على أسئلة المستخدمين بوضوح واختصار. ساعدهم في:
- فهم نظام المكافآت
- حل مشاكل الألعاب
- شرح كيفية كسب المزيد من الجواهر
- الإجابة على الأسئلة التقنية`;

const AIChatModal = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'مرحباً! 👋 أنا مساعدك الذكي في تطبيق صقر.\n\nيمكنني مساعدتك في:\n• شرح نظام الجواهر والألماس\n• معرفة كيفية كسب المكافآت\n• حل مشاكل الألعاب\n• الإجابة على أي سؤال\n\nكيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Quick suggestions
  const suggestions = [
    'كيف أكسب جواهر؟',
    'ما هي ثروات صقر؟',
    'كيف أسحب أرباحي؟',
    'الألعاب المتوفرة',
  ];

  const sendMessage = async (messageText = null) => {
    const userMessage = (messageText || inputText).trim();
    if (!userMessage || isLoading) return;
    
    setInputText('');
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const token = await storage.getToken();
      const conversation = updatedMessages
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .slice(-10);

      let response = await api.sendChatConversation(conversation, token, SYSTEM_CONTEXT);

      // Retry once for transient backend failures
      if (!response.ok && [429, 500, 502, 503, 504].includes(response.status)) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        response = await api.sendChatConversation(conversation, token, SYSTEM_CONTEXT);
      }

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const aiResponse = data.response || data.message || data.content || 'تم استلام رسالتك!';
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: aiResponse
        }]);
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      // Provide helpful offline responses
      const offlineResponse = getOfflineResponse(userMessage);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: offlineResponse
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Offline responses for common questions
  const getOfflineResponse = (question) => {
    const q = question.toLowerCase();
    
    if (q.includes('جواهر') || q.includes('gems')) {
      return '💎 جواهر صقر هي العملة الرئيسية للسحب:\n\n• 500 جوهرة = 1 ريال سعودي\n• تكسبها من مشاهدة الإعلانات\n• عجلة الحظ تعطيك 1-100 جوهرة\n• صناديق الكنز تعطيك مكافآت كبيرة\n\nنصيحة: أكمل التحديات اليومية للحصول على جواهر إضافية!';
    }
    
    if (q.includes('ثروات') || q.includes('fortunes')) {
      return '🎰 ثروات صقر - مركز المكافآت:\n\n• شاهد إعلانات قصيرة واكسب جواهر\n• أدر عجلة الحظ للفوز بجوائز\n• افتح صناديق الكنز المتنوعة\n• أكمل التحديات اليومية\n\nكلما شاهدت أكثر، كسبت أكثر!';
    }
    
    if (q.includes('سحب') || q.includes('تحويل') || q.includes('withdraw')) {
      return '💰 سحب الأرباح:\n\n• الحد الأدنى: 500 جوهرة (1 ريال)\n• طرق السحب: تحويل بنكي، STC Pay\n• مدة المعالجة: 1-3 أيام عمل\n\nاذهب إلى حسابي > سحب الرصيد';
    }
    
    if (q.includes('ألعاب') || q.includes('games') || q.includes('لعب')) {
      return '🎮 الألعاب المتوفرة:\n\n• شطرنج - استراتيجية\n• إكس أو - سريعة\n• أسئلة ثقافية - 50 سؤال\n• رياضيات سريعة\n• ألغاز متنوعة\n• الثعبان، 2048، تتريس\n• AI Quest - تحدي الذكاء\n\nالعب واكسب الألماس والنقاط!';
    }
    
    if (q.includes('ألماس') || q.includes('diamond')) {
      return '💠 الألماس - عملة داخل التطبيق:\n\n• تكسبه من الفوز في الألعاب\n• يستخدم للدردشة العامة (5/رسالة)\n• يستخدم في متجر الألماس\n• لا يمكن سحبه كمال\n\nالعب وانتصر لكسب المزيد!';
    }
    
    return 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً أو التحقق من اتصال الإنترنت.\n\nيمكنك أيضاً زيارة صفحة الدعم للمساعدة.';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <View style={styles.aiIconBg}>
                <Image source={require('../../assets/logo_saqr.png')} style={styles.aiFalconIcon} resizeMode="cover" />
                <View style={styles.aiWaveBadge}>
                  <Ionicons name="hand-right" size={8} color="#0f172a" />
                </View>
              </View>
              <Text style={styles.title}>المساعد الذكي</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Messages */}
          <ScrollView 
            ref={scrollRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
          >
            {messages.map((msg, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userMessage : styles.assistantMessage
                ]}
              >
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </ScrollView>

          {/* Quick Suggestions */}
          {messages.length <= 2 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsContainer}
              contentContainerStyle={styles.suggestionsContent}
            >
              {suggestions.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionBtn}
                  onPress={() => sendMessage(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Input */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="اكتب سؤالك هنا..."
                placeholderTextColor="#9ca3af"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
                onPress={() => sendMessage()}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#0a0a0f', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)' 
  },
  closeBtn: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 20 
  },
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(96,165,250,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  aiFalconIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  aiWaveBadge: {
    position: 'absolute',
    right: -3,
    top: -2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  messagesContainer: { flex: 1, padding: 16 },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 16, marginBottom: 10 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
  assistantMessage: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 4 },
  messageText: { color: '#FFF', fontSize: 15, lineHeight: 24 },

  // Quick Suggestions
  suggestionsContainer: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  suggestionBtn: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    marginRight: 8,
  },
  suggestionText: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '500',
  },

  inputContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'flex-end' 
  },
  input: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    color: '#FFF', 
    fontSize: 16, 
    maxHeight: 100, 
    textAlign: 'right' 
  },
  sendBtn: { 
    width: 44, 
    height: 44, 
    backgroundColor: '#3b82f6', 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 8 
  },
  sendBtnDisabled: { opacity: 0.5 },
});

export default AIChatModal;
