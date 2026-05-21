import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, LucideIcon } from "lucide-react";

interface WizardSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconBgClass?: string;
  iconColorClass?: string;
  children?: React.ReactNode;
  testId?: string;
}

export default function WizardSuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon = Check,
  iconBgClass = "bg-green-100",
  iconColorClass = "text-green-600",
  children,
  testId = "dialog-success",
}: WizardSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto"
        data-testid={testId}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <div className={`${iconBgClass} p-2 rounded-full mr-3`}>
              <Icon className={`h-6 w-6 ${iconColorClass}`} />
            </div>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-base mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && <div className="space-y-6 py-4">{children}</div>}
      </DialogContent>
    </Dialog>
  );
}
