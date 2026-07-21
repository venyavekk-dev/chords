import { useEffect, useMemo, useState } from "react";
import { MinimalFretboard } from "./components/MinimalFretboard";
import { PianoKeyboard } from "./components/PianoKeyboard";
import { RelationshipHint } from "./components/RelationshipHint";
import { TopBar } from "./components/TopBar";
import { VoicingMini } from "./components/VoicingMini";
import { buildDiatonicChords, buildScale, parseChord } from "./lib/musicTheory";
import { generateVoicings } from "./lib/guitar";
import { loadState, saveState } from "./lib/storage";
import { playChord } from "./lib/audio";
import type { DegreeChord, GuitarVoicing, Instrument, ScaleMode, SoundPreset } from "./types/music";

const initial = loadState();

export default function App() {
  const [keyRoot, setKeyRoot] = useState(initial.keyRoot ?? "E");
  const [scaleMode, setScaleMode] = useState<ScaleMode>(initial.scaleMode ?? "Major");
  const [instrument, setInstrument] = useState<Instrument>(initial.instrument ?? "Guitar");
  const [volume, setVolume] = useState(initial.volume ?? 0.72);
  const [sound, setSound] = useState<SoundPreset>(initial.sound ?? "Velvet");
  const [voicingMemory, setVoicingMemory] = useState<Record<string, string>>(initial.voicingMemory ?? {});
  const chords = useMemo(() => buildDiatonicChords(keyRoot, scaleMode), [keyRoot, scaleMode]);
  const chordVariants = useMemo(() => chords.map((chord) => variantsForChord(chord, keyRoot, scaleMode)), [chords, keyRoot, scaleMode]);
  const [activeChord, setActiveChord] = useState<DegreeChord>(chords[0]);
  const [selectedVoicing, setSelectedVoicing] = useState<GuitarVoicing | undefined>();
  const [previewChord, setPreviewChord] = useState<DegreeChord | undefined>();
  const [previewVoicing, setPreviewVoicing] = useState<GuitarVoicing | undefined>();
  const voicings = useMemo(() => generateVoicings(activeChord.symbol), [activeChord.symbol]);
  const visibleChord = previewChord ?? activeChord;
  const visibleVoicings = useMemo(() => generateVoicings(visibleChord.symbol), [visibleChord.symbol]);
  const visibleVoicing = previewVoicing ?? (previewChord ? visibleVoicings[0] : selectedVoicing);

  useEffect(() => {
    setActiveChord(chords[0]);
  }, [chords, keyRoot]);

  useEffect(() => {
    const memorized = voicingMemory[activeChord.symbol];
    setSelectedVoicing(voicings.find((voicing) => voicing.frets.join("") === memorized) ?? voicings[0]);
  }, [activeChord.symbol, voicings, voicingMemory]);

  useEffect(() => {
    saveState({ keyRoot, scaleMode, instrument, progression: [], volume, sound, voicingMemory });
  }, [keyRoot, scaleMode, instrument, volume, sound, voicingMemory]);

  const selectChord = (chord: DegreeChord) => {
    setPreviewChord(undefined);
    setPreviewVoicing(undefined);
    setActiveChord(chord);
    const nextVoicings = generateVoicings(chord.symbol);
    const memorized = voicingMemory[chord.symbol];
    const nextVoicing = nextVoicings.find((voicing) => voicing.frets.join("") === memorized) ?? nextVoicings[0];
    playChord(chord.symbol, volume, nextVoicing, sound);
  };

  const selectVoicing = (voicing: GuitarVoicing) => {
    setPreviewVoicing(undefined);
    setSelectedVoicing(voicing);
    setVoicingMemory((memory) => ({ ...memory, [activeChord.symbol]: voicing.frets.join("") }));
    playChord(activeChord.symbol, volume, voicing, sound);
  };

  const selectSound = (nextSound: SoundPreset) => {
    setSound(nextSound);
    playChord(activeChord.symbol, volume, selectedVoicing, nextSound);
  };

  return (
    <div className="app">
      <TopBar
        keyRoot={keyRoot}
        scaleMode={scaleMode}
        instrument={instrument}
        sound={sound}
        volume={volume}
        onKeyRoot={setKeyRoot}
        onScaleMode={setScaleMode}
        onInstrument={setInstrument}
        onSound={selectSound}
        onVolume={setVolume}
      />
      <main className="minimal-workspace">
        {(instrument === "Guitar" || instrument === "Both") && (
          <MinimalFretboard chordSymbol={visibleChord.symbol} voicing={visibleVoicing} />
        )}
        {(instrument === "Piano" || instrument === "Both") && (
          <PianoKeyboard chordSymbol={visibleChord.symbol} voicing={visibleVoicing} />
        )}
        <section
          className="chord-strip"
          onMouseLeave={() => {
            setPreviewChord(undefined);
            setPreviewVoicing(undefined);
          }}
        >
          {chords.map((chord, index) => (
            <div
              className={`strip-chord ${activeChord.degree === chord.degree ? "active" : ""}`}
              key={chord.degree}
              onMouseEnter={() => {
                setPreviewVoicing(undefined);
                setPreviewChord(chord);
              }}
            >
              <i className={`relation-dot ${transitionRelation(activeChord, chord, scaleMode)}`} />
              <button className="strip-main" onClick={() => selectChord(chord)}>
                <span>{chord.degree}</span>
                <strong>{chord.symbol}</strong>
              </button>
              <div className="variant-row">
                {chordVariants[index].map((variant) => (
                  <button
                    className={`variant-chip ${activeChord.symbol === variant.symbol ? "active" : ""}`}
                    key={variant.symbol}
                    onClick={() => selectChord(variant)}
                    onMouseEnter={() => {
                      setPreviewVoicing(undefined);
                      setPreviewChord(variant);
                    }}
                  >
                    {variantLabel(variant)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
        <section className="position-strip" onMouseLeave={() => setPreviewVoicing(undefined)}>
          {voicings.map((voicing) => (
            <button
              className={`position-button ${selectedVoicing?.frets.join("") === voicing.frets.join("") ? "active" : ""}`}
              key={voicing.frets.join("-")}
              onClick={() => selectVoicing(voicing)}
              onMouseEnter={() => {
                setPreviewChord(undefined);
                setPreviewVoicing(voicing);
              }}
            >
              <VoicingMini voicing={voicing} />
            </button>
          ))}
        </section>
        <RelationshipHint />
      </main>
    </div>
  );
}

function variantsForChord(chord: DegreeChord, keyRoot: string, mode: ScaleMode): DegreeChord[] {
  const scaleNotes = new Set(buildScale(keyRoot, mode));
  const variants = [
    chord.symbol,
    `${chord.root}sus2`,
    `${chord.root}sus4`,
    `${chord.root}${seventhSuffix(chord, mode)}`,
  ];

  return variants
    .filter((symbol, index, all) => all.indexOf(symbol) === index)
    .filter((symbol) => parseChord(symbol).tones.every((tone) => scaleNotes.has(tone)))
    .map((symbol) => ({ ...chord, symbol }));
}

function seventhSuffix(chord: DegreeChord, mode: ScaleMode) {
  const cleanDegree = chord.degree.replace("°", "");
  if (chord.quality === "diminished") return "m7b5";
  if (chord.quality === "minor") return "m7";
  if ((mode === "Major" && cleanDegree === "V") || (mode === "Minor" && cleanDegree === "VII")) return "7";
  return "maj7";
}

function variantLabel(variant: DegreeChord) {
  return variant.symbol;
}

function transitionRelation(from: DegreeChord, to: DegreeChord, mode: ScaleMode) {
  if (from.degree === to.degree) return "neutral";
  const cleanFrom = from.degree.replace("°", "");
  const cleanTo = to.degree.replace("°", "");
  const goodMajor: Record<string, string[]> = {
    I: ["IV", "V", "vi"],
    ii: ["V", "vii"],
    iii: ["vi", "IV"],
    IV: ["V", "I", "ii"],
    V: ["I", "vi"],
    vi: ["ii", "IV", "V"],
    vii: ["I"],
  };
  const goodMinor: Record<string, string[]> = {
    i: ["iv", "v", "VI", "VII"],
    ii: ["v"],
    III: ["VI", "iv"],
    iv: ["v", "i", "VII"],
    v: ["i", "VI"],
    VI: ["VII", "iv", "v"],
    VII: ["i", "III"],
  };
  const good = mode === "Major" ? goodMajor : goodMinor;
  if (good[cleanFrom]?.includes(cleanTo)) return "good";
  if (from.functionName === "dominant" && to.functionName === "tonic") return "good";
  if (from.functionName === "subdominant" && to.functionName === "dominant") return "good";
  if (from.functionName === to.functionName) return "weak";
  return "ok";
}
