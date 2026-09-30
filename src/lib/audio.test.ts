import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function audioParam() {
  return {
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

function audioNode() {
  return {
    connect: vi.fn((destination: unknown) => destination),
    start: vi.fn(), stop: vi.fn(),
    gain: audioParam(), frequency: audioParam(), detune: audioParam(),
    Q: audioParam(), delayTime: audioParam(), threshold: audioParam(),
    knee: audioParam(), ratio: audioParam(), attack: audioParam(), release: audioParam(),
  };
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  static initialState = "suspended";
  state = FakeAudioContext.initialState;
  currentTime = 0;
  sampleRate = 1000;
  destination = {};
  resume = vi.fn(async () => { this.state = "running"; });
  createGain = vi.fn(audioNode);
  createOscillator = vi.fn(audioNode);
  createDynamicsCompressor = vi.fn(audioNode);
  createBiquadFilter = vi.fn(audioNode);
  createWaveShaper = vi.fn(audioNode);
  createDelay = vi.fn(audioNode);
  createConvolver = vi.fn(audioNode);
  createBufferSource = vi.fn(audioNode);
  createBuffer = vi.fn((_channels: number, length: number) => ({
    getChannelData: () => new Float32Array(length),
  }));
  constructor() { FakeAudioContext.instances.push(this); }
}

beforeEach(() => {
  vi.resetModules();
  FakeAudioContext.instances = [];
  FakeAudioContext.initialState = "suspended";
  vi.stubGlobal("window", { AudioContext: FakeAudioContext });
  vi.stubGlobal("navigator", { audioSession: { type: "auto" } });
});

afterEach(() => vi.unstubAllGlobals());

describe("mobile audio playback", () => {
  it("requests playback mode and resumes synchronously within the user gesture", async () => {
    const { prepareAudio } = await import("./audio");
    const ready = prepareAudio();
    const context = FakeAudioContext.instances[0];
    expect(context.resume).toHaveBeenCalledOnce();
    expect((navigator as unknown as { audioSession: { type: string } }).audioSession.type).toBe("playback");
    expect(await ready).toBe(context);
  });

  it("supports browsers without Audio Session and the prefixed AudioContext", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { webkitAudioContext: FakeAudioContext });
    const { playChord } = await import("./audio");
    await playChord("C");
    expect(FakeAudioContext.instances[0].createOscillator).toHaveBeenCalledTimes(9);
  });

  it("continues when the optional playback category is rejected", async () => {
    vi.stubGlobal("navigator", { audioSession: {
      set type(_value: string) { throw new Error("Unsupported category"); },
    } });
    const { playChord } = await import("./audio");
    await playChord("C");
    expect(FakeAudioContext.instances[0].createOscillator).toHaveBeenCalledTimes(9);
  });

  it("waits for resume and schedules notes using the resumed audio clock", async () => {
    const { prepareAudio, playChord } = await import("./audio");
    await prepareAudio();
    const context = FakeAudioContext.instances[0];
    context.state = "suspended";
    let finishResume!: () => void;
    context.resume.mockImplementation(() => new Promise<void>((resolve) => {
      finishResume = () => { context.state = "running"; context.currentTime = 23; resolve(); };
    }));
    const played = playChord("C");
    expect(context.createOscillator).not.toHaveBeenCalled();
    finishResume();
    await played;
    expect(context.createOscillator.mock.results[0].value.start).toHaveBeenCalledWith(23);
  });

  it("resumes Safari interrupted state on the next playback request", async () => {
    FakeAudioContext.initialState = "interrupted";
    const { playChord } = await import("./audio");
    await playChord("C");
    expect(FakeAudioContext.instances[0].resume).toHaveBeenCalledOnce();
    expect(FakeAudioContext.instances[0].createOscillator).toHaveBeenCalledTimes(9);
  });

  it("reuses a running context without resuming it again", async () => {
    FakeAudioContext.initialState = "running";
    const { playChord } = await import("./audio");
    await playChord("C");
    await playChord("G");
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].resume).not.toHaveBeenCalled();
    expect(FakeAudioContext.instances[0].createOscillator).toHaveBeenCalledTimes(18);
  });

  it("recreates a closed context together with its cached reverb", async () => {
    const { playChord } = await import("./audio");
    await playChord("C");
    FakeAudioContext.instances[0].state = "closed";
    await playChord("G");
    expect(FakeAudioContext.instances).toHaveLength(2);
    expect(FakeAudioContext.instances[1].createBuffer).toHaveBeenCalledWith(2, 2100, 1000);
    expect(FakeAudioContext.instances[1].createOscillator).toHaveBeenCalledTimes(9);
  });

  it("handles a rejected resume and retries on the next tap", async () => {
    const { prepareAudio, playChord } = await import("./audio");
    await prepareAudio();
    const context = FakeAudioContext.instances[0];
    context.state = "suspended";
    context.resume.mockRejectedValueOnce(new Error("Gesture required"));
    await expect(playChord("C")).resolves.toBeUndefined();
    expect(context.createOscillator).not.toHaveBeenCalled();
    await playChord("C");
    expect(context.createOscillator).toHaveBeenCalledTimes(9);
  });

  it("does not schedule notes while the context remains interrupted", async () => {
    const { prepareAudio, playChord } = await import("./audio");
    await prepareAudio();
    const context = FakeAudioContext.instances[0];
    context.state = "interrupted";
    context.resume.mockResolvedValue(undefined);
    await playChord("C");
    expect(context.createOscillator).not.toHaveBeenCalled();
  });

  it("drops stale notes instead of playing a burst after audio unlocks", async () => {
    const { playChord } = await import("./audio");
    await Promise.all([playChord("C"), playChord("G"), playChord("Am")]);
    expect(FakeAudioContext.instances[0].createOscillator).toHaveBeenCalledTimes(9);
  });

  it("cancels a pending chord when the sequencer stops", async () => {
    const { playChord, cancelPendingPlayback } = await import("./audio");
    const played = playChord("C");
    cancelPendingPlayback();
    await played;
    expect(FakeAudioContext.instances[0].createOscillator).not.toHaveBeenCalled();
  });

  it("handles unavailable Web Audio without throwing", async () => {
    vi.stubGlobal("window", {});
    const { prepareAudio, playChord } = await import("./audio");
    expect(await prepareAudio()).toBeUndefined();
    await expect(playChord("C")).resolves.toBeUndefined();
  });
});
