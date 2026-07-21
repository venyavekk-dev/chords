import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OnboardingGuide } from "./OnboardingGuide";

describe("OnboardingGuide", () => {
  it("colors every journey and indicator term with existing relation groups", () => {
    const html = renderToStaticMarkup(<OnboardingGuide />);

    for (const term of ["Дом", "Выход из дома", "Напряжение", "Дорога домой", "Неожиданный поворот", "зелёный", "жёлтый", "красный"]) {
      expect(html).toContain(term);
    }
    expect(html.match(/onboarding-term good/g)).toHaveLength(4);
    expect(html.match(/onboarding-term ok/g)).toHaveLength(3);
    expect(html.match(/onboarding-term weak/g)).toHaveLength(1);
    expect(html).not.toMatch(/тоника|субдоминанта|доминанта|функциональная гармония/i);
  });
});
