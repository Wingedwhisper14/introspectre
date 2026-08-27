import type { SessionOptions } from "./types";

export const DEFAULT_REALTIME_MODEL = "gpt-realtime-2.1";
export const DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
export const DEFAULT_VOICE = "marin";

const MAX_PROGRESS_LENGTH = 500;
const MAX_TOPIC_LENGTH = 300;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : undefined;
}

export function parseSessionOptions(value: unknown): SessionOptions {
  const supplied = isRecord(value) ? value : {};
  const spoilerScope = supplied.spoilerScope;

  return {
    workId: "justice",
    spoilerScope:
      spoilerScope === "none" || spoilerScope === "full" ? spoilerScope : "current",
    progress: optionalText(supplied.progress, MAX_PROGRESS_LENGTH),
    topic: optionalText(supplied.topic, MAX_TOPIC_LENGTH),
  };
}

export function buildRealtimeSession(model: string, instructions: string) {
  return {
    type: "realtime" as const,
    model,
    instructions,
    output_modalities: ["audio"] as const,
    audio: {
      input: {
        transcription: { model: DEFAULT_TRANSCRIPTION_MODEL },
        turn_detection: {
          type: "semantic_vad" as const,
          eagerness: "auto" as const,
          interrupt_response: true,
          create_response: true,
        },
      },
      output: {
        voice: DEFAULT_VOICE,
      },
    },
  };
}
