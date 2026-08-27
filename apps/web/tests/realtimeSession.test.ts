import { describe, expect, it } from "vitest";
import {
  buildRealtimeSession,
  DEFAULT_REALTIME_MODEL,
  DEFAULT_TRANSCRIPTION_MODEL,
  DEFAULT_VOICE,
  parseSessionOptions,
} from "../lib/realtimeSession";

describe("parseSessionOptions", () => {
  it("accepts only supported Betaal runtime options", () => {
    expect(
      parseSessionOptions({
        workId: "another-work",
        spoilerScope: "full",
        progress: "  finished utilitarianism  ",
        topic: "  consent  ",
        model: "browser-controlled-model",
      }),
    ).toEqual({
      workId: "justice",
      spoilerScope: "full",
      progress: "finished utilitarianism",
      topic: "consent",
    });
  });

  it("uses conservative defaults for malformed input", () => {
    expect(parseSessionOptions({ spoilerScope: "everything", progress: 12 })).toEqual({
      workId: "justice",
      spoilerScope: "current",
      progress: undefined,
      topic: undefined,
    });
    expect(parseSessionOptions(null)).toEqual({
      workId: "justice",
      spoilerScope: "current",
      progress: undefined,
      topic: undefined,
    });
  });
});

describe("buildRealtimeSession", () => {
  it("builds the server-authoritative GA audio session", () => {
    const session = buildRealtimeSession(DEFAULT_REALTIME_MODEL, "Betaal instructions");

    expect(session).toMatchObject({
      type: "realtime",
      model: "gpt-realtime-2.1",
      instructions: "Betaal instructions",
      output_modalities: ["audio"],
      audio: {
        input: {
          transcription: { model: DEFAULT_TRANSCRIPTION_MODEL },
          turn_detection: {
            type: "semantic_vad",
            eagerness: "auto",
            interrupt_response: true,
            create_response: true,
          },
        },
        output: { voice: DEFAULT_VOICE },
      },
    });
  });
});
