import { describe, expect, it } from "vitest";
import { generateVoicings, hasOpenVoicingAtCapo } from "./guitar";

describe("capo open voicings", () => {
  it("uses the capo as a new nut while keeping the sounding chord name", () => {
    const [voicing] = generateVoicings("E", 4);

    expect(voicing.frets).toEqual(["x", 7, 6, 4, 5, 4]);
    expect(voicing.root).toBe("E");
    expect(new Set(voicing.notes)).toEqual(new Set(["E", "G#", "B"]));
    expect(generateVoicings("E", 4).length).toBeGreaterThan(1);
  });

  it("maps the E major key to playable open-position shapes at capo four", () => {
    expect(generateVoicings("F#m", 4)[0].frets).toEqual(["x", "x", 4, 6, 7, 5]);
    expect(generateVoicings("G#m", 4)[0].frets).toEqual([4, 6, 6, 4, 4, 4]);
    expect(generateVoicings("A", 4)[0].frets).toEqual([5, 7, 7, 6, 5, 5]);
    expect(generateVoicings("B", 4)[0].frets).toEqual([7, 6, 4, 4, 4, 7]);
    expect(generateVoicings("C#m", 4)[0].frets).toEqual(["x", 4, 6, 6, 5, 4]);
    expect(generateVoicings("D#dim", 4).length).toBeGreaterThan(0);
  });

  it("falls back to playable positions farther up the neck", () => {
    expect(hasOpenVoicingAtCapo("C", 4)).toBe(false);
    expect(generateVoicings("C", 4).length).toBeGreaterThan(0);
  });

  it("keeps every chord in C major playable with capo three", () => {
    expect(generateVoicings("Dm", 3)[0].frets).toEqual(["x", 5, 7, 7, 6, 5]);

    for (const symbol of ["C", "Dm", "Em", "F", "G", "Am", "Bdim"]) {
      const voicings = generateVoicings(symbol, 3);
      expect(voicings.length).toBeGreaterThan(0);
      expect(voicings.every((voicing) => voicing.frets.every((fret) => fret === "x" || fret >= 3))).toBe(true);
    }
  });

  it("keeps the capo-open voicing first and sorts later positions by fret", () => {
    const cVoicings = generateVoicings("C", 3);
    expect(cVoicings[0].frets).toEqual(["x", 3, 5, 5, 5, 3]);
    expect(cVoicings.slice(1).map((voicing) => voicing.startFret)).toEqual(
      [...cVoicings.slice(1).map((voicing) => voicing.startFret)].sort((a, b) => a - b),
    );

    const emPositions = generateVoicings("Em", 3).map((voicing) => voicing.startFret);
    expect(emPositions).toEqual([...emPositions].sort((a, b) => a - b));
  });

  it("keeps the existing full voicing generator when no capo is selected", () => {
    expect(generateVoicings("E")[0].frets).toEqual([0, 2, 2, 1, 0, 0]);
  });
});
