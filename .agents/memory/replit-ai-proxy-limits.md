---
name: Replit AI integration proxy limits
description: The AI_INTEGRATIONS_OPENAI_BASE_URL proxy only supports chat completions — audio/Whisper endpoints fail with UNSUPPORTED_MODEL.
---

## Rule
Never use the Replit AI integration client (`AI_INTEGRATIONS_OPENAI_BASE_URL`) for OpenAI audio/speech endpoints. Use a separate `OpenAI` instance with the plain `OPENAI_API_KEY` for those calls.

**Why:** The Replit-managed proxy only proxies chat completion requests. Sending `audio.transcriptions.create` (Whisper) through it returns `400 UNSUPPORTED_MODEL`.

**How to apply:** In `server/services/openai.ts`, keep two clients:
- `openai` — uses `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY` for GPT-4o chat/completions.
- `openaiDirect` — uses plain `OPENAI_API_KEY`, no custom `baseURL`, for Whisper and any other non-chat endpoints.
