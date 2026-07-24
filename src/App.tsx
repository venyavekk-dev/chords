import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, Trash2 } from "lucide-react";
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
  const [volume, setVolume] = useState(initial.volume ?? 0.2);
  const [sound, setSound] = useState<SoundPreset>(initial.sound ?? "Velvet");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingAcknowledged, setOnboardingAcknowledged] = useState(false);
  const [capoFret, setCapoFret] = useState(0);
  const [voicingMemory, setVoicingMemory] = useState<Record<string, string>>(initial.voicingMemory ?? {});
  const [sequencerMode, setSequencerMode] = useState(false);
  const [sequence, setSequence] = useState<DegreeChord[]>([]);
  const [stepCount, setStepCount] = useState(4);
  const [bpm, setBpm] = useState(96);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [dragStepIndex, setDragStepIndex] = useState<number | null>(null);
  const keyRoot = capoFret > 0 ? transpose(baseKeyRoot, capoFret) : baseKeyRoot;
  const chords = useMemo(() => buildDiatonicChords(keyRoot, scaleMode), [keyRoot, scaleMode]);
  const chordVariants = useMemo(() => chords.map((chord) => variantsForChord(chord, keyRoot, scaleMode)), [chords, keyRoot, scaleMode]);
  const [activeChord, setActiveChord] = useState<DegreeChord>(chords[0]);
  const [selectedVoicing, setSelectedVoicing] = useState<GuitarVoicing | undefined>();
  const [previewChord, setPreviewChord] = useState<DegreeChord | undefined>();
  const [previewVoicing, setPreviewVoicing] = useState<GuitarVoicing | undefined>();
  const voicings = useMemo(() => generateVoicings(activeChord.symbol, capoFret), [activeChord.symbol, capoFret]);
  const visibleChord = previewChord ?? activeChord;
  const visibleVoicings = useMemo(() => generateVoicings(visibleChord.symbol, capoFret), [visibleChord.symbol, capoFret]);
  const visibleVoicing = previewVoicing
    ?? (previewChord ? pickVoicing(visibleVoicings, voicingMemory[visibleChord.symbol]) : selectedVoicing);
  const relationText = previewChord
    ? transitionExplanation(activeChord, previewChord, scaleMode)
    : defaultTransitionAdvice(activeChord);

  useEffect(() => {
    setActiveChord(chords[0]);
  }, [chords, keyRoot]);

  useEffect(() => {
    const memorized = voicingMemory[activeChord.symbol];
    setSelectedVoicing(pickVoicing(voicings, memorized));
  }, [activeChord.symbol, voicings, voicingMemory]);

  useEffect(() => {
    saveState({ keyRoot: baseKeyRoot, scaleMode, instrument, progression: [], volume, sound, voicingMemory });
  }, [baseKeyRoot, scaleMode, instrument, volume, sound, voicingMemory]);

  const playbackSettings = useRef({ volume, sound, capoFret, voicingMemory });
  playbackSettings.current = { volume, sound, capoFret, voicingMemory };
  const sequenceRef = useRef(sequence);
  sequenceRef.current = sequence;
  const stepMs = (60000 / bpm) * 2;

  useEffect(() => {
    if (!isPlaying || sequence.length === 0) {
      setCurrentStep(null);
      return;
    }
    let index = 0;
    const playStep = () => {
      const steps = sequenceRef.current;
      if (steps.length === 0) return;
      const position = index % steps.length;
      const chord = steps[position];
      const { volume: currentVolume, sound: currentSound, capoFret: currentCapo, voicingMemory: currentMemory } = playbackSettings.current;
      const stepVoicings = generateVoicings(chord.symbol, currentCapo);
      const voicing = pickVoicing(stepVoicings, currentMemory[chord.symbol]);
      playChord(chord.symbol, currentVolume, voicing, currentSound);
      setCurrentStep(position);
      index += 1;
    };
    playStep();
    const id = window.setInterval(playStep, stepMs);
    return () => window.clearInterval(id);
  }, [isPlaying, bpm, sequence.length]);

  const toggleSequencerMode = () => {
    setSequencerMode((mode) => !mode);
    setIsPlaying(false);
  };

  const addSequenceChord = (chord: DegreeChord) => {
    setSequence((current) => (current.length >= stepCount ? current : [...current, chord]));
  };

  const removeSequenceStep = (index: number) => {
    setSequence((current) => current.filter((_, i) => i !== index));
  };

  const moveSequenceStep = (fromIndex: number, toIndex: number) => {
    setSequence((current) => {
      if (fromIndex >= current.length || fromIndex === toIndex) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const clearSequence = () => {
    setIsPlaying(false);
    setSequence([]);
  };

  const changeStepCount = (next: number) => {
    const clamped = Math.max(2, Math.min(8, next));
    setStepCount(clamped);
    setSequence((current) => current.slice(0, clamped));
  };

  const togglePlay = () => setIsPlaying((playing) => !playing);
  const sequencedSymbols = new Set(sequence.map((item) => item.symbol));
  const playingSymbol = isPlaying && currentStep !== null ? sequence[currentStep]?.symbol : undefined;

  const selectChord = (chord: DegreeChord) => {
    setPreviewChord(undefined);
    setPreviewVoicing(undefined);
    setActiveChord(chord);
    const nextVoicings = generateVoicings(chord.symbol, capoFret);
    const memorized = voicingMemory[chord.symbol];
    const nextVoicing = pickVoicing(nextVoicings, memorized);
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
        sequencerMode={sequencerMode}
        onToggleSequencer={toggleSequencerMode}
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
        {sequencerMode && (
          <div className="sequencer-toolbar">
            <button
              type="button"
              className={`sequencer-icon-button play ${isPlaying ? "is-playing" : ""}`}
              onClick={togglePlay}
              disabled={sequence.length === 0}
              aria-label={isPlaying ? "Остановить" : "Играть последовательность"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              type="button"
              className="sequencer-icon-button"
              onClick={clearSequence}
              disabled={sequence.length === 0}
              aria-label="Удалить аккорды"
            >
              <Trash2 size={16} />
            </button>
            <div className="sequencer-steps" aria-label="Количество шагов">
              <button
                type="button"
                className="sequencer-icon-button small"
                onClick={() => changeStepCount(stepCount - 1)}
                disabled={stepCount <= 2}
                aria-label="Меньше шагов"
              >
                <Minus size={13} />
              </button>
              <strong>{stepCount}</strong>
              <button
                type="button"
                className="sequencer-icon-button small"
                onClick={() => changeStepCount(stepCount + 1)}
                disabled={stepCount >= 8}
                aria-label="Больше шагов"
              >
                <Plus size={13} />
              </button>
            </div>
            <div className="sequencer-bpm">
              <button
                type="button"
                className="sequencer-icon-button small"
                onClick={() => setBpm((value) => Math.max(40, value - 5))}
                disabled={bpm <= 40}
                aria-label="Медленнее"
              >
                <Minus size={13} />
              </button>
              <label>
                BPM
                <input
                  type="number"
                  min={40}
                  max={220}
                  value={bpm}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isNaN(value)) setBpm(value);
                  }}
                  onBlur={(event) => {
                    const value = Number(event.target.value);
                    setBpm(Math.max(40, Math.min(220, Number.isNaN(value) ? bpm : value)));
                  }}
                />
              </label>
              <button
                type="button"
                className="sequencer-icon-button small"
                onClick={() => setBpm((value) => Math.min(220, value + 5))}
                disabled={bpm >= 220}
                aria-label="Быстрее"
              >
                <Plus size={13} />
              </button>
            </div>
            <div className="sequencer-slots" aria-label="Последовательность аккордов">
              {Array.from({ length: stepCount }).map((_, index) => {
                const step = sequence[index];
                return (
                  <button
                    type="button"
                    key={index}
                    className={`sequencer-slot ${step ? "filled" : ""} ${isPlaying && currentStep === index ? "current" : ""} ${dragStepIndex === index ? "dragging" : ""}`}
                    style={isPlaying && currentStep === index ? { animationDuration: `${stepMs}ms` } : undefined}
                    onClick={() => step && removeSequenceStep(index)}
                    disabled={!step}
                    aria-label={step ? `Убрать шаг ${index + 1}: ${step.symbol}` : `Шаг ${index + 1} пуст`}
                    title={step ? "Нажми, чтобы убрать, перетащи, чтобы переставить" : undefined}
                    draggable={Boolean(step)}
                    onDragStart={() => setDragStepIndex(index)}
                    onDragOver={(event) => {
                      if (dragStepIndex === null) return;
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (dragStepIndex === null) return;
                      moveSequenceStep(dragStepIndex, index);
                      setDragStepIndex(null);
                    }}
                    onDragEnd={() => setDragStepIndex(null)}
                  >
                    {step ? step.symbol : index + 1}
                  </button>
                );
              })}
            </div>
          </div>
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
              <button
                className={`strip-main ${sequencerMode && sequencedSymbols.has(chord.symbol) ? "sequencer-selected" : ""} ${chord.symbol === playingSymbol ? "sequencer-current" : ""}`}
                style={chord.symbol === playingSymbol ? { animationDuration: `${stepMs}ms` } : undefined}
                onClick={() => {
                  selectChord(chord);
                  if (sequencerMode) addSequenceChord(chord);
                }}
              >
                <span>{chord.degree}</span>
                <strong>{chord.symbol}</strong>
              </button>
              <div className="variant-row">
                {chordVariants[index].map((variant) => (
                  <button
                    className={`variant-chip ${activeChord.symbol === variant.symbol ? "active" : ""} ${sequencerMode && sequencedSymbols.has(variant.symbol) ? "sequencer-selected" : ""} ${variant.symbol === playingSymbol ? "sequencer-current" : ""}`}
                    style={variant.symbol === playingSymbol ? { animationDuration: `${stepMs}ms` } : undefined}
                    key={variant.symbol}
                    onClick={() => {
                      selectChord(variant);
                      if (sequencerMode) addSequenceChord(variant);
                    }}
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
        {onboardingOpen && (
          <RelationshipHint acknowledged={onboardingAcknowledged} onAcknowledge={() => setOnboardingAcknowledged(true)}>
            {relationText}
          </RelationshipHint>
        )}
      </main>
    </div>
  );
}

function pickVoicing(voicings: GuitarVoicing[], memorizedKey?: string): GuitarVoicing | undefined {
  return voicings.find((voicing) => voicing.frets.join("") === memorizedKey) ?? voicings[0];
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
