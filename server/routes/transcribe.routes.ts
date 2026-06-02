import { Router } from "express";
import https from "https";
import { authenticate } from "../middleware/auth";

const router = Router();

const RATE_LIMIT_MAX = 30;
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

// Map browser MIME type → Deepgram mimetype param
function deepgramMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "audio/mp4";
  if (mimeType.includes("ogg")) return "audio/ogg";
  if (mimeType.includes("wav")) return "audio/wav";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "audio/mpeg";
  return "audio/webm"; // default — webm/opus is what MediaRecorder produces in Chrome
}

function deepgramTranscribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      reject(new Error("DEEPGRAM_API_KEY is not configured"));
      return;
    }

    const contentType = deepgramMime(mimeType);
    const query = "model=nova-2&smart_format=true&punctuate=true";

    const options: https.RequestOptions = {
      hostname: "api.deepgram.com",
      path: `/v1/listen?${query}`,
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": contentType,
        "Content-Length": audioBuffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Deepgram returned ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const transcript =
            parsed?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
          resolve(transcript.trim());
        } catch {
          reject(new Error("Failed to parse Deepgram response"));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(audioBuffer);
    req.end();
  });
}

// POST /api/transcribe
// Body: { audio: <base64 string>, mimeType: <mime string> }
router.post("/transcribe", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id as number;
    if (!checkRateLimit(userId)) {
      return res
        .status(429)
        .json({ message: "Voice typing limit reached. Try again in an hour." });
    }

    const { audio, mimeType = "audio/webm" } = req.body ?? {};
    if (!audio || typeof audio !== "string") {
      return res.status(400).json({ message: "No audio data provided." });
    }

    if (!process.env.DEEPGRAM_API_KEY) {
      return res.status(503).json({
        message: "Server-side transcription is not configured (DEEPGRAM_API_KEY missing).",
        code: "NO_API_KEY",
      });
    }

    const audioBuffer = Buffer.from(audio, "base64");
    const text = await deepgramTranscribe(audioBuffer, mimeType);
    res.json({ text });
  } catch (err: any) {
    console.error("Transcription error:", err?.message ?? err);
    res.status(500).json({ message: "Transcription failed. Please try again." });
  }
});

export default router;
