# TinySynth

A tiny **polyphonic** web synthesizer — a proof of concept built directly on the
Web Audio API, with **no runtime dependencies**. Play it with your computer
keyboard or the on-screen keys.

> Sibling project to Simple Soundboard, sharing the same Vanilla JS + Vite
> foundation.

## Features (proof of concept)

- **Polyphony** — hold chords; every note gets its own voice.
- **Two oscillators** — 4 waveforms each (sine / saw / square / triangle), with
  the second oscillator detunable for a fatter sound.
- **Low-pass filter** — cutoff (logarithmic) + resonance.
- **ADSR amp envelope** — attack, decay, sustain, release.
- **LFO** — sine/tri/square/saw, with rate, depth, and a destination switch
  (off / pitch vibrato / filter wobble).
- **Master volume** with a limiter on the output to tame chord peaks.
- **Play it** with the computer keyboard (`A W S E D F …`, a virtual-piano
  layout), `Z` / `X` to shift octave, or click/tap the on-screen keys.

Signal path per voice: `osc1 + osc2 → low-pass filter → amp (ADSR) → master`.
Master bus: `master gain → limiter → output`.

## Getting started

```bash
npm install
npm run dev        # dev server on http://localhost:5191/
npm run build      # static bundle in dist/
npm run preview    # serve the built bundle
```

> Serve over `http(s)://` (dev server or any static host) — audio needs a real
> origin, and the AudioContext starts on your first key/click.

## Using it as a module

The synth **engine** (`src/audio/synth.js`) has no DOM dependencies and is built
to drop into a larger app (this is deliberate — TinySynth may become a module in
something bigger). It can create its own `AudioContext` or share a host's, and
connect into an existing audio graph:

```js
import { Synth } from './audio/synth.js';

// Standalone (creates its own AudioContext):
const synth = new Synth();
synth.noteOn(60);            // middle C
synth.set('filter.cutoff', 1200);
synth.noteOff(60);

// Embedded in a host graph (shares context, routes into a host node):
const synth = new Synth({ context: hostCtx, output: hostBusInput });
// ...or grab the output yourself:
const s = new Synth({ context: hostCtx });
s.output.connect(hostBusInput);

synth.panic();               // silence all voices
synth.dispose();             // tear down (closes the context only if it made it)
```

### Engine API

| Method / prop | Purpose |
|---|---|
| `new Synth({ context?, output?, params? })` | Create; optionally share a context / output node / initial params |
| `noteOn(midi)` / `noteOff(midi)` | Trigger / release a note (MIDI number) |
| `set(path, value)` | Update a parameter by dotted path (e.g. `'env.a'`, `'lfo.dest'`) |
| `params` | The current parameter tree (see `DEFAULT_PARAMS`) |
| `output` | The synth's output `AudioNode` (a limiter) |
| `resume()` | Resume the AudioContext (call from a user gesture) |
| `panic()` | Immediately stop all voices |
| `dispose()` | Release nodes; closes the context only if the synth created it |

The UI layer (`ui/piano.js`, `ui/controls.js`) is likewise standalone and
engine-agnostic, so a host can keep the engine and supply its own interface.

## Project layout

```
index.html
src/
  main.js            standalone app wiring (keyboard, octave, glue)
  style.css          theme, control panels, on-screen piano
  notes.js           MIDI/frequency helpers + computer-key layout
  audio/synth.js     the engine — polyphonic voices, filter, ADSR, LFO (no DOM)
  ui/piano.js        on-screen keyboard (render + input, engine-agnostic)
  ui/controls.js     control panels bound to synth.set()
```

## Roadmap ideas

- Sequencer / arpeggiator and looping (a good moment to adopt Tone.js for timing).
- Effects (delay, reverb) and a second filter envelope.
- Savable/loadable presets.
- Web MIDI input for hardware controllers.

## License

MIT
