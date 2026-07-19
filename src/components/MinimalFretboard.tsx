import { Fragment } from "react";
import type { GuitarVoicing } from "../types/music";
import { buildFretboard, STANDARD_TUNING } from "../lib/guitar";
import { transpose } from "../lib/musicTheory";

type Props = {
  chordSymbol: string;
  voicing?: GuitarVoicing;
};

const DISPLAY_FRETS = Array.from({ length: 19 }, (_, index) => index + 1);
const MARKERS = new Set([3, 5, 7, 9, 12, 15, 17, 19]);

export function MinimalFretboard({ chordSymbol, voicing }: Props) {
  const board = buildFretboard(STANDARD_TUNING, 19);

  return (
    <section className="minimal-fretboard" aria-label="Guitar fretboard">
      <div className="fret-marker-row" style={{ gridTemplateColumns: `48px repeat(${DISPLAY_FRETS.length}, 1fr)` }}>
        <div />
        {DISPLAY_FRETS.map((fret) => (
          <div className="fret-marker" key={fret}>{MARKERS.has(fret) && <span />}</div>
        ))}
      </div>
      <div className="fretboard-grid" style={{ gridTemplateColumns: `48px repeat(${DISPLAY_FRETS.length}, 1fr)` }}>
        <div />
        {DISPLAY_FRETS.map((fret) => <div className="fret-number" key={fret}>{fret}</div>)}
        {board.slice().reverse().map((string) => (
          <Fragment key={string.stringIndex}>
            <div className="string-name">{string.openNote}</div>
            {DISPLAY_FRETS.map((fret) => {
              const isVoicing = voicing?.frets[string.stringIndex] === fret;
              const note = isVoicing ? transpose(STANDARD_TUNING[string.stringIndex], fret) : string.frets[fret].note;
              return (
                <div className="string-cell" key={`${string.stringIndex}-${fret}`}>
                  {isVoicing && <span className="note-dot">{note}</span>}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
