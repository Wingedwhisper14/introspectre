# Betaal v0.1

A portable conversation protocol for an AI cultural interlocutor: part Socratic challenger, part close reader, part storyteller, inspired by the questioning structure of the Vikram–Betaal tradition.

Betaal is designed to discuss a book, film, play, game, essay, or other work with a user over multiple sessions. Its primary purpose is not to summarize the work. It is to help the user notice, interpret, argue, connect, revise, and remember ideas.

## What is portable

The source of truth is ordinary text files:

- `BETAAL.md` — model-independent behavior contract.
- `works/` — replaceable work-specific knowledge packs.
- `memory/` — cross-session intellectual memory format.
- `evals/` — tests for whether Betaal is behaving well.
- `adapters/` — thin runtime-specific wrappers.

Voice is an interface. ChatGPT, Claude, or a custom model API is a runtime. Neither should contain the only copy of Betaal's behavior.

## 15-minute pilot: ChatGPT Project

1. Create a ChatGPT Project called **Betaal: Justice**.
2. Prefer **project-only memory** if you want the experiment isolated from other chats.
3. Open `adapters/chatgpt-project/PROJECT_INSTRUCTIONS.md` and paste its contents into Project Instructions.
4. Upload the files listed in `adapters/chatgpt-project/UPLOAD_MANIFEST.md`.
5. Add your lawful copy, excerpts, notes, highlights, or other source material for *Justice* if you want exact textual grounding. This repository does **not** include the copyrighted book.
6. Start with text or Voice. Try: `Betaal, I have just finished the section on utilitarianism. Start a session.`

ChatGPT Projects currently support files, project instructions, project memory, sharing, cross-device use, and Voice referencing project sources/instructions. Product behavior can change, so see the current OpenAI help docs linked in `adapters/chatgpt-project/INSTALL.md`.


## Build the standalone voice app

The first custom URL/runtime is now scaffolded in `apps/web`. See `docs/BUILD_PLAN.md` for phases and `docs/CODEX_HANDOFF.md` for the coding-agent handoff.

```bash
cd apps/web
cp .env.example .env.local
# set OPENAI_API_KEY
npm install
npm run dev
```

## Claude Skill

A standalone Claude Skill zip is distributed alongside this repository as `betaal-claude-skill-v0.1.zip`.

For Claude.ai, custom Skills can currently be uploaded as zip files in Settings > Features on supported plans with code execution enabled. For Claude Code, custom Skills are filesystem-based under `~/.claude/skills/` or `.claude/skills/`.

See `adapters/claude-skill/INSTALL.md`.

## Generic model / custom voice harness

Use `adapters/system-prompt.md` as the system/developer instruction. Give the model retrieval access to the active work pack and store session state using `memory/SESSION_MEMORY.md` or the JSON schema in `memory/session-memory.schema.json`.

A minimal production loop is:

```text
voice/text input
      ↓
Betaal dialogue protocol
      ↙             ↘
work retrieval    session memory
      ↘             ↙
         response
```

Avoid a multi-agent architecture until a single-agent implementation demonstrably fails.

## Useful user controls

Natural language should always work, but these optional commands make testing easier:

- `/start` — begin a fresh Betaal session.
- `/recap` — recap the intellectual thread, not the plot.
- `/explain` — temporarily prioritize explanation over questioning.
- `/debate` — challenge the user's current position more aggressively.
- `/connect` — seek a useful connection to another work/tradition.
- `/source` — distinguish source-grounded claims from interpretation.
- `/spoilers none|current|full` — set spoiler scope.
- `/meta` — step out of character and discuss Betaal's behavior.

## Design principle

A successful session should leave the user with at least one of these:

1. a detail they had not noticed;
2. a contradiction or tension in their own position;
3. a stronger formulation of an idea they were reaching for;
4. a surprising but defensible connection;
5. an unresolved question they actually want to revisit.

If the user merely received a competent summary, Betaal underperformed.

## Version

`0.1.0` — pilot package, prepared 2026-08-26.
