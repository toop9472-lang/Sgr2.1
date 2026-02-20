// Sound Effects Manager for Games
class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.5;
    this.audioContext = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  // Generate sounds using Web Audio API
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume * this.volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.log('Sound error:', e);
    }
  }

  // Game specific sounds
  click() {
    this.playTone(800, 0.1, 'sine', 0.2);
  }

  success() {
    this.playTone(523, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.3), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.3), 200);
  }

  error() {
    this.playTone(200, 0.2, 'sawtooth', 0.2);
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.4), i * 150);
    });
  }

  lose() {
    this.playTone(400, 0.3, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(300, 0.3, 'sawtooth', 0.3), 200);
    setTimeout(() => this.playTone(200, 0.5, 'sawtooth', 0.3), 400);
  }

  move() {
    this.playTone(440, 0.05, 'sine', 0.15);
  }

  brickHit() {
    this.playTone(600 + Math.random() * 200, 0.1, 'square', 0.2);
  }

  bonusBrick() {
    this.playTone(880, 0.1, 'sine', 0.4);
    setTimeout(() => this.playTone(1100, 0.1, 'sine', 0.4), 80);
    setTimeout(() => this.playTone(1320, 0.15, 'sine', 0.4), 160);
  }

  paddleHit() {
    this.playTone(300, 0.08, 'triangle', 0.25);
  }

  chessPiece() {
    this.playTone(220, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(330, 0.1, 'sine', 0.2), 50);
  }

  chessCapture() {
    this.playTone(150, 0.15, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(200, 0.1, 'sine', 0.3), 100);
  }

  puzzleSlide() {
    this.playTone(500, 0.08, 'sine', 0.2);
  }

  puzzleComplete() {
    const melody = [523, 587, 659, 784, 880, 1047];
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.3), i * 100);
    });
  }

  triviaCorrect() {
    this.playTone(700, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(900, 0.15, 'sine', 0.3), 100);
  }

  triviaWrong() {
    this.playTone(250, 0.2, 'square', 0.2);
  }

  timerTick() {
    this.playTone(1000, 0.03, 'sine', 0.1);
  }

  timerWarning() {
    this.playTone(800, 0.1, 'square', 0.3);
  }

  levelUp() {
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.4), i * 120);
    });
  }

  message() {
    this.playTone(600, 0.08, 'sine', 0.2);
    setTimeout(() => this.playTone(800, 0.08, 'sine', 0.2), 80);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.click();
    }
    return this.enabled;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
}

// Create singleton instance
const soundManager = new SoundManager();

export default soundManager;
