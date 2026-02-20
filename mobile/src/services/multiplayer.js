// Multiplayer Game Service - خدمة اللعب الجماعي
import { Platform } from 'react-native';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://game-economy-launch.preview.emergentagent.com';

class MultiplayerService {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.currentRoom = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // الاتصال بالخادم
  connect(playerId) {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.playerId = playerId;
      const wsUrl = API_BASE.replace('https://', 'wss://').replace('http://', 'ws://');
      
      this.ws = new WebSocket(`${wsUrl}/ws/game/${playerId}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
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

      this.ws.onerror = (error) => {
        console.log('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.handleDisconnect();
      };
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentRoom = null;
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
