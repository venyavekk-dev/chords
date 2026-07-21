import type { Instrument, ScaleMode, SoundPreset } from "../types/music";
import { NOTES } from "../lib/musicTheory";

type Props = {
  keyRoot: string;
  scaleMode: ScaleMode;
  instrument: Instrument;
  sound: SoundPreset;
  onboardingOpen: boolean;
  volume: number;
  onKeyRoot: (value: string) => void;
  onScaleMode: (value: ScaleMode) => void;
  onInstrument: (value: Instrument) => void;
  onSound: (value: SoundPreset) => void;
  onToggleOnboarding: () => void;
  onVolume: (value: number) => void;
};

export function TopBar(props: Props) {
  const instruments: Instrument[] = ["Guitar", "Piano", "Both"];
  const sounds: SoundPreset[] = ["Velvet", "Clean", "Glass", "Nylon", "Air"];

  return (
    <header className="topbar">
      <div className="brand">
        <img src="/logo.svg" alt="" width="56" height="34" />
        <div className="brand-title-row">
          <h1><span>Chord Tulza</span> <i>by Venya Vekk</i></h1>
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
        </div>
      </div>
      <div className="control-grid" aria-label="Workspace settings">
        <fieldset className="control-group key-control">
          <legend>Key</legend>
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
          <legend>Sound <span>tap to preview</span></legend>
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
      </div>
    </header>
  );
}
