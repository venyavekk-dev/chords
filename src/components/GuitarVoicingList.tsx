import type { GuitarVoicing } from "../types/music";

type Props = {
  voicings: GuitarVoicing[];
  selected?: GuitarVoicing;
  onSelect: (voicing: GuitarVoicing) => void;
  onPlay: () => void;
};

export function GuitarVoicingList({ voicings, selected, onSelect, onPlay }: Props) {
  return (
    <section className="panel voicing-panel">
      <div className="panel-heading">
        <h2>Voicings</h2>
        <small>{voicings.length} playable options</small>
      </div>
      <div className="voicing-list">
        {voicings.map((voicing) => (
          <button
            className={`voicing-card ${selected?.frets.join("") === voicing.frets.join("") ? "selected" : ""}`}
            key={voicing.frets.join("-")}
            onClick={() => {
              onSelect(voicing);
              onPlay();
            }}
          >
            <div>
              <strong>{voicing.name}</strong>
              <span>{voicing.frets.join("")}</span>
            </div>
            <small>{voicing.difficulty} · root {voicing.root}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
