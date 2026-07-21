import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TopBar } from "./TopBar";

describe("TopBar onboarding", () => {
  it("starts closed and does not render the persistent key description", () => {
    const html = renderToStaticMarkup(
      <TopBar
        keyRoot="E"
        scaleMode="Major"
        instrument="Guitar"
        sound="Velvet"
        onboardingOpen={false}
        volume={0.72}
        onKeyRoot={() => undefined}
        onScaleMode={() => undefined}
        onInstrument={() => undefined}
        onSound={() => undefined}
        onToggleOnboarding={() => undefined}
        onVolume={() => undefined}
      />,
    );

    expect(html).toContain("Chord Tulza");
    expect(html).toContain("<i>by Venya Vekk</i>");
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain("harmony map");
  });
});
