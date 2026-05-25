import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, Heart, Gauge, FileText } from "lucide-react";
import { useLocalization } from "@/lib/localize.tsx";

interface EmotionOnboardingTourProps {
  onComplete: () => void;
}

export default function EmotionOnboardingTour({ onComplete }: EmotionOnboardingTourProps) {
  const { t, isRTL, tNum } = useLocalization();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem("emotion_tracking_tour_completed");
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

  const TOUR_SLIDES = [
    {
      title: t("Welcome to Emotion Tracking"),
      description: t("Let's learn how to track your emotions in 30 seconds"),
      icon: Heart,
      content: (
        <div className="space-y-4">
          <div className="bg-teal-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              {t("Tracking emotions helps you understand patterns in your mental health. Research shows that people who can identify specific emotions are better at managing stress and react less impulsively to difficult situations.")}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-teal-100 p-2 rounded-full">
              <Heart className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{t("What you'll learn:")}</h4>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li>• {t("How to use the emotion wheel")}</li>
                <li>• {t("Why intensity matters")}</li>
                <li>• {t("How to describe situations")}</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t("The Emotion Wheel"),
      description: t("Your tool for identifying emotions with precision"),
      icon: Gauge,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">{t("Three Levels of Emotions:")}</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="bg-red-500 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                  {tNum(1)}
                </div>
                <div>
                  <p className="font-medium text-sm">{t("Core Emotions (Inner Ring)")}</p>
                  <p className="text-xs text-gray-600">{t("Basic feelings: Joy, Sadness, Anger, Fear, Love, Surprise")}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-orange-500 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                  {tNum(2)}
                </div>
                <div>
                  <p className="font-medium text-sm">{t("Primary Emotions (Middle Ring)")}</p>
                  <p className="text-xs text-gray-600">{t("More specific: Suffering, Disappointment, Frustration")}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-yellow-500 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                  {tNum(3)}
                </div>
                <div>
                  <p className="font-medium text-sm">{t("Tertiary Emotions (Outer Ring)")}</p>
                  <p className="text-xs text-gray-600">{t("Most precise: Vulnerable, Anxious, Overwhelmed")}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-800">
              <strong>{t("Pro Tip:")}</strong> {t("Click deeper into the wheel for more specific emotions. The more specific you are, the better you understand yourself!")}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: t("Ready to Start Tracking!"),
      description: t("Here's what happens next"),
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-3">{t("Follow these simple steps:")}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-teal-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {tNum(1)}
                </div>
                <p className="text-sm text-gray-700">{t("Select your emotion from the wheel")}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-teal-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {tNum(2)}
                </div>
                <p className="text-sm text-gray-700">{t("Rate how intensely you felt it (1-10)")}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-teal-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {tNum(3)}
                </div>
                <p className="text-sm text-gray-700">{t("Describe what happened (the situation)")}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-teal-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {tNum(4)}
                </div>
                <p className="text-sm text-gray-700">{t("Add optional details (where, when, who)")}</p>
              </div>
            </div>
          </div>
          <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
            <p className="text-sm text-teal-700 font-medium">
              🎯 {t("Track at least 3 emotions to start seeing patterns and insights!")}
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSlide < TOUR_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("emotion_tracking_tour_completed", "true");
    setIsOpen(false);
    onComplete();
  };

  const currentSlideData = TOUR_SLIDES[currentSlide];
  const Icon = currentSlideData.icon;
  const progress = ((currentSlide + 1) / TOUR_SLIDES.length) * 100;

  // Mirror icons for RTL
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-2xl w-[95vw]" data-testid="dialog-onboarding-tour">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-full">
                <Icon className="h-6 w-6 text-teal-700" />
              </div>
              <div>
                <DialogTitle className="text-xl">{currentSlideData.title}</DialogTitle>
                <DialogDescription className="text-sm">
                  {currentSlideData.description}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
              data-testid="button-skip-tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-6">
          {currentSlideData.content}
        </div>

        <DialogFooter className="flex flex-col gap-4 sm:gap-0">
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t("Step")} {tNum(currentSlide + 1)} {t("of")} {tNum(TOUR_SLIDES.length)}</span>
              <span>{tNum(Math.round(progress))}٪ {t("complete")}</span>
            </div>
            <Progress value={progress} className="h-2 [&>div]:bg-teal-600" />
          </div>

          <div className="flex items-center justify-between w-full gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              size="sm"
              data-testid="button-skip-tour-footer"
            >
              {t("Skip Tour")}
            </Button>

            <div className="flex gap-2">
              {currentSlide > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  size="sm"
                  data-testid="button-previous-slide"
                >
                  <PrevIcon className="h-4 w-4 mr-1" />
                  {t("Previous")}
                </Button>
              )}
              <Button
                onClick={handleNext}
                size="sm"
                data-testid="button-next-slide"
              >
                {currentSlide === TOUR_SLIDES.length - 1 ? t("Start Tracking") : t("Next")}
                {currentSlide < TOUR_SLIDES.length - 1 && (
                  <NextIcon className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
