// صفحة الأصدقاء للويب - Friends Page
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Mail, Search, UserPlus, Check, X, MessageCircle, Gamepad2, UserMinus, Flag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// مكون بطاقة الصديق
const FriendCard = ({ friend, onMessage, onRemove, onInvite }) => (
  <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
    <div 
      className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg"
    >
      {friend.name?.charAt(0) || '?'}
    </div>
    
    <div className="flex-1">
      <h4 className="text-white font-semibold">{friend.name}</h4>
      <p className="text-gray-500 text-sm">
        صديق منذ {new Date(friend.friendship_date).toLocaleDateString('ar-SA')}
      </p>
    </div>

    <div className="flex gap-2">
      <button 
        onClick={() => onMessage(friend)}
        className="w-10 h-10 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center transition-colors"
        title="رسالة"
      >
        <Mail className="w-5 h-5 text-blue-400" />
      </button>
      <button 
        onClick={() => onInvite(friend)}
        className="w-10 h-10 rounded-lg bg-green-500/20 hover:bg-green-500/30 flex items-center justify-center transition-colors"
        title="دعوة للعب"
      >
        <Gamepad2 className="w-5 h-5 text-green-400" />
      </button>
      <button 
        onClick={() => onRemove(friend)}
        className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
        title="إزالة"
      >
        <UserMinus className="w-5 h-5 text-red-400" />
      </button>
    </div>
  </div>
);

// مكون طلب الصداقة
const FriendRequestCard = ({ request, type, onAccept, onReject }) => (
  <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
    <div 
      className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg"
    >
      {request.from_user_name?.charAt(0) || '?'}
    </div>
    
    <div className="flex-1">
      <h4 className="text-white font-semibold">{request.from_user_name}</h4>
      <p className="text-gray-500 text-sm">
        {type === 'incoming' ? 'يريد إضافتك كصديق' : 'في انتظار الرد'}
      </p>
    </div>

    {type === 'incoming' && (
      <div className="flex gap-2">
        <button 
          onClick={() => onAccept(request)}
          className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
        >
          <Check className="w-5 h-5 text-white" />
        </button>
        <button 
          onClick={() => onReject(request)}
          className="w-10 h-10 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    )}
  </div>
);

// مكون نتيجة البحث
const SearchResultCard = ({ user, onAddFriend, pending }) => (
  <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
    <div 
      className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg"
    >
      {user.name?.charAt(0) || '?'}
    </div>
    
    <div className="flex-1">
      <h4 className="text-white font-semibold">{user.name}</h4>
    </div>

    <button 
      onClick={() => !pending && onAddFriend(user)}
      disabled={pending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        pending 
          ? 'bg-gray-600 cursor-not-allowed' 
          : 'bg-blue-500 hover:bg-blue-600'
      }`}
    >
      <UserPlus className="w-4 h-4 text-white" />
      <span className="text-white text-sm font-semibold">{pending ? 'معلق' : 'إضافة'}</span>
    </button>
  </div>
);

// المكون الرئيسي
const FriendsPage = ({ user, onBack, onOpenMessages }) => {
  const { isDark } = useTheme();
  const { isRTL, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/api/social/friends/list/${user?.id}`),
        fetch(`${API_URL}/api/social/friends/requests/${user?.id}`)
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends || []);
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/social/users/search?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.users.filter(u => 
          u.id !== user?.id && 
          !friends.find(f => f.id === u.id)
        );
        setSearchResults(filtered);
      }
    } catch (e) {
      console.error('Error searching:', e);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (targetUser) => {
    try {
      const res = await fetch(`${API_URL}/api/social/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: user?.id,
          to_user_id: targetUser.id,
          from_user_name: user?.name || 'مستخدم'
        }),
      });

      if (res.ok) {
        alert('تم إرسال طلب الصداقة');
        loadData();
        setSearchResults(prev => prev.filter(u => u.id !== targetUser.id));
      } else {
        const error = await res.json();
        alert(error.detail || 'حدث خطأ');
      }
    } catch (e) {
      alert('حدث خطأ في الاتصال');
    }
  };

  const acceptRequest = async (request) => {
    try {
      const res = await fetch(`${API_URL}/api/social/friends/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: request.id,
          user_id: user?.id
        }),
      });

      if (res.ok) {
        alert('تمت إضافة الصديق بنجاح');
        loadData();
      }
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  const rejectRequest = async (request) => {
    try {
      await fetch(`${API_URL}/api/social/friends/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: request.id,
          user_id: user?.id
        }),
      });
      loadData();
    } catch (e) {
      console.error('Error rejecting request:', e);
    }
  };

  const removeFriend = async (friend) => {
    if (!confirm(`هل تريد إزالة ${friend.name} من قائمة أصدقائك؟`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/social/friends/remove/${user?.id}/${friend.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  const tabs = [
    { id: 'friends', label: 'أصدقائي', icon: Users },
    { id: 'requests', label: 'الطلبات', icon: Mail, badge: requests.incoming.length },
    { id: 'search', label: 'بحث', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <span className="text-lg font-bold text-white">الأصدقاء</span>

          <div className="flex items-center gap-2 bg-green-500/20 px-3 py-2 rounded-full">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-bold">{friends.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all relative ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 border-blue-500/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-blue-400 animate-pulse">جاري التحميل...</div>
          </div>
        ) : (
          <>
            {activeTab === 'friends' && (
              friends.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">لا يوجد أصدقاء</p>
                  <p className="text-gray-600 text-sm mt-2">ابحث عن أصدقاء جدد!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map(friend => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      onMessage={(f) => onOpenMessages && onOpenMessages(f)}
                      onRemove={removeFriend}
                      onInvite={() => alert('قريباً!')}
                    />
                  ))}
                </div>
              )
            )}

            {activeTab === 'requests' && (
              (requests.incoming.length + requests.outgoing.length) === 0 ? (
                <div className="text-center py-20">
                  <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد طلبات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.incoming.length > 0 && (
                    <>
                      <h3 className="text-gray-500 text-sm font-semibold mb-3">
                        طلبات واردة ({requests.incoming.length})
                      </h3>
                      {requests.incoming.map(req => (
                        <FriendRequestCard
                          key={req.id}
                          request={req}
                          type="incoming"
                          onAccept={acceptRequest}
                          onReject={rejectRequest}
                        />
                      ))}
                    </>
                  )}
                  {requests.outgoing.length > 0 && (
                    <>
                      <h3 className="text-gray-500 text-sm font-semibold mt-6 mb-3">
                        طلبات صادرة ({requests.outgoing.length})
                      </h3>
                      {requests.outgoing.map(req => (
                        <FriendRequestCard
                          key={req.id}
                          request={req}
                          type="outgoing"
                        />
                      ))}
                    </>
                  )}
                </div>
              )
            )}

            {activeTab === 'search' && (
              <div>
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-4">
                    <Search className="w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="ابحث عن مستخدمين..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                      className="flex-1 bg-transparent py-3 text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={searchUsers}
                    disabled={searching}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {searching ? '...' : 'بحث'}
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map(user => (
                      <SearchResultCard
                        key={user.id}
                        user={user}
                        onAddFriend={sendFriendRequest}
                        pending={requests.outgoing.find(r => r.to_user_id === user.id)}
                      />
                    ))}
                  </div>
                ) : searchQuery && !searching ? (
                  <div className="text-center py-20">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد نتائج</p>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
