// صفحة الدعوات والتحديات - Invitations & Challenges Screen
// دعوة الأصدقاء للألعاب والدردشة + تحديات 1v1 مع رهان الألماس

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Modal,
  Share,
  Clipboard,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import gameSounds from '../utils/gameSounds';

const { width } = Dimensions.get('window');

// قائمة الألعاب المتاحة للتحديات
const GAMES = [
  { id: 'chess', name: 'الشطرنج', icon: 'grid-outline', color: '#f59e0b' },
  { id: 'memory', name: 'الذاكرة', icon: 'albums-outline', color: '#8b5cf6' },
  { id: 'snake', name: 'الثعبان', icon: 'fitness-outline', color: '#22c55e' },
  { id: 'math', name: 'سباق الرياضيات', icon: 'calculator-outline', color: '#3b82f6' },
  { id: 'word', name: 'سباق الكلمات', icon: 'text-outline', color: '#ec4899' },
  { id: 'brick', name: 'تكسير الطوب', icon: 'apps-outline', color: '#ef4444' },
];

// أنواع الدعوات
const INVITATION_TYPES = [
  { id: 'game', name: 'دعوة للعب', icon: 'game-controller', color: '#22c55e', reward: 10 },
  { id: 'chat', name: 'دعوة للدردشة', icon: 'chatbubbles', color: '#3b82f6', reward: 5 },
  { id: 'challenge', name: 'تحدي 1v1', icon: 'flash', color: '#f59e0b', reward: 0 },
];

// مكون بطاقة الدعوة
const InvitationCard = ({ invitation, onShare }) => {
  const isExpired = new Date(invitation.expires_at) < new Date();
  const statusColor = invitation.status === 'accepted' ? '#22c55e' : 
                      invitation.status === 'pending' ? '#f59e0b' : '#ef4444';
  
  const statusText = invitation.status === 'accepted' ? 'مقبولة' :
                     invitation.status === 'pending' ? 'معلقة' : 
                     invitation.status === 'expired' ? 'منتهية' : 'مرفوضة';

  return (
    <View style={styles.invitationCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
        style={styles.invitationCardGradient}
      >
        <View style={styles.invitationHeader}>
          <View style={[styles.invitationTypeIcon, { backgroundColor: INVITATION_TYPES.find(t => t.id === invitation.type)?.color + '30' }]}>
            <Ionicons 
              name={INVITATION_TYPES.find(t => t.id === invitation.type)?.icon || 'mail'} 
              size={20} 
              color={INVITATION_TYPES.find(t => t.id === invitation.type)?.color || '#FFF'} 
            />
          </View>
          <View style={styles.invitationInfo}>
            <Text style={styles.invitationType}>
              {INVITATION_TYPES.find(t => t.id === invitation.type)?.name || invitation.type}
            </Text>
            <Text style={styles.invitationCode}>الكود: {invitation.code}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        
        {invitation.status === 'pending' && !isExpired && (
          <View style={styles.invitationActions}>
            <TouchableOpacity 
              style={styles.shareBtn}
              onPress={() => onShare(invitation)}
            >
              <Ionicons name="share-social" size={18} color="#FFF" />
              <Text style={styles.shareBtnText}>مشاركة</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.copyBtn}
              onPress={() => {
                Clipboard.setString(invitation.code);
                gameSounds.correct();
                Alert.alert('تم النسخ!', 'تم نسخ الكود إلى الحافظة');
              }}
            >
              <Ionicons name="copy-outline" size={18} color="#60a5fa" />
              <Text style={styles.copyBtnText}>نسخ الكود</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

// مكون بطاقة التحدي
const ChallengeCard = ({ challenge, userId, onAccept, onDecline, onPlay }) => {
  const isChallenger = challenge.challenger_id === userId;
  const opponent = isChallenger ? challenge.opponent_name : challenge.challenger_name;
  const game = GAMES.find(g => g.id === challenge.game_id);
  
  const statusColors = {
    pending: '#f59e0b',
    active: '#22c55e',
    completed: '#3b82f6',
    declined: '#ef4444',
    expired: '#666'
  };

  return (
    <View style={styles.challengeCard}>
      <LinearGradient
        colors={challenge.status === 'active' ? ['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
        style={styles.challengeCardGradient}
      >
        {/* Header */}
        <View style={styles.challengeHeader}>
          <View style={[styles.gameIcon, { backgroundColor: game?.color + '30' || '#333' }]}>
            <Ionicons name={game?.icon || 'game-controller'} size={24} color={game?.color || '#FFF'} />
          </View>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeGame}>{game?.name || 'لعبة'}</Text>
            <Text style={styles.challengeOpponent}>ضد {opponent}</Text>
          </View>
          <View style={[styles.challengeStatusBadge, { backgroundColor: statusColors[challenge.status] + '20' }]}>
            <Text style={[styles.challengeStatusText, { color: statusColors[challenge.status] }]}>
              {challenge.status === 'pending' ? 'في الانتظار' :
               challenge.status === 'active' ? 'نشط' :
               challenge.status === 'completed' ? 'منتهي' :
               challenge.status === 'declined' ? 'مرفوض' : 'منتهي الصلاحية'}
            </Text>
          </View>
        </View>

        {/* Prize */}
        <View style={styles.prizeContainer}>
          <View style={styles.prizeBox}>
            <Ionicons name="diamond" size={20} color="#60a5fa" />
            <Text style={styles.prizeAmount}>{challenge.total_prize}</Text>
            <Text style={styles.prizeLabel}>الجائزة الكلية</Text>
          </View>
          <View style={styles.prizeArrow}>
            <Ionicons name="arrow-forward" size={20} color="#444" />
          </View>
          <View style={styles.prizeBox}>
            <Ionicons name="trophy" size={20} color="#fbbf24" />
            <Text style={styles.prizeAmount}>{challenge.bet_amount}</Text>
            <Text style={styles.prizeLabel}>الرهان</Text>
          </View>
        </View>

        {/* Actions */}
        {challenge.status === 'pending' && !isChallenger && (
          <View style={styles.challengeActions}>
            <TouchableOpacity 
              style={styles.acceptBtn}
              onPress={() => onAccept(challenge.id)}
            >
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.acceptBtnText}>قبول التحدي</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.declineBtn}
              onPress={() => onDecline(challenge.id)}
            >
              <Ionicons name="close" size={20} color="#ef4444" />
              <Text style={styles.declineBtnText}>رفض</Text>
            </TouchableOpacity>
          </View>
        )}

        {challenge.status === 'active' && (
          <TouchableOpacity 
            style={styles.playBtn}
            onPress={() => onPlay(challenge)}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.playBtnGradient}
            >
              <Ionicons name="play" size={20} color="#FFF" />
              <Text style={styles.playBtnText}>ابدأ اللعب الآن!</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {challenge.status === 'completed' && (
          <View style={styles.resultContainer}>
            <Ionicons 
              name={challenge.winner_id === userId ? 'trophy' : 'sad'} 
              size={24} 
              color={challenge.winner_id === userId ? '#fbbf24' : '#ef4444'} 
            />
            <Text style={[styles.resultText, { color: challenge.winner_id === userId ? '#22c55e' : '#ef4444' }]}>
              {challenge.winner_id === userId ? `فزت! +${challenge.total_prize} ألماسة` : 'خسرت التحدي'}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

// نافذة إنشاء دعوة جديدة
const CreateInvitationModal = ({ visible, onClose, onCreate }) => {
  const [selectedType, setSelectedType] = useState('game');
  const [selectedGame, setSelectedGame] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    gameSounds.buttonTap();
    
    try {
      await onCreate({
        type: selectedType,
        game_id: selectedGame,
        message: message.trim() || null
      });
      onClose();
      setMessage('');
      setSelectedGame(null);
    } catch (error) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إنشاء الدعوة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#1a1a2e', '#0f0f1a']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إنشاء دعوة جديدة</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Invitation Type */}
              <Text style={styles.sectionTitle}>نوع الدعوة</Text>
              <View style={styles.typeGrid}>
                {INVITATION_TYPES.filter(t => t.id !== 'challenge').map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeCard, selectedType === type.id && styles.typeCardSelected]}
                    onPress={() => {
                      gameSounds.buttonTap();
                      setSelectedType(type.id);
                    }}
                  >
                    <View style={[styles.typeIconBg, { backgroundColor: type.color + '30' }]}>
                      <Ionicons name={type.icon} size={24} color={type.color} />
                    </View>
                    <Text style={styles.typeName}>{type.name}</Text>
                    <Text style={styles.typeReward}>+{type.reward} نقطة</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Game Selection (if game type) */}
              {selectedType === 'game' && (
                <>
                  <Text style={styles.sectionTitle}>اختر اللعبة</Text>
                  <View style={styles.gamesGrid}>
                    {GAMES.map(game => (
                      <TouchableOpacity
                        key={game.id}
                        style={[styles.gameCard, selectedGame === game.id && styles.gameCardSelected]}
                        onPress={() => {
                          gameSounds.buttonTap();
                          setSelectedGame(game.id);
                        }}
                      >
                        <Ionicons name={game.icon} size={28} color={selectedGame === game.id ? '#FFF' : game.color} />
                        <Text style={[styles.gameName, selectedGame === game.id && styles.gameNameSelected]}>
                          {game.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Optional Message */}
              <Text style={styles.sectionTitle}>رسالة (اختياري)</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="أضف رسالة مع الدعوة..."
                placeholderTextColor="#666"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={100}
              />

              {/* Create Button */}
              <TouchableOpacity
                style={[styles.createBtn, loading && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={styles.createBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={20} color="#FFF" />
                      <Text style={styles.createBtnText}>إنشاء الدعوة</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// نافذة إنشاء تحدي جديد
const CreateChallengeModal = ({ visible, onClose, onCreate, friends, diamonds }) => {
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [betAmount, setBetAmount] = useState('10');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!selectedFriend) {
      Alert.alert('خطأ', 'اختر صديقاً للتحدي');
      return;
    }
    
    const bet = parseInt(betAmount) || 0;
    if (bet < 5) {
      Alert.alert('خطأ', 'الحد الأدنى للرهان 5 ألماسات');
      return;
    }
    if (bet > diamonds) {
      Alert.alert('خطأ', 'لا يوجد لديك ألماس كافي');
      return;
    }

    setLoading(true);
    gameSounds.buttonTap();
    
    try {
      await onCreate({
        opponent_id: selectedFriend.id,
        game_id: selectedGame,
        bet_amount: bet
      });
      onClose();
      setBetAmount('10');
      setSelectedFriend(null);
    } catch (error) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إنشاء التحدي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#1a1a2e', '#0f0f1a']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تحدي 1v1</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Diamond Balance */}
              <View style={styles.balanceBox}>
                <Ionicons name="diamond" size={24} color="#60a5fa" />
                <Text style={styles.balanceAmount}>{diamonds}</Text>
                <Text style={styles.balanceLabel}>رصيدك</Text>
              </View>

              {/* Game Selection */}
              <Text style={styles.sectionTitle}>اختر اللعبة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gamesScroll}>
                {GAMES.map(game => (
                  <TouchableOpacity
                    key={game.id}
                    style={[styles.gameChip, selectedGame === game.id && { backgroundColor: game.color }]}
                    onPress={() => {
                      gameSounds.buttonTap();
                      setSelectedGame(game.id);
                    }}
                  >
                    <Ionicons name={game.icon} size={20} color={selectedGame === game.id ? '#FFF' : game.color} />
                    <Text style={[styles.gameChipText, selectedGame === game.id && styles.gameChipTextSelected]}>
                      {game.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Friend Selection */}
              <Text style={styles.sectionTitle}>اختر الخصم</Text>
              {friends.length === 0 ? (
                <View style={styles.noFriendsBox}>
                  <Ionicons name="people-outline" size={40} color="#666" />
                  <Text style={styles.noFriendsText}>لا يوجد أصدقاء</Text>
                  <Text style={styles.noFriendsSubtext}>أضف أصدقاء لتتمكن من تحديهم</Text>
                </View>
              ) : (
                <FlatList
                  data={friends}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.friendCard, selectedFriend?.id === item.id && styles.friendCardSelected]}
                      onPress={() => {
                        gameSounds.buttonTap();
                        setSelectedFriend(item);
                      }}
                    >
                      <View style={styles.friendAvatar}>
                        {item.avatar ? (
                          <Image source={{ uri: item.avatar }} style={styles.friendAvatarImg} />
                        ) : (
                          <Text style={styles.friendAvatarText}>{item.name?.charAt(0) || '?'}</Text>
                        )}
                      </View>
                      <Text style={styles.friendName}>{item.name}</Text>
                      {selectedFriend?.id === item.id && (
                        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* Bet Amount */}
              <Text style={styles.sectionTitle}>مبلغ الرهان (ألماس)</Text>
              <View style={styles.betInputContainer}>
                <TouchableOpacity 
                  style={styles.betBtn}
                  onPress={() => setBetAmount(Math.max(5, parseInt(betAmount) - 5).toString())}
                >
                  <Ionicons name="remove" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.betInputWrapper}>
                  <Ionicons name="diamond" size={20} color="#60a5fa" />
                  <TextInput
                    style={styles.betInput}
                    value={betAmount}
                    onChangeText={setBetAmount}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <TouchableOpacity 
                  style={styles.betBtn}
                  onPress={() => setBetAmount(Math.min(diamonds, parseInt(betAmount) + 5).toString())}
                >
                  <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Quick Bet Options */}
              <View style={styles.quickBetRow}>
                {[10, 25, 50, 100].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.quickBetBtn, parseInt(betAmount) === amount && styles.quickBetBtnSelected]}
                    onPress={() => {
                      gameSounds.buttonTap();
                      setBetAmount(amount.toString());
                    }}
                  >
                    <Text style={[styles.quickBetText, parseInt(betAmount) === amount && styles.quickBetTextSelected]}>
                      {amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Prize Info */}
              <View style={styles.prizeInfo}>
                <Ionicons name="trophy" size={20} color="#fbbf24" />
                <Text style={styles.prizeInfoText}>
                  الفائز يحصل على: {(parseInt(betAmount) || 0) * 2} ألماسة
                </Text>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                style={[styles.createBtn, (loading || !selectedFriend) && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={loading || !selectedFriend}
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.createBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={20} color="#FFF" />
                      <Text style={styles.createBtnText}>إرسال التحدي</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// نافذة قبول دعوة بالكود
const JoinByCodeModal = ({ visible, onClose, onJoin }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.length < 6) {
      Alert.alert('خطأ', 'الكود يجب أن يكون 6 أحرف');
      return;
    }
    
    setLoading(true);
    gameSounds.buttonTap();
    
    try {
      await onJoin(code.toUpperCase());
      onClose();
      setCode('');
    } catch (error) {
      Alert.alert('خطأ', error.message || 'الدعوة غير موجودة أو منتهية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.codeModalContent}>
          <LinearGradient
            colors={['#1a1a2e', '#0f0f1a']}
            style={styles.codeModalGradient}
          >
            <Ionicons name="ticket-outline" size={50} color="#60a5fa" />
            <Text style={styles.codeModalTitle}>أدخل كود الدعوة</Text>
            
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              placeholder="XXXXXX"
              placeholderTextColor="#444"
              maxLength={6}
              autoCapitalize="characters"
            />
            
            <View style={styles.codeModalActions}>
              <TouchableOpacity style={styles.codeModalCancel} onPress={onClose}>
                <Text style={styles.codeModalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.codeModalJoin, loading && { opacity: 0.5 }]}
                onPress={handleJoin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.codeModalJoinText}>انضمام</Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// المكون الرئيسي
const InvitationsScreen = ({ user, onClose, onPlayGame }) => {
  const [activeTab, setActiveTab] = useState('invitations'); // invitations, challenges
  const [invitations, setInvitations] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [diamonds, setDiamonds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateInvitation, setShowCreateInvitation] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: activeTab === 'invitations' ? 0 : 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load invitations
      const invRes = await api.fetch('/api/invitations/my-invitations');
      if (invRes.ok) {
        const data = await invRes.json();
        setInvitations(data.invitations || []);
      }

      // Load challenges
      const chalRes = await api.fetch('/api/invitations/challenges/my-challenges');
      if (chalRes.ok) {
        const data = await chalRes.json();
        setChallenges(data.challenges || []);
      }

      // Load friends
      const friendsRes = await api.fetch(`/api/social/friends/${user?.id}`);
      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends || []);
      }

      // Load balance
      const balRes = await api.getBalance(user?.id);
      if (balRes.ok) {
        const data = await balRes.json();
        setDiamonds(data.diamonds || 0);
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (data) => {
    const response = await api.fetch('/api/invitations/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'فشل في إنشاء الدعوة');
    }
    
    const result = await response.json();
    gameSounds.correct();
    Alert.alert('تم!', result.message);
    loadData();
    
    // Auto share
    Share.share({
      message: `انضم إلي في تطبيق صقر! استخدم الكود: ${result.invitation.code}\n\nحمّل التطبيق الآن!`,
    });
  };

  const joinByCode = async (code) => {
    const response = await api.fetch('/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ invitation_code: code })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'فشل في قبول الدعوة');
    }
    
    const result = await response.json();
    gameSounds.win();
    Alert.alert('مرحباً!', result.message);
    loadData();
  };

  const createChallenge = async (data) => {
    const response = await api.fetch('/api/invitations/challenges/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'فشل في إنشاء التحدي');
    }
    
    const result = await response.json();
    gameSounds.correct();
    Alert.alert('تم!', result.message);
    loadData();
  };

  const respondToChallenge = async (challengeId, accept) => {
    const response = await api.fetch('/api/invitations/challenges/respond', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, accept })
    });
    
    if (!response.ok) {
      const error = await response.json();
      Alert.alert('خطأ', error.detail || 'حدث خطأ');
      return;
    }
    
    const result = await response.json();
    if (accept) {
      gameSounds.levelUp();
      Alert.alert('تم!', result.message);
    } else {
      gameSounds.buttonTap();
    }
    loadData();
  };

  const shareInvitation = (invitation) => {
    Share.share({
      message: `انضم إلي في تطبيق صقر! استخدم الكود: ${invitation.code}\n\nحمّل التطبيق الآن!`,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الدعوات والتحديات</Text>
          <TouchableOpacity 
            onPress={() => setShowJoinByCode(true)} 
            style={styles.headerBtn}
          >
            <Ionicons name="qr-code" size={22} color="#60a5fa" />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBackground}>
            <Animated.View 
              style={[
                styles.tabIndicator,
                {
                  transform: [{
                    translateX: tabAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (width - 48) / 2]
                    })
                  }]
                }
              ]}
            />
          </View>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => {
              gameSounds.buttonTap();
              setActiveTab('invitations');
            }}
          >
            <Ionicons name="mail" size={20} color={activeTab === 'invitations' ? '#FFF' : '#888'} />
            <Text style={[styles.tabText, activeTab === 'invitations' && styles.tabTextActive]}>
              الدعوات
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => {
              gameSounds.buttonTap();
              setActiveTab('challenges');
            }}
          >
            <Ionicons name="flash" size={20} color={activeTab === 'challenges' ? '#FFF' : '#888'} />
            <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>
              التحديات
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'invitations' ? (
              <>
                {/* Create Invitation Button */}
                <TouchableOpacity 
                  style={styles.createCard}
                  onPress={() => setShowCreateInvitation(true)}
                >
                  <LinearGradient
                    colors={['rgba(59,130,246,0.2)', 'rgba(59,130,246,0.1)']}
                    style={styles.createCardGradient}
                  >
                    <View style={styles.createCardIcon}>
                      <Ionicons name="add" size={30} color="#3b82f6" />
                    </View>
                    <View style={styles.createCardInfo}>
                      <Text style={styles.createCardTitle}>إنشاء دعوة جديدة</Text>
                      <Text style={styles.createCardSubtitle}>ادعُ أصدقاءك للعب أو الدردشة</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Invitations List */}
                {invitations.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="mail-open-outline" size={60} color="#333" />
                    <Text style={styles.emptyTitle}>لا توجد دعوات</Text>
                    <Text style={styles.emptySubtitle}>أنشئ دعوة وشاركها مع أصدقائك</Text>
                  </View>
                ) : (
                  invitations.map(invitation => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onShare={shareInvitation}
                    />
                  ))
                )}
              </>
            ) : (
              <>
                {/* Create Challenge Button */}
                <TouchableOpacity 
                  style={styles.createCard}
                  onPress={() => setShowCreateChallenge(true)}
                >
                  <LinearGradient
                    colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.1)']}
                    style={styles.createCardGradient}
                  >
                    <View style={[styles.createCardIcon, { backgroundColor: 'rgba(245,158,11,0.2)' }]}>
                      <Ionicons name="flash" size={30} color="#f59e0b" />
                    </View>
                    <View style={styles.createCardInfo}>
                      <Text style={styles.createCardTitle}>تحدي صديق</Text>
                      <Text style={styles.createCardSubtitle}>راهن بالألماس والفائز يأخذ الكل!</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#f59e0b" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Diamond Balance */}
                <View style={styles.balanceBar}>
                  <Ionicons name="diamond" size={20} color="#60a5fa" />
                  <Text style={styles.balanceBarText}>رصيدك: {diamonds} ألماسة</Text>
                </View>

                {/* Challenges List */}
                {challenges.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="flash-outline" size={60} color="#333" />
                    <Text style={styles.emptyTitle}>لا توجد تحديات</Text>
                    <Text style={styles.emptySubtitle}>تحدَّ أصدقاءك واربح الألماس!</Text>
                  </View>
                ) : (
                  challenges.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      userId={user?.id}
                      onAccept={(id) => respondToChallenge(id, true)}
                      onDecline={(id) => respondToChallenge(id, false)}
                      onPlay={(ch) => {
                        gameSounds.levelUp();
                        onPlayGame?.(ch.game_id, ch);
                      }}
                    />
                  ))
                )}
              </>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Modals */}
        <CreateInvitationModal
          visible={showCreateInvitation}
          onClose={() => setShowCreateInvitation(false)}
          onCreate={createInvitation}
        />
        
        <CreateChallengeModal
          visible={showCreateChallenge}
          onClose={() => setShowCreateChallenge(false)}
          onCreate={createChallenge}
          friends={friends}
          diamonds={diamonds}
        />
        
        <JoinByCodeModal
          visible={showJoinByCode}
          onClose={() => setShowJoinByCode(false)}
          onJoin={joinByCode}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
  },
  tabBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: (width - 48) / 2 - 8,
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    zIndex: 1,
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  
  // Create Card
  createCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  createCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  createCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(59,130,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  createCardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createCardSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#555',
    fontSize: 14,
    marginTop: 8,
  },
  
  // Invitation Card
  invitationCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  invitationCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invitationTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  invitationType: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  invitationCode: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  invitationActions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  shareBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96,165,250,0.15)',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  copyBtnText: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Challenge Card
  challengeCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  challengeCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  challengeGame: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengeOpponent: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  challengeStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  challengeStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  prizeBox: {
    alignItems: 'center',
    flex: 1,
  },
  prizeAmount: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  prizeLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  prizeArrow: {
    paddingHorizontal: 16,
  },
  challengeActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  declineBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  playBtn: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  playBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  playBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 10,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96,165,250,0.1)',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  balanceBarText: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  
  // Type Selection
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  typeIconBg: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  typeReward: {
    color: '#22c55e',
    fontSize: 11,
    marginTop: 4,
  },
  
  // Games Grid
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gameCard: {
    width: (width - 60) / 3,
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gameCardSelected: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  gameName: {
    color: '#888',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  gameNameSelected: {
    color: '#FFF',
  },
  
  // Message Input
  messageInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    color: '#FFF',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Create Button
  createBtn: {
    marginTop: 24,
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Challenge Modal
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96,165,250,0.1)',
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  balanceAmount: {
    color: '#60a5fa',
    fontSize: 28,
    fontWeight: 'bold',
  },
  balanceLabel: {
    color: '#60a5fa',
    fontSize: 14,
  },
  gamesScroll: {
    marginBottom: 8,
  },
  gameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginRight: 10,
    gap: 8,
  },
  gameChipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  gameChipTextSelected: {
    color: '#FFF',
  },
  noFriendsBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
  },
  noFriendsText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  noFriendsSubtext: {
    color: '#555',
    fontSize: 13,
    marginTop: 4,
  },
  friendCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  friendCardSelected: {
    borderColor: '#22c55e',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendName: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 8,
    maxWidth: 70,
    textAlign: 'center',
  },
  betInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  betBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  betInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  betInput: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'center',
  },
  quickBetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 10,
  },
  quickBetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  quickBetBtnSelected: {
    backgroundColor: '#f59e0b',
  },
  quickBetText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  quickBetTextSelected: {
    color: '#FFF',
  },
  prizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 14,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 12,
    gap: 8,
  },
  prizeInfoText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Join By Code Modal
  codeModalContent: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  codeModalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  codeModalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  codeInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
  },
  codeModalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  codeModalCancel: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    alignItems: 'center',
  },
  codeModalCancelText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  codeModalJoin: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    alignItems: 'center',
  },
  codeModalJoinText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InvitationsScreen;
