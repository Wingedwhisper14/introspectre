import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/realtime/session/route";

const originalApiKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_REALTIME_MODEL;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalApiKey;
  if (originalModel === undefined) delete process.env.OPENAI_REALTIME_MODEL;
  else process.env.OPENAI_REALTIME_MODEL = originalModel;
});

function sessionRequest(session: unknown = {}) {
  const form = new FormData();
  form.set("sdp", "v=0\r\ns=Betaal test offer");
  form.set("session", JSON.stringify(session));
  return new Request("http://localhost/api/realtime/session", { method: "POST", body: form });
}

describe("POST /api/realtime/session", () => {
  it("returns a useful error when the server API key is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    const response = await POST(sessionRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "OPENAI_API_KEY is not configured on the server.",
    });
  });

  it("forwards only the server-authoritative Realtime configuration", async () => {
    process.env.OPENAI_API_KEY = "test-server-key";
    process.env.OPENAI_REALTIME_MODEL = "gpt-realtime-2.1";
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response("v=0\r\ns=Betaal test answer", {
        status: 200,
        headers: { "Content-Type": "application/sdp" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      sessionRequest({
        model: "browser-model",
        instructions: "browser instructions",
        audio: { output: { voice: "browser voice" } },
        betaal_options: {
          spoilerScope: "none",
          progress: "finished utilitarianism",
          topic: "consent",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Betaal test answer");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/realtime/calls");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-server-key" });

    const outgoing = init?.body as FormData;
    const session = JSON.parse(String(outgoing.get("session"))) as Record<string, unknown>;
    expect(session).toMatchObject({
      type: "realtime",
      model: "gpt-realtime-2.1",
      output_modalities: ["audio"],
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: {
            type: "semantic_vad",
            eagerness: "auto",
            interrupt_response: true,
            create_response: true,
          },
        },
        output: { voice: "marin" },
      },
    });
    expect(session.instructions).toContain("Spoiler scope: none");
    expect(session.instructions).toContain("Known user progress: finished utilitarianism");
    expect(session.instructions).toContain("User-selected topic: consent");
    expect(session.instructions).not.toContain("browser instructions");
  });
});
