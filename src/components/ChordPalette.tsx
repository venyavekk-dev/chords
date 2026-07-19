import type { ChordFilter, DegreeChord } from "../types/music";
import { parseChord } from "../lib/musicTheory";

type Row = "sus2" | "triads" | "sus4" | "sevenths";

type Props = {
  palette: Record<Row, DegreeChord[]>;
  filter: ChordFilter;
  active: string;
  onSelect: (chord: DegreeChord) => void;
  onAdd: (chord: DegreeChord) => void;
  onPreview: (chord?: DegreeChord) => void;
};

const rows: Array<{ key: Row; label: string }> = [
  { key: "sus2", label: "sus2" },
  { key: "triads", label: "triads" },
  { key: "sus4", label: "sus4" },
  { key: "sevenths", label: "sevenths" },
];

export function ChordPalette({ palette, filter, active, onSelect, onAdd, onPreview }: Props) {
  const visible = rows.filter((row) => filter === "All" || (filter === "Triads" && row.key === "triads") || (filter === "Sus" && row.key.startsWith("sus")) || (filter === "Sevenths" && row.key === "sevenths"));
  return (
    <section className="panel palette-panel">
      <div className="panel-heading">
        <h2>Chord palette</h2>
        <small>Click to inspect, double-click to add</small>
      </div>
      <div className="palette">
        {visible.map((row) => (
          <div className="palette-row" key={row.key}>
            <div className="row-label">{row.label}</div>
            {palette[row.key].map((chord) => (
              <button
                key={`${row.key}-${chord.degree}`}
                className={`chord-pill ${active === chord.symbol ? "selected" : ""}`}
                onClick={() => onSelect(chord)}
                onDoubleClick={() => onAdd(chord)}
                onMouseEnter={() => onPreview(chord)}
                onMouseLeave={() => onPreview(undefined)}
                title={parseChord(chord.symbol).tones.join(" - ")}
              >
                <span>{chord.degree}</span>
                <strong>{chord.symbol}</strong>
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
