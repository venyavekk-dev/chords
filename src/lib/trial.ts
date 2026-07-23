const KEY = "chord-trial-state-v1";

export const TRIAL_MS = 5 * 60 * 1000;

export type TrialState = {
  startedAt: number;
  locked: boolean;
};

export function loadTrial(): TrialState {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<TrialState> | null;
    if (parsed && typeof parsed.startedAt === "number") {
      return { startedAt: parsed.startedAt, locked: Boolean(parsed.locked) };
    }
  } catch {
    // fall through to a fresh trial
  }
  const fresh: TrialState = { startedAt: Date.now(), locked: false };
  localStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
}

export function saveTrial(state: TrialState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function formatTrialRemaining(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
