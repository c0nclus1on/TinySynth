import { mtof } from '../notes.js';

// Per-voice peak amplitude. Kept well below 1.0 so stacked voices (chords)
// have headroom; a limiter on the master bus catches the rest.
const PEAK = 0.3;

const DEFAULT_PARAMS = {
  osc1: { wave: 'sawtooth' },
  osc2: { wave: 'sawtooth', detune: -8, level: 0.5 },
  filter: { cutoff: 2200, q: 6 },
  env: { a: 0.01, d: 0.2, s: 0.7, r: 0.4 },
  lfo: { wave: 'sine', rate: 5, depth: 0.15, dest: 'off' }, // dest: off | pitch | filter
  master: { volume: 0.8 },
};

/**
 * TinySynth engine — a self-contained polyphonic subtractive synth voice bank.
 *
 * Designed to be embeddable: it has no DOM dependencies and can either create
 * its own AudioContext or share one supplied by a host app.
 *
 *   const synth = new Synth();                          // standalone
 *   const synth = new Synth({ context, output: busIn }); // inside a host graph
 *   synth.noteOn(60); synth.noteOff(60);
 *   synth.set('filter.cutoff', 1200);
 *   synth.dispose();
 *
 * Signal path per voice:  osc1 + osc2 -> filter (LP) -> amp(ADSR) -> master
 * Master bus:             master gain -> limiter -> output
 */
export class Synth {
  constructor({ context = null, output = null, params = null } = {}) {
    this.ctx = context;
    this._externalCtx = !!context;
    this._explicitOutput = output;
    this.ready = false;
    this.voices = new Map(); // midi -> voice
    this.params = structuredClone(params || DEFAULT_PARAMS);
  }

  /** Lazily builds the audio graph. Safe to call repeatedly. */
  init() {
    if (this.ready) return;
    const ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.params.master.volume;

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 6;
    this.limiter.ratio.value = 12;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.1;

    this.master.connect(this.limiter);
    this.limiter.connect(this._explicitOutput || ctx.destination);

    // One shared LFO feeding a depth gain; routed to voice targets on demand.
    this.lfo = ctx.createOscillator();
    this.lfo.type = this.params.lfo.wave;
    this.lfo.frequency.value = this.params.lfo.rate;
    this.lfoDepth = ctx.createGain();
    this.lfoDepth.gain.value = this._lfoDepthValue();
    this.lfo.connect(this.lfoDepth);
    this.lfo.start();

    this.ready = true;
  }

  /** The synth's output node — connect it into a host graph if you prefer. */
  get output() {
    this.init();
    return this.limiter;
  }

  /** Resumes the AudioContext (call from a user gesture). */
  resume() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _lfoDepthValue() {
    const p = this.params.lfo;
    if (p.dest === 'pitch') return p.depth * 100; // cents
    if (p.dest === 'filter') return p.depth * 3000; // Hz
    return 0;
  }

  _routeLFO(voice) {
    for (const t of voice.lfoConns) {
      try { this.lfoDepth.disconnect(t); } catch (_) { /* not connected */ }
    }
    voice.lfoConns = [];
    const dest = this.params.lfo.dest;
    if (dest === 'pitch') {
      this.lfoDepth.connect(voice.osc1.detune);
      this.lfoDepth.connect(voice.osc2.detune);
      voice.lfoConns = [voice.osc1.detune, voice.osc2.detune];
    } else if (dest === 'filter') {
      this.lfoDepth.connect(voice.filter.frequency);
      voice.lfoConns = [voice.filter.frequency];
    }
  }

  noteOn(midi) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.voices.has(midi)) this._hardStop(midi); // retrigger

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const p = this.params;
    const freq = mtof(midi);

    const osc1 = ctx.createOscillator();
    osc1.type = p.osc1.wave;
    osc1.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = p.osc2.wave;
    osc2.frequency.value = freq;
    osc2.detune.value = p.osc2.detune;

    const osc2gain = ctx.createGain();
    osc2gain.gain.value = p.osc2.level;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = p.filter.cutoff;
    filter.Q.value = p.filter.q;

    const amp = ctx.createGain();
    amp.gain.value = 0;

    osc1.connect(filter);
    osc2.connect(osc2gain).connect(filter);
    filter.connect(amp).connect(this.master);

    // ADSR attack + decay to sustain.
    const a = Math.max(0.001, p.env.a);
    const d = Math.max(0.001, p.env.d);
    amp.gain.cancelScheduledValues(now);
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(PEAK, now + a);
    amp.gain.linearRampToValueAtTime(PEAK * p.env.s, now + a + d);

    const voice = { midi, osc1, osc2, osc2gain, filter, amp, lfoConns: [] };
    this._routeLFO(voice);
    osc1.start(now);
    osc2.start(now);
    this.voices.set(midi, voice);
  }

  noteOff(midi) {
    const v = this.voices.get(midi);
    if (!v) return;
    this.voices.delete(midi);
    const now = this.ctx.currentTime;
    const r = Math.max(0.001, this.params.env.r);
    this._release(v, now, r);
  }

  _hardStop(midi) {
    const v = this.voices.get(midi);
    if (!v) return;
    this.voices.delete(midi);
    this._release(v, this.ctx.currentTime, 0.012);
  }

  _release(v, now, releaseSec) {
    const g = v.amp.gain;
    try {
      g.cancelAndHoldAtTime(now);
    } catch (_) {
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value || 0.0001, now);
    }
    g.linearRampToValueAtTime(0, now + releaseSec);
    const stopAt = now + releaseSec + 0.02;
    v.osc1.stop(stopAt);
    v.osc2.stop(stopAt);
    v.osc1.onended = () => this._cleanup(v);
  }

  _cleanup(v) {
    for (const t of v.lfoConns) {
      try { this.lfoDepth.disconnect(t); } catch (_) { /* noop */ }
    }
    for (const node of [v.osc1, v.osc2, v.osc2gain, v.filter, v.amp]) {
      try { node.disconnect(); } catch (_) { /* noop */ }
    }
  }

  /** Immediately silence all voices. */
  panic() {
    for (const midi of [...this.voices.keys()]) this._hardStop(midi);
  }

  /**
   * Update a parameter by dotted path (e.g. 'filter.cutoff', 'env.a').
   * Stores the value and applies it live to sounding voices where possible.
   */
  set(path, value) {
    const [group, key] = path.split('.');
    if (key === undefined) this.params[group] = value;
    else this.params[group][key] = value;
    if (this.ready) this._apply(path, value);
  }

  // Smoothly glide a continuous AudioParam to a new value. ~20 ms is fast
  // enough to feel immediate while avoiding the zipper noise of hard-setting
  // .value on every slider-drag event.
  _ramp(param, value) {
    param.setTargetAtTime(value, this.ctx.currentTime, 0.02);
  }

  _apply(path, value) {
    switch (path) {
      case 'osc1.wave': for (const v of this.voices.values()) v.osc1.type = value; break;
      case 'osc2.wave': for (const v of this.voices.values()) v.osc2.type = value; break;
      case 'osc2.detune': for (const v of this.voices.values()) this._ramp(v.osc2.detune, value); break;
      case 'osc2.level': for (const v of this.voices.values()) this._ramp(v.osc2gain.gain, value); break;
      case 'filter.cutoff': for (const v of this.voices.values()) this._ramp(v.filter.frequency, value); break;
      case 'filter.q': for (const v of this.voices.values()) this._ramp(v.filter.Q, value); break;
      case 'lfo.wave': this.lfo.type = value; break;
      case 'lfo.rate': this._ramp(this.lfo.frequency, value); break;
      case 'lfo.depth': this._ramp(this.lfoDepth.gain, this._lfoDepthValue()); break;
      case 'lfo.dest':
        this._ramp(this.lfoDepth.gain, this._lfoDepthValue());
        for (const v of this.voices.values()) this._routeLFO(v);
        break;
      case 'master.volume': this._ramp(this.master.gain, value); break;
      // env.* is read at the next noteOn — nothing live to update.
    }
  }

  /** Tear down. Closes the AudioContext only if the synth created it. */
  dispose() {
    this.panic();
    if (!this.ready) return;
    try { this.lfo.stop(); } catch (_) { /* noop */ }
    try { this.lfoDepth.disconnect(); } catch (_) { /* noop */ }
    try { this.master.disconnect(); } catch (_) { /* noop */ }
    try { this.limiter.disconnect(); } catch (_) { /* noop */ }
    if (!this._externalCtx) {
      try { this.ctx.close(); } catch (_) { /* noop */ }
    }
    this.ready = false;
  }
}
