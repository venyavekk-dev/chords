import { Copy, Shuffle, Trash2 } from "lucide-react";
import type { DegreeChord, ProgressionItem } from "../types/music";

type Props = {
  items: ProgressionItem[];
  chords: DegreeChord[];
  keyName: string;
  onSelect: (item: ProgressionItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onPreset: (degrees: string[]) => void;
};

const presets = [
  ["I", "V", "vi", "IV"],
  ["vi", "IV", "I", "V"],
  ["ii", "V", "I"],
  ["I", "IV", "V"],
  ["i", "VI", "III", "VII"],
];

export function ProgressionBuilder({ items, chords, keyName, onSelect, onRemove, onClear, onMove, onPreset }: Props) {
  const roman = items.map((item) => item.degree).join(" - ");
  const real = items.map((item) => item.symbol).join(" - ");
  const copy = () => navigator.clipboard?.writeText(`Key: ${keyName}\nProgression: ${roman}\nChords: ${real}`);

  return (
    <section className="progression-bar">
      <div className="progression-actions">
        <strong>Chord Progression</strong>
        <button onClick={() => onPreset(presets[Math.floor(Math.random() * presets.length)])}><Shuffle size={16} /> Random</button>
        {presets.map((preset) => <button key={preset.join("-")} onClick={() => onPreset(preset)}>{preset.join("-")}</button>)}
        <button onClick={copy}><Copy size={16} /> Copy</button>
        <button onClick={onClear}><Trash2 size={16} /> Clear</button>
      </div>
      <div className="progression-cards">
        {items.length === 0 && <span className="empty">Add chords from the palette or choose a preset</span>}
        {items.map((item) => (
          <button className="progression-card" key={item.id} onClick={() => onSelect(item)}>
            <span>{item.degree}</span>
            <strong>{item.symbol}</strong>
            <div>
              <b onClick={(event) => { event.stopPropagation(); onMove(item.id, -1); }}>←</b>
              <b onClick={(event) => { event.stopPropagation(); onMove(item.id, 1); }}>→</b>
              <b onClick={(event) => { event.stopPropagation(); onRemove(item.id); }}>×</b>
            </div>
          </button>
        ))}
      </div>
      <div className="progression-lines">
        <span>Roman: {roman || "..."}</span>
        <span>Chords: {real || chords.map((chord) => chord.symbol).slice(0, 4).join(" - ")}</span>
      </div>
    </section>
  );
}
