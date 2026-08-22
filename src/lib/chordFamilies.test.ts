import { describe, expect, it } from "vitest";
import { buildChordVariants, CHORD_FAMILIES } from "./chordFamilies";
import { buildDiatonicChords } from "./musicTheory";

describe("chord families", () => {
  const chords = buildDiatonicChords("F#", "Minor");

  it("uses familiar names for chord families", () => {
    expect(CHORD_FAMILIES.map(({ label }) => label)).toEqual([
      "Популярные",
      "Септаккорды",
      "Sus",
      "Добавленные",
    ]);
  });

  it("groups popular in-key variants without duplicating the main chord", () => {
    expect(buildChordVariants(chords[0], "F#", "Minor", "popular").map((chord) => chord.symbol)).toEqual([
      "F#m7",
      "F#sus2",
      "F#sus4",
      "F#7sus4",
      "F#madd9",
    ]);
  });

  it("keeps family filters separate and removes out-of-key variants", () => {
    expect(buildChordVariants(chords[2], "F#", "Minor", "sevenths").map((chord) => chord.symbol)).toEqual(["Amaj7"]);
    expect(buildChordVariants(chords[6], "F#", "Minor", "sus").map((chord) => chord.symbol)).toEqual([
      "Esus2",
      "Esus4",
      "E7sus4",
    ]);
    expect(buildChordVariants(chords[0], "F#", "Minor", "add").map((chord) => chord.symbol)).toEqual(["F#madd9"]);
  });

  it("contains the extended chords used by Wonderwall in the popular family", () => {
    const symbols = chords.flatMap((chord) => buildChordVariants(chord, "F#", "Minor", "popular").map((variant) => variant.symbol));
    expect(symbols).toEqual(expect.arrayContaining(["F#m7", "Esus4", "B7sus4"]));
  });
});
