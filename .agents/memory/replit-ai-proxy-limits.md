---
name: Replit AI integration proxy limits
description: The AI_INTEGRATIONS_OPENAI_BASE_URL proxy only supports chat completions with gpt-4o — ALL other models/endpoints fail. Use Web Speech API for voice input.
---

## Rule
Never use the Replit AI integration client (`AI_INTEGRATIONS_OPENAI_BASE_URL`) for anything other than standard `gpt-4o` chat completions.

**Why:** The Replit-managed proxy is model-locked and intercepts ALL outbound OpenAI calls at the WASM level.
- `whisper-1` via `/audio/transcriptions` → `400 UNSUPPORTED_MODEL` (endpoint not proxied)
- `gpt-4o-audio-preview` via `/chat/completions` → `400 Model 'gpt-4o-audio-preview' is not supported`
- Direct client with plain `OPENAI_API_KEY` (no custom baseURL) also fails — Replit WASM intercepts calls to api.openai.com and substitutes a service account key (sk-svcac…), causing 401.

**How to apply:**
- For voice/audio transcription → use the browser's **Web Speech API** (`window.SpeechRecognition` / `window.webkitSpeechRecognition`). Runs entirely in the user's browser, no server or API key needed, works well in Chrome. The user confirmed it worked "very well" before server-side attempts were made.
- For GPT-4o AI features (journal analysis, reframe coach, etc.) → use `openai` client with `AI_INTEGRATIONS_OPENAI_BASE_URL`.
- Do NOT try to reach OpenAI's audio endpoints from the server — there is no working path in this Replit environment.
