/**
 * Web Audio API Sound & Music Synthesizer
 * 100% procedural sound effects and dynamically EVOLVING retro synth music engine.
 * Music starts calm and atmospheric, then progressively accelerates, adds layers,
 * drums, and evolves into high-energy synthwave/cyberpunk overdrive as distance increases.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Music Evolution State
    this.musicPhase = 0; // 0: CHILL (0-600m), 1: DRIVE (600-1600m), 2: OVERDRIVE (1600m+)
    this.currentBpm = 108; // Dynamically accelerates up to 160+ BPM
    this.filterCutoff = 300; // Opens up with speed
    this.musicIntensityLabel = 'SPOKOJNA';
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // SFX bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    // Music bus
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 0.8 : 0.0, this.ctx.currentTime);
    }
    return this.soundEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.musicEnabled;
  }

  /* ---------------- SOUND EFFECTS ---------------- */

  playJump() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.16);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playDoubleJump() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.18);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  playDuck() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playMilestone() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Classic Chrome Dino 100m milestone double-beep (800Hz, then 1050Hz)
    const now = this.ctx.currentTime;
    [ { f: 800, t: 0, d: 0.07 }, { f: 1050, t: 0.09, d: 0.1 } ].forEach(b => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(b.f, now + b.t);

      gain.gain.setValueAtTime(0.2, now + b.t);
      gain.gain.exponentialRampToValueAtTime(0.005, now + b.t + b.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + b.t);
      osc.stop(now + b.t + b.d + 0.02);
    });
  }

  playCoin() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Fast arpeggio
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    osc2.frequency.setValueAtTime(1975.53, now); // B6
    osc2.frequency.setValueAtTime(2637.02, now + 0.06); // E7

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.28);
    osc2.stop(now + 0.28);
  }

  playLevelUp() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major chord fanfare
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = this.ctx.currentTime + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time);
      osc.stop(time + 0.38);
    });
  }

  playDash() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.3);
  }

  playShieldHit() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  playCrash() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.48);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  playBiomeSwitch() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [220, 277.18, 329.63, 440, 554.37].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.85);
    });
  }

  playPhaseTransitionSound() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2500, now + 0.5);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.62);
  }

  playClick() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /* ---------------- DYNAMIC MUSIC EVOLUTION ---------------- */

  updateMusicIntensity(distance, currentSpeed) {
    // Determine target BPM smoothly based on distance and speed
    // 0m -> ~106 BPM, 500m -> ~118 BPM, 1000m -> ~130 BPM, 2000m+ -> 155+ BPM
    const targetBpm = Math.min(162, 106 + (distance * 0.018) + (currentSpeed - 16) * 1.2);
    this.currentBpm = this.currentBpm * 0.95 + targetBpm * 0.05;

    // Filter opens up as distance increases
    this.filterCutoff = Math.min(1800, 260 + distance * 0.6);

    // Phases:
    // Phase 0: 0 - 600m (Spokojna / Ambient Prehistoric Chill)
    // Phase 1: 600 - 1600m (Dynamiczna / Synthwave Drive)
    // Phase 2: 1600m+ (Potężna / Cyberpunk Overdrive)
    let newPhase = 0;
    if (distance >= 1600) {
      newPhase = 2;
    } else if (distance >= 600) {
      newPhase = 1;
    }

    if (newPhase !== this.musicPhase) {
      this.musicPhase = newPhase;
      this.playPhaseTransitionSound();
    }

    this.musicIntensityLabel = this.musicPhase === 0
      ? '🌿 SPOKOJNY BIEG'
      : (this.musicPhase === 1 ? '⚡ SYNTH DRIVE' : '🔥 CYBER OVERDRIVE');

    // Update HUD indicator if present
    const hudMusic = document.getElementById('hud-music-tag');
    if (hudMusic) {
      hudMusic.textContent = `${this.musicIntensityLabel} (${Math.round(this.currentBpm)} BPM)`;
      hudMusic.className = `music-tag-badge phase-${this.musicPhase}`;
    }
  }

  startMusic() {
    if (!this.musicEnabled || this.isPlayingMusic) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.isPlayingMusic = true;
    this.musicStep = 0;
    this.musicPhase = 0;
    this.currentBpm = 106;
    this.scheduleMusicStep();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /* ---------------- DRUM SYNTHESIS HELPERS ---------------- */

  triggerKick(now, gainMult = 1.0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);

    const vol = (this.musicPhase === 2 ? 0.38 : 0.24) * gainMult;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  triggerSnare(now) {
    // Noise snap
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(now);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

    oscGain.gain.setValueAtTime(0.18, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  triggerHiHat(now, isOpen = false) {
    const dur = isOpen ? 0.08 : 0.035;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (isOpen ? 0.02 : 0.007)));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(9000, now);

    const gain = this.ctx.createGain();
    const vol = this.musicPhase === 0 ? 0.04 : (this.musicPhase === 1 ? 0.07 : 0.1);
    gain.gain.setValueAtTime(vol, now);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(now);
  }

  /* ---------------- MAIN PROCEDURAL MUSIC STEP ---------------- */

  scheduleMusicStep() {
    if (!this.isPlayingMusic || !this.musicEnabled) return;

    // Calculate step interval based on current evolved BPM (16th notes)
    // 60000 / BPM / 4
    const stepDuration = Math.max(80, (60000 / this.currentBpm / 4));
    const now = this.ctx.currentTime;
    const step = this.musicStep;

    // Chord progression in D minor: [Dm, F, C, Gm]
    const rootNotes = [73.42, 87.31, 65.41, 98.00]; // D2, F2, C2, G2
    const currentChordIndex = Math.floor(step / 16) % rootNotes.length;
    const rootFreq = rootNotes[currentChordIndex];

    // --- 1. DRUMS ACCORDING TO PHASE ---
    if (this.musicPhase === 0) {
      // PHASE 0 (CALM): Gentle shaker on beats 2 & 4 (steps 4, 12). No harsh kick.
      if (step % 8 === 4) {
        this.triggerHiHat(now, false);
      }
    } else if (this.musicPhase === 1) {
      // PHASE 1 (DRIVE): Kick on beats 1 & 3 (steps 0, 8), Hi-hat on offbeats (steps 2, 6, 10, 14)
      if (step % 8 === 0) {
        this.triggerKick(now, 0.85);
      } else if (step % 8 === 4) {
        this.triggerSnare(now);
      }
      if (step % 2 === 1) {
        this.triggerHiHat(now, step % 4 === 2);
      }
    } else {
      // PHASE 2 (OVERDRIVE): Four-on-the-floor heavy Kick (steps 0, 4, 8, 12), Snare on 4 & 12, running 16th hats
      if (step % 4 === 0) {
        this.triggerKick(now, 1.1);
      }
      if (step % 8 === 4) {
        this.triggerSnare(now);
      }
      // Running hi-hats
      this.triggerHiHat(now, step % 4 === 2);
    }

    // --- 2. BASSLINE ACCORDING TO PHASE ---
    if (this.musicPhase === 0) {
      // Calm, long warm sub-bass notes every 4 steps
      if (step % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(rootFreq, now);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (stepDuration * 3.5) / 1000);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + (stepDuration * 3.8) / 1000);
      }
    } else if (this.musicPhase === 1) {
      // Rolling 8th-note synthwave bass with low-pass filter
      if (step % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        const bassFreq = (step % 4 === 2) ? rootFreq * 1.5 : rootFreq;
        osc.frequency.setValueAtTime(bassFreq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(this.filterCutoff, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (stepDuration * 1.8) / 1000);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + (stepDuration * 1.9) / 1000);
      }
    } else {
      // OVERDRIVE: Heavy 16th note reese/saw bassline with high resonance and open filter!
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Bass notes pump with groove
      const patternNotes = [rootFreq, rootFreq, rootFreq * 1.5, rootFreq * 2];
      const noteFreq = patternNotes[step % 4];
      osc1.frequency.setValueAtTime(noteFreq, now);
      osc2.frequency.setValueAtTime(noteFreq * 0.5, now); // Sub octave

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.filterCutoff + 300, now);
      filter.Q.setValueAtTime(4.0, now);

      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (stepDuration * 0.95) / 1000);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + (stepDuration * 0.98) / 1000);
      osc2.stop(now + (stepDuration * 0.98) / 1000);
    }

    // --- 3. HARMONY & ARPEGGIATED MELODY ---
    if (this.musicPhase === 0) {
      // Soft ambient pads on chord changes (step 0 of 16)
      if (step % 16 === 0) {
        const chordPitches = [rootFreq * 2, rootFreq * 2.4, rootFreq * 3];
        chordPitches.forEach(pitch => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(pitch, now);

          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (stepDuration * 14) / 1000);

          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + (stepDuration * 15) / 1000);
        });
      }
    } else if (this.musicPhase === 1) {
      // Synthwave arpeggios on steps 0, 4, 8, 12
      const arpNotes = [rootFreq * 2, rootFreq * 2.5, rootFreq * 3, rootFreq * 3.75];
      if (step % 2 === 0) {
        const pitch = arpNotes[(step / 2) % arpNotes.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, now);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (stepDuration * 1.5) / 1000);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + (stepDuration * 1.6) / 1000);
      }
    } else {
      // OVERDRIVE: Fast, piercing 16th-note lead riffs!
      const leadScale = [
        rootFreq * 2, rootFreq * 2.25, rootFreq * 2.67, rootFreq * 3,
        rootFreq * 3.33, rootFreq * 4, rootFreq * 4.5
      ];
      if (step % 2 === 0 || Math.random() > 0.4) {
        const pitch = leadScale[Math.floor(Math.random() * leadScale.length)];
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(pitch, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3500, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (stepDuration * 1.2) / 1000);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + (stepDuration * 1.3) / 1000);
      }
    }

    this.musicStep = (this.musicStep + 1) % 64;
    this.musicTimer = setTimeout(() => this.scheduleMusicStep(), stepDuration);
  }
}

// Global sound manager instance
window.soundEngine = new SoundEngine();
