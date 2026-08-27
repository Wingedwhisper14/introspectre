import { NextResponse } from "next/server";
import { buildBetaalInstructions } from "@/lib/betaalPrompt";
import {
  buildRealtimeSession,
  DEFAULT_REALTIME_MODEL,
  parseSessionOptions,
} from "@/lib/realtimeSession";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart session request." }, { status: 400 });
  }
  const sdp = incoming.get("sdp");
  const rawSession = incoming.get("session");

  if (typeof sdp !== "string" || !sdp.trim()) {
    return NextResponse.json({ error: "Missing SDP offer." }, { status: 400 });
  }
  if (sdp.length > 100_000) {
    return NextResponse.json({ error: "SDP offer is too large." }, { status: 413 });
  }

  let supplied: unknown = {};
  if (typeof rawSession === "string" && rawSession.trim()) {
    if (rawSession.length > 10_000) {
      return NextResponse.json({ error: "Session options are too large." }, { status: 413 });
    }
    try {
      supplied = JSON.parse(rawSession) as unknown;
    } catch {
      return NextResponse.json({ error: "Invalid session JSON." }, { status: 400 });
    }
  }

  const suppliedRecord =
    typeof supplied === "object" && supplied !== null && !Array.isArray(supplied)
      ? (supplied as Record<string, unknown>)
      : {};
  const sessionOptions = parseSessionOptions(suppliedRecord.betaal_options);

  let instructions: string;
  try {
    instructions = await buildBetaalInstructions(sessionOptions);
  } catch (cause) {
    console.error("Could not assemble the Betaal session instructions.", cause);
    return NextResponse.json(
      { error: "Could not load the Betaal work pack." },
      { status: 500 },
    );
  }
  const model = process.env.OPENAI_REALTIME_MODEL || DEFAULT_REALTIME_MODEL;

  // The server is authoritative over the Realtime session. The browser may only
  // supply Betaal runtime choices via `betaal_options`; arbitrary session
  // configuration is intentionally ignored.
  const session = buildRealtimeSession(model, instructions);

  const outgoing = new FormData();
  outgoing.set("sdp", sdp);
  outgoing.set("session", JSON.stringify(session));

  let realtime: Response;
  try {
    realtime = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/sdp",
      },
      body: outgoing,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (cause) {
    console.error("OpenAI Realtime session request failed before a response.", cause);
    return NextResponse.json(
      { error: "Could not reach OpenAI Realtime. Please try again." },
      { status: 502 },
    );
  }

  const body = await realtime.text();
  if (!realtime.ok) {
    console.error("OpenAI Realtime session creation failed.", {
      status: realtime.status,
      requestId: realtime.headers.get("x-request-id"),
      detail: body.slice(0, 2_000),
    });
    return NextResponse.json(
      {
        error: "OpenAI Realtime session creation failed.",
        requestId: realtime.headers.get("x-request-id"),
      },
      { status: realtime.status },
    );
  }

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/sdp" },
  });
}
