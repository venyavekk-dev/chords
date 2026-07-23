export function PaywallOverlay() {
  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className="paywall-hero">
        <span className="paywall-eyebrow">Демо-версия</span>
        <h2 id="paywall-title">Пробный период закончился</h2>
        <p className="paywall-subtitle">Разовый платёж — 20€. Просто и навсегда.</p>
        <div className="paywall-actions">
          <button type="button" className="paywall-cta paywall-cta-primary">Купить за 20€</button>
          <button type="button" className="paywall-cta paywall-cta-secondary">Подробнее</button>
        </div>
      </div>
    </div>
  );
}
