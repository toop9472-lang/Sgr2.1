// Trending Hashtags + Tag Detail Screen (TikTok-style discovery).
// Shown above the clips feed or accessed via a dedicated tab/button.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import EmptyState from "./EmptyState";
import { hapticLight } from "../utils/haptics";

const TrendingHashtags = ({ visible, onClose, viewerId, onPlayClip }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [tagClips, setTagClips] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);

  const loadTrending = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.getTrendingHashtags(30);
      const data = r?.json ? await r.json() : null;
      setTags(Array.isArray(data?.trending) ? data.trending : []);
    } catch (_) {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) loadTrending();
  }, [visible, loadTrending]);

  const openTag = useCallback(
    async (tag) => {
      hapticLight();
      setActiveTag(tag);
      setTagClips([]);
      try {
        setTagLoading(true);
        const r = await api.getClipsByHashtag(tag, viewerId);
        const data = r?.json ? await r.json() : null;
        setTagClips(Array.isArray(data?.clips) ? data.clips : []);
      } catch (_) {
        // silent
      } finally {
        setTagLoading(false);
      }
    },
    [viewerId],
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {activeTag ? `#${activeTag}` : "الرائج الآن"}
          </Text>
          {activeTag ? (
            <TouchableOpacity onPress={() => setActiveTag(null)} style={styles.headerBtn}>
              <Ionicons name="grid" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        {!activeTag ? (
          // Trending grid
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadTrending}
                tintColor="#fbbf24"
              />
            }
          >
            {loading && tags.length === 0 ? (
              <ActivityIndicator color="#fbbf24" size="large" style={{ marginTop: 40 }} />
            ) : tags.length === 0 ? (
              <EmptyState
                icon="trending-up"
                title="لا يوجد رائج الآن"
                subtitle="انشر أول ريل مع #هاشتاج وكن أنت الترند!"
              />
            ) : (
              tags.map((t, i) => (
                <TouchableOpacity
                  key={t.tag}
                  style={styles.row}
                  onPress={() => openTag(t.tag)}
                  activeOpacity={0.85}
                >
                  <View style={styles.rankWrap}>
                    <Text style={[styles.rank, i < 3 && styles.rankTop]}>
                      {i + 1}
                    </Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.tagText}>#{t.tag}</Text>
                    <Text style={styles.tagScore}>
                      {(t.score || 0).toLocaleString("en-US")} تفاعل
                    </Text>
                  </View>
                  <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        ) : (
          // Tag detail: clips grid
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.gridScroll}
          >
            {tagLoading && tagClips.length === 0 ? (
              <ActivityIndicator color="#fbbf24" size="large" style={{ marginTop: 40 }} />
            ) : tagClips.length === 0 ? (
              <EmptyState
                icon="film-outline"
                title="لا يوجد ريلز بعد"
                subtitle={`لم ينشر أحد ريلز بـ #${activeTag} بعد`}
              />
            ) : (
              <View style={styles.grid}>
                {tagClips.map((clip) => (
                  <TouchableOpacity
                    key={clip.clip_id}
                    style={styles.tile}
                    activeOpacity={0.85}
                    onPress={() => {
                      onPlayClip && onPlayClip(clip);
                      onClose && onClose();
                    }}
                  >
                    {clip.thumbnail_url || clip.video_url ? (
                      <Image
                        source={{ uri: clip.thumbnail_url || clip.video_url }}
                        style={styles.tileImg}
                      />
                    ) : (
                      <View style={[styles.tileImg, styles.tileFallback]}>
                        <Ionicons name="play" size={24} color="rgba(255,255,255,0.6)" />
                      </View>
                    )}
                    <View style={styles.tileBadge}>
                      <Ionicons name="heart" size={11} color="#fff" />
                      <Text style={styles.tileBadgeText}>{clip.likes_count || 0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06070d" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  scroll: { paddingVertical: 12, paddingHorizontal: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    marginBottom: 8,
  },
  rankWrap: { width: 36, alignItems: "center" },
  rank: { color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: "800" },
  rankTop: { color: "#fbbf24", fontSize: 18 },
  rowBody: { flex: 1, alignItems: "flex-end" },
  tagText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  tagScore: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 },
  gridScroll: { padding: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  tile: { width: "33.33%", aspectRatio: 2 / 3, padding: 0.5, position: "relative" },
  tileImg: { width: "100%", height: "100%", backgroundColor: "#1e1e2e" },
  tileFallback: { alignItems: "center", justifyContent: "center" },
  tileBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tileBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});

export default TrendingHashtags;
