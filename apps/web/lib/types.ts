export type SpoilerScope = "none" | "current" | "full";

export type TranscriptRole = "user" | "assistant" | "system";

export interface TranscriptItem {
  id: string;
  role: TranscriptRole;
  text: string;
  final: boolean;
  createdAt: string;
}

export interface SessionOptions {
  workId: "justice";
  spoilerScope: SpoilerScope;
  progress?: string;
  topic?: string;
}
