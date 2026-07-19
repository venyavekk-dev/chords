import type { DegreeChord } from "../types/music";
import { parseChord } from "../lib/musicTheory";
import { Volume2 } from "lucide-react";

type Props = {
  chord: DegreeChord;
  onPlay: () => void;
};

export function ActiveChordPanel({ chord, onPlay }: Props) {
  const parsed = parseChord(chord.symbol);
  return (
    <aside className="panel active-panel">
      <div className="active-title">
        <div>
          <span className="eyebrow">Active chord</span>
          <h1>{chord.symbol}</h1>
        </div>
        <button className="sound-button" onClick={onPlay} title="Play chord">
          <Volume2 size={22} />
        </button>
      </div>
      <div className="tone-list">
        {parsed.tones.map((tone) => <span className={tone === parsed.root ? "root-tone" : ""} key={tone}>{tone}</span>)}
      </div>
      <dl>
        <div><dt>Degree</dt><dd>{chord.degree}</dd></div>
        <div><dt>Function</dt><dd>{chord.functionName}</dd></div>
        <div><dt>Quality</dt><dd>{chord.quality}</dd></div>
      </dl>
    </aside>
  );
}
