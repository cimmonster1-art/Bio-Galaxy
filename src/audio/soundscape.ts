/**
 * A tiny, dependency-free WebAudio sound-design layer for the atlas. It plays a
 * soft ambient drone whose timbre shifts with zoom depth, plus a few one-shot
 * cues for entering an epoch, clicking, and so on. Everything is created lazily
 * from a user gesture (browsers block audio before one), kept deliberately
 * quiet, and torn down cleanly on dispose.
 *
 * The implementation favours a fixed graph: a handful of detuned oscillators
 * feed a lowpass and a master gain that are built exactly once. Runtime gestures
 * only nudge gains and filter cutoffs; the only nodes created per call are the
 * short one-shot envelopes for cues, and those disconnect themselves when their
 * envelope ends, so the graph never accumulates stray nodes.
 */

export interface Soundscape {
  /** Lazily create the AudioContext. MUST run inside a user gesture. Idempotent. */
  start(): void;
  /** Mute or unmute the whole soundscape (ambient and cues). */
  setMuted(muted: boolean): void;
  /** Current mute state. */
  isMuted(): boolean;
  /** Cross-fade the ambient timbre with zoom depth, 0 (cosmos) .. 1 (atom). */
  setScale(scale01: number): void;
  /** A short, tasteful swell when entering a named epoch. */
  epochCue(id: string): void;
  /** A soft UI click. */
  uiClick(): void;
  /** Stop everything and release the AudioContext. */
  dispose(): void;
}

/** Detuned voices that make up the ambient drone. */
interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
  /** Base frequency in Hz; modulated slightly by zoom depth. */
  base: number;
  /** How much this voice rises in pitch as we zoom inward. */
  lift: number;
}

// Conservative output ceiling so the ambience sits well under any UI sounds.
const MASTER_GAIN = 0.12;
const AMBIENT_GAIN = 0.5;

export function createSoundscape(): Soundscape {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let ambientGain: GainNode | null = null;
  let lowpass: BiquadFilterNode | null = null;
  let voices: Voice[] = [];

  let muted = false;
  let scale01 = 0;
  let started = false;

  /** Apply the current mute state to the master gain with a short ramp. */
  function applyMaster(): void {
    if (!ctx || !master) return;
    const target = muted ? 0 : MASTER_GAIN;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(target, now, 0.08);
  }

  /** Push the current zoom depth into the ambient voices and filter cutoff. */
  function applyScale(): void {
    if (!ctx || !lowpass) return;
    const now = ctx.currentTime;
    // Cutoff opens up as we dive inward, so deep scales feel brighter and more
    // intricate while the cosmos reads as a low, distant hum.
    const cutoff = 220 + scale01 * scale01 * 2600;
    lowpass.frequency.setTargetAtTime(cutoff, now, 0.4);
    for (const v of voices) {
      v.osc.frequency.setTargetAtTime(v.base + v.lift * scale01, now, 0.6);
    }
  }

  function start(): void {
    if (typeof window === 'undefined') return;
    if (started && ctx) {
      // Browsers may suspend the context when a tab backgrounds; a repeat call
      // from a gesture is a good moment to resume.
      if (ctx.state === 'suspended') void ctx.resume();
      return;
    }

    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();

    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_GAIN;
    master.connect(ctx.destination);

    // Ambient bus: oscillators -> lowpass -> ambient gain -> master.
    ambientGain = ctx.createGain();
    ambientGain.gain.value = AMBIENT_GAIN;
    ambientGain.connect(master);

    lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 220;
    lowpass.Q.value = 0.6;
    lowpass.connect(ambientGain);

    // Three detuned voices a fifth apart give a calm, slightly shimmering pad
    // without ever sounding like a chord progression.
    const specs: Array<{ base: number; lift: number; type: OscillatorType; gain: number }> = [
      { base: 55, lift: 18, type: 'sine', gain: 0.6 },
      { base: 82.5, lift: 26, type: 'sine', gain: 0.4 },
      { base: 110.3, lift: 40, type: 'triangle', gain: 0.22 },
    ];
    voices = specs.map((s) => {
      const osc = ctx!.createOscillator();
      osc.type = s.type;
      osc.frequency.value = s.base;
      // A touch of detune keeps the unison voices from phase-locking.
      osc.detune.value = (Math.random() - 0.5) * 8;
      const gain = ctx!.createGain();
      gain.gain.value = s.gain;
      osc.connect(gain);
      gain.connect(lowpass!);
      osc.start();
      return { osc, gain, base: s.base, lift: s.lift };
    });

    started = true;
    applyScale();
    applyMaster();
  }

  function setMuted(value: boolean): void {
    muted = value;
    applyMaster();
  }

  function isMuted(): boolean {
    return muted;
  }

  function setScale(value: number): void {
    scale01 = Math.max(0, Math.min(1, value));
    applyScale();
  }

  /**
   * Play a short tone with an attack/decay envelope. The oscillator and its
   * gain are created here and disconnected on the oscillator's `ended` event, so
   * no nodes survive the one-shot. Routed through master so mute applies.
   */
  function blip(freq: number, duration: number, peak: number, type: OscillatorType = 'sine'): void {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.value = 0;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(env);
    env.connect(master);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function epochCue(id: string): void {
    if (!ctx) return;
    // Derive a stable root note from the id so each epoch has its own colour,
    // then sound a soft major triad swell over it.
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    const root = 196 * Math.pow(2, (Math.abs(hash) % 5) / 12);
    blip(root, 1.4, 0.5, 'sine');
    blip(root * 1.25, 1.2, 0.32, 'sine');
    blip(root * 1.5, 1.0, 0.24, 'triangle');
  }

  function uiClick(): void {
    blip(880, 0.06, 0.3, 'triangle');
  }

  function dispose(): void {
    if (!ctx) {
      started = false;
      return;
    }
    for (const v of voices) {
      try {
        v.osc.stop();
      } catch {
        // Already stopped; nothing to do.
      }
      v.osc.disconnect();
      v.gain.disconnect();
    }
    voices = [];
    lowpass?.disconnect();
    ambientGain?.disconnect();
    master?.disconnect();
    void ctx.close();
    ctx = null;
    master = null;
    ambientGain = null;
    lowpass = null;
    started = false;
  }

  return { start, setMuted, isMuted, setScale, epochCue, uiClick, dispose };
}
