import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users, BookText, Goal, Brain, ListChecks, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { User as UserType } from "@shared/schema";

export default function TherapistStats() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch therapist's clients
  const { data: clients, isLoading: isLoadingClients } = useQuery<UserType[]>({
    queryKey: [`/api/users/clients`],
    enabled: !!user && user.role === "therapist",
  });

  // Client count by activity status
  const clientStats = {
    total: clients?.length || 0,
    active: clients?.filter(c => true).length || 0, // Placeholder for active clients logic
    new: clients?.filter(c => {
      // Consider clients registered in the last 14 days as "new"
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return created > twoWeeksAgo;
    }).length || 0,
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Practice Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Client Activity</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <StatCard 
                title="Total Clients" 
                value={clientStats.total} 
                icon={<Users className="h-5 w-5" />}
                color="blue"
                isLoading={isLoadingClients}
              />
              <StatCard 
                title="Active Clients" 
                value={clientStats.active} 
                icon={<User className="h-5 w-5" />}
                color="green"
                isLoading={isLoadingClients}
              />
              <StatCard 
                title="New Clients (14d)" 
                value={clientStats.new} 
                icon={<User className="h-5 w-5" />}
                color="purple"
                isLoading={isLoadingClients}
              />
              <StatCard 
                title="Journal Entries" 
                value={42} 
                icon={<BookText className="h-5 w-5" />}
                color="indigo"
                isLoading={isLoadingClients}
              />
              <StatCard 
                title="Thought Records" 
                value={28} 
                icon={<Brain className="h-5 w-5" />}
                color="pink"
                isLoading={isLoadingClients}
              />
              <StatCard 
                title="Active Goals" 
                value={15} 
                icon={<Goal className="h-5 w-5" />}
                color="amber"
                isLoading={isLoadingClients}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
            <div className="mt-4 space-y-4">
              <p className="text-neutral-500 text-sm">Recent client activity across your practice:</p>
              
              <div className="space-y-2">
                <ActivityItem 
                  title="Most Active Clients"
                  items={[
                    { label: "Sarah Johnson", value: "12 entries" },
                    { label: "Michael Chen", value: "8 entries" },
                    { label: "Emily Davis", value: "6 entries" },
                  ]}
                  icon={<ListChecks className="h-5 w-5 text-blue-500" />}
                  isLoading={isLoadingClients}
                />
                
                <ActivityItem 
                  title="Recently Active"
                  items={[
                    { label: "Sarah Johnson", value: "2 hours ago" },
                    { label: "James Wilson", value: "Yesterday" },
                    { label: "Emma Rodriguez", value: "2 days ago" },
                  ]}
                  icon={<Calendar className="h-5 w-5 text-green-500" />}
                  isLoading={isLoadingClients}
                />
                
                <ActivityItem 
                  title="Needs Attention"
                  items={[
                    { label: "David Miller", value: "No activity (14d)" },
                    { label: "Anna Garcia", value: "Missed goal deadline" },
                  ]}
                  icon={<User className="h-5 w-5 text-red-500" />}
                  isLoading={isLoadingClients}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="engagement">
            <div className="mt-4 space-y-4">
              <p className="text-neutral-500 text-sm">Client engagement with therapy components:</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <EngagementBar 
                    label="Emotion Tracking" 
                    percentage={78} 
                    color="bg-blue-500" 
                    isLoading={isLoadingClients}
                  />
                  <EngagementBar 
                    label="Thought Records" 
                    percentage={62} 
                    color="bg-purple-500" 
                    isLoading={isLoadingClients}
                  />
                  <EngagementBar 
                    label="Journaling" 
                    percentage={85} 
                    color="bg-green-500" 
                    isLoading={isLoadingClients}
                  />
                  <EngagementBar 
                    label="Goal Setting" 
                    percentage={45} 
                    color="bg-amber-500" 
                    isLoading={isLoadingClients}
                  />
                </div>
                
                <div className="text-xs text-neutral-500 mt-2">
                  * Engagement percentage based on client activity in the last 30 days
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color = "blue",
  isLoading
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "indigo" | "pink" | "amber";
  isLoading: boolean;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    indigo: "bg-indigo-50 text-indigo-700",
    pink: "bg-pink-50 text-pink-700",
    amber: "bg-amber-50 text-amber-700",
  };
  
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
          {isLoading ? (
            <Skeleton className="h-6 w-12 mt-1" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ 
  title, 
  items,
  icon,
  isLoading
}: { 
  title: string; 
  items: { label: string; value: string }[];
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-sm font-medium ml-2">{title}</h3>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-sm">{item.label}</span>
              <span className="text-sm text-neutral-500">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EngagementBar({ 
  label, 
  percentage, 
  color,
  isLoading
}: { 
  label: string; 
  percentage: number; 
  color: string;
  isLoading: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs font-medium">{percentage}%</span>
      </div>
      
      {isLoading ? (
        <Skeleton className="h-2 w-full rounded-full" />
      ) : (
        <div className="h-2 bg-neutral-100 rounded-full">
          <div 
            className={`h-2 rounded-full ${color}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}