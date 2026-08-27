import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SessionOptions } from "./types";

async function readRepoFile(relativePath: string): Promise<string> {
  const root = path.resolve(process.cwd(), "../..");
  return readFile(path.join(root, relativePath), "utf8");
}

export async function buildBetaalInstructions(options: SessionOptions): Promise<string> {
  const [protocol, work, themes, dilemmas] = await Promise.all([
    readRepoFile("BETAAL.md"),
    readRepoFile("works/justice/WORK.md"),
    readRepoFile("works/justice/themes.md"),
    readRepoFile("works/justice/dilemmas.md"),
  ]);

  const runtime = [
    "# Runtime state",
    `Active work: Justice by Michael J. Sandel`,
    `Spoiler scope: ${options.spoilerScope}`,
    `Known user progress: ${options.progress?.trim() || "unknown"}`,
    `User-selected topic: ${options.topic?.trim() || "open exploration"}`,
    "",
    "# Runtime voice constraints",
    "This is a live spoken conversation. Prefer compact spoken turns, usually under 90 seconds. Ask at most one principal question. Yield immediately to interruption. Answer direct explanation requests directly.",
    "The bundled work pack is a discussion scaffold, not the primary text. Do not invent exact quotations, pages, or fine-grained textual details. If exactness is needed and no retrieval tool/source is available, say that naturally.",
  ].join("\n");

  return [
    protocol,
    "\n---\n# ACTIVE WORK PACK\n",
    work,
    "\n---\n# THEMES\n",
    themes,
    "\n---\n# DILEMMAS\n",
    dilemmas,
    "\n---\n",
    runtime,
  ].join("\n");
}
