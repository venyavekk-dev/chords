import { X } from "lucide-react";
import { useEffect } from "react";
import type { DesignSkin } from "../types/music";

type SkinInfo = {
  id: DesignSkin;
  name: string;
  blurb: string;
};

const SKINS: SkinInfo[] = [
  { id: "classic", name: "Классика", blurb: "Обычный вид инструмента" },
  { id: "akai", name: "Akai MPK Mini", blurb: "Чёрный пластик, оранжевый акцент" },
  { id: "korg", name: "Korg Minilogue", blurb: "Светлый металл, чёрные ручки, красный LED" },
  { id: "juno", name: "Roland Juno-60", blurb: "Чёрная панель, кремовые кнопки, оранжевая подсветка" },
];

type Props = {
  open: boolean;
  current: DesignSkin;
  onSelect: (skin: DesignSkin) => void;
  onClose: () => void;
};

export function DesignPickerModal({ open, current, onSelect, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("design-picker-open");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("design-picker-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="design-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="design-picker-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="design-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="design-picker-close" aria-label="Закрыть" onClick={onClose}>
          <X size={16} />
        </button>
        <h2 id="design-picker-title">Дизайн инструмента</h2>
        <p className="design-picker-sub">Выбери, как будет выглядеть Chord Tulza.</p>
        <div className="design-picker-grid">
          {SKINS.map((skin) => (
            <button
              type="button"
              key={skin.id}
              className={`design-picker-option ${current === skin.id ? "selected" : ""}`}
              aria-pressed={current === skin.id}
              onClick={() => onSelect(skin.id)}
            >
              <span className={`design-swatch design-swatch-${skin.id}`} aria-hidden="true">
                <span className="design-swatch-panel">
                  <i className="design-swatch-chip" />
                  <i className="design-swatch-chip design-swatch-chip-active" />
                  <i className="design-swatch-chip" />
                </span>
                <span className="design-swatch-keys">
                  <i /><i /><i /><i /><i /><i /><i /><i />
                </span>
              </span>
              <span className="design-picker-option-name">{skin.name}</span>
              <span className="design-picker-option-blurb">{skin.blurb}</span>
              <span className="design-picker-select">{current === skin.id ? "Выбрано" : "Выбрать"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
