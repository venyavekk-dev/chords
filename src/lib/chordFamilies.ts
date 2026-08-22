import type { DegreeChord, ScaleMode } from "../types/music";
import { buildScale, parseChord } from "./musicTheory";

export function buildChordVariants(
  chord: DegreeChord,
  keyRoot: string,
  mode: ScaleMode,
): DegreeChord[] {
  const scaleNotes = new Set(buildScale(keyRoot, mode));
  const popularSuffixes = [
    diatonicSeventhSuffix(chord, mode),
    "sus2",
    "sus4",
    "7sus4",
    chord.quality === "minor" ? "madd9" : "add9",
  ];
  const suffixes = [
    ...popularSuffixes,
    "7",
    "maj7",
    "m7",
    "mMaj7",
    "dim7",
    "m7b5",
    "add9",
    "madd9",
  ];

  return suffixes
    .map((suffix) => `${chord.root}${suffix}`)
    .filter((symbol, index, all) => all.indexOf(symbol) === index)
    .filter((symbol) => parseChord(symbol).tones.every((tone) => scaleNotes.has(tone)))
    .map((symbol) => ({ ...chord, symbol }));
}

function diatonicSeventhSuffix(chord: DegreeChord, mode: ScaleMode) {
  const cleanDegree = chord.degree.replace("°", "");
  if (chord.quality === "diminished") return "m7b5";
  if (chord.quality === "minor") return "m7";
  if ((mode === "Major" && cleanDegree === "V") || (mode === "Minor" && cleanDegree === "VII")) return "7";
  return "maj7";
}
