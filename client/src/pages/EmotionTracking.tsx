import { useState } from "react";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import EmotionTrackingForm from "@/components/emotion/EmotionTrackingForm";
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
import { Globe, ClipboardList } from "lucide-react";
import useActiveUser from "@/hooks/use-active-user";
import { ClientDebug } from "@/components/debug/ClientDebug";
import { BackToClientsButton } from "@/components/navigation/BackToClientsButton";

export default function EmotionTracking() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [showLanguageNotice, setShowLanguageNotice] = useState(false);
  
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
        
        <Tabs defaultValue={(isViewingClientData || user?.role === 'therapist') ? "history" : "record"} className="space-y-4">
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
                  {/* Language Toggle Notice */}
                  {showLanguageNotice && (
                    <div className="mb-4 p-3 bg-primary-light text-primary-dark rounded-md text-sm">
                      {language === "ar" ? "تم التبديل إلى العربية. ستتم معالجة كل تفاعلات العجلة بالاتجاه من اليمين إلى اليسار." : "Switched to English. All wheel interactions will now use LTR direction."}
                    </div>
                  )}
                  
                  <EmotionTrackingForm language={language} direction={direction} />
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
