# Architecture v0.1

## Runtime boundaries

### Browser
Owns microphone permission, WebRTC peer connection, audio playback, transcript rendering, and user controls. It never receives the long-lived OpenAI API key.

### Next.js server
Owns secret-bearing OpenAI session bootstrap and builds the session instruction payload from canonical repo files.

### Realtime model
Owns the live conversational turn. In Phase 1 it receives the compact Justice work pack inline. In Phase 2 it receives tools for source retrieval instead of assuming exact source knowledge.

### Persistence
Phase 1 uses a downloadable/local checkpoint. Phase 3 adds authenticated durable storage behind a small repository interface so the UI is not tied to a specific database vendor.

## Why raw WebRTC first

The core product requirement is a long-lived, interruption-friendly spoken conversation. Raw Realtime/WebRTC keeps transport mechanics visible, requires no multi-agent framework, and lets us add retrieval tools exactly when needed.

## Session prompt assembly

`lib/betaalPrompt.ts` assembles:

1. canonical `BETAAL.md`;
2. active work pack;
3. runtime state: progress, spoiler scope, user-selected topic;
4. memory checkpoint (later);
5. a short runtime instruction emphasizing spoken turn length.

The application must never modify the canonical behavior contract solely to fix a UI/runtime quirk. Put runtime quirks in the assembly layer and cover them with tests.

## Source grounding migration

Phase 1 inline work packs contain only our own summaries/scaffolds. Phase 2 adds tools:

```ts
search_work({ query, workId, limit })
read_work({ sourceId, locator })
```

The model should use these before exact claims. Tool results carry provenance, which the transcript can expose on demand.
