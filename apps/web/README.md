# Betaal web pilot

The Phase 1 browser voice shell.

## Run

```bash
cp .env.example .env.local
# add OPENAI_API_KEY
npm install
npm run dev
```

Open http://localhost:3000.

Use a current Node.js LTS release. Dependencies are locked in `package-lock.json`.

## Security

The browser POSTs its SDP offer and serialized Realtime session config to `/api/realtime/session`. The Next.js server forwards that multipart request to OpenAI with `OPENAI_API_KEY`. The key must never use a `NEXT_PUBLIC_` environment variable or appear in client code.

## Current scope

- Justice only
- inline Betaal + work-pack prompt
- voice + transcript + text fallback
- local JSON checkpoint export

Grounded retrieval and durable cross-device memory are deliberately Phase 2/3.

## Realtime API assumptions

Verified against the official OpenAI documentation on 2026-08-26:

- default model: `gpt-realtime-2.1`;
- browser transport: WebRTC with the `oai-events` data channel;
- session bootstrap: server-authenticated multipart `POST /v1/realtime/calls`;
- session configuration: nested `audio.input` / `audio.output` fields;
- turn handling: semantic VAD with automatic response creation and interruption;
- transcript events: `conversation.item.input_audio_transcription.*` and `response.output_audio_transcript.*`.

The server is authoritative over the model, instructions, audio settings, and voice. The browser can send only the Betaal progress, topic, and spoiler choices.

Official references:

- https://developers.openai.com/api/docs/guides/realtime-webrtc
- https://developers.openai.com/api/reference/resources/realtime/client-events
- https://developers.openai.com/api/reference/resources/realtime/server-events
- https://developers.openai.com/api/docs/models/gpt-realtime-2.1

## Validate

```bash
npm test
npm run typecheck
npm run build
npm audit
```

For the authenticated browser smoke test, verify microphone permission, model audio, ordered user/assistant transcripts, typed input, interruption, end-session cleanup, and reconnect.
