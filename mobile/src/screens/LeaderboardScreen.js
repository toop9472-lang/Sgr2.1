// Leaderboard Screen - لوحة المتصدرين
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

const GAME_BG = 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/a1c2b3d4e5f6g7h8i9j0.png';

const TABS = [
  { id: 'daily', name: 'اليومي', icon: 'today' },
  { id: 'weekly', name: 'الأسبوعي', icon: 'calendar' },
  { id: 'allTime', name: 'الكل', icon: 'trophy' },
];

const LeaderboardScreen = ({ userId, onClose }) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await api.get(`/api/leaderboard?period=${activeTab}&user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setUserRank(data.user_rank);
      } else {
        // بيانات تجريبية
        setLeaderboard([
          { rank: 1, name: 'أحمد', points: 15420, avatar: 'A' },
          { rank: 2, name: 'سارة', points: 12350, avatar: 'S' },
          { rank: 3, name: 'محمد', points: 11200, avatar: 'M' },
          { rank: 4, name: 'فاطمة', points: 9800, avatar: 'F' },
          { rank: 5, name: 'علي', points: 8500, avatar: 'A' },
          { rank: 6, name: 'نورة', points: 7200, avatar: 'N' },
          { rank: 7, name: 'خالد', points: 6100, avatar: 'K' },
          { rank: 8, name: 'ريم', points: 5400, avatar: 'R' },
          { rank: 9, name: 'عمر', points: 4800, avatar: 'O' },
          { rank: 10, name: 'لينا', points: 4200, avatar: 'L' },
        ]);
        setUserRank({ rank: 25, points: 1500 });
      }
    } catch (error) {
      console.error('Fetch leaderboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, userId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return { backgroundColor: '#fbbf24', borderColor: '#f59e0b' };
    if (rank === 2) return { backgroundColor: '#9ca3af', borderColor: '#6b7280' };
    if (rank === 3) return { backgroundColor: '#cd7f32', borderColor: '#b45309' };
    return { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' };
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '1';
    if (rank === 2) return '2';
    if (rank === 3) return '3';
    return `#${rank}`;
  };

  const renderItem = ({ item, index }) => {
    const isTopThree = item.rank <= 3;
    const rankStyle = getRankStyle(item.rank);

    return (
      <View style={[styles.leaderItem, isTopThree && styles.topThreeItem]}>
        <View style={[styles.rankBadge, { backgroundColor: rankStyle.backgroundColor }]}>
          <Text style={styles.rankText}>{getRankIcon(item.rank)}</Text>
        </View>
        
        <Text style={styles.avatar}>{item.avatar || 'U'}</Text>
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isTopThree && styles.topThreeName]}>{item.name}</Text>
          <Text style={styles.userPoints}>{item.points.toLocaleString()} نقطة</Text>
        </View>

        {isTopThree && (
          <View style={styles.crownBadge}>
            <Ionicons name="trophy" size={14} color="#fbbf24" />
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <>
      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <View style={styles.podium}>
          {/* 2nd Place */}
          <View style={[styles.podiumItem, styles.podiumSecond]}>
            <Text style={styles.podiumAvatar}>{leaderboard[1]?.avatar || 'U'}</Text>
            <Text style={styles.podiumName}>{leaderboard[1]?.name}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[1]?.points.toLocaleString()}</Text>
            <LinearGradient colors={['#9ca3af', '#6b7280']} style={styles.podiumBase}>
              <Text style={styles.podiumRank}>2</Text>
            </LinearGradient>
          </View>

          {/* 1st Place */}
          <View style={[styles.podiumItem, styles.podiumFirst]}>
            <Ionicons name="trophy" size={18} color="#fbbf24" style={styles.crownTop} />
            <Text style={styles.podiumAvatarFirst}>{leaderboard[0]?.avatar || 'U'}</Text>
            <Text style={styles.podiumNameFirst}>{leaderboard[0]?.name}</Text>
            <Text style={styles.podiumPointsFirst}>{leaderboard[0]?.points.toLocaleString()}</Text>
            <LinearGradient colors={['#fbbf24', '#f59e0b']} style={[styles.podiumBase, styles.podiumBaseFirst]}>
              <Text style={styles.podiumRankFirst}>1</Text>
            </LinearGradient>
          </View>

          {/* 3rd Place */}
          <View style={[styles.podiumItem, styles.podiumThird]}>
            <Text style={styles.podiumAvatar}>{leaderboard[2]?.avatar || 'U'}</Text>
            <Text style={styles.podiumName}>{leaderboard[2]?.name}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[2]?.points.toLocaleString()}</Text>
            <LinearGradient colors={['#cd7f32', '#b45309']} style={styles.podiumBase}>
              <Text style={styles.podiumRank}>3</Text>
            </LinearGradient>
          </View>
        </View>
      )}

      <Text style={styles.listTitle}>أفضل 100 لاعب</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a1929', '#1e3a5f']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>لوحة المتصدرين</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={18} 
                color={activeTab === tab.id ? '#fbbf24' : 'rgba(255,255,255,0.5)'} 
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard List */}
        <FlatList
          data={leaderboard.slice(3)} // Skip top 3 (shown in podium)
          renderItem={renderItem}
          keyExtractor={(item) => `rank-${item.rank}`}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fbbf24" />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* User Rank Card */}
        {userRank && (
          <View style={styles.userRankCard}>
            <LinearGradient colors={['rgba(59,130,246,0.3)', 'rgba(59,130,246,0.1)']} style={styles.userRankGradient}>
              <Text style={styles.userRankLabel}>ترتيبك</Text>
              <Text style={styles.userRankNumber}>#{userRank.rank}</Text>
              <Text style={styles.userRankPoints}>{userRank.points.toLocaleString()} نقطة</Text>
            </LinearGradient>
          </View>
        )}
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
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(251,191,36,0.2)',
  },
  tabText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },

  // Podium
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  podiumItem: {
    alignItems: 'center',
    width: (width - 60) / 3,
  },
  podiumFirst: {},
  podiumSecond: {},
  podiumThird: {},
  crownTop: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumAvatar: {
    fontSize: 36,
    marginBottom: 4,
  },
  podiumAvatarFirst: {
    fontSize: 44,
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 12,
    color: '#FFF',
    marginBottom: 2,
  },
  podiumNameFirst: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  podiumPointsFirst: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  podiumBase: {
    width: '100%',
    height: 50,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumBaseFirst: {
    height: 70,
  },
  podiumRank: {
    fontSize: 20,
  },
  podiumRankFirst: {
    fontSize: 28,
  },

  // List
  listTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  topThreeItem: {
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  avatar: {
    fontSize: 28,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  topThreeName: {
    color: '#fbbf24',
  },
  userPoints: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  crownBadge: {
    marginLeft: 8,
  },
  crownIcon: {
    fontSize: 16,
  },

  // User Rank Card
  userRankCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  userRankGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  userRankLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  userRankNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userRankPoints: {
    fontSize: 14,
    color: '#60a5fa',
  },
});

export default LeaderboardScreen;
