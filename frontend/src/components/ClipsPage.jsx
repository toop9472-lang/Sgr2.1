import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Heart, MessageCircle, UserPlus, UserCheck, Send, Upload, Play, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CLIP_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80',
];

const toAbsoluteMediaUrl = (value) => {
  const normalized = (value || '').trim();
  if (!normalized) return '';
  if (normalized.startsWith('http')) return normalized;
  if (normalized.startsWith('/')) return `${API_URL}${normalized}`;
  return normalized;
};

const ClipsPage = ({ user, onBack }) => {
  const { isRTL, language } = useLanguage();
  const { isDark } = useTheme();
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeClipId, setActiveClipId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentingId, setCommentingId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mutedVideos, setMutedVideos] = useState(true);
  const fileInputRef = useRef(null);
  const videoRefs = useRef(new Map());

  const tt = (ar, en) => (language === 'ar' ? ar : en);

  const isPlayableVideo = (url) => {
    const v = (url || '').toLowerCase();
    if (!v) return false;
    return (
      /\.(mp4|mov|webm|m4v)(\?|$)/.test(v) ||
      v.includes('/clips/media/') ||
      v.includes('/media/clips/') ||
      v.includes('/media/ads/')
    );
  };

  const loadClips = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_URL}/api/clips/feed`, {
        params: { viewer_id: user?.id || user?._id, limit: 30 },
      });
      const list = (res.data?.clips || []).map((c) => ({
        ...c,
        video_url: toAbsoluteMediaUrl(c.video_url),
        thumbnail_url: toAbsoluteMediaUrl(c.thumbnail_url),
      }));
      setClips(list);
    } catch (err) {
      console.error('Failed to load clips', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadClips();
  }, [loadClips]);

  // Instagram-style autoplay: play video when in viewport, pause when out
  useEffect(() => {
    if (!clips.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.intersectionRatio >= 0.6) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );
    videoRefs.current.forEach((v) => v && observer.observe(v));
    return () => observer.disconnect();
  }, [clips]);

  const handleToggleLike = async (clip) => {
    if (!user) return;
    const userId = user.id || user._id;
    // optimistic update
    setClips((prev) =>
      prev.map((c) =>
        c.clip_id === clip.clip_id
          ? {
              ...c,
              liked_by_me: !c.liked_by_me,
              likes_count: Math.max(0, (c.likes_count || 0) + (c.liked_by_me ? -1 : 1)),
            }
          : c
      )
    );
    try {
      await axios.post(`${API_URL}/api/clips/${clip.clip_id}/toggle-like`, {
        user_id: userId,
      });
    } catch (err) {
      // revert on error
      loadClips();
    }
  };

  const handleAddComment = async (clip) => {
    if (!commentText.trim() || !user) return;
    setCommentingId(clip.clip_id);
    try {
      await axios.post(`${API_URL}/api/clips/${clip.clip_id}/comment`, {
        user_id: user.id || user._id,
        user_name: user.name || user.username || tt('مستخدم', 'User'),
        content: commentText.trim(),
      });
      setCommentText('');
      await loadClips();
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setCommentingId(null);
    }
  };

  const handleToggleFollow = async (clip) => {
    if (!user) return;
    const userId = user.id || user._id;
    if (!clip.user_id || clip.user_id === userId) return;
    setClips((prev) =>
      prev.map((c) =>
        c.user_id === clip.user_id
          ? {
              ...c,
              followed_by_me: !c.followed_by_me,
              followers_count: Math.max(0, (c.followers_count || 0) + (c.followed_by_me ? -1 : 1)),
            }
          : c
      )
    );
    try {
      await axios.post(`${API_URL}/api/clips/follow/toggle`, {
        viewer_user_id: userId,
        target_user_id: clip.user_id,
      });
    } catch (err) {
      loadClips();
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !user) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('user_id', user.id || user._id);
      formData.append('user_name', user.name || user.username || tt('مستخدم', 'User'));
      formData.append('caption', uploadCaption || '');
      await axios.post(`${API_URL}/api/clips/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowUpload(false);
      setUploadFile(null);
      setUploadCaption('');
      await loadClips();
    } catch (err) {
      console.error('Upload failed', err);
      alert(tt('فشل الرفع، حاول مرة أخرى', 'Upload failed, please try again'));
    } finally {
      setUploading(false);
    }
  };

  const bg = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const cardBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200';
  const text = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className={`min-h-screen ${bg} ${text}`} dir={isRTL ? 'rtl' : 'ltr'} data-testid="clips-page">
      {/* Header */}
      <div className={`sticky top-0 z-20 backdrop-blur-md ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white/80 border-slate-200'} border-b`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition`}
            data-testid="clips-back-btn"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-lg font-bold">{tt('المقاطع', 'Reels')}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={loadClips}
              disabled={refreshing}
              className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition`}
              data-testid="clips-refresh-btn"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 transition shadow-md"
              data-testid="clips-upload-open-btn"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading && (
          <div className="text-center py-20" data-testid="clips-loading">
            <div className="inline-block w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className={`mt-4 ${textMuted}`}>{tt('جاري التحميل...', 'Loading...')}</p>
          </div>
        )}

        {!loading && clips.length === 0 && (
          <div className={`text-center py-20 border-2 border-dashed rounded-2xl ${isDark ? 'border-slate-800' : 'border-slate-300'}`} data-testid="clips-empty">
            <Play className={`w-16 h-16 mx-auto mb-4 ${textMuted}`} />
            <p className={`text-lg font-semibold ${text}`}>{tt('لا توجد مقاطع بعد', 'No reels yet')}</p>
            <p className={`mt-2 ${textMuted}`}>{tt('كن أول من يشارك مقطعاً!', 'Be the first to share a reel!')}</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:opacity-90 transition"
              data-testid="clips-upload-empty-btn"
            >
              {tt('رفع مقطع', 'Upload a Reel')}
            </button>
          </div>
        )}

        {clips.map((clip, idx) => {
          const placeholder = CLIP_PLACEHOLDERS[idx % CLIP_PLACEHOLDERS.length];
          const mediaSrc = clip.video_url || clip.thumbnail_url || placeholder;
          const isVideo = isPlayableVideo(clip.video_url);
          const isOwn = (user?.id || user?._id) === clip.user_id;
          return (
            <article
              key={clip.clip_id}
              className={`rounded-2xl border overflow-hidden ${cardBg} shadow-lg`}
              data-testid={`clip-card-${clip.clip_id}`}
            >
              {/* Author */}
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!isOwn && onOpenUserProfile && clip.user_id) {
                      onOpenUserProfile(clip.user_id);
                    }
                  }}
                  className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
                  data-testid={`clip-author-btn-${clip.clip_id}`}
                  disabled={isOwn}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    {clip.user_avatar ? (
                      <img src={clip.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (clip.user_name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{clip.user_name || tt('مستخدم', 'User')}</p>
                    <p className={`text-xs ${textMuted}`}>
                      {clip.followers_count || 0} {tt('متابع', 'followers')}
                    </p>
                  </div>
                </button>
                {!isOwn && (
                  <button
                    onClick={() => handleToggleFollow(clip)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition ${
                      clip.followed_by_me
                        ? isDark
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-200 text-slate-700'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90'
                    }`}
                    data-testid={`clip-follow-btn-${clip.clip_id}`}
                  >
                    {clip.followed_by_me ? (
                      <>
                        <UserCheck className="w-4 h-4" /> {tt('متابَع', 'Following')}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> {tt('متابعة', 'Follow')}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Media */}
              <div className="relative bg-black aspect-[9/16] max-h-[600px] flex items-center justify-center overflow-hidden">
                {isVideo ? (
                  <>
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current.set(clip.clip_id, el);
                        else videoRefs.current.delete(clip.clip_id);
                      }}
                      src={mediaSrc}
                      poster={clip.thumbnail_url || placeholder}
                      playsInline
                      loop
                      muted={mutedVideos}
                      preload="metadata"
                      onClick={(e) => {
                        const v = e.currentTarget;
                        if (v.paused) v.play().catch(() => {});
                        else v.pause();
                      }}
                      className="w-full h-full object-cover cursor-pointer"
                      data-testid={`clip-video-${clip.clip_id}`}
                    />
                    {/* Mute toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMutedVideos((m) => !m);
                      }}
                      className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/75 transition"
                      data-testid={`clip-mute-btn-${clip.clip_id}`}
                      aria-label="toggle sound"
                    >
                      {mutedVideos ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </button>
                  </>
                ) : (
                  <img
                    src={mediaSrc}
                    alt={clip.title || 'reel'}
                    className="w-full h-full object-cover"
                    data-testid={`clip-image-${clip.clip_id}`}
                  />
                )}
              </div>

              {/* Caption */}
              {(clip.caption || clip.content) && (
                <p className={`px-4 pt-3 ${text}`}>{clip.caption || clip.content}</p>
              )}

              {/* Actions */}
              <div className="px-4 py-3 flex items-center gap-4 border-t border-slate-700/30">
                <button
                  onClick={() => handleToggleLike(clip)}
                  className="flex items-center gap-1.5 transition hover:scale-105"
                  data-testid={`clip-like-btn-${clip.clip_id}`}
                >
                  <Heart
                    className={`w-6 h-6 ${
                      clip.liked_by_me ? 'fill-pink-500 text-pink-500' : textMuted
                    }`}
                  />
                  <span className={`text-sm font-semibold ${text}`}>{clip.likes_count || 0}</span>
                </button>
                <button
                  onClick={() => setActiveClipId(activeClipId === clip.clip_id ? null : clip.clip_id)}
                  className="flex items-center gap-1.5 transition hover:scale-105"
                  data-testid={`clip-comment-btn-${clip.clip_id}`}
                >
                  <MessageCircle className={`w-6 h-6 ${textMuted}`} />
                  <span className={`text-sm font-semibold ${text}`}>{clip.comments_count || 0}</span>
                </button>
              </div>

              {/* Comments */}
              {activeClipId === clip.clip_id && (
                <div className={`border-t ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="max-h-60 overflow-y-auto px-4 py-3 space-y-2" data-testid={`clip-comments-${clip.clip_id}`}>
                    {(clip.comments || []).length === 0 && (
                      <p className={`text-sm ${textMuted} text-center py-3`}>
                        {tt('لا توجد تعليقات بعد', 'No comments yet')}
                      </p>
                    )}
                    {(clip.comments || []).map((c, i) => (
                      <div key={c.comment_id || i} className="flex gap-2 items-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(c.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className={`flex-1 px-3 py-2 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
                          <p className="text-xs font-semibold">{c.user_name}</p>
                          <p className={`text-sm ${text}`}>{c.content || c.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-700/30">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={tt('أضف تعليقاً...', 'Add a comment...')}
                      className={`flex-1 px-4 py-2 rounded-full text-sm outline-none ${
                        isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-white border border-slate-200 text-slate-900'
                      }`}
                      data-testid={`clip-comment-input-${clip.clip_id}`}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(clip)}
                    />
                    <button
                      onClick={() => handleAddComment(clip)}
                      disabled={commentingId === clip.clip_id || !commentText.trim()}
                      className="p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white disabled:opacity-50 hover:opacity-90 transition"
                      data-testid={`clip-comment-send-btn-${clip.clip_id}`}
                    >
                      <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="clips-upload-modal">
          <div className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-white'} shadow-2xl overflow-hidden`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
              <h3 className="text-lg font-bold">{tt('رفع مقطع جديد', 'Upload New Reel')}</h3>
              <button
                onClick={() => setShowUpload(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                data-testid="clips-upload-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="hidden"
                data-testid="clips-upload-file-input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition ${
                  isDark ? 'border-slate-700 hover:border-pink-500 bg-slate-800/30' : 'border-slate-300 hover:border-pink-500 bg-slate-50'
                }`}
                data-testid="clips-upload-pick-btn"
              >
                <Upload className={`w-8 h-8 ${textMuted}`} />
                <p className={`text-sm font-semibold ${text}`}>
                  {uploadFile ? uploadFile.name : tt('اختر ملف فيديو أو صورة', 'Choose video or image')}
                </p>
                <p className={`text-xs ${textMuted}`}>{tt('حتى 60 ميجابايت', 'Up to 60 MB')}</p>
              </button>
              <textarea
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder={tt('اكتب وصفاً (اختياري)...', 'Write a caption (optional)...')}
                rows={3}
                maxLength={220}
                className={`w-full px-4 py-3 rounded-xl outline-none resize-none ${
                  isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-slate-100 text-slate-900'
                }`}
                data-testid="clips-upload-caption-input"
              />
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold disabled:opacity-50 hover:opacity-90 transition"
                data-testid="clips-upload-submit-btn"
              >
                {uploading ? tt('جاري الرفع...', 'Uploading...') : tt('نشر', 'Publish')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClipsPage;
