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
  bodyRatio?: number;
  bodyLevel?: number;
  highpass?: number;
  pitchDrift?: number;
  shimmerRatio?: number;
  decayStart?: number;
  release?: number;
  pickDecay?: number;
  /** "pluck" swaps the oscillator-based voice for a Karplus-Strong plucked
   * string (a noise burst ringing through a damped feedback delay loop)
   * instead of the additive/subtractive synth path. */
  synthesis?: "pluck";
  /** Lowpass cutoff inside the string's feedback loop - lower values damp
   * high harmonics faster, giving a darker, quicker-decaying string. */
  stringDamping?: number;
  /** Feedback gain (0-1) of the string loop - closer to 1 rings out longer. */
  stringDecay?: number;
};

const SOUND_PROFILES: Record<SoundPreset, SoundProfile> = {
  // Fender-style electric guitar with a light overdrive: a Karplus-Strong
  // plucked string (see playPluckedVoice) gives a genuinely string-like pluck
  // and decay instead of an oscillator swell, and the shared drive waveshaper
  // downstream still adds the "light overdrive" bite on top of it.
  Velvet: { oscillator: "sawtooth", body: "sine", attack: 0.006, duration: 1.3, level: 0.5, detune: -3, lowpassStart: 5200, lowpassEnd: 2600, ampFrequency: 950, ampGain: 2, cabinet: 5200, drive: 0.22, shimmer: 0.03, pick: 0.16, pickFrequency: 2600, delay: 0.02, reverb: 0.12, stagger: 0.014, bodyRatio: 1.003, bodyLevel: 0.16, highpass: 90, pitchDrift: 0.999, shimmerRatio: 2.005, decayStart: 0.55, release: 0.3, pickDecay: 0.02, synthesis: "pluck", stringDamping: 3400, stringDecay: 0.993 },
  // Clean acoustic guitar (Yamaha-style steel-string): same Karplus-Strong
  // string model as Velvet but brighter/longer-ringing (less damping, more
  // feedback), plus a stronger sub-octave body oscillator for the wood/
  // soundhole boom real acoustics have and a solid-body electric doesn't.
  Clean: { oscillator: "triangle", body: "sine", attack: 0.003, duration: 1.85, level: 0.52, detune: 0, lowpassStart: 8200, lowpassEnd: 3200, ampFrequency: 420, ampGain: 1.7, cabinet: 7800, drive: 0.01, shimmer: 0.03, pick: 0.2, pickFrequency: 3700, delay: 0.02, reverb: 0.14, stagger: 0.008, bodyRatio: 0.503, bodyLevel: 0.4, highpass: 60, pitchDrift: 1, shimmerRatio: 3, decayStart: 0.5, release: 0.35, pickDecay: 0.024, synthesis: "pluck", stringDamping: 6200, stringDecay: 0.99 },
  Glass: { oscillator: "sawtooth", body: "sine", attack: 0.002, duration: 0.9, level: 0.35, detune: 4, lowpassStart: 11200, lowpassEnd: 3900, ampFrequency: 3600, ampGain: 4.8, cabinet: 9800, drive: 0.24, shimmer: 0.21, pick: 0.21, pickFrequency: 6400, delay: 0.085, reverb: 0.13, stagger: 0.018, bodyRatio: 2.008, bodyLevel: 0.12, highpass: 430, pitchDrift: 0.9994, shimmerRatio: 3.012, decayStart: 0.38, release: 0.12, pickDecay: 0.02 },
  // Organ: pure sine fundamental plus an octave "drawbar" body tone, no pick
  // transient and no drive, every note starts together (stagger 0) instead of
  // strumming. Sustains at a steady level (decayStart is late) but the tail
  // once the note ends is short/normal, not a long swelling fade.
  Nylon: { oscillator: "sine", body: "sine", attack: 0.008, duration: 1.1, level: 0.42, detune: 0, lowpassStart: 4200, lowpassEnd: 3800, ampFrequency: 900, ampGain: 1.1, cabinet: 4200, drive: 0, shimmer: 0.05, pick: 0, pickFrequency: 1200, delay: 0, reverb: 0.06, stagger: 0, bodyRatio: 2, bodyLevel: 0.28, highpass: 40, pitchDrift: 1, shimmerRatio: 3, decayStart: 0.88, release: 0.1, pickDecay: 0.01 },
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
    if (profile.synthesis === "pluck") {
      playPluckedVoice(context, profile, frequency, start, master, midiNotes.length);
    } else {
      playSubtractiveVoice(context, profile, frequency, start, master, midiNotes.length);
    }
  });
}

function playSubtractiveVoice(
  context: AudioContext,
  profile: SoundProfile,
  frequency: number,
  start: number,
  master: AudioNode,
  chordSize: number,
) {
  const oscillator = context.createOscillator();
  const body = context.createOscillator();
  const voiceGain = context.createGain();
  const tone = context.createBiquadFilter();
  const highpass = profile.highpass ? context.createBiquadFilter() : undefined;
  const bodyGain = profile.bodyLevel !== undefined ? context.createGain() : undefined;
  const shimmer = context.createOscillator();
  const shimmerGain = context.createGain();
  const pick = context.createBufferSource();
  const pickGain = context.createGain();
  const pickTone = context.createBiquadFilter();

  oscillator.type = profile.oscillator;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.detune.setValueAtTime(profile.detune, start);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * (profile.pitchDrift ?? 0.998), start + profile.duration * 0.55);
  body.type = profile.body;
  body.frequency.setValueAtTime(frequency * (profile.bodyRatio ?? 0.999), start);
  bodyGain?.gain.setValueAtTime(profile.bodyLevel ?? 1, start);
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(frequency * (profile.shimmerRatio ?? 2.01), start);
  shimmerGain.gain.setValueAtTime(profile.shimmer / chordSize, start);
  shimmerGain.gain.setTargetAtTime(0.0001, start + profile.duration * 0.58, profile.duration * 0.1);
  tone.type = "lowpass";
  tone.frequency.setValueAtTime(profile.lowpassStart + frequency * 1.2, start);
  tone.frequency.exponentialRampToValueAtTime(profile.lowpassEnd + frequency * 0.6, start + profile.duration * 0.62);
  tone.Q.setValueAtTime(0.52, start);
  voiceGain.gain.setValueAtTime(0.0001, start);
  voiceGain.gain.linearRampToValueAtTime(profile.level / Math.sqrt(chordSize), start + profile.attack);
  voiceGain.gain.setTargetAtTime(0.0001, start + profile.duration * (profile.decayStart ?? 0.58), profile.duration * (profile.release ?? 0.14));
  if (highpass) {
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(profile.highpass ?? 20, start);
    highpass.Q.setValueAtTime(0.6, start);
  }
  pick.buffer = createPickBuffer(context);
  pickTone.type = "bandpass";
  pickTone.frequency.setValueAtTime(profile.pickFrequency, start);
  pickTone.Q.setValueAtTime(1.2, start);
  pickGain.gain.setValueAtTime(profile.pick / Math.sqrt(chordSize), start);
  pickGain.gain.setTargetAtTime(0.0001, start + (profile.pickDecay ?? 0.035), 0.012);
  oscillator.connect(tone);
  if (bodyGain) body.connect(bodyGain).connect(tone);
  else body.connect(tone);
  if (highpass) tone.connect(voiceGain).connect(highpass).connect(master);
  else tone.connect(voiceGain).connect(master);
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
}

/**
 * Karplus-Strong plucked string: a short noise burst rings through a delay
 * line tuned to the note's period, with a damping lowpass filter inside the
 * feedback loop so high harmonics die off faster than the fundamental - the
 * same physical behaviour a real plucked string has.
 */
function playPluckedVoice(
  context: AudioContext,
  profile: SoundProfile,
  frequency: number,
  start: number,
  master: AudioNode,
  chordSize: number,
) {
  const stringLoop = context.createDelay(1);
  stringLoop.delayTime.setValueAtTime(1 / frequency, start);
  const damping = context.createBiquadFilter();
  damping.type = "lowpass";
  damping.frequency.setValueAtTime(profile.stringDamping ?? 4500, start);
  damping.Q.setValueAtTime(0.4, start);
  const feedback = context.createGain();
  feedback.gain.setValueAtTime(profile.stringDecay ?? 0.99, start);

  const excitation = context.createBufferSource();
  excitation.buffer = createPickBuffer(context);
  const excitationTone = context.createBiquadFilter();
  excitationTone.type = "bandpass";
  excitationTone.frequency.setValueAtTime(profile.pickFrequency, start);
  excitationTone.Q.setValueAtTime(0.9, start);
  const excitationGain = context.createGain();
  excitationGain.gain.setValueAtTime(1 / Math.sqrt(chordSize), start);

  const outputGain = context.createGain();
  outputGain.gain.setValueAtTime(0.0001, start);
  outputGain.gain.linearRampToValueAtTime(profile.level / Math.sqrt(chordSize), start + Math.max(profile.attack, 0.002));
  outputGain.gain.setTargetAtTime(0.0001, start + profile.duration * (profile.decayStart ?? 0.55), profile.duration * (profile.release ?? 0.2));

  excitation.connect(excitationTone).connect(excitationGain).connect(stringLoop);
  stringLoop.connect(damping);
  damping.connect(feedback).connect(stringLoop);
  damping.connect(outputGain).connect(master);

  excitation.start(start);
  excitation.stop(start + 0.06);

  if (profile.bodyLevel !== undefined) {
    const bodyReso = context.createOscillator();
    const bodyGain = context.createGain();
    bodyReso.type = profile.body;
    bodyReso.frequency.setValueAtTime(frequency * (profile.bodyRatio ?? 0.5), start);
    bodyGain.gain.setValueAtTime(profile.bodyLevel, start);
    bodyGain.gain.setTargetAtTime(0.0001, start + profile.duration * 0.35, profile.duration * 0.22);
    bodyReso.connect(bodyGain).connect(master);
    bodyReso.start(start);
    bodyReso.stop(start + profile.duration);
  }

  if (profile.shimmer > 0) {
    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(frequency * (profile.shimmerRatio ?? 2.01), start);
    shimmerGain.gain.setValueAtTime(profile.shimmer / chordSize, start);
    shimmerGain.gain.setTargetAtTime(0.0001, start + profile.duration * 0.4, profile.duration * 0.15);
    shimmer.connect(shimmerGain).connect(master);
    shimmer.start(start);
    shimmer.stop(start + profile.duration * 0.6);
  }
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
