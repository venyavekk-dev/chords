import { ArrowLeft, Check, CreditCard, QrCode, Smartphone } from "lucide-react";
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
type PaymentMethod = "card" | "sbp" | "qr" | "link";

function TBankIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect width="20" height="20" rx="5" fill="#FFDD2D" />
      <path d="M5 6.3h10v2.3h-3.9V15H8.9V8.6H5V6.3Z" fill="#111111" />
    </svg>
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
            <p className="paywall-subtitle">Выбери способ — как только выберешь, перейдём к проверке оплаты.</p>

            <div className="payment-methods">
              <button type="button" className="payment-tile" onClick={() => selectMethod("card")}>
                <span className="payment-tile-icon"><CreditCard size={18} /></span>
                <span className="payment-tile-body">
                  <span className="payment-tile-title">Банковской картой</span>
                  <span className="payment-tile-value">
                    {copiedMethod === "card" ? (
                      <><Check size={14} /> Скопировано</>
                    ) : (
                      CARD_NUMBER_DISPLAY
                    )}
                  </span>
                  <span className="payment-tile-hint">{CARD_HOLDER}</span>
                </span>
              </button>

              <button type="button" className="payment-tile" onClick={() => selectMethod("sbp")}>
                <span className="payment-tile-icon"><Smartphone size={18} /></span>
                <span className="payment-tile-body">
                  <span className="payment-tile-title">По СБП</span>
                  <span className="payment-tile-value">
                    {copiedMethod === "sbp" ? (
                      <><Check size={14} /> Скопировано</>
                    ) : (
                      PHONE_RAW
                    )}
                  </span>
                </span>
              </button>

              <div className={`payment-tile payment-tile-qr${qrOpen ? " expanded" : ""}`}>
                <button type="button" className="payment-tile-header" onClick={() => selectMethod("qr")}>
                  <span className="payment-tile-icon"><QrCode size={18} /></span>
                  <span className="payment-tile-body">
                    <span className="payment-tile-title">QR-кодом</span>
                    <span className="payment-tile-value">{qrOpen ? "Скрыть" : "Показать QR"}</span>
                  </span>
                </button>
                {qrOpen && (
                  <div className="payment-tile-qr-content">
                    <img src="/paywall-qr.jpg" alt="QR-код для оплаты по СБП" className="payment-qr-image" />
                    <button type="button" className="paywall-cta paywall-cta-secondary" onClick={onClaimPayment}>
                      Оплатил — проверить оплату
                    </button>
                  </div>
                )}
              </div>

              <a
                href={PAYMENT_LINK}
                target="_blank"
                rel="noreferrer"
                className="payment-tile"
                onClick={() => selectMethod("link")}
              >
                <span className="payment-tile-icon"><TBankIcon /></span>
                <span className="payment-tile-body">
                  <span className="payment-tile-title">По ссылке</span>
                  <span className="payment-tile-value">Откроется форма Т-Банка</span>
                </span>
              </a>
            </div>

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
