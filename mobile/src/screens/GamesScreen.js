// Games Screen - Professional Gaming Hub with Multiplayer
// Puzzle, Chess, Tic-Tac-Toe, Trivia, Riddles, Brick Breaker - Online & vs AI
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  TextInput,
  FlatList,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import api from '../services/api';
import admobService from '../services/admobService';
import multiplayerService from '../services/multiplayer';
import { triviaQuestions, riddlesQuestions } from '../data/questionsData';
import AdChallengesModal from '../components/AdChallengesModal';
import SaqrFortunesScreen from './SaqrFortunesScreen';
import { shuffleArray } from '../utils/random';

const { width, height } = Dimensions.get('window');
const ioniconGlyphMap = Ionicons?.glyphMap || {};
const resolveIconName = (iconName, fallback = 'ellipse-outline') => (
  ioniconGlyphMap[iconName] ? iconName : fallback
);
const SOLO_ROUND_DIAMOND_COST = 20;
const AD_WATCH_DURATION_SECONDS = 30;
const GEMS_SECONDS_PER_UNIT = 60;
const ONLINE_GLOBAL_CHAT_INVITE_COST = 5;
const toThumbCover = (targetUrl) => (
  targetUrl ? `https://image.thum.io/get/width/600/crop/600/noanimate/${targetUrl}` : null
);
const EXTERNAL_GAME_URLS = {
  aiquest: 'https://kbhgames.com/game/zombotron-re-boot',
  chess: 'https://hedchick.itch.io/slimefall',
  tictactoe: 'https://muneersbehat.itch.io/trapadventurecolorbrothers',
  tactix: 'https://shoot.nothans.com/',
  memory: 'https://www.balanc3dgame.com/',
  snake: 'https://pacman.live/',
  brickbreaker: 'https://www.4j.com/Nelly-game',
  puzzle: 'https://fmproject.itch.io/poly-cat-balls',
  trivia: 'https://kirlosev.itch.io/marblox',
  mathrace: 'https://paperclip36.itch.io/neonrogue',
  wordrace: 'https://twobitcode.itch.io/multiplayer-fusion-2',
  colorswitch: 'https://www.pacogames.com/casual/colour-chase',
  riddles: 'https://www.golfgl.de/lightblocks/',
  millionaire: 'https://kodachigames.itch.io/wicked-climb',
  brickstormx: 'https://buddyboardgames.com/uno',
  puzzlemaster: 'https://www.jawaker.com/en/games/basra',
  triviaplus: 'https://www.jawaker.com/en/games/baloot',
  wordmaster: 'https://poki.com/en/g/carrom-multiplayer',
  reactiontap: 'https://8ballpool3d.com/',
  sequencesprint: 'https://sequentor.com/',
};
const GAME_CATALOG_OVERRIDES = {
  aiquest: {
    name: 'Zombotron Re-Boot',
    description: 'تصويب أكشن ومراحل سريعة.',
    category: 'أكشن',
    badge: 'NEW',
    trend: 'رائج',
    backendGameId: 'puzzle',
  },
  chess: {
    name: 'Slimefall',
    description: 'نجاة سريعة وتحديات دقيقة.',
    category: 'منصات',
    badge: 'NEW',
    backendGameId: 'trivia',
  },
  tictactoe: {
    name: 'Trap Adventure: Color Brothers',
    description: 'منصات صعبة مع ألغاز ألوان.',
    category: 'ألغاز',
    badge: 'NEW',
    backendGameId: 'brickbreaker',
  },
  tactix: {
    name: 'Shoot.nothans.com',
    description: 'تصويب مباشر بإيقاع سريع.',
    category: 'تصويب',
    badge: 'HOT',
    backendGameId: 'puzzle',
  },
  memory: {
    name: 'balanc3dgame.com',
    description: 'تحديات توازن ثلاثية الأبعاد.',
    category: 'مهارة',
    badge: '3D',
    backendGameId: 'tictactoe',
  },
  snake: {
    name: 'pacman.live',
    description: 'آركيد كلاسيكي بنسخة ويب حديثة.',
    category: 'آركيد',
    badge: 'LIVE',
    backendGameId: 'brickbreaker',
  },
  brickbreaker: {
    name: 'Nelly Jellies',
    description: 'مغامرة خفيفة وتحديات تفاعلية.',
    category: 'مغامرة',
    badge: 'NEW',
    backendGameId: 'riddles',
  },
  puzzle: {
    name: 'Poly Cat Balls',
    description: 'حل ألغاز فيزيائية بخطوط ذكية.',
    category: 'ألغاز',
    badge: 'CAT',
    backendGameId: 'puzzle',
  },
  trivia: {
    name: 'Marbleous!',
    description: 'تحديات كرات وتوجيه ذكي.',
    category: 'مهارة',
    badge: 'PRO',
    backendGameId: 'trivia',
  },
  mathrace: {
    name: 'Neon Swarm - Rogue',
    description: 'روجلايك نيون سريع ومكثف.',
    category: 'أكشن',
    badge: 'ROGUE',
    backendGameId: 'riddles',
  },
  wordrace: {
    name: 'Colored Fusion - LOCAL MULTIPLAYER - PC / MOBILE',
    description: 'تجربة دمج ألوان متعددة الأنماط.',
    category: 'تعاوني',
    badge: 'COOP',
    backendGameId: 'tictactoe',
  },
  colorswitch: {
    name: 'Color Chase',
    description: 'مطاردة ألوان سريعة ورد فعل.',
    category: 'سرعة',
    badge: 'FAST',
    backendGameId: 'riddles',
  },
  riddles: {
    name: 'Falling Lightblocks',
    description: 'بلوكات ضوئية مع طور لعب ممتد.',
    category: 'أركيد',
    badge: 'NEON',
    backendGameId: 'puzzle',
  },
  millionaire: {
    name: "Ironmouse and Bubi's Wicked Climb",
    description: 'تسلق صعب وممتع على الموبايل.',
    category: 'منصات',
    badge: 'HARD',
    backendGameId: 'trivia',
  },
  brickstormx: {
    name: 'UNO أونلاين',
    description: 'أونلاين مباشر (2-4 لاعبين).',
    category: 'ورق',
    badge: 'ONLINE',
    online: true,
    externalMultiplayerDirect: true,
    playerRange: '2-4',
    backendGameId: 'trivia',
  },
  puzzlemaster: {
    name: 'الباصرة أونلاين',
    description: 'لعبة باصرة أونلاين (2-4 لاعبين).',
    category: 'ورق',
    badge: 'ONLINE',
    online: true,
    externalMultiplayerDirect: true,
    playerRange: '2-4',
    backendGameId: 'riddles',
  },
  triviaplus: {
    name: 'البالوت أونلاين',
    description: 'بلوت احترافية أونلاين (2-4 لاعبين).',
    category: 'ورق',
    badge: 'ONLINE',
    online: true,
    externalMultiplayerDirect: true,
    playerRange: '2-4',
    backendGameId: 'chess',
  },
  wordmaster: {
    name: 'الكيرم أونلاين',
    description: 'كيرم أونلاين (2-4 لاعبين).',
    category: 'لوحية',
    badge: 'ONLINE',
    online: true,
    externalMultiplayerDirect: true,
    playerRange: '2-4',
    backendGameId: 'brickbreaker',
  },
  reactiontap: {
    name: 'البلياردو أونلاين',
    description: 'بلياردو مباشر مع لاعبين حقيقيين.',
    category: 'رياضة',
    badge: 'ONLINE',
    online: true,
    externalMultiplayerDirect: true,
    playerRange: '2-4',
    backendGameId: 'puzzle',
  },
  sequencesprint: {
    name: 'السكونس أونلاين',
    description: 'Sequence أونلاين مباشر (2-4 لاعبين).',
    category: 'استراتيجية',
    badge: 'ONLINE',
    online: true,
    externalMultiplayerDirect: true,
    playerRange: '2-4',
    backendGameId: 'tictactoe',
  },
};
const GAME_COVER_IMAGES = Object.fromEntries(
  Object.entries(EXTERNAL_GAME_URLS).map(([id, url]) => [id, toThumbCover(url)]),
);
const IMPORTED_PRO_GAME_IDS = [
  'aiquest',
  'chess',
  'tictactoe',
  'tactix',
  'memory',
  'snake',
  'brickbreaker',
  'puzzle',
  'trivia',
  'mathrace',
  'wordrace',
  'colorswitch',
  'riddles',
  'millionaire',
  'brickstormx',
  'puzzlemaster',
  'triviaplus',
  'wordmaster',
  'reactiontap',
  'sequencesprint',
];
const adCarryStorageKey = (userId) => `saqr_games_ad_carry_seconds_${userId || 'guest'}`;

// ==================== PREMIUM GAME CARD COMPONENT ====================
const GameCard = ({ game, onPress, pulseAnim, gameCost }) => {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  useEffect(() => {
    setImageLoadFailed(false);
  }, [game?.id, game?.coverImage]);
  const shouldShowCover = Boolean(game?.coverImage) && !imageLoadFailed;

  return (
    <Animated.View style={[styles.gameCardWrapper, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity style={styles.gameCard} onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={['rgba(18,18,28,0.98)', 'rgba(11,11,18,0.98)']}
          style={styles.gameCardShell}
        >
          <View style={styles.gameTopRow}>
            <View style={styles.gameModePills}>
              <View style={[styles.modePill, game.online ? styles.modePillOnline : styles.modePillSolo]}>
                <Ionicons
                  name={game.online ? 'wifi' : 'person'}
                  size={10}
                  color={game.online ? '#60a5fa' : '#22c55e'}
                />
                <Text style={[styles.modePillText, { color: game.online ? '#60a5fa' : '#22c55e' }]}>
                  {game.online ? 'أونلاين' : 'فردي'}
                </Text>
              </View>
              {game.trend ? (
                <View style={styles.trendPill}>
                  <Ionicons name="trending-up" size={10} color="#fbbf24" />
                  <Text style={styles.trendPillText}>{game.trend}</Text>
                </View>
              ) : null}
            </View>
            {game.badge ? <Text style={styles.gameBadgeLabel}>{game.badge}</Text> : null}
          </View>

          <View style={styles.gameArtContainer}>
            <LinearGradient colors={game.colors} style={styles.gameArtGlow} />
            <View style={[styles.gameArtOrb, { borderColor: `${game.accent}66` }]}>
              <LinearGradient colors={game.orbGradient} style={styles.gameArtOrbGradient}>
                {shouldShowCover ? (
                  <Image
                    source={{ uri: game.coverImage }}
                    style={styles.gameArtImage}
                    resizeMode="cover"
                    onError={() => setImageLoadFailed(true)}
                  />
                ) : (
                  <Ionicons name={resolveIconName(game.icon, 'game-controller-outline')} size={34} color="#fff" />
                )}
                {game.secondaryIcon ? (
                  <View style={styles.gameSecondaryIcon}>
                    <Ionicons name={resolveIconName(game.secondaryIcon, 'sparkles-outline')} size={12} color="#fff" />
                  </View>
                ) : null}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.gameCardFooter}>
            <Text style={styles.gameNameNew}>{game.name}</Text>
            <Text style={styles.gameDescNew} numberOfLines={2}>
              {game.description}
            </Text>
            <View style={styles.gameMetaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="sparkles" size={12} color="#fbbf24" />
                <Text style={styles.metaPillText}>حتى +{game.maxPoints}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="layers-outline" size={12} color="#94a3b8" />
                <Text style={styles.metaPillText}>{game.category}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="diamond" size={12} color="#60a5fa" />
                <Text style={styles.metaPillText}>
                  {game.online ? (gameCost || game.onlineCost || 20) : SOLO_ROUND_DIAMOND_COST}
                </Text>
              </View>
              {game.playerRange ? (
                <View style={styles.metaPill}>
                  <Ionicons name="people-outline" size={12} color="#86efac" />
                  <Text style={styles.metaPillText}>{game.playerRange}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const IMPORTED_GAME_PRESETS = {
  default: { accent: '#3b82f6', secondary: '#8b5cf6', obstacleSize: 18, speed: 2.1, spawnRate: 46 },
  aiquest: { accent: '#ec4899', secondary: '#8b5cf6', obstacleSize: 16, speed: 2.2, spawnRate: 44 },
  chess: { accent: '#f59e0b', secondary: '#334155', obstacleSize: 20, speed: 2.0, spawnRate: 48 },
  tictactoe: { accent: '#f97316', secondary: '#fb7185', obstacleSize: 16, speed: 2.4, spawnRate: 42 },
  tactix: { accent: '#3b82f6', secondary: '#06b6d4', obstacleSize: 15, speed: 2.6, spawnRate: 40 },
  memory: { accent: '#14b8a6', secondary: '#22d3ee', obstacleSize: 17, speed: 2.1, spawnRate: 45 },
  snake: { accent: '#22c55e', secondary: '#84cc16', obstacleSize: 17, speed: 2.35, spawnRate: 43 },
  brickbreaker: { accent: '#ec4899', secondary: '#f43f5e', obstacleSize: 18, speed: 2.3, spawnRate: 42 },
  puzzle: { accent: '#3b82f6', secondary: '#6366f1', obstacleSize: 17, speed: 2.15, spawnRate: 45 },
  trivia: { accent: '#10b981', secondary: '#0ea5e9', obstacleSize: 16, speed: 2.25, spawnRate: 44 },
  mathrace: { accent: '#8b5cf6', secondary: '#3b82f6', obstacleSize: 16, speed: 2.45, spawnRate: 41 },
  wordrace: { accent: '#06b6d4', secondary: '#14b8a6', obstacleSize: 16, speed: 2.25, spawnRate: 43 },
  colorswitch: { accent: '#f43f5e', secondary: '#f59e0b', obstacleSize: 14, speed: 2.7, spawnRate: 39 },
  riddles: { accent: '#eab308', secondary: '#f97316', obstacleSize: 18, speed: 2.15, spawnRate: 45 },
  millionaire: { accent: '#f59e0b', secondary: '#facc15', obstacleSize: 19, speed: 2.2, spawnRate: 44 },
  brickstormx: { accent: '#ec4899', secondary: '#8b5cf6', obstacleSize: 15, speed: 2.75, spawnRate: 38 },
  puzzlemaster: { accent: '#3b82f6', secondary: '#22d3ee', obstacleSize: 16, speed: 2.5, spawnRate: 40 },
  triviaplus: { accent: '#10b981', secondary: '#22c55e', obstacleSize: 16, speed: 2.5, spawnRate: 40 },
  wordmaster: { accent: '#06b6d4', secondary: '#38bdf8', obstacleSize: 15, speed: 2.6, spawnRate: 39 },
  reactiontap: { accent: '#ef4444', secondary: '#f97316', obstacleSize: 13, speed: 2.95, spawnRate: 36 },
  sequencesprint: { accent: '#22c55e', secondary: '#06b6d4', obstacleSize: 16, speed: 2.65, spawnRate: 39 },
};
const getInitialLivesForGame = (gameId) => (gameId === 'puzzle' ? 6 : 3);

const buildImportedGameHtml = (game) => {
  const preset = IMPORTED_GAME_PRESETS[game?.id] || IMPORTED_GAME_PRESETS.default;
  const gameName = (game?.name || 'Imported Action Game').replace(/'/g, '');
  const initialLives = getInitialLivesForGame(game?.id);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0b1020; }
  canvas { display: block; width: 100vw; height: 100vh; touch-action: none; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
(() => {
  const accent = '${preset.accent}';
  const secondary = '${preset.secondary}';
  const obstacleSize = ${preset.obstacleSize};
  const baseSpeed = ${preset.speed};
  const spawnRate = ${preset.spawnRate};
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const state = {
    w: 0, h: 0, time: 0, score: 0, lives: ${initialLives}, ended: false,
    playerX: 0, playerY: 0, playerR: 18, obstacles: [], particles: []
  };

  function post(type, payload) {
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
    } catch (_) {}
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.w = canvas.width;
    state.h = canvas.height;
    state.playerY = state.h - 80;
    if (!state.playerX) state.playerX = state.w * 0.5;
  }
  window.addEventListener('resize', resize);
  resize();

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawnObstacle() {
    const lane = Math.floor(rand(0, 5));
    const laneW = state.w / 5;
    const x = lane * laneW + laneW * 0.5;
    const color = Math.random() > 0.5 ? accent : secondary;
    state.obstacles.push({ x, y: -30, r: obstacleSize, v: baseSpeed + rand(0.2, 1.3), c: color });
  }

  function addBurst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      state.particles.push({
        x, y, vx: rand(-2, 2), vy: rand(-2, 2), life: rand(12, 24), color
      });
    }
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, state.h);
    g.addColorStop(0, '#0f172a');
    g.addColorStop(1, '#0b1020');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    for (let i = 0; i < 20; i++) {
      const y = (state.time * 0.4 + i * 40) % state.h;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, y, state.w, 1);
    }
  }

  function drawPlayer() {
    ctx.beginPath();
    ctx.arc(state.playerX, state.playerY, state.playerR, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('${gameName}', 16, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Score: ' + state.score, 16, 52);
    ctx.fillText('Lives: ' + state.lives, state.w - 86, 28);
  }

  function collide(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const r = a.r + b.r;
    return dx * dx + dy * dy <= r * r;
  }

  function tick() {
    if (state.ended) return;
    state.time += 1;
    state.score += 1;

    if (state.time % spawnRate === 0) spawnObstacle();

    state.obstacles.forEach((o) => {
      o.y += o.v;
      if (collide({ x: o.x, y: o.y, r: o.r }, { x: state.playerX, y: state.playerY, r: state.playerR })) {
        o.hit = true;
        state.lives -= 1;
        addBurst(o.x, o.y, o.c);
        post('lives', { lives: state.lives });
      }
    });

    state.obstacles = state.obstacles.filter((o) => !o.hit && o.y < state.h + 40);

    state.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
    });
    state.particles = state.particles.filter((p) => p.life > 0);

    if (state.time % 25 === 0) post('score', { score: state.score });

    if (state.lives <= 0) {
      state.ended = true;
      post('complete', { score: state.score });
    }
  }

  function draw() {
    drawBackground();

    state.obstacles.forEach((o) => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = o.c;
      ctx.shadowColor = o.c;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    state.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 24);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    drawPlayer();
    drawHUD();
  }

  function loop() {
    tick();
    draw();
    if (!state.ended) requestAnimationFrame(loop);
  }

  function updateX(clientX) {
    state.playerX = clamp(clientX, 20, state.w - 20);
  }

  window.addEventListener('mousemove', (e) => updateX(e.clientX));
  window.addEventListener('touchstart', (e) => updateX(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove', (e) => updateX(e.touches[0].clientX), { passive: true });

  post('ready', {});
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>`;
};

const getOriginSafe = (url) => {
  try {
    return new URL(url).origin;
  } catch (_) {
    return null;
  }
};

const ImportedArcadeGame = ({ game, mode, onComplete, onClose }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(getInitialLivesForGame(game?.id));
  const [finished, setFinished] = useState(false);
  const [useExternalSource, setUseExternalSource] = useState(Boolean(game?.externalUrl));
  const [webLoading, setWebLoading] = useState(true);
  const completedRef = useRef(false);
  const sessionStartRef = useRef(Date.now());
  const fallbackNotifiedRef = useRef(false);
  const blockedNavNotifiedRef = useRef(false);
  const externalOrigin = useMemo(() => getOriginSafe(game?.externalUrl || ''), [game?.externalUrl]);

  const claimPoints = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const sessionSeconds = Math.max(0, Math.floor((Date.now() - sessionStartRef.current) / 1000));
    const effectiveScore = Math.max(score, sessionSeconds * 2);
    const calculated = Math.max(8, Math.min(36, Math.floor(effectiveScore / 18)));
    // استمرار اللعب يمنح فرصة فوز حقيقية (وليس مشاركة فقط).
    const sustainedPlay = finished || effectiveScore >= 120 || sessionSeconds >= 75;
    const resultType = sustainedPlay ? 'win' : (mode === 'online' ? 'draw' : 'draw');
    onComplete(calculated, resultType);
  }, [finished, mode, onComplete, score]);

  useEffect(() => {
    completedRef.current = false;
    sessionStartRef.current = Date.now();
    fallbackNotifiedRef.current = false;
    blockedNavNotifiedRef.current = false;
    setScore(0);
    setLives(getInitialLivesForGame(game?.id));
    setFinished(false);
    setWebLoading(true);
    setUseExternalSource(Boolean(game?.externalUrl));
  }, [game?.id, game?.externalUrl]);

  const fallbackToInternal = useCallback(() => {
    if (!useExternalSource) return;
    setUseExternalSource(false);
    setWebLoading(false);
    if (fallbackNotifiedRef.current) return;
    fallbackNotifiedRef.current = true;
    Alert.alert(
      'تشغيل داخلي',
      'تم إبقاء اللعبة داخل التطبيق وتحويلها لمحرك داخلي لضمان العمل بدون فتح أي صفحة خارجية.',
    );
  }, [useExternalSource]);

  const allowNavigation = useCallback((request) => {
    if (!useExternalSource || !externalOrigin) return true;
    const url = request?.url || '';
    const mainDocumentURL = request?.mainDocumentURL || '';
    if (mainDocumentURL && mainDocumentURL !== url) return true;
    const isTopFrame = request?.isTopFrame ?? true;
    // Allow subresource requests (scripts/images/fonts) from CDN domains.
    if (!isTopFrame) return true;
    if (
      url.startsWith('about:blank')
      || url.startsWith('data:')
      || url.startsWith('javascript:')
    ) return true;
    try {
      return new URL(url).origin === externalOrigin;
    } catch (_) {
      return false;
    }
  }, [externalOrigin, useExternalSource]);

  const webGuardScript = `(() => {
    window.open = () => null;
    document.addEventListener('click', function(e) {
      var node = e.target;
      while (node && node.tagName !== 'A') node = node.parentElement;
      if (!node || !node.getAttribute) return;
      var href = node.getAttribute('href') || '';
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        e.preventDefault();
      }
    }, true);
    true;
  })();`;

  return (
    <View style={styles.importedGameContainer}>
      <View style={styles.importedGameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.importedGameBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.importedGameTitle}>{game?.name || 'Arcade'}</Text>
          <Text style={styles.importedGameSub}>
            {game?.externalMultiplayerDirect
              ? `أونلاين مباشر ${game?.playerRange || ''}`.trim()
              : (useExternalSource ? 'مستورد داخل التطبيق' : 'محرك داخلي داخل التطبيق')}
          </Text>
        </View>
        <View style={styles.importedStatPill}>
          <Ionicons name="heart" size={14} color="#f43f5e" />
          <Text style={styles.importedStatText}>{lives}</Text>
        </View>
      </View>

      <View style={styles.importedWebWrap}>
        <WebView
          originWhitelist={['https://*', 'http://*', 'about:blank', 'data:*']}
          source={useExternalSource && game?.externalUrl ? { uri: game.externalUrl } : { html: buildImportedGameHtml(game) }}
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScript={useExternalSource ? webGuardScript : undefined}
          setSupportMultipleWindows={false}
          javaScriptCanOpenWindowsAutomatically={false}
          allowsBackForwardNavigationGestures={false}
          mixedContentMode="never"
          onLoadStart={() => setWebLoading(true)}
          onLoadEnd={() => setWebLoading(false)}
          onShouldStartLoadWithRequest={(request) => {
            const allowed = allowNavigation(request);
            if (!allowed) {
              if (!blockedNavNotifiedRef.current) {
                blockedNavNotifiedRef.current = true;
                Alert.alert('رابط خارجي محظور', 'تم منع فتح رابط خارج اللعبة. ستبقى داخل التطبيق.');
              }
            }
            return allowed;
          }}
          onNavigationStateChange={(navState) => {
            if (!useExternalSource || !externalOrigin || !navState?.url) return;
            try {
              const navOrigin = new URL(navState.url).origin;
              if (navOrigin !== externalOrigin) {
                // Keep external game running; block only top-level external hops.
                return;
              }
            } catch (_) {
              // Ignore parse errors and keep current session.
            }
          }}
          onError={() => fallbackToInternal()}
          onHttpError={() => fallbackToInternal()}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data || '{}');
              if (data.type === 'score' && typeof data.score === 'number') setScore(data.score);
              if (data.type === 'lives' && typeof data.lives === 'number') setLives(data.lives);
              if (data.type === 'complete') setFinished(true);
            } catch (_) {}
          }}
          style={styles.importedWebView}
        />
        {webLoading && (
          game?.coverImage ? (
            <ImageBackground
              source={{ uri: game.coverImage }}
              style={styles.importedWebLoading}
              imageStyle={styles.importedWebLoadingImage}
            >
              <View style={styles.importedWebLoadingOverlay}>
                <ActivityIndicator size="small" color="#60a5fa" />
                <Text style={styles.importedWebLoadingText}>جاري تحميل اللعبة داخل التطبيق...</Text>
              </View>
            </ImageBackground>
          ) : (
            <View style={styles.importedWebLoading}>
              <ActivityIndicator size="small" color="#60a5fa" />
              <Text style={styles.importedWebLoadingText}>جاري تحميل اللعبة داخل التطبيق...</Text>
            </View>
          )
        )}
      </View>

      <View style={styles.importedFooter}>
        <View style={styles.importedScoreBox}>
          <Ionicons name="flash" size={16} color="#fbbf24" />
          <Text style={styles.importedScoreText}>النقاط {score}</Text>
        </View>
        {useExternalSource ? (
          <TouchableOpacity style={styles.importedSwitchBtn} onPress={() => setUseExternalSource(false)}>
            <Ionicons name="shield-checkmark" size={14} color="#93c5fd" />
            <Text style={styles.importedSwitchText}>وضع داخلي</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.importedClaimBtn, finished && styles.importedClaimBtnReady]}
          onPress={claimPoints}
        >
          <Text style={styles.importedClaimText}>{finished ? 'تحصيل النقاط' : 'إنهاء الجولة'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==================== MODE SELECTOR ====================
const ModeSelector = ({ onSelectMode, onClose, gameName, hasOnline, chatInviteCost }) => (
  <View style={styles.modeContainer}>
    <View style={styles.modeHeader}>
      <TouchableOpacity onPress={onClose} style={styles.modeCloseBtn}>
        <Ionicons name="close" size={24} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.modeTitle}>{gameName}</Text>
      <View style={{ width: 40 }} />
    </View>
    
    <Text style={styles.modeSubtitle}>اختر نوع اللعب</Text>
    
    <View style={styles.modeOptions}>
      {hasOnline ? (
        <>
          <TouchableOpacity style={styles.modeOption} onPress={() => onSelectMode('online')}>
            <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.modeGradient}>
              <Ionicons name="globe-outline" size={40} color="#FFF" />
              <Text style={styles.modeOptionTitle}>أونلاين سريع</Text>
              <Text style={styles.modeOptionDesc}>تحدى لاعبين حقيقيين فورًا</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeOption} onPress={() => onSelectMode('online_chat_invite')}>
            <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.modeGradient}>
              <Ionicons name="chatbubbles-outline" size={40} color="#FFF" />
              <Text style={styles.modeOptionTitle}>دعوة من الشات العام</Text>
              <Text style={styles.modeOptionDesc}>خصم {chatInviteCost} ألماسات ونشر دعوة أونلاين</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeOption} onPress={() => onSelectMode('online_friend_invite')}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.modeGradient}>
              <Ionicons name="people-outline" size={40} color="#FFF" />
              <Text style={styles.modeOptionTitle}>دعوة صديق</Text>
              <Text style={styles.modeOptionDesc}>إرسال دعوة مجانية للأصدقاء</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : null}
      
      <TouchableOpacity style={styles.modeOption} onPress={() => onSelectMode('ai_medium')}>
        <LinearGradient colors={['#10b981', '#059669']} style={styles.modeGradient}>
          <Ionicons name="hardware-chip-outline" size={40} color="#FFF" />
          <Text style={styles.modeOptionTitle}>كمبيوتر - متوسط</Text>
          <Text style={styles.modeOptionDesc}>للتدريب والتعلم</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.modeOption} onPress={() => onSelectMode('ai_hard')}>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.modeGradient}>
          <Ionicons name="skull-outline" size={40} color="#FFF" />
          <Text style={styles.modeOptionTitle}>كمبيوتر - صعب</Text>
          <Text style={styles.modeOptionDesc}>تحدٍ حقيقي</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </View>
);

// ==================== WAITING FOR OPPONENT ====================
const WaitingScreen = ({ onCancel, gameType }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, []);
  
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  
  return (
    <View style={styles.waitingContainer}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Ionicons name="sync-outline" size={60} color="#60a5fa" />
      </Animated.View>
      <Text style={styles.waitingTitle}>جاري البحث عن منافس...</Text>
      <Text style={styles.waitingDesc}>انتظر قليلاً ليتم إيجاد لاعب مناسب</Text>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>إلغاء</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==================== AD CONTINUE MODAL ====================
const AdContinueModal = ({ visible, gameName, onWatchAd, onClose, loading = false }) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.adModalOverlay}>
        <View style={styles.adModalCard}>
          <LinearGradient colors={['#161625', '#0f0f1b']} style={styles.adModalGradient}>
            <View style={styles.adModalIcon}>
              <Ionicons name="play-circle" size={34} color="#fff" />
            </View>
            <Text style={styles.adModalTitle}>تابع اللعب بدون إزعاج</Text>
            <Text style={styles.adModalSub}>
              لمواصلة لعب {gameName || 'اللعبة'} تحتاج ألماس. شاهد إعلانًا لتحصل على ألماس مباشر،
              ويتم احتساب جوهرة صقر لكل دقيقة مشاهدة تراكمية (500 جوهرة = 1 ريال).
            </Text>
            <TouchableOpacity
              style={styles.adModalPrimaryBtn}
              onPress={onWatchAd}
              activeOpacity={0.9}
              disabled={loading}
            >
              <LinearGradient colors={['#ec4899', '#9333ea']} style={styles.adModalPrimaryGradient}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.adModalPrimaryText}>شاهد إعلان وتابع الآن</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adModalSecondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.adModalSecondaryText}>لاحقًا</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// ==================== TIC TAC TOE GAME ====================
const TicTacToeGame = ({
  mode,
  onComplete,
  onClose,
  isOnline,
  isMyTurn: initialTurn,
  onSendMove,
  variant = 'classic',
  title = 'Arena X-O',
}) => {
  const boardSize = variant === 'pro4' ? 4 : 3;
  const totalCells = boardSize * boardSize;
  const rewardMap = variant === 'pro4'
    ? { win: 26, lose: 7, draw: 12 }
    : { win: 20, lose: 5, draw: 10 };

  const [board, setBoard] = useState(() => Array(totalCells).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(isOnline ? initialTurn : true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ player: 0, opponent: 0, draws: 0 });
  const [opponentName] = useState(isOnline ? 'منافس' : 'الكمبيوتر');

  const checkWinner = useCallback((squares) => {
    for (let row = 0; row < boardSize; row += 1) {
      const first = squares[row * boardSize];
      if (first && Array.from({ length: boardSize }).every((_, c) => squares[row * boardSize + c] === first)) {
        return first;
      }
    }

    for (let col = 0; col < boardSize; col += 1) {
      const first = squares[col];
      if (first && Array.from({ length: boardSize }).every((_, r) => squares[r * boardSize + col] === first)) {
        return first;
      }
    }

    const mainDiag = squares[0];
    if (mainDiag && Array.from({ length: boardSize }).every((_, i) => squares[i * boardSize + i] === mainDiag)) {
      return mainDiag;
    }

    const antiDiag = squares[boardSize - 1];
    if (antiDiag && Array.from({ length: boardSize }).every((_, i) => squares[i * boardSize + (boardSize - 1 - i)] === antiDiag)) {
      return antiDiag;
    }

    return squares.every((s) => s !== null) ? 'draw' : null;
  }, [boardSize]);

  const handleGameEnd = useCallback((result) => {
    setGameOver(true);
    if (result === 'X') {
      setWinner('player');
      setScores((s) => ({ ...s, player: s.player + 1 }));
      onComplete(rewardMap.win, 'win');
    } else if (result === 'O') {
      setWinner('opponent');
      setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
      onComplete(rewardMap.lose, 'lose');
    } else {
      setWinner('draw');
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      onComplete(rewardMap.draw, 'draw');
    }
  }, [onComplete, rewardMap.draw, rewardMap.lose, rewardMap.win]);

  // استقبال حركات الخصم الأونلاين
  useEffect(() => {
    if (!isOnline) return;
    const unsubMove = require('../services/multiplayer').default.on('opponentMove', (data) => {
      if (!data.move || typeof data.move.position !== 'number') return;
      const movePos = data.move.position;

      setBoard((prevBoard) => {
        if (movePos < 0 || movePos >= totalCells || prevBoard[movePos] || gameOver) {
          return prevBoard;
        }
        const nextBoard = [...prevBoard];
        nextBoard[movePos] = 'O';
        const result = checkWinner(nextBoard);
        if (result) {
          handleGameEnd(result);
        } else {
          setIsPlayerTurn(true);
        }
        return nextBoard;
      });
    });

    return () => unsubMove();
  }, [checkWinner, gameOver, handleGameEnd, isOnline, totalCells]);

  const minimax = (squares, isMax, depth = 0) => {
    const result = checkWinner(squares);
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (result === 'draw') return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i += 1) {
        if (!squares[i]) {
          squares[i] = 'O';
          best = Math.max(best, minimax(squares, false, depth + 1));
          squares[i] = null;
        }
      }
      return best;
    }

    let best = Infinity;
    for (let i = 0; i < 9; i += 1) {
      if (!squares[i]) {
        squares[i] = 'X';
        best = Math.min(best, minimax(squares, true, depth + 1));
        squares[i] = null;
      }
    }
    return best;
  };

  const getAIMove = (currentBoard) => {
    const empty = currentBoard
      .map((s, i) => (s === null ? i : null))
      .filter((i) => i !== null);

    if (empty.length === 0) return null;

    if (totalCells > 9) {
      const findCriticalMove = (symbol) => {
        for (const idx of empty) {
          currentBoard[idx] = symbol;
          const wins = checkWinner(currentBoard) === symbol;
          currentBoard[idx] = null;
          if (wins) return idx;
        }
        return null;
      };

      if (mode === 'ai_medium' && Math.random() < 0.45) {
        return empty[Math.floor(Math.random() * empty.length)];
      }

      const winningMove = findCriticalMove('O');
      if (winningMove !== null) return winningMove;

      const blockingMove = findCriticalMove('X');
      if (blockingMove !== null) return blockingMove;

      const center = Math.floor(totalCells / 2);
      if (currentBoard[center] === null) return center;

      return empty[Math.floor(Math.random() * empty.length)];
    }

    if (mode === 'ai_medium' && Math.random() < 0.5) {
      return empty[Math.floor(Math.random() * empty.length)];
    }

    let bestScore = -Infinity;
    let bestMove = empty[0];
    for (const i of empty) {
      currentBoard[i] = 'O';
      const score = minimax(currentBoard, false);
      currentBoard[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
    return bestMove;
  };

  const handlePress = (index) => {
    if (board[index] || gameOver || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    if (isOnline && onSendMove) {
      onSendMove({ position: index, symbol: 'X' });
    }

    const result = checkWinner(newBoard);
    if (result) {
      handleGameEnd(result);
      return;
    }

    setIsPlayerTurn(false);

    if (!isOnline && (mode === 'ai_medium' || mode === 'ai_hard')) {
      setTimeout(() => {
        const aiIndex = getAIMove([...newBoard]);
        if (aiIndex !== null && aiIndex !== undefined) {
          newBoard[aiIndex] = 'O';
          setBoard([...newBoard]);
          const aiResult = checkWinner(newBoard);
          if (aiResult) {
            handleGameEnd(aiResult);
          } else {
            setIsPlayerTurn(true);
          }
        }
      }, variant === 'pro4' ? 450 : 600);
    }
  };

  const resetGame = () => {
    setBoard(Array(totalCells).fill(null));
    setIsPlayerTurn(isOnline ? initialTurn : true);
    setGameOver(false);
    setWinner(null);
  };

  const boardWidth = Math.min(width - 60, variant === 'pro4' ? 360 : 320);
  const cellSize = (boardWidth - 20) / boardSize;
  const iconSize = boardSize === 4 ? 38 : 50;

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>{title}</Text>
        <TouchableOpacity onPress={resetGame} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      <View style={styles.scoreBoard}>
        <View style={[styles.scorePlayer, isPlayerTurn && !gameOver && styles.activePlayer]}>
          <Ionicons name="person" size={20} color="#60a5fa" />
          <Text style={styles.scoreLabel}>أنت</Text>
          <Text style={styles.scoreNum}>{scores.player}</Text>
        </View>
        <View style={styles.scoreMiddle}>
          <Text style={styles.drawsLabel}>تعادل</Text>
          <Text style={styles.drawsNum}>{scores.draws}</Text>
        </View>
        <View style={[styles.scorePlayer, !isPlayerTurn && !gameOver && styles.activePlayer]}>
          <Ionicons name={isOnline ? 'person' : 'hardware-chip'} size={20} color="#f59e0b" />
          <Text style={styles.scoreLabel}>{opponentName}</Text>
          <Text style={styles.scoreNum}>{scores.opponent}</Text>
        </View>
      </View>

      <View style={[styles.tttBoard, { width: boardWidth }]}>
        {board.map((cell, idx) => {
          const row = Math.floor(idx / boardSize);
          const col = idx % boardSize;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.tttCell,
                {
                  width: cellSize,
                  height: cellSize,
                },
                col !== boardSize - 1 && styles.cellBorderR,
                row !== boardSize - 1 && styles.cellBorderB,
              ]}
              onPress={() => handlePress(idx)}
              activeOpacity={0.7}
            >
              {cell && (
                <Ionicons
                  name={cell === 'X' ? 'close' : 'ellipse-outline'}
                  size={iconSize}
                  color={cell === 'X' ? '#60a5fa' : '#f59e0b'}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {!gameOver && (
        <View style={styles.turnIndicator}>
          <Ionicons
            name={isPlayerTurn ? 'close' : 'ellipse-outline'}
            size={24}
            color={isPlayerTurn ? '#60a5fa' : '#f59e0b'}
          />
          <Text style={styles.turnText}>
            {isPlayerTurn ? 'دورك' : `دور ${opponentName}`}
          </Text>
        </View>
      )}

      {gameOver && (
        <View style={styles.resultCard}>
          <Ionicons
            name={winner === 'player' ? 'trophy' : winner === 'draw' ? 'remove' : 'sad'}
            size={50}
            color={winner === 'player' ? '#fbbf24' : winner === 'draw' ? '#888' : '#ef4444'}
          />
          <Text style={styles.resultText}>
            {winner === 'player' ? 'فوز!' : winner === 'draw' ? 'تعادل' : 'خسارة'}
          </Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.playAgainText}>العب مجدداً</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ==================== PUZZLE GAME ====================
// ==================== PUZZLE GAME (PROFESSIONAL AI-GENERATED IMAGES) ====================
const PUZZLE_IMAGES = [
  { 
    id: 1, 
    name: 'غروب الشمس', 
    icon: 'sunny', 
    gradient: ['#f59e0b', '#ef4444'], 
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/790aea00464f3094d85b3ec7bcb2afb006df8e90e0f04201191220ec251f21df.png' 
  },
  { 
    id: 2, 
    name: 'الجبال', 
    icon: 'snow', 
    gradient: ['#06b6d4', '#3b82f6'], 
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/3d8c26e54596dfd6119b3e0dbc132bba3f9a7a4b838f53c5f707a8ee3b76a5e5.png' 
  },
  { 
    id: 3, 
    name: 'القطة', 
    icon: 'paw', 
    gradient: ['#f97316', '#fbbf24'], 
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/80dd5458cd76b663ba0070e59843f6a7aba7a44cb4cf4d0a4e40eca1f3712cab.png' 
  },
  { 
    id: 4, 
    name: 'الزهور', 
    icon: 'flower', 
    gradient: ['#ec4899', '#db2777'], 
    image: 'https://static.prod-images.emergentagent.com/jobs/c02a9dba-c6d7-4025-8581-e3386f2d9f92/images/d57d16dad83d4ac03e77928fabc5111a4bd66f58c3ec7ea3def95ff179a63a10.png' 
  },
];

// Responsive puzzle size
const getPuzzleSize = () => {
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth > 600;
  return isTablet ? 350 : screenWidth - 48;
};

const PuzzleGame = ({ mode, onComplete, onClose }) => {
  const [pieces, setPieces] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [selected, setSelected] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const [currentImage, setCurrentImage] = useState(PUZZLE_IMAGES[0]);
  const [showPreview, setShowPreview] = useState(true);
  const [hintUsed, setHintUsed] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const gridSize = difficulty;
  const puzzleSize = getPuzzleSize();

  useEffect(() => {
    // عرض الصورة الأصلية لمدة 3 ثواني قبل البدء
    setShowPreview(true);
    const previewTimer = setTimeout(() => {
      setShowPreview(false);
      initPuzzle();
    }, 3000);
    return () => clearTimeout(previewTimer);
  }, [difficulty, currentImage]);

  useEffect(() => {
    let interval;
    if (!completed && pieces.length > 0 && !showPreview) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [completed, pieces, showPreview]);

  const initPuzzle = () => {
    const total = gridSize * gridSize;
    let arr = [...Array(total).keys()];
    // Fisher-Yates Shuffle للتأكد من قابلية الحل
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setPieces(arr);
    setMoves(0);
    setTimer(0);
    setCompleted(false);
    setSelected(null);
    setHintUsed(0);
  };

  const handlePiecePress = (idx) => {
    if (completed || showPreview) return;
    
    if (selected === null) {
      setSelected(idx);
    } else {
      const newPieces = [...pieces];
      [newPieces[selected], newPieces[idx]] = [newPieces[idx], newPieces[selected]];
      setPieces(newPieces);
      setMoves(m => m + 1);
      setSelected(null);

      if (newPieces.every((p, i) => p === i)) {
        setCompleted(true);
        const basePoints = { 3: 50, 4: 100, 5: 150 }[gridSize] || 50;
        const timeBonus = Math.max(0, 30 - Math.floor(timer / 10));
        const movesBonus = Math.max(0, 20 - Math.floor(moves / 5));
        const hintPenalty = hintUsed * 10;
        const totalPoints = Math.max(10, basePoints + timeBonus + movesBonus - hintPenalty);
        onComplete(totalPoints, 'win');
      }
    }
  };

  const useHint = () => {
    if (hintUsed >= 3 || completed) return;
    // عرض الصورة الأصلية لمدة 2 ثانية
    setShowPreview(true);
    setHintUsed(h => h + 1);
    setTimeout(() => setShowPreview(false), 2000);
  };

  const changeImage = () => {
    const currentIdx = PUZZLE_IMAGES.findIndex(img => img.id === currentImage.id);
    const nextIdx = (currentIdx + 1) % PUZZLE_IMAGES.length;
    setCurrentImage(PUZZLE_IMAGES[nextIdx]);
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // شاشة المعاينة
  if (showPreview) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>تركيب الصور</Text>
          <View style={{ width: 44 }} />
        </View>
        
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>احفظ هذه الصورة!</Text>
          <View style={[styles.previewImage, { width: width - 80, height: width - 80, overflow: 'hidden', borderRadius: 16 }]}>
            <Image 
              source={{ uri: currentImage.image }} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View style={styles.previewOverlay}>
              <Text style={styles.previewName}>{currentImage.name}</Text>
            </View>
          </View>
          <Text style={styles.previewCountdown}>تبدأ اللعبة خلال ثوانٍ...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>تركيب الصور</Text>
        <TouchableOpacity onPress={initPuzzle} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      {/* Current Image Indicator */}
      <TouchableOpacity onPress={changeImage} style={styles.imageIndicator}>
        <LinearGradient colors={currentImage.gradient} style={styles.imageIndicatorGradient}>
          <Ionicons name={resolveIconName(currentImage.icon, 'image-outline')} size={20} color="#FFF" />
          <Text style={styles.imageIndicatorName}>{currentImage.name}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Difficulty Selector */}
      <View style={styles.difficultyRow}>
        {[3, 4, 5].map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d}×{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color="#60a5fa" />
          <Text style={styles.statText}>{formatTime(timer)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="swap-horizontal" size={18} color="#f59e0b" />
          <Text style={styles.statText}>{moves} حركة</Text>
        </View>
        <TouchableOpacity style={styles.hintBtn} onPress={useHint} disabled={hintUsed >= 3}>
          <Ionicons name="bulb" size={18} color={hintUsed >= 3 ? '#666' : '#fbbf24'} />
          <Text style={[styles.hintText, hintUsed >= 3 && { color: '#666' }]}>{3 - hintUsed}</Text>
        </TouchableOpacity>
      </View>

      {/* Puzzle Grid - باستخدام صور حقيقية */}
      <View style={[styles.puzzleGrid, { width: puzzleSize, alignSelf: 'center' }]}>
        {pieces.map((piece, idx) => {
          const pieceSize = (puzzleSize - 8) / gridSize;
          const isCorrect = piece === idx;
          const isSelected = selected === idx;
          
          // حساب موقع القطعة في الشبكة الأصلية
          const row = Math.floor(piece / gridSize);
          const col = piece % gridSize;
          
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.puzzlePiece,
                { width: pieceSize, height: pieceSize },
                isSelected && styles.pieceSelected,
                completed && styles.pieceCorrect,
              ]}
              onPress={() => handlePiecePress(idx)}
              activeOpacity={0.8}
            >
              {/* عرض جزء من الصورة الحقيقية */}
              <View style={[styles.pieceInner, { overflow: 'hidden' }]}>
                <Image 
                  source={{ uri: currentImage.image }}
                  style={{
                    width: puzzleSize - 8,
                    height: puzzleSize - 8,
                    position: 'absolute',
                    left: -(col * pieceSize),
                    top: -(row * pieceSize),
                  }}
                  resizeMode="cover"
                />
                {/* تأثير عند التحديد */}
                {isSelected && (
                  <View style={styles.pieceSelectedOverlay} />
                )}
                {/* علامة صح للقطع الصحيحة */}
                {isCorrect && !completed && (
                  <View style={styles.pieceCorrectBadge}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </View>
              {/* رقم القطعة */}
              <View style={[styles.pieceNumBadge, isSelected && styles.pieceNumBadgeSelected]}>
                <Text style={styles.pieceNum}>{piece + 1}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {pieces.filter((p, i) => p === i).length} / {gridSize * gridSize} قطعة صحيحة
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(pieces.filter((p, i) => p === i).length / (gridSize * gridSize)) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {completed && (
        <View style={styles.completedCard}>
          <Ionicons name="trophy" size={50} color="#fbbf24" />
          <Text style={styles.completedText}>ممتاز</Text>
          <Text style={styles.completedSub}>{moves} حركة في {formatTime(timer)}</Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={() => {
            setCurrentImage(PUZZLE_IMAGES[Math.floor(Math.random() * PUZZLE_IMAGES.length)]);
          }}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.playAgainText}>صورة جديدة</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ==================== TRIVIA GAME ====================
const TriviaGame = ({ mode, onComplete, onClose }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [questions, setQuestions] = useState([]);

  // اختيار 50 سؤال عشوائي متغير لكل جولة
  useEffect(() => {
    const shuffled = shuffleArray(triviaQuestions);
    const selected = shuffled.slice(0, 50).map(q => ({
      q: q.question,
      options: q.options,
      correct: q.answer,
      category: q.category
    }));
    setQuestions(selected);
  }, []);

  useEffect(() => {
    if (questions.length === 0) return;
    if (timeLeft > 0 && answered === null && !showResult) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && answered === null) {
      handleAnswer(-1);
    }
  }, [timeLeft, answered, showResult, questions]);

  const handleAnswer = (idx) => {
    if (answered !== null || questions.length === 0) return;
    setAnswered(idx);
    
    if (idx === questions[currentQ].correct) {
      setScore(s => s + 10 + Math.floor(timeLeft / 4));
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1);
        setAnswered(null);
        setTimeLeft(20);
      } else {
        setShowResult(true);
        const finalScore = score + (idx === questions[currentQ].correct ? 10 + Math.floor(timeLeft / 4) : 0);
        onComplete(finalScore, 'win');
      }
    }, 1500);
  };

  if (questions.length === 0) {
    return (
      <View style={styles.gameContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={{ color: '#FFF', marginTop: 20 }}>جاري تحميل الأسئلة...</Text>
      </View>
    );
  }

  if (showResult) {
    const correctAnswers = Math.floor(score / 10);
    return (
      <View style={styles.gameContainer}>
        <View style={styles.resultScreen}>
          <Ionicons name="ribbon" size={80} color="#fbbf24" />
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalLabel}>نقطة</Text>
          <Text style={styles.finalSub}>أجبت بشكل صحيح على {correctAnswers} من {questions.length} سؤال</Text>
          <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
            <Text style={styles.exitText}>إنهاء</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const q = questions[currentQ];

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>أسئلة ثقافية</Text>
        <View style={styles.headerBtn}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{currentQ + 1} / {questions.length}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentQ + 1) / questions.length) * 100}%` }]} />
        </View>
      </View>

      {/* Timer */}
      <View style={[styles.timerCircle, timeLeft <= 5 && styles.timerDanger]}>
        <Ionicons name="time" size={20} color={timeLeft <= 5 ? '#ef4444' : '#60a5fa'} />
        <Text style={[styles.timerText, timeLeft <= 5 && styles.timerDangerText]}>{timeLeft}</Text>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q.q}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {q.options.map((opt, idx) => {
          let optStyle = styles.optionBtn;
          if (answered !== null) {
            if (idx === q.correct) optStyle = [styles.optionBtn, styles.optionCorrect];
            else if (idx === answered) optStyle = [styles.optionBtn, styles.optionWrong];
          }
          
          return (
            <TouchableOpacity
              key={idx}
              style={optStyle}
              onPress={() => handleAnswer(idx)}
              disabled={answered !== null}
            >
              <View style={styles.optionLetter}>
                <Text style={styles.optionLetterText}>{['أ', 'ب', 'ج', 'د'][idx]}</Text>
              </View>
              <Text style={styles.optionText}>{opt}</Text>
              {answered !== null && idx === q.correct && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
              {answered !== null && idx === answered && idx !== q.correct && (
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ==================== RIDDLES GAME ====================
const RiddlesGame = ({ mode, onComplete, onClose }) => {
  const [currentR, setCurrentR] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [hints, setHints] = useState(3);
  const [revealed, setRevealed] = useState(false);
  const [riddles, setRiddles] = useState([]);
  const [timeLeft, setTimeLeft] = useState(25);

  // اختيار 12 لغز عشوائي من 50 لغز
  useEffect(() => {
    const shuffled = shuffleArray(riddlesQuestions);
    const selected = shuffled.slice(0, 12).map(q => ({
      r: q.question,
      options: q.options,
      correct: q.answer
    }));
    setRiddles(selected);
  }, []);

  useEffect(() => {
    if (riddles.length === 0) return;
    if (timeLeft > 0 && answered === null && !showResult) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && answered === null) {
      handleAnswer(-1);
    }
  }, [timeLeft, answered, showResult, riddles]);

  const handleAnswer = (idx) => {
    if (answered !== null || riddles.length === 0) return;
    setAnswered(idx);
    
    if (idx === riddles[currentR].correct) {
      setScore(s => s + 15 + Math.floor(timeLeft / 5));
    }

    setTimeout(() => {
      if (currentR < riddles.length - 1) {
        setCurrentR(c => c + 1);
        setAnswered(null);
        setTimeLeft(25);
        setRevealed(false);
      } else {
        setShowResult(true);
        const finalScore = score + (idx === riddles[currentR].correct ? 15 + Math.floor(timeLeft / 5) : 0);
        onComplete(finalScore, 'win');
      }
    }, 1500);
  };

  const useHint = () => {
    if (hints > 0 && answered === null) {
      setHints(h => h - 1);
      setRevealed(true);
    }
  };

  if (riddles.length === 0) {
    return (
      <View style={styles.gameContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={{ color: '#FFF', marginTop: 20 }}>جاري تحميل الألغاز...</Text>
      </View>
    );
  }

  if (showResult) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.resultScreen}>
          <Ionicons name="bulb" size={80} color="#fbbf24" />
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalLabel}>نقطة</Text>
          <Text style={styles.finalSub}>حللت {riddles.length} لغز</Text>
          <TouchableOpacity style={styles.exitBtn} onPress={onClose}>
            <Text style={styles.exitText}>إنهاء</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const r = riddles[currentR];

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>الألغاز</Text>
        <View style={styles.headerBtn}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <View style={styles.riddleProgress}>
        <Text style={styles.riddleNum}>اللغز {currentR + 1} من {riddles.length}</Text>
        <TouchableOpacity style={styles.hintsBox} onPress={useHint} disabled={hints === 0}>
          <Ionicons name="bulb" size={18} color={hints > 0 ? '#fbbf24' : '#666'} />
          <Text style={styles.hintsText}>{hints}</Text>
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <View style={[styles.timerCircle, timeLeft <= 8 && styles.timerDanger]}>
        <Ionicons name="time" size={20} color={timeLeft <= 8 ? '#ef4444' : '#8b5cf6'} />
        <Text style={[styles.timerText, timeLeft <= 8 && styles.timerDangerText]}>{timeLeft}</Text>
      </View>

      <View style={styles.riddleCard}>
        <Ionicons name="help-circle" size={40} color="#8b5cf6" style={{ marginBottom: 16 }} />
        <Text style={styles.riddleText}>{r.r}</Text>
        
        {revealed && hints < 3 && (
          <View style={styles.hintBox}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.hintText}>تلميح: أحد الخيارات الموجودة</Text>
          </View>
        )}
      </View>

      {/* Options */}
      <View style={styles.optionsGrid}>
        {r.options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.optionBtn,
              answered === idx && idx === r.correct && styles.optionCorrect,
              answered === idx && idx !== r.correct && styles.optionWrong,
              answered !== null && idx === r.correct && styles.optionCorrect,
            ]}
            onPress={() => handleAnswer(idx)}
            disabled={answered !== null}
          >
            <Text style={[
              styles.optionText,
              (answered === idx || (answered !== null && idx === r.correct)) && styles.optionTextSelected
            ]}>
              {opt}
            </Text>
            {answered !== null && idx === r.correct && (
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            )}
            {answered === idx && idx !== r.correct && (
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const ReactionTapGame = ({ onComplete, onClose }) => {
  const GAME_SECONDS = 30;
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState({ x: 120, y: 220, id: 0 });
  const [spawnAt, setSpawnAt] = useState(Date.now());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished]);

  const spawnTarget = useCallback(() => {
    const pad = 56;
    const maxX = Math.max(pad, width - pad - 24);
    const maxY = Math.max(190, height - 300);
    setTarget({
      x: Math.floor(Math.random() * (maxX - pad + 1)) + pad,
      y: Math.floor(Math.random() * (maxY - 190 + 1)) + 190,
      id: Date.now(),
    });
    setSpawnAt(Date.now());
  }, []);

  useEffect(() => {
    spawnTarget();
  }, [spawnTarget]);

  const tapTarget = () => {
    const reactionMs = Date.now() - spawnAt;
    const gain = Math.max(6, 42 - Math.floor(reactionMs / 80));
    setScore((prev) => prev + gain);
    spawnTarget();
  };

  if (finished) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.resultScreen}>
          <Ionicons name="flash" size={72} color="#f59e0b" />
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalLabel}>نقطة سرعة</Text>
          <Text style={styles.finalSub}>لعبة جديدة: اختبر رد الفعل الحقيقي</Text>
          <TouchableOpacity style={styles.exitBtn} onPress={() => onComplete(score, 'win')}>
            <Text style={styles.exitText}>تحصيل النقاط</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exitBtn, { marginTop: 10, backgroundColor: '#334155' }]} onPress={onClose}>
            <Text style={styles.exitText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Reaction Tap</Text>
        <View style={styles.headerBtn}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{ height: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6 }}>
          <View style={{ width: `${(timeLeft / GAME_SECONDS) * 100}%`, height: '100%', backgroundColor: '#22c55e', borderRadius: 6 }} />
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'center' }}>
          اضغط الهدف بسرعة قبل انتهاء الوقت
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <TouchableOpacity
          key={target.id}
          onPress={tapTarget}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            left: target.x,
            top: target.y,
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: '#f43f5e',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: 'rgba(255,255,255,0.6)',
          }}
        >
          <Ionicons name="radio-button-on" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SequenceSprintGame = ({ onComplete, onClose }) => {
  const TOTAL_ROUNDS = 8;
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [options, setOptions] = useState([]);
  const [showSequence, setShowSequence] = useState(true);
  const [finished, setFinished] = useState(false);

  const buildRound = useCallback(() => {
    const start = Math.floor(Math.random() * 15) + 2;
    const step = Math.floor(Math.random() * 4) + 2;
    const seq = [start, start + step, start + step * 2];
    const correct = start + step * 3;
    const distractors = shuffleArray([correct - step, correct + step, correct + step * 2]).slice(0, 3);
    const mixed = shuffleArray([correct, ...distractors]).slice(0, 4);
    setSequence(seq);
    setOptions(mixed);
    setShowSequence(true);
    setTimeout(() => setShowSequence(false), 1600);
  }, []);

  useEffect(() => {
    buildRound();
  }, [buildRound]);

  const handleAnswer = (value) => {
    const correct = sequence[2] + (sequence[1] - sequence[0]);
    if (value === correct) {
      setScore((prev) => prev + 18);
    }
    if (round >= TOTAL_ROUNDS) {
      setFinished(true);
      return;
    }
    setRound((prev) => prev + 1);
    buildRound();
  };

  if (finished) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.resultScreen}>
          <Ionicons name="analytics" size={72} color="#22c55e" />
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalLabel}>نقطة</Text>
          <Text style={styles.finalSub}>لعبة جديدة: سلاسل رقمية متسارعة</Text>
          <TouchableOpacity style={styles.exitBtn} onPress={() => onComplete(score, 'win')}>
            <Text style={styles.exitText}>تحصيل النقاط</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exitBtn, { marginTop: 10, backgroundColor: '#334155' }]} onPress={onClose}>
            <Text style={styles.exitText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Sequence Sprint</Text>
        <View style={styles.headerBtn}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 12 }}>
          الجولة {round}/{TOTAL_ROUNDS}
        </Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 20 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 26, fontWeight: '700' }}>
            {showSequence ? sequence.join('  •  ') : 'اختر الرقم التالي'}
          </Text>
        </View>
      </View>
      <View style={{ padding: 16, gap: 10 }}>
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={`${opt}-${idx}`}
            style={{ backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 12, padding: 14, alignItems: 'center' }}
            onPress={() => handleAnswer(opt)}
            disabled={showSequence}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const OddOneOutGame = ({ onComplete, onClose }) => {
  const ICON_POOL = ['planet', 'rocket', 'star', 'leaf', 'football', 'diamond'];
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState([]);
  const [oddIndex, setOddIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const TOTAL_ROUNDS = 8;

  const buildGrid = useCallback(() => {
    const base = ICON_POOL[Math.floor(Math.random() * ICON_POOL.length)];
    let odd = ICON_POOL[Math.floor(Math.random() * ICON_POOL.length)];
    while (odd === base) {
      odd = ICON_POOL[Math.floor(Math.random() * ICON_POOL.length)];
    }
    const idx = Math.floor(Math.random() * 9);
    setOddIndex(idx);
    setGrid(Array.from({ length: 9 }, (_, i) => (i === idx ? odd : base)));
  }, []);

  useEffect(() => {
    buildGrid();
  }, [buildGrid]);

  const pickCell = (idx) => {
    if (idx === oddIndex) {
      setScore((prev) => prev + 16);
    }
    if (round >= TOTAL_ROUNDS) {
      setFinished(true);
      return;
    }
    setRound((prev) => prev + 1);
    buildGrid();
  };

  if (finished) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.resultScreen}>
          <Ionicons name="eye" size={72} color="#06b6d4" />
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalLabel}>نقطة ملاحظة</Text>
          <Text style={styles.finalSub}>لعبة جديدة: اكتشف المختلف بسرعة</Text>
          <TouchableOpacity style={styles.exitBtn} onPress={() => onComplete(score, 'win')}>
            <Text style={styles.exitText}>تحصيل النقاط</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exitBtn, { marginTop: 10, backgroundColor: '#334155' }]} onPress={onClose}>
            <Text style={styles.exitText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Odd One Out</Text>
        <View style={styles.headerBtn}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <Text style={{ color: '#cbd5e1', textAlign: 'center', marginTop: 14 }}>
        الجولة {round}/{TOTAL_ROUNDS} — اختر الرمز المختلف
      </Text>
      <View style={{ padding: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {grid.map((iconName, idx) => (
          <TouchableOpacity
            key={`${iconName}-${idx}`}
            style={{
              width: '31%',
              aspectRatio: 1,
              marginBottom: 10,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => pickCell(idx)}
          >
            <Ionicons name={resolveIconName(iconName, 'ellipse')} size={30} color="#f8fafc" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ==================== MAIN GAMES SCREEN ====================
const GamesScreen = ({
  user,
  onPointsEarned,
  onOpenDiamondShop,
  onOpenAchievements,
  balanceRefresh,
  language,
  queuedGameId,
  onQueuedGameHandled,
  onClose,
}) => {
  const [activeGame, setActiveGame] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(null);
  const [showWaiting, setShowWaiting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState({ rank: '-', points: 0, games: 0 });
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ saqr_points: 0, diamonds: 300, daily_points_remaining: 150 });
  const [gameCosts, setGameCosts] = useState({});
  const [onlineOpponent, setOnlineOpponent] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [showAdChallenges, setShowAdChallenges] = useState(false);
  const [showSaqrFortunes, setShowSaqrFortunes] = useState(false);
  const [showAdUnlockModal, setShowAdUnlockModal] = useState(false);
  const [showFriendInviteModal, setShowFriendInviteModal] = useState(false);
  const [friendInviteGameId, setFriendInviteGameId] = useState(null);
  const [friendsForInvite, setFriendsForInvite] = useState([]);
  const [loadingFriendsInvite, setLoadingFriendsInvite] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [pendingAdGame, setPendingAdGame] = useState(null);
  const [adUnlockLoading, setAdUnlockLoading] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pendingOnlineGameRef = useRef(null);
  const userId = user?.id || user?.user_id;

  // كتالوج الألعاب: 12 أساسية + ألعاب جديدة مستقلة
  const games = useMemo(() => ([
    {
      id: 'aiquest',
      name: 'إيفيد آند ديستروي',
      icon: 'rocket-outline',
      secondaryIcon: 'planet-outline',
      colors: ['rgba(236,72,153,0.45)', 'rgba(147,51,234,0.38)'],
      orbGradient: ['#ec4899', '#8b5cf6'],
      accent: '#ec4899',
      description: 'قتال فضائي سريع ومباشر داخل التطبيق.',
      maxPoints: 32,
      online: false,
      onlineCost: 0,
      category: 'ذكاء',
      badge: 'PRO',
      trend: 'رائج',
    },
    {
      id: 'chess',
      name: 'الشطرنج الاحترافي',
      icon: 'trophy-outline',
      secondaryIcon: 'grid-outline',
      colors: ['rgba(124,58,237,0.45)', 'rgba(30,41,59,0.4)'],
      orbGradient: ['#8b5cf6', '#4c1d95'],
      accent: '#8b5cf6',
      description: 'شطرنج احترافي ضد الذكاء الاصطناعي بجودة عالية.',
      maxPoints: 26,
      online: false,
      onlineCost: 0,
      category: 'استراتيجية',
      badge: 'Elite',
      trend: '',
    },
    {
      id: 'tictactoe',
      name: 'غزاة الفضاء',
      icon: 'rocket',
      secondaryIcon: 'radio-outline',
      colors: ['rgba(249,115,22,0.48)', 'rgba(234,88,12,0.35)'],
      orbGradient: ['#f97316', '#ea580c'],
      accent: '#f97316',
      description: 'لعبة كلاسيكية بإطلاق ناري وإيقاع آركيد ممتع.',
      maxPoints: 24,
      online: false,
      onlineCost: 0,
      backendGameId: 'tictactoe',
      variant: 'classic',
      category: 'حركي',
      badge: 'كلاسيك',
      trend: '',
    },
    {
      id: 'tactix',
      name: '2048 كلاسيك',
      icon: 'apps-outline',
      secondaryIcon: 'calculator-outline',
      colors: ['rgba(59,130,246,0.5)', 'rgba(14,116,144,0.34)'],
      orbGradient: ['#3b82f6', '#0ea5e9'],
      accent: '#3b82f6',
      description: 'ادمج الأرقام للوصول إلى 2048 بأفضل نتيجة.',
      maxPoints: 28,
      online: false,
      onlineCost: 0,
      backendGameId: 'tictactoe',
      variant: 'pro4',
      category: 'منطق',
      badge: 'شائع',
      trend: 'رائج',
    },
    {
      id: 'memory',
      name: 'هكسترس',
      icon: 'triangle-outline',
      secondaryIcon: 'flash-outline',
      colors: ['rgba(20,184,166,0.46)', 'rgba(15,118,110,0.34)'],
      orbGradient: ['#14b8a6', '#0f766e'],
      accent: '#14b8a6',
      description: 'تفادي الألوان الساقطة بسرعة وتركيز عالٍ.',
      maxPoints: 20,
      online: false,
      onlineCost: 0,
      category: 'تركيز',
      badge: 'Focus',
      trend: '',
    },
    {
      id: 'snake',
      name: 'ثعبان فيزر',
      icon: 'git-branch',
      secondaryIcon: 'flame-outline',
      colors: ['rgba(34,197,94,0.46)', 'rgba(21,128,61,0.34)'],
      orbGradient: ['#22c55e', '#15803d'],
      accent: '#22c55e',
      description: 'نسخة ثعبان حديثة بتحكم سلس على الجوال.',
      maxPoints: 22,
      online: false,
      onlineCost: 0,
      category: 'حركي',
      badge: 'Turbo',
      trend: '',
    },
    {
      id: 'brickbreaker',
      name: 'بريك جيم',
      icon: 'cube',
      secondaryIcon: 'sparkles-outline',
      colors: ['rgba(236,72,153,0.45)', 'rgba(190,24,93,0.34)'],
      orbGradient: ['#ec4899', '#be185d'],
      accent: '#ec4899',
      description: 'تحطيم الطوب بأسلوب كلاسيكي ممتع وسريع.',
      maxPoints: 23,
      online: false,
      onlineCost: 0,
      category: 'حركي',
      badge: '',
      trend: '',
    },
    {
      id: 'puzzle',
      name: 'بركان فيزر',
      icon: 'flame-outline',
      secondaryIcon: 'construct-outline',
      colors: ['rgba(59,130,246,0.45)', 'rgba(30,64,175,0.34)'],
      orbGradient: ['#3b82f6', '#1e40af'],
      accent: '#3b82f6',
      description: 'مغامرة فيزيائية قصيرة بتجربة لعب خفيفة.',
      maxPoints: 21,
      online: false,
      onlineCost: 0,
      category: 'ألغاز',
      badge: '',
      trend: '',
    },
    {
      id: 'trivia',
      name: 'إكس كويست',
      icon: 'navigate-outline',
      secondaryIcon: 'flash-outline',
      colors: ['rgba(16,185,129,0.46)', 'rgba(4,120,87,0.34)'],
      orbGradient: ['#10b981', '#047857'],
      accent: '#10b981',
      description: 'قتال فضائي مطور مع أسلحة ومراحل متنوعة.',
      maxPoints: 26,
      online: false,
      onlineCost: 0,
      category: 'ثقافة',
      badge: '250+',
      trend: '',
    },
    {
      id: 'mathrace',
      name: 'جالاكتيك ديفندر',
      icon: 'shield-outline',
      secondaryIcon: 'planet-outline',
      colors: ['rgba(139,92,246,0.45)', 'rgba(109,40,217,0.33)'],
      orbGradient: ['#8b5cf6', '#6d28d9'],
      accent: '#8b5cf6',
      description: 'دافع عن المجرة في نمط تصويب سريع.',
      maxPoints: 24,
      online: false,
      onlineCost: 0,
      category: 'رياضيات',
      badge: 'Pro',
      trend: '',
    },
    {
      id: 'wordrace',
      name: 'إنتر جالاكتيك',
      icon: 'planet-outline',
      secondaryIcon: 'rocket-outline',
      colors: ['rgba(6,182,212,0.45)', 'rgba(8,145,178,0.33)'],
      orbGradient: ['#06b6d4', '#0891b2'],
      accent: '#06b6d4',
      description: 'رحلة فضائية متدرجة الصعوبة بأسلوب ممتع.',
      maxPoints: 24,
      online: false,
      onlineCost: 0,
      category: 'لغوي',
      badge: '',
      trend: '',
    },
    {
      id: 'colorswitch',
      name: '8-بت أرمجدون',
      icon: 'game-controller-outline',
      secondaryIcon: 'grid-outline',
      colors: ['rgba(244,63,94,0.45)', 'rgba(225,29,72,0.35)'],
      orbGradient: ['#f43f5e', '#e11d48'],
      accent: '#f43f5e',
      description: 'معارك تكتيكية بطابع 8-بت جذاب.',
      maxPoints: 19,
      online: false,
      onlineCost: 0,
      category: 'رد فعل',
      badge: '',
      trend: '',
    },
    {
      id: 'riddles',
      name: 'أنديدبايتس',
      icon: 'skull-outline',
      secondaryIcon: 'flash-outline',
      colors: ['rgba(234,179,8,0.45)', 'rgba(202,138,4,0.33)'],
      orbGradient: ['#eab308', '#ca8a04'],
      accent: '#eab308',
      description: 'أكشن سريع ضد موجات أعداء داخل اللعبة.',
      maxPoints: 22,
      online: false,
      onlineCost: 0,
      backendGameId: 'riddles',
      category: 'ألغاز',
      badge: 'ذكاء',
      trend: '',
    },
    {
      id: 'millionaire',
      name: 'سورسيررز',
      icon: 'sparkles-outline',
      secondaryIcon: 'wand-outline',
      colors: ['rgba(245,158,11,0.45)', 'rgba(217,119,6,0.33)'],
      orbGradient: ['#f59e0b', '#d97706'],
      accent: '#f59e0b',
      description: 'مواجهات سحرية تكتيكية بطابع تنافسي.',
      maxPoints: 40,
      online: false,
      onlineCost: 0,
      backendGameId: 'millionaire',
      category: 'مميز',
      badge: 'نخبة',
      trend: 'Top',
    },
    {
      id: 'snakefury',
      name: 'Snake Fury',
      icon: 'git-branch',
      secondaryIcon: 'flame',
      colors: ['rgba(34,197,94,0.46)', 'rgba(16,185,129,0.34)'],
      orbGradient: ['#22c55e', '#10b981'],
      accent: '#22c55e',
      description: 'نمط ثعبان أسرع بمضاعف نقاط عالي.',
      maxPoints: 25,
      online: false,
      onlineCost: 0,
      backendGameId: 'snake',
      variant: 'fury',
      category: 'Arcade',
      badge: 'Fast',
      trend: '',
    },
    {
      id: 'memoryflash',
      name: 'Memory Flash',
      icon: 'scan-outline',
      secondaryIcon: 'timer-outline',
      colors: ['rgba(20,184,166,0.46)', 'rgba(6,182,212,0.34)'],
      orbGradient: ['#14b8a6', '#06b6d4'],
      accent: '#14b8a6',
      description: 'ذاكرة سريعة بإيقاع خاطف ومكافآت أعلى.',
      maxPoints: 23,
      online: false,
      onlineCost: 0,
      backendGameId: 'memory',
      variant: 'flash',
      category: 'تركيز',
      badge: '',
      trend: '',
    },
    {
      id: 'brickstormx',
      name: 'ألين أتاكر',
      icon: 'bug-outline',
      secondaryIcon: 'rocket-outline',
      colors: ['rgba(236,72,153,0.45)', 'rgba(124,58,237,0.33)'],
      orbGradient: ['#ec4899', '#8b5cf6'],
      accent: '#ec4899',
      description: 'اقضِ على موجات الفضائيين في جولات سريعة.',
      maxPoints: 27,
      online: false,
      onlineCost: 0,
      backendGameId: 'brickbreaker',
      variant: 'x',
      category: 'حركي',
      badge: 'Hard',
      trend: '',
    },
    {
      id: 'puzzlemaster',
      name: 'فيزر ستارز',
      icon: 'star-outline',
      secondaryIcon: 'alert-circle-outline',
      colors: ['rgba(59,130,246,0.45)', 'rgba(99,102,241,0.33)'],
      orbGradient: ['#3b82f6', '#6366f1'],
      accent: '#3b82f6',
      description: 'اجمع النجوم وتجنب القنابل في تحدٍ ممتع.',
      maxPoints: 24,
      online: false,
      onlineCost: 0,
      backendGameId: 'puzzle',
      variant: 'master',
      category: 'ألغاز',
      badge: 'احتراف',
      trend: '',
    },
    {
      id: 'triviaplus',
      name: '2048 بلس',
      icon: 'calculator-outline',
      secondaryIcon: 'add-circle-outline',
      colors: ['rgba(16,185,129,0.45)', 'rgba(59,130,246,0.32)'],
      orbGradient: ['#10b981', '#3b82f6'],
      accent: '#10b981',
      description: 'نسخة بديلة من 2048 بتجربة لعب سلسة.',
      maxPoints: 28,
      online: false,
      onlineCost: 0,
      backendGameId: 'trivia',
      variant: 'plus',
      category: 'ثقافة',
      badge: 'متقدم',
      trend: '',
    },
    {
      id: 'wordmaster',
      name: 'فلابي بيرد',
      icon: 'airplane-outline',
      secondaryIcon: 'arrow-forward-outline',
      colors: ['rgba(6,182,212,0.45)', 'rgba(14,165,233,0.33)'],
      orbGradient: ['#06b6d4', '#0ea5e9'],
      accent: '#06b6d4',
      description: 'تفادى الأنابيب وحقق أعلى رقم ممكن.',
      maxPoints: 28,
      online: false,
      onlineCost: 0,
      backendGameId: 'wordrace',
      variant: 'master',
      category: 'لغوي',
      badge: '',
      trend: '',
    },
    {
      id: 'reactiontap',
      name: 'باكمان',
      icon: 'game-controller-outline',
      secondaryIcon: 'ellipse-outline',
      colors: ['rgba(239,68,68,0.46)', 'rgba(249,115,22,0.34)'],
      orbGradient: ['#ef4444', '#f97316'],
      accent: '#ef4444',
      description: 'اللعبة الكلاسيكية الشهيرة داخل التطبيق.',
      maxPoints: 24,
      online: false,
      onlineCost: 0,
      backendGameId: 'reactiontap',
      category: 'سرعة',
      badge: 'جديد',
      trend: 'رائج',
    },
    {
      id: 'sequencesprint',
      name: 'سودوكو أونلاين',
      icon: 'keypad-outline',
      secondaryIcon: 'grid-outline',
      colors: ['rgba(16,185,129,0.46)', 'rgba(6,182,212,0.34)'],
      orbGradient: ['#10b981', '#06b6d4'],
      accent: '#10b981',
      description: 'سودوكو تفاعلية بواجهة واضحة وسريعة.',
      maxPoints: 26,
      online: false,
      onlineCost: 0,
      backendGameId: 'sequencesprint',
      category: 'منطق',
      badge: 'مميز',
      trend: '',
    },
    {
      id: 'oddoneout',
      name: 'Odd One Out',
      icon: 'eye',
      secondaryIcon: 'grid-outline',
      colors: ['rgba(59,130,246,0.46)', 'rgba(124,58,237,0.34)'],
      orbGradient: ['#3b82f6', '#8b5cf6'],
      accent: '#3b82f6',
      description: 'اكتشف الرمز المختلف ضمن شبكة بصرية متغيرة.',
      maxPoints: 25,
      online: false,
      onlineCost: 0,
      backendGameId: 'oddoneout',
      category: 'ملاحظة',
      badge: 'Vision',
      trend: '',
    },
  ]), []);

  const visibleGames = useMemo(() => {
    // Professional imported catalog: show exactly 20 curated games.
    return IMPORTED_PRO_GAME_IDS
      .map((id) => games.find((game) => game.id === id))
      .filter(Boolean)
      .map((game) => {
        const override = GAME_CATALOG_OVERRIDES[game.id] || {};
        const externalUrl = EXTERNAL_GAME_URLS[game.id] || null;
        return {
          ...game,
          ...override,
          externalUrl,
          coverImage: GAME_COVER_IMAGES[game.id] || toThumbCover(externalUrl),
        };
      });
  }, [games]);

  const getGameById = useCallback((gameId) => {
    const directVisible = visibleGames.find((g) => g.id === gameId);
    if (directVisible) return directVisible;

    const legacyEntry = games.find((g) => g.id === gameId);
    if (!legacyEntry) return null;

    // Map legacy duplicated variants to their active visible equivalent.
    const mapped = visibleGames.find((g) => (
      (g.backendGameId || g.id) === (legacyEntry.backendGameId || legacyEntry.id)
      && !!g.online === !!legacyEntry.online
    ));
    return mapped || legacyEntry;
  }, [games, visibleGames]);
  const resolveBackendGameId = useCallback((gameId) => {
    const game = getGameById(gameId);
    const backendId = game?.backendGameId || gameId;
    const fallbackMap = {
      aiquest: 'puzzle',
      chess: 'trivia',
      tictactoe: 'brickbreaker',
      tactix: 'puzzle',
      memory: 'tictactoe',
      snake: 'brickbreaker',
      wordrace: 'tictactoe',
      colorswitch: 'riddles',
      millionaire: 'trivia',
      brickstormx: 'trivia',
      puzzlemaster: 'riddles',
      triviaplus: 'chess',
      wordmaster: 'brickbreaker',
      reactiontap: 'puzzle',
      sequencesprint: 'tictactoe',
      oddoneout: 'memory',
    };
    return fallbackMap[backendId] || backendId;
  }, [getGameById]);

  const spendSoloRoundDiamonds = useCallback(async (selectedGame) => {
    if (!selectedGame || !userId) return { ok: false, reason: 'missing_data' };
    const backendGameId = resolveBackendGameId(selectedGame.id);
    if ((balance.diamonds || 0) < SOLO_ROUND_DIAMOND_COST) {
      return { ok: false, reason: 'insufficient_diamonds', required: SOLO_ROUND_DIAMOND_COST };
    }

    try {
      const response = await api.spendDiamonds(
        userId,
        SOLO_ROUND_DIAMOND_COST,
        'solo_round_entry',
        backendGameId,
      );

      if (!response.ok) {
        if ([404, 405].includes(response.status)) {
          // Fallback for older backends: enforce local round cost to keep gameplay rules consistent.
          setBalance((prev) => ({
            ...prev,
            diamonds: Math.max(0, (prev.diamonds || 0) - SOLO_ROUND_DIAMOND_COST),
          }));
          return { ok: true, fallbackLocal: true };
        }
        const error = await response.json().catch(() => ({}));
        const detail = error?.detail || {};
        if (detail?.error === 'insufficient_diamonds') {
          return {
            ok: false,
            reason: 'insufficient_diamonds',
            required: detail?.required || SOLO_ROUND_DIAMOND_COST,
            current: detail?.current ?? balance.diamonds,
          };
        }
        return { ok: false, reason: 'api_error' };
      }

      const data = await response.json().catch(() => ({}));
      if (typeof data?.remaining === 'number') {
        setBalance((prev) => ({ ...prev, diamonds: data.remaining }));
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'network_error' };
    }
  }, [balance.diamonds, resolveBackendGameId, userId]);

  const grantAdEconomyReward = useCallback(async ({ source = 'games_ad', silent = false } = {}) => {
    if (!userId) return { success: false, error: 'missing_user' };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let adCompleted = false;

    try {
      if (__DEV__) {
        await sleep(1200);
        adCompleted = true;
      } else {
        const initialized = await admobService.initialize();
        if (!initialized) {
          if (!silent) Alert.alert('الإعلانات', 'تعذر تهيئة إعلان المكافأة حالياً.');
          return { success: false, error: 'admob_init_failed' };
        }

        const start = Date.now();
        while (!admobService.isReady() && Date.now() - start < 15000) {
          await sleep(500);
        }
        if (!admobService.isReady()) {
          if (!silent) Alert.alert('الإعلانات', 'لا يوجد إعلان متاح الآن، حاول بعد لحظات.');
          return { success: false, error: 'ad_not_ready' };
        }

        const adResult = await admobService.showRewardedAd();
        adCompleted = Boolean(adResult?.success && adResult?.rewarded);
      }
    } catch (e) {
      if (!silent) Alert.alert('الإعلانات', 'حدثت مشكلة أثناء تشغيل الإعلان.');
      return { success: false, error: 'ad_runtime_error' };
    }

    if (!adCompleted) {
      if (!silent) Alert.alert('تنبيه', 'يجب إكمال الإعلان للحصول على المكافأة.');
      return { success: false, error: 'ad_not_completed' };
    }

    try {
      const response = await api.claimAdWatchReward(userId, AD_WATCH_DURATION_SECONDS, source);
      if (response.ok) {
        const data = await response.json();
        if (typeof data?.new_diamonds_balance === 'number') {
          setBalance((prev) => ({ ...prev, diamonds: data.new_diamonds_balance }));
        }
        if (!silent) {
          Alert.alert(
            'مكافأة الإعلان',
            `+${data?.diamonds_earned || 0} ألماسة\n+${data?.saqr_gems_earned || 0} جوهرة صقر`,
          );
        }
        return {
          success: true,
          diamondsEarned: data?.diamonds_earned || 0,
          gemsEarned: data?.saqr_gems_earned || 0,
        };
      }
    } catch (_) {
      // Fallback below
    }

    // Fallback economy grant when ad-watch endpoint is unavailable.
    try {
      const diamondRes = await api.addDiamonds(userId, 1, `${source}_fallback`);
      if (diamondRes.ok) {
        const d = await diamondRes.json().catch(() => ({}));
        if (typeof d?.new_balance === 'number') {
          setBalance((prev) => ({ ...prev, diamonds: d.new_balance }));
        }
      }

      const carryRaw = await AsyncStorage.getItem(adCarryStorageKey(userId));
      const previousCarry = Number.parseInt(carryRaw || '0', 10) || 0;
      const combined = previousCarry + AD_WATCH_DURATION_SECONDS;
      const gemsToGrant = Math.floor(combined / GEMS_SECONDS_PER_UNIT);
      const carrySeconds = combined % GEMS_SECONDS_PER_UNIT;
      await AsyncStorage.setItem(adCarryStorageKey(userId), String(carrySeconds));

      if (gemsToGrant > 0) {
        await api.addSaqrGems(userId, gemsToGrant, `${source}_fallback_minutes`);
      }

      if (!silent) {
        Alert.alert(
          'مكافأة الإعلان',
          `+1 ألماسة${gemsToGrant > 0 ? `\n+${gemsToGrant} جوهرة صقر` : ''}`,
        );
      }
      return { success: true, diamondsEarned: 1, gemsEarned: gemsToGrant };
    } catch (e) {
      if (!silent) Alert.alert('خطأ', 'تعذر منح مكافأة الإعلان، حاول مرة أخرى.');
      return { success: false, error: 'reward_grant_failed' };
    }
  }, [userId]);

  const launchGame = useCallback((gameId) => {
    const game = getGameById(gameId);
    if (!game) return;
    const isDirectExternalMultiplayer = Boolean(game.externalMultiplayerDirect);
    if (game.online && !isDirectExternalMultiplayer) {
      setShowModeSelector(gameId);
    } else {
      setActiveGame(gameId);
      setGameMode(game.online ? 'online' : 'solo');
      if (isDirectExternalMultiplayer) {
        Alert.alert(
          'وضع أونلاين مباشر',
          `هذه اللعبة تعمل أونلاين مباشرة وتدعم ${game.playerRange || '2-4'} لاعبين داخل اللعبة.`,
        );
      }
    }
  }, [getGameById]);

  // Multiplayer event handlers
  useEffect(() => {
    const unsubMatchFound = multiplayerService.on('matchFound', (data) => {
      console.log('Match found!', data);
      setShowWaiting(false);
      setMatchData(data);
      setOnlineOpponent(data.players.find((p) => p !== userId));
      setIsMyTurn(data.your_turn);
      const targetGame = pendingOnlineGameRef.current || data.game_type;
      setActiveGame(targetGame);
      setGameMode('online');
      setShowModeSelector(null);
      pendingOnlineGameRef.current = null;
    });

    const unsubOpponentMove = multiplayerService.on('opponentMove', (data) => {
      console.log('Opponent moved:', data);
      // سيتم معالجتها في كل لعبة
    });

    const unsubPlayerLeft = multiplayerService.on('playerLeft', (data) => {
      Alert.alert('انتهت المباراة', 'غادر الخصم المباراة', [
        { text: 'موافق', onPress: () => {
          handleGameComplete(20, 'win'); // ربح بالانسحاب
          closeGame();
        }}
      ]);
    });

    const unsubGameEnded = multiplayerService.on('gameEnded', (data) => {
      console.log('Game ended:', data);
    });

    const unsubConnectionLost = multiplayerService.on('connectionLost', () => {
      setShowWaiting(false);
      pendingOnlineGameRef.current = null;
      Alert.alert('انقطع الاتصال', 'تعذر إكمال البحث عن منافس. حاول مرة أخرى.');
    });

    return () => {
      unsubMatchFound();
      unsubOpponentMove();
      unsubPlayerLeft();
      unsubGameEnded();
      unsubConnectionLost();
    };
  }, [userId]);

  useEffect(() => {
    fetchLeaderboard();
    fetchBalance();
    fetchGameCosts();
    startAnimations();

    // Connect to multiplayer service
    if (userId) {
      multiplayerService.connect(userId).catch(e => console.log('WS connect error:', e));
    }

    return () => {
      multiplayerService.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    if (balanceRefresh) {
      fetchBalance();
    }
  }, [balanceRefresh]);

  const fetchBalance = async () => {
    if (!userId) {
      if (__DEV__) console.log('GamesScreen: No user ID for balance');
      return;
    }
    try {
      const response = await api.getBalance(userId);
      if (response.ok) {
        const data = await response.json();
        setBalance(prevBalance => ({ ...prevBalance, ...data }));
      } else {
        if (__DEV__) console.log('GamesScreen: Balance API error:', response.status);
      }
    } catch (e) {
      if (__DEV__) console.log('GamesScreen: Balance error:', e.message);
    }
  };

  const fetchGameCosts = async () => {
    try {
      const response = await api.getGameCosts();
      if (response.ok) {
        const data = await response.json();
        setGameCosts(data.online_costs || {});
      }
    } catch (e) {
      console.log('Game costs error:', e);
    }
  };

  const startAnimations = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.getLeaderboard();
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        // Find user rank
        const userRank = data.leaderboard?.findIndex((l) => l.user_id === userId);
        if (userRank >= 0) {
          setUserStats({ rank: userRank + 1, points: data.leaderboard[userRank].saqr_points, games: 0 });
        }
      }
    } catch (e) {
      if (__DEV__) console.log('Leaderboard error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = useCallback(async (gameId) => {
    const game = getGameById(gameId);
    if (!game) return;

    // خصم الجولة لكل لعبة فردية + ألعاب الأونلاين المباشر (2-4 لاعبين).
    if (!game.online || game.externalMultiplayerDirect) {
      const spendResult = await spendSoloRoundDiamonds(game);
      if (!spendResult?.ok) {
        if (spendResult?.reason === 'insufficient_diamonds') {
          setPendingAdGame(gameId);
          setShowAdUnlockModal(true);
        } else {
          Alert.alert('خطأ', 'تعذر خصم تكلفة الجولة الآن. حاول مرة أخرى.');
        }
        return;
      }
    }

    launchGame(gameId);
  }, [getGameById, launchGame, spendSoloRoundDiamonds]);

  useEffect(() => {
    if (!queuedGameId) return;
    const game = getGameById(queuedGameId);
    if (!game) {
      onQueuedGameHandled && onQueuedGameHandled();
      return;
    }
    handleGameSelect(queuedGameId);
    onQueuedGameHandled && onQueuedGameHandled();
  }, [queuedGameId, getGameById, handleGameSelect, onQueuedGameHandled]);

  const startOnlineMatchmaking = useCallback(async (selectedGame) => {
    if (!selectedGame) return false;
    const backendGameId = resolveBackendGameId(selectedGame.id);

    const cost = gameCosts[backendGameId] || selectedGame.onlineCost || 20;
    if (balance.diamonds < cost) {
      Alert.alert(
        'رصيد غير كافٍ',
        `تحتاج ${cost} ألماسة للعب أونلاين. رصيدك الحالي: ${balance.diamonds}`,
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'شاهد إعلان',
            onPress: () => {
              setPendingAdGame(selectedGame.id);
              setShowAdUnlockModal(true);
            },
          },
          { text: 'شراء ألماسات', onPress: () => onOpenDiamondShop && onOpenDiamondShop() }
        ]
      );
      return false;
    }

    try {
      const response = await api.enterOnlineGame(userId, backendGameId, true);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        Alert.alert('خطأ', error.detail || 'حدث خطأ');
        return false;
      }

      setShowWaiting(true);
      pendingOnlineGameRef.current = selectedGame.id;
      fetchBalance();

      if (multiplayerService.isConnected()) {
        multiplayerService.findMatch(backendGameId);
      } else {
        await multiplayerService.connect(userId);
        multiplayerService.findMatch(backendGameId);
      }
      return true;
    } catch (e) {
      if (e?.message === 'MULTIPLAYER_CONNECTION_FAILED') {
        Alert.alert('اتصال الأونلاين', 'تعذر الاتصال بخدمة اللعب المباشر. تحقق من الشبكة ثم أعد المحاولة.');
      } else {
        Alert.alert('خطأ', 'حدث خطأ في الاتصال');
      }
      return false;
    }
  }, [balance.diamonds, gameCosts, onOpenDiamondShop, resolveBackendGameId, userId]);

  const publishGlobalChatInvite = useCallback(async (selectedGame) => {
    const inviteCode = `LIVE-${selectedGame.id}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const inviteMessage = `دعوة أونلاين للعبة ${selectedGame.name} | الكود: ${inviteCode}`;
    try {
      const response = await api.fetch('/api/economy/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          server_id: 'global',
          message: inviteMessage,
          user_name: user?.name || 'لاعب',
          user_avatar: user?.avatar || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const detail = error?.detail || {};
        if (detail?.error === 'insufficient_diamonds') {
          Alert.alert(
            'ألماسات غير كافية',
            `دعوة الشات العام تحتاج ${ONLINE_GLOBAL_CHAT_INVITE_COST} ألماسات.`,
            [
              { text: 'إلغاء', style: 'cancel' },
              {
                text: 'شاهد إعلان',
                onPress: () => {
                  setPendingAdGame(selectedGame.id);
                  setShowAdUnlockModal(true);
                },
              },
              { text: 'شراء ألماسات', onPress: () => onOpenDiamondShop && onOpenDiamondShop() },
            ],
          );
          return false;
        }
        Alert.alert('تعذر إرسال الدعوة', detail?.message || error?.detail || 'حدث خطأ');
        return false;
      }

      const data = await response.json();
      if (typeof data?.new_balance === 'number') {
        setBalance((prev) => ({ ...prev, diamonds: data.new_balance }));
      }
      Alert.alert('تم نشر الدعوة', `تم نشر الدعوة في الشات العام مقابل ${ONLINE_GLOBAL_CHAT_INVITE_COST} ألماسات.`);
      return true;
    } catch (e) {
      Alert.alert('خطأ', 'فشل إرسال الدعوة إلى الشات العام.');
      return false;
    }
  }, [onOpenDiamondShop, user?.avatar, user?.name, userId]);

  const openFriendInviteFlow = useCallback(async (selectedGame) => {
    setFriendInviteGameId(selectedGame?.id || null);
    setShowModeSelector(null);
    setShowFriendInviteModal(true);
    setLoadingFriendsInvite(true);

    try {
      const res = await api.fetch(`/api/social/friends/list/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFriendsForInvite(data.friends || []);
      } else {
        setFriendsForInvite([]);
      }
    } catch (e) {
      setFriendsForInvite([]);
    } finally {
      setLoadingFriendsInvite(false);
    }
  }, [userId]);

  const sendFriendInviteAndStart = useCallback(async (friend) => {
    const selectedGame = getGameById(friendInviteGameId);
    if (!selectedGame || !friend) return;

    setSubmittingInvite(true);
    try {
      const backendGameId = resolveBackendGameId(selectedGame.id);
      const invitationRes = await api.fetch('/api/invitations/create', {
        method: 'POST',
        body: JSON.stringify({
          type: 'game',
          game_id: backendGameId,
          message: `دعوة أونلاين للعبة ${selectedGame.name}`,
        }),
      });

      if (!invitationRes.ok) {
        const error = await invitationRes.json().catch(() => ({}));
        Alert.alert('تعذر إرسال الدعوة', error?.detail || 'حدث خطأ');
        return;
      }

      const invitationData = await invitationRes.json().catch(() => ({}));
      const inviteCode = invitationData?.invitation?.code;
      if (inviteCode) {
        await api.fetch('/api/social/messages/send', {
          method: 'POST',
          body: JSON.stringify({
            from_user_id: userId,
            to_user_id: friend.id,
            from_user_name: user?.name || 'لاعب',
            message: `دعوة مجانية أونلاين للعبة ${selectedGame.name}\nكود الدعوة: ${inviteCode}`,
          }),
        }).catch(() => ({}));
      }

      Alert.alert('تم', 'تم إرسال الدعوة للصديق مجانًا، وسيبدأ البحث عن خصم الآن.');
      setShowFriendInviteModal(false);
      await startOnlineMatchmaking(selectedGame);
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء دعوة الصديق.');
    } finally {
      setSubmittingInvite(false);
    }
  }, [friendInviteGameId, getGameById, resolveBackendGameId, startOnlineMatchmaking, user?.name, userId]);

  const handleModeSelect = async (mode) => {
    const selectedGame = getGameById(showModeSelector);
    if (!selectedGame) return;

    if (mode === 'online') {
      await startOnlineMatchmaking(selectedGame);
      return;
    }

    if (mode === 'online_chat_invite') {
      const sent = await publishGlobalChatInvite(selectedGame);
      if (!sent) return;
      await startOnlineMatchmaking(selectedGame);
      return;
    }

    if (mode === 'online_friend_invite') {
      await openFriendInviteFlow(selectedGame);
      return;
    } else {
      const spendResult = await spendSoloRoundDiamonds(selectedGame);
      if (!spendResult?.ok) {
        if (spendResult?.reason === 'insufficient_diamonds') {
          setPendingAdGame(selectedGame.id);
          setShowModeSelector(null);
          setShowAdUnlockModal(true);
        } else {
          Alert.alert('خطأ', 'تعذر خصم تكلفة الجولة الآن. حاول مرة أخرى.');
        }
        return;
      }
      setActiveGame(selectedGame.id);
      setGameMode(mode);
      setShowModeSelector(null);
    }
  };

  const cancelOnlineSearch = () => {
    multiplayerService.cancelSearch();
    setShowWaiting(false);
    setShowModeSelector(null);
    pendingOnlineGameRef.current = null;
  };

  const handleWatchAdToContinue = async () => {
    if (adUnlockLoading) return;
    const gameToResume = pendingAdGame;
    setShowAdUnlockModal(false);
    setAdUnlockLoading(true);

    try {
      const rewardResult = await grantAdEconomyReward({
        source: 'game_round_unlock_ad',
        silent: false,
      });
      if (!rewardResult?.success || !gameToResume) return;

      setPendingAdGame(null);
      await handleGameSelect(gameToResume);
    } finally {
      setAdUnlockLoading(false);
    }
  };

  const handleFortunesClose = () => {
    setShowSaqrFortunes(false);
    fetchBalance();
  };

  const handleGameComplete = async (points, result) => {
    const currentGame = getGameById(activeGame);
    const isDirectExternalMultiplayer = Boolean(currentGame?.externalMultiplayerDirect);
    const isOnline = gameMode === 'online' && !isDirectExternalMultiplayer;
    const won = result === 'win';
    
    // إرسال نتيجة اللعبة للخصم إذا كانت أونلاين
    if (isOnline) {
      multiplayerService.endGame({ points }, won ? userId : onlineOpponent);
    }
    
    try {
      const backendGameId = resolveBackendGameId(activeGame);
      const opponentCost = gameCosts[backendGameId] || 20;
      const response = await api.recordGameResult(
        userId,
        backendGameId,
        isOnline,
        won,
        isOnline ? opponentCost : 0
      );
      if (response.ok) {
        const data = await response.json();
        if (onPointsEarned && data.points_awarded > 0) {
          onPointsEarned(data.points_awarded);
        }
        
        let message = `حصلت على ${data.points_awarded} نقطة صقر`;
        if (data.diamonds_awarded > 0) {
          message += ` و ${data.diamonds_awarded} ألماسة`;
        }
        if (!data.can_earn_more) {
          message += '\n\nوصلت للحد اليومي (150 نقطة)';
        }
        
        Alert.alert(won ? 'فوز!' : 'نتيجة اللعبة', message);
        fetchBalance();
      }
    } catch (e) {
      console.log('Game complete error:', e);
    }
    
    // تنظيف حالة الأونلاين
    if (gameMode === 'online') {
      setOnlineOpponent(null);
      setIsMyTurn(false);
      setMatchData(null);
      pendingOnlineGameRef.current = null;
    }
    
    fetchLeaderboard();
  };

  const closeGame = () => {
    const currentGame = getGameById(activeGame);
    const isDirectExternalMultiplayer = Boolean(currentGame?.externalMultiplayerDirect);
    // إذا كانت لعبة أونلاين، أعلم الخصم
    if (gameMode === 'online' && !isDirectExternalMultiplayer) {
      multiplayerService.endGame({ forfeit: true }, onlineOpponent);
      setOnlineOpponent(null);
      setIsMyTurn(false);
      setMatchData(null);
      pendingOnlineGameRef.current = null;
    }
    setActiveGame(null);
    setGameMode(null);
  };

  // مشاهدة إعلان
  const handleWatchAd = async () => {
    const rewardResult = await grantAdEconomyReward({
      source: 'games_challenge_ad',
      silent: true,
    });
    return Boolean(rewardResult?.success);
  };

  // استلام مكافأة التحدي
  const handleClaimAdReward = async (amount, type) => {
    if (type === 'diamonds') {
      // إضافة الألماسات للمستخدم
      try {
        const response = await api.addDiamonds(userId, amount, 'ad_challenge_reward');
        if (response.ok) {
          fetchBalance();
        }
      } catch (e) {
        console.log('Error claiming reward:', e);
      }
    }
  };

  // Render active game
  if (activeGame) {
    const importedGame = getGameById(activeGame) || games.find((g) => g.id === activeGame);
    return (
      <ImportedArcadeGame
        game={importedGame}
        mode={gameMode}
        onComplete={handleGameComplete}
        onClose={closeGame}
      />
    );
  }

  // Mode selector modal
  if (showModeSelector) {
    const selectedModeGame = getGameById(showModeSelector);
    return (
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
        {showWaiting ? (
          <WaitingScreen onCancel={cancelOnlineSearch} />
        ) : (
          <ModeSelector
            gameName={selectedModeGame?.name}
            onSelectMode={handleModeSelect}
            onClose={() => setShowModeSelector(null)}
            hasOnline={!!selectedModeGame?.online}
            chatInviteCost={ONLINE_GLOBAL_CHAT_INVITE_COST}
          />
        )}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.mainHeader}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.mainTitle}>الألعاب</Text>
            <Text style={styles.mainSub}>{`${visibleGames.length} تجربة متطورة • فردي + أونلاين`}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Daily Points Progress */}
        <View style={styles.dailyProgressCard}>
          <View style={styles.dailyProgressHeader}>
            <Ionicons name="calendar-outline" size={18} color="#10b981" />
            <Text style={styles.dailyProgressTitle}>النقاط اليومية</Text>
          </View>
          <View style={styles.dailyProgressBar}>
            <View style={[styles.dailyProgressFill, { width: `${Math.min(100, ((150 - balance.daily_points_remaining) / 150) * 100)}%` }]} />
          </View>
          <View style={styles.dailyProgressInfo}>
            <Text style={styles.dailyProgressText}>
              {150 - balance.daily_points_remaining} / 150 نقطة
            </Text>
            <Text style={styles.dailyProgressRemaining}>
              متبقي: {balance.daily_points_remaining}
            </Text>
          </View>
        </View>

        {/* Premium Stats Card */}
        <View style={styles.premiumStatsCard}>
          <LinearGradient
            colors={['rgba(30,30,50,0.95)', 'rgba(20,20,35,0.98)']}
            style={styles.premiumStatsGradient}
          >
            {/* Rank */}
            <View style={styles.premiumStatItem}>
              <View style={styles.premiumStatIconBg}>
                <Ionicons name="trophy" size={20} color="#fbbf24" />
              </View>
              <View style={styles.premiumStatInfo}>
                <Text style={styles.premiumStatValue}>#{userStats.rank || '-'}</Text>
                <Text style={styles.premiumStatLabel}>ترتيبك</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.premiumStatDivider} />

            {/* Saqr Points */}
            <View style={styles.premiumStatItem}>
              <View style={[styles.premiumStatIconBg, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Ionicons name="star" size={20} color="#fbbf24" />
              </View>
              <View style={styles.premiumStatInfo}>
                <Text style={styles.premiumStatValue}>{(balance.saqr_points || 0).toLocaleString()}</Text>
                <Text style={styles.premiumStatLabel}>نقاط صقر</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.premiumStatDivider} />

            {/* Diamonds with Shop Button */}
            <TouchableOpacity 
              style={styles.premiumStatItem}
              onPress={onOpenDiamondShop}
              activeOpacity={0.7}
            >
              <View style={[styles.premiumStatIconBg, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
                <Ionicons name="diamond" size={20} color="#60a5fa" />
                <View style={styles.shopPlusBadge}>
                  <Ionicons name="add" size={8} color="#FFF" />
                </View>
              </View>
              <View style={styles.premiumStatInfo}>
                <Text style={[styles.premiumStatValue, { color: '#60a5fa' }]}>{(balance.diamonds || 0).toLocaleString()}</Text>
                <Text style={styles.premiumStatLabel}>ألماسات</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Daily Progress Bar */}
          <View style={styles.dailyProgressContainer}>
            <View style={styles.dailyProgressInfo}>
              <Ionicons name="flash" size={14} color="#22c55e" />
              <Text style={styles.dailyProgressText}>
                {balance.daily_points_remaining || 0} / 150 نقطة يومية متبقية
              </Text>
            </View>
            <View style={styles.dailyProgressBar}>
              <View 
                style={[
                  styles.dailyProgressFill, 
                  { width: `${((150 - (balance.daily_points_remaining || 0)) / 150) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Exchange Rate Info */}
        <View style={styles.exchangeInfo}>
          <Ionicons name="information-circle" size={16} color="#10b981" />
          <Text style={styles.exchangeText}>500 جوهرة صقر = 1 ريال</Text>
        </View>

        {/* Ad Challenges Button - ثروات صقر */}
        <TouchableOpacity 
          style={styles.adChallengesBtn}
          onPress={() => setShowSaqrFortunes(true)}
          activeOpacity={0.85}
        >
          <LinearGradient 
            colors={['#ec4899', '#9333ea', '#6366f1']} 
            style={styles.adChallengesGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.adChallengeBtnIcon}>
              <Ionicons name="diamond" size={22} color="#FFF" />
            </View>
            <View style={styles.adChallengesBtnInfo}>
              <Text style={styles.adChallengesBtnTitle}>ثروات صقر</Text>
              <Text style={styles.adChallengesBtnSub}>شاهد واربح من 1 إلى 100 ألماسة! عجلة الحظ وصناديق الكنز</Text>
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>جديد</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Games */}
        <View style={styles.gamesHeaderRow}>
          <Text style={styles.sectionTitle}>مكتبة الألعاب</Text>
          <View style={styles.gamesCountPill}>
            <Ionicons name="rocket-outline" size={12} color="#93c5fd" />
            <Text style={styles.gamesCountText}>{visibleGames.length} لعبة</Text>
          </View>
        </View>
        <View style={styles.gamesContainer}>
          {visibleGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onPress={() => handleGameSelect(game.id)}
              pulseAnim={pulseAnim}
              gameCost={gameCosts[game.backendGameId || game.id]}
            />
          ))}
        </View>

        {/* Leaderboard Section - New Professional Design */}
        <View style={styles.leaderboardSection}>
          {/* Leaderboard Banner */}
          <ImageBackground
            source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8b2dfe633f2e1cbd852cd43d21c498c0e3b21e805e853619ee9798c4c28a9cf9.png' }}
            style={styles.leaderboardBanner}
            imageStyle={styles.leaderboardBannerImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              style={styles.leaderboardBannerOverlay}
            >
              <Text style={styles.leaderboardBannerTitle}>التصنيف العالمي</Text>
              <Text style={styles.leaderboardBannerDesc}>تنافس مع أفضل اللاعبين!</Text>
            </LinearGradient>
          </ImageBackground>

          {/* Top 3 Rewards */}
          <View style={styles.topRewardsRow}>
            <View style={[styles.topRewardItem, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
              <Ionicons name="medal" size={28} color="#94a3b8" />
              <Text style={styles.topRewardRank}>2</Text>
              <Text style={styles.topRewardPoints}>1900</Text>
            </View>
            <View style={[styles.topRewardItem, styles.topRewardFirst]}>
              <Ionicons name="trophy" size={32} color="#fbbf24" />
              <Text style={styles.topRewardRank}>1</Text>
              <Text style={styles.topRewardPoints}>3000</Text>
            </View>
            <View style={[styles.topRewardItem, { backgroundColor: 'rgba(205, 127, 50, 0.15)' }]}>
              <Ionicons name="medal" size={28} color="#cd7f32" />
              <Text style={styles.topRewardRank}>3</Text>
              <Text style={styles.topRewardPoints}>1000</Text>
            </View>
          </View>

          {/* Leaderboard List */}
          <View style={styles.leaderboardCardNew}>
            {leaderboard.slice(0, 10).map((player, idx) => (
              <View key={idx} style={[styles.lbRowNew, idx < 3 && styles.lbTopRowNew]}>
                <View style={[styles.lbRankBadge, idx === 0 && styles.lbRankGold, idx === 1 && styles.lbRankSilver, idx === 2 && styles.lbRankBronze]}>
                  {idx < 3 ? (
                    <Ionicons name="trophy" size={16} color="#FFF" />
                  ) : (
                    <Text style={styles.lbRankTextNew}>{idx + 1}</Text>
                  )}
                </View>
                <View style={styles.lbInfoNew}>
                  <Text style={styles.lbNameNew}>{player.name}</Text>
                  <View style={styles.lbGamesRow}>
                    <Ionicons name="game-controller" size={12} color="#64748b" />
                    <Text style={styles.lbGamesNew}>{player.gamesPlayed} لعبة</Text>
                  </View>
                </View>
                <View style={styles.lbPointsNew}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.lbPointsTextNew}>{player.points}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Saqr Fortunes Screen */}
      {showSaqrFortunes && (
        <View style={StyleSheet.absoluteFill}>
          <SaqrFortunesScreen
            user={user}
            onClose={handleFortunesClose}
            onBalanceUpdate={() => {
              fetchBalance();
            }}
          />
        </View>
      )}

      <AdContinueModal
        visible={showAdUnlockModal}
        gameName={getGameById(pendingAdGame)?.name}
        onWatchAd={handleWatchAdToContinue}
        loading={adUnlockLoading}
        onClose={() => {
          if (adUnlockLoading) return;
          setShowAdUnlockModal(false);
          setPendingAdGame(null);
        }}
      />

      <Modal transparent animationType="fade" visible={showFriendInviteModal}>
        <View style={styles.inviteModalOverlay}>
          <View style={styles.inviteModalCard}>
            <LinearGradient colors={['#161625', '#101221']} style={styles.inviteModalGradient}>
              <View style={styles.inviteModalHeader}>
                <Text style={styles.inviteModalTitle}>دعوة صديق أونلاين (مجاني)</Text>
                <TouchableOpacity onPress={() => setShowFriendInviteModal(false)} style={styles.inviteModalClose}>
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {loadingFriendsInvite ? (
                <View style={styles.inviteLoadingWrap}>
                  <ActivityIndicator color="#60a5fa" />
                  <Text style={styles.inviteLoadingText}>جاري تحميل الأصدقاء...</Text>
                </View>
              ) : friendsForInvite.length === 0 ? (
                <View style={styles.inviteLoadingWrap}>
                  <Ionicons name="people-outline" size={36} color="#64748b" />
                  <Text style={styles.inviteLoadingText}>لا يوجد أصدقاء لإرسال دعوة حالياً.</Text>
                </View>
              ) : (
                <ScrollView style={styles.inviteFriendsList} showsVerticalScrollIndicator={false}>
                  {friendsForInvite.map((friend) => (
                    <TouchableOpacity
                      key={friend.id}
                      style={styles.inviteFriendRow}
                      onPress={() => sendFriendInviteAndStart(friend)}
                      disabled={submittingInvite}
                    >
                      <View style={styles.inviteFriendAvatar}>
                        <Text style={styles.inviteFriendAvatarText}>{(friend.name || 'U').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inviteFriendName}>{friend.name}</Text>
                        <Text style={styles.inviteFriendSub}>دعوة مجانية للعب أونلاين</Text>
                      </View>
                      {submittingInvite ? (
                        <ActivityIndicator color="#22c55e" />
                      ) : (
                        <Ionicons name="send" size={18} color="#22c55e" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Ad Challenges Modal (Legacy) */}
      <AdChallengesModal
        visible={showAdChallenges}
        onClose={() => setShowAdChallenges(false)}
        onWatchAd={handleWatchAd}
        onClaimReward={handleClaimAdReward}
        userDiamonds={balance.diamonds || 0}
      />
    </LinearGradient>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  mainHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 50, 
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  mainTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  mainSub: { fontSize: 12, color: '#888', marginTop: 2 },
  
  // Daily Progress Card
  dailyProgressCard: { marginHorizontal: 20, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  dailyProgressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dailyProgressTitle: { fontSize: 14, fontWeight: '600', color: '#10b981' },
  dailyProgressBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  dailyProgressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 4 },
  dailyProgressInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  dailyProgressText: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  dailyProgressRemaining: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  
  userCard: { marginHorizontal: 20, backgroundColor: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  userStatItem: { alignItems: 'center' },
  userStatNum: { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 6 },
  userStatLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  userStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  // Premium Stats Card
  premiumStatsCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  premiumStatsGradient: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12 },
  premiumStatItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  premiumStatIconBg: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  premiumStatInfo: { alignItems: 'flex-start' },
  premiumStatValue: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  premiumStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  premiumStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },
  shopPlusBadge: { position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(20,20,35,1)' },
  dailyProgressContainer: { backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 10, paddingHorizontal: 16 },
  dailyProgressInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dailyProgressText: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  dailyProgressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  dailyProgressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 2 },
  
  // Exchange Info
  exchangeInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },
  exchangeText: { fontSize: 12, color: '#10b981' },
  
  // Ad Challenges Button
  adChallengesBtn: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  adChallengesGradient: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  adChallengeBtnIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  adChallengesBtnInfo: { flex: 1 },
  adChallengesBtnTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  adChallengesBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  newBadge: { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'right', marginBottom: 12 },
  gamesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  gamesCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  gamesCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93c5fd',
  },
  
  gamesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gameCardWrapper: {
    width: (width - 48) / 2,
    marginHorizontal: 4,
    marginBottom: 12,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 228,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  gameCardShell: {
    flex: 1,
    padding: 12,
    gap: 10,
  },
  gameTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameModePills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modePillSolo: {
    borderColor: 'rgba(34,197,94,0.45)',
    backgroundColor: 'rgba(34,197,94,0.14)',
  },
  modePillOnline: {
    borderColor: 'rgba(96,165,250,0.45)',
    backgroundColor: 'rgba(96,165,250,0.14)',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    backgroundColor: 'rgba(251,191,36,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
  },
  gameBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  gameArtContainer: {
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameArtGlow: {
    position: 'absolute',
    width: 94,
    height: 94,
    borderRadius: 18,
    opacity: 0.85,
  },
  gameArtOrb: {
    width: 86,
    height: 86,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  gameArtOrbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameArtImage: {
    width: '100%',
    height: '100%',
  },
  gameSecondaryIcon: {
    position: 'absolute',
    right: 10,
    top: 9,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  gameCardFooter: {
    gap: 6,
  },
  gameNameNew: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  gameDescNew: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 16,
    minHeight: 32,
  },
  gameMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  
  // Old styles kept for compatibility
  gameCardGradient: { padding: 16, alignItems: 'center', minHeight: 180 },
  gameImageContainer: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden', marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  gameImage: { width: '100%', height: '100%', borderRadius: 14 },
  gameIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  gameName: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  gameDesc: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  gameBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 10 },
  gameBadgeText: { fontSize: 9, fontWeight: '700', color: '#000' },
  categoryTag: { backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
  categoryText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  gameFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 3 },
  pointsText: { fontSize: 10, color: '#fbbf24', fontWeight: '600' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(96,165,250,0.2)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, gap: 3 },
  onlineText: { fontSize: 10, color: '#60a5fa', fontWeight: '600' },
  freeBadge: { backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  freeText: { fontSize: 10, color: '#10b981', fontWeight: '600' },
  
  // Diamond with plus badge
  diamondWithPlus: { position: 'relative' },
  plusBadge: { position: 'absolute', top: -4, right: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0a0a0f' },
  
  // Rewards Info
  rewardsInfoCard: { marginHorizontal: 20, backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)' },
  rewardsInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rewardsInfoTitle: { fontSize: 14, fontWeight: '700', color: '#fbbf24' },
  rewardsInfoList: { gap: 8 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  
  leaderboardCard: { marginHorizontal: 20, backgroundColor: 'rgba(30,41,59,0.4)', borderRadius: 16, padding: 12 },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  lbTopRow: { backgroundColor: 'rgba(251,191,36,0.05)', marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 8 },
  lbRank: { width: 36, alignItems: 'center' },
  lbRankText: { fontSize: 13, color: '#888', fontWeight: '600' },
  lbInfo: { flex: 1, marginLeft: 10 },
  lbName: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  lbGames: { fontSize: 10, color: '#888' },
  lbPoints: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lbPointsText: { fontSize: 14, color: '#fbbf24', fontWeight: '700' },
  
  // Mode Selector
  modeContainer: { flex: 1, padding: 20, paddingTop: 60 },
  modeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  modeCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  modeTitle: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  modeSubtitle: { fontSize: 18, color: '#888', textAlign: 'center', marginBottom: 30 },
  modeOptions: { gap: 16 },
  modeOption: { borderRadius: 20, overflow: 'hidden' },
  modeGradient: { padding: 24, alignItems: 'center' },
  modeOptionTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 12 },
  modeOptionDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  // Waiting
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  waitingTitle: { fontSize: 20, fontWeight: '600', color: '#FFF', marginTop: 24 },
  waitingDesc: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  cancelBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  cancelText: { color: '#FFF', fontSize: 16 },

  // Ad Continue Modal
  adModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  adModalGradient: {
    padding: 20,
    alignItems: 'center',
  },
  adModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(236,72,153,0.35)',
  },
  adModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  adModalSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  adModalPrimaryBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  adModalPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  adModalPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  adModalSecondaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  adModalSecondaryText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },

  inviteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inviteModalCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  inviteModalGradient: {
    maxHeight: '78%',
    padding: 16,
  },
  inviteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inviteModalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  inviteModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  inviteLoadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    gap: 8,
  },
  inviteLoadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  inviteFriendsList: {
    marginTop: 4,
  },
  inviteFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  inviteFriendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59,130,246,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteFriendAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  inviteFriendName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  inviteFriendSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },

  importedGameContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingTop: 44,
  },
  importedGameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  importedGameBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importedGameTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  importedGameSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 1,
  },
  importedStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  importedStatText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  importedWebWrap: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  importedWebView: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  importedWebLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.55)',
    gap: 8,
  },
  importedWebLoadingImage: {
    resizeMode: 'cover',
  },
  importedWebLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,10,18,0.62)',
    gap: 8,
  },
  importedWebLoadingText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '600',
  },
  importedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
  },
  importedScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,191,36,0.13)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  importedScoreText: {
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '700',
  },
  importedSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(59,130,246,0.14)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.4)',
  },
  importedSwitchText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '700',
  },
  importedClaimBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    borderRadius: 12,
    paddingVertical: 11,
  },
  importedClaimBtnReady: {
    backgroundColor: '#3b82f6',
  },
  importedClaimText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  
  // Game Common
  gameContainer: { flex: 1, backgroundColor: '#0a0a0f', padding: 20, paddingTop: 50 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  gameTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  scoreText: { fontSize: 18, fontWeight: '700', color: '#fbbf24' },
  
  // Tic Tac Toe
  scoreBoard: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 24 },
  scorePlayer: { alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  activePlayer: { backgroundColor: 'rgba(96,165,250,0.15)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  scoreLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  scoreNum: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  scoreMiddle: { alignItems: 'center' },
  drawsLabel: { fontSize: 12, color: '#666' },
  drawsNum: { fontSize: 20, fontWeight: '600', color: '#888' },
  tttBoard: { flexDirection: 'row', flexWrap: 'wrap', width: width - 60, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 10 },
  tttCell: { width: (width - 80) / 3, height: (width - 80) / 3, justifyContent: 'center', alignItems: 'center' },
  cellBorderR: { borderRightWidth: 2, borderRightColor: 'rgba(255,255,255,0.1)' },
  cellBorderB: { borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.1)' },
  turnIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 8 },
  turnText: { fontSize: 16, color: '#888' },
  resultCard: { alignItems: 'center', marginTop: 30, padding: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  resultText: { fontSize: 28, fontWeight: '700', color: '#FFF', marginTop: 12 },
  playAgainBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  playAgainText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  // Puzzle
  difficultyRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  diffBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  diffBtnActive: { backgroundColor: '#3b82f6' },
  diffText: { color: '#888', fontSize: 14, fontWeight: '600' },
  diffTextActive: { color: '#FFF' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  statText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  puzzleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignSelf: 'center', gap: 4, maxWidth: 500 },
  puzzlePiece: { borderRadius: 10, overflow: 'hidden', position: 'relative' },
  pieceSelected: { borderWidth: 3, borderColor: '#60a5fa', transform: [{ scale: 0.95 }] },
  pieceCorrect: { borderWidth: 2, borderColor: '#10b981' },
  pieceInner: { flex: 1 },
  pieceOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  pieceOverlaySelected: { backgroundColor: 'rgba(59,130,246,0.4)' },
  pieceNum: { fontSize: 22, fontWeight: '700', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  correctBadge: { position: 'absolute', bottom: 4, right: 4 },
  completedCard: { alignItems: 'center', marginTop: 24, padding: 24, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  completedText: { fontSize: 26, fontWeight: '700', color: '#10b981', marginTop: 8 },
  completedSub: { fontSize: 14, color: '#888', marginTop: 4 },
  // Preview Styles
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  previewTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 20 },
  previewImage: { borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  previewEmoji: { fontSize: 60, marginBottom: 10 },
  previewName: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 20 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10, gap: 2 },
  previewPiece: { borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  previewPieceNum: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  previewCountdown: { fontSize: 16, color: '#888', marginTop: 20 },
  // Image Indicator
  imageIndicator: { alignSelf: 'center', marginBottom: 16 },
  imageIndicatorGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  imageIndicatorEmoji: { fontSize: 20 },
  imageIndicatorName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  // Hint Button
  hintBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  hintText: { color: '#fbbf24', fontWeight: '600', fontSize: 14 },
  // Progress Container
  progressContainer: { marginTop: 16, alignItems: 'center' },
  
  // Trivia
  progressRow: { marginBottom: 16 },
  progressText: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  timerCircle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', gap: 6, backgroundColor: 'rgba(96,165,250,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  timerDanger: { backgroundColor: 'rgba(239,68,68,0.1)' },
  timerText: { fontSize: 18, fontWeight: '700', color: '#60a5fa' },
  timerDangerText: { color: '#ef4444' },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 20, marginBottom: 24 },
  questionText: { fontSize: 18, color: '#FFF', textAlign: 'center', lineHeight: 28 },
  optionsContainer: { gap: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  optionCorrect: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981' },
  optionWrong: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionLetterText: { color: '#FFF', fontWeight: '600' },
  optionText: { flex: 1, fontSize: 15, color: '#FFF' },
  resultScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  finalScore: { fontSize: 64, fontWeight: '700', color: '#fbbf24', marginTop: 16 },
  finalLabel: { fontSize: 18, color: '#888' },
  finalSub: { fontSize: 14, color: '#666', marginTop: 8 },
  exitBtn: { marginTop: 30, backgroundColor: '#3b82f6', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  exitText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  // Riddles
  riddleProgress: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  riddleNum: { fontSize: 14, color: '#888' },
  hintsBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  hintsText: { color: '#fbbf24', fontWeight: '600' },
  riddleCard: { backgroundColor: 'rgba(139,92,246,0.1)', padding: 30, borderRadius: 24, alignItems: 'center', marginBottom: 24 },
  riddleText: { fontSize: 20, color: '#FFF', textAlign: 'center', lineHeight: 32 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: 'rgba(251,191,36,0.1)', padding: 12, borderRadius: 12 },
  hintText: { color: '#fbbf24', fontSize: 14 },
  answerSection: { gap: 16 },
  answerInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, fontSize: 16, color: '#FFF', textAlign: 'right', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  riddleBtns: { flexDirection: 'row', gap: 12 },
  hintBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(251,191,36,0.1)', padding: 14, borderRadius: 12 },
  hintBtnText: { color: '#fbbf24', fontWeight: '600' },
  submitBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', padding: 14, borderRadius: 12 },
  submitText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  
  // Options Grid for Riddles/Trivia
  optionsGrid: { gap: 10 },
  optionTextSelected: { color: '#FFF', fontWeight: '700' },
  
  // Leaderboard Section - New Professional Design
  leaderboardSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  leaderboardBanner: {
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  leaderboardBannerImage: {
    borderRadius: 20,
  },
  leaderboardBannerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  leaderboardBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  leaderboardBannerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  topRewardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  topRewardItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    width: 90,
  },
  topRewardFirst: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingVertical: 16,
    transform: [{ scale: 1.1 }],
  },
  topRewardRank: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  topRewardPoints: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 2,
  },
  leaderboardCardNew: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lbRowNew: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginVertical: 3,
  },
  lbTopRowNew: {
    backgroundColor: 'rgba(251,191,36,0.05)',
  },
  lbRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lbRankGold: {
    backgroundColor: '#fbbf24',
  },
  lbRankSilver: {
    backgroundColor: '#94a3b8',
  },
  lbRankBronze: {
    backgroundColor: '#cd7f32',
  },
  lbRankTextNew: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  lbInfoNew: {
    flex: 1,
  },
  lbNameNew: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  lbGamesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lbGamesNew: {
    fontSize: 11,
    color: '#64748b',
  },
  lbPointsNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  lbPointsTextNew: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  
  // Puzzle Game Styles - صور حقيقية
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pieceSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  pieceCorrectBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceNumBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceNumBadgeSelected: {
    backgroundColor: '#3b82f6',
  },
});

export default GamesScreen;
