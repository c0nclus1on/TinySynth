export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// MIDI note number -> frequency in Hz (A4 = MIDI 69 = 440 Hz).
export function mtof(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

// MIDI note number -> name with octave, e.g. 60 -> "C4".
export function noteName(m) {
  return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
}

export function isBlack(m) {
  return NOTE_NAMES[((m % 12) + 12) % 12].includes('#');
}

// Computer-keyboard layout. Every key on the home row and the top QWERTY row
// plays a note, ascending chromatically left -> right: the home row is the
// lower octave and the top row the octave above it. Z / X shift the octave
// (handled in main.js).
export const KEY_LAYOUT = [
  // home row — lower octave (C .. A#)
  { key: 'a', semi: 0 },  { key: 's', semi: 1 },  { key: 'd', semi: 2 },
  { key: 'f', semi: 3 },  { key: 'g', semi: 4 },  { key: 'h', semi: 5 },
  { key: 'j', semi: 6 },  { key: 'k', semi: 7 },  { key: 'l', semi: 8 },
  { key: ';', semi: 9 },  { key: "'", semi: 10 },
  // top row — upper octave (B .. A#)
  { key: 'q', semi: 11 }, { key: 'w', semi: 12 }, { key: 'e', semi: 13 },
  { key: 'r', semi: 14 }, { key: 't', semi: 15 }, { key: 'y', semi: 16 },
  { key: 'u', semi: 17 }, { key: 'i', semi: 18 }, { key: 'o', semi: 19 },
  { key: 'p', semi: 20 }, { key: '[', semi: 21 }, { key: ']', semi: 22 },
];

// Semitones the on-screen keyboard spans — a little past the last mapped key
// so the keyboard ends on a natural (white) note.
export const KEY_SPAN = 24;
