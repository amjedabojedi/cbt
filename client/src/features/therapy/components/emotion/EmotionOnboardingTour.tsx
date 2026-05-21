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

interface EmotionOnboardingTourProps {
  onComplete: () => void;
}

const TOUR_SLIDES = [
  {
    title: "Welcome to Emotion Tracking",
    description: "Let's learn how to track your emotions in 30 seconds",
    icon: Heart,
    content: (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            Tracking emotions helps you understand patterns in your mental health. 
            Research shows that people who can identify specific emotions are better 
            at managing stress and react less impulsively to difficult situations.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Heart className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">What you'll learn:</h4>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• How to use the emotion wheel</li>
              <li>• Why intensity matters</li>
              <li>• How to describe situations</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "The Emotion Wheel",
    description: "Your tool for identifying emotions with precision",
    icon: Gauge,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Three Levels of Emotions:</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="bg-red-500 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Core Emotions (Inner Ring)</p>
                <p className="text-xs text-gray-600">Basic feelings: Joy, Sadness, Anger, Fear, Love, Surprise</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-orange-500 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Primary Emotions (Middle Ring)</p>
                <p className="text-xs text-gray-600">More specific: Suffering, Disappointment, Frustration</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-yellow-500 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Tertiary Emotions (Outer Ring)</p>
                <p className="text-xs text-gray-600">Most precise: Vulnerable, Anxious, Overwhelmed</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-800">
            <strong>Pro Tip:</strong> Click deeper into the wheel for more specific emotions. 
            The more specific you are, the better you understand yourself!
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Ready to Start Tracking!",
    description: "Here's what happens next",
    icon: FileText,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-3">Follow these simple steps:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <p className="text-sm text-gray-700">Select your emotion from the wheel</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <p className="text-sm text-gray-700">Rate how intensely you felt it (1-10)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <p className="text-sm text-gray-700">Describe what happened (the situation)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <p className="text-sm text-gray-700">Add optional details (where, when, who)</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-900 font-medium">
            🎯 Track at least 3 emotions to start seeing patterns and insights!
          </p>
        </div>
      </div>
    ),
  },
];

export default function EmotionOnboardingTour({ onComplete }: EmotionOnboardingTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem("emotion_tracking_tour_completed");
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-2xl w-[95vw]" data-testid="dialog-onboarding-tour">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Icon className="h-6 w-6 text-blue-600" />
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
              <span>Step {currentSlide + 1} of {TOUR_SLIDES.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between w-full gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              size="sm"
              data-testid="button-skip-tour-footer"
            >
              Skip Tour
            </Button>

            <div className="flex gap-2">
              {currentSlide > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  size="sm"
                  data-testid="button-previous-slide"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              <Button
                onClick={handleNext}
                size="sm"
                data-testid="button-next-slide"
              >
                {currentSlide === TOUR_SLIDES.length - 1 ? "Start Tracking" : "Next"}
                {currentSlide < TOUR_SLIDES.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
