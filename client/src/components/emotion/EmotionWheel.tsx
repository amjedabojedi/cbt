// This file is now a wrapper around the fixed implementation
import EmotionWheelFixed from "./EmotionWheelFixed";

interface EmotionWheelProps {
  language?: string;
  direction?: "ltr" | "rtl";
  onEmotionSelect?: (selection: {
    coreEmotion: string;
    primaryEmotion: string;
    tertiaryEmotion: string;
  }) => void;
}

export default function EmotionWheel(props: EmotionWheelProps) {
  // Just pass through to the fixed implementation
  return <EmotionWheelFixed {...props} />;
}