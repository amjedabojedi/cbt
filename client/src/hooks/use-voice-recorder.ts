import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseVoiceRecorderOptions {
  language?: string;
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const t of [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ]) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {}
  }
  return undefined;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { language, onTranscript, onError } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // keep callbacks stable
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  });

  // ── detect Web Speech API (Chrome, Edge, Safari ≥ 14.5) ──────────────────
  const SpeechRecognitionClass = useMemo(
    () =>
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null,
    [],
  );

  // ── detect MediaRecorder (all modern browsers) ────────────────────────────
  const hasMediaRecorder =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== "undefined";

  const isSupported = !!SpeechRecognitionClass || hasMediaRecorder;

  // ── track if Web Speech API had a network failure this session ────────────
  // Chrome's Web Speech API fails with "network" when running inside an iframe
  // (e.g. Replit's preview pane) that hasn't granted microphone to the iframe.
  // After one network failure we skip Web Speech and go straight to Deepgram.
  const speechNetworkFailedRef = useRef(false);

  // ── refs for Web Speech API ───────────────────────────────────────────────
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef<string[]>([]);

  // ── refs for MediaRecorder fallback ──────────────────────────────────────
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string | undefined>(undefined);

  // "speech" = Web Speech API  |  "media" = MediaRecorder + server
  const modeRef = useRef<"speech" | "media">("speech");

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch {} });
    streamRef.current = null;
  }, []);

  // ── server-side transcribe (Deepgram) ─────────────────────────────────────
  const transcribeViaServer = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      const url = language
        ? `/api/transcribe?language=${encodeURIComponent(language)}`
        : "/api/transcribe";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64, mimeType: blob.type || "audio/webm" }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.code === "NO_API_KEY") {
          onErrorRef.current?.(
            "Server transcription is not set up yet. Please use Chrome for voice typing.",
          );
          return;
        }
        onErrorRef.current?.(
          data?.message || `Transcription failed (${res.status}). Please try again.`,
        );
        return;
      }

      const data = await res.json();
      const text: string = (data?.text || "").trim();
      if (text) onTranscriptRef.current?.(text);
      else onErrorRef.current?.("No speech detected. Please try again.");
    } catch (err: any) {
      if (err?.name === "AbortError") {
        onErrorRef.current?.("Transcription timed out. Please try a shorter recording.");
      } else {
        onErrorRef.current?.("Transcription failed. Please try again.");
      }
    } finally {
      setIsTranscribing(false);
    }
  }, [language]);

  // ── MediaRecorder branch (extracted so it can be called as a fallback) ────
  const startMediaRecorder = useCallback(async () => {
    if (!hasMediaRecorder) {
      onErrorRef.current?.("Voice typing is not supported in this browser. Please use Chrome.");
      return;
    }
    modeRef.current = "media";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const type = mimeTypeRef.current || recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        cleanupStream();
        setIsRecording(false);
        if (blob.size > 0) void transcribeViaServer(blob);
      };

      recorder.onerror = (e: any) => {
        onErrorRef.current?.(e?.error?.message || "Recording error. Please try again.");
        cleanupStream();
        setIsRecording(false);
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        onErrorRef.current?.("Microphone access was denied. Please allow it in your browser settings.");
      } else if (name === "NotFoundError") {
        onErrorRef.current?.("No microphone found on this device.");
      } else {
        onErrorRef.current?.(err?.message || "Could not start recording. Please try again.");
      }
      cleanupStream();
      setIsRecording(false);
    }
  }, [hasMediaRecorder, cleanupStream, transcribeViaServer]);

  // ── start ─────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (isRecording) return;

    // ── branch A: Web Speech API (Chrome / Edge / Safari) ──────────────────
    // Skip if it previously failed with a network error (e.g. iframe context).
    if (SpeechRecognitionClass && !speechNetworkFailedRef.current) {
      modeRef.current = "speech";
      accumulatedRef.current = [];

      const recognition = new SpeechRecognitionClass();
      recognition.lang = language || navigator.language || "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let pendingInterim = "";

      recognition.onstart = () => setIsRecording(true);

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const segment = event.results[i][0].transcript.trim();
            if (segment) accumulatedRef.current.push(segment);
            pendingInterim = "";
          } else {
            pendingInterim = event.results[i][0].transcript.trim();
          }
        }
      };

      recognition.onerror = async (event: any) => {
        const code: string = event.error ?? "";
        if (code === "no-speech") return;

        if (code === "network") {
          // Web Speech API is blocked in this context (common inside iframes such
          // as Replit's preview pane). Mark it as failed so future calls skip it,
          // then automatically fall back to MediaRecorder + Deepgram.
          speechNetworkFailedRef.current = true;
          try { recognition.abort(); } catch {}
          recognitionRef.current = null;
          setIsRecording(false);
          setIsTranscribing(false);
          // Start Deepgram path silently — no error shown to the user.
          await startMediaRecorder();
          return;
        }

        let msg = "Voice recognition failed. Please try again.";
        if (code === "not-allowed" || code === "service-not-allowed")
          msg = "Microphone access was denied. Please allow microphone access in your browser settings.";
        else if (code === "audio-capture")
          msg = "No microphone found on this device.";
        onErrorRef.current?.(msg);
        setIsRecording(false);
        setIsTranscribing(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsTranscribing(false);
        if (pendingInterim) accumulatedRef.current.push(pendingInterim);
        const full = accumulatedRef.current.join(" ").trim();
        if (full) onTranscriptRef.current?.(full);
        accumulatedRef.current = [];
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        onErrorRef.current?.("Could not start voice recognition. Please try again.");
        setIsRecording(false);
      }
      return;
    }

    // ── branch B: MediaRecorder + Deepgram ───────────────────────────────
    await startMediaRecorder();
  }, [isRecording, SpeechRecognitionClass, language, startMediaRecorder]);

  // ── stop ──────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (modeRef.current === "speech") {
      // Show spinner immediately while the browser delivers the final transcript.
      setIsTranscribing(true);
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
    } else {
      const r = recorderRef.current;
      if (r && r.state !== "inactive") {
        try { r.stop(); } catch {}
      }
      recorderRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else void start();
  }, [isRecording, start, stop]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
      try { recorderRef.current?.stop(); } catch {}
      cleanupStream();
    };
  }, [cleanupStream]);

  return { isRecording, isTranscribing, isSupported, start, stop, toggle };
}
