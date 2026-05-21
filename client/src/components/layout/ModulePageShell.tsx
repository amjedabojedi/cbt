import AppLayout from "@/components/layout/AppLayout";
import ModuleHeader from "@/components/layout/ModuleHeader";
import { BackToClientsButton } from "@/features/dashboard/components/navigation/BackToClientsButton";
import { LucideIcon } from "lucide-react";

interface ProgressBadge {
  label: string;
  value: string | number;
  variant?: "default" | "secondary" | "destructive" | "outline";
  icon?: LucideIcon;
  color?: string;
}

interface ModulePageShellProps {
  title: string;
  description: string;
  badges?: ProgressBadge[];
  children: React.ReactNode;
}

export default function ModulePageShell({
  title,
  description,
  badges = [],
  children,
}: ModulePageShellProps) {
  return (
    <AppLayout title={title}>
      <div className="container mx-auto px-4 py-6">
        <BackToClientsButton />
        <ModuleHeader title={title} description={description} badges={badges} />
        {children}
      </div>
    </AppLayout>
  );
}
