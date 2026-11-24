export type MusicTrack =
  | 'none'
  | 'menu'
  | 'seasonWinter'
  | 'seasonLove'
  | 'seasonSpring'
  | 'seasonSummer'
  | 'seasonNeon'
  | 'seasonAutumn'
  | 'seasonHalloween'
  | 'seasonHoliday'
  | 'world1'
  | 'world2'
  | 'world3'
  | 'world4'
  | 'world5'
  | 'boss'
  | 'victory'
  | 'gameOver'
  | 'ch2Arena'
  | 'ch2Boss'
  | 'ch2Victory';

interface TrackPattern {
  bpm: number;
  loop: boolean;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  lead: number[]; // MIDI note numbers, 0 = rest
  bass: number[]; // MIDI note numbers, 0 = rest
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const TRACKS: Record<Exclude<MusicTrack, 'none'>, TrackPattern> = {
  menu: {
    bpm: 112,
    loop: true,
    leadWave: 'square',
    bassWave: 'triangle',
    lead: [64, 0, 67, 71, 72, 0, 71, 67, 69, 0, 72, 76, 74, 0, 71, 67],
    bass: [45, 45, 52, 45, 48, 48, 55, 48, 41, 41, 48, 41, 43, 43, 50, 43],
  },
  seasonWinter: {
    bpm: 108,
    loop: true,
    leadWave: 'sine',
    bassWave: 'triangle',
    lead: [76, 0, 79, 83, 84, 0, 79, 76, 74, 0, 76, 79, 72, 0, 71, 0],
    bass: [48, 55, 60, 55, 45, 52, 57, 52, 41, 48, 53, 48, 43, 50, 55, 50],
  },
  seasonLove: {
    bpm: 104,
    loop: true,
    leadWave: 'triangle',
    bassWave: 'sine',
    lead: [72, 76, 79, 76, 81, 79, 76, 0, 74, 77, 81, 77, 79, 76, 72, 0],
    bass: [48, 52, 55, 52, 45, 48, 52, 48, 41, 45, 48, 45, 43, 47, 50, 47],
  },
  seasonSpring: {
    bpm: 120,
    loop: true,
    leadWave: 'triangle',
    bassWave: 'triangle',
    lead: [72, 74, 76, 79, 81, 0, 79, 76, 74, 76, 79, 74, 72, 0, 67, 0],
    bass: [48, 55, 48, 55, 41, 48, 41, 48, 43, 50, 43, 50, 48, 55, 48, 55],
  },
  seasonSummer: {
    bpm: 126,
    loop: true,
    leadWave: 'square',
    bassWave: 'triangle',
    lead: [74, 0, 78, 81, 79, 78, 74, 0, 76, 0, 79, 83, 81, 79, 78, 0],
    bass: [50, 50, 57, 50, 43, 43, 50, 43, 45, 45, 52, 45, 50, 50, 57, 50],
  },
  seasonNeon: {
    bpm: 132,
    loop: true,
    leadWave: 'sawtooth',
    bassWave: 'square',
    lead: [64, 67, 71, 76, 71, 67, 64, 0, 62, 66, 69, 74, 69, 66, 62, 0],
    bass: [40, 40, 52, 40, 40, 40, 52, 40, 38, 38, 50, 38, 43, 43, 55, 43],
  },
  seasonAutumn: {
    bpm: 106,
    loop: true,
    leadWave: 'triangle',
    bassWave: 'sine',
    lead: [69, 0, 72, 76, 74, 72, 69, 0, 67, 0, 71, 74, 72, 71, 69, 0],
    bass: [45, 52, 57, 52, 41, 48, 53, 48, 43, 50, 55, 50, 45, 52, 57, 52],
  },
  seasonHalloween: {
    bpm: 114,
    loop: true,
    leadWave: 'sawtooth',
    bassWave: 'triangle',
    lead: [64, 65, 68, 64, 71, 68, 65, 64, 62, 63, 66, 62, 69, 66, 63, 62],
    bass: [40, 0, 40, 46, 40, 0, 39, 0, 38, 0, 38, 44, 38, 0, 36, 38],
  },
  seasonHoliday: {
    bpm: 124,
    loop: true,
    leadWave: 'sine',
    bassWave: 'triangle',
    lead: [76, 76, 76, 0, 76, 76, 76, 0, 76, 79, 72, 74, 76, 0, 0, 0],
    bass: [48, 55, 60, 55, 48, 55, 60, 55, 43, 50, 55, 50, 48, 55, 60, 55],
  },
  world1: {
    bpm: 128,
    loop: true,
    leadWave: 'square',
    bassWave: 'triangle',
    lead: [72, 74, 76, 0, 79, 76, 74, 72, 69, 72, 74, 0, 76, 74, 72, 67],
    bass: [48, 55, 48, 55, 45, 52, 45, 52, 41, 48, 41, 48, 43, 50, 43, 50],
  },
  world2: {
    bpm: 106,
    loop: true,
    leadWave: 'triangle',
    bassWave: 'sawtooth',
    lead: [64, 0, 67, 66, 64, 0, 59, 0, 60, 0, 64, 63, 60, 0, 57, 59],
    bass: [40, 0, 40, 47, 40, 0, 38, 0, 36, 0, 36, 43, 35, 0, 33, 35],
  },
  world3: {
    bpm: 132,
    loop: true,
    leadWave: 'sawtooth',
    bassWave: 'triangle',
    lead: [62, 63, 66, 69, 67, 66, 63, 62, 62, 66, 69, 70, 69, 66, 63, 62],
    bass: [38, 38, 45, 38, 38, 38, 45, 38, 43, 43, 50, 43, 41, 41, 48, 41],
  },
  world4: {
    bpm: 118,
    loop: true,
    leadWave: 'sine',
    bassWave: 'triangle',
    lead: [76, 0, 79, 83, 81, 79, 76, 0, 74, 0, 76, 79, 76, 74, 71, 0],
    bass: [52, 59, 64, 59, 48, 55, 60, 55, 47, 54, 59, 54, 45, 52, 57, 52],
  },
  world5: {
    bpm: 140,
    loop: true,
    leadWave: 'sawtooth',
    bassWave: 'square',
    lead: [61, 64, 67, 66, 64, 61, 60, 61, 67, 70, 73, 72, 70, 67, 66, 64],
    bass: [37, 37, 44, 37, 36, 36, 43, 36, 40, 40, 47, 40, 39, 39, 46, 39],
  },
  boss: {
    bpm: 158,
    loop: true,
    leadWave: 'square',
    bassWave: 'sawtooth',
    lead: [64, 64, 67, 64, 70, 69, 67, 64, 62, 62, 65, 62, 68, 67, 65, 62],
    bass: [40, 40, 40, 47, 40, 40, 43, 45, 38, 38, 38, 45, 38, 38, 41, 43],
  },
  victory: {
    bpm: 148,
    loop: false,
    leadWave: 'square',
    bassWave: 'triangle',
    lead: [72, 72, 76, 79, 0, 76, 79, 84, 0, 0, 0, 0],
    bass: [48, 48, 52, 55, 0, 52, 55, 60, 0, 0, 0, 0],
  },
  gameOver: {
    bpm: 96,
    loop: false,
    leadWave: 'triangle',
    bassWave: 'sawtooth',
    lead: [64, 0, 63, 0, 62, 0, 60, 59, 57, 0, 0, 0],
    bass: [45, 0, 44, 0, 43, 0, 41, 40, 33, 0, 0, 0],
  },
  ch2Arena: {
    bpm: 138,
    loop: true,
    leadWave: 'sawtooth',
    bassWave: 'square',
    lead: [69, 72, 76, 81, 79, 76, 72, 0, 67, 71, 74, 79, 76, 74, 71, 0],
    bass: [33, 33, 45, 33, 36, 36, 48, 36, 31, 31, 43, 31, 35, 35, 47, 35],
  },
  ch2Boss: {
    bpm: 164,
    loop: true,
    leadWave: 'square',
    bassWave: 'sawtooth',
    lead: [64, 67, 71, 64, 76, 75, 71, 67, 62, 65, 69, 62, 74, 72, 69, 65],
    bass: [28, 28, 40, 28, 28, 40, 31, 35, 26, 26, 38, 26, 29, 29, 33, 36],
  },
  ch2Victory: {
    bpm: 146,
    loop: false,
    leadWave: 'triangle',
    bassWave: 'sine',
    lead: [72, 76, 79, 84, 0, 83, 84, 88, 0, 0, 0, 0],
    bass: [48, 52, 55, 60, 0, 59, 60, 64, 0, 0, 0, 0],
  },
};

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicVol = 0.45;
  private sfxVol = 0.65;
  private currentTrack: MusicTrack = 'none';
  private stepIndex = 0;
  private timerId: number | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.gain.value = this.muted ? 0 : this.musicVol * 0.25;
      this.sfxGain.gain.value = this.muted ? 0 : this.sfxVol * 0.45;
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setVolumes(music: number, sfx: number): void {
    this.musicVol = Math.max(0, Math.min(1, music));
    this.sfxVol = Math.max(0, Math.min(1, sfx));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(
        this.muted ? 0 : this.musicVol * 0.25,
        this.ctx.currentTime,
        0.02
      );
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(
        this.muted ? 0 : this.sfxVol * 0.45,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  public playMusic(track: MusicTrack): void {
    if (track === this.currentTrack && this.timerId !== null) return;
    this.stopMusic();
    this.currentTrack = track;
    if (track === 'none') return;

    const pattern = TRACKS[track];
    const stepMs = (60 / pattern.bpm / 2) * 1000;
    this.stepIndex = 0;

    const tick = () => {
      if (this.currentTrack !== track) return;
      const ctx = this.ensureContext();
      if (ctx && this.musicGain && this.musicVol > 0.01 && ctx.state === 'running') {
        const idx = this.stepIndex;
        const leadNote = pattern.lead[idx % pattern.lead.length];
        const bassNote = pattern.bass[idx % pattern.bass.length];
        const dur = (stepMs / 1000) * 0.85;

        if (leadNote > 0) {
          this.triggerTone(midiToFreq(leadNote), pattern.leadWave, dur, 0.22, this.musicGain);
        }
        if (bassNote > 0) {
          this.triggerTone(midiToFreq(bassNote), pattern.bassWave, dur, 0.26, this.musicGain);
        }
      }

      this.stepIndex++;
      if (!pattern.loop && this.stepIndex >= pattern.lead.length) {
        this.stopMusic();
      }
    };

    tick();
    this.timerId = window.setInterval(tick, stepMs);
  }

  public stopMusic(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentTrack = 'none';
  }

  private triggerTone(
    freq: number,
    wave: OscillatorType,
    duration: number,
    gainLevel: number,
    dest: AudioNode,
    endFreq?: number
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(gainLevel, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private triggerNoise(duration: number, gainLevel: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainLevel, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(g);
    g.connect(this.sfxGain);
    src.start();
  }

  public playSfx(
    kind:
      | 'jump'
      | 'doubleJump'
      | 'land'
      | 'webShoot'
      | 'webTrap'
      | 'webSwing'
      | 'dash'
      | 'magicWeb'
      | 'hit'
      | 'playerHurt'
      | 'enemyDefeat'
      | 'coin'
      | 'crystal'
      | 'checkpoint'
      | 'chest'
      | 'shrine'
      | 'bossWarn'
      | 'bossDefeat'
      | 'bounce'
      | 'menuHover'
      | 'menuClick'
      | 'reelTick'
      | 'caseReveal'
      | 'mythicFanfare'
      | 'purchase'
      | 'zaiRelease'
      | 'houseWeave'
      | 'laserShot'
      | 'phaseBlink'
      | 'turretPlace'
      | 'empBurst'
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const out = this.sfxGain;

    switch (kind) {
      case 'jump':
        this.triggerTone(240, 'square', 0.14, 0.3, out, 520);
        break;
      case 'doubleJump':
        this.triggerTone(380, 'square', 0.16, 0.3, out, 780);
        break;
      case 'land':
        this.triggerTone(120, 'triangle', 0.07, 0.22, out, 60);
        break;
      case 'webShoot':
        this.triggerTone(760, 'triangle', 0.11, 0.28, out, 310);
        break;
      case 'webTrap':
        this.triggerTone(340, 'sine', 0.22, 0.3, out, 510);
        break;
      case 'webSwing':
        this.triggerTone(480, 'triangle', 0.14, 0.28, out, 720);
        break;
      case 'dash':
        this.triggerNoise(0.14, 0.28);
        this.triggerTone(320, 'sawtooth', 0.12, 0.22, out, 640);
        break;
      case 'magicWeb':
        this.triggerTone(523, 'square', 0.25, 0.3, out, 1046);
        setTimeout(() => this.triggerTone(659, 'triangle', 0.28, 0.28, out, 1318), 55);
        break;
      case 'hit':
        this.triggerTone(220, 'square', 0.09, 0.32, out, 90);
        break;
      case 'playerHurt':
        this.triggerTone(260, 'sawtooth', 0.24, 0.4, out, 75);
        this.triggerNoise(0.12, 0.25);
        break;
      case 'enemyDefeat':
        this.triggerTone(300, 'square', 0.18, 0.32, out, 110);
        this.triggerNoise(0.15, 0.24);
        break;
      case 'coin':
        this.triggerTone(988, 'square', 0.07, 0.24, out);
        setTimeout(() => this.triggerTone(1318, 'square', 0.14, 0.24, out), 60);
        break;
      case 'crystal':
        this.triggerTone(659, 'triangle', 0.12, 0.32, out);
        setTimeout(() => this.triggerTone(880, 'triangle', 0.14, 0.32, out), 80);
        setTimeout(() => this.triggerTone(1318, 'sine', 0.26, 0.36, out), 160);
        break;
      case 'checkpoint':
        this.triggerTone(523, 'triangle', 0.12, 0.28, out);
        setTimeout(() => this.triggerTone(784, 'triangle', 0.2, 0.3, out), 90);
        break;
      case 'chest':
      case 'shrine':
        this.triggerTone(440, 'square', 0.12, 0.28, out);
        setTimeout(() => this.triggerTone(554, 'square', 0.12, 0.28, out), 90);
        setTimeout(() => this.triggerTone(659, 'square', 0.14, 0.28, out), 180);
        setTimeout(() => this.triggerTone(880, 'square', 0.32, 0.34, out), 270);
        break;
      case 'bounce':
        this.triggerTone(200, 'sine', 0.18, 0.34, out, 640);
        break;
      case 'bossWarn':
        this.triggerTone(150, 'sawtooth', 0.28, 0.35, out, 95);
        break;
      case 'bossDefeat':
        this.triggerNoise(0.45, 0.38);
        this.triggerTone(240, 'sawtooth', 0.5, 0.36, out, 55);
        break;
      case 'menuHover':
        this.triggerTone(540, 'sine', 0.04, 0.14, out);
        break;
      case 'menuClick':
        this.triggerTone(720, 'square', 0.08, 0.22, out, 960);
        break;
      case 'reelTick':
        this.triggerTone(880, 'triangle', 0.03, 0.22, out, 660);
        break;
      case 'caseReveal':
        this.triggerTone(523, 'square', 0.12, 0.3, out);
        setTimeout(() => this.triggerTone(659, 'square', 0.14, 0.32, out), 90);
        setTimeout(() => this.triggerTone(784, 'square', 0.22, 0.34, out), 180);
        setTimeout(() => this.triggerTone(1046, 'sine', 0.35, 0.36, out), 270);
        break;
      case 'mythicFanfare':
        this.triggerTone(523, 'sawtooth', 0.15, 0.34, out);
        setTimeout(() => this.triggerTone(659, 'sawtooth', 0.15, 0.34, out), 100);
        setTimeout(() => this.triggerTone(784, 'square', 0.18, 0.36, out), 200);
        setTimeout(() => this.triggerTone(1046, 'square', 0.24, 0.38, out), 320);
        setTimeout(() => this.triggerTone(1318, 'sine', 0.45, 0.4, out), 450);
        break;
      case 'purchase':
        this.triggerTone(659, 'triangle', 0.08, 0.26, out);
        setTimeout(() => this.triggerTone(988, 'triangle', 0.16, 0.28, out), 70);
        break;
      case 'houseWeave':
        this.triggerTone(392, 'sine', 0.12, 0.22, out, 587);
        setTimeout(() => this.triggerTone(587, 'triangle', 0.14, 0.22, out, 784), 65);
        break;
      case 'zaiRelease':
        this.triggerTone(523.25, 'triangle', 0.18, 0.32, out);
        setTimeout(() => this.triggerTone(659.25, 'triangle', 0.18, 0.32, out), 90);
        setTimeout(() => this.triggerTone(783.99, 'sine', 0.22, 0.34, out), 180);
        setTimeout(() => this.triggerTone(1046.5, 'sine', 0.42, 0.38, out), 280);
        setTimeout(() => this.triggerTone(1318.5, 'triangle', 0.48, 0.3, out), 390);
        break;
      case 'laserShot':
        this.triggerTone(980, 'sawtooth', 0.08, 0.2, out, 360);
        break;
      case 'phaseBlink':
        this.triggerNoise(0.08, 0.22);
        this.triggerTone(620, 'sine', 0.14, 0.26, out, 1240);
        break;
      case 'turretPlace':
        this.triggerTone(420, 'triangle', 0.12, 0.24, out, 840);
        setTimeout(() => this.triggerTone(840, 'sine', 0.16, 0.22, out), 80);
        break;
      case 'empBurst':
        this.triggerNoise(0.22, 0.3);
        this.triggerTone(880, 'sawtooth', 0.28, 0.28, out, 180);
        break;
    }
  }
}

export const audio = new RetroAudioEngine();
