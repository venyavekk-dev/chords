type Props = {
  onClose: () => void;
  entering?: boolean;
};

export function UnlockSuccessOverlay({ onClose, entering }: Props) {
  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="unlock-success-title">
      <div className={`paywall-hero${entering ? " sheet-entering" : ""}`}>
        <span className="paywall-emoji-badge" aria-hidden="true">✅</span>
        <h2 id="unlock-success-title">Готово, доступ открыт</h2>
        <p className="paywall-subtitle">
          Код принят — пейвол больше не{" "}появится на этом устройстве.
        </p>
        <button type="button" className="paywall-cta paywall-cta-primary paywall-cta-full" onClick={onClose}>
          Продолжить
        </button>
      </div>
    </div>
  );
}
