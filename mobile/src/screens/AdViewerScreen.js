// Ad Viewer Screen - مطابق للويب
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
  Vibration,
  Platform,
} from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import storage from '../services/storage';

const { width, height } = Dimensions.get('window');

// Demo ads
const DEMO_ADS = [
  {
    id: 'demo1',
    title: 'Samsung Galaxy S24',
    description: 'اكتشف هاتف سامسونج الجديد بتقنيات متطورة',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    advertiser: 'Samsung',
    website_url: 'https://www.samsung.com/sa/',
    duration: 60,
    points_per_minute: 1,
  },
  {
    id: 'demo2',
    title: 'عروض أمازون',
    description: 'تخفيضات حتى 50% على جميع المنتجات',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    advertiser: 'Amazon',
    website_url: 'https://www.amazon.sa/',
    duration: 45,
    points_per_minute: 1,
  },
  {
    id: 'demo3',
    title: 'مطعم الذواقة',
    description: 'وجبات شهية بأسعار مناسبة',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    advertiser: 'Gourmet',
    website_url: 'https://example.com',
    duration: 30,
    points_per_minute: 1,
  },
];

const AdViewerScreen = ({ onClose, onPointsEarned, user }) => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalEarnedSession, setTotalEarnedSession] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [viewersCount, setViewersCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  
  const videoRef = useRef(null);
  const watchTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const lastRewardedTimeRef = useRef(0);
  const touchStartRef = useRef({ y: 0, x: 0, time: 0 });

  const currentAd = ads[currentIndex];

  // Load ads
  useEffect(() => {
    loadAds();
    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const loadAds = async () => {
    try {
      const response = await api.getAds();
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const shuffled = data.sort(() => Math.random() - 0.5);
          setAds(shuffled);
        } else {
          setAds(DEMO_ADS);
        }
      } else {
        setAds(DEMO_ADS);
      }
    } catch {
      setAds(DEMO_ADS);
    } finally {
      setIsLoading(false);
    }
  };

  // Watch timer with points
  useEffect(() => {
    if (isPlaying && currentAd) {
      watchTimerRef.current = setInterval(() => {
        setWatchTime((prev) => {
          const newTime = prev + 1;
          
          // Every 60 seconds = 1 point
          const currentMinute = Math.floor(newTime / 60);
          const lastRewardedMinute = Math.floor(lastRewardedTimeRef.current / 60);
          
          if (newTime > 0 && newTime % 60 === 0 && newTime <= currentAd.duration && currentMinute > lastRewardedMinute) {
            lastRewardedTimeRef.current = newTime;
            handlePointsEarned(1);
          }

          if (newTime >= currentAd.duration) {
            clearInterval(watchTimerRef.current);
            return currentAd.duration;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(watchTimerRef.current);
  }, [isPlaying, currentAd]);

  // Reset on ad change
  useEffect(() => {
    setWatchTime(0);
    lastRewardedTimeRef.current = 0;
    setVideoLoading(true);
  }, [currentIndex]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(controlsTimerRef.current);
  }, [showControls, isPlaying]);

  const handlePointsEarned = async (points) => {
    setEarnedPoints(points);
    setTotalEarnedSession(prev => prev + points);
    setShowPointsAnimation(true);
    Vibration.vibrate(100);
    
    setTimeout(() => setShowPointsAnimation(false), 3000);
    
    if (onPointsEarned) onPointsEarned(points);
    
    // Record to server
    const token = await storage.getToken();
    if (token && currentAd) {
      try {
        await api.recordAdView(currentAd.id, 60, token, points);
      } catch (e) {
        console.log('Failed to record points');
      }
    }
  };

  const navigateAd = (direction) => {
    if (direction === 'next' && currentIndex < ads.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTap = () => {
    setShowControls(prev => !prev);
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      y: e.nativeEvent.pageY,
      x: e.nativeEvent.pageX,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e) => {
    const dy = e.nativeEvent.pageY - touchStartRef.current.y;
    const dx = e.nativeEvent.pageX - touchStartRef.current.x;
    const timeDiff = Date.now() - touchStartRef.current.time;

    // Swipe detection
    if (Math.abs(dy) > 80 && timeDiff < 300) {
      if (dy < 0) navigateAd('next');
      else navigateAd('prev');
    } else if (Math.abs(dy) < 10 && Math.abs(dx) < 10) {
      handleTap();
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const visitWebsite = () => {
    if (currentAd?.website_url) {
      Linking.openURL(currentAd.website_url);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = currentAd ? (watchTime / currentAd.duration) * 100 : 0;
  const minutesWatched = Math.floor(watchTime / 60);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (ads.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="play-circle-outline" size={80} color="#4b5563" />
        <Text style={styles.emptyText}>لا توجد إعلانات متاحة</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backBtnText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View 
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video */}
      <Video
        ref={videoRef}
        source={{ uri: currentAd.video_url }}
        style={styles.video}
        resizeMode="cover"
        shouldPlay={isPlaying}
        isLooping
        isMuted={isMuted}
        onLoadStart={() => setVideoLoading(true)}
        onLoad={() => setVideoLoading(false)}
      />

      {/* Dark overlay when paused */}
      {!isPlaying && <View style={styles.pauseOverlay} />}

      {/* Video loading */}
      {videoLoading && (
        <View style={styles.videoLoadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}

      {/* Points Animation - Center */}
      {showPointsAnimation && (
        <View style={styles.pointsAnimContainer}>
          <View style={styles.pointsAnimCard}>
            <View style={styles.pointsAnimGlow} />
            <View style={styles.pointsAnimInner}>
              <View style={styles.pointsAnimIcon}>
                <Ionicons name="sparkles" size={32} color="#fff" />
              </View>
              <Text style={styles.pointsAnimTitle}>مبروك! أكملت دقيقة</Text>
              <View style={styles.pointsAnimRow}>
                <Ionicons name="sparkles" size={28} color="#fbbf24" />
                <Text style={styles.pointsAnimValue}>+{earnedPoints}</Text>
                <Ionicons name="gift" size={28} color="#fbbf24" />
              </View>
              <Text style={styles.pointsAnimSubtext}>نقطة مضافة لرصيدك</Text>
            </View>
          </View>
        </View>
      )}

      {/* Session Earnings - Top Center (Always visible) */}
      {totalEarnedSession > 0 && (
        <View style={styles.sessionBadge}>
          <Ionicons name="flash" size={14} color="#000" />
          <Text style={styles.sessionBadgeText}>ربحت اليوم: +{totalEarnedSession}</Text>
        </View>
      )}

      {/* Controls - Animated */}
      {showControls && (
        <>
          {/* Top Gradient */}
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />

          {/* Bottom Gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          {/* Close Button - Top Left */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Watching Now - Top Right */}
          <View style={styles.viewersBadge}>
            <View style={styles.liveDot} />
            <Ionicons name="eye" size={14} color="#fff" />
            <Text style={styles.viewersText}>{viewersCount || 1}</Text>
          </View>

          {/* Points per minute - Top Left below close */}
          <View style={styles.pointsBadge}>
            <Ionicons name="sparkles" size={14} color="#fff" />
            <Text style={styles.pointsBadgeText}>+{currentAd?.points_per_minute || 1} نقطة/دقيقة</Text>
          </View>

          {/* Right Side Actions */}
          <View style={styles.rightActions}>
            {/* Mute */}
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => setIsMuted(!isMuted)}
            >
              <Ionicons 
                name={isMuted ? 'volume-mute' : 'volume-high'} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>

            {/* Play/Pause */}
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={togglePlayPause}
            >
              {isPlaying ? (
                <View style={styles.pauseIcon}>
                  <View style={styles.pauseBar} />
                  <View style={styles.pauseBar} />
                </View>
              ) : (
                <Ionicons name="play" size={24} color="#fff" />
              )}
            </TouchableOpacity>

            {/* Navigation */}
            <TouchableOpacity 
              style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              onPress={() => navigateAd('prev')}
              disabled={currentIndex === 0}
            >
              <Ionicons name="chevron-up" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navBtn, currentIndex === ads.length - 1 && styles.navBtnDisabled]}
              onPress={() => navigateAd('next')}
              disabled={currentIndex === ads.length - 1}
            >
              <Ionicons name="chevron-down" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom Content */}
          <View style={styles.bottomContent}>
            {/* Advertiser */}
            <View style={styles.advertiserRow}>
              <View style={styles.advertiserAvatar}>
                <Text style={styles.avatarText}>
                  {(currentAd?.advertiser || 'A')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.advertiserInfo}>
                <View style={styles.advertiserNameRow}>
                  <Text style={styles.advertiserName}>@{currentAd?.advertiser || 'advertiser'}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                </View>
                <Text style={styles.viewsText}>{(totalViews || 0).toLocaleString()} مشاهدة</Text>
              </View>
            </View>

            {/* Title & Description */}
            <Text style={styles.adTitle}>{currentAd?.title}</Text>
            <Text style={styles.adDescription} numberOfLines={2}>{currentAd?.description}</Text>

            {/* Visit Website */}
            {currentAd?.website_url && (
              <TouchableOpacity style={styles.visitBtn} onPress={visitWebsite}>
                <Ionicons name="open-outline" size={16} color="#000" />
                <Text style={styles.visitBtnText}>زيارة الموقع</Text>
              </TouchableOpacity>
            )}

            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressTime}>⏱ {formatTime(watchTime)}</Text>
                <View style={styles.progressRight}>
                  <View style={styles.minutesBadge}>
                    <Text style={styles.minutesText}>{minutesWatched} دقيقة</Text>
                  </View>
                  <Text style={styles.progressTotal}>{formatTime(currentAd?.duration || 0)}</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          </View>

          {/* Ad Counter - Bottom Center */}
          <View style={styles.adCounter}>
            {ads.slice(Math.max(0, currentIndex - 2), Math.min(ads.length, currentIndex + 3)).map((_, idx) => {
              const actualIdx = Math.max(0, currentIndex - 2) + idx;
              return (
                <View 
                  key={actualIdx}
                  style={[
                    styles.counterDot,
                    actualIdx === currentIndex && styles.counterDotActive
                  ]}
                />
              );
            })}
          </View>
        </>
      )}

      {/* Tap hint when controls hidden */}
      {!showControls && (
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>المس للتحكم</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  
  // Points Animation
  pointsAnimContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  pointsAnimCard: {
    position: 'relative',
  },
  pointsAnimGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(251,191,36,0.3)',
    borderRadius: 40,
  },
  pointsAnimInner: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  pointsAnimIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsAnimTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  pointsAnimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsAnimValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  pointsAnimSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 8,
  },

  // Session Badge
  sessionBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 30,
  },
  sessionBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Gradients
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 10,
  },

  // Close Button
  closeBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 20,
  },

  // Viewers Badge
  viewersBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  viewersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Points Badge
  pointsBadge: {
    position: 'absolute',
    top: 110,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99,102,241,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  pointsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Right Actions
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    alignItems: 'center',
    gap: 12,
    zIndex: 20,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 4,
  },
  pauseBar: {
    width: 4,
    height: 18,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },

  // Bottom Content
  bottomContent: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 80,
    zIndex: 20,
  },
  advertiserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  advertiserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  advertiserInfo: {
    flex: 1,
  },
  advertiserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  advertiserName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  adTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  visitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  visitBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Progress
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  progressRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minutesBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  minutesText: {
    color: '#fff',
    fontSize: 11,
  },
  progressTotal: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },

  // Ad Counter
  adCounter: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
    zIndex: 20,
  },
  counterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  counterDotActive: {
    width: 24,
    backgroundColor: '#fff',
  },

  // Tap Hint
  tapHint: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    zIndex: 10,
  },
  tapHintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
});

export default memo(AdViewerScreen);
