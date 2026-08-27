import { describe, expect, it } from "vitest";
import { buildBetaalInstructions } from "../lib/betaalPrompt";

describe("buildBetaalInstructions", () => {
  it("includes canonical protocol, work, and runtime state", async () => {
    const prompt = await buildBetaalInstructions({
      workId: "justice",
      spoilerScope: "current",
      progress: "finished utilitarianism",
      topic: "consent",
    });

    expect(prompt).toContain("Betaal is an intellectual companion");
    expect(prompt).toContain("Justice: What's the Right Thing to Do?");
    expect(prompt).toContain("Spoiler scope: current");
    expect(prompt).toContain("Known user progress: finished utilitarianism");
    expect(prompt).toContain("User-selected topic: consent");
    expect(prompt).toContain("Do not invent exact quotations");
  });
});
