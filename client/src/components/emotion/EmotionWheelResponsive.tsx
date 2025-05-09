import { useEffect, useState } from "react";
import { useMediaQuery } from "../../hooks/use-media-query";
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
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use a shimmer placeholder while determining mobile/desktop
  if (!mounted) {
    return (
      <div className="w-full aspect-square bg-gray-100 animate-pulse rounded-full" />
    );
  }
  
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