import { Fragment } from "react";
import type { GuitarVoicing } from "../types/music";
import { buildFretboard, STANDARD_TUNING } from "../lib/guitar";
import { parseChord, transpose } from "../lib/musicTheory";

type Props = {
  chordSymbol: string;
  voicing?: GuitarVoicing;
  capoFret?: number;
  onCapoChange?: (fret: number) => void;
};

const DISPLAY_FRETS = Array.from({ length: 19 }, (_, index) => index + 1);
const MARKERS = new Set([3, 5, 7, 9, 12, 15, 17, 19]);

export function MinimalFretboard({ chordSymbol, voicing, capoFret = 0, onCapoChange }: Props) {
  const board = buildFretboard(STANDARD_TUNING, 19);
  const root = parseChord(chordSymbol).root;

  return (
    <section className="minimal-fretboard" aria-label="Guitar fretboard">
      <div className="fretboard-scroll" tabIndex={0} aria-label="Scrollable guitar fretboard">
        <div className="fretboard-canvas">
          <div className="fret-marker-row" style={{ gridTemplateColumns: `48px repeat(${DISPLAY_FRETS.length}, 1fr)` }}>
            <div />
            {DISPLAY_FRETS.map((fret) => (
              <div className="fret-marker" key={fret}>{MARKERS.has(fret) && <span />}</div>
            ))}
          </div>
          <div className="fretboard-grid" style={{ gridTemplateColumns: `48px repeat(${DISPLAY_FRETS.length}, 1fr)` }}>
            <div />
            {DISPLAY_FRETS.map((fret) => (
              <button
                type="button"
                className={`fret-number ${fret === capoFret ? "capo-active" : ""}`}
                key={fret}
                aria-pressed={fret === capoFret}
                aria-label={fret === capoFret ? `Снять капо с лада ${fret}` : `Поставить капо на лад ${fret}`}
                onClick={() => onCapoChange?.(fret === capoFret ? 0 : fret)}
              >
                {fret}
              </button>
            ))}
            {board.slice().reverse().map((string) => (
              <Fragment key={string.stringIndex}>
                <div className="string-name">{string.openNote}</div>
                {DISPLAY_FRETS.map((fret) => {
                  const isVoicing = voicing?.frets[string.stringIndex] === fret;
                  const note = isVoicing ? transpose(STANDARD_TUNING[string.stringIndex], fret + capoFret) : string.frets[fret].note;
                  const isRoot = note === root;
                  return (
                    <div className={`string-cell ${fret === capoFret ? "capo-column" : ""}`} key={`${string.stringIndex}-${fret}`}>
                      {isVoicing && <span className={`note-dot ${isRoot ? "root-note" : ""}`} aria-label={`${note}${isRoot ? ", root" : ""}`}>{note}</span>}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
