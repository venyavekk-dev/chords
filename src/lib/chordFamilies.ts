import type { DegreeChord, ScaleMode } from "../types/music";
import { buildScale, parseChord } from "./musicTheory";

export type ChordFamily = "popular" | "sevenths" | "sus" | "add";

export const CHORD_FAMILIES: Array<{ id: ChordFamily; label: string }> = [
  { id: "popular", label: "Популярные" },
  { id: "sevenths", label: "Септаккорды" },
  { id: "sus", label: "Sus" },
  { id: "add", label: "Добавленные" },
];

export function buildChordVariants(
  chord: DegreeChord,
  keyRoot: string,
  mode: ScaleMode,
  family: ChordFamily,
): DegreeChord[] {
  const scaleNotes = new Set(buildScale(keyRoot, mode));
  const suffixes = suffixesForFamily(chord, mode, family);

  return suffixes
    .map((suffix) => `${chord.root}${suffix}`)
    .filter((symbol, index, all) => all.indexOf(symbol) === index)
    .filter((symbol) => parseChord(symbol).tones.every((tone) => scaleNotes.has(tone)))
    .map((symbol) => ({ ...chord, symbol }));
}

function suffixesForFamily(chord: DegreeChord, mode: ScaleMode, family: ChordFamily): string[] {
  if (family === "sevenths") return ["7", "maj7", "m7", "mMaj7", "dim7", "m7b5"];
  if (family === "sus") return ["sus2", "sus4", "7sus4"];
  if (family === "add") return ["add9", "madd9"];

  return [
    diatonicSeventhSuffix(chord, mode),
    "sus2",
    "sus4",
    "7sus4",
    chord.quality === "minor" ? "madd9" : "add9",
  ];
}

function diatonicSeventhSuffix(chord: DegreeChord, mode: ScaleMode) {
  const cleanDegree = chord.degree.replace("°", "");
  if (chord.quality === "diminished") return "m7b5";
  if (chord.quality === "minor") return "m7";
  if ((mode === "Major" && cleanDegree === "V") || (mode === "Minor" && cleanDegree === "VII")) return "7";
  return "maj7";
}
