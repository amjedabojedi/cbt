/**
 * EmotionWheelResponsive - Responsive emotion wheel component
 * 
 * This component dynamically renders either the desktop (EmotionWheel) or 
 * mobile (EmotionWheelMobile) version of the emotion wheel based on the
 * current viewport size. It provides a consistent interface for the
 * emotion wheel functionality regardless of the device.
 * 
 * Used in the emotion tracking forms and wherever an emotion selection
 * interface is required.
 */
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import EmotionWheel from "./EmotionWheel";
import EmotionWheelMobile from "./EmotionWheelMobile";

interface EmotionWheelResponsiveProps {
  language?: string;
  direction?: "ltr" | "rtl";
  onEmotionSelect?: (selection: {
    coreEmotion: string;
    primaryEmotion: string;
    tertiaryEmotion: string;
  }) => void;
}

export default function EmotionWheelResponsive({
  language = "en",
  direction = "ltr",
  onEmotionSelect,
}: EmotionWheelResponsiveProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mounted, setMounted] = useState(false);
  
  // Client-side only code for responsive behavior
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Show a shimmer placeholder during SSR and client hydration
  if (!mounted) {
    return (
      <div className="w-full aspect-square bg-gray-100 animate-pulse rounded-full" />
    );
  }
  
  // Render the appropriate wheel component based on device size
  return isMobile ? (
    <EmotionWheelMobile
      language={language}
      direction={direction}
      onEmotionSelect={onEmotionSelect}
    />
  ) : (
    <EmotionWheel
      language={language}
      direction={direction}
      onEmotionSelect={onEmotionSelect}
    />
  );
}