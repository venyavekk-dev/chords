import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RelationshipHint } from "./RelationshipHint";

describe("RelationshipHint", () => {
  it("renders the musician onboarding copy with colored indicators", () => {
    const html = renderToStaticMarkup(<RelationshipHint acknowledged={false} onAcknowledge={() => undefined}>Подсказка</RelationshipHint>);

    expect(html).toContain("Chord Tulza — тулза для музыкантов");
    expect(html).toContain("ориентируйся на\u00a0звук!");
    expect(html).toContain("Зелёный");
    expect(html).toContain("Жёлтый");
    expect(html).toContain("Красный");
    expect(html.match(/indicator-word good/g)).toHaveLength(1);
    expect(html.match(/indicator-word ok/g)).toHaveLength(1);
    expect(html.match(/indicator-word weak/g)).toHaveLength(1);
    expect(html).toContain("Понятно");
  });

  it("shows contextual advice after onboarding is acknowledged", () => {
    const html = renderToStaticMarkup(<RelationshipHint acknowledged onAcknowledge={() => undefined}><span>Сейчас ты дома</span></RelationshipHint>);

    expect(html).toContain("Сейчас ты дома");
    expect(html).not.toContain("Понятно");
  });
});
