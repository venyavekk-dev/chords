import { ArrowLeft, Check, Send } from "lucide-react";
import { useState } from "react";

type Props = {
  onDismiss: () => void;
  onConfirmed: () => void;
  onBack: () => void;
  entering?: boolean;
};

const TELEGRAM_LINK = "https://t.me/veqqa";
const MESSAGE_TIME = "9:11";

export function TelegramConfirmOverlay({ onDismiss, onConfirmed, onBack, entering }: Props) {
  const [messaged, setMessaged] = useState(false);

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="telegram-confirm-title">
      <div className={`paywall-hero${entering ? " sheet-entering" : ""}`}>
        <button type="button" className="paywall-back" onClick={onBack}>
          <ArrowLeft size={14} />
          Назад
        </button>

        <span className="paywall-eyebrow">Почти всё</span>
        <h2 id="telegram-confirm-title">Доступ будет открыт на{" "}час</h2>

        <div className="telegram-message">
          <img src="/venya-avatar.jpg" alt="Веня Векк" className="telegram-avatar" />
          <div className="telegram-message-body">
            <span className="telegram-sender">Веня Векк</span>
            <div className="telegram-bubble">
              Супер! Напиши Вене, что{" "}ты оплатил и{" "}больше не{" "}хочешь видеть это дурацкое
              окно каждые пять минут. И{" "}он тебе вышлет.
              <span className="telegram-bubble-time">{MESSAGE_TIME}</span>
            </div>
          </div>
        </div>

        {messaged ? (
          <button
            type="button"
            className="paywall-cta paywall-cta-primary paywall-cta-full telegram-cta"
            onClick={onConfirmed}
          >
            <Check size={16} />
            Написал
          </button>
        ) : (
          <a
            href={TELEGRAM_LINK}
            target="_blank"
            rel="noreferrer"
            className="paywall-cta paywall-cta-primary paywall-cta-full telegram-cta"
            onClick={() => setMessaged(true)}
          >
            <Send size={16} />
            Написать в Telegram
          </a>
        )}

        <div className="paywall-actions">
          <button type="button" className="paywall-cta-text" onClick={onDismiss}>Не сейчас</button>
        </div>
      </div>
    </div>
  );
}
