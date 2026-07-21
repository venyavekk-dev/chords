import type { GuitarVoicing, SoundPreset } from "../types/music";
import { NOTES, parseChord } from "./musicTheory";

let audioContext: AudioContext | undefined;
let reverbBuffer: AudioBuffer | undefined;
let activeMaster: GainNode | undefined;

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContext() {
  const audioWindow = window as AudioWindow;
  const Context = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!Context) return undefined;
  audioContext ??= new Context();
  return audioContext;
}

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

type SoundProfile = {
  oscillator: OscillatorType;
  body: OscillatorType;
  attack: number;
  duration: number;
  level: number;
  detune: number;
  lowpassStart: number;
  lowpassEnd: number;
  ampFrequency: number;
  ampGain: number;
  cabinet: number;
  drive: number;
  shimmer: number;
  pick: number;
  pickFrequency: number;
  delay: number;
  reverb: number;
  stagger: number;
};

const SOUND_PROFILES: Record<SoundPreset, SoundProfile> = {
  Velvet: { oscillator: "triangle", body: "sine", attack: 0.018, duration: 1.18, level: 0.46, detune: -4, lowpassStart: 3000, lowpassEnd: 1250, ampFrequency: 620, ampGain: 2.4, cabinet: 2800, drive: 0.42, shimmer: 0.018, pick: 0.045, pickFrequency: 1800, delay: 0.025, reverb: 0.14, stagger: 0.022 },
  Clean: { oscillator: "sawtooth", body: "triangle", attack: 0.006, duration: 0.95, level: 0.43, detune: -2, lowpassStart: 4600, lowpassEnd: 1650, ampFrequency: 820, ampGain: 3.2, cabinet: 3800, drive: 1.12, shimmer: 0.045, pick: 0.1, pickFrequency: 2800, delay: 0.05, reverb: 0.065, stagger: 0.018 },
  Glass: { oscillator: "sine", body: "triangle", attack: 0.003, duration: 1.08, level: 0.42, detune: 3, lowpassStart: 7200, lowpassEnd: 2600, ampFrequency: 1800, ampGain: 4.6, cabinet: 6800, drive: 0.18, shimmer: 0.15, pick: 0.07, pickFrequency: 4200, delay: 0.13, reverb: 0.2, stagger: 0.03 },
  Nylon: { oscillator: "triangle", body: "sine", attack: 0.009, duration: 0.82, level: 0.47, detune: -7, lowpassStart: 2650, lowpassEnd: 980, ampFrequency: 430, ampGain: 1.8, cabinet: 2350, drive: 0.08, shimmer: 0.008, pick: 0.14, pickFrequency: 1450, delay: 0, reverb: 0.045, stagger: 0.026 },
  Air: { oscillator: "sine", body: "sine", attack: 0.045, duration: 1.55, level: 0.38, detune: 5, lowpassStart: 5200, lowpassEnd: 2100, ampFrequency: 1100, ampGain: 2.2, cabinet: 5100, drive: 0.03, shimmer: 0.085, pick: 0.012, pickFrequency: 3300, delay: 0.17, reverb: 0.34, stagger: 0.04 },
};

export function playChord(symbol: string, volume = 0.72, voicing?: GuitarVoicing, sound: SoundPreset = "Velvet") {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume();
  const profile = SOUND_PROFILES[sound];

  const fadeNow = context.currentTime;
  if (activeMaster) {
    activeMaster.gain.cancelScheduledValues(fadeNow);
    activeMaster.gain.setTargetAtTime(0.0001, fadeNow, 0.012);
  }

  const chord = parseChord(symbol);
  const rootIndex = NOTES.indexOf(chord.root as (typeof NOTES)[number]);
  const now = context.currentTime;
  const master = context.createGain();
  activeMaster = master;
  const compressor = context.createDynamicsCompressor();
  const amp = context.createBiquadFilter();
  const cabinet = context.createBiquadFilter();
  const drive = context.createWaveShaper();
  const inputTrim = context.createGain();
  const delay = context.createDelay(0.8);
  const delayGain = context.createGain();
  const reverb = context.createConvolver();
  const reverbGain = context.createGain();

  amp.type = "peaking";
  amp.frequency.setValueAtTime(profile.ampFrequency, now);
  amp.gain.setValueAtTime(profile.ampGain, now);
  amp.Q.setValueAtTime(0.9, now);
  cabinet.type = "lowpass";
  cabinet.frequency.setValueAtTime(profile.cabinet, now);
  cabinet.Q.setValueAtTime(0.74, now);
  drive.curve = makeDriveCurve(profile.drive);
  drive.oversample = "4x";
  inputTrim.gain.setValueAtTime(0.86, now);
  delay.delayTime.setValueAtTime(0.16, now);
  delayGain.gain.setValueAtTime(profile.delay, now);
  reverb.buffer = getReverbBuffer(context);
  reverbGain.gain.setValueAtTime(profile.reverb, now);
  compressor.threshold.setValueAtTime(-18, now);
  compressor.knee.setValueAtTime(22, now);
  compressor.ratio.setValueAtTime(3.2, now);
  compressor.attack.setValueAtTime(0.006, now);
  compressor.release.setValueAtTime(0.24, now);

  master.gain.setValueAtTime(Math.max(0.04, Math.min(1, volume)), now);
  master.gain.setTargetAtTime(0.0001, now + profile.duration * 0.72, profile.duration * 0.13);
  master.connect(inputTrim).connect(amp).connect(drive).connect(cabinet).connect(compressor).connect(context.destination);
  cabinet.connect(delay).connect(delayGain).connect(compressor);
  cabinet.connect(reverb).connect(reverbGain).connect(compressor);

  const midiNotes = voicing
    ? voicing.frets
      .map((fret, stringIndex) => (fret === "x" ? undefined : OPEN_STRING_MIDI[stringIndex] + fret))
      .filter((midi): midi is number => typeof midi === "number")
    : chord.tones.map((note) => {
      const noteIndex = NOTES.indexOf(note as (typeof NOTES)[number]);
      const octaveShift = noteIndex < rootIndex ? 1 : 0;
      return 52 + rootIndex + (noteIndex - rootIndex + octaveShift * 12);
    });

  midiNotes.forEach((midi, index) => {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const start = now + index * profile.stagger;
    const oscillator = context.createOscillator();
    const body = context.createOscillator();
    const voiceGain = context.createGain();
    const tone = context.createBiquadFilter();
    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();
    const pick = context.createBufferSource();
    const pickGain = context.createGain();
    const pickTone = context.createBiquadFilter();

    oscillator.type = profile.oscillator;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.detune.setValueAtTime(profile.detune, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.998, start + profile.duration * 0.55);
    body.type = profile.body;
    body.frequency.setValueAtTime(frequency * 0.999, start);
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(frequency * 2.01, start);
    shimmerGain.gain.setValueAtTime(profile.shimmer / chord.tones.length, start);
    shimmerGain.gain.setTargetAtTime(0.0001, start + profile.duration * 0.58, profile.duration * 0.1);
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(profile.lowpassStart + frequency * 1.2, start);
    tone.frequency.exponentialRampToValueAtTime(profile.lowpassEnd + frequency * 0.6, start + profile.duration * 0.62);
    tone.Q.setValueAtTime(0.52, start);
    voiceGain.gain.setValueAtTime(0.0001, start);
    voiceGain.gain.linearRampToValueAtTime(profile.level / Math.sqrt(midiNotes.length), start + profile.attack);
    voiceGain.gain.setTargetAtTime(0.0001, start + profile.duration * 0.58, profile.duration * 0.14);
    pick.buffer = createPickBuffer(context);
    pickTone.type = "bandpass";
    pickTone.frequency.setValueAtTime(profile.pickFrequency, start);
    pickTone.Q.setValueAtTime(1.2, start);
    pickGain.gain.setValueAtTime(profile.pick / Math.sqrt(midiNotes.length), start);
    pickGain.gain.setTargetAtTime(0.0001, start + 0.035, 0.012);
    oscillator.connect(tone).connect(voiceGain).connect(master);
    body.connect(tone);
    shimmer.connect(shimmerGain).connect(master);
    pick.connect(pickTone).connect(pickGain).connect(master);
    oscillator.start(start);
    body.start(start);
    shimmer.start(start);
    pick.start(start);
    oscillator.stop(start + profile.duration);
    body.stop(start + profile.duration);
    shimmer.stop(start + profile.duration * 0.72);
    pick.stop(start + 0.08);
  });
}

function createPickBuffer(context: AudioContext) {
  const length = Math.floor(context.sampleRate * 0.045);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    const envelope = Math.pow(1 - index / length, 3);
    data[index] = (Math.random() * 2 - 1) * envelope;
  }
  return buffer;
}

function makeDriveCurve(amount: number) {
  const samples = 2048;
  const curve = new Float32Array(samples);
  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / samples - 1;
    curve[index] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

function getReverbBuffer(context: AudioContext) {
  if (reverbBuffer) return reverbBuffer;
  const sampleRate = context.sampleRate;
  const length = sampleRate * 2.1;
  const buffer = context.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      const decay = Math.pow(1 - index / length, 2.4);
      data[index] = (Math.random() * 2 - 1) * decay * 0.55;
    }
  }

  reverbBuffer = buffer;
  return reverbBuffer;
}
