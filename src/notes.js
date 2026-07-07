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

// Computer-keyboard piano layout (a virtual-piano style mapping). Each entry
// is a semitone offset from the current base note. Two rows of the QWERTY
// keyboard form ~1.5 octaves; Z / X shift the octave (handled in main.js).
export const KEY_LAYOUT = [
  { key: 'a', semi: 0 },  { key: 'w', semi: 1 },  { key: 's', semi: 2 },
  { key: 'e', semi: 3 },  { key: 'd', semi: 4 },  { key: 'f', semi: 5 },
  { key: 't', semi: 6 },  { key: 'g', semi: 7 },  { key: 'y', semi: 8 },
  { key: 'h', semi: 9 },  { key: 'u', semi: 10 }, { key: 'j', semi: 11 },
  { key: 'k', semi: 12 }, { key: 'o', semi: 13 }, { key: 'l', semi: 14 },
  { key: 'p', semi: 15 }, { key: ';', semi: 16 },
];

// Number of semitones the on-screen keyboard spans (matches KEY_LAYOUT).
export const KEY_SPAN = 17;
