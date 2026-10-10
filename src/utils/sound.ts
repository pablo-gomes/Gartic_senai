// Web Audio API sound effects & ambient loop with separate controls (Section 12.2 & 16.5)

class SoundManager {
  private ctx: AudioContext | null = null;
  public sfxEnabled = true;
  public musicEnabled = false;
  public volume = 0.5;
  private ambientInterval: number | null = null;

  constructor() {
    try {
      const savedSfx = sessionStorage.getItem('tt_sfx');
      const savedMusic = sessionStorage.getItem('tt_music');
      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
      if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
    } catch {
      // Ignore storage errors
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSfxEnabled(val: boolean) {
    this.sfxEnabled = val;
    try {
      sessionStorage.setItem('tt_sfx', String(val));
    } catch {}
  }

  public setMusicEnabled(val: boolean) {
    this.musicEnabled = val;
    try {
      sessionStorage.setItem('tt_music', String(val));
    } catch {}
    if (val) {
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
  }

  private playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', delayMs = 0, gainScale = 0.15) {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    const peakGain = Math.max(0.001, this.volume * gainScale);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + durationMs / 1000 + 0.02);
  }

  public playRoundStart() {
    this.playTone(440, 140, 'triangle', 0, 0.14);
    this.playTone(554.37, 140, 'triangle', 110, 0.14);
    this.playTone(659.25, 220, 'triangle', 220, 0.16);
  }

  public playCorrectGuess() {
    this.playTone(523.25, 110, 'sine', 0, 0.18);
    this.playTone(659.25, 110, 'sine', 90, 0.18);
    this.playTone(783.99, 140, 'sine', 180, 0.18);
    this.playTone(1046.5, 260, 'sine', 280, 0.2);
  }

  public playHintRevealed() {
    this.playTone(587.33, 130, 'sine', 0, 0.14);
    this.playTone(880, 200, 'sine', 110, 0.14);
  }

  public playLowTimeTick() {
    this.playTone(330, 80, 'sine', 0, 0.1);
  }

  public playRoundEnd() {
    this.playTone(493.88, 150, 'triangle', 0, 0.14);
    this.playTone(440, 150, 'triangle', 130, 0.14);
    this.playTone(392, 240, 'triangle', 260, 0.15);
  }

  private startAmbient() {
    this.stopAmbient();
    if (!this.musicEnabled) return;
    const notes = [261.63, 329.63, 392.0, 493.88];
    let idx = 0;
    this.ambientInterval = window.setInterval(() => {
      if (!this.musicEnabled) return;
      const ctx = this.getContext();
      if (!ctx) return;
      const freq = notes[idx % notes.length];
      idx++;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.025 * this.volume, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.9);
    }, 2000);
  }

  private stopAmbient() {
    if (this.ambientInterval !== null) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

export const soundManager = new SoundManager();
