import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => any;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onFinalTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    language = "en-US",
    continuous = true,
    interimResults = true,
    onFinalTranscript,
    onInterimTranscript,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const isSupported = !!getRecognition();

  const finalCbRef = useRef(onFinalTranscript);
  const interimCbRef = useRef(onInterimTranscript);
  const errorCbRef = useRef(onError);
  useEffect(() => {
    finalCbRef.current = onFinalTranscript;
    interimCbRef.current = onInterimTranscript;
    errorCbRef.current = onError;
  });

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (r) {
      try {
        r.stop();
      } catch {}
    }
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognition();
    if (!Ctor) {
      errorCbRef.current?.("Speech recognition is not supported in this browser.");
      return;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    const recognition = new Ctor();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };
    recognition.onerror = (event: any) => {
      const err = event?.error || "unknown";
      // Silently ignore benign/transient errors that browsers fire frequently
      const benign = ["aborted", "no-speech", "audio-capture"];
      if (!benign.includes(err)) {
        errorCbRef.current?.(err);
      }
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      if (finalText) {
        finalCbRef.current?.(finalText);
        setInterimTranscript("");
      }
      if (interimText) {
        interimCbRef.current?.(interimText);
        setInterimTranscript(interimText);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e: any) {
      errorCbRef.current?.(e?.message || "Failed to start speech recognition");
      setIsListening(false);
    }
  }, [language, continuous, interimResults]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      const r = recognitionRef.current;
      if (r) {
        try {
          r.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, isSupported, start, stop, toggle, interimTranscript };
}
