import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildSurveyPayload, UserSurvey } from "./UserSurvey";

describe("UserSurvey", () => {
  it("renders the launcher before the user is eligible for automatic opening", () => {
    const html = renderToStaticMarkup(<UserSurvey eligible={false} />);

    expect(html).toContain('aria-label="Открыть короткий опрос"');
    expect(html).toContain("user-survey-badge");
    expect(html).not.toContain("Для чего ты обычно открываешь Chord Tulza?");
  });

  it("maps answers to the published Google Form fields without leaking contact to analytics", () => {
    const payload = buildSurveyPayload({
      goal: "Сочиняю песню",
      outcome: "Да",
      feature: "Полноценное приложение для iPad",
      purchase: "Да, готов купить",
    }, "  @musician  ");

    expect(payload.get("entry.232382321")).toBe("Сочиняю песню");
    expect(payload.get("entry.122178230")).toBe("Да");
    expect(payload.get("entry.2012861588")).toBe("Полноценное приложение для iPad");
    expect(payload.get("entry.178919732")).toBe("Да, готов купить");
    expect(payload.get("entry.1316376898")).toBe("@musician");
  });
});
