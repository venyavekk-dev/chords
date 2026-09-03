import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildSurveyPayload, UserSurvey } from "./UserSurvey";

describe("UserSurvey", () => {
  it("stays hidden until the user is eligible", () => {
    expect(renderToStaticMarkup(<UserSurvey eligible={false} />)).toBe("");
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
