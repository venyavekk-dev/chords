import type { GuitarVoicing } from "../types/music";

type Props = {
  voicing: GuitarVoicing;
  capoFret?: number;
};

const STRINGS = [5, 4, 3, 2, 1, 0];

export function VoicingMini({ voicing, capoFret = 0 }: Props) {
  const pressed = voicing.frets
    .filter((fret): fret is number => typeof fret === "number" && fret > 0)
    .map((fret) => fret + capoFret);
  const startFret = pressed.length ? Math.max(1, Math.min(...pressed)) : 1;
  const frets = Array.from({ length: 5 }, (_, index) => startFret + index);

  return (
    <span className="voicing-mini">
      <span className="mini-start">{startFret}</span>
      <span className="mini-grid" style={{ gridTemplateColumns: `repeat(${frets.length}, 1fr)` }}>
        {STRINGS.map((stringIndex) =>
          frets.map((fret) => {
            const rawFret = voicing.frets[stringIndex];
            const isPressed = typeof rawFret === "number" && rawFret > 0 && rawFret + capoFret === fret;
            const isMuted = rawFret === "x";
            return (
              <span className={`mini-cell ${isMuted ? "muted" : ""}`} key={`${stringIndex}-${fret}`}>
                {isPressed && <i />}
              </span>
            );
          }),
        )}
      </span>
    </span>
  );
}
