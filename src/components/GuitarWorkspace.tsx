import type { FretRange, GuitarVoicing, ScaleMode } from "../types/music";
import { GuitarChordDiagram } from "./GuitarChordDiagram";
import { GuitarFretboard } from "./GuitarFretboard";

type Props = {
  chordSymbol: string;
  keyRoot: string;
  scaleMode: ScaleMode;
  fretRange: FretRange;
  voicing?: GuitarVoicing;
  isPreview: boolean;
};

export function GuitarWorkspace({ chordSymbol, fretRange, isPreview, keyRoot, scaleMode, voicing }: Props) {
  return (
    <section className={`panel guitar-workspace ${isPreview ? "previewing" : ""}`}>
      <div className="panel-heading">
        <h2>{isPreview ? `Preview: ${chordSymbol}` : `Guitar: ${chordSymbol}`}</h2>
        <small>{voicing?.frets.join("") ?? "choose a position"}</small>
      </div>
      <div className="guitar-workspace-grid">
        <GuitarChordDiagram bare voicing={voicing} />
        <GuitarFretboard bare chordSymbol={chordSymbol} fretRange={fretRange} keyRoot={keyRoot} scaleMode={scaleMode} selectedVoicing={voicing} />
      </div>
    </section>
  );
}
