import { useEffect, useState } from "react";
import type { Instrument, ScaleMode, SoundPreset } from "../types/music";
import { NOTES, transpose } from "../lib/musicTheory";

type Props = {
  keyRoot: string;
  scaleMode: ScaleMode;
  instrument: Instrument;
  sound: SoundPreset;
  onboardingOpen: boolean;
  volume: number;
  capoFret: number;
  onKeyRoot: (value: string) => void;
  onScaleMode: (value: ScaleMode) => void;
  onInstrument: (value: Instrument) => void;
  onSound: (value: SoundPreset) => void;
  onPlayChord: () => void;
  onToggleOnboarding: () => void;
  onVolume: (value: number) => void;
};

export function TopBar(props: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const instruments: Instrument[] = ["Guitar", "Piano", "Both"];
  const sounds: SoundPreset[] = ["Velvet", "Clean", "Glass", "Nylon", "Air"];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f7f5f0" : "#1c1c1c");
  }, [theme]);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-heading">
          <button type="button" className="brand-logo" aria-label="Проиграть текущий аккорд" onClick={props.onPlayChord}>
            <img src="/logo.svg" alt="" width="56" height="34" />
          </button>
          <h1><span>Chord Tulza</span> <i>by <a href="https://venyavekk.com/music" target="_blank" rel="noreferrer">Venya Vekk</a></i></h1>
          <button type="button" className="settings-toggle" aria-expanded={settingsOpen} aria-controls="workspace-settings" onClick={() => setSettingsOpen((open) => !open)}>
            Настройки <i aria-hidden="true" />
          </button>
        </div>
        <div className="brand-toggle-stack">
          <button
            type="button"
            className={`onboarding-toggle ${props.onboardingOpen ? "active" : ""}`}
            aria-pressed={props.onboardingOpen}
            aria-expanded={props.onboardingOpen}
            aria-controls="relationship-hint"
            onClick={props.onToggleOnboarding}
          >
            <span className="onboarding-switch" aria-hidden="true"><i /></span>
            Онбординг
          </button>
          <button
            type="button"
            className={`onboarding-toggle theme-toggle ${theme === "light" ? "active" : ""}`}
            aria-pressed={theme === "light"}
            onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
          >
            <span className="onboarding-switch" aria-hidden="true"><i /></span>
            Светлая тема
          </button>
        </div>
      </div>
      {settingsOpen && <div className="control-grid" id="workspace-settings" aria-label="Workspace settings">
        <fieldset className="control-group key-control">
          <legend>
            Key
            {props.capoFret > 0 && <small className="capo-key-hint">звучит как {transpose(props.keyRoot, props.capoFret)}</small>}
          </legend>
          <div className="segmented-control note-toggle">
            {NOTES.map((note) => (
              <button type="button" aria-pressed={props.keyRoot === note} className={props.keyRoot === note ? "active" : ""} key={note} onClick={() => props.onKeyRoot(note)}>{note}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="control-group scale-control">
          <legend>Scale</legend>
          <div className="segmented-control">
            {(["Major", "Minor"] as ScaleMode[]).map((mode) => (
              <button type="button" aria-pressed={props.scaleMode === mode} className={props.scaleMode === mode ? "active" : ""} key={mode} onClick={() => props.onScaleMode(mode)}>{mode}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="control-group instrument-control">
          <legend>Instrument</legend>
          <div className="segmented-control">
            {instruments.map((instrument) => (
              <button type="button" aria-pressed={props.instrument === instrument} className={props.instrument === instrument ? "active" : ""} key={instrument} onClick={() => props.onInstrument(instrument)}>{instrument}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="control-group sound-control">
          <legend>Sound</legend>
          <div className="segmented-control sound-toggle">
            {sounds.map((sound) => (
              <button type="button" aria-pressed={props.sound === sound} className={props.sound === sound ? "active" : ""} key={sound} onClick={() => props.onSound(sound)}>
                <i aria-hidden="true" />{sound}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="volume-control control-group">
          <span>Volume <output>{Math.round(props.volume * 100)}</output></span>
          <input aria-label="Volume" className="volume-slider" type="range" min="0" max="1" step="0.01" value={props.volume} onChange={(event) => props.onVolume(Number(event.target.value))} />
        </label>
      </div>}
    </header>
  );
}
