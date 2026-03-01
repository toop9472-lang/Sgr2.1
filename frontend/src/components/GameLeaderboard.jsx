// Game Leaderboards Component - لوحة متصدرين الألعاب
import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Star, ChevronLeft, ChevronDown, Zap, Clock, Calendar, User } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Period options
const PERIODS = [
  { id: 'all', label: 'كل الأوقات', icon: Star },
  { id: 'monthly', label: 'هذا الشهر', icon: Calendar },
  { id: 'weekly', label: 'هذا الأسبوع', icon: Clock },
  { id: 'daily', label: 'اليوم', icon: Zap },
];

// Rank badges
const getRankBadge = (rank) => {
  switch (rank) {
    case 1: return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    case 2: return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-500/20' };
    case 3: return { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/20' };
    default: return { icon: null, color: 'text-gray-400', bg: 'bg-white/5' };
  }
};

const GameLeaderboard = ({ gameId, gameName, gameColor, onBack, user }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const [userScore, setUserScore] = useState(null);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [gameId, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/api/leaderboards/game/${gameId}?period=${period}&limit=50${user?.id ? `&user_id=${user.id}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setUserRank(data.user_rank);
        setUserScore(data.user_score);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPeriod = PERIODS.find(p => p.id === period);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" data-testid="game-leaderboard">
      {/* Header */}
      <div 
        className="p-4 pb-6"
        style={{ background: `linear-gradient(180deg, ${gameColor}40 0%, transparent 100%)` }}
      >
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-400" size={24} />
            {gameName}
          </h1>
          <div className="w-10" />
        </div>

        {/* Period selector */}
        <div className="relative">
          <button
            onClick={() => setShowPeriodMenu(!showPeriodMenu)}
            className="w-full flex items-center justify-between bg-white/10 rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-2">
              {currentPeriod && <currentPeriod.icon size={18} />}
              <span>{currentPeriod?.label}</span>
            </div>
            <ChevronDown size={18} className={`transition-transform ${showPeriodMenu ? 'rotate-180' : ''}`} />
          </button>

          {showPeriodMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] rounded-xl overflow-hidden z-10 border border-white/10">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPeriod(p.id);
                    setShowPeriodMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 ${period === p.id ? 'bg-white/5' : ''}`}
                >
                  <p.icon size={18} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User's rank card */}
      {user && userRank && (
        <div className="mx-4 -mt-2 mb-4 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
                <User size={20} className="text-blue-400" />
              </div>
              <div>
                <div className="font-bold">{user.name}</div>
                <div className="text-sm text-gray-400">ترتيبك</div>
              </div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-blue-400">#{userRank}</div>
              <div className="text-sm text-gray-400">{userScore?.toLocaleString() || 0} نقطة</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      <div className="px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Trophy size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد نتائج بعد</p>
            <p className="text-sm">كن أول من يسجل نتيجة!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const badge = getRankBadge(entry.rank);
              const isCurrentUser = user && entry.user_id === user.id;

              return (
                <div
                  key={entry.user_id || index}
                  className={`flex items-center gap-3 p-3 rounded-xl ${badge.bg} ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.bg}`}>
                    {badge.icon ? (
                      <badge.icon size={20} className={badge.color} />
                    ) : (
                      <span className={`font-bold ${badge.color}`}>{entry.rank}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <div className="font-medium">{entry.user_name}</div>
                    {entry.reward && (
                      <div className="text-xs text-yellow-400">{entry.reward.title}</div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-left">
                    <div className="font-bold" style={{ color: gameColor }}>
                      {entry.score?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">نقطة</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// All Games Leaderboards Component
export const AllGamesLeaderboards = ({ onSelectGame, user }) => {
  const [games, setGames] = useState({});
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllLeaderboards();
  }, [period]);

  const fetchAllLeaderboards = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/api/leaderboards/all-games?period=${period}&limit=5${user?.id ? `&user_id=${user.id}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setGames(data.games || {});
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4" data-testid="all-games-leaderboards">
      {/* Period tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              period === p.id 
                ? 'bg-yellow-500 text-black' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <p.icon size={16} />
            <span className="text-sm">{p.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full"></div>
        </div>
      ) : (
        Object.entries(games).map(([gameId, gameData]) => (
          <div 
            key={gameId}
            className="bg-white/5 rounded-xl overflow-hidden"
            onClick={() => onSelectGame(gameId, gameData.game)}
          >
            {/* Game header */}
            <div 
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
              style={{ borderBottom: `2px solid ${gameData.game?.color}40` }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${gameData.game?.color}30` }}
                >
                  <Trophy size={16} style={{ color: gameData.game?.color }} />
                </div>
                <span className="font-medium">{gameData.game?.name}</span>
              </div>
              {gameData.user_rank && (
                <div className="text-sm text-blue-400">
                  ترتيبك: #{gameData.user_rank}
                </div>
              )}
            </div>

            {/* Top 3 */}
            <div className="p-2">
              {gameData.leaderboard?.slice(0, 3).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 py-2 px-2 text-sm">
                  <span className={`w-5 font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 truncate">{entry.user_name}</span>
                  <span className="text-gray-400">{entry.score?.toLocaleString()}</span>
                </div>
              ))}
              {(!gameData.leaderboard || gameData.leaderboard.length === 0) && (
                <div className="text-center py-2 text-sm text-gray-500">لا توجد نتائج</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GameLeaderboard;
