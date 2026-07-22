import { Play, Square, Trash2, X } from "lucide-react";
import type { ProgressionItem } from "../types/music";

type Props = {
  items: ProgressionItem[];
  bpm: number;
  isPlaying: boolean;
  playingIndex: number;
  onBpm: (bpm: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onPlayToggle: () => void;
};

export function ChordSequencer({ items, bpm, isPlaying, playingIndex, onBpm, onRemove, onClear, onPlayToggle }: Props) {
  return (
    <section className="sequencer-bar" aria-label="Chord sequencer">
      <div className="sequencer-header">
        <strong>Секвенсор</strong>
        <label className="sequencer-bpm">
          <span>BPM <output>{bpm}</output></span>
          <input
            type="range"
            min={40}
            max={200}
            step={1}
            value={bpm}
            aria-label="BPM"
            onChange={(event) => onBpm(Number(event.target.value))}
          />
        </label>
        <button type="button" className="sequencer-play" onClick={onPlayToggle} disabled={items.length === 0}>
          {isPlaying ? <Square size={14} /> : <Play size={14} />}
          {isPlaying ? "Стоп" : "Играть"}
        </button>
        <button type="button" className="sequencer-clear" onClick={onClear} disabled={items.length === 0}>
          <Trash2 size={14} /> Очистить
        </button>
      </div>
      <div className="sequencer-track">
        {items.length === 0 ? (
          <span className="sequencer-empty">Нажимай на аккорды выше — они по очереди появятся здесь</span>
        ) : (
          items.map((item, index) => (
            <div className={`sequencer-item ${isPlaying && index === playingIndex ? "playing" : ""}`} key={item.id}>
              <span>{item.degree}</span>
              <strong>{item.symbol}</strong>
              <button type="button" aria-label={`Убрать ${item.symbol} из секвенсора`} onClick={() => onRemove(item.id)}>
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
