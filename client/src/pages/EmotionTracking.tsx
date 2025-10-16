import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import ModuleHeader from "@/components/layout/ModuleHeader";
import EmotionTrackingFormWizard from "@/components/emotion/EmotionTrackingFormWizard";
import EmotionHistory from "@/components/dashboard/EmotionHistory";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Globe, ClipboardList, Heart, Activity, BarChart3, HelpCircle } from "lucide-react";
import useActiveUser from "@/hooks/use-active-user";
import { ClientDebug } from "@/components/debug/ClientDebug";
import { BackToClientsButton } from "@/components/navigation/BackToClientsButton";

export default function EmotionTracking() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [showLanguageNotice, setShowLanguageNotice] = useState(false);
  
  // Check URL parameters for tab and emotion ID
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const emotionId = urlParams.get('id');
  
  // Fetch emotions for stats
  const { data: emotions = [] } = useQuery<any[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId,
  });
  
  // Calculate progress stats
  const totalEmotions = emotions.length;
  const avgIntensity = emotions.length > 0 
    ? (emotions.reduce((sum: number, e: any) => sum + (e.intensity || 0), 0) / emotions.length).toFixed(1)
    : "0";
  
  const emotionCounts = emotions.reduce((acc: Record<string, number>, e: any) => {
    acc[e.emotion] = (acc[e.emotion] || 0) + 1;
    return acc;
  }, {});
  
  const mostCommonEmotion = Object.entries(emotionCounts).length > 0
    ? Object.entries(emotionCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]
    : "None";
  
  // Handle language toggle
  const handleLanguageToggle = () => {
    const newLanguage = language === "en" ? "ar" : "en";
    const newDirection = newLanguage === "ar" ? "rtl" : "ltr";
    
    setLanguage(newLanguage);
    setDirection(newDirection);
    setShowLanguageNotice(newLanguage === "ar");
    
    // Hide notice after 3 seconds
    if (newLanguage === "ar") {
      setTimeout(() => setShowLanguageNotice(false), 3000);
    }
  };
  
  return (
    <AppLayout title="Emotion Tracking">
      <div className="container mx-auto px-4 py-6">
        {/* Back to Clients button */}
        <BackToClientsButton />
        
        {/* Debug Information (Development Only) */}
        <ClientDebug />
        
        {/* Module Header with Progress */}
        <ModuleHeader
          title="Emotion Tracking"
          description="Identify, track, and understand your emotional patterns using an interactive emotion wheel"
          badges={[
            { label: "Total Tracked", value: totalEmotions, icon: Heart, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
            { label: "Avg Intensity", value: `${avgIntensity}/10`, icon: Activity, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
            { label: "Most Common", value: mostCommonEmotion, icon: BarChart3, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
          ]}
        />
        
        <Tabs 
          defaultValue={
            tabParam === 'history' 
              ? "history" 
              : (isViewingClientData || user?.role === 'therapist') 
                ? "history" 
                : "record"
          } 
          className="space-y-4"
        >
          <TabsList>
            {/* Only show recording tab for clients viewing their own data, and not for therapists */}
            {!isViewingClientData && user?.role !== 'therapist' && (
              <TabsTrigger value="record">Record Emotion</TabsTrigger>
            )}
            <TabsTrigger value="history">
              {isViewingClientData ? "Client's Emotion History" : "My Emotion History"}
            </TabsTrigger>
          </TabsList>
          
          {/* Only show recording functionality for clients viewing their own data
              AND not for therapists (even when viewing their own profile) */}
          {!isViewingClientData && user?.role !== 'therapist' && (
            <TabsContent value="record">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Record Your Emotion</CardTitle>
                    <CardDescription>
                      Use the emotion wheel to identify and track how you're feeling
                    </CardDescription>
                  </div>
                  <button
                    onClick={handleLanguageToggle}
                    className="flex items-center space-x-1 text-neutral-500 hover:text-primary p-1 rounded-md transition-colors"
                  >
                    <Globe size={16} />
                    <span className="text-xs font-medium">{language === "en" ? "English" : "العربية"}</span>
                  </button>
                </CardHeader>
                
                <CardContent>
                  {/* Educational Accordion */}
                  <Accordion type="single" collapsible className="mb-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-4">
                    <AccordionItem value="why-track" className="border-0">
                      <AccordionTrigger className="text-base font-medium hover:no-underline py-3">
                        <div className="flex items-center">
                          <HelpCircle className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                          Why Track Emotions?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        <p className="mb-3">
                          Emotion tracking is a foundational skill in Cognitive Behavioral Therapy (CBT). By becoming aware of your emotions, you can better understand the connection between your thoughts, feelings, and behaviors.
                        </p>
                        
                        <div className="space-y-3">
                          <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                            <h4 className="font-medium text-foreground mb-1">Identify Patterns</h4>
                            <p>Notice which emotions occur most frequently and in what situations. This awareness is the first step to managing them effectively.</p>
                          </div>
                          
                          <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                            <h4 className="font-medium text-foreground mb-1">Measure Intensity</h4>
                            <p>Rating your emotional intensity helps you track progress over time and recognize when certain emotions become overwhelming.</p>
                          </div>
                          
                          <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                            <h4 className="font-medium text-foreground mb-1">Build Emotional Intelligence</h4>
                            <p>The more you practice identifying emotions, the better you become at recognizing them in the moment, giving you more control over your responses.</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  {/* Language Toggle Notice */}
                  {showLanguageNotice && (
                    <div className="mb-4 p-3 bg-primary-light text-primary-dark rounded-md text-sm">
                      {language === "ar" ? "تم التبديل إلى العربية. ستتم معالجة كل تفاعلات العجلة بالاتجاه من اليمين إلى اليسار." : "Switched to English. All wheel interactions will now use LTR direction."}
                    </div>
                  )}
                  
                  <EmotionTrackingFormWizard language={language} direction={direction} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="history">
            {isViewingClientData ? (
              <Card>
                <CardHeader>
                  <CardTitle>Client's Emotion History</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} />
                      View emotion tracking records for this client
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmotionHistory />
                </CardContent>
              </Card>
            ) : (
              <EmotionHistory />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
