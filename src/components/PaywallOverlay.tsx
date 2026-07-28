import { ArrowLeft, Check, Copy } from "lucide-react";
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
  onUnlockCode: () => void;
  checkoutUrl?: string;
  unlockCode?: string;
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

type Step = "choose" | "pay";

function TBankIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect width="20" height="20" rx="5" fill="#FFDD2D" />
      <path d="M5 6.3h10v2.3h-3.9V15H8.9V8.6H5V6.3Z" fill="#111111" />
    </svg>
  );
}

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

export function PaywallOverlay({
  onDismiss,
  onClaimPayment,
  onPurchase,
  onUnlockCode,
  checkoutUrl,
  unlockCode,
  graceExpired,
}: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [selectedPrice, setSelectedPrice] = useState<PriceOption | null>(null);
  const [bouncing, setBouncing] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);

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

  const submitCode = () => {
    if (unlockCode && codeInput.trim().toLowerCase() === unlockCode.trim().toLowerCase()) {
      onUnlockCode();
      return;
    }
    setCodeInvalid(true);
  };

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className={`paywall-hero${bouncing ? " paywall-bounce" : ""}`}>
        {graceExpired ? (
          <>
            <span className="paywall-eyebrow">Упс</span>
            <h2 id="paywall-title">Кажется, не{" "}оплатил?</h2>
            <p className="paywall-subtitle">
              Ты сказал, что{" "}оплатил — час прошёл, а{" "}подтверждения от{" "}Вени
              не{" "}было, так что{" "}доступ снова закрыт. Если это ошибка, просто напиши
              в{" "}Telegram.
            </p>
            <div className="paywall-actions">
              <button type="button" className="paywall-cta paywall-cta-secondary" onClick={onClaimPayment}>
                Проверить оплату
              </button>
              <button type="button" className="paywall-cta-text" onClick={onDismiss}>Не сейчас</button>
            </div>
          </>
        ) : step === "choose" ? (
          <>
            <span className="paywall-emoji-badge" aria-hidden="true">{selectedPrice ? MOOD_EMOJI[selectedPrice] : "❓"}</span>
            <h2 id="paywall-title">Надоедливый пейвол</h2>
            <p className="paywall-subtitle">
              В бесплатной версии каждые пять минут открывается этот надоедливый пейвол. Чтобы это прекратилось —
              оплати по-братски.
            </p>

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

            <button
              type="button"
              className="paywall-cta paywall-cta-primary paywall-cta-full"
              disabled={!selectedPrice}
              onClick={() => setStep("pay")}
            >
              {selectedPrice ? `Далее · ${selectedPrice} ₽` : "Выбери сумму"}
            </button>

            <div className="paywall-divider">или</div>

            <span className="paywall-unlock-label">Уже есть код доступа?</span>
            <div className="paywall-unlock">
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                className={`paywall-unlock-input${codeInvalid ? " invalid" : ""}`}
                placeholder="Код доступа"
                value={codeInput}
                onChange={(event) => {
                  setCodeInput(event.target.value);
                  setCodeInvalid(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitCode();
                }}
                aria-label="Код доступа"
              />
              <button type="button" className="paywall-unlock-submit" onClick={submitCode}>
                Ввести
              </button>
            </div>
            {codeInvalid && <span className="paywall-unlock-error">Неверный код</span>}

            <button type="button" className="paywall-cta-text paywall-dismiss-link" onClick={onDismiss}>
              Не сейчас
            </button>
          </>
        ) : (
          <>
            <button type="button" className="paywall-back" onClick={() => setStep("choose")}>
              <ArrowLeft size={14} />
              Назад
            </button>

            <span className="paywall-eyebrow">К оплате</span>
            <h2 id="paywall-title">{selectedPrice} ₽</h2>
            <p className="paywall-subtitle">Выбери способ — переведи и нажми «Проверить оплату».</p>

            <div className="paywall-manual">
              <CopyField label={`Карта · ${CARD_HOLDER}`} value={CARD_NUMBER_DISPLAY} copyValue={CARD_NUMBER_RAW} />
              <CopyField label="Телефон · СБП" value={PHONE_RAW} copyValue={PHONE_RAW} />
            </div>

            <div className="paywall-qr">
              <img src="/paywall-qr.jpg" alt="QR-код для оплаты по СБП" className="paywall-qr-image" />
              <span className="paywall-qr-label">или отсканируй QR</span>
            </div>

            <a
              href={PAYMENT_LINK}
              target="_blank"
              rel="noreferrer"
              className="paywall-cta paywall-cta-primary paywall-cta-full paywall-tbank-link"
            >
              <TBankIcon />
              Оплатить по ссылке
            </a>

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
          </>
        )}
      </div>
    </div>
  );
}
