import { describe, expect, it } from "vitest";
import { generateVoicings, hasOpenVoicingAtCapo } from "./guitar";

describe("capo open voicings", () => {
  it("uses the capo as a new nut while keeping the sounding chord name", () => {
    const [voicing] = generateVoicings("E", 4);

    expect(voicing.frets).toEqual(["x", 7, 6, 4, 5, 4]);
    expect(voicing.root).toBe("E");
    expect(new Set(voicing.notes)).toEqual(new Set(["E", "G#", "B"]));
  });

  it("maps the E major key to playable open-position shapes at capo four", () => {
    expect(generateVoicings("F#m", 4)[0].frets).toEqual(["x", "x", 4, 6, 7, 5]);
    expect(generateVoicings("G#m", 4)[0].frets).toEqual([4, 6, 6, 4, 4, 4]);
    expect(generateVoicings("A", 4)[0].frets).toEqual([5, 7, 7, 6, 5, 5]);
    expect(generateVoicings("B", 4)[0].frets).toEqual([7, 6, 4, 4, 4, 7]);
    expect(generateVoicings("C#m", 4)[0].frets).toEqual(["x", 4, 6, 6, 5, 4]);
    expect(generateVoicings("D#dim", 4)).toEqual([]);
  });

  it("reports chords without a matching open-position shape as unavailable", () => {
    expect(hasOpenVoicingAtCapo("C", 4)).toBe(false);
    expect(generateVoicings("C", 4)).toEqual([]);
  });

  it("keeps the existing full voicing generator when no capo is selected", () => {
    expect(generateVoicings("E")[0].frets).toEqual([0, 2, 2, 1, 0, 0]);
  });
});
