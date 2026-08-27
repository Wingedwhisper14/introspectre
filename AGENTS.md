# AGENTS.md — Betaal engineering instructions

## Product invariant

Betaal is a Socratic cultural interlocutor, not a generic assistant with a spooky persona. Read `BETAAL.md` before changing conversational behavior.

## Source of truth

- Behavior contract: `BETAAL.md`
- Pilot work pack: `works/justice/`
- Memory contract: `memory/session-memory.schema.json`
- Regression behaviors: `evals/conversations.md`
- Build sequence: `docs/BUILD_PLAN.md`

Runtime adapters and application code must not silently fork the behavior contract. If a runtime-specific rule is needed, keep it thin and document why.

## Current engineering target

Build the smallest useful vertical slice:

1. browser opens Betaal;
2. user selects/uses the Justice pilot;
3. user sets spoiler scope and optional progress/topic;
4. browser opens an OpenAI Realtime WebRTC session through a server-side proxy;
5. user and Betaal can speak naturally and interrupt each other;
6. transcript is visible;
7. text input works as a fallback;
8. session can produce a compact checkpoint for later persistence.

Do not introduce multi-agent orchestration unless a concrete eval demonstrates a single agent cannot meet the requirement.

## Engineering principles

- Never expose `OPENAI_API_KEY` to the browser.
- Prefer current GA Realtime APIs and nested `audio.input` / `audio.output` session config.
- Default model for the pilot: `gpt-realtime-2.1` unless current OpenAI docs say otherwise.
- Keep work-pack loading server-side.
- Make source-grounded claims distinguishable from model inference.
- Keep voice turns short and interruption-friendly.
- No copyrighted book text belongs in this repository.
- New behavior needs an eval or acceptance criterion.

## Before finishing a change

Run:

```bash
cd apps/web
npm test
npm run typecheck
npm run build
```

If dependencies/API surfaces have changed, verify against current official OpenAI documentation rather than relying on stale examples.
