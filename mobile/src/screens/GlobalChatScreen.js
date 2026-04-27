// صفحة الدردشة العامة الاحترافية - Professional Global Chat
// دردشة مفتوحة مع إيموجي صقر الخاصة بالتطبيق
// تصميم احترافي متقدم مع تفاعلات سلسة

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
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
  Image,
  Animated,
  Modal,
  ScrollView,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import gameSounds from "../utils/gameSounds";
import { useLanguage } from "../i18n/LanguageContext";
import storage from "../services/storage";

const { width, height } = Dimensions.get("window");

// خلفية الدردشة الاحترافية
const CHAT_BG =
  "https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/4d3046cfc1a9d31450a57219cfbd557c5dbee891f4bc793b5c782bdd9e9c112d.png";

// إيموجي صقر الخاصة بالتطبيق - ملصقات مربعة بدون خلفية
const SAQR_EMOJIS = [
  {
    id: "thumbsup",
    name: "أعجبني",
    url: "https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/f22b7d699297f76a166f1e960d062f79e7683bf0793eb49ebed98517bc4ac4be.png",
    code: ":saqr_thumbsup:",
  },
  {
    id: "love",
    name: "حب",
    url: "https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/1986500ba27ff6f8bc3238238c83c5a153cd88c6d06be7d21bde5759d04e8b74.png",
    code: ":saqr_love:",
  },
  {
    id: "laugh",
    name: "ضحك",
    url: "https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/ad26704f95a65c309b106a20abe826fffeddf3b546d7cb84212d8d8c27239fd2.png",
    code: ":saqr_laugh:",
  },
  {
    id: "sad",
    name: "حزين",
    url: "https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/85503815583adf764d273a3c420c0bf8d5cb76ed9e6707a9ae47ee3c3f33f4ca.png",
    code: ":saqr_sad:",
  },
  {
    id: "cool",
    name: "كول",
    url: "https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/a0fcd10be8e9d67e883f695ce00ed136e6d130347fb3e3853198894a50dae715.png",
    code: ":saqr_cool:",
  },
  {
    id: "wow",
    name: "واو",
    url: "https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/104eaa1feb35860efe174495bb5b919b46395645b4923abf89a01199c9e12d28.png",
    code: ":saqr_wow:",
  },
  {
    id: "think",
    name: "تفكير",
    url: "https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/8af48afde2fd0a07cb8726c6d7f0a88466cd419e06709f1f4b065e895780e565.png",
    code: ":saqr_think:",
  },
  {
    id: "win",
    name: "فوز",
    url: "https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/a71a67e5191b570ad0a9c06dbc9db72140b663b6c7535f9fe79a7b0ccf1ba95a.png",
    code: ":saqr_win:",
  },
];

// السيرفرات المتاحة
const SERVERS = [
  {
    id: "arabic",
    name: "العربي",
    icon: "flag",
    color: "#22c55e",
    gradient: ["#22c55e", "#16a34a"],
    language: "ar",
  },
  {
    id: "english",
    name: "English",
    icon: "globe-outline",
    color: "#3b82f6",
    gradient: ["#3b82f6", "#2563eb"],
    language: "en",
  },
  {
    id: "global",
    name: "العالمي",
    icon: "earth",
    color: "#9333ea",
    gradient: ["#9333ea", "#7c3aed"],
    language: "multi",
  },
];

const MESSAGE_COST = 0;

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// تحويل أكواد الإيموجي إلى صور
const parseMessageWithEmojis = (text) => {
  const parts = [];
  let remaining = text;
  let key = 0;

  SAQR_EMOJIS.forEach((emoji) => {
    const regex = new RegExp(
      emoji.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "g",
    );
    remaining = remaining.replace(regex, `{{EMOJI:${emoji.id}}}`);
  });

  const segments = remaining.split(/({{EMOJI:\w+}})/);

  segments.forEach((segment) => {
    const match = segment.match(/{{EMOJI:(\w+)}}/);
    if (match) {
      const emoji = SAQR_EMOJIS.find((e) => e.id === match[1]);
      if (emoji) {
        parts.push({ type: "emoji", url: emoji.url, key: key++ });
      }
    } else if (segment) {
      parts.push({ type: "text", content: segment, key: key++ });
    }
  });

  return parts;
};

// مكون عرض الرسالة مع الإيموجي
const MessageContent = memo(({ text, isOwn }) => {
  const parts = useMemo(() => parseMessageWithEmojis(text), [text]);

  return (
    <View style={styles.messageContentContainer}>
      {parts.map((part) => {
        if (part.type === "emoji") {
          return (
            <Image
              key={part.key}
              source={{ uri: part.url }}
              style={styles.inlineEmoji}
            />
          );
        }
        return (
          <Text
            key={part.key}
            style={[styles.messageText, isOwn && styles.ownMessageText]}
          >
            {part.content}
          </Text>
        );
      })}
    </View>
  );
});

// مكون الرسالة الاحترافي
const ChatMessageItem = memo(({ message, isOwn, chatFrameColor }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvatarColor = () => {
    const colors = [
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ef4444",
    ];
    const index = (message.user_name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  return (
    <Animated.View
      style={[
        styles.messageWrapper,
        isOwn && styles.ownMessageWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {!isOwn && (
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: getAvatarColor() },
          ]}
        >
          {message.user_avatar ? (
            <Image
              source={{ uri: message.user_avatar }}
              style={styles.avatar}
            />
          ) : (
            <Text style={styles.avatarText}>
              {message.user_name?.charAt(0) || "?"}
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isOwn && styles.ownMessageBubble,
          isOwn && chatFrameColor
            ? { borderColor: chatFrameColor, borderWidth: 1 }
            : null,
        ]}
      >
        {!isOwn && <Text style={styles.userName}>{message.user_name}</Text>}
        <MessageContent text={message.message} isOwn={isOwn} />
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && (
            <Ionicons
              name="checkmark-done"
              size={14}
              color="rgba(255,255,255,0.6)"
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
});

// لوحة إيموجي صقر
const SaqrEmojiPicker = ({ visible, onSelect, onClose, title }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.emojiPickerContainer,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <LinearGradient
        colors={["#1a1a2e", "#0f0f1a"]}
        style={styles.emojiPickerGradient}
      >
        <View style={styles.emojiPickerHeader}>
          <Text style={styles.emojiPickerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.emojiPickerClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.emojiList}
        >
          {SAQR_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji.id}
              style={styles.emojiItem}
              onPress={() => {
                gameSounds.buttonTap();
                onSelect(emoji);
              }}
              activeOpacity={0.7}
            >
              <Image source={{ uri: emoji.url }} style={styles.emojiImage} />
              <Text style={styles.emojiName}>{emoji.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
};

// مكون اختيار السيرفر الاحترافي
const ServerSelector = ({ servers, selectedServer, onSelect, onlineCount }) => {
  return (
    <View style={styles.serverSelectorContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.serverScrollContent}
      >
        {servers.map((server) => {
          const isSelected = selectedServer?.id === server.id;
          return (
            <TouchableOpacity
              key={server.id}
              style={styles.serverTabWrapper}
              onPress={() => {
                gameSounds.buttonTap();
                onSelect(server);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isSelected
                    ? server.gradient
                    : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
                }
                style={[
                  styles.serverTab,
                  isSelected && styles.serverTabSelected,
                ]}
              >
                <Ionicons
                  name={server.icon}
                  size={18}
                  color={isSelected ? "#FFF" : "#888"}
                />
                <Text
                  style={[
                    styles.serverTabText,
                    isSelected && styles.serverTabTextSelected,
                  ]}
                >
                  {server.name}
                </Text>
                {isSelected && <View style={styles.onlineDot} />}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// نافذة رصيد غير كافٍ (للتوافق)
const InsufficientBalanceModal = ({
  visible,
  onWatchAds,
  onClose,
  currentBalance,
  copy,
  messageCost,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          <LinearGradient
            colors={["#1a1a2e", "#0f0f1a"]}
            style={styles.modalGradient}
          >
            <View style={styles.modalIconRing}>
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                style={styles.modalIconGradient}
              >
                <Ionicons name="sparkles" size={40} color="#FFF" />
              </LinearGradient>
            </View>

            <Text style={styles.modalTitle}>{copy.noBalanceTitle}</Text>

            <View style={styles.balanceBox}>
              <Ionicons name="sparkles-outline" size={20} color="#60a5fa" />
              <Text style={styles.balanceText}>{currentBalance}</Text>
              <Text style={styles.balanceLabel}>{copy.currentBalance}</Text>
            </View>

            <Text style={styles.modalDesc}>
              {copy.requiresMessageCost.replace("{cost}", String(messageCost))}
            </Text>

            <TouchableOpacity
              style={styles.watchAdsBtn}
              onPress={onWatchAds}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#ec4899", "#9333ea"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.watchAdsGradient}
              >
                <Ionicons name="play-circle" size={24} color="#FFF" />
                <Text style={styles.watchAdsText}>{copy.watchAdsAndEarn}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalText}>{copy.later}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

// المكون الرئيسي
const GlobalChatScreen = ({
  user,
  onClose,
  onNavigateToFortunes,
  onBalanceUpdate,
}) => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const copy = useMemo(
    () => ({
      chatTitle: isArabic ? "الدردشة العامة" : "Global Chat",
      onlineNow: isArabic ? "متصل الآن" : "online now",
      messageCostLabel: isArabic ? "تكلفة الرسالة" : "Message cost",
      loadingMessages: isArabic
        ? "جاري تحميل الرسائل..."
        : "Loading messages...",
      noMessages: isArabic ? "لا توجد رسائل" : "No messages yet",
      beFirst: isArabic
        ? "كن أول من يبدأ المحادثة!"
        : "Be the first to start the chat!",
      startWithEmoji: isArabic
        ? "ابدأ بإرسال إيموجي صقر!"
        : "Start with a Saqr emoji!",
      typeMessagePlaceholder: isArabic
        ? "اكتب رسالتك..."
        : "Type your message...",
      lowBalancePrefix: isArabic
        ? "رصيدك منخفض! يمكنك إرسال"
        : "Low balance! You can send only",
      lowBalanceSuffix: isArabic ? "رسالة فقط" : "messages",
      noBalanceTitle: isArabic
        ? "رصيد الجواهر غير كافٍ"
        : "Insufficient gems balance",
      currentBalance: isArabic ? "رصيدك الحالي" : "Current balance",
      requiresMessageCost: isArabic
        ? "تحتاج {cost} جواهر صقر لإرسال رسالة"
        : "You need {cost} Saqr gems to send a message",
      watchAdsAndEarn: isArabic
        ? "شاهد إعلانات واحصل على الجواهر"
        : "Watch ads and earn Saqr gems",
      later: isArabic ? "لاحقاً" : "Later",
      emojiPickerTitle: isArabic ? "إيموجي صقر" : "Saqr Emojis",
      sendError: isArabic
        ? "حدث خطأ أثناء إرسال الرسالة"
        : "Failed to send message",
      networkError: isArabic ? "حدث خطأ في الاتصال" : "Connection error",
      loginRequired: isArabic
        ? "يجب تسجيل الدخول أولاً"
        : "You need to sign in first",
    }),
    [isArabic],
  );
  const [selectedServer, setSelectedServer] = useState(SERVERS[0]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saqrGems, setSaqrGems] = useState(0);
  const [messageCost, setMessageCost] = useState(MESSAGE_COST);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [chatFrameColor, setChatFrameColor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const pollInterval = useRef(null);
  const balanceInterval = useRef(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const userId = user?.id || user?.user_id;
  const applyGems = useCallback(
    (value) => {
      const normalized = toSafeNumber(value, 0);
      setSaqrGems(normalized);
      if (onBalanceUpdate) {
        onBalanceUpdate({ saqr_gems: normalized, saqr_points: normalized });
      }
    },
    [onBalanceUpdate],
  );

  const normalizedSaqrGems = useMemo(
    () => toSafeNumber(saqrGems, 0),
    [saqrGems],
  );
  const localizedServers = useMemo(() => {
    const namesByLanguage = {
      arabic: { ar: "العربي", en: "Arabic" },
      english: { ar: "الإنجليزي", en: "English" },
      global: { ar: "العالمي", en: "Global" },
    };
    return SERVERS.map((server) => ({
      ...server,
      name: namesByLanguage[server.id]?.[isArabic ? "ar" : "en"] || server.name,
    }));
  }, [isArabic]);

  useEffect(() => {
    const loadChatFrame = async () => {
      try {
        const savedFrame =
          (await AsyncStorage.getItem("selected_chat_frame")) ||
          (await AsyncStorage.getItem("selected_profile_frame"));
        if (!savedFrame) return;
        const parsed = JSON.parse(savedFrame);
        if (Array.isArray(parsed?.colors) && parsed.colors.length > 0) {
          setChatFrameColor(parsed.colors[0]);
        }
      } catch (e) {
        console.log("Chat frame load error:", e);
      }
    };

    loadChatFrame();
  }, []);

  const loadBalance = useCallback(async () => {
    try {
      if (user?.saqr_gems !== undefined) {
        applyGems(user.saqr_gems);
      }

      if (!userId) {
        return;
      }

      const chatBalanceResponse = await api.fetch(
        `/api/economy/chat/check-balance/${encodeURIComponent(userId)}`,
      );
      if (chatBalanceResponse.ok) {
        const data = await chatBalanceResponse.json();
        applyGems(data?.saqr_gems ?? data?.gems ?? 0);
        setMessageCost(toSafeNumber(data?.message_cost, MESSAGE_COST));
        return;
      }

      const fallbackBalanceResponse = await api.getBalance(userId);
      if (fallbackBalanceResponse.ok) {
        const data = await fallbackBalanceResponse.json();
        applyGems(data?.saqr_gems ?? 0);
      }
    } catch (e) {
      if (user?.saqr_gems !== undefined) {
        applyGems(user.saqr_gems);
      }
    }
  }, [applyGems, user?.saqr_gems, userId]);

  const checkChatBalance = useCallback(async () => {
    if (!userId) return null;
    try {
      const response = await api.fetchWithFallback([
        `/api/economy/chat/check-balance/${encodeURIComponent(userId)}`,
        `/api/chat/check-balance/${encodeURIComponent(userId)}`,
      ]);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        saqrGems: toSafeNumber(data?.saqr_gems, 0),
        canSend: Boolean(data?.can_send),
        messageCost: toSafeNumber(data?.message_cost, MESSAGE_COST),
      };
    } catch (e) {
      return null;
    }
  }, [userId]);

  const sendMessage = useCallback(async () => {
    const draft = newMessage;
    const trimmedDraft = draft.trim();
    if (sending || !trimmedDraft) return;

    if (!userId) {
      Alert.alert(copy.chatTitle, copy.loginRequired);
      return;
    }

    if (messageCost > 0 && normalizedSaqrGems < messageCost) {
      const serverBalance = await checkChatBalance();
      if (serverBalance) {
        applyGems(serverBalance.saqrGems);
        setMessageCost(serverBalance.messageCost);
        if (!serverBalance.canSend) {
          gameSounds.wrong();
          setShowInsufficientModal(true);
          return;
        }
      } else {
        gameSounds.wrong();
        setShowInsufficientModal(true);
        return;
      }
    }

    setSending(true);
    setNewMessage("");
    gameSounds.buttonTap();

    try {
      const response = await api.fetchWithFallback(
        ["/api/economy/chat/send", "/api/chat/send"],
        {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            server_id: selectedServer.id,
            message: trimmedDraft,
            user_name: user?.name || "مستخدم",
            user_avatar: user?.avatar,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        applyGems(data?.new_balance ?? normalizedSaqrGems);
        gameSounds.correct();

        if (data.chat_message) {
          const incomingId =
            data.chat_message.id || data.chat_message.message_id;
          setMessages((prev) => {
            if (
              incomingId &&
              prev.some((m) => (m.id || m.message_id) === incomingId)
            ) {
              return prev;
            }
            return [...prev, data.chat_message];
          });
        }

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        let error = {};
        try {
          error = await response.json();
        } catch {
          error = {};
        }
        if (error.detail?.error === "insufficient_saqr_gems") {
          applyGems(error?.detail?.current ?? normalizedSaqrGems);
          setShowInsufficientModal(true);
        } else {
          // Restore draft so user can retry without retyping.
          setNewMessage(trimmedDraft);
          Alert.alert(copy.chatTitle, copy.sendError);
        }
      }
    } catch (e) {
      console.log("Error sending message:", e);
      // Restore draft so user can retry without retyping.
      setNewMessage(trimmedDraft);
      Alert.alert(copy.chatTitle, copy.networkError);
    } finally {
      setSending(false);
    }
  }, [
    applyGems,
    checkChatBalance,
    copy,
    messageCost,
    newMessage,
    normalizedSaqrGems,
    selectedServer.id,
    sending,
    user?.avatar,
    user?.name,
    userId,
  ]);

  const loadMessages = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);

        const response = await api.fetchWithFallback([
          `/api/economy/chat/messages/${selectedServer.id}?limit=100`,
          `/api/chat/messages/${selectedServer.id}?limit=100`,
        ]);
        if (response.ok) {
          const data = await response.json();
          const nextMessages = Array.isArray(data.messages)
            ? data.messages
            : [];
          setMessages(nextMessages);

          const serverOnlineCount = Number(
            data.online_users_count ??
              data.online_users ??
              data.online_count ??
              data.active_users,
          );
          if (Number.isFinite(serverOnlineCount) && serverOnlineCount > 0) {
            setOnlineUsers(serverOnlineCount);
          } else {
            const activeUsers = new Set(
              nextMessages.map((m) => m.user_id).filter(Boolean),
            ).size;
            setOnlineUsers(Math.max(1, activeUsers));
          }
        }
      } catch (e) {
        console.log("Error loading messages:", e);
      } finally {
        setLoading(false);
      }
    },
    [selectedServer.id],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadMessages(false), loadBalance()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadBalance, loadMessages]);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    loadBalance();
    loadMessages();

    pollInterval.current = setInterval(() => {
      loadMessages(false);
    }, 5000);

    balanceInterval.current = setInterval(() => {
      loadBalance();
    }, 12000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      if (balanceInterval.current) {
        clearInterval(balanceInterval.current);
      }
    };
  }, [headerAnim, loadBalance, loadMessages, selectedServer.id]);

  const handleServerChange = useCallback((server) => {
    gameSounds.buttonTap();
    setSelectedServer(server);
    setMessages([]);
    setLoading(true);
    setOnlineUsers(0);
  }, []);

  const handleEmojiSelect = useCallback((emoji) => {
    setNewMessage((prev) => prev + emoji.code);
    setShowEmojiPicker(false);
  }, []);

  const renderMessage = useCallback(
    ({ item }) => (
      <ChatMessageItem
        message={item}
        isOwn={item.user_id === userId}
        chatFrameColor={chatFrameColor}
      />
    ),
    [userId, chatFrameColor],
  );

  const handleWatchAds = () => {
    setShowInsufficientModal(false);
    if (onNavigateToFortunes) {
      onNavigateToFortunes();
    }
  };

  return (
    <ImageBackground
      source={{ uri: CHAT_BG }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="chatbubbles" size={22} color="#60a5fa" />
              <Text style={styles.headerTitle}>{copy.chatTitle}</Text>
            </View>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlinePulse} />
              <Text style={styles.onlineText}>
                {onlineUsers} {copy.onlineNow}
              </Text>
            </View>
          </View>

        </Animated.View>

        {/* Cost Info */}
        <View style={styles.costInfo}>
          <LinearGradient
            colors={["rgba(245,158,11,0.15)", "rgba(245,158,11,0.05)"]}
            style={styles.costGradient}
          >
            <Ionicons name="information-circle" size={14} color="#f59e0b" />
            <Text style={styles.costText}>
              {copy.messageCostLabel}: {messageCost > 0 ? messageCost : "مجاني"}
            </Text>
          </LinearGradient>
        </View>

        {/* Server Selector */}
        <ServerSelector
          servers={localizedServers}
          selectedServer={selectedServer}
          onSelect={handleServerChange}
          onlineCount={onlineUsers}
        />

        {/* Messages List */}
        <KeyboardAvoidingView
          style={styles.messagesContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={100}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#60a5fa" />
              <Text style={styles.loadingText}>{copy.loadingMessages}</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="chatbubble-outline"
                  size={60}
                  color="rgba(96,165,250,0.3)"
                />
              </View>
              <Text style={styles.emptyText}>{copy.noMessages}</Text>
              <Text style={styles.emptySubtext}>{copy.beFirst}</Text>
              <TouchableOpacity
                style={styles.startChatBtn}
                onPress={() => setShowEmojiPicker(true)}
              >
                <Text style={styles.startChatText}>{copy.startWithEmoji}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) =>
                String(
                  item.id ||
                    item.message_id ||
                    `${item.user_id || "u"}-${item.timestamp || "t"}-${index}`,
                )
              }
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              initialNumToRender={16}
              maxToRenderPerBatch={20}
              windowSize={12}
              removeClippedSubviews
              keyboardShouldPersistTaps="handled"
              updateCellsBatchingPeriod={50}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#60a5fa"
                  colors={["#60a5fa"]}
                />
              }
            />
          )}

          {/* Emoji Picker */}
          <SaqrEmojiPicker
            visible={showEmojiPicker}
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
            title={copy.emojiPickerTitle}
          />

          {/* Input Area */}
          <View style={styles.inputContainer}>
            {/* Balance Warning */}
            {messageCost > 0 &&
              normalizedSaqrGems < messageCost * 3 &&
              normalizedSaqrGems >= messageCost && (
                <View style={styles.lowBalanceWarning}>
                  <Ionicons name="warning" size={12} color="#f59e0b" />
                  <Text style={styles.lowBalanceText}>
                    {copy.lowBalancePrefix}{" "}
                    {Math.floor(normalizedSaqrGems / messageCost)}{" "}
                    {copy.lowBalanceSuffix}
                  </Text>
                </View>
              )}

            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={styles.emojiBtn}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Image
                  source={{ uri: SAQR_EMOJIS[0].url }}
                  style={styles.emojiBtnIcon}
                />
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                placeholder={copy.typeMessagePlaceholder}
                placeholderTextColor="#666"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!newMessage.trim() || sending) && styles.sendBtnDisabled,
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    newMessage.trim() && !sending
                      ? ["#3b82f6", "#2563eb"]
                      : ["#333", "#222"]
                  }
                  style={styles.sendBtnGradient}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="send" size={18} color="#FFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Insufficient balance modal */}
        <InsufficientBalanceModal
          visible={showInsufficientModal}
          onWatchAds={handleWatchAds}
          onClose={() => setShowInsufficientModal(false)}
          currentBalance={normalizedSaqrGems}
          copy={copy}
          messageCost={messageCost}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,15,0.85)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  onlinePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  onlineText: {
    color: "#22c55e",
    fontSize: 11,
  },
  costInfo: {
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: "hidden",
  },
  costGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  costText: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "500",
  },
  serverSelectorContainer: {
    paddingVertical: 12,
  },
  serverScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  serverTabWrapper: {
    borderRadius: 14,
    overflow: "hidden",
  },
  serverTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  serverTabSelected: {
    borderColor: "transparent",
  },
  serverTabText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  serverTabTextSelected: {
    color: "#FFF",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
    marginLeft: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#60a5fa",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(96,165,250,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    color: "#888",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#555",
    fontSize: 14,
    marginTop: 8,
  },
  startChatBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(96,165,250,0.15)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.3)",
  },
  startChatText: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "500",
  },
  messagesList: {
    padding: 12,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  ownMessageWrapper: {
    justifyContent: "flex-end",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: width * 0.72,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  ownMessageBubble: {
    backgroundColor: "rgba(59,130,246,0.9)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
    marginLeft: "auto",
    borderColor: "rgba(59,130,246,0.5)",
  },
  userName: {
    color: "#60a5fa",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageContentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  messageText: {
    color: "#FFF",
    fontSize: 15,
    lineHeight: 22,
  },
  ownMessageText: {
    color: "#FFF",
  },
  inlineEmoji: {
    width: 48,
    height: 48,
    marginHorizontal: 4,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
  },
  ownMessageTime: {
    color: "rgba(255,255,255,0.6)",
  },
  emojiPickerContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  emojiPickerGradient: {
    padding: 16,
  },
  emojiPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  emojiPickerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emojiPickerClose: {
    padding: 4,
  },
  emojiList: {
    gap: 12,
    paddingVertical: 8,
  },
  emojiItem: {
    alignItems: "center",
    padding: 8,
  },
  emojiImage: {
    width: 56,
    height: 56,
    marginBottom: 6,
  },
  emojiName: {
    color: "#888",
    fontSize: 10,
  },
  inputContainer: {
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
  },
  lowBalanceWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  lowBalanceText: {
    color: "#f59e0b",
    fontSize: 11,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 25,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  emojiBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiBtnIcon: {
    width: 28,
    height: 28,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFF",
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    borderRadius: 22,
    overflow: "hidden",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnGradient: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.88,
    maxWidth: 380,
    borderRadius: 28,
    overflow: "hidden",
  },
  modalGradient: {
    padding: 32,
    alignItems: "center",
  },
  modalIconRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 4,
    backgroundColor: "rgba(239,68,68,0.2)",
    marginBottom: 24,
  },
  modalIconGradient: {
    flex: 1,
    borderRadius: 43,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
  },
  balanceBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(96,165,250,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    marginBottom: 12,
  },
  balanceText: {
    color: "#60a5fa",
    fontSize: 24,
    fontWeight: "bold",
  },
  balanceLabel: {
    color: "#60a5fa",
    fontSize: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 24,
  },
  watchAdsBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  watchAdsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  watchAdsText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  closeModalBtn: {
    marginTop: 16,
    padding: 12,
  },
  closeModalText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
});

export default GlobalChatScreen;
