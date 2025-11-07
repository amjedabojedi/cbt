import { useState } from "react";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useProgressInsights } from "@/hooks/use-progress-insights";
import CBTProgressSnapshot from "@/components/progress/CBTProgressSnapshot";
import ModuleQuickLinks from "@/components/progress/ModuleQuickLinks";
import ActivityTimeline from "@/components/progress/ActivityTimeline";
import CBTTriangleConnections from "@/components/progress/CBTTriangleConnections";
import ProgressIndicators from "@/components/progress/ProgressIndicators";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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
      <div className="container mx-auto px-4 py-6">
        {/* Header with time range selector and export */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800" data-testid="page-title">My Progress</h1>
            <p className="text-neutral-500">
              Evidence-based insights into your therapeutic journey
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Select 
              value={timeRange} 
              onValueChange={(value) => setTimeRange(value as TimeRange)}
              data-testid="select-timerange"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline"
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
              data-testid="button-export-report"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* CBT Progress Snapshot - 4 Evidence-Based Metrics */}
        <CBTProgressSnapshot
          totalActivities={insights.totalActivities}
          emotionalBalance={insights.emotionalBalance}
          thoughtChallengeRate={insights.thoughtChallengeRate}
          goalProgress={insights.goalProgress}
          isLoading={insights.isLoading}
        />
        
        {/* Module Quick Links - Navigate to Detailed Insights */}
        <div className="mb-6">
          <ModuleQuickLinks />
        </div>
        
        {/* Two-Column Layout for Cross-Module Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
    </AppLayout>
  );
}
