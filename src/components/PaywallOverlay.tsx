export function PaywallOverlay() {
  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className="paywall-card">
        <span className="paywall-badge">Демо</span>
        <h2 id="paywall-title">Пробный период закончился</h2>
        <p>Чтобы продолжить пользоваться Chord Tulza без ограничений, перейди на Pro.</p>
        <ul className="paywall-perks">
          <li>Безлимитные аккорды и прогрессии</li>
          <li>Все звуковые пресеты</li>
          <li>Поддержка проекта</li>
        </ul>
        <button type="button" className="paywall-upgrade">Обновить до Pro</button>
      </div>
    </div>
  );
}
