import { useState } from "react";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useProgressInsights } from "@/hooks/use-progress-insights";
import CBTProgressSnapshot from "@/features/dashboard/components/progress/CBTProgressSnapshot";
import ModuleQuickLinks from "@/features/dashboard/components/progress/ModuleQuickLinks";
import ActivityTimeline from "@/features/dashboard/components/progress/ActivityTimeline";
import CBTTriangleConnections from "@/features/dashboard/components/progress/CBTTriangleConnections";
import ProgressIndicators from "@/features/dashboard/components/progress/ProgressIndicators";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type TimeRange = "week" | "month" | "all";

export default function Reports() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch all progress insights using the new hook
  const insights = useProgressInsights(user?.id, timeRange);
  return (
    <AppLayout title="My Progress">
      <div className="min-h-screen bg-slate-50 pb-12">
        {/* Premium Dark Luxury Hero Banner */}
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-[#090514] via-purple-950 to-indigo-950 px-6 sm:px-10 pt-8 pb-10 relative overflow-hidden transition-all duration-300 border-b border-purple-900/30">
          {/* Abstract glowing depth bubbles */}
          <div className="absolute -top-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-12 w-52 h-52 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-800/40 text-purple-200 text-xs font-semibold mb-3 w-fit">
                <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
                <span>Therapeutic Analytics</span>
              </div>
              <h1 className="font-extrabold text-white tracking-tight text-3xl md:text-4xl mb-2" data-testid="page-title">
                My Progress
              </h1>
              <p className="text-purple-300/80 text-sm sm:text-base max-w-xl leading-relaxed">
                Evidence-based CBT analytics and clinical insights tracking your personal growth and mental wellness journey.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 shrink-0">
              <Select 
                value={timeRange} 
                onValueChange={(value) => setTimeRange(value as TimeRange)}
                data-testid="select-timerange"
              >
                <SelectTrigger className="w-full sm:w-[170px] bg-white/10 hover:bg-white/15 border-purple-500/30 text-white rounded-xl backdrop-blur-md shadow-sm transition-all focus:ring-purple-500">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent className="bg-[#090514] border-purple-900 text-white rounded-xl shadow-xl">
                  <SelectItem value="week" className="focus:bg-purple-900/50 focus:text-white cursor-pointer">Past Week</SelectItem>
                  <SelectItem value="month" className="focus:bg-purple-900/50 focus:text-white cursor-pointer">Past Month</SelectItem>
                  <SelectItem value="all" className="focus:bg-purple-900/50 focus:text-white cursor-pointer">All Time</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                disabled={isExporting}
                onClick={() => {
                  setIsExporting(true);
                  try {
                    toast({
                      title: "Starting export...",
                      description: "Your PDF report is being generated."
                    });
                    
                    const url = `/api/export/pdf?type=all`;
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', '');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setTimeout(() => {
                      toast({
                        title: "Export complete",
                        description: "Your PDF report has been downloaded.",
                        variant: "default"
                      });
                      setIsExporting(false);
                    }, 2000);
                  } catch (error) {
                    console.error('Export error:', error);
                    toast({
                      title: "Export failed",
                      description: "There was a problem generating your PDF report. Please try again later.",
                      variant: "destructive"
                    });
                    setIsExporting(false);
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold px-4 py-2 rounded-xl shadow-md border-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                data-testid="button-export-report"
              >
                {isExporting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export Report</span>
                  </>
                )}
              </Button>
            </div>
            </div>

            {/* CBT Progress strip */}
            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">CBT Progress</span>
                </div>
                <span className="text-xs text-purple-400">{Math.min(100, Math.round((insights.totalActivities / 50) * 100))}% of first milestone</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.round((insights.totalActivities / 50) * 100))}%` }} />
              </div>
              <p className="text-[11px] text-purple-400/60 mt-1.5">{insights.totalActivities} activities logged across all CBT modules — your data-driven path to wellbeing.</p>
            </div>
          </div>
        </div>

        {/* Main Body Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
          {/* CBT Progress Snapshot - 4 Evidence-Based Metrics */}
          <CBTProgressSnapshot
            totalActivities={insights.totalActivities}
            emotionalBalance={insights.emotionalBalance}
            thoughtChallengeRate={insights.thoughtChallengeRate}
            goalProgress={insights.goalProgress}
            isLoading={insights.isLoading}
          />
          
          {/* Module Quick Links - Navigate to Detailed Insights */}
          <ModuleQuickLinks />
          
          {/* Two-Column Layout for Cross-Module Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Timeline */}
            <ActivityTimeline
              timeline={insights.timeline}
              isLoading={insights.isLoading}
            />
            
            {/* CBT Triangle Connections */}
            <CBTTriangleConnections
              topCognitiveDistortion={insights.topCognitiveDistortion}
              emotions={insights.rawData.emotions}
              thoughts={insights.rawData.thoughts}
              isLoading={insights.isLoading}
            />
          </div>
          
          {/* Progress Indicators - Full Width */}
          <ProgressIndicators
            emotionalBalance={insights.emotionalBalance}
            thoughtChallengeRate={insights.thoughtChallengeRate}
            totalActivities={insights.totalActivities}
            isLoading={insights.isLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
}
