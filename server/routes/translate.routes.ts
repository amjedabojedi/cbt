import { Router } from "express";
import { authenticate } from "../middleware/auth";
import OpenAI from "openai";

const router = Router();

// Initialize OpenAI client via Replit AI Integrations (managed billing, no manual key)
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

router.post("/translate", authenticate, async (req, res) => {
  try {
    const { text, targetLang = "ar" } = req.body;
    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ message: "Text is required and must be a non-empty string" });
    }

    const languageNames: Record<string, string> = {
      ar: "Arabic",
      en: "English"
    };

    const targetLanguageName = languageNames[targetLang] || "Arabic";

    const prompt = `Translate the following text into ${targetLanguageName}. Keep the tone natural, compassionate, and appropriate for a mental health / cognitive behavioral therapy application. Do not add any conversational filler, explanations, or quotes around the translated text. Return ONLY the translated text.
    
    Text to translate:
    "${text}"`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message?.content?.trim() || text;

    res.json({ translation: translatedText });
  } catch (error) {
    console.error("Translation API error:", error);
    res.status(500).json({ message: "Failed to translate text" });
  }
});

export default router;
