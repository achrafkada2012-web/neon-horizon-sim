/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EngineType = 'v8_muscle' | 'v10_exotic' | 'v12_twinturbo';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine sound nodes
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineDistortion: WaveShaperNode | null = null;
  private isEngineRunning: boolean = false;
  private currentRPM: number = 850;

  // Sirens
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive: boolean = false;

  // Tire screech
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;

  // Cinematic trailer music bed
  private trailerMusicActive: boolean = false;
  private musicIntervalId: number | null = null;

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  private ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.75, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ---- TACTILE COCKPIT CLICKS ----
  public playStartButtonSound(turningOn: boolean) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Heavy metallic mechanical latch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.09);

    if (turningOn) {
      // Starter motor crank
      this.playStarterCrank();
    }
  }

  private playStarterCrank() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    
    // Whine of starter motor
    const crankOsc = this.ctx.createOscillator();
    const crankGain = this.ctx.createGain();
    crankOsc.type = 'sawtooth';
    crankOsc.frequency.setValueAtTime(120, t + 0.05);
    crankOsc.frequency.linearRampToValueAtTime(360, t + 0.45);
    crankGain.gain.setValueAtTime(0.25, t + 0.05);
    crankGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    crankOsc.connect(crankGain);
    crankGain.connect(this.masterGain!);
    crankOsc.start(t + 0.05);
    crankOsc.stop(t + 0.52);

    // Initial throat-clearing throttle spike
    setTimeout(() => {
      this.startEngineSound(2800);
      setTimeout(() => {
        this.setEngineRPM(850);
      }, 500);
    }, 450);
  }

  public playPaddleShiftClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Crisp microswitch click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.025);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.035);

    // Also exhaust pop on redline shift
    this.playExhaustBackfire();
  }

  public playToggleSwitchSound() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.04);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playLaunchControlArm() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.linearRampToValueAtTime(1760, t + 0.15);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playHandbrakeSound() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.09);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playTurboBlowOff() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.35);
    filter.Q.value = 5.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    // Rapid flutter flutter flutter
    gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.18);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(t);
    noise.stop(t + 0.4);
  }

  public playExhaustBackfire() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // ---- ROARING ENGINE SYNTHESIS ----
  public startEngineSound(initialRPM: number = 850) {
    this.ensureContext();
    if (!this.ctx || this.isEngineRunning) return;

    this.currentRPM = initialRPM;
    this.isEngineRunning = true;

    const t = this.ctx.currentTime;

    // Distortion shaper for rich combustion harmonics
    this.engineDistortion = this.ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((Math.PI + 4) * x) / (Math.PI + 4 * Math.abs(x));
    }
    this.engineDistortion.curve = curve;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(400, t);
    this.engineFilter.Q.value = 3.5;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.28, t);

    // Primary firing pulses (V12 has 6 pulses per revolution)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';

    // Harmonic overtone
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';

    // Sub-bass exhaust rumble
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sine';

    this.updateEngineFrequencies(this.currentRPM);

    this.engineOsc1.connect(this.engineDistortion);
    this.engineOsc2.connect(this.engineDistortion);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineDistortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain!);

    this.engineOsc1.start(t);
    this.engineOsc2.start(t);
    this.engineSubOsc.start(t);
  }

  public setEngineRPM(rpm: number) {
    this.currentRPM = Math.max(600, Math.min(9500, rpm));
    if (this.isEngineRunning) {
      this.updateEngineFrequencies(this.currentRPM);
    }
  }

  private updateEngineFrequencies(rpm: number) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineSubOsc || !this.engineFilter) return;

    const t = this.ctx.currentTime;
    // Firing frequency calculation: (RPM / 60) * (cylinders / 2)
    // For V12: (RPM / 60) * 6 = RPM / 10
    const fundamentalFreq = (rpm / 60) * 4.5;
    this.engineOsc1.frequency.setTargetAtTime(fundamentalFreq, t, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(fundamentalFreq * 1.5, t, 0.05);
    this.engineSubOsc.frequency.setTargetAtTime(fundamentalFreq * 0.5, t, 0.05);

    // Filter opens up as RPM climbs
    const filterFreq = 300 + (rpm / 9000) * 3200;
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.06);
  }

  public stopEngineSound() {
    if (!this.isEngineRunning || !this.ctx) return;
    const t = this.ctx.currentTime;

    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, t, 0.1);
    }

    setTimeout(() => {
      try {
        this.engineOsc1?.stop();
        this.engineOsc2?.stop();
        this.engineSubOsc?.stop();
      } catch {
        // already stopped
      }
      this.engineOsc1 = null;
      this.engineOsc2 = null;
      this.engineSubOsc = null;
      this.engineFilter = null;
      this.engineGain = null;
      this.isEngineRunning = false;
    }, 150);
  }

  // ---- TIRE SCREECH (DRIFT / HANDBRAKE) ----
  public setTireScreech(active: boolean, intensity: number = 1.0) {
    this.ensureContext();
    if (!this.ctx) return;

    if (active && !this.tireNoiseNode) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.7;
      }

      this.tireNoiseNode = this.ctx.createBufferSource();
      this.tireNoiseNode.buffer = buffer;
      this.tireNoiseNode.loop = true;

      this.tireFilter = this.ctx.createBiquadFilter();
      this.tireFilter.type = 'bandpass';
      this.tireFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      this.tireFilter.Q.value = 8.0;

      this.tireGain = this.ctx.createGain();
      this.tireGain.gain.setValueAtTime(Math.min(0.4, 0.15 * intensity), this.ctx.currentTime);

      this.tireNoiseNode.connect(this.tireFilter);
      this.tireFilter.connect(this.tireGain);
      this.tireGain.connect(this.masterGain!);
      this.tireNoiseNode.start();
    } else if (active && this.tireGain) {
      this.tireGain.gain.setTargetAtTime(Math.min(0.4, 0.15 * intensity), this.ctx.currentTime, 0.05);
    } else if (!active && this.tireNoiseNode) {
      try {
        this.tireGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        setTimeout(() => {
          this.tireNoiseNode?.stop();
          this.tireNoiseNode = null;
          this.tireGain = null;
          this.tireFilter = null;
        }, 60);
      } catch {
        this.tireNoiseNode = null;
      }
    }
  }

  // ---- POLICE PURSUIT SIREN ----
  public setPoliceSiren(active: boolean) {
    this.ensureContext();
    if (!this.ctx) return;

    if (active && !this.isSirenActive) {
      this.isSirenActive = true;
      const t = this.ctx.currentTime;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'sawtooth';

      // LFO for dual-tone wail
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.6, t); // 0.6 Hz wail cycle
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(320, t);
      this.sirenOsc.frequency.setValueAtTime(750, t);
      lfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc.frequency);

      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.22, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);

      this.sirenOsc.connect(filter);
      filter.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain!);

      lfo.start(t);
      this.sirenOsc.start(t);
    } else if (!active && this.isSirenActive) {
      this.isSirenActive = false;
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
        setTimeout(() => {
          try {
            this.sirenOsc?.stop();
          } catch {
            // stopped
          }
          this.sirenOsc = null;
          this.sirenGain = null;
        }, 220);
      }
    }
  }

  // ---- CINEMATIC TRAILER BRAAM & IMPACT ----
  public playCinematicBraam() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Sub-bass 808 drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, t);
    subOsc.frequency.exponentialRampToValueAtTime(32, t + 1.2);

    subGain.gain.setValueAtTime(0.9, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain!);
    subOsc.start(t);
    subOsc.stop(t + 1.5);

    // Distorted brass saw wave
    const brassOsc = this.ctx.createOscillator();
    const brassGain = this.ctx.createGain();
    brassOsc.type = 'sawtooth';
    brassOsc.frequency.setValueAtTime(65, t);
    brassOsc.frequency.linearRampToValueAtTime(55, t + 0.8);

    brassGain.gain.setValueAtTime(0.4, t);
    brassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);

    brassOsc.connect(brassGain);
    brassGain.connect(this.masterGain!);
    brassOsc.start(t);
    brassOsc.stop(t + 1.0);
  }

  public playBarricadeSmash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Low punch
    const punch = this.ctx.createOscillator();
    const punchGain = this.ctx.createGain();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(140, t);
    punch.frequency.exponentialRampToValueAtTime(25, t + 0.3);
    punchGain.gain.setValueAtTime(0.8, t);
    punchGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    punch.connect(punchGain);
    punchGain.connect(this.masterGain!);
    punch.start(t);
    punch.stop(t + 0.4);

    // High shatter noise
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start(t);
    noise.stop(t + 0.5);
  }

  // ---- CINEMATIC TRAILER MUSIC BED (PROMPT MATCHING) ----
  public startTrailerMusic(actNumber: number = 1) {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.trailerMusicActive) return;
    this.trailerMusicActive = true;

    // Periodic pulsing synth arpeggio matching trailer intensity
    let step = 0;
    const bpm = actNumber === 1 ? 95 : 138;
    const intervalMs = (60 / bpm / 2) * 1000;

    const bassNotes = [36.7, 43.65, 49.0, 55.0]; // D1, F1, G1, A1

    this.musicIntervalId = window.setInterval(() => {
      if (!this.ctx || this.isMuted || !this.trailerMusicActive) return;
      const t = this.ctx.currentTime;
      const note = bassNotes[step % bassNotes.length];
      step++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = actNumber >= 2 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(note * (actNumber >= 2 ? 2 : 1), t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(actNumber >= 2 ? 1200 : 450, t);

      gain.gain.setValueAtTime(actNumber >= 2 ? 0.18 : 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.2);
    }, intervalMs);
  }

  public stopTrailerMusic() {
    this.trailerMusicActive = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  // ---- VOICEOVER NARRATION (WEB SPEECH API) ----
  public speakNarration(text: string, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Steady, cinematic, deliberate pace
    utterance.pitch = 0.88; // Deeper, more dramatic baritone tone

    // Prefer English voices with clear tone
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const preferredVoice = englishVoices.find(v => 
      v.name.includes('Natural') || 
      v.name.includes('Enhanced') || 
      v.name.includes('Google') || 
      v.name.includes('Daniel') || 
      v.name.includes('Alex')
    ) || englishVoices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  public stopNarration() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundEngine = new SoundEngine();
