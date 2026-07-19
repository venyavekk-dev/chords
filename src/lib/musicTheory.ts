import type { ChordDefinition, DegreeChord, ScaleMode } from "../types/music";

export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export type NoteName = (typeof NOTES)[number];

const ENHARMONIC: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
  "E#": "F",
  "B#": "C",
  Cb: "B",
  Fb: "E",
};

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

const MAJOR_DEGREES = [
  ["I", "major", ""],
  ["ii", "minor", "m"],
  ["iii", "minor", "m"],
  ["IV", "major", ""],
  ["V", "major", ""],
  ["vi", "minor", "m"],
  ["vii°", "diminished", "dim"],
] as const;

const MINOR_DEGREES = [
  ["i", "minor", "m"],
  ["ii°", "diminished", "dim"],
  ["III", "major", ""],
  ["iv", "minor", "m"],
  ["v", "minor", "m"],
  ["VI", "major", ""],
  ["VII", "major", ""],
] as const;

const CHORD_INTERVALS: Record<string, number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  dim: [0, 3, 6],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  add9: [0, 4, 7, 14],
};

export function normalizeNote(note: string): string {
  return ENHARMONIC[note] ?? note;
}

export function transpose(note: string, semitones: number): string {
  const normalized = normalizeNote(note);
  const index = NOTES.indexOf(normalized as NoteName);
  if (index < 0) throw new Error(`Unknown note: ${note}`);
  return NOTES[(index + semitones + 120) % 12];
}

export function buildScale(root: string, mode: ScaleMode): string[] {
  const intervals = mode === "Major" ? MAJOR_INTERVALS : MINOR_INTERVALS;
  return intervals.map((interval) => transpose(root, interval));
}

export function buildDiatonicChords(root: string, mode: ScaleMode): DegreeChord[] {
  const scale = buildScale(root, mode);
  const pattern = mode === "Major" ? MAJOR_DEGREES : MINOR_DEGREES;
  return scale.map((note, index) => {
    const [degree, quality, suffix] = pattern[index];
    return {
      degree,
      root: note,
      quality,
      symbol: `${note}${suffix}`,
      functionName: degreeFunction(index),
    };
  });
}

export function parseChord(symbol: string): ChordDefinition {
  const match = symbol.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) throw new Error(`Cannot parse chord: ${symbol}`);
  const root = normalizeNote(match[1]);
  const suffix = match[2] || "";
  if (!(suffix in CHORD_INTERVALS)) throw new Error(`Unsupported chord quality: ${symbol}`);
  return {
    symbol: `${root}${suffix}`,
    root,
    suffix,
    tones: CHORD_INTERVALS[suffix].map((interval) => transpose(root, interval)),
    type: suffix || "major",
  };
}

export function buildPalette(root: string, mode: ScaleMode) {
  const degrees = buildDiatonicChords(root, mode);
  return {
    sus2: degrees.map((chord) => ({ ...chord, symbol: `${chord.root}sus2` })),
    triads: degrees,
    sus4: degrees.map((chord) => ({ ...chord, symbol: `${chord.root}sus4` })),
    sevenths: degrees.map((chord, index) => {
      const suffix = chord.quality === "diminished" ? "m7b5" : chord.quality === "minor" ? "m7" : dominantDegree(mode, index) ? "7" : "maj7";
      return { ...chord, symbol: `${chord.root}${suffix}` };
    }),
  };
}

export function chordForDegree(root: string, mode: ScaleMode, degree: string): DegreeChord | undefined {
  return buildDiatonicChords(root, mode).find((chord) => chord.degree.replace("°", "") === degree.replace("°", ""));
}

function degreeFunction(index: number): DegreeChord["functionName"] {
  if ([0, 2, 5].includes(index)) return "tonic";
  if ([1, 3].includes(index)) return "subdominant";
  if ([4, 6].includes(index)) return "dominant";
  return "color";
}

function dominantDegree(mode: ScaleMode, index: number): boolean {
  return mode === "Major" ? index === 4 : index === 6;
}
