// Web Audio API sound effects & upbeat party background music synthesizer

export type MusicStyleId = 'party' | 'arcade' | 'lofi';

export interface MusicStyleOption {
  id: MusicStyleId;
  name: string;
  description: string;
  bpm: number;
}

export const MUSIC_STYLES: MusicStyleOption[] = [
  {
    id: 'party',
    name: 'Festa Criativa',
    description: 'Melodia alegre e descontraída estilo jogo de festa',
    bpm: 116,
  },
  {
    id: 'arcade',
    name: 'Groove Retrô',
    description: 'Batida animada com sintetizadores estilo arcade',
    bpm: 124,
  },
  {
    id: 'lofi',
    name: 'Estúdio Relax',
    description: 'Acordes suaves para desenhar com calma',
    bpm: 92,
  },
];

// Helper to convert MIDI note number to frequency in Hz
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class SoundManager {
  private ctx: AudioContext | null = null;
  public sfxEnabled = true;
  public musicEnabled = true;
  public musicStyle: MusicStyleId = 'party';
  public volume = 0.5;
  private stepTimer: number | null = null;
  private currentStep = 0;
  private isPlayingLoop = false;
  private unlockBound = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    try {
      const savedSfx = localStorage.getItem('sp_sfx') ?? sessionStorage.getItem('tt_sfx');
      const savedMusic = localStorage.getItem('sp_music') ?? sessionStorage.getItem('tt_music');
      const savedStyle = localStorage.getItem('sp_music_style') as MusicStyleId | null;
      const savedVol = localStorage.getItem('sp_volume');

      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
      if (savedMusic !== null) {
        this.musicEnabled = savedMusic === 'true';
      } else {
        this.musicEnabled = true;
      }
      if (savedStyle && ['party', 'arcade', 'lofi'].includes(savedStyle)) {
        this.musicStyle = savedStyle;
      }
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!Number.isNaN(parsed)) this.volume = Math.max(0, Math.min(1, parsed));
      }
    } catch {
      // Ignore storage errors
    }

    this.setupAutoUnlock();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private setupAutoUnlock() {
    if (typeof window === 'undefined' || this.unlockBound) return;
    this.unlockBound = true;

    const unlock = () => {
      if (this.musicEnabled && !this.isPlayingLoop) {
        this.startAmbient();
      } else if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      localStorage.setItem('sp_sfx', String(val));
      sessionStorage.setItem('tt_sfx', String(val));
    } catch {}
    this.notify();
  }

  public setMusicEnabled(val: boolean) {
    this.musicEnabled = val;
    try {
      localStorage.setItem('sp_music', String(val));
      sessionStorage.setItem('tt_music', String(val));
    } catch {}
    if (val) {
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
    this.notify();
  }

  public toggleMusic(): boolean {
    const next = !this.musicEnabled;
    this.setMusicEnabled(next);
    return next;
  }

  public setMusicStyle(style: MusicStyleId) {
    this.musicStyle = style;
    try {
      localStorage.setItem('sp_music_style', style);
    } catch {}
    if (this.musicEnabled) {
      this.currentStep = 0;
      this.startAmbient();
    }
    this.notify();
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('sp_volume', String(this.volume));
    } catch {}
    this.notify();
  }

  private playTone(
    freq: number,
    durationMs: number,
    type: OscillatorType = 'sine',
    delayMs = 0,
    gainScale = 0.15
  ) {
    if (!this.sfxEnabled || this.volume <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    const peakGain = Math.max(0.0005, this.volume * gainScale);
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

  // Synthesize a warm filtered musical note for the background track
  private playMusicNote(
    ctx: AudioContext,
    midi: number,
    durationSec: number,
    type: OscillatorType,
    gainScale: number,
    cutoffHz = 1800,
    detuneCents = 0
  ) {
    if (!this.musicEnabled || this.volume <= 0.001) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(midiToFreq(midi), now);
    if (detuneCents !== 0) {
      osc.detune.setValueAtTime(detuneCents, now);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz, now);
    filter.Q.setValueAtTime(1.2, now);

    const peak = Math.max(0.0005, this.volume * gainScale);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.03);
  }

  // Soft percussive woodblock / marimba click for groove
  private playSoftPerc(ctx: AudioContext, pitchHz: number, durationSec: number, gainScale: number) {
    if (!this.musicEnabled || this.volume <= 0.001) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitchHz, now);
    osc.frequency.exponentialRampToValueAtTime(pitchHz * 0.45, now + durationSec);

    const peak = Math.max(0.0005, this.volume * gainScale);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.015);
  }

  private tickMusicStep() {
    if (!this.musicEnabled) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    const step = this.currentStep % 32; // 32 eighth-note steps (4 bars)
    this.currentStep = (this.currentStep + 1) % 32;

    if (this.musicStyle === 'party') {
      // "Festa Criativa" — Cheerful C Major -> A minor -> F Major -> G Major bouncy party tune
      // Bassline (plays on beats)
      const bassPattern: (number | null)[] = [
        // Bar 1: C
        48, null, 55, null, 48, null, 55, 52,
        // Bar 2: Am
        45, null, 52, null, 45, null, 52, 48,
        // Bar 3: F
        41, null, 48, null, 41, null, 48, 45,
        // Bar 4: G
        43, null, 50, null, 43, null, 47, 50,
      ];

      // Playful marimba/synth lead melody
      const melodyPattern: (number | null)[] = [
        // Bar 1 (C6, G5, E5, G5, A5, G5, E5)
        72, null, 67, 64, null, 67, 69, 67,
        // Bar 2 (E5, C5, D5, E5, A5, G5)
        64, null, 60, 62, 64, null, 69, 67,
        // Bar 3 (F5, A5, C6, A5, G5, E5, C5)
        65, null, 69, 72, null, 69, 67, 64,
        // Bar 4 (D5, G5, B5, D6, C6, B5, G5)
        62, 67, null, 71, 74, null, 71, 67,
      ];

      // Warm chord stabs on off-beats (ukulele/rhodes vibe)
      const chordVoicings: Record<number, number[]> = {
        0: [60, 64, 67],   // C
        2: [60, 64, 67],
        6: [60, 64, 67],
        8: [57, 60, 64],   // Am
        10: [57, 60, 64],
        14: [57, 60, 64],
        16: [53, 57, 60],  // F
        18: [53, 57, 60],
        22: [53, 57, 60],
        24: [55, 59, 62],  // G
        26: [55, 59, 62],
        30: [55, 59, 62],
      };

      const bassNote = bassPattern[step];
      if (bassNote !== null) {
        this.playMusicNote(ctx, bassNote, 0.28, 'triangle', 0.08, 650);
      }

      const melNote = melodyPattern[step];
      if (melNote !== null) {
        this.playMusicNote(ctx, melNote, 0.24, 'sine', 0.075, 2200, 4);
        this.playMusicNote(ctx, melNote, 0.18, 'triangle', 0.04, 1600, -4);
      }

      const chord = chordVoicings[step];
      if (chord) {
        chord.forEach((n) => {
          this.playMusicNote(ctx, n, 0.22, 'sine', 0.028, 1200);
        });
      }

      // Light woodblock rhythm
      if (step % 4 === 0) {
        this.playSoftPerc(ctx, 130, 0.08, 0.05);
      } else if (step % 4 === 2) {
        this.playSoftPerc(ctx, 680, 0.04, 0.025);
      }
    } else if (this.musicStyle === 'arcade') {
      // "Groove Retrô" — Upbeat synth-pop / chiptune groove
      const bassPattern: (number | null)[] = [
        45, 45, 57, 45, 45, 57, 52, 55,
        41, 41, 53, 41, 41, 53, 48, 52,
        48, 48, 60, 48, 48, 60, 55, 57,
        43, 43, 55, 43, 43, 55, 50, 52,
      ];

      const arpPattern: (number | null)[] = [
        69, 72, 76, 81, 76, 72, 69, 72,
        65, 69, 72, 77, 72, 69, 65, 69,
        67, 72, 76, 79, 76, 72, 67, 72,
        67, 71, 74, 79, 74, 71, 67, 71,
      ];

      const bassNote = bassPattern[step];
      if (bassNote !== null) {
        this.playMusicNote(ctx, bassNote, 0.18, 'sawtooth', 0.05, 520);
      }

      const arpNote = arpPattern[step];
      if (arpNote !== null) {
        this.playMusicNote(ctx, arpNote, 0.16, 'square', 0.032, 1500);
      }

      if (step % 2 === 0) {
        this.playSoftPerc(ctx, step % 4 === 0 ? 140 : 540, 0.06, 0.04);
      }
    } else {
      // "Estúdio Relax" (Lo-Fi chill chords & gentle Rhodes bell notes)
      const chordSteps: Record<number, number[]> = {
        0: [48, 60, 64, 67, 71],   // Cmaj7
        8: [45, 57, 60, 64, 67],   // Am7
        16: [41, 53, 57, 60, 64],  // Fmaj7
        24: [43, 55, 59, 62, 65],  // G7
      };

      const lofiMelody: (number | null)[] = [
        71, null, null, 72, null, 67, null, null,
        69, null, null, 67, null, 64, null, null,
        65, null, 69, null, 72, null, 69, null,
        67, null, null, 64, 62, null, null, null,
      ];

      const chord = chordSteps[step];
      if (chord) {
        chord.forEach((n, idx) => {
          this.playMusicNote(
            ctx,
            n,
            1.4,
            idx === 0 ? 'triangle' : 'sine',
            idx === 0 ? 0.065 : 0.025,
            950
          );
        });
      }

      const mel = lofiMelody[step];
      if (mel !== null) {
        this.playMusicNote(ctx, mel, 0.45, 'sine', 0.055, 1400);
      }

      if (step % 4 === 0) {
        this.playSoftPerc(ctx, 110, 0.09, 0.035);
      } else if (step % 4 === 2) {
        this.playSoftPerc(ctx, 420, 0.05, 0.02);
      }
    }
  }

  public startAmbient() {
    this.stopAmbient();
    if (!this.musicEnabled) return;

    const ctx = this.getContext();
    if (!ctx) return;

    const styleObj = MUSIC_STYLES.find((s) => s.id === this.musicStyle) || MUSIC_STYLES[0];
    // Eighth-note step interval in ms: (60 / bpm / 2) * 1000
    const stepMs = Math.round((60 / styleObj.bpm / 2) * 1000);

    this.isPlayingLoop = true;
    this.tickMusicStep();
    this.stepTimer = window.setInterval(() => {
      this.tickMusicStep();
    }, stepMs);
  }

  public stopAmbient() {
    this.isPlayingLoop = false;
    if (this.stepTimer !== null) {
      clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
  }
}

export const soundManager = new SoundManager();
