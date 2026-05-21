import * as React from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { useToast } from "@/hooks/use-toast";

const recentErrors = new Map<string, number>();
function shouldShowError(key: string, cooldownMs = 8000): boolean {
  const now = Date.now();
  const last = recentErrors.get(key) ?? 0;
  if (now - last < cooldownMs) return false;
  recentErrors.set(key, now);
  return true;
}

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
  { onTranscript, language, className, disabled, size = "md", title },
  ref,
) {
  const { toast } = useToast();
  const { isRecording, isTranscribing, isSupported, toggle } = useVoiceRecorder({
    language,
    onTranscript,
    onError: (err) => {
      if (!shouldShowError(err)) return;
      toast({
        title: "Voice typing",
        description: err,
        variant: "destructive",
      });
    },
  });

  if (!isSupported) return null;

  const dimensions = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const busy = isTranscribing;
  const active = isRecording;

  const tip =
    title ??
    (active
      ? "Stop and transcribe"
      : busy
      ? "Transcribing…"
      : "Voice typing");

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      disabled={disabled || busy}
      aria-label={tip}
      title={tip}
      data-testid="button-voice-dictate"
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        dimensions,
        active
          ? "border-red-500 bg-red-500 text-white shadow-md animate-pulse hover:bg-red-600"
          : busy
          ? "border-input bg-background text-muted-foreground"
          : "border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent",
        className,
      )}
    >
      {busy ? (
        <Loader2 className={cn(iconSize, "animate-spin")} />
      ) : active ? (
        <MicOff className={iconSize} />
      ) : (
        <Mic className={iconSize} />
      )}
    </button>
  );
});
