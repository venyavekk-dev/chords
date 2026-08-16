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
        onPlayChord={() => undefined}
        onSound={() => undefined}
        onToggleOnboarding={() => undefined}
        onDonationClick={() => undefined}
        onVolume={() => undefined}
        sequencerMode={false}
        onToggleSequencer={() => undefined}
      />,
    );

    expect(html).toContain("Chord Tulza");
    expect(html).toContain('href="https://venyavekk.com/music"');
    expect(html).not.toContain("tap to preview");
    expect(html).toContain("Тема");
    expect(html).toContain('aria-controls="workspace-settings"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain("harmony map");
    expect(html).toContain('aria-label="Поддержать автора"');
    expect(html).toContain('href="https://t.me/veqqa"');
    expect(html).toContain('aria-label="Написать автору в Telegram"');
    expect(html).not.toContain("Пробный период");
  });
});
