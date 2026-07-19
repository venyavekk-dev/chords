import type { GuitarVoicing } from "../types/music";
import { STANDARD_TUNING } from "../lib/guitar";
import { transpose } from "../lib/musicTheory";

const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

type Props = {
  voicing?: GuitarVoicing;
  bare?: boolean;
};

export function GuitarChordDiagram({ voicing, bare = false }: Props) {
  if (!voicing) {
    const empty = (
      <section className="panel chord-diagram-panel">
        <div className="panel-heading">
          <h2>How to hold it</h2>
        </div>
        <p className="muted-text">Choose a voicing to see the fingering.</p>
      </section>
    );
    return bare ? <p className="muted-text">Choose a voicing to see the fingering.</p> : empty;
  }

  const pressed = voicing.frets.filter((fret): fret is number => typeof fret === "number" && fret > 0);
  const baseFret = pressed.length ? Math.max(1, Math.min(...pressed)) : 1;
  const shownFrets = Array.from({ length: 5 }, (_, index) => baseFret + index);
  const fingers = assignFingers(voicing.frets);

  const content = (
    <>
      <div className="panel-heading">
        <h2>How to hold it</h2>
        <small>{voicing.name}</small>
      </div>
      <div className="diagram-wrap">
        <div className="diagram-meta">
          <strong>{voicing.frets.join("")}</strong>
          <span>{baseFret === 1 ? "open position" : `starts at fret ${baseFret}`}</span>
          <span>{voicing.difficulty}</span>
        </div>
        <div className="chord-diagram horizontal-diagram" style={{ gridTemplateColumns: `72px repeat(${shownFrets.length}, minmax(72px, 1fr))` }}>
          <div />
          {shownFrets.map((fret) => <div className="diagram-fret-number" key={fret}>{fret}</div>)}
          {STRING_NAMES.slice().reverse().map((name, reversedIndex) => {
            const stringIndex = STRING_NAMES.length - 1 - reversedIndex;
            return (
              <StringRow
                fingerMap={fingers}
                key={`${name}-${stringIndex}`}
                name={name}
                shownFrets={shownFrets}
                stringIndex={stringIndex}
                voicing={voicing}
              />
            );
          })}
        </div>
      </div>
    </>
  );
  return bare ? <div className="chord-diagram-module">{content}</div> : <section className="panel chord-diagram-panel">{content}</section>;
}

function StringRow({
  fingerMap,
  name,
  shownFrets,
  stringIndex,
  voicing,
}: {
  fingerMap: Map<number, number>;
  name: string;
  shownFrets: number[];
  stringIndex: number;
  voicing: GuitarVoicing;
}) {
  const stringValue = voicing.frets[stringIndex];
  const status = stringValue === "x" ? "x" : stringValue === 0 ? "open" : name;

  return (
    <>
      <div className="diagram-string-label">
        <strong>{name}</strong>
        <span>{status}</span>
      </div>
      {shownFrets.map((fret) => {
        const isPressed = stringValue === fret;
        const isRoot = isPressed && typeof stringValue === "number" && transpose(STANDARD_TUNING[stringIndex], stringValue) === voicing.root;
        return (
          <div className="diagram-cell" key={`${stringIndex}-${fret}`}>
            {isPressed && <span className={isRoot ? "root" : ""}>{fingerMap.get(stringIndex)}</span>}
          </div>
        );
      })}
    </>
  );
}

function assignFingers(frets: Array<number | "x">) {
  const result = new Map<number, number>();
  const pressed = frets
    .map((fret, stringIndex) => ({ fret, stringIndex }))
    .filter((item): item is { fret: number; stringIndex: number } => typeof item.fret === "number" && item.fret > 0)
    .sort((a, b) => a.fret - b.fret || a.stringIndex - b.stringIndex);

  const grouped = pressed.reduce<Record<number, number[]>>((acc, item) => {
    acc[item.fret] = [...(acc[item.fret] ?? []), item.stringIndex];
    return acc;
  }, {});
  const barreFret = Object.entries(grouped).find(([, strings]) => strings.length >= 3);
  if (barreFret) {
    grouped[Number(barreFret[0])].forEach((stringIndex) => result.set(stringIndex, 1));
  }

  let nextFinger = result.size ? 2 : 1;
  pressed.forEach((item) => {
    if (!result.has(item.stringIndex)) {
      result.set(item.stringIndex, Math.min(nextFinger, 4));
      nextFinger += 1;
    }
  });
  return result;
}
