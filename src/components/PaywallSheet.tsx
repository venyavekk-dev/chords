import { ArrowLeft, Check, CreditCard, QrCode } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
  }
}

export type Step = "choose" | "pay";
export type PriceOption = 299 | 599 | 999;

type Props = {
  phase: Step;
  entering?: boolean;
  selectedPrice: PriceOption | null;
  onSelectedPriceChange: (price: PriceOption) => void;
  onStepChange: (step: Step) => void;
  onDismiss: () => void;
  checkoutUrl?: string;
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

function CopyableTile({
  label,
  value,
  copied,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  copied: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="payment-tile" onClick={onClick}>
      {icon}
      <span className="payment-tile-title">{label}</span>
      <span className="payment-tile-value">
        {copied ? (<><Check size={13} /> Скопировано</>) : value}
      </span>
    </button>
  );
}

export function PaywallSheet({
  phase,
  entering,
  selectedPrice,
  onSelectedPriceChange,
  onStepChange,
  onDismiss,
  checkoutUrl,
}: Props) {
  const [qrOpen, setQrOpen] = useState(false);
  const [copiedMethod, setCopiedMethod] = useState<"card" | "sbp" | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "pay") {
      setQrOpen(false);
      setCopiedMethod(null);
    }
    heroRef.current?.scrollTo({ top: 0 });
  }, [phase]);

  useEffect(() => {
    if (!checkoutUrl) return;
    window.createLemonSqueezy?.();
  }, [checkoutUrl]);

  const choosePrice = (price: PriceOption) => {
    onSelectedPriceChange(price);
  };

  const copyPaymentDetails = async (method: "card" | "sbp", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedMethod(method);
    } catch {
      // Clipboard API unavailable — the number is still visible on the tile.
    }
  };

  const selectMethod = (method: PaymentMethod) => {
    if (method === "qr") {
      setQrOpen((open) => !open);
      return;
    }
    if (method === "card") {
      copyPaymentDetails("card", CARD_NUMBER_RAW);
      return;
    }
    if (method === "sbp") {
      copyPaymentDetails("sbp", PHONE_RAW);
    }
  };

  useLayoutEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const previousHeight = previousHeightRef.current;
    el.style.height = "auto";
    const naturalHeight = el.scrollHeight;
    const settle = (event: TransitionEvent) => {
      if (event.propertyName === "height") {
        el.style.height = "auto";
      }
    };
    if (previousHeight !== null && previousHeight !== naturalHeight) {
      el.style.height = `${previousHeight}px`;
      void el.offsetHeight;
      requestAnimationFrame(() => {
        el.style.height = `${naturalHeight}px`;
      });
      el.addEventListener("transitionend", settle);
    } else {
      el.style.height = `${naturalHeight}px`;
    }
    previousHeightRef.current = naturalHeight;
    return () => el.removeEventListener("transitionend", settle);
  }, [phase, selectedPrice, qrOpen, copiedMethod]);

  useEffect(() => {
    const handleResize = () => {
      const el = heroRef.current;
      if (!el) return;
      previousHeightRef.current = el.scrollHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div ref={heroRef} className={`paywall-hero${entering ? " sheet-entering" : ""}`}>
        {phase === "choose" && (
          <>
            <span className="paywall-emoji-badge" aria-hidden="true">{selectedPrice ? MOOD_EMOJI[selectedPrice] : "💛"}</span>
            <h2 id="paywall-title">Поддержите автора</h2>
            <p className="paywall-subtitle">
              Автор делал этот инструмент целый месяц, каждый день с{" "}утра до{" "}вечера.
              Если Chord Tulza вам помогает — поддержите его добровольным донатом.
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

            <button type="button" className="paywall-cta-text paywall-dismiss-link" onClick={onDismiss}>
              Не сейчас
            </button>
          </>
        )}

        {phase === "pay" && (
          <>
            <button type="button" className="paywall-back" onClick={() => onStepChange("choose")}>
              <ArrowLeft size={14} />
              Назад
            </button>

            <span className="paywall-eyebrow">Донат</span>
            <h2 id="paywall-title">{selectedPrice} ₽</h2>
            <p className="paywall-subtitle">Выберите удобный способ поддержать автора. Спасибо — это помогает развивать проект.</p>

            <div className="payment-methods">
              <CopyableTile
                label="Картой"
                value={CARD_NUMBER_DISPLAY}
                copied={copiedMethod === "card"}
                icon={<span className="payment-tile-icon payment-tile-icon-card"><CreditCard size={20} /></span>}
                onClick={() => selectMethod("card")}
              />

              <CopyableTile
                label="По СБП"
                value={PHONE_RAW}
                copied={copiedMethod === "sbp"}
                icon={
                  <span className="payment-tile-icon payment-tile-icon-sbp">
                    <img src="/sbp-icon.svg" alt="" className="payment-tile-icon-img" />
                  </span>
                }
                onClick={() => selectMethod("sbp")}
              />

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
