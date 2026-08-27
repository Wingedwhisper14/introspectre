#!/usr/bin/env python3
"""Build a standalone Claude Skill zip from the canonical Betaal repo."""
from pathlib import Path
import shutil
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent / "betaal-claude-skill-v0.1.zip"

with tempfile.TemporaryDirectory() as td:
    skill = Path(td) / "betaal-cultural-interlocutor"
    skill.mkdir()
    shutil.copy(ROOT / "adapters/claude-skill/SKILL.md", skill / "SKILL.md")
    shutil.copy(ROOT / "BETAAL.md", skill / "BETAAL_PROTOCOL.md")
    shutil.copy(ROOT / "memory/SESSION_MEMORY.md", skill / "SESSION_MEMORY.md")
    shutil.copytree(ROOT / "works", skill / "works")
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in skill.rglob("*"):
            if p.is_file():
                zf.write(p, p.relative_to(Path(td)))
print(OUT)
