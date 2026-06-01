import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseVoiceRecorderOptions {
  language?: string;
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { language, onTranscript, onError } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef<string[]>([]);

  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  });

  const SpeechRecognitionClass = useMemo(
    () =>
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null,
    [],
  );

  const isSupported = !!SpeechRecognitionClass;

  const start = useCallback(() => {
    if (!SpeechRecognitionClass || isRecording) return;

    accumulatedRef.current = [];

    const recognition = new SpeechRecognitionClass();
    recognition.lang = language || navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const segment = event.results[i][0].transcript.trim();
          if (segment) accumulatedRef.current.push(segment);
        }
      }
    };

    recognition.onerror = (event: any) => {
      const code: string = event.error ?? "";
      if (code === "no-speech") return;
      let msg = "Voice recognition failed. Please try again.";
      if (code === "not-allowed" || code === "service-not-allowed")
        msg = "Microphone access was denied. Please allow microphone in your browser settings.";
      else if (code === "audio-capture")
        msg = "No microphone found on this device.";
      else if (code === "network")
        msg = "Network error. Please check your connection and try again.";
      onErrorRef.current?.(msg);
      setIsRecording(false);
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsTranscribing(false);
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
  }, [SpeechRecognitionClass, isRecording, language]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    recognitionRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  return { isRecording, isTranscribing, isSupported, start, stop, toggle };
}
