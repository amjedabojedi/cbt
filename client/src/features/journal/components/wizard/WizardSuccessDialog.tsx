import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalization } from "@/lib/localize.tsx";

interface WizardSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  testId?: string;
}

export default function WizardSuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  testId = "dialog-success",
}: WizardSuccessDialogProps) {
  const { isRTL } = useLocalization();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0"
        data-testid={testId}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 px-6 py-6 relative overflow-hidden rounded-t-lg">
          <div className="absolute -top-8 end-8 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <DialogTitle className="text-white text-xl font-bold leading-tight">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-teal-100/80 text-sm mt-1 leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>

        {/* Body */}
        {children && (
          <div className="px-6 py-6 space-y-5">
            {children}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
