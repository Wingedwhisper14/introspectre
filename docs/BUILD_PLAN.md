# Betaal Build Plan

Status: **Phase 1 in progress**  
Pilot work: *Justice: What's the Right Thing to Do?*  
Primary contributor: Ishan Singh <ishansingh99@gmail.com>

## Product goal

A user can open one URL on any device, pick a work, and have a sustained voice conversation with Betaal that is grounded in that work, challenges ideas intelligently, remembers useful intellectual state, and carries that state across sessions.

## Non-goals for the pilot

- multi-agent architecture;
- autonomous web browsing during every turn;
- ingesting an unlimited media library;
- cloning a theatrical Betaal voice;
- fine-tuning a model;
- replacing lawful access to copyrighted source material.

## Architecture

```text
Browser / mobile web
        |
        | WebRTC audio + data channel
        v
OpenAI Realtime session
        ^
        | server-side session bootstrap
        |
Next.js app server
   |         |          |
   |         |          +-- session memory store (Phase 3)
   |         +------------- work retrieval tool (Phase 2)
   +----------------------- BETAAL.md + work pack
```

The web app is the portable product shell. `BETAAL.md` and `works/` remain model-independent.

---

## Phase 0 — Product contract ✅

**Deliverables**
- `BETAAL.md`
- Justice work pack
- memory schema
- behavioral eval set
- ChatGPT / Claude / generic adapters

**Exit criterion**
We can describe good vs bad Betaal behavior without referring to a particular model vendor.

---

## Phase 1 — Live vertical slice 🚧

**Goal**
One URL can host a real voice conversation with Betaal.

**Build**
- Next.js + TypeScript web app
- `/api/realtime/session` server proxy
- WebRTC microphone/audio connection
- Realtime `oai-events` data channel
- input + output transcript surface
- text fallback
- spoiler scope + progress/topic controls
- server-generated Betaal session instructions from `BETAAL.md` + active work pack
- local session checkpoint export

**Acceptance criteria**
- API key never reaches browser source/network payloads except server-to-OpenAI authorization.
- User can connect/disconnect repeatedly without stale microphone tracks.
- User interruption stops/redirects Betaal naturally.
- At most one principal question in a normal Betaal turn.
- User transcript and Betaal transcript appear in order.
- `/meta`-style direct text can be sent without using the microphone.
- App still loads without an API key and shows a useful configuration error rather than crashing.

**Codex handoff gate**
Hand off once the repo contains this plan, `AGENTS.md`, the runnable web scaffold, tests, and a clear first implementation task. Codex should then own iterative coding/verification while product protocol changes remain reviewed against `BETAAL.md`.

---

## Phase 2 — Grounded work retrieval

**Goal**
Betaal can make exact claims only after retrieving source evidence.

**Build**
- work-source ingestion boundary;
- server-side retrieval interface: `search_work(query)` + `read_work(ref)`;
- Realtime function tool(s) for retrieval;
- citation/source trace stored with transcript events;
- fallback behavior when source is unavailable.

**Pilot data**
- bundled Justice argument/theme scaffold;
- user-provided lawful notes/excerpts/full text supplied separately at runtime;
- optional official Sandel course material as external reference.

**Acceptance criteria**
Eval 2 (hallucinated close reading) must pass reliably; no exact quote/page/scene claim without retrievable evidence.

---

## Phase 3 — Durable identity + cross-device memory

**Goal**
A user can resume the intellectual thread from another device/login session.

**Build**
- authentication;
- database-backed users, works, sessions, transcript items, and memory entries;
- structured checkpoint extraction to `session-memory.schema.json`;
- memory supersession/versioning;
- session list + resume flow.

**Privacy rule**
Store intellectual state, not inferred sensitive traits. Users can inspect/delete memories.

**Acceptance criteria**
A position explicitly stated in session A can be accurately and selectively resurfaced in session B on another device.

---

## Phase 4 — Work-pack ingestion

**Goal**
Add a book/film without rewriting the product.

**Build**
- work creation flow;
- metadata + spoiler boundaries;
- source upload/import;
- automatic first-pass map of arguments/scenes/themes/motifs;
- human-editable work pack;
- provenance on generated notes.

**Acceptance criteria**
Justice plus at least two very different works (one fiction, one film) run through the same runtime.

---

## Phase 5 — Eval harness

**Goal**
Prompt/model changes do not turn Betaal into a lecturer, sycophant, hallucinating close-reader, or reference machine.

**Build**
- executable cases derived from `evals/conversations.md`;
- model-graded + deterministic checks;
- transcript fixtures;
- release scorecard.

**Release threshold**
Average >= 1.6/2 across existing rubric and **zero source-fidelity failures**.

---

## Phase 6 — Pilot deployment

**Goal**
5–10 real Justice sessions with the creator plus a small tester group.

Measure:
- voluntary session length;
- interruption rate / latency complaints;
- number of “that is interesting” moments (qualitative tags);
- hallucination/source corrections;
- useful memory callbacks;
- whether users return without prompting.

Do not optimize growth before this pilot feels intellectually worth returning to.

## First Codex task

See `docs/CODEX_HANDOFF.md`.
