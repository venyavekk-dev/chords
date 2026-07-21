export function RelationshipHint() {
  return (
    <div className="relationship-hint" role="note">
      <p className="relationship-hint-full">
        Индикаторы показывают, как каждый аккорд связан с текущим. <span className="indicator-word good">Зелёный</span> — переход обычно звучит естественно, <span className="indicator-word ok">жёлтый</span> — зависит от контекста, <span className="indicator-word weak">красный</span> — будет более резким и непредсказуемым.
      </p>
      <p className="relationship-hint-short">
        <span className="indicator-word good">Зелёный</span> — естественный переход, <span className="indicator-word ok">жёлтый</span> — зависит от контекста, <span className="indicator-word weak">красный</span> — более резкий и непредсказуемый.
      </p>
    </div>
  );
}
