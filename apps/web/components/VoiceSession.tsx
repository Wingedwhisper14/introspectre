"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addLocalTextItem,
  reduceRealtimeTranscript,
  type RealtimeEvent,
} from "@/lib/transcript";
import type { SessionOptions, TranscriptItem } from "@/lib/types";

type Status = "idle" | "connecting" | "connected" | "error";

function now() {
  return new Date().toISOString();
}

function realtimeError(event: RealtimeEvent): string {
  const error = event.error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "OpenAI Realtime reported an error.";
}

function connectionError(cause: unknown): string {
  if (cause instanceof DOMException && cause.name === "NotAllowedError") {
    return "Microphone permission was denied. Allow microphone access and try again.";
  }
  if (cause instanceof DOMException && cause.name === "NotFoundError") {
    return "No microphone was found on this device.";
  }
  if (cause instanceof DOMException && cause.name === "AbortError") {
    return "The connection attempt was cancelled.";
  }
  return cause instanceof Error ? cause.message : String(cause);
}

export function VoiceSession({
  options,
  configured,
}: {
  options: SessionOptions;
  configured: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [items, setItems] = useState<TranscriptItem[]>([]);
  const [draft, setDraft] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      setItems((current) => reduceRealtimeTranscript(current, event));
      if (event.type === "error") setError(realtimeError(event));
    },
    [],
  );

  const cleanupResources = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    connectionTimeoutRef.current = null;

    const dc = dcRef.current;
    dcRef.current = null;
    if (dc) {
      dc.onopen = null;
      dc.onmessage = null;
      dc.onerror = null;
      dc.onclose = null;
      dc.close();
    }

    const pc = pcRef.current;
    pcRef.current = null;
    if (pc) {
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.getSenders().forEach((sender) => sender.track?.stop());
      pc.close();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    audioRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    attemptRef.current += 1;
    cleanupResources();
    setError("");
    setStatus("idle");
  }, [cleanupResources]);

  useEffect(
    () => () => {
      attemptRef.current += 1;
      cleanupResources();
    },
    [cleanupResources],
  );

  const connect = useCallback(async () => {
    if (status === "connecting" || status === "connected") return;
    if (!configured) {
      setStatus("error");
      setError("OPENAI_API_KEY is not configured on the server.");
      return;
    }

    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;
    cleanupResources();
    setStatus("connecting");
    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Voice requires a secure browser context with microphone support.");
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const failActiveConnection = (message: string) => {
        if (attemptRef.current !== attempt || pcRef.current !== pc) return;
        attemptRef.current += 1;
        cleanupResources();
        setStatus("error");
        setError(message);
      };
      connectionTimeoutRef.current = setTimeout(
        () => failActiveConnection("The realtime connection timed out. Please try again."),
        30_000,
      );

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          failActiveConnection("The realtime peer connection failed. Please try again.");
        }
      };

      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onopen = () => {
        if (attemptRef.current === attempt && dcRef.current === dc) {
          if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
          setStatus("connected");
        }
      };
      dc.onmessage = (message) => {
        try {
          handleEvent(JSON.parse(message.data) as RealtimeEvent);
        } catch {
          // Ignore non-JSON transport messages.
        }
      };
      dc.onerror = () => {
        failActiveConnection("The realtime data channel failed. Please try again.");
      };
      dc.onclose = () => {
        failActiveConnection("The realtime connection closed unexpectedly.");
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const form = new FormData();
      form.set("sdp", offer.sdp || "");
      form.set(
        "session",
        JSON.stringify({
          type: "realtime",
          betaal_options: options,
        }),
      );

      const controller = new AbortController();
      abortRef.current = controller;
      const response = await fetch("/api/realtime/session", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      abortRef.current = null;

      if (attemptRef.current !== attempt) return;

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: unknown;
          requestId?: unknown;
        } | null;
        const message = typeof payload?.error === "string"
          ? payload.error
          : `Session failed (${response.status}).`;
        const requestId = typeof payload?.requestId === "string" ? ` Request ID: ${payload.requestId}` : "";
        throw new Error(`${message}${requestId}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      if (dc.readyState === "open" && attemptRef.current === attempt) setStatus("connected");
    } catch (cause) {
      if (attemptRef.current !== attempt) return;
      attemptRef.current += 1;
      cleanupResources();
      setStatus("error");
      setError(connectionError(cause));
    }
  }, [cleanupResources, configured, handleEvent, options, status]);

  const sendText = useCallback(() => {
    const text = draft.trim();
    const dc = dcRef.current;
    if (!text || !dc || dc.readyState !== "open") return;

    const id = `item_${crypto.randomUUID().replaceAll("-", "")}`;
    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          id,
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      }),
    );
    dc.send(JSON.stringify({ type: "response.create" }));
    setItems((current) => addLocalTextItem(current, id, text, now()));
    setDraft("");
  }, [draft]);

  const exportCheckpoint = useCallback(() => {
    const checkpoint = {
      work: { title: "Justice: What's the Right Thing to Do?", progress: options.progress || null },
      spoiler_scope: options.spoilerScope,
      topic: options.topic || null,
      transcript: items.filter((item) => item.final && item.text.trim()),
      exported_at: now(),
      note: "Phase 1 raw checkpoint. Structured intellectual memory extraction arrives in Phase 3.",
    };
    const blob = new Blob([JSON.stringify(checkpoint, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `betaal-justice-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, options]);

  const visibleItems = items.filter((item) => item.text.trim());

  return (
    <section className="session-card">
      <div className="session-toolbar">
        <div>
          <span className={`status-dot ${status}`} />
          <strong>{status}</strong>
        </div>
        <div className="toolbar-actions">
          {status === "connecting" ? (
            <button onClick={disconnect}>Cancel</button>
          ) : status !== "connected" ? (
            <button className="primary" onClick={() => void connect()} disabled={!configured}>
              Start voice
            </button>
          ) : (
            <button onClick={disconnect}>End session</button>
          )}
          <button onClick={exportCheckpoint} disabled={!visibleItems.length}>Export checkpoint</button>
        </div>
      </div>

      {error ? <div className="error-box" role="alert">{error}</div> : null}

      <div className="transcript" aria-live="polite">
        {!visibleItems.length ? (
          <div className="empty-state">
            <p>Betaal is ready when you are.</p>
            <p>Try: “I’ve finished the utilitarianism chapter. I think the trolley case is too artificial.”</p>
          </div>
        ) : (
          visibleItems.map((item) => (
            <div key={item.id} className={`turn ${item.role}`}>
              <div className="role">{item.role === "assistant" ? "Betaal" : item.role}</div>
              <div>{item.text}</div>
            </div>
          ))
        )}
      </div>

      <div className="text-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendText();
          }}
          disabled={status !== "connected"}
          placeholder={status === "connected" ? "Type to interrupt or respond…" : "Connect voice to enable text fallback"}
        />
        <button onClick={sendText} disabled={status !== "connected" || !draft.trim()}>Send</button>
      </div>
    </section>
  );
}
