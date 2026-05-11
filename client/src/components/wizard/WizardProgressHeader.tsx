import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon, X } from "lucide-react";

interface WizardProgressHeaderProps {
  title: string;
  icon?: LucideIcon;
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  accentClassName?: string;
  hideProgressOnIntro?: boolean;
  onClose?: () => void;
  testId?: string;
}

export default function WizardProgressHeader({
  title,
  icon: Icon,
  currentStep,
  totalSteps,
  stepLabels,
  accentClassName = "text-blue-600",
  hideProgressOnIntro = false,
  onClose,
  testId = "progress-wizard",
}: WizardProgressHeaderProps) {
  const progress =
    currentStep === 0 ? 0 : (currentStep / (totalSteps - 1)) * 100;

  return (
    <CardHeader>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-primary" />}
              {title}
            </CardTitle>
            <CardDescription>
              {currentStep === 0
                ? "Introduction"
                : `Step ${currentStep} of ${totalSteps - 1}`}
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-wizard"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!(hideProgressOnIntro && currentStep === 0) && (
          <div className="space-y-2" data-testid={testId}>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              {stepLabels.map((label, idx) => {
                const stepIndex = idx + 1;
                return (
                  <span
                    key={label}
                    className={
                      currentStep >= stepIndex
                        ? `${accentClassName} font-medium`
                        : ""
                    }
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </CardHeader>
  );
}
