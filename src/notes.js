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

// Two-octave "piano" computer-keyboard layout. The letter rows are the natural
// notes and the row above each holds the sharps, like a real piano:
//   lower octave -> Z X C V B N M (naturals) + S D G H J (sharps)
//   upper octave -> Q W E R T Y U (naturals) + 2 3 5 6 7 (sharps)
// A few extra keys reach into the next octave. Semitones are offsets from the
// current base note; the arrow keys shift the octave (handled in main.js).
export const KEY_LAYOUT = [
  // upper octave — naturals on the Q-row, sharps on the number row
  { key: 'q', semi: 12 }, { key: '2', semi: 13 }, { key: 'w', semi: 14 },
  { key: '3', semi: 15 }, { key: 'e', semi: 16 }, { key: 'r', semi: 17 },
  { key: '5', semi: 18 }, { key: 't', semi: 19 }, { key: '6', semi: 20 },
  { key: 'y', semi: 21 }, { key: '7', semi: 22 }, { key: 'u', semi: 23 },
  { key: 'i', semi: 24 }, { key: '9', semi: 25 }, { key: 'o', semi: 26 },
  { key: '0', semi: 27 }, { key: 'p', semi: 28 },
  // lower octave — naturals on the Z-row, sharps on the home row
  { key: 'z', semi: 0 },  { key: 's', semi: 1 },  { key: 'x', semi: 2 },
  { key: 'd', semi: 3 },  { key: 'c', semi: 4 },  { key: 'v', semi: 5 },
  { key: 'g', semi: 6 },  { key: 'b', semi: 7 },  { key: 'h', semi: 8 },
  { key: 'n', semi: 9 },  { key: 'j', semi: 10 }, { key: 'm', semi: 11 },
  { key: ',', semi: 12 }, { key: 'l', semi: 13 }, { key: '.', semi: 14 },
  { key: ';', semi: 15 }, { key: '/', semi: 16 },
];

// Semitones the on-screen keyboard spans (~2.5 octaves), ending on a natural.
export const KEY_SPAN = 29;
