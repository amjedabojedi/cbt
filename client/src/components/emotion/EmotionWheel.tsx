/**
 * EmotionWheel - Desktop implementation of the emotion wheel component
 * 
 * This component is a wrapper around EmotionWheelFixed that maintains
 * a consistent interface for the emotion wheel functionality.
 * 
 * EmotionWheelResponsive uses this component for desktop view and 
 * EmotionWheelMobile for mobile views.
 */
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