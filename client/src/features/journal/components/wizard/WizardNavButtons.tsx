import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, LucideIcon } from "lucide-react";

interface WizardNavButtonsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  nextDisabled?: boolean;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  introNextLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  submitIcon?: LucideIcon;
  extraActions?: React.ReactNode;
  nextButtonClassName?: string;
  submitButtonClassName?: string;
  footerClassName?: string;
}

export default function WizardNavButtons({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  nextDisabled = false,
  submitDisabled = false,
  isSubmitting = false,
  introNextLabel = "Get Started",
  nextLabel = "Next Step",
  submitLabel = "Submit",
  submitIcon: SubmitIcon = Check,
  extraActions,
  nextButtonClassName,
  submitButtonClassName,
  footerClassName,
}: WizardNavButtonsProps) {
  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      className={`flex flex-wrap ${currentStep === 0 ? "justify-center" : "justify-between"} items-center gap-3 pt-4 border-t border-slate-100 ${footerClassName ?? ""}`}
    >
      {currentStep > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isSubmitting}
          data-testid="button-previous-step"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
      )}

      <div className="flex flex-wrap gap-2 justify-end">
        {extraActions}

        {!isLast ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isSubmitting}
            data-testid="button-next-step"
            className={`${currentStep === 0 ? "h-11 px-6 text-base " : ""}${nextButtonClassName ?? ""}`}
          >
            {currentStep === 0 ? introNextLabel : nextLabel}
            <ChevronRight className={currentStep === 0 ? "h-5 w-5 ml-1.5" : "h-4 w-4 ml-1"} />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled || isSubmitting}
            data-testid="button-submit-wizard"
            className={submitButtonClassName}
          >
            <SubmitIcon className="h-4 w-4 mr-1" />
            {isSubmitting ? "Submitting…" : submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
