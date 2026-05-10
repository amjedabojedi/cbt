import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useToast } from "@/hooks/use-toast";

export interface VoiceDictateButtonProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  title?: string;
}

export const VoiceDictateButton = React.forwardRef<
  HTMLButtonElement,
  VoiceDictateButtonProps
>(function VoiceDictateButton(
  { onTranscript, language = "en-US", className, disabled, size = "md", title },
  ref,
) {
  const { toast } = useToast();
  const { isListening, isSupported, toggle } = useSpeechRecognition({
    language,
    onFinalTranscript: (text) => onTranscript(text),
    onError: (err) => {
      if (err === "not-allowed" || err === "service-not-allowed") {
        toast({
          title: "Microphone blocked",
          description: "Allow microphone access in your browser to use voice typing.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Voice typing error",
          description: err,
          variant: "destructive",
        });
      }
    },
  });

  if (!isSupported) return null;

  const dimensions = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={isListening ? "Stop voice typing" : "Start voice typing"}
      title={title ?? (isListening ? "Stop voice typing" : "Voice typing")}
      data-testid="button-voice-dictate"
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        dimensions,
        isListening
          ? "border-red-500 bg-red-500 text-white shadow-md animate-pulse hover:bg-red-600"
          : "border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent",
        className,
      )}
    >
      {isListening ? <MicOff className={iconSize} /> : <Mic className={iconSize} />}
    </button>
  );
});
