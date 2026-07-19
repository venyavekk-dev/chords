import type { Instrument, ScaleMode } from "../types/music";
import { NOTES } from "../lib/musicTheory";

type Props = {
  keyRoot: string;
  scaleMode: ScaleMode;
  instrument: Instrument;
  volume: number;
  onKeyRoot: (value: string) => void;
  onScaleMode: (value: ScaleMode) => void;
  onInstrument: (value: Instrument) => void;
  onVolume: (value: number) => void;
};

export function TopBar(props: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">CW</span>
        <div>
          <strong>Chord Workspace</strong>
          <small>{props.keyRoot} {props.scaleMode}</small>
        </div>
      </div>
      <label>
        Key
        <select value={props.keyRoot} onChange={(event) => props.onKeyRoot(event.target.value)}>
          {NOTES.map((note) => <option key={note}>{note}</option>)}
        </select>
      </label>
      <label>
        Scale
        <select value={props.scaleMode} onChange={(event) => props.onScaleMode(event.target.value as ScaleMode)}>
          <option>Major</option>
          <option>Minor</option>
        </select>
      </label>
      <label>
        Instrument
        <select value={props.instrument} onChange={(event) => props.onInstrument(event.target.value as Instrument)}>
          <option>Guitar</option>
          <option>Piano</option>
          <option>Both</option>
        </select>
      </label>
      <label>
        Volume
        <input className="volume-slider" type="range" min="0" max="1" step="0.01" value={props.volume} onChange={(event) => props.onVolume(Number(event.target.value))} />
      </label>
    </header>
  );
}
