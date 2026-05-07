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
const SYSTEM_CONTEXT = `أنت المساعد الذكي الرسمي لتطبيق صقر — منصة عربية لمشاهدة إعلانات Google AdMob، نشر مقاطع ريلز قصيرة، والدردشة العامة.

قواعد الرد:
1) أسلوبك احترافي وودود وواضح، باللغة العربية الفصحى.
2) ردودك قصيرة ومنظمة في نقاط عند الحاجة.
3) إذا كانت الرسالة بسيطة (مثل: مرحباً، شكراً، تمام) رد بشكل طبيعي ولطيف ثم اعرض المساعدة.
4) لا تختلق معلومات غير مؤكدة.

معلومات التطبيق الدقيقة:
- جواهر صقر: العملة الوحيدة داخل التطبيق.
- كل إعلان Google AdMob مكتمل يمنح المستخدم 5 جواهر صقر (مكافأة ثابتة).
- الاستبدال المالي: 500 جوهرة = 3 ريال سعودي.
- مقاطع الريلز: حد أقصى 15 ثانية لكل مقطع، مع إعجابات وتعليقات ومتابعة.
- الدردشة العامة: مجانية بالكامل وتعمل 24/7.
- ثروات صقر: فرص ربح إضافية بالجواهر.

المطلوب منك:
- شرح خطوات عملية للمستخدم بسرعة.
- مساعدته في حل المشكلات التقنية الشائعة.
- اقتراح أفضل طريقة للكسب داخل التطبيق حسب سؤاله.`;

const AIChatModal = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'مرحباً! أنا مساعد صقر الذكي.\nأقدر أساعدك في الجواهر، الإعلانات، الريلز، الدردشة، والسحب.\n\nاكتب سؤالك مباشرة وسأعطيك خطوات واضحة.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Quick suggestions
  const suggestions = [
    'كيف أكسب جواهر؟',
    'كيف أنشر مقطع ريلز؟',
    'كيف أسحب أرباحي؟',
    'مرحباً',
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
      return 'جواهر صقر هي العملة الرئيسية والوحيدة داخل التطبيق:\n\n• 500 جوهرة = 3 ريال سعودي\n• تحصل عليها من مشاهدة الإعلانات المكتملة فقط\n• كل إعلان مكتمل = 5 جواهر صقر\n• الدردشة العامة مجانية بالكامل';
    }

    if (q.includes('مرحبا') || q.includes('هلا') || q.includes('السلام') || q.includes('hello') || q.includes('hi')) {
      return 'أهلاً وسهلاً بك!\nأنا جاهز لمساعدتك.\nهل تريد مساعدة في الجواهر، الإعلانات، السحب، أو الحساب؟';
    }

    if (q.includes('شكرا') || q.includes('يسلم') || q.includes('thanks')) {
      return 'على الرحب والسعة! إذا تحب، أقدر أعطيك خطة سريعة لزيادة جواهر صقر يومياً.';
    }
    
    if (q.includes('ثروات') || q.includes('fortunes')) {
      return 'ثروات صقر - مركز المكافآت:\n\n• شاهد إعلان AdMob مكتمل واحصل على 5 جواهر صقر\n• تابع التقدم اليومي لعدد الإعلانات\n• راقب قيمة رصيدك نحو السحب (500 جوهرة = 3 ريال)';
    }
    
    if (q.includes('سحب') || q.includes('تحويل') || q.includes('withdraw')) {
      return 'سحب الأرباح:\n\n• الحد الأدنى: 500 جوهرة (3 ريال)\n• طرق السحب: تحويل بنكي، STC Pay\n• مدة المعالجة: 1-3 أيام عمل\n\nاذهب إلى حسابي > سحب الرصيد';
    }
    
    if (q.includes('ألعاب') || q.includes('games') || q.includes('لعب')) {
      return 'التطبيق حالياً يركز على المقاطع القصيرة وثروات صقر والدردشة الاجتماعية، وتمت إزالة قسم الألعاب في التحديث الأخير.';
    }
    
    if (q.includes('ألماس') || q.includes('diamond')) {
      return 'تم إلغاء الألماس بالكامل من التطبيق. العملة الوحيدة الآن هي جواهر صقر: كل إعلان مكتمل يعطي 5 جواهر، و500 جوهرة = 3 ريال سعودي.';
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
