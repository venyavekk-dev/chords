import type { GuitarVoicing } from "../types/music";
import { NOTES, parseChord } from "../lib/musicTheory";

type Props = {
  chordSymbol: string;
  voicing?: GuitarVoicing;
  capoFret?: number;
};

const FIRST_MIDI = 36;
const LAST_MIDI = 84;
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

const keys = Array.from({ length: LAST_MIDI - FIRST_MIDI + 1 }, (_, index) => {
  const midi = FIRST_MIDI + index;
  const note = NOTES[midi % 12];
  return {
    midi,
    note,
    octave: Math.floor(midi / 12) - 1,
    isBlack: note.includes("#"),
  };
});

const whiteKeys = keys.filter((key) => !key.isBlack);
const blackKeys = keys.filter((key) => key.isBlack);

export function PianoKeyboard({ chordSymbol, voicing, capoFret = 0 }: Props) {
  const chord = parseChord(chordSymbol);
  const chordNotes = new Set(chord.tones);
  const voicingMidi = voicing
    ? voicing.frets
      .map((fret, stringIndex) => (fret === "x" ? undefined : OPEN_STRING_MIDI[stringIndex] + fret + capoFret))
      .filter((midi): midi is number => typeof midi === "number")
    : [];
  const activeMidi = new Set(voicingMidi);
  const hasExactVoicing = activeMidi.size > 0;

  return (
    <section className="piano-keyboard" aria-label="Piano keyboard">
      <div className="piano-scroll" tabIndex={0} aria-label="Scrollable piano keyboard">
        <div className="piano-shell">
          <div className="white-key-row">
            {whiteKeys.map((key) => {
              const active = hasExactVoicing ? activeMidi.has(key.midi) : chordNotes.has(key.note);
              return (
                <div className={`piano-key white-key ${active ? "active" : ""} ${active && key.note === chord.root ? "root-key" : ""}`} key={key.midi}>
                  {active && <span>{key.note}</span>}
                </div>
              );
            })}
          </div>
          <div className="black-key-row">
            {blackKeys.map((key) => {
              const active = hasExactVoicing ? activeMidi.has(key.midi) : chordNotes.has(key.note);
              return (
                <div
                  className={`piano-key black-key ${active ? "active" : ""} ${active && key.note === chord.root ? "root-key" : ""}`}
                  key={key.midi}
                  style={{ left: `${blackKeyLeft(key.midi)}%` }}
                >
                  {active && <span>{key.note}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function blackKeyLeft(midi: number) {
  const whitesBefore = keys.filter((key) => key.midi < midi && !key.isBlack).length;
  return ((whitesBefore - 0.32) / whiteKeys.length) * 100;
}
