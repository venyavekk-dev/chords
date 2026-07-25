import type { ReactNode } from "react";

type Props = {
  acknowledged: boolean;
  children: ReactNode;
  onAcknowledge: () => void;
};

export function RelationshipHint({ acknowledged, children, onAcknowledge }: Props) {
  if (acknowledged) {
    return <div className="relationship-hint relationship-advice" id="relationship-hint" role="note">{children}</div>;
  }

  return (
    <div className="relationship-hint onboarding-copy" id="relationship-hint" role="note">
      <p>Chord Tulza — тулза для музыкантов. Она помогает генерировать аккорды в&nbsp;правильной тональности с&nbsp;вариациями для&nbsp;гитары и&nbsp;клавиш.</p>
      <p>
        У&nbsp;каждого аккорда ты увидишь цветной индикатор. Он показывает отношение текущего аккорда к&nbsp;следующему. <span className="indicator-word good">Зелёный</span> — всё круто звучит. <span className="indicator-word ok">Жёлтый</span> — зависит от&nbsp;контекста. <span className="indicator-word weak">Красный</span> — так&nbsp;себе.
      </p>
      <p>
        На&nbsp;грифе можно нажать на&nbsp;цифру лада — это как зажать капо. Тональность переключится вверх на&nbsp;этот лад. Нажми на&nbsp;тот&nbsp;же
        лад ещё раз, чтобы отпустить капо и&nbsp;вернуться к&nbsp;прежней тональности.
      </p>
      <p>
        Кнопка «Секвенсор» в&nbsp;шапке превращает блок аккордов в&nbsp;степ-секвенсор: нажимай на&nbsp;аккорды или их&nbsp;варианты, чтобы
        добавить их&nbsp;в&nbsp;очередь — они выделятся синей обводкой. Задай количество шагов и&nbsp;BPM и&nbsp;нажми play — секвенсор проиграет
        аккорды по&nbsp;кругу.
      </p>
      <p className="relationship-reminder">Но&nbsp;помни: это лишь подсказки, ориентируйся на&nbsp;звук!</p>
      <button type="button" className="onboarding-acknowledge" onClick={onAcknowledge}>Понятно</button>
    </div>
  );
}
