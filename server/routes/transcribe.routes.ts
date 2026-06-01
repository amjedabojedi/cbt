import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { transcribeAudio } from "../services/openai";

const router = Router();

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateLimitMap = new Map<number, { count: number; resetAt: number }>();

router.post(
  "/transcribe",
  authenticate,
  (req, res, next) => {
    const userId = (req as any).user?.id as number;
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else if (entry.count >= RATE_LIMIT_MAX) {
      return res.status(429).json({ message: "Voice typing limit reached. Try again in an hour." });
    } else {
      entry.count += 1;
    }
    next();
  },
  async (req, res) => {
    try {
      const mimeType =
        (req.headers["content-type"] || "audio/webm").split(";")[0].trim() || "audio/webm";

      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);
          if (!buffer.length) {
            return res.status(400).json({ message: "No audio data received." });
          }

          const language =
            typeof req.query.language === "string" ? req.query.language : undefined;

          const text = await transcribeAudio(buffer, mimeType, language);
          res.json({ text });
        } catch (err: any) {
          console.error("Transcription error:", err);
          res.status(500).json({ message: "Transcription failed. Please try again." });
        }
      });
      req.on("error", (err) => {
        console.error("Request stream error:", err);
        res.status(500).json({ message: "Failed to read audio data." });
      });
    } catch (err: any) {
      console.error("Transcribe route error:", err);
      res.status(500).json({ message: "Transcription failed. Please try again." });
    }
  }
);

export default router;
