import type { GuitarVoicing } from "../types/music";
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

export function playChord(symbol: string, volume = 0.72, voicing?: GuitarVoicing) {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume();

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
  amp.frequency.setValueAtTime(820, now);
  amp.gain.setValueAtTime(3.5, now);
  amp.Q.setValueAtTime(0.9, now);
  cabinet.type = "lowpass";
  cabinet.frequency.setValueAtTime(3400, now);
  cabinet.Q.setValueAtTime(0.74, now);
  drive.curve = makeDriveCurve(1.35);
  drive.oversample = "4x";
  inputTrim.gain.setValueAtTime(0.86, now);
  delay.delayTime.setValueAtTime(0.16, now);
  delayGain.gain.setValueAtTime(0.055, now);
  reverb.buffer = getReverbBuffer(context);
  reverbGain.gain.setValueAtTime(0.075, now);
  compressor.threshold.setValueAtTime(-18, now);
  compressor.knee.setValueAtTime(22, now);
  compressor.ratio.setValueAtTime(3.2, now);
  compressor.attack.setValueAtTime(0.006, now);
  compressor.release.setValueAtTime(0.24, now);

  master.gain.setValueAtTime(Math.max(0.04, Math.min(1, volume)), now);
  master.gain.setTargetAtTime(0.0001, now + 0.58, 0.11);
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
    const start = now + index * 0.018;
    const oscillator = context.createOscillator();
    const body = context.createOscillator();
    const voiceGain = context.createGain();
    const tone = context.createBiquadFilter();
    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();
    const pick = context.createBufferSource();
    const pickGain = context.createGain();
    const pickTone = context.createBiquadFilter();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.997, start + 0.38);
    body.type = "triangle";
    body.frequency.setValueAtTime(frequency * 0.998, start);
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(frequency * 2.01, start);
    shimmerGain.gain.setValueAtTime(0.06 / chord.tones.length, start);
    shimmerGain.gain.setTargetAtTime(0.0001, start + 0.34, 0.08);
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(3600 + frequency * 1.8, start);
    tone.frequency.exponentialRampToValueAtTime(1500 + frequency * 0.9, start + 0.5);
    tone.Q.setValueAtTime(0.52, start);
    voiceGain.gain.setValueAtTime(0.5 / Math.sqrt(midiNotes.length), start);
    voiceGain.gain.setTargetAtTime(0.0001, start + 0.5, 0.12);
    pick.buffer = createPickBuffer(context);
    pickTone.type = "bandpass";
    pickTone.frequency.setValueAtTime(2800, start);
    pickTone.Q.setValueAtTime(1.2, start);
    pickGain.gain.setValueAtTime(0.12 / Math.sqrt(midiNotes.length), start);
    pickGain.gain.setTargetAtTime(0.0001, start + 0.035, 0.012);
    oscillator.connect(tone).connect(voiceGain).connect(master);
    body.connect(tone);
    shimmer.connect(shimmerGain).connect(master);
    pick.connect(pickTone).connect(pickGain).connect(master);
    oscillator.start(start);
    body.start(start);
    shimmer.start(start);
    pick.start(start);
    oscillator.stop(start + 0.95);
    body.stop(start + 0.95);
    shimmer.stop(start + 0.62);
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
