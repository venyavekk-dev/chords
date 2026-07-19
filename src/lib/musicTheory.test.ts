import { describe, expect, it } from "vitest";
import { buildDiatonicChords, buildScale } from "./musicTheory";

describe("music theory", () => {
  it("builds major and minor scales", () => {
    expect(buildScale("C", "Major")).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    expect(buildScale("E", "Major")).toEqual(["E", "F#", "G#", "A", "B", "C#", "D#"]);
    expect(buildScale("A", "Minor")).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
  });

  it("builds E Major chords", () => {
    expect(buildDiatonicChords("E", "Major").map((chord) => `${chord.degree} ${chord.symbol}`)).toEqual([
      "I E",
      "ii F#m",
      "iii G#m",
      "IV A",
      "V B",
      "vi C#m",
      "vii° D#dim",
    ]);
  });

  it("builds A Minor chords", () => {
    expect(buildDiatonicChords("A", "Minor").map((chord) => `${chord.degree} ${chord.symbol}`)).toEqual([
      "i Am",
      "ii° Bdim",
      "III C",
      "iv Dm",
      "v Em",
      "VI F",
      "VII G",
    ]);
  });
});
