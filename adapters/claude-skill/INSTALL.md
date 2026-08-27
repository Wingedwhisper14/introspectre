# Install — Claude Skill

Verified against Anthropic documentation on 2026-08-26.

## Claude.ai

Anthropic currently supports custom Skills uploaded as zip files through **Settings > Features** on supported Pro, Max, Team, and Enterprise plans when code execution is enabled.

Use the companion distribution:

`betaal-claude-skill-v0.1.zip`

## Claude Code

Custom Skills can be filesystem-based:

- Personal: `~/.claude/skills/<skill-name>/`
- Project: `.claude/skills/<skill-name>/`

Place the skill directory there with `SKILL.md` at its root.

## Claude API / managed agents

Anthropic supports custom Agent Skills through its Skills mechanisms; exact API setup is runtime-specific.

## Current official reference

https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

The canonical, vendor-neutral behavior remains in the main Betaal repository. Treat this Skill as an adapter/distribution, not the source of truth.
