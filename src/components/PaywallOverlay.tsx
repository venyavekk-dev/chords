import { useEffect } from "react";

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
  onPurchase: () => void;
  checkoutUrl?: string;
};

export function PaywallOverlay({ onDismiss, onPurchase, checkoutUrl }: Props) {
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

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className="paywall-hero">
        <span className="paywall-eyebrow">Демо-версия</span>
        <h2 id="paywall-title">Пробный период закончился</h2>
        <p className="paywall-subtitle">Разовый платёж — 20€. Просто и навсегда.</p>
        <div className="paywall-actions">
          {checkoutUrl ? (
            <a href={checkoutUrl} className="paywall-cta paywall-cta-primary lemonsqueezy-button">
              Купить за 20€
            </a>
          ) : (
            <button type="button" className="paywall-cta paywall-cta-primary" disabled>
              Купить за 20€
            </button>
          )}
          <button type="button" className="paywall-cta paywall-cta-secondary" onClick={onDismiss}>Подробнее</button>
        </div>
      </div>
    </div>
  );
}
