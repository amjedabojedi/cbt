import { useCallback, useEffect, useRef, useState } from "react";

export interface UseVoiceRecorderOptions {
  language?: string;
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const t of candidates) {
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

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { language, onTranscript, onError } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string | undefined>(undefined);

  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  });

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== "undefined";

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => {
      try { t.stop(); } catch {}
    });
    streamRef.current = null;
  }, []);

  const transcribe = useCallback(
    async (blob: Blob) => {
      setIsTranscribing(true);
      try {
        const base64 = await blobToBase64(blob);
        const url = language
          ? `/api/transcribe?language=${encodeURIComponent(language)}`
          : "/api/transcribe";
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64, mimeType: blob.type || "audio/webm" }),
        });
        if (!res.ok) {
          let msg = `Transcription failed (${res.status})`;
          try {
            const data = await res.json();
            if (data?.message) msg = data.message;
          } catch {}
          if (res.status === 429) msg = "Voice typing limit reached. Try again in an hour.";
          if (res.status === 401) msg = "You need to be signed in to use voice typing.";
          onErrorRef.current?.(msg);
          return;
        }
        const data = await res.json();
        const text: string = (data?.text || "").trim();
        if (text) onTranscriptRef.current?.(text);
      } catch (err: any) {
        onErrorRef.current?.(err?.message || "Transcription request failed");
      } finally {
        setIsTranscribing(false);
      }
    },
    [language],
  );

  const start = useCallback(async () => {
    if (!isSupported) {
      onErrorRef.current?.("Voice typing is not supported in this browser.");
      return;
    }
    if (isRecording) return;
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
        if (blob.size > 0) void transcribe(blob);
      };
      recorder.onerror = (e: any) => {
        onErrorRef.current?.(e?.error?.message || "Recording error");
        cleanupStream();
        setIsRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        onErrorRef.current?.("Microphone access was denied.");
      } else if (name === "NotFoundError") {
        onErrorRef.current?.("No microphone found on this device.");
      } else {
        onErrorRef.current?.(err?.message || "Could not start recording");
      }
      cleanupStream();
      setIsRecording(false);
    }
  }, [isRecording, isSupported, cleanupStream, transcribe]);

  const stop = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state !== "inactive") {
      try { r.stop(); } catch {}
    }
    recorderRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else void start();
  }, [isRecording, start, stop]);

  useEffect(() => {
    return () => {
      try { recorderRef.current?.stop(); } catch {}
      cleanupStream();
    };
  }, [cleanupStream]);

  return { isRecording, isTranscribing, isSupported, start, stop, toggle };
}
