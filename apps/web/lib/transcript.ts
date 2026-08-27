import type { TranscriptItem, TranscriptRole } from "./types";

export type RealtimeEvent = Record<string, unknown> & { type?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function eventString(event: RealtimeEvent, key: string): string | undefined {
  const value = event[key];
  return typeof value === "string" ? value : undefined;
}

function itemText(item: Record<string, unknown>): string | undefined {
  if (!Array.isArray(item.content)) return undefined;

  const parts = item.content.flatMap((part) => {
    if (!isRecord(part)) return [];
    const value = part.text ?? part.transcript;
    return typeof value === "string" ? [value] : [];
  });

  return parts.length ? parts.join("") : undefined;
}

function upsertItem(
  items: TranscriptItem[],
  incoming: TranscriptItem,
  previousItemId?: string | null,
): TranscriptItem[] {
  const existing = items.find((item) => item.id === incoming.id);
  const merged = existing ? { ...existing, ...incoming } : incoming;
  const withoutIncoming = items.filter((item) => item.id !== incoming.id);

  if (previousItemId === "root") return [merged, ...withoutIncoming];

  if (previousItemId) {
    const previousIndex = withoutIncoming.findIndex((item) => item.id === previousItemId);
    if (previousIndex >= 0) {
      return [
        ...withoutIncoming.slice(0, previousIndex + 1),
        merged,
        ...withoutIncoming.slice(previousIndex + 1),
      ];
    }
  }

  if (existing) {
    const originalIndex = items.findIndex((item) => item.id === incoming.id);
    return [
      ...withoutIncoming.slice(0, originalIndex),
      merged,
      ...withoutIncoming.slice(originalIndex),
    ];
  }

  return [...withoutIncoming, merged];
}

function updateText(
  items: TranscriptItem[],
  id: string,
  role: TranscriptRole,
  text: string,
  final: boolean,
  createdAt: string,
  append = false,
): TranscriptItem[] {
  const existing = items.find((item) => item.id === id);
  const nextText = append ? `${existing?.text ?? ""}${text}` : text;

  return upsertItem(items, {
    id,
    role,
    text: nextText,
    final,
    createdAt: existing?.createdAt ?? createdAt,
  });
}

export function reduceRealtimeTranscript(
  items: TranscriptItem[],
  event: RealtimeEvent,
  createdAt = new Date().toISOString(),
): TranscriptItem[] {
  const type = event.type;
  if (!type) return items;

  if (type === "input_audio_buffer.committed") {
    const id = eventString(event, "item_id");
    if (!id) return items;
    const previousItemId = eventString(event, "previous_item_id") ?? null;
    return upsertItem(
      items,
      { id, role: "user", text: "", final: false, createdAt },
      previousItemId,
    );
  }

  if (type === "conversation.item.created" && isRecord(event.item)) {
    const id = typeof event.item.id === "string" ? event.item.id : undefined;
    const role = event.item.role;
    if (!id || (role !== "user" && role !== "assistant")) return items;
    const existing = items.find((item) => item.id === id);
    const text = itemText(event.item) ?? existing?.text ?? "";
    const previousItemId = eventString(event, "previous_item_id") ?? null;

    return upsertItem(
      items,
      {
        id,
        role,
        text,
        final: text ? event.item.status === "completed" : false,
        createdAt: existing?.createdAt ?? createdAt,
      },
      previousItemId,
    );
  }

  if (type === "conversation.item.input_audio_transcription.delta") {
    const id = eventString(event, "item_id");
    const delta = eventString(event, "delta");
    return id && delta ? updateText(items, id, "user", delta, false, createdAt, true) : items;
  }

  if (type === "conversation.item.input_audio_transcription.completed") {
    const id = eventString(event, "item_id");
    const transcript = eventString(event, "transcript");
    return id && transcript !== undefined
      ? updateText(items, id, "user", transcript, true, createdAt)
      : items;
  }

  if (type === "response.output_audio_transcript.delta") {
    const id = eventString(event, "item_id");
    const delta = eventString(event, "delta");
    return id && delta
      ? updateText(items, id, "assistant", delta, false, createdAt, true)
      : items;
  }

  if (type === "response.output_audio_transcript.done") {
    const id = eventString(event, "item_id");
    const transcript = eventString(event, "transcript");
    if (!id) return items;
    const existing = items.find((item) => item.id === id);
    return updateText(
      items,
      id,
      "assistant",
      transcript ?? existing?.text ?? "",
      true,
      createdAt,
    );
  }

  return items;
}

export function addLocalTextItem(
  items: TranscriptItem[],
  id: string,
  text: string,
  createdAt = new Date().toISOString(),
): TranscriptItem[] {
  return upsertItem(items, { id, role: "user", text, final: true, createdAt });
}
