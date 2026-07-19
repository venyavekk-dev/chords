import type { PianoKey } from "../types/music";
import { NOTES, parseChord, transpose } from "./musicTheory";

const BLACKS = new Set(["C#", "D#", "F#", "G#", "A#"]);

export function buildKeyboard(startOctave = 3, octaves = 3): PianoKey[] {
  const keys: PianoKey[] = [];
  for (let octave = startOctave; octave < startOctave + octaves; octave += 1) {
    NOTES.forEach((note, index) => {
      keys.push({ note, octave, midi: octave * 12 + index, isBlack: BLACKS.has(note) });
    });
  }
  return keys;
}

export function buildInversions(symbol: string): string[][] {
  const tones = parseChord(symbol).tones;
  return tones.map((_, index) => [...tones.slice(index), ...tones.slice(0, index)]);
}

export function notesForInversion(symbol: string, inversion = 0): string[] {
  return buildInversions(symbol)[inversion] ?? parseChord(symbol).tones;
}

export function octaveNotes(notes: string[], baseOctave = 3): Array<{ note: string; octave: number }> {
  let previous = -1;
  let octave = baseOctave;
  return notes.map((note) => {
    const index = NOTES.indexOf(note as (typeof NOTES)[number]);
    if (index <= previous) octave += 1;
    previous = index;
    return { note: transpose(note, 0), octave };
  });
}
