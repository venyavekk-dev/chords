export type DesignSkin = "classic" | "akai" | "korg" | "juno";
export type ScaleMode = "Major" | "Minor";
export type Instrument = "Guitar" | "Piano" | "Both";
export type SoundPreset = "Velvet" | "Clean" | "Glass" | "Nylon" | "Air";
export type ViewMode = "Chords" | "Guitar" | "Piano" | "Progression" | "Explore";
export type ChordFilter = "Triads" | "Sus" | "Sevenths" | "All";
export type FretRange = "0-5" | "5-9" | "9-12" | "All";
export type Difficulty = "easy" | "medium" | "hard";

export type DegreeChord = {
  degree: string;
  root: string;
  quality: "major" | "minor" | "diminished";
  symbol: string;
  functionName: "tonic" | "subdominant" | "dominant" | "color";
};

export type ChordDefinition = {
  symbol: string;
  root: string;
  suffix: string;
  tones: string[];
  type: string;
};

export type ProgressionItem = {
  id: string;
  degree: string;
  symbol: string;
};

export type GuitarVoicing = {
  name: string;
  frets: Array<number | "x">;
  notes: string[];
  root: string;
  startFret: number;
  difficulty: Difficulty;
};

export type PianoKey = {
  note: string;
  octave: number;
  midi: number;
  isBlack: boolean;
};
