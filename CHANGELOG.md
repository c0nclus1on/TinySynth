# Changelog

All notable changes to TinySynth are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-07

First proof-of-concept release.

### Added
- Polyphonic subtractive synth engine on the Web Audio API (no runtime deps).
- Two oscillators with 4 waveforms each; the second oscillator is detunable.
- Per-voice low-pass filter with cutoff (logarithmic) and resonance.
- ADSR amplitude envelope (attack, decay, sustain, release).
- LFO with selectable waveform, rate, depth, and destination (off / pitch / filter).
- Master volume with a limiter on the output bus to tame chord peaks.
- Play input: computer keyboard (virtual-piano layout), `Z`/`X` octave shift,
  and a clickable/tappable on-screen keyboard with active-note highlighting.
- Embeddable engine (`src/audio/synth.js`): DOM-free, accepts an optional shared
  `AudioContext` and output node, with `noteOn`/`noteOff`/`set`/`panic`/`dispose`.

[0.1.0]: https://github.com/c0nclus1on/TinySynth/releases/tag/v0.1.0
