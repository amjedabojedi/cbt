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

    const recognition = new SpeechRecognitionClass();
    recognition.lang = language || navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as SpeechRecognitionResultList)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) onTranscriptRef.current?.(transcript);
    };

    recognition.onerror = (event: any) => {
      const code: string = event.error ?? "";
      let msg = "Voice recognition failed. Please try again.";
      if (code === "not-allowed" || code === "service-not-allowed")
        msg = "Microphone access was denied.";
      else if (code === "no-speech")
        msg = "No speech detected. Please try again.";
      else if (code === "network")
        msg = "Network error during voice recognition.";
      else if (code === "audio-capture")
        msg = "No microphone found on this device.";
      onErrorRef.current?.(msg);
      setIsRecording(false);
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsTranscribing(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      onErrorRef.current?.("Could not start voice recognition.");
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
