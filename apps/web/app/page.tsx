"use client";

import { useEffect, useMemo, useState } from "react";
import { VoiceSession } from "@/components/VoiceSession";
import type { SpoilerScope } from "@/lib/types";

export default function Home() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [progress, setProgress] = useState("");
  const [topic, setTopic] = useState("");
  const [spoilerScope, setSpoilerScope] = useState<SpoilerScope>("current");

  useEffect(() => {
    void fetch("/api/config")
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(false));
  }, []);

  const options = useMemo(
    () => ({ workId: "justice" as const, progress, topic, spoilerScope }),
    [progress, spoilerScope, topic],
  );

  return (
    <main>
      <header className="hero">
        <div className="eyebrow">Betaal · pilot 0.1</div>
        <h1>Think with the work, not around it.</h1>
        <p>
          A voice companion for arguments, dilemmas, cultural connections, and the ideas you want to keep wrestling with.
        </p>
      </header>

      <section className="setup-card">
        <div className="work-title">
          <div>
            <span className="label">Active work</span>
            <h2>Justice</h2>
            <p>Michael J. Sandel</p>
          </div>
          <div className={`config-pill ${configured === false ? "bad" : ""}`}>
            {configured === null ? "Checking API…" : configured ? "Realtime configured" : "API key missing"}
          </div>
        </div>

        <div className="form-grid">
          <label>
            <span>Where are you?</span>
            <input value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="e.g. finished utilitarianism" />
          </label>
          <label>
            <span>What is on your mind?</span>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="optional: consent, trolley case, merit…" />
          </label>
          <label>
            <span>Spoilers</span>
            <select value={spoilerScope} onChange={(e) => setSpoilerScope(e.target.value as SpoilerScope)}>
              <option value="none">Only material I mention</option>
              <option value="current">Up to my current progress</option>
              <option value="full">Entire work is fair game</option>
            </select>
          </label>
        </div>
      </section>

      {configured === false ? (
        <div className="error-box" role="alert">
          Voice is unavailable until <code>OPENAI_API_KEY</code> is set in <code>apps/web/.env.local</code> and the server is restarted.
        </div>
      ) : null}

      <VoiceSession options={options} configured={configured === true} />

      <footer>
        Source discipline: this pilot includes a Justice discussion scaffold, not the copyrighted book. Exact close-reading requires a source added in the grounding phase.
      </footer>
    </main>
  );
}
