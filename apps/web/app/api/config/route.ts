import { NextResponse } from "next/server";
import { DEFAULT_REALTIME_MODEL } from "@/lib/realtimeSession";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_REALTIME_MODEL || DEFAULT_REALTIME_MODEL,
  });
}
