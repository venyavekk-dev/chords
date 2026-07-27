import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Instrument, ScaleMode, SoundPreset } from "../types/music";
import { NOTES } from "../lib/musicTheory";
import { SOUND_PRESETS } from "../lib/audio";
import { formatTrialRemaining } from "../lib/trial";

type Props = {
  keyRoot: string;
  scaleMode: ScaleMode;
  instrument: Instrument;
  sound: SoundPreset;
  onboardingOpen: boolean;
  trialRemainingMs: number;
  trialTimerLabel: string;
  volume: number;
  onKeyRoot: (value: string) => void;
  onScaleMode: (value: ScaleMode) => void;
  onInstrument: (value: Instrument) => void;
  onSound: (value: SoundPreset) => void;
  onPlayChord: () => void;
  onToggleOnboarding: () => void;
  onTrialLinkClick: () => void;
  onVolume: (value: number) => void;
  sequencerMode: boolean;
  onToggleSequencer: () => void;
  openChordsMode: boolean;
  onToggleOpenChords: () => void;
};

const DEFAULT_LOGO_SIZE = 34;

export function TopBar(props: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [logoSize, setLogoSize] = useState(DEFAULT_LOGO_SIZE);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const instruments: Instrument[] = ["Guitar", "Piano", "Both"];
  const cycleSound = () => {
    const nextIndex = (SOUND_PRESETS.indexOf(props.sound) + 1) % SOUND_PRESETS.length;
    props.onSound(SOUND_PRESETS[nextIndex]);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f7f5f0" : "#1c1c1c");
  }, [theme]);

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const update = () => setLogoSize(Math.max(DEFAULT_LOGO_SIZE, el.offsetHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="brand-heading">
          <button
            type="button"
            className="brand-logo"
            style={{ height: logoSize }}
            aria-label="Проиграть текущий аккорд"
            onClick={props.onPlayChord}
          >
            <img src="/logo.svg" alt="" style={{ height: logoSize, width: "auto" }} />
          </button>
          <h1 ref={nameRef}><span>Chord Tulza</span> <i>by <a href="https://venyavekk.com/music" target="_blank" rel="noreferrer">Venya Vekk</a></i></h1>
          <button type="button" className="trial-timer-link" onClick={props.onTrialLinkClick}>
            {props.trialTimerLabel} {formatTrialRemaining(props.trialRemainingMs)}
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
            className={`onboarding-toggle sequencer-toggle ${props.sequencerMode ? "active" : ""}`}
            aria-pressed={props.sequencerMode}
            onClick={props.onToggleSequencer}
          >
            <span className="onboarding-switch" aria-hidden="true"><i /></span>
            Секвенсор
          </button>
          <button
            type="button"
            className={`onboarding-toggle open-chords-toggle ${props.openChordsMode ? "active" : ""}`}
            aria-pressed={props.openChordsMode}
            onClick={props.onToggleOpenChords}
          >
            <span className="onboarding-switch" aria-hidden="true"><i /></span>
            Открытые аккорды
          </button>
          <button
            type="button"
            className={`onboarding-toggle theme-toggle ${theme === "light" ? "active" : ""}`}
            aria-pressed={theme === "light"}
            onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
          >
            <span className="onboarding-switch theme-switch" aria-hidden="true">
              <Sun size={8} className="theme-icon theme-icon-sun" />
              <Moon size={8} className="theme-icon theme-icon-moon" />
              <i />
            </span>
            Тема
          </button>
          <button
            type="button"
            className={`onboarding-toggle settings-toggle ${settingsOpen ? "active" : ""}`}
            aria-pressed={settingsOpen}
            aria-expanded={settingsOpen}
            aria-controls="workspace-settings"
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <span className="onboarding-switch" aria-hidden="true"><i /></span>
            Настройки
          </button>
        </div>
      </header>
      <div className={`settings-panel ${settingsOpen ? "is-open" : ""}`} id="workspace-settings" inert={!settingsOpen}>
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
          <fieldset className="control-group volume-control">
            <legend>Volume</legend>
            <div className="volume-slider-track">
              <div className="volume-slider-fill" style={{ width: `${Math.round(props.volume * 100)}%` }} />
              <input
                aria-label="Volume"
                className="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={props.volume}
                onChange={(event) => props.onVolume(Number(event.target.value))}
              />
              <span className="volume-slider-value">{Math.round(props.volume * 100)}%</span>
            </div>
          </fieldset>
          <fieldset className="control-group sound-control">
            <legend>Sound</legend>
            <button type="button" className="sound-cycle" onClick={cycleSound}>
              <i aria-hidden="true" className={`sound-dot sound-dot-${props.sound.toLowerCase()}`} />
              {props.sound}
            </button>
          </fieldset>
        </div>
      </div>
    </>
  );
}
