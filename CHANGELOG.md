# Changelog

All notable changes to TinySynth are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-07

### Added
- Two-octave "piano" computer-keyboard layout: letter rows are the natural
  notes and the row above holds the sharps (lower octave on `Z X C V B N M` /
  `S D G H J`, upper on `Q W E R T Y U` / `2 3 5 6 7`), spanning ~2.5 octaves.
- Octave shift moved to the arrow keys (Up/Down), since `Z`/`X` are now notes.
- Real-time, smoothed parameter control: sliders apply live while you drag, and
  the continuous params (cutoff, resonance, osc-2 level/detune, LFO rate/depth,
  master) glide via `setTargetAtTime` to avoid zipper noise.
- Ref-counted note gate so overlapping inputs (the octave seam, or mouse +
  keyboard on the same note) don't cut each other off.

### Fixed
- Changing a control (e.g. Oscillator 1) no longer freezes keyboard playback:
  controls release focus on commit and note keys are no longer swallowed by a
  focused slider/select.

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

[0.2.0]: https://github.com/c0nclus1on/TinySynth/releases/tag/v0.2.0
[0.1.0]: https://github.com/c0nclus1on/TinySynth/releases/tag/v0.1.0
