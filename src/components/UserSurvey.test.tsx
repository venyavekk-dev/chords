import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildSurveyPayload, isSurveyPreview, UserSurvey } from "./UserSurvey";

describe("UserSurvey", () => {
  it("renders the launcher before the user is eligible for automatic opening", () => {
    const html = renderToStaticMarkup(<UserSurvey eligible={false} />);

    expect(html).toContain('aria-label="Открыть короткий опрос"');
    expect(html).toContain("user-survey-badge");
    expect(html).not.toContain("Как часто ты сейчас пользуешься Chord Tulza?");
  });

  it("maps answers to the published Google Form fields without leaking contact to analytics", () => {
    const payload = buildSurveyPayload({
      frequency: "Несколько раз в неделю",
      goal: "Сочинить прогрессию",
      friction: "Нужен MIDI‑экспорт",
      feature: "Полноценная версия для iPad",
      payment: "Один раз навсегда",
      price: "990 ₽ один раз",
    }, "  Хочу синхронизацию между устройствами  ", "  @musician  ");

    expect(payload.get("entry.232382321")).toBe("Несколько раз в неделю");
    expect(payload.get("entry.122178230")).toBe("Сочинить прогрессию");
    expect(payload.get("entry.2012861588")).toBe("Нужен MIDI‑экспорт");
    expect(payload.get("entry.178919732")).toBe("Полноценная версия для iPad");
    expect(payload.get("entry.1168274726")).toBe("Один раз навсегда");
    expect(payload.get("entry.913441010")).toBe("990 ₽ один раз");
    expect(payload.get("entry.1316376898")).toBe("Хочу синхронизацию между устройствами");
    expect(payload.get("entry.1575555321")).toBe("@musician");
  });

  it("only enables preview mode for the explicit survey query", () => {
    expect(isSurveyPreview("?survey=preview")).toBe(true);
    expect(isSurveyPreview("?survey=preview&utm_source=codex")).toBe(true);
    expect(isSurveyPreview("?survey=completed")).toBe(false);
    expect(isSurveyPreview("")).toBe(false);
  });
});
