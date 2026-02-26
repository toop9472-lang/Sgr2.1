// Games Page - Refactored Version with Chat Integration & Guest Restriction
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, Grid3X3, Puzzle, Brain, 
  Clock, Star, Diamond, Medal, Gamepad2, 
  Users, Cpu, X, Wifi, Crown, Lock,
  Calculator, Type, Apple, CreditCard, MessageCircle
} from 'lucide-react';
import soundManager from '../utils/soundManager';
import GameChat, { ChatToggleButton } from './GameChat';

// Import game components
import { 
  ChessGame, 
  TicTacToeGame, 
  TriviaGame, 
  SpeedMathGame, 
  WordChainGame, 
  PuzzleGame 
} from './games';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Game Icons Map
const gameIcons = {
  chess: Crown,
  tictactoe: Grid3X3,
  wordchain: Type,
  puzzle: Puzzle,
  trivia: Brain,
  speedmath: Calculator,
};

// Diamond Shop Component
const DiamondShop = ({ onClose, userId }) => {
  const [loading, setLoading] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('apple_pay');
  const [error, setError] = useState('');

  const packages = [
    { id: 'starter', diamonds: 100, bonus: 0, price: 3, popular: false },
    { id: 'silver', diamonds: 250, bonus: 25, price: 7, popular: true },
    { id: 'gold', diamonds: 500, bonus: 75, price: 12, popular: false },
    { id: 'platinum', diamonds: 1000, bonus: 200, price: 19, popular: false },
  ];

  const handlePurchase = async (pkg) => {
    setLoading(pkg.id);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/diamond-payments/checkout/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId || 'guest',
          package_id: pkg.id,
          origin_url: window.location.origin
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.detail || 'حدث خطأ في عملية الدفع');
      }
    } catch (e) {
      console.error('Purchase error:', e);
      setError('تعذر الاتصال بخادم الدفع');
    }
    setLoading(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" data-testid="diamond-shop-modal">
      <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Diamond size={24} className="text-blue-400" />
            متجر الماس
          </h2>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="diamond-shop-close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-center text-sm">
            {error}
          </div>
        )}

        {/* Payment Methods */}
        <div className="mb-6">
          <p className="text-center text-gray-400 text-sm mb-3">طريقة الدفع</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('apple_pay')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                paymentMethod === 'apple_pay' 
                  ? 'bg-black border-2 border-white' 
                  : 'bg-black/50 border border-white/20'
              }`}
              data-testid="payment-apple-pay"
            >
              <Apple size={20} />
              <span className="text-sm font-semibold">Apple Pay</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                paymentMethod === 'card' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-400' 
                  : 'bg-white/5 border border-white/10'
              }`}
              data-testid="payment-card"
            >
              <CreditCard size={20} />
              <span className="text-sm font-semibold">بطاقة</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => handlePurchase(pkg)}
              disabled={loading === pkg.id}
              className={`w-full p-4 rounded-xl transition-all flex items-center justify-between
                ${pkg.popular 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-2 border-blue-400' 
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}
              data-testid={`diamond-package-${pkg.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Diamond size={24} className="text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {pkg.diamonds + pkg.bonus} ماسة
                    {pkg.bonus > 0 && <span className="text-xs text-green-400 mr-1">(+{pkg.bonus})</span>}
                  </div>
                  {pkg.popular && <span className="text-xs text-yellow-400">الأكثر مبيعاً</span>}
                </div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-xl font-bold">
                {loading === pkg.id ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `${pkg.price} ر.س`
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-center text-gray-500 text-xs space-y-1">
          <p>جميع المعاملات آمنة ومشفرة</p>
          <p>يتم الدفع عبر Stripe</p>
        </div>
      </div>
    </div>
  );
};

// Guest Restriction Modal
const GuestRestrictionModal = ({ onClose, onLogin }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" data-testid="guest-restriction-modal">
      <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Lock size={40} className="text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">تسجيل الدخول مطلوب</h2>
        <p className="text-gray-400 mb-6">
          يجب تسجيل الدخول للوصول إلى الألعاب وكسب النقاط
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold"
            data-testid="guest-modal-close"
          >
            إلغاء
          </button>
          <button
            onClick={onLogin}
            className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold"
            data-testid="guest-modal-login"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Games Page Component
const GamesPage = ({ user, onNavigate, onPointsEarned }) => {
  const [activeGame, setActiveGame] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(null);
  const [showDiamondShop, setShowDiamondShop] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [balance, setBalance] = useState({ saqr_points: 0, diamonds: 300, daily_points_remaining: 70 });
  const [loading, setLoading] = useState(true);
  
  // WebSocket for online games
  const [wsConnection, setWsConnection] = useState(null);
  const [onlineGameState, setOnlineGameState] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [opponentInfo, setOpponentInfo] = useState(null);
  const wsRef = useRef(null);

  const games = [
    { id: 'aiquest', name: 'AI Quest', colors: ['#ec4899', '#9333ea'], description: 'تحدى الذكاء الاصطناعي', maxPoints: 30, online: false, onlineCost: 0, category: 'ذكاء اصطناعي', badge: 'جديد' },
    { id: 'chess', name: 'الشطرنج', colors: ['#7c3aed', '#4c1d95'], description: 'لعبة الملوك والاستراتيجية', maxPoints: 25, online: true, onlineCost: 30, category: 'استراتيجية', badge: 'مميز' },
    { id: 'tictactoe', name: 'اكس او', colors: ['#f97316', '#c2410c'], description: 'تحدى منافسك وفكر بذكاء', maxPoints: 20, online: true, onlineCost: 20, category: 'سريعة', badge: 'شعبي' },
    { id: 'memory', name: 'الذاكرة', colors: ['#14b8a6', '#0f766e'], description: 'اختبر ذاكرتك وركز', maxPoints: 18, online: false, onlineCost: 0, category: 'ذهنية', badge: '' },
    { id: 'snake', name: 'الثعبان', colors: ['#22c55e', '#15803d'], description: 'اللعبة الكلاسيكية المحبوبة', maxPoints: 20, online: false, onlineCost: 0, category: 'كلاسيكية', badge: 'كلاسيك' },
    { id: 'trivia', name: 'اسئلة ثقافية', colors: ['#10b981', '#047857'], description: 'اختبر معلوماتك العامة', maxPoints: 25, online: true, onlineCost: 20, category: 'ثقافية', badge: '250+ سؤال' },
    { id: 'puzzle', name: 'تركيب الصور', colors: ['#3b82f6', '#1e40af'], description: 'رتب القطع لتكمل الصورة', maxPoints: 20, online: true, onlineCost: 25, category: 'ذهنية', badge: '' },
    { id: 'riddles', name: 'الالغاز', colors: ['#eab308', '#ca8a04'], description: 'حل الالغاز الذكية', maxPoints: 20, online: false, onlineCost: 0, category: 'ذهنية', badge: '' },
    { id: 'brickbreaker', name: 'تكسير الطوب', colors: ['#ec4899', '#be185d'], description: 'كسر كل الطوب واربح', maxPoints: 20, online: false, onlineCost: 0, category: 'اركيد', badge: '' },
    { id: 'speedmath', name: 'سباق الحساب', colors: ['#8b5cf6', '#6d28d9'], description: 'حل المعادلات بسرعة', maxPoints: 22, online: true, onlineCost: 20, category: 'رياضيات', badge: 'تحدي' },
    { id: 'wordchain', name: 'سباق الكلمات', colors: ['#06b6d4', '#0891b2'], description: 'اكتشف الكلمات المخفية', maxPoints: 22, online: true, onlineCost: 25, category: 'لغوية', badge: '' },
    { id: 'colorswitch', name: 'تبديل الالوان', colors: ['#f43f5e', '#e11d48'], description: 'سرعة التفاعل مع الالوان', maxPoints: 18, online: false, onlineCost: 0, category: 'سريعة', badge: '' },
  ];

  // Check if user is guest
  const isGuest = !user || user.isGuest;

  useEffect(() => {
    fetchData();
    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const toggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
  };

  const fetchData = async () => {
    try {
      const [lbRes, balRes] = await Promise.all([
        fetch(`${API_URL}/api/economy/leaderboard`),
        user?.id && !user.isGuest ? fetch(`${API_URL}/api/economy/balance/${user.id}`) : null
      ]);
      if (lbRes.ok) {
        const data = await lbRes.json();
        setLeaderboard(data.leaderboard || []);
      }
      if (balRes?.ok) {
        const data = await balRes.json();
        setBalance(data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket connection for online games
  const connectWebSocket = useCallback((gameType) => {
    if (!user?.id || user.isGuest) return;

    const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/game/${user.id}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnection(ws);
      wsRef.current = ws;
      
      // Start searching for match
      ws.send(JSON.stringify({
        action: 'find_match',
        game_type: gameType
      }));
      setIsSearching(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'waiting':
          setIsSearching(true);
          break;
        case 'match_found':
          setIsSearching(false);
          setOnlineGameState({
            roomId: data.room_id,
            players: data.players,
            myTurn: data.your_turn,
            gameType: data.game_type
          });
          setOpponentInfo({
            id: data.players.find(p => p !== user.id),
            name: 'خصم'
          });
          break;
        case 'opponent_move':
          // Handle opponent move - will be passed to game component
          break;
        case 'chat_message':
          // Chat messages are handled by GameChat component
          break;
        case 'player_left':
          setOnlineGameState(null);
          setOpponentInfo(null);
          setWsConnection(null);
          break;
        default:
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnection(null);
      setIsSearching(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [user]);

  const handleGameSelect = (gameId) => {
    // Check if user is guest
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }

    soundManager.click();
    const game = games.find(g => g.id === gameId);
    if (game.online) {
      setShowModeSelector(gameId);
    } else {
      setActiveGame(gameId);
      setGameMode('solo');
    }
  };

  const handleModeSelect = (mode) => {
    const game = games.find(g => g.id === showModeSelector);
    
    if (mode === 'online') {
      // Deduct diamonds for online play
      if (balance.diamonds < game.onlineCost) {
        return;
      }
      setBalance(prev => ({ ...prev, diamonds: prev.diamonds - game.onlineCost }));
      connectWebSocket(showModeSelector);
    }
    
    setActiveGame(showModeSelector);
    setGameMode(mode);
    setShowModeSelector(null);
  };

  const handleUseDiamonds = (amount) => {
    setBalance(prev => ({ ...prev, diamonds: prev.diamonds - amount }));
  };

  const handleGameComplete = async (points) => {
    try {
      await fetch(`${API_URL}/api/economy/game-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          user_id: user?.id, 
          game_id: activeGame, 
          is_online: gameMode === 'online', 
          won: true,
          opponent_diamonds: 0
        }),
      });
      if (onPointsEarned) onPointsEarned(points);
    } catch (e) {
      console.log(e);
    }
    fetchData();
  };

  const closeGame = () => {
    // Cleanup WebSocket if online game
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setActiveGame(null);
    setGameMode(null);
    setWsConnection(null);
    setOnlineGameState(null);
    setOpponentInfo(null);
    setIsSearching(false);
    setShowChat(false);
  };

  const cancelSearch = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ action: 'cancel_search' }));
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsSearching(false);
    setWsConnection(null);
    setActiveGame(null);
    setGameMode(null);
  };

  // Searching for opponent screen
  if (isSearching) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4" data-testid="searching-screen">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
            <Wifi size={48} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">جاري البحث عن منافس</h2>
          <p className="text-gray-400 mb-6">يرجى الانتظار...</p>
          <button
            onClick={cancelSearch}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-xl font-semibold"
            data-testid="cancel-search-btn"
          >
            إلغاء البحث
          </button>
        </div>
      </div>
    );
  }

  // Render active game with chat support
  const renderGame = () => {
    const isOnline = gameMode === 'online';
    const gameProps = {
      mode: gameMode,
      onComplete: handleGameComplete,
      onClose: closeGame,
      userDiamonds: balance.diamonds,
      onUseDiamonds: handleUseDiamonds,
      wsConnection: wsConnection,
      gameId: onlineGameState?.roomId,
      isOnline: isOnline
    };

    let gameComponent = null;

    switch (activeGame) {
      case 'chess':
        gameComponent = <ChessGame {...gameProps} />;
        break;
      case 'tictactoe':
        gameComponent = <TicTacToeGame {...gameProps} />;
        break;
      case 'trivia':
        gameComponent = <TriviaGame {...gameProps} />;
        break;
      case 'speedmath':
        gameComponent = <SpeedMathGame {...gameProps} />;
        break;
      case 'puzzle':
        gameComponent = <PuzzleGame {...gameProps} />;
        break;
      case 'wordchain':
        gameComponent = <WordChainGame {...gameProps} />;
        break;
      default:
        return null;
    }

    return (
      <>
        {gameComponent}
        
        {/* Chat for online games */}
        {isOnline && wsConnection && (
          <>
            <ChatToggleButton 
              onClick={() => setShowChat(!showChat)} 
              unreadCount={0}
            />
            <GameChat
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              gameId={onlineGameState?.roomId}
              playerId={user?.id}
              playerName={user?.name}
              opponentName={opponentInfo?.name}
              wsConnection={wsConnection}
            />
          </>
        )}
      </>
    );
  };

  // Render active game
  if (activeGame) {
    return renderGame();
  }

  // Mode Selector with Online Option
  if (showModeSelector) {
    const game = games.find(g => g.id === showModeSelector);
    const GameIcon = gameIcons[showModeSelector] || Gamepad2;
    
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8" dir="rtl" data-testid="mode-selector">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setShowModeSelector(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20" data-testid="mode-back-btn">
              <X size={24} />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <GameIcon size={24} style={{ color: game?.colors[0] }} />
              {game?.name}
            </h1>
            <div className="w-10" />
          </div>

          <p className="text-center text-gray-400 mb-8">اختر نوع اللعب</p>

          <div className="space-y-4">
            {/* Online Mode */}
            <button 
              onClick={() => handleModeSelect('online')}
              disabled={balance.diamonds < game?.onlineCost}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 disabled:from-gray-600 disabled:to-gray-700 p-6 rounded-2xl text-right hover:from-blue-400 hover:to-blue-500 transition-all"
              data-testid="online-mode-btn"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Wifi size={28} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg flex items-center gap-2">
                    لعب أونلاين
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">جديد</span>
                  </div>
                  <div className="text-blue-100 text-sm">تحدى لاعبين حقيقيين</div>
                </div>
                <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
                  <Diamond size={16} className="text-blue-300" />
                  <span>{game?.onlineCost}</span>
                </div>
              </div>
            </button>

            {/* AI Medium */}
            <button 
              onClick={() => handleModeSelect('ai_medium')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl text-right hover:from-green-400 hover:to-green-500 transition-all"
              data-testid="ai-medium-btn"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Cpu size={28} />
                </div>
                <div>
                  <div className="font-bold text-lg">كمبيوتر - متوسط</div>
                  <div className="text-green-100 text-sm">للتدريب والتعلم</div>
                </div>
              </div>
            </button>

            {/* AI Hard */}
            <button 
              onClick={() => handleModeSelect('ai_hard')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-2xl text-right hover:from-red-400 hover:to-red-500 transition-all"
              data-testid="ai-hard-btn"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Trophy size={28} />
                </div>
                <div>
                  <div className="font-bold text-lg">كمبيوتر - صعب</div>
                  <div className="text-red-100 text-sm">تحدٍ حقيقي</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find user rank
  const userRank = leaderboard.findIndex(l => l.user_id === user?.id);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24" dir="rtl" data-testid="games-page">
      {/* Guest Restriction Modal */}
      {showGuestModal && (
        <GuestRestrictionModal 
          onClose={() => setShowGuestModal(false)}
          onLogin={() => {
            setShowGuestModal(false);
            if (onNavigate) onNavigate('auth');
          }}
        />
      )}

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gamepad2 size={28} className="text-lime-400" />
          الألعاب
        </h1>
        <p className="text-gray-400 mt-1 text-sm">العب وتنافس واكسب النقاط</p>
      </div>

      {/* Guest Banner */}
      {isGuest && (
        <div className="mx-6 mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3" data-testid="guest-banner">
          <Lock size={24} className="text-yellow-400" />
          <div className="flex-1">
            <p className="text-yellow-400 font-semibold text-sm">أنت زائر</p>
            <p className="text-gray-400 text-xs">سجّل الدخول للعب وكسب النقاط</p>
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('auth')}
            className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-semibold"
            data-testid="guest-login-btn"
          >
            دخول
          </button>
        </div>
      )}

      {/* Daily Progress - Only for logged in users */}
      {!isGuest && (
        <div className="mx-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-green-400" />
            <span className="text-green-400 text-sm font-semibold">النقاط اليومية</span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((70 - balance.daily_points_remaining) / 70) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-400 font-semibold">{70 - balance.daily_points_remaining} / 70</span>
            <span className="text-gray-500">متبقي: {balance.daily_points_remaining}</span>
          </div>
        </div>
      )}

      {/* User Stats - Only for logged in users */}
      {!isGuest && (
        <div className="mx-6 bg-white/5 rounded-2xl p-4 mb-6">
          <div className="flex justify-around">
            <div className="text-center">
              <Medal size={24} className="mx-auto text-yellow-400 mb-1" />
              <div className="text-xl font-bold">#{userRank >= 0 ? userRank + 1 : '-'}</div>
              <div className="text-gray-500 text-xs">ترتيبك</div>
            </div>
            <div className="h-12 w-px bg-white/10 self-center" />
            <div className="text-center">
              <Star size={24} className="mx-auto text-yellow-400 mb-1" />
              <div className="text-xl font-bold">{balance.saqr_points || 0}</div>
              <div className="text-gray-500 text-xs">نقاط صقر</div>
            </div>
            <div className="h-12 w-px bg-white/10 self-center" />
            <button onClick={() => setShowDiamondShop(true)} className="text-center group" data-testid="open-diamond-shop">
              <div className="relative">
                <Diamond size={24} className="mx-auto text-blue-400 mb-1" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold">+</div>
              </div>
              <div className="text-xl font-bold">{balance.diamonds || 0}</div>
              <div className="text-gray-500 text-xs group-hover:text-blue-400 transition-colors">اشحن الماس</div>
            </button>
          </div>
        </div>
      )}

      {/* Diamond Shop Modal */}
      {showDiamondShop && (
        <DiamondShop onClose={() => setShowDiamondShop(false)} userId={user?.id} />
      )}

      {/* Games Grid */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Gamepad2 size={20} />
          اختر لعبة
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {games.map(game => {
            const GameIcon = gameIcons[game.id] || Gamepad2;
            return (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className={`rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] relative ${
                  isGuest ? 'opacity-80' : ''
                }`}
                style={{ background: `linear-gradient(135deg, ${game.colors[0]}, ${game.colors[1]})` }}
                data-testid={`game-card-${game.id}`}
              >
                {/* Lock overlay for guests */}
                {isGuest && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Lock size={32} className="text-white/80" />
                  </div>
                )}
                <div className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
                    <GameIcon size={24} />
                  </div>
                  <div className="font-bold">{game.name}</div>
                  <div className="text-white/80 text-xs mb-2">{game.description}</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="inline-flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full text-xs">
                      <Star size={10} />
                      +{game.maxPoints}
                    </div>
                    {game.online && (
                      <div className="inline-flex items-center gap-1 bg-blue-500/30 px-2 py-0.5 rounded-full text-xs">
                        <Wifi size={10} />
                        أونلاين
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Rewards */}
      <div className="mx-6 mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={18} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold text-sm">مكافآت المتصدرين (أسبوعياً)</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-yellow-400" />
            <span className="text-white/80">المركز الأول: <span className="text-yellow-400 font-bold">3000 نقطة</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Medal size={16} className="text-gray-400" />
            <span className="text-white/80">المركز الثاني: <span className="text-gray-300 font-bold">1900 نقطة</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Medal size={16} className="text-orange-400" />
            <span className="text-white/80">المركز الثالث: <span className="text-orange-400 font-bold">1000 نقطة</span></span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          التصنيف العالمي
        </h2>
        <div className="bg-white/5 rounded-2xl overflow-hidden">
          {leaderboard.slice(0, 10).map((player, idx) => (
            <div 
              key={idx} 
              className={`flex items-center p-3 border-b border-white/5 ${idx < 3 ? 'bg-yellow-500/5' : ''}`}
              data-testid={`leaderboard-item-${idx}`}
            >
              <div className="w-10 text-center">
                {idx === 0 ? <Crown size={22} className="text-yellow-400 mx-auto" /> :
                 idx === 1 ? <Medal size={22} className="text-gray-400 mx-auto" /> :
                 idx === 2 ? <Medal size={22} className="text-orange-400 mx-auto" /> :
                 <span className="text-gray-500 text-sm">#{idx + 1}</span>}
              </div>
              <div className="flex-1 mr-3">
                <div className="font-semibold text-sm">{player.name}</div>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={14} />
                <span className="font-bold text-sm">{player.saqr_points}</span>
              </div>
            </div>
          ))}
          
          {leaderboard.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Trophy size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا يوجد لاعبون بعد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
