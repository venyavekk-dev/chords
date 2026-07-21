import type { Instrument, ProgressionItem, ScaleMode, SoundPreset } from "../types/music";

const KEY = "chord-workspace-state-v1";

export type StoredState = {
  keyRoot: string;
  scaleMode: ScaleMode;
  instrument?: Instrument;
  progression: ProgressionItem[];
  volume?: number;
  sound?: SoundPreset;
  voicingMemory?: Record<string, string>;
};

export function loadState(): Partial<StoredState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<StoredState>;
  } catch {
    return {};
  }
}

export function saveState(state: StoredState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
