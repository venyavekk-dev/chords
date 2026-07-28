import { ArrowLeft, Check, CreditCard, QrCode } from "lucide-react";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (options: { eventHandler: (event: { event: string }) => void }) => void;
    };
  }
}

export type Step = "choose" | "pay";
export type PriceOption = 299 | 599 | 999;

type Props = {
  step: Step;
  onStepChange: (step: Step) => void;
  selectedPrice: PriceOption | null;
  onSelectedPriceChange: (price: PriceOption) => void;
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
const PHONE_RAW = "+381677679693";

const PRICE_OPTIONS: readonly PriceOption[] = [299, 599, 999];

const MOOD_EMOJI: Record<PriceOption, string> = {
  299: "😅",
  599: "😄",
  999: "🤩",
};

type PaymentMethod = "card" | "sbp" | "qr" | "link";

function TBankIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect width="20" height="20" rx="5" fill="#FFDD2D" />
      <path d="M5 6.3h10v2.3h-3.9V15H8.9V8.6H5V6.3Z" fill="#111111" />
    </svg>
  );
}

export function PaywallOverlay({
  step,
  onStepChange,
  selectedPrice,
  onSelectedPriceChange,
  onDismiss,
  onClaimPayment,
  onPurchase,
  onUnlockCode,
  checkoutUrl,
  unlockCode,
  graceExpired,
}: Props) {
  const [bouncing, setBouncing] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [copiedMethod, setCopiedMethod] = useState<"card" | "sbp" | null>(null);

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
    onSelectedPriceChange(price);
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

  const copyAndProceed = async (method: "card" | "sbp", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedMethod(method);
    } catch {
      // Clipboard API unavailable — proceed anyway, the number is still visible on the tile.
    }
    window.setTimeout(() => onClaimPayment(), 500);
  };

  const selectMethod = (method: PaymentMethod) => {
    if (method === "qr") {
      setQrOpen((open) => !open);
      return;
    }
    if (method === "card") {
      copyAndProceed("card", CARD_NUMBER_RAW);
      return;
    }
    if (method === "sbp") {
      copyAndProceed("sbp", PHONE_RAW);
      return;
    }
    onClaimPayment();
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
              onClick={() => onStepChange("pay")}
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
            <button type="button" className="paywall-back" onClick={() => onStepChange("choose")}>
              <ArrowLeft size={14} />
              Назад
            </button>

            <span className="paywall-eyebrow">К оплате</span>
            <h2 id="paywall-title">{selectedPrice} ₽</h2>
            <p className="paywall-subtitle">Выбери способ — как только выберешь, перейдём к проверке оплаты.</p>

            <div className="payment-methods">
              <button type="button" className="payment-tile" onClick={() => selectMethod("card")}>
                <span className="payment-tile-icon payment-tile-icon-card"><CreditCard size={20} /></span>
                <span className="payment-tile-title">Картой</span>
                <span className="payment-tile-value">
                  {copiedMethod === "card" ? (
                    <><Check size={13} /> Скопировано</>
                  ) : (
                    CARD_NUMBER_DISPLAY
                  )}
                </span>
              </button>

              <button type="button" className="payment-tile" onClick={() => selectMethod("sbp")}>
                <span className="payment-tile-icon payment-tile-icon-sbp">
                  <img src="/sbp-icon.svg" alt="" className="payment-tile-icon-img" />
                </span>
                <span className="payment-tile-title">По СБП</span>
                <span className="payment-tile-value">
                  {copiedMethod === "sbp" ? (
                    <><Check size={13} /> Скопировано</>
                  ) : (
                    PHONE_RAW
                  )}
                </span>
              </button>

              <button
                type="button"
                className={`payment-tile${qrOpen ? " selected" : ""}`}
                onClick={() => selectMethod("qr")}
              >
                <span className="payment-tile-icon payment-tile-icon-qr"><QrCode size={20} /></span>
                <span className="payment-tile-title">QR-кодом</span>
                <span className="payment-tile-value">{qrOpen ? "Скрыть" : "Показать"}</span>
              </button>

              <a
                href={PAYMENT_LINK}
                target="_blank"
                rel="noreferrer"
                className="payment-tile"
                onClick={() => selectMethod("link")}
              >
                <span className="payment-tile-icon payment-tile-icon-link"><TBankIcon size={40} /></span>
                <span className="payment-tile-title">По ссылке</span>
                <span className="payment-tile-value">Т-Банк</span>
              </a>
            </div>

            {qrOpen && (
              <div className="payment-qr-panel">
                <img src="/paywall-qr.jpg" alt="QR-код для оплаты по СБП" className="payment-qr-image" />
                <button type="button" className="paywall-cta paywall-cta-secondary" onClick={onClaimPayment}>
                  Оплатил — проверить оплату
                </button>
              </div>
            )}

            {checkoutUrl && (
              <a href={checkoutUrl} className="paywall-alt-link lemonsqueezy-button">
                Оплатить картой другого банка
              </a>
            )}

            <button type="button" className="paywall-cta-text paywall-dismiss-link" onClick={onDismiss}>
              Не сейчас
            </button>
          </>
        )}
      </div>
    </div>
  );
}
