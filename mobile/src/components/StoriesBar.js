// Stories Bar — Instagram-style horizontal carousel that lives above
// the Clips feed. Tap any user to open their stories full-screen, tap
// the "+" to create your own 24h story.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";
import { hapticLight, hapticSuccess } from "../utils/haptics";

const STORY_RING_GRADIENT = ["#fbbf24", "#f43f5e"];

const StoryCircle = ({ story, isMine, onPress }) => {
  const hasUnseen = story?.has_unseen;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.storyItem}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.ringOuter,
          hasUnseen ? styles.ringActive : styles.ringSeen,
          isMine && styles.ringMine,
        ]}
      >
        {story?.user_avatar ? (
          <Image source={{ uri: story.user_avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>
              {(story?.user_name || "?")[0]?.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {isMine ? "قصتك" : story?.user_name || "مستخدم"}
      </Text>
    </TouchableOpacity>
  );
};

const StoriesBar = ({ user, onOpenUserStories, onAfterCreate }) => {
  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const userId = user?.id || user?._id;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const r = await api.getStoriesFeed(userId);
      const data = r?.json ? await r.json() : null;
      setUserStories(Array.isArray(data?.users) ? data.users : []);
    } catch (_) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = useCallback(async () => {
    if (!userId) {
      Alert.alert("تنبيه", "سجّل دخولك أولاً.");
      return;
    }
    hapticLight();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        videoMaxDuration: 30,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];

      setCreating(true);
      // Upload via the existing R2 endpoint
      const form = new FormData();
      form.append("file", {
        uri: asset.uri,
        name: asset.fileName || `story-${Date.now()}.${asset.type === "video" ? "mp4" : "jpg"}`,
        type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
      });
      const upload = await api.fetch("/api/clips/upload", {
        method: "POST",
        body: form,
        headers: {},
      });
      const uploadData = await upload.json().catch(() => ({}));
      const mediaUrl = uploadData?.url || uploadData?.video_url || uploadData?.media_url;
      if (!mediaUrl) throw new Error(uploadData?.detail || "فشل رفع الوسائط");

      const create = await api.createStory({
        user_id: userId,
        user_name: user?.name,
        user_avatar: user?.avatar,
        media_url: mediaUrl,
        media_type: asset.type === "video" ? "video" : "image",
      });
      const createData = await create.json().catch(() => ({}));
      if (!create.ok) throw new Error(createData?.detail || "فشل إنشاء القصة");

      hapticSuccess();
      Alert.alert("✅ تم", "تم نشر قصتك! ستختفي تلقائياً بعد 24 ساعة.");
      load();
      onAfterCreate && onAfterCreate();
    } catch (e) {
      Alert.alert("خطأ", String(e?.message || e));
    } finally {
      setCreating(false);
    }
  }, [userId, user?.name, user?.avatar, load, onAfterCreate]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        inverted
      >
        {/* Your own + circle */}
        <TouchableOpacity
          onPress={handleCreate}
          style={styles.storyItem}
          activeOpacity={0.85}
          disabled={creating}
        >
          <View style={[styles.ringOuter, styles.ringMineEmpty]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>
                  {(user?.name || "?")[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.plusBadge}>
              {creating ? (
                <ActivityIndicator size="small" color="#0a0a0f" />
              ) : (
                <Ionicons name="add" size={14} color="#0a0a0f" />
              )}
            </View>
          </View>
          <Text style={styles.storyName} numberOfLines={1}>
            قصتك
          </Text>
        </TouchableOpacity>

        {loading && userStories.length === 0 ? (
          <View style={styles.skeletonRow}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonItem}>
                <View style={styles.skeletonRing} />
                <View style={styles.skeletonLine} />
              </View>
            ))}
          </View>
        ) : (
          userStories.map((u) => (
            <StoryCircle
              key={u.user_id}
              story={u}
              onPress={() => onOpenUserStories && onOpenUserStories(u)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.32)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  scroll: { paddingHorizontal: 8 },
  storyItem: {
    alignItems: "center",
    marginHorizontal: 6,
    width: 64,
  },
  ringOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  ringActive: { borderColor: "#fbbf24" },
  ringSeen: { borderColor: "rgba(255,255,255,0.18)" },
  ringMine: { borderColor: "rgba(96,165,250,0.7)" },
  ringMineEmpty: { borderColor: "rgba(255,255,255,0.18)", borderStyle: "dashed" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    backgroundColor: "#1e1e2e",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  storyName: {
    color: "#fff",
    fontSize: 11,
    marginTop: 5,
    maxWidth: 60,
    textAlign: "center",
  },
  plusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0a0a0f",
  },
  skeletonRow: { flexDirection: "row" },
  skeletonItem: { alignItems: "center", marginHorizontal: 6, width: 64 },
  skeletonRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonLine: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginTop: 6,
  },
});

export default StoriesBar;
