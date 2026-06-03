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

function httpsPost(
  hostname: string,
  path: string,
  headers: Record<string, string | number>,
  body: Buffer,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: "POST", headers },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── OpenAI Whisper via raw https (bypasses SDK proxy issues) ─────────────────
async function whisperTranscribe(
  audioBuffer: Buffer,
  mimeType: string,
  language?: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const boundary = "----WaveformBoundary" + Date.now();

  // Determine file extension from mime type
  let ext = "webm";
  if (mimeType.includes("mp4")) ext = "mp4";
  else if (mimeType.includes("ogg")) ext = "ogg";
  else if (mimeType.includes("wav")) ext = "wav";
  else if (mimeType.includes("mp3") || mimeType.includes("mpeg")) ext = "mp3";

  // Build multipart/form-data body manually
  const parts: Buffer[] = [];
  const addField = (name: string, value: string) => {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
    ));
  };
  addField("model", "whisper-1");
  if (language) addField("language", language.split("-")[0]); // whisper uses "en" not "en-US"

  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  ));
  parts.push(audioBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const result = await httpsPost(
    "api.openai.com",
    "/v1/audio/transcriptions",
    {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": body.length,
    },
    body,
  );

  if (result.status !== 200) {
    throw new Error(`Whisper ${result.status}: ${result.body.slice(0, 200)}`);
  }

  const parsed = JSON.parse(result.body);
  return (parsed?.text ?? "").trim();
}

// ── Deepgram transcription via raw https ─────────────────────────────────────
function deepgramMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "audio/mp4";
  if (mimeType.includes("ogg")) return "audio/ogg";
  if (mimeType.includes("wav")) return "audio/wav";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "audio/mpeg";
  return "audio/webm";
}

function deepgramTranscribe(
  audioBuffer: Buffer,
  mimeType: string,
  language?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      reject(new Error("DEEPGRAM_API_KEY is not configured"));
      return;
    }

    const contentType = deepgramMime(mimeType);
    const params = new URLSearchParams({
      model: "nova-2",
      smart_format: "true",
      punctuate: "true",
      ...(language ? { language } : {}),
    });

    const options: https.RequestOptions = {
      hostname: "api.deepgram.com",
      path: `/v1/listen?${params.toString()}`,
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
          reject(new Error(`Deepgram ${res.statusCode}: ${data.slice(0, 200)}`));
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

// ── GET /api/transcribe/probe  (authenticated) ───────────────────────────────
router.get("/transcribe/probe", authenticate, async (_req, res) => {
  const results: Record<string, { reachable: boolean; status: number; note: string }> = {};

  // Test Whisper
  try {
    const boundary = "probe" + Date.now();
    const body = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n--${boundary}--\r\n`);
    const r = await httpsPost(
      "api.openai.com",
      "/v1/audio/transcriptions",
      {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
      body,
    );
    results["openai_whisper"] = {
      reachable: r.status !== 0,
      status: r.status,
      note: r.status === 200
        ? "WORKS"
        : r.status === 401
        ? "BLOCKED — proxy substitutes service account key"
        : r.status === 400
        ? "Reachable but bad request (expected in probe)"
        : `status ${r.status}: ${r.body.slice(0, 100)}`,
    };
  } catch (e: any) {
    results["openai_whisper"] = { reachable: false, status: 0, note: e.message };
  }

  // Test Deepgram
  try {
    const r = await httpsPost(
      "api.deepgram.com",
      "/v1/listen?model=nova-2",
      {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY ?? "MISSING"}`,
        "Content-Type": "audio/wav",
        "Content-Length": 0,
      },
      Buffer.alloc(0),
    );
    results["deepgram"] = {
      reachable: true,
      status: r.status,
      note: r.status === 200
        ? "WORKS"
        : r.status === 401
        ? process.env.DEEPGRAM_API_KEY
          ? "Key invalid — check DEEPGRAM_API_KEY"
          : "DEEPGRAM_API_KEY not set"
        : `status ${r.status}`,
    };
  } catch (e: any) {
    results["deepgram"] = { reachable: false, status: 0, note: e.message };
  }

  res.json({ results });
});

// ── POST /api/transcribe  (authenticated) ─────────────────────────────────────
// Strategy: try Whisper first; fall back to Deepgram if Whisper fails.
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

    const hasWhisper = !!process.env.OPENAI_API_KEY;
    const hasDeepgram = !!process.env.DEEPGRAM_API_KEY;

    if (!hasWhisper && !hasDeepgram) {
      return res.status(503).json({
        message: "Server-side transcription is not configured.",
        code: "NO_API_KEY",
      });
    }

    const language = typeof req.query.language === "string" ? req.query.language : undefined;
    const audioBuffer = Buffer.from(audio, "base64");

    // Try Whisper first
    if (hasWhisper) {
      try {
        const text = await whisperTranscribe(audioBuffer, mimeType, language);
        console.log("[Transcribe] Used Whisper successfully");
        return res.json({ text, engine: "whisper" });
      } catch (whisperErr: any) {
        console.warn("[Transcribe] Whisper failed, trying Deepgram fallback:", whisperErr?.message);
        // Fall through to Deepgram
      }
    }

    // Deepgram fallback
    if (hasDeepgram) {
      const text = await deepgramTranscribe(audioBuffer, mimeType, language);
      console.log("[Transcribe] Used Deepgram (fallback)");
      return res.json({ text, engine: "deepgram" });
    }

    return res.status(503).json({
      message: "Server-side transcription is not configured.",
      code: "NO_API_KEY",
    });

  } catch (err: any) {
    console.error("[Transcribe] Error:", err?.message ?? err);
    res.status(500).json({ message: "Transcription failed. Please try again." });
  }
});

export default router;
