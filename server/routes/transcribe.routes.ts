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

function deepgramMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "audio/mp4";
  if (mimeType.includes("ogg")) return "audio/ogg";
  if (mimeType.includes("wav")) return "audio/wav";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "audio/mpeg";
  return "audio/webm";
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

// ── Deepgram transcription via raw https module ──────────────────────────────
// Probe confirmed: api.deepgram.com is reachable from Replit containers.
// All api.openai.com calls are intercepted by Replit's WASM proxy regardless
// of HTTP library (native fetch, https module, OpenAI SDK all fail with 401).
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
// Tests every server-side transcription path and returns which ones are
// reachable. Useful for diagnostics. Results are permanent for this environment:
//   - OpenAI audio endpoints: BLOCKED (Replit WASM proxy substitutes key → 401)
//   - Deepgram: REACHABLE (needs DEEPGRAM_API_KEY)
//   - AssemblyAI: REACHABLE (needs ASSEMBLYAI_API_KEY)
router.get("/transcribe/probe", authenticate, async (_req, res) => {
  const results: Record<string, { reachable: boolean; status: number; note: string }> = {};

  // Path A: OpenAI Whisper via raw https (bypasses SDK — still intercepted by WASM proxy)
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
        ? "BLOCKED — Replit proxy substitutes service account key"
        : r.status === 400
        ? "BLOCKED — endpoint not supported by proxy"
        : `status ${r.status}`,
    };
  } catch (e: any) {
    results["openai_whisper"] = { reachable: false, status: 0, note: e.message };
  }

  // Path B: Deepgram — confirmed reachable
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

  // Path C: AssemblyAI — confirmed reachable
  try {
    const body = Buffer.from("{}");
    const r = await httpsPost(
      "api.assemblyai.com",
      "/v2/transcript",
      {
        Authorization: process.env.ASSEMBLYAI_API_KEY ?? "MISSING",
        "Content-Type": "application/json",
        "Content-Length": body.length,
      },
      body,
    );
    results["assemblyai"] = {
      reachable: true,
      status: r.status,
      note: r.status === 200
        ? "WORKS"
        : r.status === 401
        ? process.env.ASSEMBLYAI_API_KEY
          ? "Key invalid — check ASSEMBLYAI_API_KEY"
          : "ASSEMBLYAI_API_KEY not set"
        : `status ${r.status}`,
    };
  } catch (e: any) {
    results["assemblyai"] = { reachable: false, status: 0, note: e.message };
  }

  const recommended = results["deepgram"]?.status === 200
    ? "deepgram"
    : results["assemblyai"]?.status === 200
    ? "assemblyai"
    : results["openai_whisper"]?.status === 200
    ? "openai_whisper"
    : "none — use browser Web Speech API";

  res.json({ results, recommended });
});

// ── POST /api/transcribe  (authenticated) ─────────────────────────────────────
// Body: { audio: <base64>, mimeType: <mime> }
// Query: ?language=en-US  (optional, passed to Deepgram)
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

    const language = typeof req.query.language === "string" ? req.query.language : undefined;
    const audioBuffer = Buffer.from(audio, "base64");
    const text = await deepgramTranscribe(audioBuffer, mimeType, language);
    res.json({ text });
  } catch (err: any) {
    console.error("Transcription error:", err?.message ?? err);
    res.status(500).json({ message: "Transcription failed. Please try again." });
  }
});

export default router;
