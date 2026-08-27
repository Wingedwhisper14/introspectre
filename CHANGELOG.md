# Changelog

## 0.1.0 — 2026-08-26

- Initial model-independent Betaal behavior protocol.
- *Justice* pilot work pack with theme map and dilemma deck.
- Human-readable and structured session-memory formats.
- Regression evaluation set.
- ChatGPT Project adapter and install instructions.
- Claude Skill adapter and install instructions.
- Generic system-prompt adapter.

## 0.2.0-dev — 2026-08-26

- Added Phase 1 build plan and architecture.
- Added `AGENTS.md` and Codex handoff spec.
- Added Next.js/TypeScript Realtime WebRTC pilot scaffold.
- Added transcript UI, text fallback, spoiler/progress/topic controls, and local checkpoint export.
- Added Ishan Singh <ishansingh99@gmail.com> as creator/product lead in contributor metadata.
- Verified the Phase 1 transport and session schema against the current GA Realtime WebRTC documentation.
- Locked web dependencies and added a PostCSS security override; `npm audit` reports zero vulnerabilities.
- Hardened server-owned session validation, upstream timeouts/errors, microphone/connection cleanup, cancellation, and reconnect behavior.
- Made transcript assembly item-aware so asynchronous input transcription remains in conversation order.
- Added regression tests for Realtime session configuration, server authority, transcript streaming/order, text-item deduplication, and missing-key behavior.
