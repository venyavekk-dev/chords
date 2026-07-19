import type { FretRange, GuitarVoicing } from "../types/music";
import { Fragment } from "react";
import { buildFretboard, getFretWindow, STANDARD_TUNING } from "../lib/guitar";
import { buildScale, parseChord } from "../lib/musicTheory";
import type { ScaleMode } from "../types/music";

type Props = {
  chordSymbol: string;
  keyRoot: string;
  scaleMode: ScaleMode;
  fretRange: FretRange;
  selectedVoicing?: GuitarVoicing;
  bare?: boolean;
};

export function GuitarFretboard({ chordSymbol, keyRoot, scaleMode, fretRange, selectedVoicing, bare = false }: Props) {
  const [start, end] = getFretWindow(fretRange);
  const board = buildFretboard(STANDARD_TUNING, 20);
  const chord = parseChord(chordSymbol);
  const scale = buildScale(keyRoot, scaleMode);
  const frets = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const markers = new Set([3, 5, 7, 9, 12, 15, 17, 19]);

  const content = (
    <>
      <div className="panel-heading">
        <h2>Guitar fretboard</h2>
        <small>Chord tones are bright. Scale notes stay quiet.</small>
      </div>
      <div className="fretboard" style={{ gridTemplateColumns: `56px repeat(${frets.length}, minmax(46px, 1fr))` }}>
        <div />
        {frets.map((fret) => <div className="fret-number" key={fret}>{fret}{markers.has(fret) ? " •" : ""}</div>)}
        {board.slice().reverse().map((string) => (
          <Fragment key={string.stringIndex}>
            <div className="string-label" key={`label-${string.stringIndex}`}>{string.openNote}</div>
            {frets.map((fret) => {
              const note = string.frets[fret].note;
              const inChord = chord.tones.includes(note);
              const isRoot = note === chord.root;
              const inScale = scale.includes(note);
              const inVoicing = selectedVoicing?.frets[string.stringIndex] === fret;
              return (
                <div className={`fret ${inScale ? "in-scale" : ""} ${inChord ? "in-chord" : ""} ${isRoot ? "is-root" : ""} ${inVoicing ? "in-voicing" : ""}`} key={`${string.stringIndex}-${fret}`}>
                  {(inChord || inVoicing) && <span>{note}</span>}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </>
  );
  return bare ? <div className="fretboard-module">{content}</div> : <section className="panel guitar-panel">{content}</section>;
}
