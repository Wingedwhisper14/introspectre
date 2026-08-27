# Codex Handoff — Phase 1

## Handoff status

**Automated scaffold gate passed on 2026-08-26. Authenticated voice smoke test remains pending until `OPENAI_API_KEY` is configured locally.**

## Mission

Complete and harden the Phase 1 live vertical slice in `docs/BUILD_PLAN.md` without broadening scope.

## Read first

1. `AGENTS.md`
2. `BETAAL.md`
3. `docs/BUILD_PLAN.md`
4. `apps/web/README.md`
5. `evals/conversations.md`

## First task

Run the web app, fix any current-API or TypeScript issues, and make one real Realtime voice session work end-to-end using `OPENAI_API_KEY`.

Then verify:

- microphone connect/disconnect/reconnect;
- model audio playback;
- user transcription events;
- assistant audio transcript events;
- text fallback;
- no browser exposure of the API key;
- useful error UI when the key is missing.

Use current official OpenAI Realtime docs. Prefer `gpt-realtime-2.1` and nested `audio` settings if still current.

## Do not do yet

- database/auth;
- full RAG;
- multi-agent handoffs;
- mobile native app;
- broad visual redesign;
- fine-tuning.

## Definition of done

`npm test`, `npm run typecheck`, and `npm run build` pass; README setup works from a clean checkout; manual voice smoke test passes; update `CHANGELOG.md` with what changed and any API assumptions.
