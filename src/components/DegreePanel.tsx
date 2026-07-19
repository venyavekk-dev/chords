import type { DegreeChord, GuitarVoicing } from "../types/music";

type Props = {
  chords: DegreeChord[];
  active: string;
  onSelect: (chord: DegreeChord) => void;
  onAdd: (chord: DegreeChord) => void;
  onPreview: (chord?: DegreeChord) => void;
  selectedVoicing?: GuitarVoicing;
  voicings: GuitarVoicing[];
  onVoicingSelect: (voicing: GuitarVoicing) => void;
};

export function DegreePanel({ chords, active, onSelect, onAdd, onPreview, onVoicingSelect, selectedVoicing, voicings }: Props) {
  return (
    <section className="panel degree-panel">
      <div className="panel-heading">
        <h2>Chord & position</h2>
        <small>Hover previews, click plays</small>
      </div>
      <div className="degree-grid">
        {chords.map((chord) => (
          <button
            key={chord.degree}
            className={`degree-card ${active === chord.symbol ? "selected" : ""}`}
            onClick={() => onSelect(chord)}
            onDoubleClick={() => onAdd(chord)}
            onMouseEnter={() => onPreview(chord)}
            onMouseLeave={() => onPreview(undefined)}
            title={`${chord.symbol}: ${chord.root}, ${chord.quality}, ${chord.functionName}`}
          >
            <span>{chord.degree}</span>
            <strong>{chord.symbol}</strong>
            <small>{chord.quality}</small>
          </button>
        ))}
      </div>
      <div className="inline-voicings">
        <div className="subheading">
          <strong>Positions</strong>
          <span>{voicings.length} shapes</span>
        </div>
        {voicings.map((voicing) => (
          <button
            className={`inline-voicing ${selectedVoicing?.frets.join("") === voicing.frets.join("") ? "selected" : ""}`}
            key={voicing.frets.join("-")}
            onClick={() => onVoicingSelect(voicing)}
          >
            <strong>{voicing.frets.join("")}</strong>
            <span>{voicing.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
