import { useState } from "react";
import { Bell, Globe, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button
            id="sidebar-toggle"
            className="mr-2 md:hidden text-neutral-500"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-medium">{title}</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-neutral-500 hover:text-primary focus:outline-none"
            >
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>
          </div>

          {/* Language Toggle */}
          <div>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-500 hover:text-primary focus:outline-none"
              onClick={() => setIsLanguageModalOpen(!isLanguageModalOpen)}
            >
              <Globe size={20} />
            </Button>
          </div>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-500 hover:text-primary focus:outline-none"
              >
                {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <span className="mr-2 h-4 w-4">💻</span>
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Language Modal */}
      {isLanguageModalOpen && (
        <div className="absolute top-16 right-4 z-50 bg-white shadow-lg rounded-lg p-4 border border-neutral-200 w-48">
          <div className="space-y-2">
            <button className={cn("w-full text-left py-2 px-3 rounded-md", "bg-primary/10 text-primary")}>
              English
            </button>
            <button className="w-full text-left py-2 px-3 rounded-md hover:bg-neutral-100">
              العربية (Arabic)
            </button>
            <button className="w-full text-left py-2 px-3 rounded-md hover:bg-neutral-100">
              Español (Spanish)
            </button>
            <button className="w-full text-left py-2 px-3 rounded-md hover:bg-neutral-100">
              Français (French)
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
