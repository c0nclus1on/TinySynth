import './style.css';
import { Synth } from './audio/synth.js';
import { createPiano } from './ui/piano.js';
import { buildControls } from './ui/controls.js';
import { KEY_LAYOUT, KEY_SPAN } from './notes.js';

// Standalone app wiring. The Synth engine itself is UI-agnostic and can be
// imported into a host app on its own (see README "Using it as a module").
const synth = new Synth();
let base = 60; // C4
const heldKeys = new Map();     // computer key char -> midi (recorded at press)
const midiRefCount = new Map(); // midi -> how many inputs (keys/mouse) hold it

buildControls(document.getElementById('controls'), synth);

// Ref-counted note gate so overlapping inputs (a seam note reachable from two
// keys, or mouse + keyboard on the same note) don't cut each other off.
function pressMidi(midi) {
  synth.resume();
  const c = midiRefCount.get(midi) || 0;
  if (c === 0) { synth.noteOn(midi); piano.setActive(midi, true); }
  midiRefCount.set(midi, c + 1);
}
function releaseMidi(midi) {
  const c = midiRefCount.get(midi) || 0;
  if (c <= 1) { midiRefCount.delete(midi); synth.noteOff(midi); piano.setActive(midi, false); }
  else midiRefCount.set(midi, c - 1);
}

function hintFor(midi) {
  const entry = KEY_LAYOUT.find((x) => base + x.semi === midi);
  return entry ? entry.key.toUpperCase() : '';
}

const piano = createPiano(document.getElementById('piano'), {
  span: KEY_SPAN,
  hintFor,
  onDown: (midi) => pressMidi(midi),
  onUp: (midi) => releaseMidi(midi),
});
piano.setBase(base);

function setOctave(delta) {
  base = Math.max(36, Math.min(84, base + delta * 12));
  piano.setBase(base);
  document.getElementById('octave').textContent = `Octave: C${Math.floor(base / 12) - 1}`;
}
document.getElementById('octDown').addEventListener('click', () => setOctave(-1));
document.getElementById('octUp').addEventListener('click', () => setOctave(1));

// Drop focus from a select/slider so it stops swallowing note keys.
function blurControl(el) {
  if (el && (el.tagName === 'SELECT' || el.tagName === 'INPUT')) el.blur();
}

window.addEventListener('keydown', (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  const ae = document.activeElement;
  // Only genuine text fields should capture typing (there are none in the UI);
  // sliders and selects must not block playing.
  if (ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && ae.type !== 'range'))) return;
  const onRange = !!ae && ae.tagName === 'INPUT' && ae.type === 'range';
  const key = e.key.toLowerCase();
  // Octave shift on the arrow keys — left to a focused slider so it can still
  // be nudged with the arrows.
  if (!onRange && key === 'arrowup') { e.preventDefault(); setOctave(1); return; }
  if (!onRange && key === 'arrowdown') { e.preventDefault(); setOctave(-1); return; }
  const entry = KEY_LAYOUT.find((x) => x.key === key);
  if (!entry || heldKeys.has(key)) return;
  e.preventDefault();
  blurControl(ae);
  const midi = base + entry.semi;
  pressMidi(midi);
  heldKeys.set(key, midi);
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  const midi = heldKeys.get(key);
  if (midi == null) return;
  heldKeys.delete(key);
  releaseMidi(midi);
});

// Unlock the AudioContext on the first gesture; also panic on blur so no note
// hangs if focus is lost mid-press.
window.addEventListener('pointerdown', () => synth.resume(), { once: true });
window.addEventListener('blur', () => {
  for (const midi of midiRefCount.keys()) piano.setActive(midi, false);
  heldKeys.clear();
  midiRefCount.clear();
  synth.panic();
});
