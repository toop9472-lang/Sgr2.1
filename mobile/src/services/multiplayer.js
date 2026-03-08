// Multiplayer Game Service - خدمة اللعب الجماعي
import api from './api';

const toWsBase = (url) => url.replace('https://', 'wss://').replace('http://', 'ws://').replace(/\/+$/, '');
const getSocketBaseCandidates = () => {
  const candidates = [
    api.baseUrl,
    api.BASE_URL,
    'https://app-store-revival.preview.emergentagent.com/backend',
    'https://saqrpointscom.store',
  ]
    .filter(Boolean)
    .map((u) => u.replace(/\/+$/, ''));

  return Array.from(new Set(candidates));
};

class MultiplayerService {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.currentRoom = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.manuallyDisconnected = false;
  }

  // الاتصال بالخادم
  connect(playerId) {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.playerId = playerId;
      this.manuallyDisconnected = false;

      const socketCandidates = getSocketBaseCandidates().flatMap((baseUrl) => {
        const wsBase = toWsBase(baseUrl);
        return [
          `${wsBase}/ws/game/${playerId}`,
          `${wsBase}/api/ws/game/${playerId}`,
        ];
      });
      let candidateIndex = 0;
      let settled = false;

      const openNextCandidate = () => {
        if (candidateIndex >= socketCandidates.length) {
          if (!settled) {
            settled = true;
            reject(new Error('MULTIPLAYER_CONNECTION_FAILED'));
          }
          return;
        }

        const socketUrl = socketCandidates[candidateIndex];
        candidateIndex += 1;
        this.ws = new WebSocket(socketUrl);

        this.ws.onopen = () => {
          settled = true;
          console.log('WebSocket connected:', socketUrl);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.log('WS message parse error:', e);
          }
        };

        this.ws.onerror = () => {
          if (!settled) {
            this.ws = null;
            openNextCandidate();
          }
        };

        this.ws.onclose = () => {
          if (!settled) {
            this.ws = null;
            openNextCandidate();
            return;
          }
          console.log('WebSocket closed');
          this.handleDisconnect();
        };
      };

      openNextCandidate();
    });
  }

  // معالجة الرسائل
  handleMessage(data) {
    const { type } = data;
    
    switch (type) {
      case 'match_found':
        this.currentRoom = data.room_id;
        this.emit('matchFound', data);
        break;
      
      case 'waiting':
        this.emit('waiting', data);
        break;
      
      case 'opponent_move':
        this.emit('opponentMove', data);
        break;
      
      case 'game_ended':
        this.emit('gameEnded', data);
        break;
      
      case 'player_left':
        this.emit('playerLeft', data);
        break;
      
      case 'chat_message':
        this.emit('chatMessage', data);
        break;
      
      case 'rematch_request':
        this.emit('rematchRequest', data);
        break;
      
      case 'rematch_accepted':
        this.emit('rematchAccepted', data);
        break;
      
      case 'search_cancelled':
        this.emit('searchCancelled', data);
        break;
      
      default:
        console.log('Unknown message type:', type);
    }
  }

  // إعادة الاتصال
  handleDisconnect() {
    if (this.manuallyDisconnected) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      
      setTimeout(() => {
        if (this.playerId) {
          this.connect(this.playerId).catch(() => {});
        }
      }, 2000 * this.reconnectAttempts);
    } else {
      this.emit('connectionLost', {});
    }
  }

  // البحث عن مباراة
  findMatch(gameType) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'find_match',
        game_type: gameType
      }));
    }
  }

  // إلغاء البحث
  cancelSearch() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'cancel_search'
      }));
    }
  }

  // إرسال حركة
  sendMove(move) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'game_move',
        move: move
      }));
    }
  }

  // إنهاء اللعبة
  endGame(result, winner) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'game_end',
        result: result,
        winner: winner
      }));
    }
  }

  // طلب إعادة المباراة
  requestRematch() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'rematch'
      }));
    }
  }

  // قبول إعادة المباراة
  acceptRematch() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'accept_rematch'
      }));
    }
  }

  // إرسال رسالة دردشة
  sendChat(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'chat',
        message: message
      }));
    }
  }

  // تسجيل مستمع
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // إطلاق حدث
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  // إزالة كل المستمعين
  removeAllListeners() {
    this.listeners.clear();
  }

  // قطع الاتصال
  disconnect() {
    this.manuallyDisconnected = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentRoom = null;
    this.playerId = null;
    this.removeAllListeners();
  }

  // حالة الاتصال
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const multiplayerService = new MultiplayerService();
export default multiplayerService;
