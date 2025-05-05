import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/lib/auth";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  
  // Don't render layout if user is not authenticated
  if (!user) return <>{children}</>;
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />
      <Header />
      <main className="pt-16 md:ml-64">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}