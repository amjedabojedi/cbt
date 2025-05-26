import React, { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileBottomNav from "@/components/MobileBottomNav";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = "Dashboard" }: LayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}