import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RelationshipHint } from "./RelationshipHint";

describe("RelationshipHint", () => {
  it("renders stable desktop and mobile indicator legends", () => {
    const html = renderToStaticMarkup(<RelationshipHint />);

    expect(html).toContain("Индикаторы показывают, как каждый аккорд связан с текущим.");
    expect(html).toContain("Зелёный");
    expect(html).toContain("жёлтый");
    expect(html).toContain("красный");
    expect(html.match(/indicator-word good/g)).toHaveLength(2);
    expect(html.match(/indicator-word ok/g)).toHaveLength(2);
    expect(html.match(/indicator-word weak/g)).toHaveLength(2);
  });
});
