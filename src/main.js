import './style.css';
import { Synth } from './audio/synth.js';
import { createPiano } from './ui/piano.js';
import { buildControls } from './ui/controls.js';
import { KEY_LAYOUT, KEY_SPAN } from './notes.js';

// Standalone app wiring. The Synth engine itself is UI-agnostic and can be
// imported into a host app on its own (see README "Using it as a module").
const synth = new Synth();
let base = 60; // C4
const heldKeys = new Map(); // computer key char -> midi (recorded at press time)

buildControls(document.getElementById('controls'), synth);

function hintFor(midi) {
  const entry = KEY_LAYOUT.find((x) => base + x.semi === midi);
  return entry ? entry.key.toUpperCase() : '';
}

const piano = createPiano(document.getElementById('piano'), {
  span: KEY_SPAN,
  hintFor,
  onDown: (midi) => { synth.resume(); synth.noteOn(midi); piano.setActive(midi, true); },
  onUp: (midi) => { synth.noteOff(midi); piano.setActive(midi, false); },
});
piano.setBase(base);

function setOctave(delta) {
  base = Math.max(24, Math.min(96, base + delta * 12));
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
  const key = e.key.toLowerCase();
  if (key === 'z') { e.preventDefault(); blurControl(ae); setOctave(-1); return; }
  if (key === 'x') { e.preventDefault(); blurControl(ae); setOctave(1); return; }
  const entry = KEY_LAYOUT.find((x) => x.key === key);
  if (!entry || heldKeys.has(key)) return;
  e.preventDefault();
  blurControl(ae);
  const midi = base + entry.semi;
  synth.resume();
  synth.noteOn(midi);
  piano.setActive(midi, true);
  heldKeys.set(key, midi);
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  const midi = heldKeys.get(key);
  if (midi == null) return;
  heldKeys.delete(key);
  synth.noteOff(midi);
  piano.setActive(midi, false);
});

// Unlock the AudioContext on the first gesture; also panic on blur so no note
// hangs if focus is lost mid-press.
window.addEventListener('pointerdown', () => synth.resume(), { once: true });
window.addEventListener('blur', () => { heldKeys.clear(); synth.panic(); });
