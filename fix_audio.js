const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const brokenSnippet = `        const freq = notes[this.bgNoteIndex % notes.length];
        this.bgNoteIndex++;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(gain);
        gain.connect(this.bgGain);
        
        osc.start(now);
        osc.stop(now + 0.25);

        osc.onended = () => {
          if (this.isPlayingBg) this.playNextNote();
        };
      }
    };`;

const validAudioObject = `    const audio = {
      ctx: null,
      bgGain: null,
      sfxGain: null,
      isPlayingBg: false,
      bgNoteIndex: 0,
      muted: false,
      coinSound: null,
      init: function() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            this.ctx = new AudioContext();
            this.bgGain = this.ctx.createGain();
            this.bgGain.connect(this.ctx.destination);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.connect(this.ctx.destination);
            
            this.coinSound = new Audio(ASSETS.audio_coin);
          }
        }
      },
      toggleMute: function() {
        this.muted = !this.muted;
        if (this.bgGain) this.bgGain.gain.value = this.muted ? 0 : 1;
        if (this.sfxGain) this.sfxGain.gain.value = this.muted ? 0 : 1;
        if (this.coinSound) this.coinSound.muted = this.muted;
        return this.muted;
      },
      playSine: function(freq, type, duration) {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      },
      playJump: function() { this.playSine(400, 'sine', 0.2); },
      playSpring: function() { this.playSine(600, 'triangle', 0.3); },
      playHelicopter: function() { this.playSine(200, 'sawtooth', 0.5); },
      playClick: function() { this.playSine(800, 'square', 0.1); },
      playGameOver: function() { this.playSine(150, 'sawtooth', 1.0); },
      playCoin: function() {
        if (this.coinSound && !this.muted) {
          this.coinSound.currentTime = 0;
          this.coinSound.play().catch(()=>{});
        }
      },
      startBgMusic: function() {
        if (this.muted) return;
        this.isPlayingBg = true;
        this.playNextNote();
      },
      stopBgMusic: function() {
        this.isPlayingBg = false;
      },
      playNextNote: function() {
        if (!this.ctx || !this.isPlayingBg || this.muted) return;
        const notes = [261.63, 329.63, 392.00, 523.25];
        const freq = notes[this.bgNoteIndex % notes.length];
        this.bgNoteIndex++;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(gain);
        gain.connect(this.bgGain);
        
        osc.start(now);
        osc.stop(now + 0.25);

        osc.onended = () => {
          if (this.isPlayingBg) this.playNextNote();
        };
      }
    };`;

if (html.includes(brokenSnippet)) {
  html = html.replace(brokenSnippet, validAudioObject);
  fs.writeFileSync('index.html', html);
  console.log('Fixed audio object');
} else {
  console.log('Broken snippet not found. Searching for partial match...');
  // Find by partial
  let idx = html.indexOf('const freq = notes[this.bgNoteIndex');
  if (idx !== -1) {
    let endIdx = html.indexOf('};', idx) + 2;
    html = html.substring(0, idx) + validAudioObject + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('Fixed via partial match');
  } else {
    console.log('Could not find it at all.');
  }
}
