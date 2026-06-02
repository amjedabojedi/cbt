---
name: Replit AI integration proxy limits
description: The AI_INTEGRATIONS_OPENAI_BASE_URL proxy only supports chat completions with gpt-4o — ALL other models/endpoints fail. Use Web Speech API for voice input.
---

## Rule
Never use the Replit AI integration client (`AI_INTEGRATIONS_OPENAI_BASE_URL`) for anything other than standard `gpt-4o` chat completions.

**Why:** The Replit-managed proxy is model-locked and intercepts ALL outbound OpenAI calls at the WASM level — confirmed by testing both native fetch AND Node https stdlib module.
- `whisper-1` via `/audio/transcriptions` → `400 UNSUPPORTED_MODEL` (endpoint not proxied)
- `gpt-4o-audio-preview` via `/chat/completions` → `400 Model 'gpt-4o-audio-preview' is not supported`
- Direct client with plain `OPENAI_API_KEY` (no custom baseURL) also fails — Replit WASM intercepts calls to api.openai.com and substitutes a service account key (sk-svcac…), causing 401.
- This interception happens at WASM level — changing HTTP library (fetch, https module, axios) makes no difference.

**Third-party alternatives that ARE reachable from Replit:**
- `api.deepgram.com` — returns 401 (reachable, just needs DEEPGRAM_API_KEY)
- `api.assemblyai.com` — returns 401 (reachable, just needs ASSEMBLYAI_API_KEY)

**How to apply:**
- For voice/audio transcription (Chrome/Edge users) → use **Web Speech API** (`window.SpeechRecognition` / `window.webkitSpeechRecognition`). Runs in user's browser, no server or API key needed. User confirmed Chrome/Edge are the target browsers.
- For voice/audio transcription (Firefox fallback) → use **Deepgram** via raw `https` module: POST binary audio to `api.deepgram.com/v1/listen` with `Authorization: Token DEEPGRAM_API_KEY`. Requires `DEEPGRAM_API_KEY` secret.
- For GPT-4o AI features (journal analysis, reframe coach, etc.) → use `openai` client with `AI_INTEGRATIONS_OPENAI_BASE_URL`.
- Do NOT try to reach OpenAI's audio endpoints from the server — there is no working path in this Replit environment.
