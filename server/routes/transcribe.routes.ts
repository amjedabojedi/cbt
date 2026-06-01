import { Router } from "express";
import { authenticate } from "../middleware/auth";
import OpenAI from "openai";

const router = Router();

// Use the Replit-managed integration client — chat completions endpoint is supported
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateLimitMap = new Map<number, { count: number; resetAt: number }>();

function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

// Map browser MIME type to a format accepted by the audio model
function audioFormat(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("flac")) return "flac";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "mp3";
  // webm/opus — treat as ogg (same codec, works in practice)
  return "ogg";
}

router.post("/transcribe", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id as number;
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ message: "Voice typing limit reached. Try again in an hour." });
    }

    const { audio, mimeType = "audio/webm" } = req.body ?? {};
    if (!audio || typeof audio !== "string") {
      return res.status(400).json({ message: "No audio data provided." });
    }

    const language: string | undefined =
      typeof req.query.language === "string" ? req.query.language : undefined;

    const format = audioFormat(mimeType);

    const promptText = language
      ? `Transcribe the audio exactly in ${language}. Return only the transcription, nothing else.`
      : "Transcribe the audio exactly as spoken. Return only the transcription, nothing else.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-audio-preview",
      modalities: ["text"],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: { data: audio, format },
            } as any,
            { type: "text", text: promptText },
          ],
        },
      ],
    } as any);

    const text = (response.choices[0]?.message?.content ?? "").trim();
    res.json({ text });
  } catch (err: any) {
    console.error("Transcription error:", err?.message ?? err);
    res.status(500).json({ message: "Transcription failed. Please try again." });
  }
});

export default router;
