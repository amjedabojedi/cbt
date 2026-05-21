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
}: WizardNavButtonsProps) {
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0 || isSubmitting}
        data-testid="button-previous-step"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <div className="flex flex-wrap gap-2 justify-end">
        {extraActions}

        {!isLast ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isSubmitting}
            data-testid="button-next-step"
          >
            {currentStep === 0 ? introNextLabel : nextLabel}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled || isSubmitting}
            data-testid="button-submit-wizard"
          >
            <SubmitIcon className="h-4 w-4 mr-1" />
            {isSubmitting ? "Submitting…" : submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
