import { NextRequest, NextResponse } from "next/server";
import { ensureZaiConfig } from "@/lib/zai-config";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CLP Assistant — voice input. Accepts a recorded audio clip (FormData
 * "audio"), transcribes it with the ASR service, and returns the text.
 * The client then sends the transcript to /api/assistant/chat as a normal
 * typed message, so the conversation logic stays in one place.
 */
const MAX_BYTES = 10 * 1024 * 1024; // 10MB of audio is ~10 minutes

export async function POST(req: NextRequest) {
  let file: File | null = null;
  try {
    const fd = await req.formData();
    const candidate = fd.get("audio");
    if (candidate instanceof File) file = candidate;
  } catch {
    return NextResponse.json({ error: "Malformed upload." }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: "No audio received." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Empty recording." }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Recording too long (max ~10 minutes)." }, { status: 413 });
  }

  try {
    await ensureZaiConfig();
    const buf = Buffer.from(await file.arrayBuffer());
    const zai = await ZAI.create();
    const result = await zai.audio.asr.create({ file_base64: buf.toString("base64") });
    const text = (result?.text ?? "").trim();
    if (!text) {
      return NextResponse.json(
        { error: "Could not hear any speech — try again a bit closer to the mic." },
        { status: 422 }
      );
    }
    return NextResponse.json({ text });
  } catch (e) {
    console.error("POST /api/assistant/voice", e);
    return NextResponse.json(
      { error: "Voice input failed — please type the message instead." },
      { status: 500 }
    );
  }
}
