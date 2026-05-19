// Full-screen story viewer with progress bars at the top (Instagram-style).
// Tap right = next, tap left = previous, swipe down = close.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";

const { width, height } = Dimensions.get("window");

const STORY_DURATION_MS = 6000; // image stories: 6 seconds

const StoryViewer = ({ visible, userStories, viewerId, onClose }) => {
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const stories = useMemo(() => userStories?.stories || [], [userStories]);
  const current = stories[index];

  const advance = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex(index + 1);
    } else {
      onClose && onClose();
    }
  }, [index, stories.length, onClose]);

  const recede = useCallback(() => {
    if (index > 0) setIndex(index - 1);
  }, [index]);

  // Mark current story as viewed
  useEffect(() => {
    if (current?.id && viewerId) {
      api.viewStory(current.id, viewerId).catch(() => {});
    }
  }, [current?.id, viewerId]);

  // Reset + animate progress whenever index changes (or on open)
  useEffect(() => {
    if (!visible || !current) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) advance();
    });
    return () => animation.stop();
  }, [visible, index, current, advance, progress]);

  // Reset index when a new user is opened
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible, userStories?.user_id]);

  if (!visible || !current) return null;

  const isVideo = current.media_type === "video";

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Media */}
        {isVideo ? (
          <Video
            source={{ uri: current.media_url }}
            style={StyleSheet.absoluteFill}
            shouldPlay
            isLooping={false}
            resizeMode={ResizeMode.COVER}
            volume={1.0}
            isMuted={false}
            onPlaybackStatusUpdate={(status) => {
              if (status?.didJustFinish) advance();
            }}
          />
        ) : (
          <Image source={{ uri: current.media_url }} style={styles.media} resizeMode="cover" />
        )}

        {/* Progress bars */}
        <View style={styles.progressRow}>
          {stories.map((_, i) => {
            const widthAnim =
              i < index ? "100%" : i > index ? "0%" : progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              });
            return (
              <View key={i} style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: widthAnim }]} />
              </View>
            );
          })}
        </View>

        {/* Header user info */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {current.user_name || "مستخدم"}
            </Text>
          </View>
          {current.user_avatar ? (
            <Image source={{ uri: current.user_avatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>
                {(current.user_name || "?")[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Caption */}
        {!!current.caption && (
          <View style={styles.captionWrap}>
            <Text style={styles.captionText}>{current.caption}</Text>
          </View>
        )}

        {/* Tap zones — left to recede, right to advance */}
        <TouchableOpacity activeOpacity={1} style={styles.zoneLeft} onPress={recede} />
        <TouchableOpacity activeOpacity={1} style={styles.zoneRight} onPress={advance} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  media: { width, height },
  progressRow: {
    position: "absolute",
    top: 48,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#fff" },
  header: {
    position: "absolute",
    top: 58,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1 },
  headerName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  headerAvatar: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    backgroundColor: "#1e1e2e",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "#fff", fontWeight: "800" },
  captionWrap: {
    position: "absolute",
    bottom: 40,
    left: 18,
    right: 18,
  },
  captionText: {
    color: "#fff",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    textAlign: "center",
  },
  zoneLeft: { position: "absolute", top: 100, left: 0, width: width * 0.35, bottom: 60 },
  zoneRight: { position: "absolute", top: 100, right: 0, width: width * 0.65, bottom: 60 },
});

export default StoryViewer;
