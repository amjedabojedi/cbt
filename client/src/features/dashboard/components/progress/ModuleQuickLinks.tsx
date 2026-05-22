import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, BookOpen, Target, Lightbulb, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  name: string;
  icon: typeof Heart;
  iconBg: string;
  iconColor: string;
  path: string;
  description: string;
}

const modules: Module[] = [
  {
    id: "emotions",
    name: "Emotion Tracking",
    icon: Heart,
    iconBg: "bg-indigo-50 group-hover:bg-indigo-100",
    iconColor: "text-indigo-600",
    path: "/emotions?tab=insights",
    description: "Patterns & trends",
  },
  {
    id: "thoughts",
    name: "Thought Records",
    icon: Brain,
    iconBg: "bg-purple-50 group-hover:bg-purple-100",
    iconColor: "text-purple-600",
    path: "/thoughts?tab=insights",
    description: "Distortion analysis",
  },
  {
    id: "journal",
    name: "Journal",
    icon: BookOpen,
    iconBg: "bg-violet-50 group-hover:bg-violet-100",
    iconColor: "text-violet-600",
    path: "/journal?tab=insights",
    description: "Mood & themes",
  },
  {
    id: "goals",
    name: "Smart Goals",
    icon: Target,
    iconBg: "bg-fuchsia-50 group-hover:bg-fuchsia-100",
    iconColor: "text-fuchsia-600",
    path: "/goals?tab=insights",
    description: "Progress tracking",
  },
  {
    id: "reframe",
    name: "Reframe Coach",
    icon: Lightbulb,
    iconBg: "bg-purple-100/40 group-hover:bg-purple-100/80",
    iconColor: "text-purple-700",
    path: "/reframe-coach?tab=insights",
    description: "Practice results",
  },
];

export default function ModuleQuickLinks() {
  return (
    <Card data-testid="module-quick-links" className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 pt-5 px-6">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
          <Sparkles className="h-4.5 w-4.5 text-purple-600 animate-pulse" />
          Module Insights
        </CardTitle>
        <CardDescription className="text-slate-400 font-semibold text-xs mt-0.5">
          View detailed analytics for each therapeutic module
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.id} href={module.path} data-testid={`link-${module.id}-insights`}>
                <div
                  className="cursor-pointer group p-4 rounded-xl border border-slate-100 hover:border-purple-200 bg-slate-50/20 hover:bg-slate-50/60 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-28"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-2 rounded-xl shrink-0 transition-colors duration-300", module.iconBg, module.iconColor)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 leading-tight group-hover:text-purple-700 transition-colors duration-300">
                      {module.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {module.description}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
