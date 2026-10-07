/**
 * Browser Azure Speech SDK — continuous recognition with a push audio stream.
 * Live interim + final segments come from the same Azure engine.
 */

const TARGET_SAMPLE_RATE = 16000;

type SpeechSdkModule = typeof import("microsoft-cognitiveservices-speech-sdk");

export interface AzureStreamingMeta {
  confidence?: number;
  uncertainWords: string[];
}

export interface AzureStreamingCallbacks {
  onInterim: (text: string) => void;
  onFinalSegment: (segment: string, meta: AzureStreamingMeta) => void;
  onLevel: (level: number) => void;
  onError: (message: string) => void;
}

function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    output[i] = input[Math.min(input.length - 1, Math.round(i * ratio))];
  }
  return output;
}

function float32ToInt16Bytes(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function rms(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

function parseDetailedResult(json: string | undefined): AzureStreamingMeta {
  if (!json) return { uncertainWords: [] };
  try {
    const data = JSON.parse(json) as {
      NBest?: Array<{
        Confidence?: number;
        Words?: Array<{ Word?: string; Confidence?: number }>;
      }>;
    };
    const best = data.NBest?.[0];
    const uncertainWords = (best?.Words ?? [])
      .filter((w) => typeof w.Confidence === "number" && w.Confidence < 0.55)
      .map((w) => (w.Word ?? "").trim())
      .filter(Boolean);
    return { confidence: best?.Confidence, uncertainWords: [...new Set(uncertainWords)] };
  } catch {
    return { uncertainWords: [] };
  }
}

export class AzureStreamingSttSession {
  private sdk: SpeechSdkModule | null = null;
  private recognizer: import("microsoft-cognitiveservices-speech-sdk").SpeechRecognizer | null = null;
  private pushStream: import("microsoft-cognitiveservices-speech-sdk").PushAudioInputStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private mute: GainNode | null = null;
  private mediaStream: MediaStream | null = null;
  private active = false;
  private lastLevelAt = 0;
  private inputSampleRate = TARGET_SAMPLE_RATE;

  async start(token: string, region: string, callbacks: AzureStreamingCallbacks): Promise<void> {
    this.sdk = await import("microsoft-cognitiveservices-speech-sdk");
    const sdk = this.sdk;

    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechRecognitionLanguage = "en-US";
    speechConfig.outputFormat = sdk.OutputFormat.Detailed;

    const format = sdk.AudioStreamFormat.getWaveFormatPCM(TARGET_SAMPLE_RATE, 16, 1);
    this.pushStream = sdk.AudioInputStream.createPushStream(format);
    const audioConfig = sdk.AudioConfig.fromStreamInput(this.pushStream);
    this.recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    this.recognizer.recognizing = (_s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
        callbacks.onInterim(e.result.text ?? "");
      }
    };

    this.recognizer.recognized = (_s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        const text = (e.result.text ?? "").trim();
        if (!text) return;
        const json = e.result.properties.getProperty(
          sdk.PropertyId.SpeechServiceResponse_JsonResult,
        );
        callbacks.onFinalSegment(text, parseDetailedResult(json));
      }
    };

    this.recognizer.canceled = (_s, e) => {
      if (e.reason === sdk.CancellationReason.Error) {
        callbacks.onError(e.errorDetails || "Speech recognition error");
      }
    };

    await new Promise<void>((resolve, reject) => {
      this.recognizer!.startContinuousRecognitionAsync(
        () => resolve(),
        (err) => reject(new Error(String(err))),
      );
    });

    this.active = true;
    await this.startMicCapture(callbacks);
  }

  private async startMicCapture(callbacks: AzureStreamingCallbacks): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    if (!this.active) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    this.mediaStream = stream;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) throw new Error("AudioContext not supported");

    const ctx = new Ctx();
    await ctx.resume();
    this.audioContext = ctx;
    this.inputSampleRate = ctx.sampleRate;

    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const mute = ctx.createGain();
    mute.gain.value = 0;

    processor.onaudioprocess = (event) => {
      if (!this.active || !this.pushStream) return;
      const chunk = new Float32Array(event.inputBuffer.getChannelData(0));
      const pcm = downsample(chunk, this.inputSampleRate, TARGET_SAMPLE_RATE);
      this.pushStream.write(float32ToInt16Bytes(pcm));

      const now = Date.now();
      if (now - this.lastLevelAt > 80) {
        this.lastLevelAt = now;
        callbacks.onLevel(Math.min(1, rms(chunk) * 8));
      }
    };

    source.connect(processor);
    processor.connect(mute);
    mute.connect(ctx.destination);
    this.source = source;
    this.processor = processor;
    this.mute = mute;
  }

  async stop(): Promise<void> {
    this.active = false;
    const recognizer = this.recognizer;
    const pushStream = this.pushStream;

    this.teardownMic();

    if (recognizer) {
      await new Promise<void>((resolve) => {
        recognizer.stopContinuousRecognitionAsync(
          () => {
            try {
              recognizer.close();
            } catch {
              /* ignore */
            }
            resolve();
          },
          () => {
            try {
              recognizer.close();
            } catch {
              /* ignore */
            }
            resolve();
          },
        );
      });
    }

    try {
      pushStream?.close();
    } catch {
      /* ignore */
    }

    this.recognizer = null;
    this.pushStream = null;
    this.sdk = null;
  }

  private teardownMic(): void {
    try {
      this.processor?.disconnect();
      this.source?.disconnect();
      this.mute?.disconnect();
    } catch {
      /* ignore */
    }
    this.processor = null;
    this.source = null;
    this.mute = null;
    void this.audioContext?.close().catch(() => undefined);
    this.audioContext = null;
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }
}
