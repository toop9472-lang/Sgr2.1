// صفحة الأصدقاء - Friends Screen
// نظام الأصدقاء وطلبات الصداقة والبحث

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import { useLanguage } from "../i18n/LanguageContext";

const { width } = Dimensions.get("window");

// مكون بطاقة الصديق
const FriendCard = ({ friend, onMessage, onRemove }) => {
  return (
    <View style={styles.friendCard}>
      <View style={styles.friendAvatar}>
        {friend.avatar ? (
          <Image source={{ uri: friend.avatar }} style={styles.avatarImage} />
        ) : (
          <LinearGradient
            colors={["#3b82f6", "#8b5cf6"]}
            style={styles.avatarPlaceholder}
          >
            <Text style={styles.avatarText}>
              {friend.name?.charAt(0) || "?"}
            </Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={styles.friendSince}>
          صديق منذ{" "}
          {new Date(friend.friendship_date).toLocaleDateString("ar-SA")}
        </Text>
      </View>

      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onMessage(friend)}
        >
          <Ionicons name="mail" size={18} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onRemove(friend)}
        >
          <Ionicons name="person-remove" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// مكون طلب الصداقة
const FriendRequestCard = ({ request, type, onAccept, onReject }) => {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestAvatar}>
        <LinearGradient
          colors={["#f59e0b", "#ef4444"]}
          style={styles.avatarPlaceholder}
        >
          <Text style={styles.avatarText}>
            {request.from_user_name?.charAt(0) || "?"}
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{request.from_user_name}</Text>
        <Text style={styles.requestTime}>
          {type === "incoming" ? "يريد إضافتك كصديق" : "في انتظار الرد"}
        </Text>
      </View>

      {type === "incoming" && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.requestBtn, styles.acceptBtn]}
            onPress={() => onAccept(request)}
          >
            <Ionicons name="checkmark" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestBtn, styles.rejectBtn]}
            onPress={() => onReject(request)}
          >
            <Ionicons name="close" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// مكون نتيجة البحث
const SearchResultCard = ({ user, onAddFriend, pending }) => {
  return (
    <View style={styles.searchResultCard}>
      <View style={styles.searchAvatar}>
        <LinearGradient
          colors={["#06b6d4", "#3b82f6"]}
          style={styles.avatarPlaceholder}
        >
          <Text style={styles.avatarText}>{user.name?.charAt(0) || "?"}</Text>
        </LinearGradient>
      </View>

      <View style={styles.searchInfo}>
        <Text style={styles.searchName}>{user.name}</Text>
      </View>

      <TouchableOpacity
        style={[styles.addFriendBtn, pending && styles.pendingBtn]}
        onPress={() => !pending && onAddFriend(user)}
        disabled={pending}
      >
        <Ionicons
          name={pending ? "hourglass" : "person-add"}
          size={16}
          color="#FFF"
        />
        <Text style={styles.addFriendText}>{pending ? "معلق" : "إضافة"}</Text>
      </TouchableOpacity>
    </View>
  );
};

// المكون الرئيسي
const FriendsScreen = ({ user, onClose, onOpenMessages }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      // Load friends
      const friendsRes = await api.fetch(
        `/api/social/friends/list/${user?.id}`,
      );
      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends || []);
      }

      // Load requests
      const requestsRes = await api.fetch(
        `/api/social/friends/requests/${user?.id}`,
      );
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data);
      }
    } catch (e) {
      console.error("Error loading data:", e);
      Alert.alert("خطأ", "تعذر تحميل بيانات الأصدقاء حالياً");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await api.fetch(
        `/api/social/users/search?query=${encodeURIComponent(searchQuery)}`,
      );
      if (res.ok) {
        const data = await res.json();
        // Filter out current user and existing friends
        const filtered = data.users.filter(
          (u) => u.id !== user?.id && !friends.find((f) => f.id === u.id),
        );
        setSearchResults(filtered);
      }
    } catch (e) {
      console.error("Error searching:", e);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (targetUser) => {
    try {
      const res = await api.fetch("/api/social/friends/request", {
        method: "POST",
        body: JSON.stringify({
          from_user_id: user?.id,
          to_user_id: targetUser.id,
          from_user_name: user?.name || "مستخدم",
        }),
      });

      if (res.ok) {
        Alert.alert("تم", "تم إرسال طلب الصداقة");
        loadData();
        setSearchResults((prev) => prev.filter((u) => u.id !== targetUser.id));
      } else {
        const error = await res.json();
        Alert.alert("خطأ", error.detail || "حدث خطأ");
      }
    } catch (e) {
      Alert.alert("خطأ", "حدث خطأ في الاتصال");
    }
  };

  const acceptRequest = async (request) => {
    try {
      const res = await api.fetch("/api/social/friends/accept", {
        method: "POST",
        body: JSON.stringify({
          request_id: request.id,
          user_id: user?.id,
        }),
      });

      if (res.ok) {
        Alert.alert("تم", "تمت إضافة الصديق بنجاح");
        loadData();
      }
    } catch (e) {
      Alert.alert("خطأ", "حدث خطأ");
    }
  };

  const rejectRequest = async (request) => {
    try {
      const res = await api.fetch("/api/social/friends/reject", {
        method: "POST",
        body: JSON.stringify({
          request_id: request.id,
          user_id: user?.id,
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (e) {
      Alert.alert("خطأ", "حدث خطأ");
    }
  };

  const removeFriend = async (friend) => {
    Alert.alert(
      "إزالة صديق",
      `هل تريد إزالة ${friend.name} من قائمة أصدقائك؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إزالة",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.fetch(
                `/api/social/friends/remove/${user?.id}/${friend.id}`,
                {
                  method: "DELETE",
                },
              );
              if (res.ok) {
                loadData();
              }
            } catch (e) {
              Alert.alert("خطأ", "حدث خطأ");
            }
          },
        },
      ],
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      );
    }

    switch (activeTab) {
      case "friends":
        return friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#444" />
            <Text style={styles.emptyText}>لا يوجد أصدقاء</Text>
            <Text style={styles.emptySubtext}>
              {language === "ar"
                ? "ابحث عن أصدقاء جدد!"
                : "Search for new friends"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FriendCard
                friend={item}
                onMessage={(f) => onOpenMessages && onOpenMessages(f)}
                onRemove={removeFriend}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#60a5fa"
              />
            }
          />
        );

      case "requests":
        const totalRequests =
          requests.incoming.length + requests.outgoing.length;
        return totalRequests === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={60} color="#444" />
            <Text style={styles.emptyText}>
              {language === "ar" ? "لا توجد طلبات" : "No requests"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={[
              ...requests.incoming.map((r) => ({ ...r, type: "incoming" })),
              ...requests.outgoing.map((r) => ({ ...r, type: "outgoing" })),
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FriendRequestCard
                request={item}
                type={item.type}
                onAccept={acceptRequest}
                onReject={rejectRequest}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#60a5fa"
              />
            }
            ListHeaderComponent={() => (
              <>
                {requests.incoming.length > 0 && (
                  <Text style={styles.sectionHeader}>
                    طلبات واردة ({requests.incoming.length})
                  </Text>
                )}
              </>
            )}
          />
        );

      case "search":
        return (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  language === "ar" ? "ابحث عن مستخدمين..." : "Search users..."
                }
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchUsers}
              />
              <TouchableOpacity onPress={searchUsers} disabled={searching}>
                {searching ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Ionicons
                    name="arrow-forward-circle"
                    size={28}
                    color="#3b82f6"
                  />
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <SearchResultCard
                    user={item}
                    onAddFriend={sendFriendRequest}
                    pending={requests.outgoing.find(
                      (r) => r.to_user_id === item.id,
                    )}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            ) : searchQuery && !searching ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={60} color="#444" />
                <Text style={styles.emptyText}>
                  {language === "ar" ? "لا توجد نتائج" : "No results found"}
                </Text>
              </View>
            ) : null}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0a0a0f", "#1a1a2e"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === "ar" ? "الأصدقاء" : "Friends"}
          </Text>
          <View style={styles.friendsCount}>
            <Ionicons name="people" size={16} color="#22c55e" />
            <Text style={styles.countText}>{friends.length}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            {
              id: "friends",
              icon: "people",
              label: language === "ar" ? "أصدقائي" : "Friends",
            },
            {
              id: "requests",
              icon: "mail",
              label: language === "ar" ? "الطلبات" : "Requests",
              badge: requests.incoming.length,
            },
            {
              id: "search",
              icon: "search",
              label: language === "ar" ? "بحث" : "Search",
            },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? "#3b82f6" : "#888"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
              {tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick stats */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>
              {language === "ar" ? "الأصدقاء" : "Friends"}
            </Text>
            <Text style={styles.quickStatValue}>{friends.length}</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>
              {language === "ar" ? "الواردة" : "Incoming"}
            </Text>
            <Text style={styles.quickStatValue}>
              {requests.incoming.length}
            </Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>
              {language === "ar" ? "الصادرة" : "Outgoing"}
            </Text>
            <Text style={styles.quickStatValue}>
              {requests.outgoing.length}
            </Text>
          </View>
        </View>

        {/* Content */}
        {renderContent()}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "rgba(10,10,15,0.55)" },
  gradient: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  friendsCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  countText: { color: "#22c55e", fontWeight: "bold", fontSize: 14 },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    gap: 6,
  },
  activeTab: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },
  tabText: { color: "#888", fontSize: 12, fontWeight: "500" },
  activeTabText: { color: "#3b82f6" },
  quickStatsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.22)",
    paddingVertical: 10,
    alignItems: "center",
  },
  quickStatLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginBottom: 4,
  },
  quickStatValue: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "#ef4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: -4,
    right: 8,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
  emptySubtext: { color: "#444", fontSize: 14, marginTop: 8 },
  listContent: { padding: 16, paddingBottom: 100 },
  // Friend Card
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  friendAvatar: { marginRight: 12 },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontWeight: "bold", fontSize: 18 },
  friendInfo: { flex: 1 },
  friendName: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  friendSince: { color: "#888", fontSize: 11, marginTop: 2 },
  friendActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Request Card
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  requestAvatar: { marginRight: 12 },
  requestInfo: { flex: 1 },
  requestName: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  requestTime: { color: "#888", fontSize: 11, marginTop: 2 },
  requestActions: { flexDirection: "row", gap: 8 },
  requestBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtn: { backgroundColor: "#22c55e" },
  rejectBtn: { backgroundColor: "#ef4444" },
  sectionHeader: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  // Search
  searchContainer: { flex: 1, paddingHorizontal: 16 },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 14,
    paddingVertical: 10,
    marginHorizontal: 10,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchAvatar: { marginRight: 12 },
  searchInfo: { flex: 1 },
  searchName: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  addFriendBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  pendingBtn: { backgroundColor: "#666" },
  addFriendText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
});

export default FriendsScreen;
