import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Lock,
  Grid3x3,
  Heart,
  Play,
  UserPlus,
  UserMinus,
  Send,
  Film,
} from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Public profile view for another user (opened from Reels caption / Chat avatar).
 * Mirrors Mobile UserProfileScreen.js.
 */
const UserProfilePage = ({ user, targetUserId, onClose, onOpenChat }) => {
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();
  const viewerId = user?.id || user?._id;

  const [profile, setProfile] = useState(null);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);

  const isSelf = useMemo(
    () => Boolean(viewerId && profile?.user_id === viewerId),
    [viewerId, profile?.user_id],
  );

  const loadProfile = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const profileRes = await fetch(
        `${API_URL}/api/users/public-profile/${encodeURIComponent(targetUserId)}${
          viewerId ? `?viewer_id=${encodeURIComponent(viewerId)}` : ''
        }`,
        { credentials: 'include' },
      );
      if (!profileRes.ok) throw new Error(isRTL ? 'تعذر تحميل الملف الشخصي' : 'Failed to load profile');
      const profileData = await profileRes.json();
      setProfile(profileData);

      if (profileData.can_view_clips) {
        const clipsRes = await fetch(
          `${API_URL}/api/users/clips/${encodeURIComponent(targetUserId)}${
            viewerId ? `?viewer_id=${encodeURIComponent(viewerId)}` : ''
          }`,
          { credentials: 'include' },
        );
        if (clipsRes.ok) {
          const clipsData = await clipsRes.json();
          setClips(clipsData?.clips || []);
        }
      } else {
        setClips([]);
      }
    } catch (e) {
      toast.error(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [targetUserId, viewerId, isRTL]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggleFollow = useCallback(async () => {
    if (!viewerId || !profile?.user_id || followBusy) return;
    setFollowBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/clips/follow/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          follower_user_id: viewerId,
          target_user_id: profile.user_id,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || (isRTL ? 'فشلت العملية' : 'Operation failed'));
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followed_by_me: Boolean(data?.is_following),
              followers_count: Math.max(
                0,
                (prev.followers_count || 0) + (data?.is_following ? 1 : -1),
              ),
            }
          : prev,
      );
    } catch (e) {
      toast.error(String(e?.message || e));
    } finally {
      setFollowBusy(false);
    }
  }, [followBusy, profile?.user_id, viewerId, isRTL]);

  const handleMessage = useCallback(() => {
    if (!profile?.user_id || isSelf) return;
    if (onOpenChat) {
      onOpenChat({
        id: profile.user_id,
        user_id: profile.user_id,
        name: profile.name,
        avatar: profile.avatar,
      });
    } else {
      toast.info(isRTL ? 'افتح صفحة الرسائل الخاصة من القائمة' : 'Open private messages from the menu');
    }
  }, [isSelf, onOpenChat, profile, isRTL]);

  const bgClass = isDark ? 'bg-[#0f172a]' : 'bg-slate-50';
  const cardBg = isDark ? 'bg-[#0f172a]/60 border-white/8' : 'bg-white border-slate-200';
  const ChevronBack = isRTL ? ChevronRight : ChevronLeft;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`} data-testid="user-profile-loading">
        <div className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bgClass}`}>
        <p className="text-white">{isRTL ? 'تعذر تحميل الملف الشخصي' : 'Failed to load profile'}</p>
        <Button onClick={onClose} className="bg-blue-500 hover:bg-blue-600 text-white">
          {isRTL ? 'عودة' : 'Back'}
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} pb-24 relative overflow-hidden`} data-testid="user-profile-page">
      {/* Header gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pointer-events-none" />

      <div className="relative z-10">
        {/* Header bar — small icon */}
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/12 flex items-center justify-center transition-colors"
            data-testid="user-profile-back-btn"
          >
            <ChevronBack className="text-white" size={16} />
          </button>
          <h1 className="text-white text-sm font-semibold flex-1 text-center truncate px-3">
            {profile.name}
          </h1>
          <div className="w-8" />
        </div>

        {/* Avatar + name (kept generous) */}
        <div className="flex flex-col items-center px-6 pt-2 pb-3">
          <div className="p-1 rounded-full border-2 border-blue-400/40 mb-3">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-600 flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {(profile.name || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h2 className="text-white text-lg font-bold mb-1">{profile.name}</h2>
          {profile.is_private && (
            <div className="flex items-center gap-1 bg-amber-500/18 border border-amber-500/40 rounded-full px-2 py-0.5 mt-0.5">
              <Lock className="text-amber-400" size={9} />
              <span className="text-amber-400 text-[10px] font-semibold">
                {isRTL ? 'حساب خاص' : 'Private'}
              </span>
            </div>
          )}
          {!!profile.bio && (
            <p className="text-slate-300/80 text-xs text-center mt-2 leading-relaxed max-w-md">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats — compact */}
        <div className={`mx-5 my-3 rounded-2xl border py-2.5 flex items-center ${cardBg}`}>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-white text-base font-bold leading-tight">{profile.clips_count || 0}</span>
            <span className="text-slate-400 text-[10px] mt-0.5">{isRTL ? 'ريلز' : 'Reels'}</span>
          </div>
          <div className="w-px h-6 bg-white/8" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-white text-base font-bold leading-tight">{profile.followers_count || 0}</span>
            <span className="text-slate-400 text-[10px] mt-0.5">{isRTL ? 'متابعون' : 'Followers'}</span>
          </div>
          <div className="w-px h-6 bg-white/8" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-white text-base font-bold leading-tight">{profile.following_count || 0}</span>
            <span className="text-slate-400 text-[10px] mt-0.5">{isRTL ? 'يتابع' : 'Following'}</span>
          </div>
        </div>

        {/* Action buttons — single toggle Follow/Unfollow + Message, small icons */}
        {!isSelf && (
          <div className="flex gap-2 mx-5 mb-4">
            <button
              disabled={followBusy}
              onClick={handleToggleFollow}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                profile.followed_by_me
                  ? 'bg-white/6 border-white/16 text-slate-300 hover:bg-white/10 hover:border-white/25'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-500/0 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/15'
              } ${followBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
              data-testid="user-profile-follow-btn"
            >
              {profile.followed_by_me ? (
                <>
                  <UserMinus size={13} />
                  {isRTL ? 'إلغاء الإضافة' : 'Unfollow'}
                </>
              ) : (
                <>
                  <UserPlus size={13} />
                  {isRTL ? 'إضافة' : 'Follow'}
                </>
              )}
            </button>
            <button
              onClick={handleMessage}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/12 text-blue-200 hover:bg-indigo-500/22 text-xs font-semibold transition-colors"
              data-testid="user-profile-message-btn"
            >
              <Send size={13} />
              {isRTL ? 'رسالة' : 'Message'}
            </button>
          </div>
        )}

        {/* Tab strip — Reels indicator */}
        <div className="flex items-center justify-center border-t border-white/6 px-4">
          <div className="flex items-center gap-1.5 px-3 py-2.5 border-b-2 border-blue-400">
            <Grid3x3 size={13} className="text-blue-300" />
            <span className="text-blue-200 text-[11px] font-semibold tracking-wider uppercase">
              {isRTL ? 'الريلز' : 'Reels'}
            </span>
            <span className="text-blue-400/70 text-[11px] font-semibold">
              ({profile.clips_count || 0})
            </span>
          </div>
        </div>

        {/* Reels content area */}
        {!profile.can_view_clips ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center mb-3">
              <Lock className="text-amber-400" size={22} />
            </div>
            <p className="text-slate-200 text-sm font-semibold mb-1">
              {isRTL ? 'هذا الحساب خاص' : 'This account is private'}
            </p>
            <p className="text-slate-400 text-xs text-center max-w-xs">
              {isRTL ? 'تابع المستخدم لعرض مقاطعه.' : 'Follow this user to view their reels.'}
            </p>
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
              <Film className="text-slate-500" size={22} />
            </div>
            <p className="text-slate-300 text-sm font-medium">
              {isRTL ? 'لم ينشر أي ريلز بعد' : 'No reels yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 px-1 pt-1">
            {clips.map((clip) => {
              const thumb = clip.thumbnail_url || clip.video_url || '';
              return (
                <button
                  key={clip.clip_id}
                  className="relative aspect-[2/3] bg-slate-800/70 rounded-md overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                  data-testid={`user-profile-clip-${clip.clip_id}`}
                  type="button"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-700/60">
                      <Play className="text-white/70" size={18} />
                    </div>
                  )}
                  {/* gradient overlay for readability */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />
                  <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-black/55 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <Heart className="text-rose-400" size={9} fill="currentColor" />
                    <span className="text-white text-[9px] font-semibold">
                      {clip.likes_count || 0}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
