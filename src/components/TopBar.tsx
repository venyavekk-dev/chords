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
        <div>
          <h1>Chord Tulza <i>by Venya Vekk</i></h1>
          <small>{props.keyRoot} {props.scaleMode} · harmony map</small>
        </div>
      </div>
      <div className="control-grid" aria-label="Workspace settings">
        <label>
          <span>Key</span>
          <select value={props.keyRoot} onChange={(event) => props.onKeyRoot(event.target.value)}>
            {NOTES.map((note) => <option key={note}>{note}</option>)}
          </select>
        </label>
        <label>
          <span>Scale</span>
          <select value={props.scaleMode} onChange={(event) => props.onScaleMode(event.target.value as ScaleMode)}>
            <option>Major</option>
            <option>Minor</option>
          </select>
        </label>
        <label>
          <span>Instrument</span>
          <select value={props.instrument} onChange={(event) => props.onInstrument(event.target.value as Instrument)}>
            <option>Guitar</option>
            <option>Piano</option>
            <option>Both</option>
          </select>
        </label>
        <label className="volume-control">
          <span>Volume <output>{Math.round(props.volume * 100)}</output></span>
          <input aria-label="Volume" className="volume-slider" type="range" min="0" max="1" step="0.01" value={props.volume} onChange={(event) => props.onVolume(Number(event.target.value))} />
        </label>
      </div>
    </header>
  );
}
