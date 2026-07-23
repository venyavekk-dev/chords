import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { MinimalFretboard } from "./components/MinimalFretboard";
import { PianoKeyboard } from "./components/PianoKeyboard";
import { RelationshipHint } from "./components/RelationshipHint";
import { TopBar } from "./components/TopBar";
import { VoicingMini } from "./components/VoicingMini";
import { buildDiatonicChords, buildScale, parseChord, transpose } from "./lib/musicTheory";
import { generateVoicings } from "./lib/guitar";
import { loadState, saveState } from "./lib/storage";
import { playChord } from "./lib/audio";
import type { DegreeChord, GuitarVoicing, Instrument, ScaleMode, SoundPreset } from "./types/music";

const initial = loadState();

export default function App() {
  const [baseKeyRoot, setBaseKeyRoot] = useState(initial.keyRoot ?? "E");
  const [scaleMode, setScaleMode] = useState<ScaleMode>(initial.scaleMode ?? "Major");
  const [instrument, setInstrument] = useState<Instrument>(initial.instrument ?? "Guitar");
  const [volume, setVolume] = useState(initial.volume ?? 0.72);
  const [sound, setSound] = useState<SoundPreset>(initial.sound ?? "Velvet");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingAcknowledged, setOnboardingAcknowledged] = useState(false);
  const [capoFret, setCapoFret] = useState(0);
  const [voicingMemory, setVoicingMemory] = useState<Record<string, string>>(initial.voicingMemory ?? {});
  const keyRoot = capoFret > 0 ? transpose(baseKeyRoot, capoFret) : baseKeyRoot;
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
  const relationText = previewChord
    ? transitionExplanation(activeChord, previewChord, scaleMode)
    : defaultTransitionAdvice(activeChord);

  useEffect(() => {
    setActiveChord(chords[0]);
  }, [chords, keyRoot]);

  useEffect(() => {
    const memorized = voicingMemory[activeChord.symbol];
    setSelectedVoicing(pickVoicingForCapo(voicings, capoFret, memorized));
  }, [activeChord.symbol, voicings, voicingMemory, capoFret]);

  useEffect(() => {
    saveState({ keyRoot: baseKeyRoot, scaleMode, instrument, progression: [], volume, sound, voicingMemory });
  }, [baseKeyRoot, scaleMode, instrument, volume, sound, voicingMemory]);

  const selectChord = (chord: DegreeChord) => {
    setPreviewChord(undefined);
    setPreviewVoicing(undefined);
    setActiveChord(chord);
    const nextVoicings = generateVoicings(chord.symbol);
    const memorized = voicingMemory[chord.symbol];
    const nextVoicing = pickVoicingForCapo(nextVoicings, capoFret, memorized);
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

  const changeKeyRoot = (value: string) => {
    setBaseKeyRoot(value);
    setCapoFret(0);
  };

  const toggleCapo = (fret: number) => {
    setCapoFret((current) => (current === fret ? 0 : fret));
  };

  const visiblePositionVoicings = useMemo(() => {
    const available = voicings.filter((voicing) => !isVoicingBlockedByCapo(voicing, capoFret));
    return available.length > 0 ? available : voicings;
  }, [voicings, capoFret]);

  return (
    <div className="app">
      <TopBar
        keyRoot={keyRoot}
        scaleMode={scaleMode}
        instrument={instrument}
        sound={sound}
        onboardingOpen={onboardingOpen}
        volume={volume}
        onKeyRoot={changeKeyRoot}
        onScaleMode={setScaleMode}
        onInstrument={setInstrument}
        onPlayChord={() => playChord(activeChord.symbol, volume, selectedVoicing, sound)}
        onSound={selectSound}
        onToggleOnboarding={() => setOnboardingOpen((open) => !open)}
        onVolume={setVolume}
      />
      <main className="minimal-workspace">
        {(instrument === "Guitar" || instrument === "Both") && (
          <MinimalFretboard
            chordSymbol={visibleChord.symbol}
            voicing={visibleVoicing}
            capoFret={capoFret}
            onCapoChange={toggleCapo}
          />
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
          {visiblePositionVoicings.map((voicing) => (
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
        {onboardingOpen && (
          <RelationshipHint acknowledged={onboardingAcknowledged} onAcknowledge={() => setOnboardingAcknowledged(true)}>
            {relationText}
          </RelationshipHint>
        )}
      </main>
    </div>
  );
}

function isVoicingBlockedByCapo(voicing: GuitarVoicing, capoFret: number): boolean {
  if (capoFret <= 0) return false;
  return voicing.frets.some((fret) => typeof fret === "number" && fret > 0 && fret < capoFret);
}

function pickVoicingForCapo(voicings: GuitarVoicing[], capoFret: number, memorizedKey?: string): GuitarVoicing | undefined {
  const available = voicings.filter((voicing) => !isVoicingBlockedByCapo(voicing, capoFret));
  const pool = available.length > 0 ? available : voicings;
  return pool.find((voicing) => voicing.frets.join("") === memorizedKey) ?? pool[0];
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

function defaultTransitionAdvice(from: DegreeChord) {
  if (from.functionName === "tonic") {
    return <span>Сейчас ты в{"\u00A0"}<mark className="home-word">доме</mark>: лучше вести в{"\u00A0"}прогулку или сразу создать <mark className="tension-word">напряжение</mark>.</span>;
  }
  if (from.functionName === "subdominant") {
    return <span>Сейчас ты вышел гулять: хорошо вести дальше в{"\u00A0"}<mark className="tension-word">напряжение</mark>, потом домой.</span>;
  }
  if (from.functionName === "dominant") {
    return <span>Сейчас есть <mark className="tension-word">напряжение</mark>: сильнее всего звучит возврат в{"\u00A0"}<mark className="home-word">дом</mark>.</span>;
  }
  return <span>Это цветовой аккорд: ищи рядом <mark className="home-word">дом</mark> или мягкое развитие.</span>;
}

function transitionExplanation(from: DegreeChord, to: DegreeChord, mode: ScaleMode): ReactNode {
  const relation = transitionRelation(from, to, mode);
  const fromFunction = functionLabel(from.functionName);
  const toFunction = functionLabel(to.functionName);
  if (from.degree === to.degree) return <span>Стоишь на{"\u00A0"}месте: удерживаешь текущее настроение без{"\u00A0"}движения.</span>;
  if (from.functionName === "dominant" && to.functionName === "tonic") {
    return <span>Возвращение в{"\u00A0"}<mark className="home-word">дом</mark>: <mark className="tension-word">напряжение</mark> красиво разрешается.</span>;
  }
  if (from.functionName === "subdominant" && to.functionName === "dominant") {
    return <span>Пошёл гулять и{"\u00A0"}создал <mark className="tension-word">напряжение</mark>: хороший шаг перед возвращением домой.</span>;
  }
  if (from.functionName === "tonic" && to.functionName === "subdominant") {
    return <span>Выход из{"\u00A0"}<mark className="home-word">дома</mark>: мягкое развитие без{"\u00A0"}резкого <mark className="tension-word">напряжения</mark>.</span>;
  }
  if (from.functionName === "tonic" && to.functionName === "dominant") {
    return <span>Сразу создаёшь <mark className="tension-word">напряжение</mark>: появляется вопрос, который просится обратно в{"\u00A0"}<mark className="home-word">дом</mark>.</span>;
  }
  if (from.functionName === "dominant" && to.functionName !== "tonic") {
    return <span><mark className="tension-word">Напряжение</mark> не{"\u00A0"}вернулось в{"\u00A0"}<mark className="home-word">дом</mark>: переход более острый и{"\u00A0"}менее устойчивый.</span>;
  }
  if (from.functionName === to.functionName) {
    return <span>Оба аккорда из{"\u00A0"}одной зоны ({fromFunction}): цвет меняется, но{"\u00A0"}движение слабее.</span>;
  }
  if (relation === "good") return <span>Естественное движение: {fromFunction} ведёт в{"\u00A0"}{toFunction}.</span>;
  if (relation === "weak") return <span>Слабая смена функции: может звучать статично или спорно.</span>;
  return <span>Рабочая связка: {fromFunction} переходит в{"\u00A0"}{toFunction} без{"\u00A0"}сильного конфликта.</span>;
}

function functionLabel(functionName: DegreeChord["functionName"]) {
  if (functionName === "tonic") return "дом/тоника";
  if (functionName === "subdominant") return "прогулка/подготовка";
  if (functionName === "dominant") return "напряжение";
  return "цвет";
}
