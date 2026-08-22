import { describe, expect, it } from "vitest";
import { buildChordVariants } from "./chordFamilies";
import { buildDiatonicChords } from "./musicTheory";

describe("chord families", () => {
  const chords = buildDiatonicChords("F#", "Minor");

  it("shows compatible variants from every family without duplicating chords", () => {
    expect(buildChordVariants(chords[0], "F#", "Minor").map((chord) => chord.symbol)).toEqual([
      "F#m7",
      "F#sus2",
      "F#sus4",
      "F#7sus4",
      "F#madd9",
    ]);
  });

  it("keeps variants in the selected key", () => {
    expect(buildChordVariants(chords[2], "F#", "Minor").map((chord) => chord.symbol)).toEqual([
      "Amaj7",
      "Asus2",
      "Asus4",
      "Aadd9",
    ]);
    expect(buildChordVariants(chords[6], "F#", "Minor").map((chord) => chord.symbol)).toEqual([
      "E7",
      "Esus2",
      "Esus4",
      "E7sus4",
      "Eadd9",
    ]);
  });

  it("contains the extended chords used by Wonderwall", () => {
    const symbols = chords.flatMap((chord) => buildChordVariants(chord, "F#", "Minor").map((variant) => variant.symbol));
    expect(symbols).toEqual(expect.arrayContaining(["F#m7", "Esus4", "B7sus4"]));
  });
});
