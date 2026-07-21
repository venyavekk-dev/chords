import type { ReactNode } from "react";

type Tone = "good" | "ok" | "weak";

function RelationTerm({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <strong className={`onboarding-term ${tone}`}>{children}</strong>;
}

function QualityTerm({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <strong className={`onboarding-term ${tone}`}>{children}</strong>;
}

export function OnboardingGuide() {
  return (
    <aside className="onboarding-panel" id="onboarding-guide" aria-label="Как читать переходы между аккордами">
      <p className="onboarding-intro">Представь, что музыка — это небольшое путешествие.</p>
      <ul className="onboarding-journey">
        <li><RelationTerm tone="good">Дом</RelationTerm> — место, где всё звучит спокойно и завершённо.</li>
        <li><RelationTerm tone="good">Выход из дома</RelationTerm> начинает движение и уводит музыку вперёд.</li>
        <li><RelationTerm tone="ok">Напряжение</RelationTerm> создаёт ожидание — после такого аккорда обычно хочется продолжить.</li>
        <li><RelationTerm tone="good">Дорога домой</RelationTerm> ведёт обратно к устойчивому и завершённому звучанию.</li>
        <li><RelationTerm tone="ok">Неожиданный поворот</RelationTerm> может звучать интересно, но сильнее зависит от мелодии и контекста.</li>
      </ul>
      <p className="onboarding-legend">
        Цветные индикаторы показывают, насколько естественно следующий аккорд связан с текущим: <QualityTerm tone="good">зелёный</QualityTerm> обычно звучит уверенно, <QualityTerm tone="ok">жёлтый</QualityTerm> зависит от контекста, <QualityTerm tone="weak">красный</QualityTerm> даёт более резкий и непредсказуемый переход.
      </p>
    </aside>
  );
}
