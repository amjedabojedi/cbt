import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon, X } from "lucide-react";
import { useLocalization } from "@/lib/localize.tsx";

interface WizardProgressHeaderProps {
  title: string;
  icon?: LucideIcon;
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  accentClassName?: string;
  hideProgressOnIntro?: boolean;
  onClose?: () => void;
  trailing?: React.ReactNode;
  testId?: string;
}

export default function WizardProgressHeader({
  title,
  icon: Icon,
  currentStep,
  totalSteps,
  stepLabels,
  accentClassName = "text-teal-700",
  hideProgressOnIntro = false,
  onClose,
  trailing,
  testId = "progress-wizard",
}: WizardProgressHeaderProps) {
  const { t, tNum } = useLocalization();
  const progress =
    currentStep === 0 ? 0 : (currentStep / (totalSteps - 1)) * 100;

  return (
    <CardHeader
      className={
        currentStep === 0
          ? "px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100 bg-slate-50/50"
          : "px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/50"
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <CardTitle
              className={`flex items-center gap-2.5 text-slate-800 ${
                currentStep === 0 ? "text-xl" : "text-lg"
              }`}
            >
              {Icon && (
                <Icon
                  className={`text-rose-500 shrink-0 ${currentStep === 0 ? "h-6 w-6" : "h-5 w-5"}`}
                />
              )}
              {title}
            </CardTitle>
            <CardDescription className={`text-slate-500 ${currentStep === 0 ? "text-base mt-0.5" : "text-sm"}`}>
              {currentStep === 0
                ? t("Quick intro — about 2 minutes")
                : `${t("Step")} ${tNum(currentStep)} ${t("of")} ${tNum(totalSteps - 1)}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {trailing}
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
        </div>

        {!(hideProgressOnIntro && currentStep === 0) && (
          <div className="space-y-2" data-testid={testId}>
            <Progress value={progress} className="h-2 [[&>div]:bg-purple-600>div]:bg-teal-600" />
            {/* Step labels — hidden on very small screens to prevent overflow with many steps */}
            <div className="hidden sm:flex justify-between text-xs text-slate-400">
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
            {/* Mobile: show current step name only */}
            <div className="flex sm:hidden text-xs text-slate-400 justify-center">
              {currentStep > 0 && currentStep <= stepLabels.length && (
                <span className={`${accentClassName} font-medium`}>
                  {stepLabels[currentStep - 1]}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </CardHeader>
  );
}
