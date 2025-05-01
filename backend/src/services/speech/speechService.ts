import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { EventEmitter } from "events";
import dotenv from "dotenv";

dotenv.config();

const deepgramApiKey = process.env.DEEPGRAM_API_KEY || "";
const deepgram = deepgramApiKey ? createClient(deepgramApiKey) : null;

interface TranscriptionCallbacks {
  onTranscript: (
    transcript: string,
    isFinal: boolean,
    confidence: number
  ) => void;
  onError: (error: any) => void;
}

interface LiveConnectionOptions {
  sampleRate?: number;
  channels?: number;
  language?: string;
  model?: string;
  vad_events?: boolean;
  no_delay?: boolean;
  vad_turnoff?: number;
}

class SpeechService extends EventEmitter {
  private liveConnections = new Map<
    string,
    { connection: any; keepAliveInterval: NodeJS.Timeout | null }
  >();

  constructor() {
    super();
    if (!deepgramApiKey || !deepgram) {
      console.log(
        "⚠️ No Deepgram API key provided. Use mock mode or set DEEPGRAM_API_KEY."
      );
    } else {
      console.log("✅ Deepgram client initialized successfully");
    }
  }

  createLiveConnection(
    options: LiveConnectionOptions,
    callbacks: TranscriptionCallbacks
  ): string {
    const connectionId = `live-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    if (!deepgram) {
      console.log(`🎤 Mock mode enabled for connection ${connectionId}`);
      this.setupMockLiveStreaming(connectionId, callbacks);
      return connectionId;
    }

    const deepgramOptions = {
      model: options.model || "nova-2",
      language: options.language || "en-US",
      smart_format: true,
      interim_results: true,
      sample_rate: options.sampleRate || 48000,
      channels: options.channels || 1,
      vad_events: options.vad_events || false,
      no_delay: options.no_delay || false,
      vad_turnoff: options.vad_turnoff || undefined,
    };

    console.log(
      `🎤 Creating Deepgram connection with options:`,
      deepgramOptions
    );

    const connection = deepgram.listen.live(deepgramOptions);

    let keepAliveInterval: NodeJS.Timeout | null = null;

    connection.on(LiveTranscriptionEvents.Open, () => {
      console.log(`🎤 Deepgram connection opened (${connectionId})`);

      connection.on(LiveTranscriptionEvents.Transcript, (result: any) => {
        const transcript = result.channel?.alternatives[0]?.transcript || "";
        const confidence = result.channel?.alternatives[0]?.confidence || 0;
        const isFinal = !!result.is_final;
        console.log(
          `🎤 Transcript received for ${connectionId}: "${transcript}" (isFinal: ${isFinal}, confidence: ${confidence})`
        );
        if (transcript) {
          callbacks.onTranscript(transcript, isFinal, confidence);
        } else {
          console.log(`🎤 Empty transcript received for ${connectionId}`);
        }
      });

      connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
        console.log(`🎤 Speech started detected (${connectionId})`);
      });

      connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
        console.log(`🎤 Utterance ended detected (${connectionId})`);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log(`🎤 Deepgram connection closed (${connectionId})`);
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        this.liveConnections.delete(connectionId);
      });

      keepAliveInterval = setInterval(() => {
        console.log(`🎤 Sending keepAlive for ${connectionId}`);
        connection.keepAlive();
      }, 10000);
    });

    connection.on(LiveTranscriptionEvents.Error, (error: any) => {
      console.error(`🎤 Deepgram error (${connectionId}):`, error);
      callbacks.onError(error);
    });

    this.liveConnections.set(connectionId, { connection, keepAliveInterval });
    return connectionId;
  }

  sendAudioChunk(connectionId: string, audioChunk: Buffer): boolean {
    const connectionData = this.liveConnections.get(connectionId);
    if (!connectionData) {
      console.error(`🎤 Connection not found: ${connectionId}`);
      return false;
    }

    if (!deepgram) {
      console.log(
        `🎤 Mock sending ${audioChunk.length} bytes (${connectionId})`
      );
      return true;
    }

    const { connection } = connectionData;
    if (connection.getReadyState() !== 1) {
      console.warn(
        `🎤 Connection not open (${connectionId}), state: ${connection.getReadyState()}`
      );
      return false;
    }

    console.log(
      `🎤 Sending ${audioChunk.length} bytes to Deepgram (${connectionId})`
    );
    connection.send(audioChunk);
    return true;
  }

  closeLiveConnection(connectionId: string): void {
    const connectionData = this.liveConnections.get(connectionId);
    if (!connectionData) return;

    const { connection, keepAliveInterval } = connectionData;
    if (keepAliveInterval) clearInterval(keepAliveInterval);

    if (deepgram && connection.getReadyState() === 1) {
      connection.finish();
    }
    this.liveConnections.delete(connectionId);
    console.log(`🎤 Connection closed (${connectionId})`);
  }

  private setupMockLiveStreaming(
    connectionId: string,
    callbacks: TranscriptionCallbacks
  ): void {
    console.log(`🎤 Setting up mock streaming for ${connectionId}`);
    const mockResponses = [
      { text: "Hello world", confidence: 0.95 },
      { text: "Testing audio", confidence: 0.9 },
    ];
    let index = 0;

    const interval = setInterval(() => {
      const response = mockResponses[index % mockResponses.length];
      console.log(`🎤 Mock transcript for ${connectionId}: "${response.text}"`);
      callbacks.onTranscript(response.text, true, response.confidence);
      index++;
    }, 2000);

    this.liveConnections.set(connectionId, {
      connection: { getReadyState: () => 1, send: () => {}, finish: () => {} },
      keepAliveInterval: interval,
    });
  }
}

export default new SpeechService();
