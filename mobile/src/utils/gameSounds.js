// Game Sound Manager - Professional Sound Effects for Games
import { Audio } from 'expo-av';
import { Vibration, Platform } from 'react-native';

class GameSoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.vibrationEnabled = true;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.initialized = true;
    } catch (error) {
      console.log('Sound init error:', error);
    }
  }

  // تشغيل اهتزاز
  vibrate(pattern = 'light') {
    if (!this.vibrationEnabled) return;
    
    try {
      switch (pattern) {
        case 'light':
          Vibration.vibrate(50);
          break;
        case 'medium':
          Vibration.vibrate(100);
          break;
        case 'heavy':
          Vibration.vibrate(200);
          break;
        case 'success':
          Vibration.vibrate([0, 50, 50, 50]);
          break;
        case 'error':
          Vibration.vibrate([0, 100, 50, 100]);
          break;
        case 'win':
          Vibration.vibrate([0, 100, 100, 100, 100, 200]);
          break;
        default:
          Vibration.vibrate(50);
      }
    } catch (error) {
      console.log('Vibration error:', error);
    }
  }

  // تشغيل صوت بسيط باستخدام الاهتزاز كبديل
  async playSound(type) {
    if (!this.enabled) return;
    
    // استخدام الاهتزاز كتعليق صوتي
    switch (type) {
      case 'move':
      case 'tap':
        this.vibrate('light');
        break;
      case 'capture':
      case 'hit':
        this.vibrate('medium');
        break;
      case 'check':
      case 'warning':
        this.vibrate('heavy');
        break;
      case 'win':
      case 'victory':
        this.vibrate('win');
        break;
      case 'lose':
      case 'gameover':
        this.vibrate('error');
        break;
      case 'correct':
      case 'success':
        this.vibrate('success');
        break;
      case 'wrong':
      case 'error':
        this.vibrate('error');
        break;
      case 'levelup':
      case 'bonus':
        this.vibrate('win');
        break;
      case 'countdown':
      case 'tick':
        this.vibrate('light');
        break;
      default:
        this.vibrate('light');
    }
  }

  // أصوات الشطرنج
  chessMove() { this.playSound('move'); }
  chessCapture() { this.playSound('capture'); }
  chessCheck() { this.playSound('check'); }
  chessCheckmate() { this.playSound('win'); }
  chessCastle() { this.playSound('move'); this.vibrate('medium'); }

  // أصوات عامة
  buttonTap() { this.playSound('tap'); }
  correct() { this.playSound('correct'); }
  wrong() { this.playSound('wrong'); }
  win() { this.playSound('win'); }
  lose() { this.playSound('lose'); }
  levelUp() { this.playSound('levelup'); }
  countdown() { this.playSound('countdown'); }
  bonus() { this.playSound('bonus'); }
  
  // أصوات الألعاب المحددة
  snakeEat() { this.playSound('correct'); }
  snakeDie() { this.playSound('lose'); }
  memoryMatch() { this.playSound('correct'); }
  memoryMismatch() { this.playSound('wrong'); }
  puzzlePlace() { this.playSound('move'); }
  puzzleComplete() { this.playSound('win'); }
  
  // تبديل الصوت
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  toggleVibration() {
    this.vibrationEnabled = !this.vibrationEnabled;
    return this.vibrationEnabled;
  }

  setEnabled(value) {
    this.enabled = value;
  }

  setVibrationEnabled(value) {
    this.vibrationEnabled = value;
  }
}

const gameSounds = new GameSoundManager();
export default gameSounds;
