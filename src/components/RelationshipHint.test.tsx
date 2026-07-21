import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RelationshipHint } from "./RelationshipHint";

describe("RelationshipHint", () => {
  it("renders the musician onboarding copy with colored indicators", () => {
    const html = renderToStaticMarkup(<RelationshipHint />);

    expect(html).toContain("Chord Tulza — тулза для музыкантов");
    expect(html).toContain("ориентируйся на звук!");
    expect(html).toContain("Зелёный");
    expect(html).toContain("Жёлтый");
    expect(html).toContain("Красный");
    expect(html.match(/indicator-word good/g)).toHaveLength(1);
    expect(html.match(/indicator-word ok/g)).toHaveLength(1);
    expect(html.match(/indicator-word weak/g)).toHaveLength(1);
  });
});
