// Ad Viewer Screen - Clean Design matching Web version
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
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import storage from '../services/storage';

const { width, height } = Dimensions.get('window');

// Demo ads
const DEMO_ADS = [
  {
    id: 'demo1',
    title: 'Samsung Galaxy S24',
    description: 'اكتشف هاتف سامسونج الجديد',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    advertiser: 'Samsung',
    website_url: 'https://www.samsung.com/sa/',
    duration: 60,
    points_per_minute: 1,
  },
  {
    id: 'demo2',
    title: 'عروض أمازون',
    description: 'تخفيضات حتى 50%',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    advertiser: 'Amazon',
    website_url: 'https://www.amazon.sa/',
    duration: 45,
    points_per_minute: 1,
  },
  {
    id: 'demo3',
    title: 'مطعم الذواقة',
    description: 'وجبات شهية',
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
  const [showControls, setShowControls] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalEarnedSession, setTotalEarnedSession] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      )}

      {/* Top Bar - Always visible */}
      <View style={styles.topBar}>
        {/* Back Button */}
        <TouchableOpacity style={styles.topBtn} onPress={onClose}>
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Info Bar */}
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>{totalEarnedSession}</Text>
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text style={styles.infoDivider}>·</Text>
          <Text style={styles.infoText}>{currentAd?.duration || 60}s</Text>
          <Text style={styles.infoDivider}>·</Text>
          <Text style={styles.infoText}>{formatTime(watchTime)}</Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.topBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Sound Button - Bottom Right - Always visible */}
      <TouchableOpacity 
        style={styles.soundBtn}
        onPress={() => setIsMuted(!isMuted)}
      >
        <Ionicons 
          name={isMuted ? 'volume-mute' : 'volume-high'} 
          size={20} 
          color="rgba(255,255,255,0.7)" 
        />
      </TouchableOpacity>

      {/* Tap hint when controls hidden */}
      {!showControls && (
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>المس للتحكم</Text>
        </View>
      )}

      {/* Controls - Shown on tap */}
      {showControls && (
        <>
          {/* Play/Pause - Center */}
          <TouchableOpacity 
            style={styles.playPauseBtn}
            onPress={togglePlayPause}
          >
            {isPlaying ? (
              <View style={styles.pauseIcon}>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </View>
            ) : (
              <Ionicons name="play" size={32} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Navigation - Bottom Center */}
          <View style={styles.navContainer}>
            <TouchableOpacity 
              style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              onPress={() => navigateAd('prev')}
              disabled={currentIndex === 0}
            >
              <Ionicons name="chevron-up" size={24} color="#fff" />
              <Text style={styles.navText}>السابق</Text>
            </TouchableOpacity>

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

            <TouchableOpacity 
              style={[styles.navBtn, currentIndex === ads.length - 1 && styles.navBtnDisabled]}
              onPress={() => navigateAd('next')}
              disabled={currentIndex === ads.length - 1}
            >
              <Text style={styles.navText}>التالي</Text>
              <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
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

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 30,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  infoDivider: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },

  // Sound Button
  soundBtn: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },

  // Tap Hint
  tapHint: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    zIndex: 10,
  },
  tapHintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },

  // Play/Pause
  playPauseBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -32,
    marginLeft: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 6,
  },
  pauseBar: {
    width: 6,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 3,
  },

  // Navigation
  navContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  navBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },

  // Ad Counter
  adCounter: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 12,
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
});

export default memo(AdViewerScreen);
