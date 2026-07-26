import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (options: { eventHandler: (event: { event: string }) => void }) => void;
    };
  }
}

type Props = {
  onDismiss: () => void;
  onClaimPayment: () => void;
  onPurchase: () => void;
  checkoutUrl?: string;
  graceExpired?: boolean;
};

const PAYMENT_LINK = "https://www.tbank.ru/cf/1XW3P6G3j2c";
const CARD_NUMBER_RAW = "2200700432344546";
const CARD_NUMBER_DISPLAY = "2200 7004 3234 4546";
const CARD_HOLDER = "Т-Банк · Вениамин В.";
const PHONE_RAW = "+381677679693";

const PRICE_OPTIONS = [299, 599, 999] as const;
type PriceOption = (typeof PRICE_OPTIONS)[number];

const MOOD_EMOJI: Record<PriceOption, string> = {
  299: "😅",
  599: "😄",
  999: "🤩",
};

function CopyField({ label, value, copyValue }: { label: string; value: string; copyValue: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — user can still select the text manually.
    }
  };

  return (
    <div className="paywall-field">
      <span className="paywall-field-label">{label}</span>
      <div className="paywall-field-row">
        <span className="paywall-field-value">{value}</span>
        <button
          type="button"
          className={`paywall-field-copy${copied ? " copied" : ""}`}
          onClick={handleCopy}
          aria-label={`Скопировать: ${label}`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

export function PaywallOverlay({ onDismiss, onClaimPayment, onPurchase, checkoutUrl, graceExpired }: Props) {
  const [selectedPrice, setSelectedPrice] = useState<PriceOption | null>(null);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    if (!checkoutUrl) return;
    window.createLemonSqueezy?.();
    window.LemonSqueezy?.Setup({
      eventHandler: (event) => {
        if (event.event === "Checkout.Success") {
          onPurchase();
        }
      },
    });
  }, [checkoutUrl, onPurchase]);

  const choosePrice = (price: PriceOption) => {
    setSelectedPrice(price);
    setBouncing(true);
    window.setTimeout(() => setBouncing(false), 380);
  };

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className={`paywall-hero${bouncing ? " paywall-bounce" : ""}`}>
        {graceExpired ? (
          <>
            <span className="paywall-eyebrow">Упс</span>
            <h2 id="paywall-title">Кажется, не оплатил?</h2>
            <p className="paywall-subtitle">
              Ты сказал, что оплатил — час прошёл, а подтверждения от Вени не было, так что доступ снова закрыт.
              Если это ошибка, просто напиши в Telegram.
            </p>
          </>
        ) : (
          <>
            <span className="paywall-emoji-badge" aria-hidden="true">{selectedPrice ? MOOD_EMOJI[selectedPrice] : "❓"}</span>
            <h2 id="paywall-title">Надоедливый пейвол</h2>
            <p className="paywall-subtitle">
              В бесплатной версии каждые пять минут открывается этот надоедливый пейвол. Чтобы это прекратилось —
              оплати по-братски.
            </p>
          </>
        )}

        <div className="price-picker" role="group" aria-label="Выбери сумму">
          {PRICE_OPTIONS.map((price) => (
            <button
              key={price}
              type="button"
              className={`price-option ${selectedPrice === price ? "active" : ""}`}
              onClick={() => choosePrice(price)}
            >
              {price} ₽
            </button>
          ))}
        </div>

        <a
          href={PAYMENT_LINK}
          target="_blank"
          rel="noreferrer"
          className="paywall-cta paywall-cta-primary paywall-cta-full"
          aria-disabled={!selectedPrice}
          onClick={(event) => {
            if (!selectedPrice) event.preventDefault();
          }}
        >
          {selectedPrice ? `Задонатить ${selectedPrice} ₽` : "Выбери сумму"}
        </a>

        <div className="paywall-divider">или переведите вручную</div>

        <div className="paywall-manual">
          <CopyField label={`Карта · ${CARD_HOLDER}`} value={CARD_NUMBER_DISPLAY} copyValue={CARD_NUMBER_RAW} />
          <CopyField label="Телефон · СБП" value={PHONE_RAW} copyValue={PHONE_RAW} />
        </div>

        {checkoutUrl && (
          <a href={checkoutUrl} className="paywall-alt-link lemonsqueezy-button">
            Оплатить картой другого банка
          </a>
        )}

        <div className="paywall-actions">
          <button type="button" className="paywall-cta paywall-cta-secondary" onClick={onClaimPayment}>
            Проверить оплату
          </button>
          <button type="button" className="paywall-cta-text" onClick={onDismiss}>Не сейчас</button>
        </div>
      </div>
    </div>
  );
}
