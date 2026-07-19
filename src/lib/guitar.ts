import type { FretRange, GuitarVoicing } from "../types/music";
import { parseChord, transpose } from "./musicTheory";

export const STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"];
export const DROP_D_TUNING = ["D", "A", "D", "G", "B", "E"];

export function buildFretboard(tuning = STANDARD_TUNING, maxFret = 20) {
  return tuning.map((openNote, stringIndex) => ({
    stringIndex,
    openNote,
    frets: Array.from({ length: maxFret + 1 }, (_, fret) => ({
      fret,
      note: transpose(openNote, fret),
    })),
  }));
}

export function getFretWindow(range: FretRange): [number, number] {
  if (range === "0-5") return [1, 5];
  if (range === "5-9") return [5, 9];
  if (range === "9-12") return [9, 12];
  return [1, 20];
}

export function generateVoicings(symbol: string, tuning = STANDARD_TUNING): GuitarVoicing[] {
  const chord = parseChord(symbol);
  const preferred = buildPreferredVoicings(symbol, tuning);
  const options = tuning.map((openNote) => {
    const frets = Array.from({ length: 13 }, (_, fret) => fret).filter((fret) => chord.tones.includes(transpose(openNote, fret)));
    return ["x" as const, ...frets];
  });

  const candidates: GuitarVoicing[] = [];
  const search = (stringIndex: number, current: Array<number | "x">) => {
    if (stringIndex === tuning.length) {
      const fretted = current.filter((fret): fret is number => typeof fret === "number");
      if (fretted.length < 3) return;
      const sounding = current.map((fret, index) => (fret === "x" ? null : transpose(tuning[index], fret))).filter((note): note is string => Boolean(note));
      if (!chord.tones.every((tone) => sounding.includes(tone))) return;
      const pressed = fretted.filter((fret) => fret > 0);
      const min = pressed.length ? Math.min(...pressed) : 0;
      const max = pressed.length ? Math.max(...pressed) : 0;
      if (max - min > 4) return;
      const mutedInside = current.slice(current.findIndex((fret) => fret !== "x")).filter((fret) => fret === "x").length;
      if (mutedInside > 1) return;
      candidates.push({
        name: voicingName(current, chord.root),
        frets: current,
        notes: sounding,
        root: chord.root,
        startFret: min,
        difficulty: max - min <= 2 && fretted.length <= 5 ? "easy" : max - min <= 3 ? "medium" : "hard",
      });
      return;
    }
    for (const fret of options[stringIndex]) search(stringIndex + 1, [...current, fret]);
  };
  search(0, []);

  const seen = new Set<string>();
  const orderedCandidates = candidates.sort((a, b) => scoreVoicing(a, chord.root, tuning) - scoreVoicing(b, chord.root, tuning));
  return [...preferred, ...orderedCandidates]
    .filter((voicing) => {
      const key = voicing.frets.join("-");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

function scoreVoicing(voicing: GuitarVoicing, root: string, tuning: string[]): number {
  const knownShapeBonus = voicing.name.includes("shape") || voicing.name.includes("barre") || voicing.name.includes("D-shape") ? -14 : 0;
  const fretted = voicing.frets.filter((fret): fret is number => typeof fret === "number");
  const rootBassBonus = voicing.frets.some((fret, index) => fret !== "x" && transpose(tuning[index], fret) === root) ? -4 : 0;
  const openBonus = fretted.filter((fret) => fret === 0).length * -1.5;
  return Math.max(...fretted) + fretted.length + (voicing.difficulty === "hard" ? 8 : 0) + rootBassBonus + openBonus + knownShapeBonus;
}

function voicingName(frets: Array<number | "x">, root: string): string {
  const fretted = frets.filter((fret): fret is number => typeof fret === "number" && fret > 0);
  if (frets.some((fret) => fret === 0)) return `Open ${root} voicing`;
  const start = fretted.length ? Math.min(...fretted) : 0;
  if (fretted.length <= 4) return `${root} compact triad, fret ${start}`;
  return `${root} movable shape, fret ${start}`;
}

function buildPreferredVoicings(symbol: string, tuning: string[]): GuitarVoicing[] {
  if (tuning.join("") !== STANDARD_TUNING.join("")) return [];
  const chord = parseChord(symbol);
  const shapes: Array<{ name: string; frets: Array<number | "x">; difficulty: GuitarVoicing["difficulty"] }> = [];
  const open = openShapes[symbol];
  if (open) shapes.push({ name: `Open ${symbol} shape`, frets: open, difficulty: "easy" });

  if (["", "m"].includes(chord.suffix)) {
    const sixthRootFret = noteFretOnString(chord.root, "E");
    if (sixthRootFret > 0 && sixthRootFret <= 9) {
      shapes.push({
        name: `${chord.root} E-shape barre`,
        frets: chord.suffix === "m"
          ? [sixthRootFret, sixthRootFret + 2, sixthRootFret + 2, sixthRootFret, sixthRootFret, sixthRootFret]
          : [sixthRootFret, sixthRootFret + 2, sixthRootFret + 2, sixthRootFret + 1, sixthRootFret, sixthRootFret],
        difficulty: "medium",
      });
    }

    const fifthRootFret = noteFretOnString(chord.root, "A");
    if (fifthRootFret > 0 && fifthRootFret <= 9) {
      shapes.push({
        name: `${chord.root} A-shape barre`,
        frets: chord.suffix === "m"
          ? ["x", fifthRootFret, fifthRootFret + 2, fifthRootFret + 2, fifthRootFret + 1, fifthRootFret]
          : ["x", fifthRootFret, fifthRootFret + 2, fifthRootFret + 2, fifthRootFret + 2, fifthRootFret],
        difficulty: "medium",
      });
    }

    const fourthRootFret = noteFretOnString(chord.root, "D");
    if (fourthRootFret >= 0 && fourthRootFret <= 9) {
      shapes.push({
        name: `${chord.root} D-shape triad`,
        frets: chord.suffix === "m"
          ? ["x", "x", fourthRootFret, fourthRootFret + 2, fourthRootFret + 3, fourthRootFret + 1]
          : ["x", "x", fourthRootFret, fourthRootFret + 2, fourthRootFret + 3, fourthRootFret + 2],
        difficulty: "easy",
      });
    }
  }

  return shapes
    .filter((shape) => shape.frets.every((fret) => fret === "x" || fret <= 12))
    .map((shape) => {
      const notes = shape.frets.map((fret, index) => (fret === "x" ? null : transpose(STANDARD_TUNING[index], fret))).filter((note): note is string => Boolean(note));
      const pressed = shape.frets.filter((fret): fret is number => typeof fret === "number" && fret > 0);
      return {
        name: shape.name,
        frets: shape.frets,
        notes,
        root: chord.root,
        startFret: pressed.length ? Math.min(...pressed) : 0,
        difficulty: shape.difficulty,
      };
    });
}

function noteFretOnString(note: string, stringNote: string) {
  for (let fret = 0; fret <= 12; fret += 1) {
    if (transpose(stringNote, fret) === note) return fret;
  }
  return -1;
}

const openShapes: Record<string, Array<number | "x">> = {
  C: ["x", 3, 2, 0, 1, 0],
  D: ["x", "x", 0, 2, 3, 2],
  Dm: ["x", "x", 0, 2, 3, 1],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  G: [3, 2, 0, 0, 0, 3],
  A: ["x", 0, 2, 2, 2, 0],
  Am: ["x", 0, 2, 2, 1, 0],
  A7: ["x", 0, 2, 0, 2, 0],
  E7: [0, 2, 0, 1, 0, 0],
  B7: ["x", 2, 1, 2, 0, 2],
};
