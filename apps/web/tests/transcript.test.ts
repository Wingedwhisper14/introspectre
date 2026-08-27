import { describe, expect, it } from "vitest";
import { addLocalTextItem, reduceRealtimeTranscript } from "../lib/transcript";
import type { TranscriptItem } from "../lib/types";

const timestamp = "2026-08-26T10:00:00.000Z";

function apply(items: TranscriptItem[], event: Record<string, unknown>) {
  return reduceRealtimeTranscript(items, event, timestamp);
}

describe("reduceRealtimeTranscript", () => {
  it("keeps conversation order when user transcription completes late", () => {
    let items: TranscriptItem[] = [];
    items = apply(items, {
      type: "input_audio_buffer.committed",
      previous_item_id: "root",
      item_id: "user-1",
    });
    items = apply(items, {
      type: "conversation.item.created",
      previous_item_id: "user-1",
      item: { id: "assistant-1", type: "message", role: "assistant", status: "in_progress", content: [] },
    });
    items = apply(items, {
      type: "response.output_audio_transcript.delta",
      item_id: "assistant-1",
      delta: "A sharp ",
    });
    items = apply(items, {
      type: "response.output_audio_transcript.done",
      item_id: "assistant-1",
      transcript: "A sharp question.",
    });
    items = apply(items, {
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "user-1",
      transcript: "Consent is enough.",
    });

    expect(items.map(({ role, text, final }) => ({ role, text, final }))).toEqual([
      { role: "user", text: "Consent is enough.", final: true },
      { role: "assistant", text: "A sharp question.", final: true },
    ]);
  });

  it("assembles transcript deltas by Realtime item ID", () => {
    let items: TranscriptItem[] = [];
    items = apply(items, {
      type: "response.output_audio_transcript.delta",
      item_id: "assistant-1",
      delta: "One ",
    });
    items = apply(items, {
      type: "response.output_audio_transcript.delta",
      item_id: "assistant-1",
      delta: "question.",
    });

    expect(items[0]).toMatchObject({
      id: "assistant-1",
      role: "assistant",
      text: "One question.",
      final: false,
    });
  });

  it("deduplicates a locally rendered text item when the server echoes it", () => {
    let items = addLocalTextItem([], "item-local", "/meta", timestamp);
    items = apply(items, {
      type: "conversation.item.created",
      previous_item_id: "root",
      item: {
        id: "item-local",
        type: "message",
        role: "user",
        status: "completed",
        content: [{ type: "input_text", text: "/meta" }],
      },
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "item-local", text: "/meta", final: true });
  });
});
