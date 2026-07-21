export function RelationshipHint() {
  return (
    <div className="relationship-hint" id="relationship-hint" role="note">
      <p>Chord Tulza — тулза для музыкантов. Она помогает генерировать аккорды в правильной тональности с вариациями для гитары и клавиш.</p>
      <p>
        У каждого аккорда ты увидишь цветной индикатор. Он показывает отношение текущего аккорда к следующему. <span className="indicator-word good">Зелёный</span> — всё круто звучит. <span className="indicator-word ok">Жёлтый</span> — зависит от контекста. <span className="indicator-word weak">Красный</span> — так себе.
      </p>
      <p className="relationship-reminder">Но помни: это лишь подсказки, ориентируйся на звук!</p>
    </div>
  );
}
